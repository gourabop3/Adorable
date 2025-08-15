import { UIMessage } from "ai";
import { Agent } from "@mastra/core/agent";
import SwitchableStream from "./switchable-stream";
import { streamText } from "ai";
import { convertToCoreMessages } from "ai";
import { createBuilderAgentWithModel } from "@/mastra/agents/builder";

const MAX_RESPONSE_SEGMENTS = 3;

export interface StreamingOptions {
  tools?: Record<string, any>;
  toolCallStreaming?: boolean;
  onError?: (err: any) => void;
  onFinish?: (response: { text: string; finishReason: string }) => void;
  maxTokens?: number;
}

export async function streamResponse(
  messages: UIMessage[],
  model: string,
  appId: string,
  tools?: Record<string, any>
): Promise<Response> {
  const stream = new SwitchableStream();
  
  const options: StreamingOptions = {
    tools,
    toolCallStreaming: true,
    onError: (err: any) => {
      const errorCause = err?.cause?.message || err?.cause || err?.error?.message;
      const msg = errorCause || err?.errors?.[0]?.responseBody || JSON.stringify(err);

      if (msg) {
        throw new Error(msg);
      }
      const error = new Error(msg || JSON.stringify(err));
      error.cause = msg;
      throw error;
    },
    onFinish: async (response) => {
      const { text: content, finishReason } = response;

      if (finishReason !== "length") {
        return stream.close();
      }

      if (stream.switches >= MAX_RESPONSE_SEGMENTS) {
        throw Error("Cannot continue message: Maximum segments reached");
      }

      // Add the assistant's response to messages
      messages.push({
        id: crypto.randomUUID(),
        role: "assistant",
        parts: [{ type: "text", text: content }],
      });

      // Add a user message asking to continue
      messages.push({
        id: crypto.randomUUID(),
        role: "user",
        parts: [{ type: "text", text: "Please continue with the previous response." }],
      });
    },
  };

  try {
    // Create agent with selected model
    const agent = createBuilderAgentWithModel(model);
    
    // Convert messages to core format
    const coreMessages = convertToCoreMessages(messages);
    
    // Create the stream
    const result = streamText({
      model: agent.model,
      messages: coreMessages,
      maxTokens: options.maxTokens || 20000,
      tools: options.tools,
      toolCallStreaming: options.tools ? true : false,
      onFinish: options.onFinish,
      onError: options.onError,
    });

    // Set up the initial stream
    const dataStream = result.toDataStreamResponse({
      sendReasoning: true,
    });

    // Switch to the new stream source
    await stream.switchSource(dataStream.body!);

    return new Response(stream.readable, {
      headers: {
        "content-type": "text/event-stream",
        "cache-control": "no-cache",
        connection: "keep-alive",
        "x-vercel-ai-ui-message-stream": "v1",
        "x-accel-buffering": "no",
      },
    });
  } catch (error: any) {
    stream.close();
    if (error.cause) {
      const newError = new Error(error.cause);
      newError.cause = error.cause;
      throw newError;
    }
    throw error;
  }
}