"use client";

import Image from "next/image";

import { PromptInputBasic } from "./chatinput";
import { Markdown } from "./ui/markdown";
import { useEffect, useMemo, useState } from "react";
import { ChatContainer } from "./ui/chat-container";
import { UIMessage } from "ai";
import { ToolMessage } from "./tools";
import { EnhancedToolMessage } from "./enhanced-tools";
import { useQuery } from "@tanstack/react-query";
import { chatState } from "@/actions/chat-streaming";
import { CompressedImage } from "@/lib/image-compression";
import { useChatSafe } from "./use-chat";
import { useBilling } from "@/contexts/billing-context";
import { Coins, AlertTriangle } from "lucide-react";

export default function Chat(props: {
  appId: string;
  initialMessages: UIMessage[];
  isLoading?: boolean;
  topBar?: React.ReactNode;
  running: boolean;
  selectedModel?: string;
}) {
  const { billing } = useBilling();
  const { data: chat } = useQuery({
    queryKey: ["stream", props.appId],
    queryFn: async () => {
      return chatState(props.appId);
    },
    refetchInterval: 2000,
    refetchOnWindowFocus: false,
    staleTime: 1000,
    refetchOnMount: false,
    refetchOnReconnect: false,
    gcTime: 5000,
  });

  const [debouncedRunning, setDebouncedRunning] = useState(false);
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedRunning(props.running && chat?.state === "running");
    }, 300);
    return () => clearTimeout(timer);
  }, [props.running, chat?.state]);

  const { messages, sendMessage } = useChatSafe({
    messages: props.initialMessages,
    id: props.appId,
    resume: debouncedRunning,
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

  const onSubmit = (e?: React.FormEvent<HTMLFormElement>) => {
    if (e?.preventDefault) {
      e.preventDefault();
    }

    if (!input.trim() || debouncedRunning) {
      return;
    }

    const messageText = input.trim();
    setInput("");

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
            ...(props.selectedModel && { "x-selected-model": props.selectedModel }),
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
          ...(props.selectedModel && { "x-selected-model": props.selectedModel }),
        },
      }
    );
    setInput("");
  };

  async function handleStop() {
    await fetch("/api/chat/" + props.appId + "/stream", {
      method: "DELETE",
      headers: {
        "Adorable-App-Id": props.appId,
      },
    });
  }

  return (
    <div
      className="flex flex-col h-full"
      style={{ transform: "translateZ(0)" }}
    >
      {props.topBar}
      
      {/* Credit Warning Banner */}
      {billing && billing.credits < 3 && (
        <div className="w-full p-3 bg-yellow-50 dark:bg-yellow-950 border border-yellow-200 dark:border-yellow-800 rounded-lg mb-4">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-yellow-600" />
            <div className="flex-1">
              <p className="text-sm text-yellow-800 dark:text-yellow-700">
                <strong>Low Credits:</strong> You have {billing.credits} credits remaining. 
                Each chat message costs 1 credit. Consider purchasing more credits to continue.
              </p>
            </div>
          </div>
        </div>
      )}
      
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
          isGenerating={props.isLoading || debouncedRunning}
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
