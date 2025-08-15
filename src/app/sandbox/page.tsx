"use client";

import { useState } from 'react';
import SandboxLayout from '@/components/sandbox-layout';
import { UIMessage } from 'ai';
import { generateId } from 'ai';

export default function SandboxPage() {
  const [appId] = useState(() => generateId());
  
  const initialMessages: UIMessage[] = [
    {
      id: generateId(),
      role: 'assistant',
      parts: [
        {
          type: 'text',
          text: `Welcome to the Adorable Sandbox! 🚀

I'm here to help you build amazing web applications. I can:

• **Generate Code**: Create React, Next.js, Vue, or vanilla JavaScript projects
• **Live Preview**: See your changes instantly in the preview pane
• **File Management**: Create, edit, and organize your project files
• **Terminal Access**: Run commands and manage dependencies
• **Real-time Collaboration**: Chat with me while coding

**Getting Started:**
1. Ask me to create a new project (e.g., "Create a React todo app")
2. I'll generate the code and files for you
3. Use the editor to make changes
4. See the results live in the preview

**Example prompts:**
- "Create a React calculator app"
- "Build a landing page with Tailwind CSS"
- "Make a simple game with vanilla JavaScript"
- "Add a new feature to the current project"

What would you like to build today?`
        }
      ]
    }
  ];

  return (
    <div className="h-screen">
      <SandboxLayout
        appId={appId}
        initialMessages={initialMessages}
        isLoading={false}
        running={false}
        selectedModel="gemini-2.5-pro"
      />
    </div>
  );
}