import { SYSTEM_MESSAGE } from "@/lib/system";
import { google } from "@ai-sdk/google";
import { openai, createOpenAI } from "@ai-sdk/openai";
import { anthropic } from "@ai-sdk/anthropic";
import { Agent } from "@mastra/core/agent";
import { Memory } from "@mastra/memory";
import { PostgresStore, PgVector } from "@mastra/pg";
import { todoTool } from "@/tools/todo-tool";

export const memory = new Memory({
  options: {
    lastMessages: 1000,
    semanticRecall: false,
    threads: {
      generateTitle: false,
    },
  },
  vector: new PgVector({
    connectionString: process.env.DATABASE_URL!,
  }),
  storage: new PostgresStore({
    connectionString: process.env.DATABASE_URL!,
  }),
  processors: [],
});

export const builderAgent = new Agent({
  name: "BuilderAgent",
  model: google("gemini-2.5-pro"),
  instructions: SYSTEM_MESSAGE,
  memory,
  tools: {
    update_todo_list: todoTool,
  },
});

export function createBuilderAgentWithModel(modelId: string) {
  let model;

  if (modelId.startsWith("gpt")) {
    model = openai(modelId);

  } else if (modelId.startsWith("claude")) {
    model = anthropic(modelId);

  } else if (modelId.startsWith("chatanywhere/")) {
    const compatApiKey =
      process.env.OPENAI_COMPAT_API_KEY || process.env.CHATANYWHERE_API_KEY;

    if (!compatApiKey) {
      throw new Error(
        "ChatAnywhere is not configured. Set OPENAI_COMPAT_API_KEY or CHATANYWHERE_API_KEY (and optionally OPENAI_COMPAT_BASE_URL)."
      );
    }

    // Force old OpenAI chat completion style
    const chatanywhere = createOpenAI({
      baseURL:
        process.env.OPENAI_COMPAT_BASE_URL ||
        "https://api.chatanywhere.org/v1", // .org works globally
      apiKey: compatApiKey,
      compatibility: "strict", // important: use /chat/completions, not /responses
    });

    // Remove prefix and pass native model name
    model = chatanywhere(modelId.replace(/^chatanywhere\//, ""));

  } else {
    // Default to Google models
    model = google(modelId);
  }

  return new Agent({
    name: "BuilderAgent",
    model,
    instructions: SYSTEM_MESSAGE,
    memory,
    tools: {
      update_todo_list: todoTool,
    },
  });
}