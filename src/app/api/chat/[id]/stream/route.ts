import { NextRequest } from "next/server";
import { getAppIdFromHeaders } from "@/lib/utils";
import { chatState } from "@/actions/chat-streaming";
import { redisPublisher } from "@/lib/internal/redis";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const appId = getAppIdFromHeaders(req);
  
  if (!appId) {
    return new Response("Missing App Id header", { status: 400 });
  }

  // Set up Server-Sent Events
  const encoder = new TextEncoder();
  
  const stream = new ReadableStream({
    start(controller) {
      let lastContent = "";
      let isComplete = false;
      
      // Function to send data
      const sendData = (data: any) => {
        const chunk = encoder.encode(`data: ${JSON.stringify(data)}\n\n`);
        controller.enqueue(chunk);
      };

      // Function to send code chunks
      const sendCodeChunk = (content: string, language?: string, complete = false) => {
        sendData({
          type: "code-chunk",
          content,
          language,
          isComplete: complete,
          timestamp: new Date().toISOString()
        });
      };

      // Function to send text chunks
      const sendTextChunk = (content: string) => {
        sendData({
          type: "text-chunk",
          content,
          timestamp: new Date().toISOString()
        });
      };

      // Send initial connection message
      sendData({
        type: "connection",
        message: "Stream connected",
        appId
      });

      // Set up Redis subscription for real-time updates
      const redisSub = redisPublisher.duplicate();
      
      redisSub.subscribe(`stream:${appId}`, (message) => {
        try {
          const data = JSON.parse(message);
          
          if (data.type === "code-chunk") {
            sendCodeChunk(data.content, data.language, data.isComplete);
          } else if (data.type === "text-chunk") {
            sendTextChunk(data.content);
          } else if (data.type === "stream-complete") {
            isComplete = true;
            sendData({
              type: "stream-complete",
              message: "Stream completed"
            });
            controller.close();
          }
        } catch (error) {
          console.error("Error processing stream message:", error);
        }
      });

      // Poll for stream state changes and simulate streaming for demo
      const pollInterval = setInterval(async () => {
        try {
          const state = await chatState(appId);
          
          if (state.state === "running" && !isComplete) {
            // Simulate streaming content (in real implementation, this would come from the AI agent)
            const demoContent = "```tsx\nimport React from 'react';\n\nfunction App() {\n  return (\n    <div>\n      <h1>Hello World</h1>\n    </div>\n  );\n}\n```";
            
            if (lastContent !== demoContent) {
              sendCodeChunk(demoContent, "tsx", true);
              lastContent = demoContent;
              isComplete = true;
            }
          }
        } catch (error) {
          console.error("Error polling stream state:", error);
        }
      }, 2000);

      // Handle client disconnect
      req.signal.addEventListener("abort", () => {
        clearInterval(pollInterval);
        redisSub.unsubscribe();
        controller.close();
      });

      // Keep connection alive
      const keepAlive = setInterval(() => {
        if (!isComplete) {
          sendData({
            type: "keepalive",
            timestamp: new Date().toISOString()
          });
        }
      }, 30000);

      // Cleanup on close
      return () => {
        clearInterval(pollInterval);
        clearInterval(keepAlive);
        redisSub.unsubscribe();
      };
    }
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      "Connection": "keep-alive",
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Headers": "Cache-Control",
    },
  });
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const appId = getAppIdFromHeaders(req);
  
  if (!appId) {
    return new Response("Missing App Id header", { status: 400 });
  }

  try {
    // Stop the stream
    await redisPublisher.del(`app:${appId}:stream-state`);
    
    // Publish stream stop event
    await redisPublisher.publish(`stream:${appId}`, JSON.stringify({
      type: "stream-stopped",
      message: "Stream stopped by user"
    }));

    return new Response("Stream stopped", { status: 200 });
  } catch (error) {
    console.error("Error stopping stream:", error);
    return new Response("Error stopping stream", { status: 500 });
  }
}
