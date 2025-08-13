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

  console.log(`Starting SSE stream for appId: ${appId}`);

  // Set up Server-Sent Events
  const encoder = new TextEncoder();
  
  const stream = new ReadableStream({
    start(controller) {
      let isComplete = false;
      let connectionId = crypto.randomUUID();
      
      console.log(`SSE connection ${connectionId} started for appId: ${appId}`);
      
      // Function to send data
      const sendData = (data: any) => {
        try {
          const chunk = encoder.encode(`data: ${JSON.stringify(data)}\n\n`);
          controller.enqueue(chunk);
        } catch (error) {
          console.error(`Error sending data in SSE ${connectionId}:`, error);
        }
      };

      // Function to send code chunks
      const sendCodeChunk = (content: string, language?: string, complete = false) => {
        sendData({
          type: "code-chunk",
          content,
          language,
          isComplete: complete,
          timestamp: new Date().toISOString(),
          connectionId
        });
      };

      // Function to send text chunks
      const sendTextChunk = (content: string) => {
        sendData({
          type: "text-chunk",
          content,
          timestamp: new Date().toISOString(),
          connectionId
        });
      };

      // Send initial connection message
      sendData({
        type: "connection",
        message: "Stream connected",
        appId,
        connectionId,
        timestamp: new Date().toISOString()
      });

      // Set up Redis subscription for real-time updates
      const redisSub = redisPublisher.duplicate();
      
      redisSub.subscribe(`stream:${appId}`, (message) => {
        try {
          const data = JSON.parse(message);
          console.log(`Received Redis message for ${appId}:`, data.type);
          
          if (data.type === "code-chunk") {
            sendCodeChunk(data.content, data.language, data.isComplete);
          } else if (data.type === "text-chunk") {
            sendTextChunk(data.content);
          } else if (data.type === "stream-complete") {
            isComplete = true;
            sendData({
              type: "stream-complete",
              message: "Stream completed",
              connectionId,
              timestamp: new Date().toISOString()
            });
            controller.close();
          } else if (data.type === "stream-error") {
            sendData({
              type: "stream-error",
              error: data.error,
              connectionId,
              timestamp: new Date().toISOString()
            });
          }
        } catch (error) {
          console.error(`Error processing Redis message in SSE ${connectionId}:`, error);
        }
      });

      // Poll for stream state changes and provide demo content
      const pollInterval = setInterval(async () => {
        try {
          if (isComplete) {
            clearInterval(pollInterval);
            return;
          }

          const state = await chatState(appId);
          
          if (state.state === "running" && !isComplete) {
            console.log(`Stream state is running for ${appId}, sending demo content`);
            
            // Send demo content to show streaming is working
            const demoContent = "```tsx\nimport React from 'react';\n\nfunction App() {\n  return (\n    <div className=\"min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-8\">\n      <div className=\"max-w-4xl mx-auto\">\n        <h1 className=\"text-4xl font-bold text-gray-900 mb-6\">\n          Welcome to Your Beautiful App\n        </h1>\n        <p className=\"text-lg text-gray-600 mb-8\">\n          This is a modern, responsive application built with React and Tailwind CSS.\n        </p>\n        <div className=\"grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6\">\n          <div className=\"bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow\">\n            <h3 className=\"text-xl font-semibold text-gray-800 mb-3\">Feature 1</h3>\n            <p className=\"text-gray-600\">Beautiful, modern design with smooth animations.</p>\n          </div>\n          <div className=\"bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow\">\n            <h3 className=\"text-xl font-semibold text-gray-800 mb-3\">Feature 2</h3>\n            <p className=\"text-gray-600\">Responsive layout that works on all devices.</p>\n          </div>\n          <div className=\"bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow\">\n            <h3 className=\"text-xl font-semibold text-gray-800 mb-3\">Feature 3</h3>\n            <p className=\"text-gray-600\">Accessible design with proper contrast ratios.</p>\n          </div>\n        </div>\n      </div>\n    </div>\n  );\n}\n\nexport default App;\n```";
            
            sendCodeChunk(demoContent, "tsx", true);
            isComplete = true;
            
            // Send completion message
            setTimeout(() => {
              sendData({
                type: "stream-complete",
                message: "Demo stream completed",
                connectionId,
                timestamp: new Date().toISOString()
              });
              controller.close();
            }, 1000);
          }
        } catch (error) {
          console.error(`Error polling stream state in SSE ${connectionId}:`, error);
        }
      }, 3000);

      // Handle client disconnect
      req.signal.addEventListener("abort", () => {
        console.log(`SSE connection ${connectionId} aborted for appId: ${appId}`);
        clearInterval(pollInterval);
        redisSub.unsubscribe();
        controller.close();
      });

      // Keep connection alive
      const keepAlive = setInterval(() => {
        if (!isComplete) {
          sendData({
            type: "keepalive",
            connectionId,
            timestamp: new Date().toISOString()
          });
        }
      }, 30000);

      // Cleanup on close
      return () => {
        console.log(`Cleaning up SSE connection ${connectionId} for appId: ${appId}`);
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
    console.log(`Stopping stream for appId: ${appId}`);
    
    // Stop the stream
    await redisPublisher.del(`app:${appId}:stream-state`);
    
    // Publish stream stop event
    await redisPublisher.publish(`stream:${appId}`, JSON.stringify({
      type: "stream-stopped",
      message: "Stream stopped by user",
      timestamp: new Date().toISOString()
    }));

    return new Response("Stream stopped", { status: 200 });
  } catch (error) {
    console.error("Error stopping stream:", error);
    return new Response("Error stopping stream", { status: 500 });
  }
}
