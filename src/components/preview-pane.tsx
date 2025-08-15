"use client";

import { useEffect, useRef, useState } from 'react';
import { WebContainerService } from '@/lib/webcontainer';
import { cn } from '@/lib/utils';
import { RefreshCw, ExternalLink, Smartphone, Tablet, Monitor } from 'lucide-react';

interface PreviewPaneProps {
  className?: string;
  onUrlChange?: (url: string) => void;
}

export function PreviewPane({ className, onUrlChange }: PreviewPaneProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [previewUrl, setPreviewUrl] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [viewport, setViewport] = useState<'mobile' | 'tablet' | 'desktop'>('desktop');
  const webcontainerService = useRef(WebContainerService.getInstance());

  const startPreview = async () => {
    setIsLoading(true);
    setError('');

    try {
      const webcontainer = await webcontainerService.current.init();
      
      // Install dependencies first
      await webcontainerService.current.installDependencies();
      
      // Start the dev server
      const url = await webcontainerService.current.startDevServer();
      setPreviewUrl(url);
      onUrlChange?.(url);
    } catch (err) {
      console.error('Failed to start preview:', err);
      setError('Failed to start preview server. Please check your code and try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const refreshPreview = () => {
    if (iframeRef.current && previewUrl) {
      iframeRef.current.src = previewUrl;
    }
  };

  const openInNewTab = () => {
    if (previewUrl) {
      window.open(previewUrl, '_blank');
    }
  };

  const getViewportStyles = () => {
    switch (viewport) {
      case 'mobile':
        return { width: '375px', height: '667px' };
      case 'tablet':
        return { width: '768px', height: '1024px' };
      case 'desktop':
      default:
        return { width: '100%', height: '100%' };
    }
  };

  useEffect(() => {
    // Auto-start preview when component mounts
    startPreview();
  }, []);

  return (
    <div className={cn("flex flex-col h-full", className)}>
      {/* Preview Header */}
      <div className="flex items-center justify-between px-3 py-2 bg-muted/50 border-b border-border">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-muted-foreground">Preview</span>
          {previewUrl && (
            <span className="text-xs text-muted-foreground/70 truncate max-w-48">
              {previewUrl}
            </span>
          )}
        </div>
        
        <div className="flex items-center gap-1">
          {/* Viewport controls */}
          <div className="flex items-center gap-1 mr-2">
            <button
              onClick={() => setViewport('mobile')}
              className={cn(
                "p-1.5 rounded transition-colors",
                viewport === 'mobile' 
                  ? "bg-primary text-primary-foreground" 
                  : "hover:bg-muted"
              )}
              title="Mobile view"
            >
              <Smartphone className="w-3 h-3" />
            </button>
            <button
              onClick={() => setViewport('tablet')}
              className={cn(
                "p-1.5 rounded transition-colors",
                viewport === 'tablet' 
                  ? "bg-primary text-primary-foreground" 
                  : "hover:bg-muted"
              )}
              title="Tablet view"
            >
              <Tablet className="w-3 h-3" />
            </button>
            <button
              onClick={() => setViewport('desktop')}
              className={cn(
                "p-1.5 rounded transition-colors",
                viewport === 'desktop' 
                  ? "bg-primary text-primary-foreground" 
                  : "hover:bg-muted"
              )}
              title="Desktop view"
            >
              <Monitor className="w-3 h-3" />
            </button>
          </div>

          {/* Action buttons */}
          <button
            onClick={refreshPreview}
            disabled={!previewUrl || isLoading}
            className="p-1.5 hover:bg-muted rounded transition-colors disabled:opacity-50"
            title="Refresh preview"
          >
            <RefreshCw className={cn("w-3 h-3", isLoading && "animate-spin")} />
          </button>
          
          <button
            onClick={openInNewTab}
            disabled={!previewUrl}
            className="p-1.5 hover:bg-muted rounded transition-colors disabled:opacity-50"
            title="Open in new tab"
          >
            <ExternalLink className="w-3 h-3" />
          </button>
        </div>
      </div>

      {/* Preview Content */}
      <div className="flex-1 relative overflow-auto bg-white dark:bg-gray-900">
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-background/80 backdrop-blur-sm z-10">
            <div className="flex items-center gap-2 text-muted-foreground">
              <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
              <span>Starting preview server...</span>
            </div>
          </div>
        )}

        {error && (
          <div className="absolute inset-0 flex items-center justify-center bg-background z-10">
            <div className="text-center max-w-md mx-auto p-6">
              <div className="text-red-500 mb-2">⚠️</div>
              <h3 className="text-lg font-medium mb-2">Preview Error</h3>
              <p className="text-muted-foreground text-sm mb-4">{error}</p>
              <button
                onClick={startPreview}
                className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
              >
                Try Again
              </button>
            </div>
          </div>
        )}

        {previewUrl && !error && (
          <div className="flex items-center justify-center h-full p-4">
            <div 
              className={cn(
                "border border-border rounded-lg overflow-hidden shadow-lg bg-white",
                viewport !== 'desktop' && "mx-auto"
              )}
              style={getViewportStyles()}
            >
              <iframe
                ref={iframeRef}
                src={previewUrl}
                className="w-full h-full border-none"
                title="Preview"
                sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-modals"
              />
            </div>
          </div>
        )}

        {!previewUrl && !isLoading && !error && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center">
              <div className="text-4xl mb-4">🚀</div>
              <h3 className="text-lg font-medium mb-2">No Preview Available</h3>
              <p className="text-muted-foreground text-sm mb-4">
                Generate some code to see the live preview
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

interface PreviewControlsProps {
  onRefresh?: () => void;
  onOpenExternal?: () => void;
  onViewportChange?: (viewport: 'mobile' | 'tablet' | 'desktop') => void;
  currentViewport?: 'mobile' | 'tablet' | 'desktop';
  isLoading?: boolean;
  className?: string;
}

export function PreviewControls({
  onRefresh,
  onOpenExternal,
  onViewportChange,
  currentViewport = 'desktop',
  isLoading = false,
  className
}: PreviewControlsProps) {
  return (
    <div className={cn("flex items-center gap-2", className)}>
      {/* Viewport buttons */}
      <div className="flex items-center gap-1 border border-border rounded-md p-1">
        <button
          onClick={() => onViewportChange?.('mobile')}
          className={cn(
            "p-1.5 rounded transition-colors",
            currentViewport === 'mobile' 
              ? "bg-primary text-primary-foreground" 
              : "hover:bg-muted"
          )}
          title="Mobile view (375px)"
        >
          <Smartphone className="w-3 h-3" />
        </button>
        <button
          onClick={() => onViewportChange?.('tablet')}
          className={cn(
            "p-1.5 rounded transition-colors",
            currentViewport === 'tablet' 
              ? "bg-primary text-primary-foreground" 
              : "hover:bg-muted"
          )}
          title="Tablet view (768px)"
        >
          <Tablet className="w-3 h-3" />
        </button>
        <button
          onClick={() => onViewportChange?.('desktop')}
          className={cn(
            "p-1.5 rounded transition-colors",
            currentViewport === 'desktop' 
              ? "bg-primary text-primary-foreground" 
              : "hover:bg-muted"
          )}
          title="Desktop view"
        >
          <Monitor className="w-3 h-3" />
        </button>
      </div>

      {/* Action buttons */}
      <button
        onClick={onRefresh}
        disabled={isLoading}
        className="p-2 hover:bg-muted rounded transition-colors disabled:opacity-50"
        title="Refresh preview"
      >
        <RefreshCw className={cn("w-4 h-4", isLoading && "animate-spin")} />
      </button>
      
      <button
        onClick={onOpenExternal}
        className="p-2 hover:bg-muted rounded transition-colors"
        title="Open in new tab"
      >
        <ExternalLink className="w-4 h-4" />
      </button>
    </div>
  );
}