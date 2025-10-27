"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

interface ResizablePanelGroupProps {
  children: React.ReactNode;
  direction: "horizontal" | "vertical";
  className?: string;
}

const ResizablePanelGroup = React.forwardRef<
  HTMLDivElement,
  ResizablePanelGroupProps
>(({ children, direction, className, ...props }, ref) => {
  return (
    <div
      ref={ref}
      className={cn(
        "flex h-full w-full",
        direction === "horizontal" ? "flex-row" : "flex-col",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
});
ResizablePanelGroup.displayName = "ResizablePanelGroup";

interface ResizablePanelProps {
  children: React.ReactNode;
  defaultSize?: number;
  minSize?: number;
  maxSize?: number;
  className?: string;
}

const ResizablePanel = React.forwardRef<HTMLDivElement, ResizablePanelProps>(
  ({ children, defaultSize, minSize, maxSize, className, ...props }, ref) => {
    const style: React.CSSProperties = {};
    
    if (defaultSize) {
      style.flex = `0 0 ${defaultSize}%`;
    }
    
    if (minSize) {
      style.minWidth = `${minSize}%`;
    }
    
    if (maxSize) {
      style.maxWidth = `${maxSize}%`;
    }

    return (
      <div
        ref={ref}
        className={cn("flex-1 overflow-hidden", className)}
        style={style}
        {...props}
      >
        {children}
      </div>
    );
  }
);
ResizablePanel.displayName = "ResizablePanel";

const ResizableHandle = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => {
  return (
    <div
      ref={ref}
      className={cn(
        "relative flex items-center justify-center bg-border hover:bg-border/80 transition-colors",
        "w-1 cursor-col-resize hover:w-2 group",
        className
      )}
      {...props}
    >
      <div className="absolute inset-y-0 left-1/2 w-1 -translate-x-1/2 bg-transparent group-hover:bg-primary/50 transition-colors" />
    </div>
  );
});
ResizableHandle.displayName = "ResizableHandle";

export { ResizablePanelGroup, ResizablePanel, ResizableHandle };