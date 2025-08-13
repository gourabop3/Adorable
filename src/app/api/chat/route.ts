import { getApp } from "@/actions/get-app";
import { freestyle } from "@/lib/freestyle";
import { getAppIdFromHeaders } from "@/lib/utils";
import { MCPClient } from "@mastra/mcp";
import { UIMessage } from "ai";

// "fix" mastra mcp bug
import { EventEmitter } from "events";
import { getAbortCallback, setStream, stopStream } from "@/lib/streams";
EventEmitter.defaultMaxListeners = 1000;

import { NextRequest } from "next/server";
import { redisPublisher } from "@/lib/redis";
import { MessageList } from "@mastra/core/agent";
import { builderAgent } from "@/mastra/agents/builder";

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

    const maxAttempts = 60;
    let attempts = 0;
    while (attempts < maxAttempts) {
      await new Promise((resolve) => setTimeout(resolve, 500));
      const updatedState = await redisPublisher.get("app:" + appId + ":stream-state");
      if (updatedState !== "running") {
        break;
      }
      attempts++;
    }

    if (attempts >= maxAttempts) {
      await redisPublisher.del(`app:${appId}:stream-state`);
      return new Response(
        "Previous stream is still shutting down, please try again",
        { status: 429 }
      );
    }
  }

  const { messages }: { messages: UIMessage[] } = await req.json();

  const { mcpEphemeralUrl } = await freestyle.requestDevServer({
    repoId: app.info.gitRepo,
  });

  const resumableStream = await sendMessage(
    appId,
    mcpEphemeralUrl,
    messages.at(-1)!
  );

  return resumableStream.response();
}

export async function sendMessage(
  appId: string,
  mcpUrl: string,
  message: UIMessage
) {
  const mcp = new MCPClient({
    id: crypto.randomUUID(),
    servers: {
      dev_server: {
        url: new URL(mcpUrl),
      },
    },
  });

  const toolsets = await mcp.getToolsets();

  await (
    await builderAgent.getMemory()
  )?.saveMessages({
    messages: [
      {
        content: {
          parts: message.parts,
          format: 3,
        },
        role: "user",
        createdAt: new Date(),
        id: message.id,
        threadId: appId,
        type: "text",
        resourceId: appId,
      },
    ],
  });

  const controller = new AbortController();
  let shouldAbort = false;
  await getAbortCallback(appId, () => {
    shouldAbort = true;
  });

  let lastKeepAlive = Date.now();

  const messageList = new MessageList({
    resourceId: appId,
    threadId: appId,
  });

  const stream = await builderAgent.stream([], {
    threadId: appId,
    resourceId: appId,
    maxSteps: 100,
    maxRetries: 0,
    maxOutputTokens: 8000,
    toolsets,
    async onChunk() {
      if (Date.now() - lastKeepAlive > 5000) {
        lastKeepAlive = Date.now();
        redisPublisher.set(`app:${appId}:stream-state`, "running", {
          EX: 15,
        });
      }
    },
    async onStepFinish(step) {
      messageList.add(step.response.messages, "response");

      if (shouldAbort) {
        await redisPublisher.del(`app:${appId}:stream-state`);
        controller.abort("Aborted stream after step finish");
        const messages = messageList.drainUnsavedMessages();
        console.log(messages);
        await builderAgent.getMemory()?.saveMessages({
          messages,
        });
      }
    },
    onError: async (error) => {
      await mcp.disconnect();
      await redisPublisher.del(`app:${appId}:stream-state`);
      await redisPublisher.del(cacheKey); // Clean up request deduplication
      
      // Enhanced error handling for quota issues
      if (error?.message?.includes('quota') || error?.message?.includes('429') || error?.statusCode === 429) {
        console.error("❌ Gemini API quota exceeded:", error.message);
        
        // Extract retry delay from error if available
        let retryDelay = 60; // default 60 seconds
        let quotaViolations = [];
        
        try {
          if (error.responseBody) {
            const errorData = JSON.parse(error.responseBody);
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
        } catch (error) {
          console.warn("Could not parse error details:", error);
        }
        
        console.log(`⏰ Suggested retry delay: ${retryDelay} seconds`);
        console.log("🚫 Quota violations:", quotaViolations.map((v: any) => v.quotaId).join(', '));
        console.log("💡 To fix this:");
        console.log("   1. Wait for quota reset (usually 1 minute for per-minute limits, 24 hours for daily limits)");
        console.log("   2. Upgrade to a paid Google AI API plan for higher quotas");
        console.log("   3. Implement request rate limiting in your application");
        console.log("   4. Consider using a different model or reducing request frequency");
      } else {
        console.error("❌ Other error:", error);
      }
    },
    onFinish: async () => {
      await redisPublisher.del(`app:${appId}:stream-state`);
      await redisPublisher.del(cacheKey); // Clean up request deduplication
      await mcp.disconnect();
    },
    abortSignal: controller.signal,
  });

  console.log("Stream created for appId:", appId, "with prompt:", message);

  return await setStream(appId, message, stream);
}
