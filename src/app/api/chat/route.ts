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
import { redisPublisher } from "@/lib/internal/redis";
import { MessageList } from "@mastra/core/agent";
import { createBuilderAgentWithModel } from "@/mastra/agents/builder";
import { google } from "@ai-sdk/google";

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
  const modelProvider = google(selectedModelId);
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
        redisPublisher.set(`app:${appId}:stream-state`, "running", { EX: 15 });
      }
    },
    async onStepFinish(step) {
      messageList.add(step.response.messages, "response");
      // Removed the problematic abort logic that was causing mid-stream stops
    },
    onError: async (error) => {
      await mcp.disconnect();
      await redisPublisher.del(`app:${appId}:stream-state`);
      await redisPublisher.del(cacheKey);
      console.error("Stream error:", error);
    },
    onFinish: async () => {
      await redisPublisher.del(`app:${appId}:stream-state`);
      await redisPublisher.del(cacheKey);
      await mcp.disconnect();
    },
    abortSignal: controller.signal,
  });

  console.log("Stream created for appId:", appId, "with prompt:", messages.at(-1));

  const resumable = await setStream(appId, messages.at(-1)!, stream);
  return resumable.response();
}
