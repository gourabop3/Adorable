"use client";

import { useState, useEffect, useRef } from 'react';
import { WebContainerService } from '@/lib/webcontainer';
import { cn } from '@/lib/utils';
import { 
  Folder, 
  FolderOpen, 
  File, 
  Plus, 
  MoreHorizontal,
  Edit,
  Trash2,
  Download,
  Upload,
  Search
} from 'lucide-react';

interface FileNode {
  name: string;
  path: string;
  type: 'file' | 'directory';
  children?: FileNode[];
  content?: string;
  language?: string;
}

interface FileExplorerProps {
  onFileSelect: (file: FileNode) => void;
  selectedFile?: string;
  className?: string;
}

export function FileExplorer({ onFileSelect, selectedFile, className }: FileExplorerProps) {
  const [files, setFiles] = useState<FileNode[]>([]);
  const [expandedDirs, setExpandedDirs] = useState<Set<string>>(new Set(['.']));
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const webcontainerService = useRef(WebContainerService.getInstance());

  const loadFileTree = async (path: string = '.'): Promise<FileNode[]> => {
    try {
      const entries = await webcontainerService.current.listDirectory(path);
      const nodes: FileNode[] = [];

      for (const entry of entries) {
        const fullPath = path === '.' ? entry : `${path}/${entry}`;
        
        try {
          // Try to read as file first
          const content = await webcontainerService.current.readFile(fullPath);
          nodes.push({
            name: entry,
            path: fullPath,
            type: 'file',
            content,
            language: getLanguageFromExtension(entry)
          });
        } catch {
          // If reading as file fails, it's a directory
          nodes.push({
            name: entry,
            path: fullPath,
            type: 'directory',
            children: []
          });
        }
      }

      return nodes.sort((a, b) => {
        // Directories first, then files
        if (a.type !== b.type) {
          return a.type === 'directory' ? -1 : 1;
        }
        return a.name.localeCompare(b.name);
      });
    } catch (error) {
      console.error('Failed to load directory:', error);
      return [];
    }
  };

  const getLanguageFromExtension = (filename: string): string => {
    const ext = filename.split('.').pop()?.toLowerCase();
    switch (ext) {
      case 'js':
      case 'jsx':
      case 'ts':
      case 'tsx':
        return 'javascript';
      case 'html':
        return 'html';
      case 'css':
      case 'scss':
      case 'sass':
        return 'css';
      case 'json':
        return 'json';
      case 'md':
      case 'markdown':
        return 'markdown';
      default:
        return 'javascript';
    }
  };

  const refreshFiles = async () => {
    setLoading(true);
    const rootFiles = await loadFileTree();
    setFiles(rootFiles);
    setLoading(false);
  };

  const toggleDirectory = async (path: string) => {
    const newExpanded = new Set(expandedDirs);
    
    if (expandedDirs.has(path)) {
      newExpanded.delete(path);
    } else {
      newExpanded.add(path);
      // Load children if not already loaded
      const updateFiles = (nodes: FileNode[]): FileNode[] => {
        return nodes.map(node => {
          if (node.path === path && node.type === 'directory' && !node.children?.length) {
            return { ...node, children: [] }; // Will be loaded by loadFileTree
          }
          if (node.children) {
            return { ...node, children: updateFiles(node.children) };
          }
          return node;
        });
      };
      
      // Load directory contents
      const children = await loadFileTree(path);
      const updateFilesWithChildren = (nodes: FileNode[]): FileNode[] => {
        return nodes.map(node => {
          if (node.path === path && node.type === 'directory') {
            return { ...node, children };
          }
          if (node.children) {
            return { ...node, children: updateFilesWithChildren(node.children) };
          }
          return node;
        });
      };
      
      setFiles(updateFilesWithChildren(files));
    }
    
    setExpandedDirs(newExpanded);
  };

  const createFile = async (dirPath: string, fileName: string) => {
    try {
      const filePath = dirPath === '.' ? fileName : `${dirPath}/${fileName}`;
      await webcontainerService.current.writeFile(filePath, '');
      refreshFiles();
    } catch (error) {
      console.error('Failed to create file:', error);
    }
  };

  const createDirectory = async (parentPath: string, dirName: string) => {
    try {
      const dirPath = parentPath === '.' ? dirName : `${parentPath}/${dirName}`;
      await webcontainerService.current.createDirectory(dirPath);
      refreshFiles();
    } catch (error) {
      console.error('Failed to create directory:', error);
    }
  };

  const deleteFile = async (filePath: string) => {
    try {
      // Note: WebContainer doesn't have a delete method in our current implementation
      // You would need to add this to the WebContainerService
      console.log('Delete file:', filePath);
      // await webcontainerService.current.deleteFile(filePath);
      // refreshFiles();
    } catch (error) {
      console.error('Failed to delete file:', error);
    }
  };

  const getFileIcon = (node: FileNode) => {
    if (node.type === 'directory') {
      return expandedDirs.has(node.path) ? 
        <FolderOpen className="w-4 h-4 text-blue-500" /> : 
        <Folder className="w-4 h-4 text-blue-500" />;
    }
    
    const ext = node.name.split('.').pop()?.toLowerCase();
    const iconClass = "w-4 h-4";
    
    switch (ext) {
      case 'js':
      case 'jsx':
        return <File className={`${iconClass} text-yellow-500`} />;
      case 'ts':
      case 'tsx':
        return <File className={`${iconClass} text-blue-600`} />;
      case 'html':
        return <File className={`${iconClass} text-orange-500`} />;
      case 'css':
      case 'scss':
      case 'sass':
        return <File className={`${iconClass} text-pink-500`} />;
      case 'json':
        return <File className={`${iconClass} text-green-500`} />;
      case 'md':
      case 'markdown':
        return <File className={`${iconClass} text-gray-500`} />;
      default:
        return <File className={`${iconClass} text-gray-400`} />;
    }
  };

  const filterFiles = (nodes: FileNode[], query: string): FileNode[] => {
    if (!query) return nodes;
    
    return nodes.filter(node => {
      if (node.name.toLowerCase().includes(query.toLowerCase())) {
        return true;
      }
      if (node.children) {
        const filteredChildren = filterFiles(node.children, query);
        return filteredChildren.length > 0;
      }
      return false;
    }).map(node => {
      if (node.children) {
        return { ...node, children: filterFiles(node.children, query) };
      }
      return node;
    });
  };

  const renderFileNode = (node: FileNode, depth: number = 0) => {
    const isSelected = selectedFile === node.path;
    const isExpanded = expandedDirs.has(node.path);

    return (
      <div key={node.path}>
        <div
          className={cn(
            "flex items-center gap-2 px-2 py-1 cursor-pointer hover:bg-muted/50 rounded-sm transition-colors",
            isSelected && "bg-primary/10 border-r-2 border-primary",
            "group"
          )}
          style={{ paddingLeft: `${depth * 12 + 8}px` }}
          onClick={() => {
            if (node.type === 'directory') {
              toggleDirectory(node.path);
            } else {
              onFileSelect(node);
            }
          }}
        >
          {getFileIcon(node)}
          <span className="text-sm truncate flex-1">{node.name}</span>
          
          <div className="opacity-0 group-hover:opacity-100 flex items-center gap-1">
            <button
              onClick={(e) => {
                e.stopPropagation();
                // Handle file actions
              }}
              className="p-1 hover:bg-muted rounded"
            >
              <MoreHorizontal className="w-3 h-3" />
            </button>
          </div>
        </div>
        
        {node.type === 'directory' && isExpanded && node.children && (
          <div>
            {node.children.map(child => renderFileNode(child, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  useEffect(() => {
    refreshFiles();
  }, []);

  const filteredFiles = filterFiles(files, searchQuery);

  return (
    <div className={cn("flex flex-col h-full", className)}>
      {/* File Explorer Header */}
      <div className="flex items-center justify-between px-3 py-2 bg-muted/50 border-b border-border">
        <span className="text-sm font-medium text-muted-foreground">Files</span>
        <div className="flex items-center gap-1">
          <button
            onClick={() => createFile('.', 'new-file.js')}
            className="p-1.5 hover:bg-muted rounded transition-colors"
            title="New file"
          >
            <Plus className="w-3 h-3" />
          </button>
          <button
            onClick={refreshFiles}
            className="p-1.5 hover:bg-muted rounded transition-colors"
            title="Refresh"
          >
            <Search className="w-3 h-3" />
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="p-2">
        <div className="relative">
          <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 w-3 h-3 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search files..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-7 pr-3 py-1.5 text-sm bg-background border border-border rounded focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>
      </div>

      {/* File Tree */}
      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="flex items-center gap-2 text-muted-foreground">
              <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
              <span className="text-sm">Loading files...</span>
            </div>
          </div>
        ) : filteredFiles.length === 0 ? (
          <div className="flex items-center justify-center py-8">
            <div className="text-center">
              <Folder className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">
                {searchQuery ? 'No files match your search' : 'No files found'}
              </p>
            </div>
          </div>
        ) : (
          <div className="p-1">
            {filteredFiles.map(node => renderFileNode(node))}
          </div>
        )}
      </div>
    </div>
  );
}

interface FileActionsProps {
  onNewFile: () => void;
  onNewFolder: () => void;
  onUpload: () => void;
  onDownload: () => void;
  onRefresh: () => void;
  className?: string;
}

export function FileActions({
  onNewFile,
  onNewFolder,
  onUpload,
  onDownload,
  onRefresh,
  className
}: FileActionsProps) {
  return (
    <div className={cn("flex items-center gap-1", className)}>
      <button
        onClick={onNewFile}
        className="p-2 hover:bg-muted rounded transition-colors"
        title="New file"
      >
        <Plus className="w-4 h-4" />
      </button>
      
      <button
        onClick={onNewFolder}
        className="p-2 hover:bg-muted rounded transition-colors"
        title="New folder"
      >
        <Folder className="w-4 h-4" />
      </button>
      
      <button
        onClick={onUpload}
        className="p-2 hover:bg-muted rounded transition-colors"
        title="Upload files"
      >
        <Upload className="w-4 h-4" />
      </button>
      
      <button
        onClick={onDownload}
        className="p-2 hover:bg-muted rounded transition-colors"
        title="Download project"
      >
        <Download className="w-4 h-4" />
      </button>
      
      <button
        onClick={onRefresh}
        className="p-2 hover:bg-muted rounded transition-colors"
        title="Refresh"
      >
        <Search className="w-4 h-4" />
      </button>
    </div>
  );
}