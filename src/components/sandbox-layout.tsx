"use client";

import { useState, useRef, useEffect } from 'react';
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from '@/components/ui/resizable-panels';
import { CodeEditor, FileTabs } from './code-editor';
import { Terminal, TerminalHeader } from './terminal';
import { PreviewPane } from './preview-pane';
import { FileExplorer } from './file-explorer';
import Chat from './chat';
import { WebContainerService } from '@/lib/webcontainer';
import { cn } from '@/lib/utils';
import { UIMessage } from 'ai';
import { 
  PanelLeftClose, 
  PanelLeftOpen, 
  PanelBottomClose, 
  PanelBottomOpen,
  Settings,
  Play,
  Square,
  RotateCcw
} from 'lucide-react';

interface FileNode {
  name: string;
  path: string;
  type: 'file' | 'directory';
  children?: FileNode[];
  content?: string;
  language?: string;
}

interface SandboxLayoutProps {
  appId: string;
  initialMessages: UIMessage[];
  isLoading?: boolean;
  running: boolean;
  selectedModel?: string;
  className?: string;
}

export function SandboxLayout({
  appId,
  initialMessages,
  isLoading = false,
  running,
  selectedModel,
  className
}: SandboxLayoutProps) {
  // Panel visibility states
  const [showSidebar, setShowSidebar] = useState(true);
  const [showTerminal, setShowTerminal] = useState(true);
  
  // File management states
  const [openFiles, setOpenFiles] = useState<FileNode[]>([]);
  const [activeFile, setActiveFile] = useState<string>('');
  const [fileContents, setFileContents] = useState<Record<string, string>>({});
  
  // WebContainer service
  const webcontainerService = useRef(WebContainerService.getInstance());
  
  // Project state
  const [isProjectRunning, setIsProjectRunning] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string>('');

  const handleFileSelect = (file: FileNode) => {
    if (file.type === 'file') {
      // Add to open files if not already open
      if (!openFiles.find(f => f.path === file.path)) {
        setOpenFiles(prev => [...prev, file]);
      }
      
      // Set as active file
      setActiveFile(file.path);
      
      // Load file content if not already loaded
      if (file.content && !fileContents[file.path]) {
        setFileContents(prev => ({
          ...prev,
          [file.path]: file.content!
        }));
      }
    }
  };

  const handleFileClose = (filePath: string) => {
    setOpenFiles(prev => prev.filter(f => f.path !== filePath));
    
    if (activeFile === filePath) {
      const remainingFiles = openFiles.filter(f => f.path !== filePath);
      setActiveFile(remainingFiles.length > 0 ? remainingFiles[0].path : '');
    }
    
    // Remove from file contents
    setFileContents(prev => {
      const newContents = { ...prev };
      delete newContents[filePath];
      return newContents;
    });
  };

  const handleFileContentChange = async (filePath: string, content: string) => {
    setFileContents(prev => ({
      ...prev,
      [filePath]: content
    }));
    
    // Save to WebContainer
    try {
      await webcontainerService.current.writeFile(filePath, content);
    } catch (error) {
      console.error('Failed to save file:', error);
    }
  };

  const startProject = async () => {
    setIsProjectRunning(true);
    try {
      // Create a default React project if no files exist
      if (openFiles.length === 0) {
        await webcontainerService.current.createProject('react');
        // Refresh file explorer would be triggered here
      }
      
      const url = await webcontainerService.current.startDevServer();
      setPreviewUrl(url);
    } catch (error) {
      console.error('Failed to start project:', error);
      setIsProjectRunning(false);
    }
  };

  const stopProject = () => {
    setIsProjectRunning(false);
    // Stop the dev server - would need to implement this in WebContainerService
  };

  const restartProject = async () => {
    stopProject();
    await new Promise(resolve => setTimeout(resolve, 1000));
    startProject();
  };

  const getActiveFileLanguage = () => {
    const file = openFiles.find(f => f.path === activeFile);
    return file?.language || 'javascript';
  };

  return (
    <div className={cn("flex flex-col h-screen bg-background", className)}>
      {/* Top Toolbar */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-border bg-muted/30">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowSidebar(!showSidebar)}
            className="p-2 hover:bg-muted rounded transition-colors"
            title={showSidebar ? "Hide sidebar" : "Show sidebar"}
          >
            {showSidebar ? <PanelLeftClose className="w-4 h-4" /> : <PanelLeftOpen className="w-4 h-4" />}
          </button>
          
          <div className="h-4 w-px bg-border" />
          
          <div className="flex items-center gap-1">
            <button
              onClick={isProjectRunning ? stopProject : startProject}
              disabled={isLoading}
              className={cn(
                "flex items-center gap-2 px-3 py-1.5 rounded transition-colors text-sm font-medium",
                isProjectRunning 
                  ? "bg-red-500 hover:bg-red-600 text-white" 
                  : "bg-green-500 hover:bg-green-600 text-white"
              )}
            >
              {isProjectRunning ? <Square className="w-3 h-3" /> : <Play className="w-3 h-3" />}
              {isProjectRunning ? "Stop" : "Run"}
            </button>
            
            <button
              onClick={restartProject}
              disabled={!isProjectRunning || isLoading}
              className="p-1.5 hover:bg-muted rounded transition-colors disabled:opacity-50"
              title="Restart project"
            >
              <RotateCcw className="w-3 h-3" />
            </button>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowTerminal(!showTerminal)}
            className="p-2 hover:bg-muted rounded transition-colors"
            title={showTerminal ? "Hide terminal" : "Show terminal"}
          >
            {showTerminal ? <PanelBottomClose className="w-4 h-4" /> : <PanelBottomOpen className="w-4 h-4" />}
          </button>
          
          <button className="p-2 hover:bg-muted rounded transition-colors" title="Settings">
            <Settings className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-hidden">
        <ResizablePanelGroup direction="horizontal">
          {/* Sidebar */}
          {showSidebar && (
            <>
              <ResizablePanel defaultSize={20} minSize={15} maxSize={40}>
                <div className="h-full border-r border-border">
                  <FileExplorer
                    onFileSelect={handleFileSelect}
                    selectedFile={activeFile}
                  />
                </div>
              </ResizablePanel>
              <ResizableHandle />
            </>
          )}

          {/* Main Content Area */}
          <ResizablePanel defaultSize={showSidebar ? 60 : 80}>
            <ResizablePanelGroup direction="horizontal">
              {/* Editor + Chat */}
              <ResizablePanel defaultSize={60}>
                <ResizablePanelGroup direction="vertical">
                  {/* Editor */}
                  <ResizablePanel defaultSize={showTerminal ? 70 : 100}>
                    <div className="h-full flex flex-col">
                      {openFiles.length > 0 && (
                        <FileTabs
                          files={openFiles}
                          activeFile={activeFile}
                          onFileSelect={setActiveFile}
                          onFileClose={handleFileClose}
                        />
                      )}
                      
                      <div className="flex-1">
                        {activeFile && fileContents[activeFile] !== undefined ? (
                          <CodeEditor
                            value={fileContents[activeFile]}
                            onChange={(content) => handleFileContentChange(activeFile, content)}
                            language={getActiveFileLanguage()}
                            className="h-full"
                          />
                        ) : (
                          <div className="flex items-center justify-center h-full bg-muted/10">
                            <div className="text-center">
                              <div className="text-4xl mb-4">📝</div>
                              <h3 className="text-lg font-medium mb-2">No File Selected</h3>
                              <p className="text-muted-foreground text-sm">
                                Select a file from the explorer or create a new one to start coding
                              </p>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </ResizablePanel>

                  {/* Terminal */}
                  {showTerminal && (
                    <>
                      <ResizableHandle />
                      <ResizablePanel defaultSize={30} minSize={20}>
                        <div className="h-full border-t border-border">
                          <TerminalHeader
                            onClear={() => {/* Implement clear */}}
                          />
                          <Terminal className="h-full" />
                        </div>
                      </ResizablePanel>
                    </>
                  )}
                </ResizablePanelGroup>
              </ResizablePanel>

              <ResizableHandle />

              {/* Preview + Chat */}
              <ResizablePanel defaultSize={40}>
                <ResizablePanelGroup direction="vertical">
                  {/* Preview */}
                  <ResizablePanel defaultSize={50}>
                    <PreviewPane
                      onUrlChange={setPreviewUrl}
                      className="h-full border-l border-border"
                    />
                  </ResizablePanel>

                  <ResizableHandle />

                  {/* Chat */}
                  <ResizablePanel defaultSize={50}>
                    <div className="h-full border-t border-l border-border">
                      <Chat
                        appId={appId}
                        initialMessages={initialMessages}
                        isLoading={isLoading}
                        running={running}
                        selectedModel={selectedModel}
                      />
                    </div>
                  </ResizablePanel>
                </ResizablePanelGroup>
              </ResizablePanel>
            </ResizablePanelGroup>
          </ResizablePanel>
        </ResizablePanelGroup>
      </div>
    </div>
  );
}

export default SandboxLayout;