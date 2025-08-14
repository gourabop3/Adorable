import { getApp } from "@/actions/get-app";
import { freestyle } from "@/lib/freestyle";
import { getAppIdFromHeaders } from "@/lib/utils";
import { UIMessage } from "ai";

// "fix" mastra mcp bug
import { EventEmitter } from "events";
import { setStream, stopStream } from "@/lib/streams";
EventEmitter.defaultMaxListeners = 1000;

import { NextRequest } from "next/server";
import { redisPublisher } from "@/lib/redis";
import { AIService } from "@/lib/internal/ai-service";
import { createBuilderAgentWithModel } from "@/mastra/agents/builder";

export async function POST(req: NextRequest) {
  console.log("creating new chat stream");
  const appId = getAppIdFromHeaders(req);

  if (!appId) {
    return new Response("Missing App Id header", { status: 400 });
  }

  const app = await getApp(appId);
  if (!app) {
    return new Response("App not found", { status: 404 });
  }

        // Check user authentication and credits
      try {
        const { getUser } = await import("@/auth/stack-auth");
        const user = await getUser();
        
        if (user && user.userId) {
          // Check if user has enough credits for chat usage
          const { db } = await import("@/db/schema");
          const { users } = await import("@/db/schema");
          const { eq } = await import("drizzle-orm");
          
          let dbUser;
          try {
            const userResult = await db.select().from(users).where(eq(users.id, user.userId)).limit(1);
            dbUser = userResult[0];
          } catch (dbError) {
            console.error("Database query error:", dbError);
            dbUser = null;
          }
          
          if (dbUser && dbUser.credits < 1) {
            return new Response("Insufficient credits. Please purchase more credits to continue.", { status: 402 });
          }
        }
      } catch (error) {
        console.error("Error checking user credits:", error);
        // Continue without credit check if there's an error
      }

  // Request de-duplication (short TTL)
  const requestId = req.headers.get("x-request-id") || crypto.randomUUID();
  const cacheKey = `request:${appId}:${requestId}`;
  const existingRequest = await redisPublisher.get(cacheKey);
  if (existingRequest === "processing") {
    return new Response("Request already being processed", { status: 409 });
  }
  await redisPublisher.set(cacheKey, "processing", { EX: 10 });

  const streamState = await redisPublisher.get("app:" + appId + ":stream-state");
  if (streamState === "running") {
    console.log("Stopping previous stream for appId:", appId);
    stopStream(appId);
    // Proceed without waiting; cleanup happens in onFinish/onError
  }

  const { messages }: { messages: UIMessage[] } = await req.json();

  const { mcpEphemeralUrl, fs } = await freestyle.requestDevServer({
    repoId: app.info.gitRepo,
  });

  // Get the selected model from the request headers or default to gemini-2.5-pro
  const selectedModel = req.headers.get("x-selected-model") || "gemini-2.5-pro";
  
  try {
    console.log(`🚀 Starting AI stream for app ${appId} with model ${selectedModel}`);
    
    const resumableStream = await sendMessage(
      appId,
      mcpEphemeralUrl,
      fs,
      messages.at(-1)!,
      selectedModel,
      cacheKey
    );

    console.log(`✅ Stream created successfully for app ${appId}`);
    return resumableStream.response();
    
  } catch (error) {
    console.error(`❌ Failed to create stream for app ${appId}:`, error);
    
    // Clean up on error
    await redisPublisher.del(`app:${appId}:stream-state`);
    if (cacheKey) {
      await redisPublisher.del(cacheKey);
    }
    
    return new Response(
      JSON.stringify({ 
        error: "Failed to create AI stream", 
        details: error instanceof Error ? error.message : "Unknown error" 
      }), 
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}

export async function sendMessage(
  appId: string,
  mcpUrl: string,
  fs: any,
  message: UIMessage,
  modelId?: string,
  cacheKey?: string
) {
  // Use selected model or default to gemini-2.5-pro
  const agentToUse = modelId ? createBuilderAgentWithModel(modelId) : createBuilderAgentWithModel("gemini-2.5-pro");
  
  console.log(`🤖 Using agent with model: ${modelId || 'gemini-2.5-pro'}`);
  
  // Create an AbortController with a timeout to prevent infinite hanging
  const abortController = new AbortController();
  const timeoutId = setTimeout(() => {
    console.log(`⏰ Timeout reached for app ${appId}, aborting stream`);
    abortController.abort();
  }, 60000); // 60 second timeout
  
  try {
    const response = await AIService.sendMessage(
      agentToUse,
      appId,
      mcpUrl,
      fs,
      message,
      {
        threadId: appId,
        resourceId: appId,
        maxSteps: 50, // Reduced to prevent infinite loops
        maxRetries: 2, // Reduced retries
        maxOutputTokens: 8000, // Reduced to prevent timeouts
        async onChunk() {
          console.log(`📡 Stream chunk received for app ${appId}`);
          // Keep-alive logic is handled by AIService
        },
        async onStepFinish(step) {
          console.log(`✅ Step finished for app ${appId}, messages: ${step.response.messages?.length || 0}`);
          // Step finish logic is handled by AIService
        },
              abortSignal: abortController.signal,
        onError: async (error) => {
          console.error("❌ Stream error:", error);
          
          // Clear timeout on error
          clearTimeout(timeoutId);
          
          try {
            await redisPublisher.del(`app:${appId}:stream-state`);
            if (cacheKey) {
              await redisPublisher.del(cacheKey); // Clean up request deduplication
            }
          
          // Enhanced error handling for quota issues
          if (error?.error?.message?.includes('quota') || error?.error?.message?.includes('429') || error?.error?.statusCode === 429) {
            console.error("❌ Gemini API quota exceeded:", error.error.message);
            
            // Extract retry delay from error if available
            let retryDelay = 60; // default 60 seconds
            let quotaViolations = [];
            
            try {
              if (error.error.responseBody) {
                const errorData = JSON.parse(error.error.responseBody);
                if (errorData.error?.details) {
                  const retryInfo = errorData.error.details.find((detail: any) => 
                    detail['@type'] === 'type.googleapis.com/google.rpc.RetryInfo'
                  );
                  if (retryInfo?.retryDelay) {
                    retryInfo.retryDelay.replace('s', '');
                  }
                  
                  const quotaFailure = errorData.error.details.find((detail: any) => 
                    detail['@type'] === 'type.googleapis.com/google.rpc.QuotaFailure'
                  );
                  if (quotaFailure?.violations) {
                    quotaViolations = quotaFailure.violations;
                  }
                }
              }
            } catch (parseError) {
              console.warn("Could not parse error details:", parseError);
            }
            
            console.log(`⏰ Suggested retry delay: ${retryDelay} seconds`);
            console.log("🚫 Quota violations:", quotaViolations.map((v: any) => v.quotaId).join(', '));
            console.log("💡 To fix this:");
            console.log("   1. Wait for quota reset (usually 1 minute for per-minute limits, 24 hours for daily limits)");
            console.log("   2. Upgrade to a paid Google AI API plan for higher quotas");
            console.log("   3. Implement request rate limiting in your application");
            console.log("   4. Consider using a different model or reducing request frequency");
          } else {
            console.error("❌ Other streaming error:", error.error);
          }
        } catch (cleanupError) {
          console.error("❌ Error during cleanup:", cleanupError);
        }
      },
              onFinish: async () => {
          // Clear timeout on finish
          clearTimeout(timeoutId);
          
          await redisPublisher.del(`app:${appId}:stream-state`);
          if (cacheKey) {
            await redisPublisher.del(cacheKey); // Clean up request deduplication
          }
        
        // Deduct 1 credit for chat usage
        try {
          const { getUser } = await import("@/auth/stack-auth");
          const user = await getUser();
          
          if (user && user.userId) {
            const { db } = await import("@/db/schema");
            const { users, creditTransactions } = await import("@/db/schema");
            const { eq } = await import("drizzle-orm");
            
            // Deduct 1 credit from user
            const currentUser = await db.select().from(users).where(eq(users.id, user.userId)).limit(1);
            if (currentUser[0]) {
              await db.update(users)
                .set({ 
                  credits: currentUser[0].credits - 1,
                  updatedAt: new Date()
                })
                .where(eq(users.id, user.userId));
            }

            // Record credit transaction
            await db.insert(creditTransactions).values({
              userId: user.userId,
              amount: -1, // Negative amount for usage
              description: `Used 1 credit for chat usage in app ${appId}`,
              type: 'usage',
              metadata: { appId },
            });

            console.log(`Deducted 1 credit from user ${user.userId} for chat usage`);
          }
        } catch (error) {
          console.error("Error deducting credits for chat:", error);
        }
      },
    }
  );

    console.log("Stream created for appId:", appId, "with prompt:", message);

    return await setStream(appId, message, response.stream);
    
  } catch (error) {
    // Clear timeout on any error
    clearTimeout(timeoutId);
    
    console.error(`❌ Error in sendMessage for app ${appId}:`, error);
    
    // Clean up on error
    await redisPublisher.del(`app:${appId}:stream-state`);
    if (cacheKey) {
      await redisPublisher.del(cacheKey);
    }
    
    throw error; // Re-throw to be handled by the caller
  }
}
