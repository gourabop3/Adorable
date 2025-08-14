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
  } else if (modelId.startsWith("deepseek/")) {
    if (!process.env.OPENROUTER_API_KEY) {
      throw new Error(
        "OpenRouter is not configured. Set OPENROUTER_API_KEY (and optionally OPENROUTER_BASE_URL, OPENROUTER_REFERER, OPENROUTER_SITE_TITLE)."
      );
    }
    // Route OpenRouter models through OpenAI-compatible client with custom base URL
    const openrouter = createOpenAI({
      baseURL: process.env.OPENROUTER_BASE_URL || "https://openrouter.ai/api/v1",
      apiKey: process.env.OPENROUTER_API_KEY!,
      compatibility: "compatible",
      headers: {
        ...(process.env.OPENROUTER_REFERER && { "HTTP-Referer": process.env.OPENROUTER_REFERER }),
        ...(process.env.OPENROUTER_SITE_TITLE && { "X-Title": process.env.OPENROUTER_SITE_TITLE }),
      },
    });
    model = openrouter(modelId);

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
