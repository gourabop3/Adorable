"use client";

import { useEffect, useRef, useState } from 'react';
import { Terminal as XTerm } from '@xterm/xterm';
import { FitAddon } from '@xterm/addon-fit';
import { WebLinksAddon } from '@xterm/addon-web-links';
import { WebContainerService } from '@/lib/webcontainer';
import { cn } from '@/lib/utils';
import { useTheme } from 'next-themes';

// Import xterm CSS
import '@xterm/xterm/css/xterm.css';

interface TerminalProps {
  className?: string;
  onCommand?: (command: string) => void;
}

export function Terminal({ className, onCommand }: TerminalProps) {
  const terminalRef = useRef<HTMLDivElement>(null);
  const xtermRef = useRef<XTerm | null>(null);
  const fitAddonRef = useRef<FitAddon | null>(null);
  const webcontainerService = useRef(WebContainerService.getInstance());
  const { theme } = useTheme();
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    if (!terminalRef.current) return;

    // Create terminal instance
    const terminal = new XTerm({
      theme: theme === 'dark' ? {
        background: '#0a0a0a',
        foreground: '#fafafa',
        cursor: '#fafafa',
        selection: '#44475a',
        black: '#000000',
        red: '#ff5555',
        green: '#50fa7b',
        yellow: '#f1fa8c',
        blue: '#bd93f9',
        magenta: '#ff79c6',
        cyan: '#8be9fd',
        white: '#bbbbbb',
        brightBlack: '#555555',
        brightRed: '#ff5555',
        brightGreen: '#50fa7b',
        brightYellow: '#f1fa8c',
        brightBlue: '#bd93f9',
        brightMagenta: '#ff79c6',
        brightCyan: '#8be9fd',
        brightWhite: '#ffffff'
      } : {
        background: '#ffffff',
        foreground: '#000000',
        cursor: '#000000',
        selection: '#e6e6e6',
      },
      fontFamily: 'ui-monospace, SFMono-Regular, "SF Mono", Consolas, "Liberation Mono", Menlo, monospace',
      fontSize: 13,
      lineHeight: 1.2,
      cursorBlink: true,
      allowTransparency: false,
    });

    // Add addons
    const fitAddon = new FitAddon();
    const webLinksAddon = new WebLinksAddon();
    
    terminal.loadAddon(fitAddon);
    terminal.loadAddon(webLinksAddon);

    // Open terminal in the DOM
    terminal.open(terminalRef.current);
    fitAddon.fit();

    // Store references
    xtermRef.current = terminal;
    fitAddonRef.current = fitAddon;

    // Initialize WebContainer and connect to terminal
    initializeTerminal(terminal);

    // Handle resize
    const handleResize = () => {
      if (fitAddon && terminal) {
        fitAddon.fit();
      }
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      terminal.dispose();
      xtermRef.current = null;
      fitAddonRef.current = null;
    };
  }, [theme]);

  const initializeTerminal = async (terminal: XTerm) => {
    try {
      const webcontainer = await webcontainerService.current.init();
      
      // Start a shell process
      const shellProcess = await webcontainer.spawn('sh', {
        terminal: {
          cols: terminal.cols,
          rows: terminal.rows,
        },
      });

      // Connect terminal output to xterm
      shellProcess.output.pipeTo(
        new WritableStream({
          write(data) {
            terminal.write(data);
          },
        })
      );

      // Connect xterm input to shell process
      const input = shellProcess.input.getWriter();
      terminal.onData((data) => {
        input.write(data);
        
        // Track commands for callback
        if (onCommand && data === '\r') {
          // This is a simple approach - in a real implementation you'd want to track the full command
          onCommand('command_executed');
        }
      });

      // Handle terminal resize
      terminal.onResize(({ cols, rows }) => {
        shellProcess.resize({ cols, rows });
      });

      // Initial prompt
      terminal.writeln('Welcome to WebContainer Terminal!');
      terminal.writeln('Type commands to interact with your project.');
      terminal.write('$ ');
      
      setIsReady(true);
    } catch (error) {
      console.error('Failed to initialize terminal:', error);
      terminal.writeln('Failed to initialize terminal. Please refresh the page.');
    }
  };

  const executeCommand = async (command: string) => {
    if (!xtermRef.current || !isReady) return;

    try {
      const result = await webcontainerService.current.executeCommand(command);
      xtermRef.current.writeln(result.stdout);
      if (result.stderr) {
        xtermRef.current.writeln(`Error: ${result.stderr}`);
      }
    } catch (error) {
      xtermRef.current.writeln(`Error: ${error}`);
    }
  };

  const clear = () => {
    if (xtermRef.current) {
      xtermRef.current.clear();
    }
  };

  const focus = () => {
    if (xtermRef.current) {
      xtermRef.current.focus();
    }
  };

  return (
    <div className={cn("relative", className)}>
      <div 
        ref={terminalRef} 
        className="w-full h-full bg-background border border-border rounded-lg overflow-hidden"
        style={{ minHeight: '300px' }}
      />
      {!isReady && (
        <div className="absolute inset-0 flex items-center justify-center bg-background/80 backdrop-blur-sm rounded-lg">
          <div className="flex items-center gap-2 text-muted-foreground">
            <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
            <span>Initializing terminal...</span>
          </div>
        </div>
      )}
    </div>
  );
}

interface TerminalHeaderProps {
  onClear?: () => void;
  onMinimize?: () => void;
  onMaximize?: () => void;
  className?: string;
}

export function TerminalHeader({ 
  onClear, 
  onMinimize, 
  onMaximize, 
  className 
}: TerminalHeaderProps) {
  return (
    <div className={cn(
      "flex items-center justify-between px-3 py-2 bg-muted/50 border-b border-border",
      className
    )}>
      <div className="flex items-center gap-2">
        <div className="flex gap-1">
          <div className="w-3 h-3 bg-red-500 rounded-full" />
          <div className="w-3 h-3 bg-yellow-500 rounded-full" />
          <div className="w-3 h-3 bg-green-500 rounded-full" />
        </div>
        <span className="text-sm font-medium text-muted-foreground">Terminal</span>
      </div>
      <div className="flex items-center gap-1">
        {onClear && (
          <button
            onClick={onClear}
            className="px-2 py-1 text-xs bg-background hover:bg-muted rounded transition-colors"
          >
            Clear
          </button>
        )}
        {onMinimize && (
          <button
            onClick={onMinimize}
            className="px-2 py-1 text-xs bg-background hover:bg-muted rounded transition-colors"
          >
            –
          </button>
        )}
        {onMaximize && (
          <button
            onClick={onMaximize}
            className="px-2 py-1 text-xs bg-background hover:bg-muted rounded transition-colors"
          >
            ⬜
          </button>
        )}
      </div>
    </div>
  );
}