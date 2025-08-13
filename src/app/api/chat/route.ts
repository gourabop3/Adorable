import { getApp } from "@/actions/get-app";
import { freestyle } from "@/lib/freestyle";
import { getAppIdFromHeaders } from "@/lib/utils";
import { MCPClient } from "@mastra/mcp";
import { UIMessage } from "ai";
import { streamText } from "ai";
import { createStreamableUI } from "ai/ui";

// "fix" mastra mcp bug
import { EventEmitter } from "events";
import { getAbortCallback, setStream, stopStream } from "@/lib/streams";
EventEmitter.defaultMaxListeners = 1000;

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

  const mcp = new MCPClient({
    id: crypto.randomUUID(),
    servers: { dev_server: { url: new URL(mcpEphemeralUrl) } },
  });
  const toolsets = await mcp.getToolsets();

  const selectedModelId =
    (await redisPublisher.get(`app:${appId}:model`)) || "gemini-2.0-flash-exp";
  const modelProvider = selectedModelId.startsWith("gpt")
    ? openai(selectedModelId)
    : google(selectedModelId);
  const agent = createBuilderAgentWithModel(modelProvider);

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

  const controller = new AbortController();
  let shouldAbort = false;
  await getAbortCallback(appId, () => {
    shouldAbort = true;
  });

  let lastKeepAlive = Date.now();
  const messageList = new MessageList({ resourceId: appId, threadId: appId });

  // Create a streamable UI for real-time updates
  const ui = createStreamableUI();

  try {
    // Set stream state to running
    await redisPublisher.set(`app:${appId}:stream-state`, "running", { EX: 30 });

    const stream = await agent.stream([], {
      threadId: appId,
      resourceId: appId,
      maxSteps: 100,
      maxRetries: 0,
      maxOutputTokens: Number(process.env.MAX_OUTPUT_TOKENS ?? "24000"),
      toolsets,
      async onChunk() {
        if (Date.now() - lastKeepAlive > 5000) {
          lastKeepAlive = Date.now();
          await redisPublisher.set(`app:${appId}:stream-state`, "running", { EX: 15 });
        }
      },
      async onStepFinish(step) {
        messageList.add(step.response.messages, "response");
        
        // Extract and stream code content in real-time
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
          
          // If this is the final step, mark code as complete
          if (step.response.messages.length > 0) {
            await redisPublisher.publish(`stream:${appId}`, JSON.stringify({
              type: "code-chunk",
              content: "",
              language: "text",
              isComplete: true,
              timestamp: new Date().toISOString()
            }));
          }
        }
        
        if (shouldAbort) {
          await redisPublisher.del(`app:${appId}:stream-state`);
          controller.abort("Aborted stream after step finish");
          const msgs = messageList.drainUnsavedMessages();
          console.log(msgs);
          await (await agent.getMemory())?.saveMessages({ messages: msgs });
        }
      },
      onError: async (error) => {
        await mcp.disconnect();
        await redisPublisher.del(`app:${appId}:stream-state`);
        await redisPublisher.del(cacheKey);
        console.error("Stream error:", error);
        ui.error("An error occurred while processing your request");
        
        // Publish error to streaming preview
        await redisPublisher.publish(`stream:${appId}`, JSON.stringify({
          type: "stream-error",
          error: "An error occurred while processing your request",
          timestamp: new Date().toISOString()
        }));
      },
      onFinish: async () => {
        await redisPublisher.del(`app:${appId}:stream-state`);
        await redisPublisher.del(cacheKey);
        await mcp.disconnect();
        ui.done();
        
        // Publish completion to streaming preview
        await redisPublisher.publish(`stream:${appId}`, JSON.stringify({
          type: "stream-complete",
          message: "Stream completed",
          timestamp: new Date().toISOString()
        }));
      },
      abortSignal: controller.signal,
    });

    console.log("Stream created for appId:", appId, "with prompt:", messages.at(-1));

    // Return the streamable UI response
    return ui.toDataStreamResponse();

  } catch (error) {
    console.error("Error in chat stream:", error);
    await redisPublisher.del(`app:${appId}:stream-state`);
    await redisPublisher.del(cacheKey);
    await mcp.disconnect();
    ui.error("Failed to start chat stream");
    return ui.toDataStreamResponse();
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
