"use server";

import { getUser } from "@/auth/stack-auth";
import { appsTable, appUsers } from "@/db/schema";
import { db } from "@/db/schema";
import { freestyle } from "@/lib/freestyle";
import { templates } from "@/lib/templates";
import { memory, builderAgent, createBuilderAgentWithModel } from "@/mastra/agents/builder";
import { sendMessageWithStreaming } from "@/lib/internal/stream-manager";
import { google } from "@ai-sdk/google";
import { openai } from "@ai-sdk/openai";

export async function createApp({
  initialMessage,
  templateId,
  modelId,
}: {
  initialMessage?: string;
  templateId: string;
  modelId?: string;
}) {
  console.time("get user");
  const user = await getUser();
  console.timeEnd("get user");

  if (!templates[templateId]) {
    throw new Error(
      `Template ${templateId} not found. Available templates: ${Object.keys(templates).join(", ")}`
    );
  }

  console.time("git");
  const repo = await freestyle.createGitRepository({
    name: "Unnamed App",
    public: true,
    source: {
      type: "git",
      url: templates[templateId].repo,
    },
  });
  await freestyle.grantGitPermission({
    identityId: user.freestyleIdentity,
    repoId: repo.repoId,
    permission: "write",
  });

  const token = await freestyle.createGitAccessToken({
    identityId: user.freestyleIdentity,
  });

  console.timeEnd("git");

  console.time("dev server");
  const { mcpEphemeralUrl, fs } = await freestyle.requestDevServer({
    repoId: repo.repoId,
  });
  console.timeEnd("dev server");

  console.time("database: create app");
  const app = await db.transaction(async (tx) => {
    const appInsertion = await tx
      .insert(appsTable)
      .values({
        gitRepo: repo.repoId,
        name: initialMessage,
      })
      .returning();

    await tx
      .insert(appUsers)
      .values({
        appId: appInsertion[0].id,
        userId: user.userId,
        permissions: "admin",
        freestyleAccessToken: token.token,
        freestyleAccessTokenId: token.id,
        freestyleIdentity: user.freestyleIdentity,
      })
      .returning();

    return appInsertion[0];
  });
  console.timeEnd("database: create app");

  console.time("mastra: create thread");
  await memory.createThread({
    threadId: app.id,
    resourceId: app.id,
  });
  console.timeEnd("mastra: create thread");

  // Store selected model for this app
  if (modelId) {
    const { redisPublisher } = await import("@/lib/internal/redis");
    await redisPublisher.set(`app:${app.id}:model`, modelId);
  }

  if (initialMessage) {
    console.time("send initial message");

    // Use selected model if provided, otherwise default builder agent
    const agentToUse = modelId
      ? createBuilderAgentWithModel(
          modelId.startsWith("gpt") ? openai(modelId) : google(modelId)
        )
      : builderAgent;

    await sendMessageWithStreaming(agentToUse, app.id, mcpEphemeralUrl, fs, {
      id: crypto.randomUUID(),
      parts: [
        {
          text: initialMessage,
          type: "text",
        },
      ],
      role: "user",
    });

    console.timeEnd("send initial message");
  }

  return app;
}
