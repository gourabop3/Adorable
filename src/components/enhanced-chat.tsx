"use client";

import Image from "next/image";
import { PromptInputBasic } from "./chatinput";
import { Markdown } from "./ui/markdown";
import { useState, useEffect, useMemo, useRef } from "react";
import React from "react";
import { ChatContainer } from "./ui/chat-container";
import { UIMessage } from "ai";
import { ToolMessage } from "./tools";
import { EnhancedToolMessage } from "./enhanced-tools";
import { useQuery } from "@tanstack/react-query";
import { chatState } from "@/actions/chat-streaming";
import { CompressedImage } from "@/lib/image-compression";
import { useChatSafe } from "./use-chat";

export default function EnhancedChat(props: {
  appId: string;
  initialMessages: UIMessage[];
  isLoading?: boolean;
  topBar?: React.ReactNode;
  running: boolean;
  selectedModel?: string;
}) {
  const { data: chat } = useQuery({
    queryKey: ["stream", props.appId],
    queryFn: async () => {
      return chatState(props.appId);
    },
    refetchInterval: 1000,
    refetchOnWindowFocus: true,
  });

  const { messages, sendMessage, append } = useChatSafe({
    messages: props.initialMessages,
    id: props.appId,
    resume: props.running && chat?.state === "running",
  });

  const [input, setInput] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamingContent, setStreamingContent] = useState("");
  const abortControllerRef = useRef<AbortController | null>(null);

  const onSubmit = async (e?: React.FormEvent<HTMLFormElement>) => {
    if (e?.preventDefault) {
      e.preventDefault();
    }

    if (!input.trim() || isStreaming) return;

    setIsStreaming(true);
    setStreamingContent("");

    // Create abort controller for this request
    abortControllerRef.current = new AbortController();

    try {
      // Add user message to chat
      const userMessage: UIMessage = {
        id: crypto.randomUUID(),
        role: "user",
        parts: [{ type: "text", text: input }],
      };

      // Add user message immediately
      append(userMessage);

      // Start streaming from enhanced API
      const response = await fetch("/api/chat/enhanced", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Adorable-App-Id": props.appId,
          ...(props.selectedModel && { "x-selected-model": props.selectedModel }),
        },
        body: JSON.stringify({
          messages: [...messages, userMessage],
          model: props.selectedModel || "gemini-2.5-pro",
        }),
        signal: abortControllerRef.current.signal,
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error("No response body");
      }

      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            const data = line.slice(6);
            if (data === "[DONE]") {
              // Stream finished
              setIsStreaming(false);
              setStreamingContent("");
              
              // Add the complete assistant message
              if (streamingContent.trim()) {
                const assistantMessage: UIMessage = {
                  id: crypto.randomUUID(),
                  role: "assistant",
                  parts: [{ type: "text", text: streamingContent }],
                };
                append(assistantMessage);
              }
              return;
            }

            try {
              const parsed = JSON.parse(data);
              if (parsed.type === "text-delta" && parsed.textDelta) {
                setStreamingContent(prev => prev + parsed.textDelta);
              }
            } catch (e) {
              // Ignore parsing errors for incomplete JSON
            }
          }
        }
      }
    } catch (error) {
      if (error.name === "AbortError") {
        console.log("Request was aborted");
      } else {
        console.error("Streaming error:", error);
        // Add error message to chat
        const errorMessage: UIMessage = {
          id: crypto.randomUUID(),
          role: "assistant",
          parts: [{ type: "text", text: "Sorry, there was an error processing your request. Please try again." }],
        };
        append(errorMessage);
      }
    } finally {
      setIsStreaming(false);
      setStreamingContent("");
      abortControllerRef.current = null;
    }

    setInput("");
  };

  const onSubmitWithImages = async (text: string, images: CompressedImage[]) => {
    if (isStreaming) return;

    setIsStreaming(true);
    setStreamingContent("");

    const parts: Parameters<typeof sendMessage>[0]["parts"] = [];

    if (text.trim()) {
      parts.push({
        type: "text",
        text: text,
      });
    }

    images.forEach((image) => {
      parts.push({
        type: "file",
        mediaType: image.mimeType,
        url: image.data,
      });
    });

    // For now, fall back to regular sendMessage for images
    // You can enhance this later to support image streaming
    sendMessage(
      {
        parts,
      },
      {
        headers: {
          "Adorable-App-Id": props.appId,
          ...(props.selectedModel && { "x-selected-model": props.selectedModel }),
        },
      }
    );
    setInput("");
  };

  const stopStreaming = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    setIsStreaming(false);
    setStreamingContent("");
  };

  // Combine regular messages with streaming content
  const allMessages = useMemo(() => {
    if (streamingContent && isStreaming) {
      // Create a temporary streaming message
      const streamingMessage: UIMessage = {
        id: "streaming",
        role: "assistant",
        parts: [{ type: "text", text: streamingContent }],
      };
      return [...messages, streamingMessage];
    }
    return messages;
  }, [messages, streamingContent, isStreaming]);

  return (
    <div
      className="flex flex-col h-full"
      style={{ transform: "translateZ(0)" }}
    >
      {props.topBar}
      <div
        className="flex-1 overflow-y-auto flex flex-col space-y-6 min-h-0"
        style={{ overflowAnchor: "auto" }}
      >
        <ChatContainer autoScroll>
          {allMessages.map((message: any) => (
            <MessageBody 
              key={message.id} 
              message={message} 
              isStreaming={message.id === "streaming"}
            />
          ))}
        </ChatContainer>
      </div>
      <div className="flex-shrink-0 p-3 transition-all bg-background md:backdrop-blur-sm">
        <PromptInputBasic
          stop={stopStreaming}
          input={input}
          onValueChange={(value) => {
            setInput(value);
          }}
          onSubmit={onSubmit}
          onSubmitWithImages={onSubmitWithImages}
          isGenerating={props.isLoading || chat?.state === "running" || isStreaming}
        />
      </div>
    </div>
  );
}

