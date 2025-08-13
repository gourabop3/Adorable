"use client";

import { requestDevServer as requestDevServerInner } from "./webview-actions";
import "./loader.css";
import {
  FreestyleDevServer,
  FreestyleDevServerHandle,
} from "freestyle-sandboxes/react/dev-server";
import { useRef, useState } from "react";
import { Button } from "./ui/button";
import { RefreshCwIcon, Code, Monitor, Play } from "lucide-react";
import { ShareButton } from "./share-button";
import { CodeStreamingPreview } from "./code-streaming-preview";
import React from "react";

export default function WebView(props: {
  repo: string;
  baseId: string;
  appId: string;
  domain?: string;
  mobileActiveTab?: "preview" | "code";
}) {
  const [activeTab, setActiveTab] = useState<"preview" | "code">("preview");
  
  // Sync with mobile tab if provided
  React.useEffect(() => {
    if (props.mobileActiveTab && props.mobileActiveTab !== "chat") {
      setActiveTab(props.mobileActiveTab);
    }
  }, [props.mobileActiveTab]);
  
  function requestDevServer({ repoId }: { repoId: string }) {
    return requestDevServerInner({ repoId });
  }

  const devServerRef = useRef<FreestyleDevServerHandle>(null);

  return (
    <div className="flex flex-col overflow-hidden h-screen border-l transition-opacity duration-700 mt-[2px]">
      {/* Tab Navigation */}
      <div className="h-12 border-b border-gray-200 bg-background sticky top-0">
        <div className="flex h-full">
          {/* Tab Buttons */}
          <div className="flex flex-1">
            <button
              onClick={() => setActiveTab("preview")}
              className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 transition-colors border-b-2 ${
                activeTab === "preview"
                  ? "border-blue-500 text-blue-600 bg-blue-50 dark:bg-blue-950/20"
                  : "border-transparent text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200"
              }`}
            >
              <Monitor className="h-4 w-4" />
              <span className="font-medium">Live Preview</span>
            </button>
            <button
              onClick={() => setActiveTab("code")}
              className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 transition-colors border-b-2 ${
                activeTab === "code"
                  ? "border-blue-500 text-blue-600 bg-blue-50 dark:bg-blue-950/20"
                  : "border-transparent text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200"
              }`}
            >
              <Code className="h-4 w-4" />
              <span className="font-medium">Code Stream</span>
            </button>
          </div>
          
          {/* Action Buttons */}
          <div className="flex items-center px-2 gap-2 border-l">
            <Button
              variant={"ghost"}
              size={"icon"}
              onClick={() => devServerRef.current?.refresh()}
              title="Refresh Preview"
            >
              <RefreshCwIcon className="h-4 w-4" />
            </Button>
            <ShareButton domain={props.domain} appId={props.appId} />
          </div>
        </div>
      </div>

      {/* Tab Content */}
      <div className="flex-1 overflow-hidden">
        {activeTab === "preview" ? (
          <FreestyleDevServer
            ref={devServerRef}
            actions={{ requestDevServer }}
            repoId={props.repo}
            loadingComponent={({ iframeLoading, devCommandRunning }) =>
              !devCommandRunning && (
                <div className="flex items-center justify-center h-full">
                  <div>
                    <div className="text-center">
                      {iframeLoading ? "JavaScript Loading" : "Starting VM"}
                    </div>
                    <div>
                      <div className="loader"></div>
                    </div>
                  </div>
                </div>
              )
            }
          />
        ) : (
          <CodeStreamingPreview appId={props.appId} />
        )}
      </div>
    </div>
  );
}
