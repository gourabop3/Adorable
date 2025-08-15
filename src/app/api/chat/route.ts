import { getApp } from "@/actions/get-app";
import { freestyle } from "@/lib/freestyle";
import { getAppIdFromHeaders } from "@/lib/utils";
import { UIMessage } from "ai";
import { EventEmitter } from "events";
import {
	isStreamRunning,
	stopStream,
	waitForStreamToStop,
	clearStreamState,
	sendMessageWithStreaming,
} from "@/lib/internal/stream-manager";
import { NextRequest } from "next/server";
import { builderAgent, createBuilderAgentWithModel } from "@/mastra/agents/builder";

EventEmitter.defaultMaxListeners = 1000;

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

	// Ensure only one stream at a time
	if (await isStreamRunning(appId)) {
		console.log("Stopping previous stream for appId:", appId);
		await stopStream(appId);

		const stopped = await waitForStreamToStop(appId);
		if (!stopped) {
			await clearStreamState(appId);
			return new Response(
				"Previous stream is still shutting down, please try again",
				{ status: 429 }
			);
		}
	}

	const { messages }: { messages: UIMessage[] } = await req.json();

	const { mcpEphemeralUrl, fs } = await freestyle.requestDevServer({
		repoId: app.info.gitRepo,
	});

	// Optional model selection via header
	const selectedModel = req.headers.get("x-selected-model");
	const agentToUse = selectedModel
		? createBuilderAgentWithModel(selectedModel)
		: builderAgent;

	const resumableStream = await sendMessageWithStreaming(
		agentToUse,
		appId,
		mcpEphemeralUrl,
		fs,
		messages.at(-1)!
	);

	return resumableStream.response();
}
