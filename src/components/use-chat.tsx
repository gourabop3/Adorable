import { useChat } from "ai/react";
import { useEffect, useRef, useCallback } from "react";

// Modern chat hook using Vercel AI SDK with improved stream management and error handling
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
  const retryCount = useRef(0);
  const maxRetries = 3;
  
  const chat = useChat({
    ...chatOptions,
    onFinish: () => {
      runningStreams.current.delete(id);
      retryCount.current = 0; // Reset retry count on success
      if (onFinish) {
        onFinish();
      }
    },
    onError: (error) => {
      console.error(`Chat error for ${id}:`, error);
      
      // Implement retry logic
      if (retryCount.current < maxRetries) {
        retryCount.current++;
        console.log(`Retrying chat for ${id}, attempt ${retryCount.current}/${maxRetries}`);
        
        // Wait a bit before retrying
        setTimeout(() => {
          try {
            chat.reload();
          } catch (retryError) {
            console.error(`Retry failed for ${id}:`, retryError);
            handleFinalError(error);
          }
        }, Math.min(1000 * 2 ** retryCount.current, 5000)); // Exponential backoff
        
        return;
      }
      
      // Max retries reached, handle final error
      handleFinalError(error);
    },
    // Enable experimental streaming features for better code streaming
    experimental_streamData: true,
    experimental_onFunctionCall: options.experimental_onFunctionCall,
    // Add retry logic for failed streams
    retry: {
      retries: 3,
      backoff: (retryCount: number) => Math.min(1000 * 2 ** retryCount, 10000),
    },
  });

  const handleFinalError = useCallback((error: Error) => {
    runningStreams.current.delete(id);
    retryCount.current = 0;
    if (onError) {
      onError(error);
    }
  }, [id, onError]);

  useEffect(() => {
    if (!runningStreams.current.has(id) && resume) {
      try {
        chat.resumeStream();
        runningStreams.current.add(id);
        retryCount.current = 0; // Reset retry count when resuming
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

  // Enhanced reload function with error handling
  const enhancedReload = useCallback(async () => {
    try {
      retryCount.current = 0; // Reset retry count
      await chat.reload();
      return true;
    } catch (error) {
      console.error(`Failed to reload chat for ${id}:`, error);
      if (onError) {
        onError(error as Error);
      }
      return false;
    }
  }, [chat, id, onError]);

  return {
    ...chat,
    reload: enhancedReload,
  };
}
