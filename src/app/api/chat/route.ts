import { getApp } from "@/actions/get-app";
import { freestyle } from "@/lib/freestyle";
import { getAppIdFromHeaders } from "@/lib/utils";
import { MCPClient } from "@mastra/mcp";
import { builderAgent, createBuilderAgentWithModel } from "@/mastra/agents/builder";
import { UIMessage } from "ai";

// "fix" mastra mcp bug
import { EventEmitter } from "events";
import { getAbortCallback, setStream, stopStream } from "@/lib/streams";
EventEmitter.defaultMaxListeners = 1000;

import { NextRequest } from "next/server";
import { redisPublisher } from "@/lib/redis";
import { MessageList } from "@mastra/core/agent";

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

	// Add request deduplication with shorter timeout
	const requestId = req.headers.get('x-request-id') || crypto.randomUUID();
	const cacheKey = `request:${appId}:${requestId}`;
	
	// Check if this request is already being processed (shorter timeout)
	const existingRequest = await redisPublisher.get(cacheKey);
	if (existingRequest === "processing") {
		console.log("Duplicate request detected, returning existing response");
		return new Response("Request already being processed", { status: 409 });
	}
	
	// Set request processing flag with shorter timeout
	await redisPublisher.set(cacheKey, "processing", { EX: 10 });

	const streamState = await redisPublisher.get(
		"app:" + appId + ":stream-state"
	);

	if (streamState === "running") {
		console.log("Stopping previous stream for appId:", appId);
		stopStream(appId);
		// Do not block; proceed and let onFinish/onError cleanup the state
	}

	const { messages }: { messages: UIMessage[] } = await req.json();

	const { mcpEphemeralUrl } = await freestyle.requestDevServer({
		repoId: app.info.gitRepo,
	});

	// Selected model via header (defaults to gemini-2.5-pro)
	const selectedModel = req.headers.get("x-selected-model") || "gemini-2.5-pro";

	const resumableStream = await sendMessage(
		appId,
		mcpEphemeralUrl,
		messages.at(-1)!,
		selectedModel
	);

	return resumableStream.response();
}

export async function sendMessage(
	appId: string,
	mcpUrl: string,
	message: UIMessage,
	modelId?: string
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

	// Pick agent for selected model
	const agent = modelId ? createBuilderAgentWithModel(modelId) : builderAgent;

	await (
		await agent.getMemory()
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

	const stream = await agent.stream([], {
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
					EX: 60,
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
				await agent.getMemory()?.saveMessages({
					messages,
				});
			}
		},
		onError: async (error) => {
			await mcp.disconnect();
			await redisPublisher.del(`app:${appId}:stream-state`);
			console.error("Stream error:", error);
		},
		onFinish: async () => {
			// Persist any unsaved streamed messages so history is visible after refresh
			const messages = messageList.drainUnsavedMessages();
			if (messages && (messages as unknown[]).length) {
				await agent.getMemory()?.saveMessages({ messages: messages as any });
			}
			await redisPublisher.del(`app:${appId}:stream-state`);
			await mcp.disconnect();
		},
		abortSignal: controller.signal,
	});

	console.log("Stream created for appId:", appId, "with prompt:", message);

	return await setStream(appId, message, stream);
}
