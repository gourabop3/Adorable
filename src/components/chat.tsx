"use client";

import Image from "next/image";
import { PromptInputBasic } from "./chatinput";
import { Markdown } from "./ui/markdown";
import { useEffect, useMemo, useState, useCallback } from "react";
import { ChatContainer } from "./ui/chat-container";
import { UIMessage } from "ai";
import { ToolMessage } from "./tools";
import { EnhancedToolMessage } from "./enhanced-tools";
import { useQuery } from "@tanstack/react-query";
import { chatState } from "@/actions/chat-streaming";
import { CompressedImage } from "@/lib/image-compression";
import { useChatSafe } from "./use-chat";
import { AlertCircle, RefreshCw, Loader2, CheckCircle } from "lucide-react";

export default function Chat(props: {
  appId: string;
  initialMessages: UIMessage[];
  isLoading?: boolean;
  topBar?: React.ReactNode;
  running: boolean;
}) {
  const [error, setError] = useState<Error | null>(null);
  const [isRetrying, setIsRetrying] = useState(false);
  const [streamStatus, setStreamStatus] = useState<'idle' | 'connecting' | 'streaming' | 'completed' | 'error'>('idle');

  const { data: chat } = useQuery({
    queryKey: ["stream", props.appId],
    queryFn: async () => {
      return chatState(props.appId);
    },
    refetchInterval: 1000,
    refetchOnWindowFocus: false,
    staleTime: 1000,
    refetchOnMount: false,
    refetchOnReconnect: false,
    gcTime: 5000,
  });

  const [debouncedRunning, setDebouncedRunning] = useState(false);
  useEffect(() => {
    const timer = setTimeout(() => {
      const isRunning = props.running && chat?.state === "running";
      setDebouncedRunning(isRunning);
      
      // Update stream status based on running state
      if (isRunning) {
        setStreamStatus('streaming');
      } else if (chat?.state === "running") {
        setStreamStatus('streaming');
      } else if (error) {
        setStreamStatus('error');
      } else if (streamStatus === 'streaming') {
        setStreamStatus('completed');
      } else {
        setStreamStatus('idle');
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [props.running, chat?.state, error, streamStatus]);

  const handleError = useCallback((error: Error) => {
    console.error("Chat error:", error);
    setError(error);
    setStreamStatus('error');
  }, []);

  const handleFinish = useCallback(() => {
    setError(null);
    setIsRetrying(false);
    setStreamStatus('completed');
    
    // Reset to idle after a delay
    setTimeout(() => {
      setStreamStatus('idle');
    }, 2000);
  }, []);

  const { messages, sendMessage, reload } = useChatSafe({
    messages: props.initialMessages,
    id: props.appId,
    resume: debouncedRunning,
    onError: handleError,
    onFinish: handleFinish,
  });

  const dedupedMessages = useMemo(() => {
    const seen = new Set<string>();
    return (messages as any[]).filter((m) => {
      if (!m?.id) return true;
      if (seen.has(m.id)) return false;
      seen.add(m.id);
      return true;
    });
  }, [messages]);

  const [input, setInput] = useState("");

  const handleRetry = useCallback(async () => {
    setIsRetrying(true);
    setError(null);
    setStreamStatus('connecting');
    
    try {
      await reload();
      setStreamStatus('streaming');
    } catch (error) {
      setError(error as Error);
      setStreamStatus('error');
    } finally {
      setIsRetrying(false);
    }
  }, [reload]);

  const onSubmit = (e?: React.FormEvent<HTMLFormElement>) => {
    if (e?.preventDefault) {
      e.preventDefault();
    }

    if (!input.trim() || debouncedRunning) {
      return;
    }

    const messageText = input.trim();
    setInput("");
    setError(null);
    setStreamStatus('connecting');

    setTimeout(() => {
      const messageId = crypto.randomUUID();
      sendMessage(
        {
          id: messageId,
          parts: [
            {
              type: "text",
              text: messageText,
            },
          ],
        },
        {
          headers: {
            "Adorable-App-Id": props.appId,
          },
        }
      );
    }, 100);
  };

  const onSubmitWithImages = (text: string, images: CompressedImage[]) => {
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

    sendMessage(
      {
        parts,
      },
      {
        headers: {
          "Adorable-App-Id": props.appId,
        },
      }
    );
    setInput("");
    setError(null);
    setStreamStatus('connecting');
  };

  async function handleStop() {
    try {
      setStreamStatus('connecting');
      await fetch("/api/chat/" + props.appId + "/stream", {
        method: "DELETE",
        headers: {
          "Adorable-App-Id": props.appId,
        },
      });
      setStreamStatus('idle');
    } catch (error) {
      console.error("Failed to stop stream:", error);
      setStreamStatus('error');
    }
  }

  // Stream status indicator
  const getStreamStatusIndicator = () => {
    switch (streamStatus) {
      case 'connecting':
        return (
          <div className="flex items-center gap-2 text-blue-600">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span className="text-sm">Connecting...</span>
          </div>
        );
      case 'streaming':
        return (
          <div className="flex items-center gap-2 text-green-600">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            <span className="text-sm">Live</span>
          </div>
        );
      case 'completed':
        return (
          <div className="flex items-center gap-2 text-green-600">
            <CheckCircle className="h-4 w-4" />
            <span className="text-sm">Completed</span>
          </div>
        );
      case 'error':
        return (
          <div className="flex items-center gap-2 text-red-600">
            <AlertCircle className="h-4 w-4" />
            <span className="text-sm">Error</span>
          </div>
        );
      default:
        return (
          <div className="flex items-center gap-2 text-gray-500">
            <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
            <span className="text-sm">Idle</span>
          </div>
        );
    }
  };

  // Error boundary UI
  if (error) {
    return (
      <div className="flex flex-col h-full">
        {props.topBar}
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center space-y-4 p-6">
            <AlertCircle className="h-12 w-12 text-red-500 mx-auto" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              Chat Error
            </h3>
            <p className="text-gray-600 dark:text-gray-400 max-w-md">
              {error.message || "Something went wrong with the chat stream. Please try again."}
            </p>
            <button
              onClick={handleRetry}
              disabled={isRetrying}
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isRetrying ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4" />
              )}
              {isRetrying ? "Retrying..." : "Retry"}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className="flex flex-col h-full"
      style={{ transform: "translateZ(0)" }}
    >
      {props.topBar}
      
      {/* Stream Status Bar */}
      <div className="px-4 py-2 bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Stream Status:
            </span>
            {getStreamStatusIndicator()}
          </div>
          
          {streamStatus === 'streaming' && (
            <button
              onClick={handleStop}
              className="inline-flex items-center gap-2 px-3 py-1 text-sm bg-red-100 text-red-700 rounded-md hover:bg-red-200 transition-colors"
            >
              <div className="w-2 h-2 bg-red-500 rounded-full"></div>
              Stop Stream
            </button>
          )}
        </div>
      </div>
      
      <div
        className="flex-1 overflow-y-auto flex flex-col space-y-6 min-h-0"
        style={{ overflowAnchor: "auto" }}
      >
        <ChatContainer autoScroll>
          {dedupedMessages.map((message: any) => (
            <MessageBody key={message.id} message={message} />
          ))}
        </ChatContainer>
      </div>
      <div className="flex-shrink-0 p-3 transition-all bg-background md:backdrop-blur-sm">
        <PromptInputBasic
          stop={handleStop}
          input={input}
          onValueChange={(value) => {
            setInput(value);
          }}
          onSubmit={onSubmit}
          onSubmitWithImages={onSubmitWithImages}
          isGenerating={props.isLoading || debouncedRunning || streamStatus === 'connecting'}
        />
      </div>
    </div>
  );
}

function MessageBody({ message }: { message: any }) {
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
                <Markdown className="prose prose-sm dark:prose-invert max-w-none">
                  {part.text}
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
      <Markdown className="prose prose-sm dark:prose-invert max-w-none">
        {message.parts
          .map((part: any) =>
            part.type === "text" ? part.text : "[something went wrong]"
          )
          .join("")}
      </Markdown>
    );
  }

  return (
    <div>
      <p className="text-gray-500">Something went wrong</p>
    </div>
  );
}
