import { getApp } from "@/actions/get-app";
import { freestyle } from "@/lib/freestyle";
import { getAppIdFromHeaders } from "@/lib/utils";
import { MCPClient } from "@mastra/mcp";
import { UIMessage } from "ai";
import { streamText } from "ai";
import { createStreamableUI } from "ai/ui";

import { NextRequest } from "next/server";
import { redisPublisher } from "@/lib/internal/redis";
import { MessageList } from "@mastra/core/agent";
import { createBuilderAgentWithModel } from "@/mastra/agents/builder";
import { google } from "@ai-sdk/google";
import { openai } from "@ai-sdk/openai";

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

  // Simple request deduplication
  const requestId = req.headers.get("x-request-id") || crypto.randomUUID();
  const cacheKey = `request:${appId}:${requestId}`;
  
  try {
    // Check if request is already being processed
    const existingRequest = await redisPublisher.get(cacheKey);
    if (existingRequest === "processing") {
      return new Response("Request already being processed", { status: 409 });
    }
    
    // Mark request as processing
    await redisPublisher.set(cacheKey, "processing", { EX: 30 });

    const { messages }: { messages: UIMessage[] } = await req.json();

    // Get dev server
    const { mcpEphemeralUrl } = await freestyle.requestDevServer({
      repoId: app.info.gitRepo,
    });

    const mcp = new MCPClient({
      id: crypto.randomUUID(),
      servers: { dev_server: { url: new URL(mcpEphemeralUrl) } },
    });
    
    const toolsets = await mcp.getToolsets();

    // Get model configuration
    const selectedModelId =
      (await redisPublisher.get(`app:${appId}:model`)) || "gemini-2.0-flash-exp";
    const modelProvider = selectedModelId.startsWith("gpt")
      ? openai(selectedModelId)
      : google(selectedModelId);
    
    const agent = createBuilderAgentWithModel(modelProvider);

    // Save user message to memory
    await (await agent.getMemory())?.saveMessages({
      messages: [
        {
          content: { parts: messages.at(-1)!.parts, format: 3 },
          role: "user",
          createdAt: new Date(),
          id: messages.at(-1)!.id,
          threadId: appId,
          type: "text",
          resourceId: appId,
        },
      ],
    });

    // Set stream state to running
    await redisPublisher.set(`app:${appId}:stream-state`, "running", { EX: 60 });

    // Create streamable UI for real-time updates
    const ui = createStreamableUI();
    const messageList = new MessageList({ resourceId: appId, threadId: appId });

    // Start the agent stream
    const stream = await agent.stream([], {
      threadId: appId,
      resourceId: appId,
      maxSteps: 100,
      maxRetries: 3, // Allow retries for better reliability
      maxOutputTokens: Number(process.env.MAX_OUTPUT_TOKENS ?? "24000"),
      toolsets,
      
      // Handle streaming chunks
      async onChunk() {
        // Keep stream alive
        await redisPublisher.set(`app:${appId}:stream-state`, "running", { EX: 60 });
      },
      
      // Handle step completion
      async onStepFinish(step) {
        try {
          messageList.add(step.response.messages, "response");
          
          // Extract and stream content in real-time
          const content = step.response.messages[0]?.content;
          if (content && typeof content === 'string') {
            // Stream to the chat UI
            ui.append(content);
            
            // Extract code blocks and publish to streaming preview
            const codeBlocks = extractCodeBlocks(content);
            for (const block of codeBlocks) {
              await redisPublisher.publish(`stream:${appId}`, JSON.stringify({
                type: "code-chunk",
                content: block.code,
                language: block.language,
                isComplete: false,
                timestamp: new Date().toISOString()
              }));
            }
          }
        } catch (error) {
          console.error("Error in onStepFinish:", error);
        }
      },
      
      // Handle errors gracefully
      onError: async (error) => {
        console.error("Stream error:", error);
        
        try {
          // Save any messages that were generated
          const msgs = messageList.drainUnsavedMessages();
          if (msgs.length > 0) {
            await (await agent.getMemory())?.saveMessages({ messages: msgs });
          }
          
          // Publish error to streaming preview
          await redisPublisher.publish(`stream:${appId}`, JSON.stringify({
            type: "stream-error",
            error: "An error occurred while processing your request",
            timestamp: new Date().toISOString()
          }));
          
          // Show error in chat UI
          ui.error("An error occurred while processing your request. Please try again.");
        } catch (cleanupError) {
          console.error("Error during cleanup:", cleanupError);
        }
      },
      
      // Handle successful completion
      onFinish: async () => {
        try {
          console.log("Stream completed successfully for appId:", appId);
          
          // Save final messages
          const msgs = messageList.drainUnsavedMessages();
          if (msgs.length > 0) {
            await (await agent.getMemory())?.saveMessages({ messages: msgs });
          }
          
          // Mark code streams as complete
          await redisPublisher.publish(`stream:${appId}`, JSON.stringify({
            type: "stream-complete",
            message: "Stream completed successfully",
            timestamp: new Date().toISOString()
          }));
          
          // Complete the UI stream
          ui.done();
          
        } catch (error) {
          console.error("Error in onFinish:", error);
          ui.error("Stream completed but encountered an error during cleanup");
        } finally {
          // Cleanup
          await redisPublisher.del(`app:${appId}:stream-state`);
          await redisPublisher.del(cacheKey);
          await mcp.disconnect();
        }
      },
    });

    console.log("Stream created for appId:", appId, "with prompt:", messages.at(-1));

    // Return the streamable UI response
    return ui.toDataStreamResponse();

  } catch (error) {
    console.error("Error in chat stream:", error);
    
    // Cleanup on error
    try {
      await redisPublisher.del(`app:${appId}:stream-state`);
      await redisPublisher.del(cacheKey);
    } catch (cleanupError) {
      console.error("Error during cleanup:", cleanupError);
    }
    
    // Return error response
    return new Response(
      JSON.stringify({ 
        error: "Failed to start chat stream", 
        details: error instanceof Error ? error.message : "Unknown error" 
      }), 
      { 
        status: 500, 
        headers: { "Content-Type": "application/json" } 
      }
    );
  }
}

// Helper function to extract code blocks from content
function extractCodeBlocks(content: string): Array<{ code: string; language: string }> {
  const codeBlockRegex = /```(\w+)?\n([\s\S]*?)```/g;
  const blocks: Array<{ code: string; language: string }> = [];
  
  let match;
  while ((match = codeBlockRegex.exec(content)) !== null) {
    const language = match[1] || 'text';
    const code = match[2];
    blocks.push({ code, language });
  }
  
  return blocks;
}
