"use client";

import { useEffect, useState, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { chatState } from "@/actions/chat-streaming";
import { CodeBlock, CodeBlockCode } from "./ui/code-block";
import { Button } from "./ui/button";
import { 
  Play, 
  Square, 
  Copy, 
  Download, 
  RefreshCw,
  AlertCircle,
  CheckCircle,
  Clock,
  Zap
} from "lucide-react";
import { cn } from "@/lib/utils";

interface CodeStream {
  id: string;
  content: string;
  language?: string;
  timestamp: Date;
  isComplete: boolean;
}

export function CodeStreamingPreview({ appId }: { appId: string }) {
  const [codeStreams, setCodeStreams] = useState<CodeStream[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [demoMode, setDemoMode] = useState(false);
  
  const streamEndRef = useRef<HTMLDivElement>(null);
  const eventSourceRef = useRef<EventSource | null>(null);
  const demoIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Get stream state
  const { data: streamState } = useQuery({
    queryKey: ["stream", appId],
    queryFn: async () => chatState(appId),
    refetchInterval: 1000,
    refetchOnWindowFocus: false,
  });

  // Auto-scroll to bottom when new content arrives
  useEffect(() => {
    if (streamEndRef.current) {
      streamEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [codeStreams]);

  // Start streaming when stream state changes
  useEffect(() => {
    if (streamState?.state === "running" && !isStreaming) {
      startStreaming();
    } else if (streamState?.state !== "running" && isStreaming) {
      stopStreaming();
    }
  }, [streamState?.state, isStreaming]);

  const startStreaming = () => {
    setIsStreaming(true);
    setError(null);
    
    // Create EventSource for real-time updates
    const eventSource = new EventSource(`/api/chat/${appId}/stream`);
    eventSourceRef.current = eventSource;

    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        
        if (data.type === "code-chunk") {
          addCodeChunk(data.content, data.language, data.isComplete);
        } else if (data.type === "text-chunk") {
          addTextChunk(data.content);
        } else if (data.type === "connection") {
          console.log("Stream connected:", data.message);
        }
      } catch (error) {
        console.error("Error parsing stream data:", error);
      }
    };

    eventSource.onerror = (error) => {
      console.error("EventSource error:", error);
      setError("Stream connection lost. Trying to reconnect...");
      stopStreaming();
    };

    eventSource.onopen = () => {
      console.log("Stream connection opened");
    };
  };

  const stopStreaming = () => {
    setIsStreaming(false);
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }
  };

  const startDemoMode = () => {
    setDemoMode(true);
    setError(null);
    
    const demoCode = [
      {
        language: "tsx",
        content: "```tsx\nimport React from 'react';\n\nfunction App() {\n  return (\n    <div>\n      <h1>Hello World</h1>\n    </div>\n  );\n}\n```"
      },
      {
        language: "css",
        content: "```css\n.App {\n  text-align: center;\n  padding: 20px;\n}\n\nh1 {\n  color: #333;\n  font-size: 2rem;\n}\n```"
      },
      {
        language: "typescript",
        content: "```typescript\ninterface User {\n  id: string;\n  name: string;\n  email: string;\n}\n\nconst users: User[] = [];\n```"
      }
    ];

    let currentIndex = 0;
    let currentContent = "";
    const targetContent = demoCode[currentIndex].content;
    const language = demoCode[currentIndex].language;

    // Simulate streaming by adding characters one by one
    demoIntervalRef.current = setInterval(() => {
      if (currentContent.length < targetContent.length) {
        currentContent = targetContent.slice(0, currentContent.length + 1);
        addCodeChunk(currentContent, language, false);
      } else {
        // Mark as complete and move to next
        addCodeChunk(currentContent, language, true);
        currentIndex++;
        
        if (currentIndex < demoCode.length) {
          currentContent = "";
          setTimeout(() => {
            const nextTarget = demoCode[currentIndex].content;
            const nextLanguage = demoCode[currentIndex].language;
            
            demoIntervalRef.current = setInterval(() => {
              if (currentContent.length < nextTarget.length) {
                currentContent = nextTarget.slice(0, currentContent.length + 1);
                addCodeChunk(currentContent, nextLanguage, false);
              } else {
                addCodeChunk(currentContent, nextLanguage, true);
                clearInterval(demoIntervalRef.current!);
                setDemoMode(false);
              }
            }, 50);
          }, 1000);
        } else {
          clearInterval(demoIntervalRef.current!);
          setDemoMode(false);
        }
      }
    }, 50);
  };

  const stopDemoMode = () => {
    if (demoIntervalRef.current) {
      clearInterval(demoIntervalRef.current);
      demoIntervalRef.current = null;
    }
    setDemoMode(false);
  };

  const addCodeChunk = (content: string, language?: string, isComplete: boolean = false) => {
    setCodeStreams(prev => {
      const lastStream = prev[prev.length - 1];
      
      if (lastStream && !lastStream.isComplete) {
        // Append to existing stream
        return prev.map((stream, index) => 
          index === prev.length - 1 
            ? { ...stream, content: stream.content + content, isComplete }
            : stream
        );
      } else {
        // Create new stream
        return [...prev, {
          id: crypto.randomUUID(),
          content,
          language: language || detectLanguage(content),
          timestamp: new Date(),
          isComplete
        }];
      }
    });
  };

  const addTextChunk = (content: string) => {
    // Add text chunks as markdown content
    addCodeChunk(content, "markdown", false);
  };

  const detectLanguage = (content: string): string => {
    if (content.includes("```jsx") || content.includes("```tsx")) return "tsx";
    if (content.includes("```js") || content.includes("```ts")) return "typescript";
    if (content.includes("```html")) return "html";
    if (content.includes("```css")) return "css";
    if (content.includes("```json")) return "json";
    if (content.includes("```python")) return "python";
    if (content.includes("```bash")) return "bash";
    if (content.includes("```sql")) return "sql";
    return "text";
  };

  const copyToClipboard = async (content: string, id: string) => {
    try {
      await navigator.clipboard.writeText(content);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch (error) {
      console.error("Failed to copy:", error);
    }
  };

  const downloadCode = (content: string, language: string) => {
    const extension = getFileExtension(language);
    const blob = new Blob([content], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `code.${extension}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const getFileExtension = (language: string): string => {
    const extensions: Record<string, string> = {
      tsx: "tsx",
      typescript: "ts",
      javascript: "js",
      html: "html",
      css: "css",
      json: "json",
      python: "py",
      bash: "sh",
      sql: "sql",
      markdown: "md"
    };
    return extensions[language] || "txt";
  };

  const clearStreams = () => {
    setCodeStreams([]);
    setError(null);
    if (demoIntervalRef.current) {
      clearInterval(demoIntervalRef.current);
      demoIntervalRef.current = null;
    }
    setDemoMode(false);
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (demoIntervalRef.current) {
        clearInterval(demoIntervalRef.current);
      }
    };
  }, []);

  return (
    <div className="h-full flex flex-col bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b bg-white dark:bg-gray-800">
        <div className="flex items-center gap-3">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            Code Streaming Preview
          </h2>
          <div className="flex items-center gap-2">
            {isStreaming ? (
              <div className="flex items-center gap-2 text-green-600">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-sm">Live</span>
              </div>
            ) : demoMode ? (
              <div className="flex items-center gap-2 text-blue-600">
                <Zap className="h-4 w-4 animate-pulse" />
                <span className="text-sm">Demo</span>
              </div>
            ) : (
              <div className="flex items-center gap-2 text-gray-500">
                <Clock className="h-4 w-4" />
                <span className="text-sm">Idle</span>
              </div>
            )}
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          {!isStreaming && !demoMode && (
            <Button
              variant="default"
              size="sm"
              onClick={startDemoMode}
              className="bg-blue-600 hover:bg-blue-700"
            >
              <Zap className="h-4 w-4 mr-2" />
              Demo
            </Button>
          )}
          {demoMode && (
            <Button
              variant="outline"
              size="sm"
              onClick={stopDemoMode}
              className="border-red-200 text-red-600 hover:bg-red-50"
            >
              <Square className="h-4 w-4 mr-2" />
              Stop Demo
            </Button>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={clearStreams}
            disabled={codeStreams.length === 0}
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Clear
          </Button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {error && (
          <div className="flex items-center gap-2 p-3 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 rounded-lg">
            <AlertCircle className="h-4 w-4 text-red-500" />
            <span className="text-red-700 dark:text-red-400 text-sm">{error}</span>
          </div>
        )}

        {codeStreams.length === 0 && !isStreaming && !demoMode && (
          <div className="flex flex-col items-center justify-center h-full text-gray-500">
            <Code className="h-16 w-16 mb-4 opacity-50" />
            <h3 className="text-lg font-medium mb-2">No Code Yet</h3>
            <p className="text-sm text-center max-w-md">
              Start a conversation in the chat to see code streaming here in real-time, or try the demo mode.
            </p>
            <Button
              variant="outline"
              size="sm"
              onClick={startDemoMode}
              className="mt-4"
            >
              <Zap className="h-4 w-4 mr-2" />
              Try Demo Mode
            </Button>
          </div>
        )}

        {codeStreams.map((stream, index) => (
          <div
            key={stream.id}
            className={cn(
              "bg-white dark:bg-gray-800 rounded-lg border shadow-sm overflow-hidden",
              stream.isComplete ? "border-green-200 dark:border-green-800" : "border-blue-200 dark:border-blue-800"
            )}
          >
            {/* Stream Header */}
            <div className="flex items-center justify-between p-3 border-b bg-gray-50 dark:bg-gray-700">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  {stream.language?.toUpperCase() || "TEXT"}
                </span>
                {stream.isComplete ? (
                  <CheckCircle className="h-4 w-4 text-green-500" />
                ) : (
                  <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                )}
              </div>
              
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => copyToClipboard(stream.content, stream.id)}
                  className="h-8 w-8 p-0"
                >
                  {copiedId === stream.id ? (
                    <CheckCircle className="h-4 w-4 text-green-500" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => downloadCode(stream.content, stream.language || "text")}
                  className="h-8 w-8 p-0"
                >
                  <Download className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Code Content */}
            <div className="p-4">
              <CodeBlock>
                <CodeBlockCode
                  code={stream.content}
                  language={stream.language || "text"}
                  className="max-h-96 overflow-y-auto"
                />
              </CodeBlock>
            </div>

            {/* Stream Footer */}
            <div className="px-4 py-2 bg-gray-50 dark:bg-gray-700 text-xs text-gray-500 dark:text-gray-400">
              Generated at {stream.timestamp.toLocaleTimeString()}
            </div>
          </div>
        ))}
        
        <div ref={streamEndRef} />
      </div>
    </div>
  );
}