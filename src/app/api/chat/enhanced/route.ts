import { getApp } from "@/actions/get-app";
import { getAppIdFromHeaders } from "@/lib/utils";
import { UIMessage } from "ai";
import { streamResponse } from "@/lib/internal/stream-response";
import { NextRequest } from "next/server";

export async function POST(req: NextRequest) {
  console.log("Creating enhanced chat stream with real-time code preview");
  
  const appId = getAppIdFromHeaders(req);
  if (!appId) {
    return new Response("Missing App Id header", { status: 400 });
  }

  const app = await getApp(appId);
  if (!app) {
    return new Response("App not found", { status: 404 });
  }

  try {
    const { messages, model = "gemini-2.5-pro" }: { messages: UIMessage[]; model?: string } = await req.json();

    if (!messages || messages.length === 0) {
      return new Response("No messages provided", { status: 400 });
    }

    // Get the last user message
    const lastMessage = messages[messages.length - 1];
    if (lastMessage.role !== "user") {
      return new Response("Last message must be from user", { status: 400 });
    }

    // Create tools for the AI to use
    const tools = {
      // Add your tools here if needed
    };

    // Use the enhanced streaming response
    return await streamResponse(messages, model, appId, tools);
  } catch (error) {
    console.error("Enhanced chat error:", error);
    return new Response(
      error instanceof Error ? error.message : "Internal server error",
      { status: 500 }
    );
  }
}