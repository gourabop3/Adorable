import { getApp } from "@/actions/get-app";
import { freestyle } from "@/lib/freestyle";
import { getAppIdFromHeaders } from "@/lib/utils";
import { UIMessage } from "ai";
import { createBuilderAgentWithModel } from "@/mastra/agents/builder";

// "fix" mastra mcp bug
import { EventEmitter } from "events";
import {
  isStreamRunning,
  stopStream,
  waitForStreamToStop,
  clearStreamState,
  sendMessageWithStreaming,
} from "@/lib/internal/stream-manager";
EventEmitter.defaultMaxListeners = 1000;

import { NextRequest } from "next/server";
import { redisPublisher } from "@/lib/internal/redis";
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

  const { messages }: { messages: UIMessage[] } = await req.json();

  const { mcpEphemeralUrl, fs } = await freestyle.requestDevServer({
    repoId: app.info.gitRepo,
  });

  const selectedModelId =
    (await redisPublisher.get(`app:${appId}:model`)) || "gemini-2.5-pro";
  const modelProvider = selectedModelId.startsWith("gpt")
    ? openai(selectedModelId)
    : google(selectedModelId);

  const agent = createBuilderAgentWithModel(modelProvider);

  // Check if a stream is already running and stop it if necessary
  if (await isStreamRunning(appId)) {
    console.log("Stopping previous stream for appId:", appId);
    await stopStream(appId);

    // Wait until stream state is cleared
    const stopped = await waitForStreamToStop(appId);
    if (!stopped) {
      await clearStreamState(appId);
      return new Response(
        "Previous stream is still shutting down, please try again",
        { status: 429 }
      );
    }
  }

  const resumableStream = await sendMessageWithStreaming(
    agent,
    appId,
    mcpEphemeralUrl,
    fs,
    messages.at(-1)!
  );

  return resumableStream.response();
}