const MessageBody = React.memo(function MessageBody({ 
  message, 
  isStreaming = false 
}: { 
  message: any; 
  isStreaming?: boolean;
}) {
  if (message.role === "user") {
    return (
      <div className="flex justify-end py-1 mb-4">
        <div className="bg-neutral-200 dark:bg-neutral-700 rounded-xl px-4 py-1 max-w-[80%] ml-auto">
          {message.parts.map((part: any, index: number) => {
            if (part.type === "text") {
              return <div key={index}>{part.text}</div>;
            } else if (
              part.type === "file" &&
              part.mediaType?.startsWith("image/")
            ) {
              return (
                <div key={index} className="mt-2">
                  <Image
                    src={part.url as string}
                    alt="User uploaded image"
                    width={200}
                    height={200}
                    className="max-w-full h-auto rounded"
                    style={{ maxHeight: "200px" }}
                  />
                </div>
              );
            }
            return <div key={index}>unexpected message</div>;
          })}
        </div>
      </div>
    );
  }

  if (Array.isArray(message.parts) && message.parts.length !== 0) {
    return (
      <div className="mb-4">
        {message.parts.map((part: any, index: any) => {
          if (part.type === "text") {
            return (
              <div key={index} className="mb-4">
                <Markdown 
                  className={`prose prose-sm dark:prose-invert max-w-none ${
                    isStreaming ? "streaming-content" : ""
                  }`}
                >
                  {part.text}
                  {isStreaming && (
                    <span className="inline-block w-2 h-4 ml-1 bg-blue-500 animate-pulse" />
                  )}
                </Markdown>
              </div>
            );
          }

          if (part.type.startsWith("tool-")) {
            return <EnhancedToolMessage key={index} toolInvocation={part} />;
          }
        })}
      </div>
    );
  }

  if (message.parts) {
    return (
      <Markdown 
        className={`prose prose-sm dark:prose-invert max-w-none ${
          isStreaming ? "streaming-content" : ""
        }`}
      >
        {message.parts
          .map((part: any) =>
            part.type === "text" ? part.text : "[something went wrong]"
          )
          .join("")}
        {isStreaming && (
          <span className="inline-block w-2 h-4 ml-1 bg-blue-500 animate-pulse" />
        )}
      </Markdown>
    );
  }

  return (
    <div>
      <p className="text-gray-500">Something went wrong</p>
    </div>
  );
});