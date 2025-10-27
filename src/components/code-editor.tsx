"use client";

import { useEffect, useRef, useState } from 'react';
import { EditorView, basicSetup } from 'codemirror';
import { EditorState } from '@codemirror/state';
import { javascript } from '@codemirror/lang-javascript';
import { html } from '@codemirror/lang-html';
import { css } from '@codemirror/lang-css';
import { json } from '@codemirror/lang-json';
import { markdown } from '@codemirror/lang-markdown';
import { oneDark } from '@codemirror/theme-one-dark';
import { useTheme } from 'next-themes';
import { cn } from '@/lib/utils';

interface CodeEditorProps {
  value: string;
  onChange: (value: string) => void;
  language?: 'javascript' | 'html' | 'css' | 'json' | 'markdown';
  className?: string;
  readOnly?: boolean;
  placeholder?: string;
}

export function CodeEditor({
  value,
  onChange,
  language = 'javascript',
  className,
  readOnly = false,
  placeholder
}: CodeEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null);
  const viewRef = useRef<EditorView | null>(null);
  const { theme } = useTheme();

  const getLanguageExtension = (lang: string) => {
    switch (lang) {
      case 'javascript':
        return javascript();
      case 'html':
        return html();
      case 'css':
        return css();
      case 'json':
        return json();
      case 'markdown':
        return markdown();
      default:
        return javascript();
    }
  };

  useEffect(() => {
    if (!editorRef.current) return;

    const extensions = [
      basicSetup,
      getLanguageExtension(language),
      EditorView.updateListener.of((update) => {
        if (update.docChanged && !readOnly) {
          const newValue = update.state.doc.toString();
          onChange(newValue);
        }
      }),
      EditorView.theme({
        '&': {
          fontSize: '14px',
          fontFamily: 'ui-monospace, SFMono-Regular, "SF Mono", Consolas, "Liberation Mono", Menlo, monospace',
        },
        '.cm-content': {
          padding: '12px',
          minHeight: '200px',
        },
        '.cm-focused': {
          outline: 'none',
        },
        '.cm-editor': {
          borderRadius: '8px',
        },
        '.cm-scroller': {
          fontFamily: 'inherit',
        },
      }),
    ];

    if (theme === 'dark') {
      extensions.push(oneDark);
    }

    if (readOnly) {
      extensions.push(EditorState.readOnly.of(true));
    }

    const state = EditorState.create({
      doc: value,
      extensions,
    });

    const view = new EditorView({
      state,
      parent: editorRef.current,
    });

    viewRef.current = view;

    return () => {
      view.destroy();
      viewRef.current = null;
    };
  }, [language, theme, readOnly]);

  useEffect(() => {
    if (viewRef.current && value !== viewRef.current.state.doc.toString()) {
      const transaction = viewRef.current.state.update({
        changes: {
          from: 0,
          to: viewRef.current.state.doc.length,
          insert: value,
        },
      });
      viewRef.current.dispatch(transaction);
    }
  }, [value]);

  return (
    <div 
      className={cn(
        "border border-border rounded-lg overflow-hidden bg-background",
        className
      )}
    >
      <div ref={editorRef} />
    </div>
  );
}

interface FileTabsProps {
  files: { name: string; path: string; content: string; language?: string }[];
  activeFile: string;
  onFileSelect: (path: string) => void;
  onFileClose?: (path: string) => void;
  className?: string;
}

export function FileTabs({
  files,
  activeFile,
  onFileSelect,
  onFileClose,
  className
}: FileTabsProps) {
  const getFileIcon = (fileName: string) => {
    const ext = fileName.split('.').pop();
    switch (ext) {
      case 'js':
      case 'jsx':
      case 'ts':
      case 'tsx':
        return '📄';
      case 'html':
        return '🌐';
      case 'css':
        return '🎨';
      case 'json':
        return '📋';
      case 'md':
        return '📝';
      default:
        return '📄';
    }
  };

  return (
    <div className={cn("flex items-center gap-1 p-2 bg-muted/50 border-b", className)}>
      {files.map((file) => (
        <div
          key={file.path}
          className={cn(
            "flex items-center gap-2 px-3 py-1.5 rounded-md cursor-pointer transition-colors text-sm",
            activeFile === file.path
              ? "bg-background border border-border shadow-sm"
              : "hover:bg-muted"
          )}
          onClick={() => onFileSelect(file.path)}
        >
          <span className="text-xs">{getFileIcon(file.name)}</span>
          <span className="truncate max-w-32">{file.name}</span>
          {onFileClose && files.length > 1 && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onFileClose(file.path);
              }}
              className="ml-1 hover:bg-muted-foreground/20 rounded p-0.5 transition-colors"
            >
              <span className="text-xs">×</span>
            </button>
          )}
        </div>
      ))}
    </div>
  );
}