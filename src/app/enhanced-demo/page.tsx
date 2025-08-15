"use client";

import { useState } from "react";
import { EnhancedChat } from "@/components/enhanced-chat";
import { UIMessage } from "ai";

export default function EnhancedDemoPage() {
  const [initialMessages] = useState<UIMessage[]>([
    {
      id: "1",
      role: "assistant",
      parts: [
        {
          type: "text",
          text: "Hello! I'm your AI assistant. I can help you build applications with real-time code generation. Try asking me to create something!",
        },
      ],
    },
  ]);

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto p-4">
        <div className="mb-6 text-center">
          <h1 className="text-3xl font-bold mb-2">Enhanced Chat Demo</h1>
          <p className="text-muted-foreground">
            Experience real-time code generation with streaming preview
          </p>
        </div>
        
        <div className="max-w-4xl mx-auto">
          <div className="bg-card rounded-lg border shadow-sm">
            <EnhancedChat
              appId="demo-enhanced"
              initialMessages={initialMessages}
              running={false}
              selectedModel="gemini-2.5-pro"
            />
          </div>
        </div>
      </div>
    </div>
  );
}