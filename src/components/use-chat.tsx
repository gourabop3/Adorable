import { useChat } from "@ai-sdk/react";
import { useEffect, useRef } from "react";

// Modern chat hook with improved stream management and error handling
export function useChatSafe(
  options: Parameters<typeof useChat>[0] & { 
    id: string; 
    onFinish?: () => void;
    onError?: (error: Error) => void;
  }
) {
  const id = options.id;
  const resume = options?.resume;
  const onFinish = options.onFinish;
  const onError = options.onError;
  
  // Remove resume from options to prevent conflicts
  const { resume: _, ...chatOptions } = options;
  
  // Track running streams to prevent duplicates
  const runningStreams = useRef(new Set<string>());
  
  const chat = useChat({
    ...chatOptions,
    onFinish: () => {
      runningStreams.current.delete(id);
      if (onFinish) {
        onFinish();
      }
    },
    onError: (error) => {
      runningStreams.current.delete(id);
      console.error(`Chat error for ${id}:`, error);
      if (onError) {
        onError(error);
      }
    },
    // Add retry logic for failed streams
    retry: {
      retries: 3,
      backoff: (retryCount: number) => Math.min(1000 * 2 ** retryCount, 10000),
    },
  });

  useEffect(() => {
    if (!runningStreams.current.has(id) && resume) {
      try {
        chat.resumeStream();
        runningStreams.current.add(id);
      } catch (error) {
        console.error(`Failed to resume stream for ${id}:`, error);
        if (onError) {
          onError(error as Error);
        }
      }
    }

    return () => {
      if (runningStreams.current.has(id)) {
        chat.stop().then(() => {
          runningStreams.current.delete(id);
        }).catch((error) => {
          console.error(`Error stopping chat for ${id}:`, error);
        });
      }
    };
  }, [resume, id, chat, onError]);

  return chat;
}
