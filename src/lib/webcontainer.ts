import { WebContainer } from '@webcontainer/api';

export class WebContainerService {
  private static instance: WebContainerService;
  private webcontainer: WebContainer | null = null;
  private isBooting = false;

  private constructor() {}

  static getInstance(): WebContainerService {
    if (!WebContainerService.instance) {
      WebContainerService.instance = new WebContainerService();
    }
    return WebContainerService.instance;
  }

  async init(): Promise<WebContainer> {
    if (this.webcontainer) {
      return this.webcontainer;
    }

    if (this.isBooting) {
      // Wait for the current boot to complete
      while (this.isBooting) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
      return this.webcontainer!;
    }

    this.isBooting = true;
    try {
      this.webcontainer = await WebContainer.boot();
      console.log('WebContainer booted successfully');
      return this.webcontainer;
    } finally {
      this.isBooting = false;
    }
  }

  async writeFile(path: string, content: string): Promise<void> {
    const container = await this.init();
    await container.fs.writeFile(path, content);
  }

  async readFile(path: string): Promise<string> {
    const container = await this.init();
    const content = await container.fs.readFile(path, 'utf-8');
    return content;
  }

  async createDirectory(path: string): Promise<void> {
    const container = await this.init();
    await container.fs.mkdir(path, { recursive: true });
  }

  async listDirectory(path: string = '.'): Promise<string[]> {
    const container = await this.init();
    const entries = await container.fs.readdir(path, { withFileTypes: true });
    return entries.map(entry => entry.name);
  }

  async executeCommand(command: string, args: string[] = []): Promise<{
    stdout: string;
    stderr: string;
    exitCode: number;
  }> {
    const container = await this.init();
    
    return new Promise((resolve) => {
      let stdout = '';
      let stderr = '';
      
      const process = container.spawn(command, args);
      
      process.output.pipeTo(new WritableStream({
        write(data) {
          stdout += data;
        }
      }));
      
      process.exit.then((exitCode) => {
        resolve({ stdout, stderr, exitCode });
      });
    });
  }

  async installDependencies(): Promise<void> {
    console.log('Installing dependencies...');
    await this.executeCommand('npm', ['install']);
  }

  async startDevServer(): Promise<string> {
    const container = await this.init();
    
    // Start the dev server
    const serverProcess = await container.spawn('npm', ['run', 'dev']);
    
    // Wait for server to be ready and return the URL
    container.on('server-ready', (port, url) => {
      console.log(`Server ready at ${url}`);
    });

    // Return the preview URL
    return container.url;
  }

  async createProject(template: 'react' | 'nextjs' | 'vue' | 'vanilla' = 'react'): Promise<void> {
    const templates = {
      react: {
        'package.json': JSON.stringify({
          name: 'react-app',
          version: '1.0.0',
          scripts: {
            dev: 'vite',
            build: 'vite build',
            preview: 'vite preview'
          },
          dependencies: {
            react: '^18.2.0',
            'react-dom': '^18.2.0'
          },
          devDependencies: {
            '@types/react': '^18.2.0',
            '@types/react-dom': '^18.2.0',
            '@vitejs/plugin-react': '^4.0.0',
            vite: '^4.4.0'
          }
        }, null, 2),
        'index.html': `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>React App</title>
</head>
<body>
    <div id="root"></div>
    <script type="module" src="/src/main.jsx"></script>
</body>
</html>`,
        'src/main.jsx': `import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)`,
        'src/App.jsx': `import { useState } from 'react'
import './App.css'

function App() {
  const [count, setCount] = useState(0)

  return (
    <div className="App">
      <h1>Hello React!</h1>
      <div className="card">
        <button onClick={() => setCount((count) => count + 1)}>
          count is {count}
        </button>
      </div>
    </div>
  )
}

export default App`,
        'src/App.css': `#root {
  max-width: 1280px;
  margin: 0 auto;
  padding: 2rem;
  text-align: center;
}

.App {
  padding: 2rem;
}

.card {
  padding: 2em;
}

button {
  border-radius: 8px;
  border: 1px solid transparent;
  padding: 0.6em 1.2em;
  font-size: 1em;
  font-weight: 500;
  font-family: inherit;
  background-color: #1a1a1a;
  color: white;
  cursor: pointer;
  transition: border-color 0.25s;
}

button:hover {
  border-color: #646cff;
}`,
        'src/index.css': `body {
  margin: 0;
  display: flex;
  place-items: center;
  min-width: 320px;
  min-height: 100vh;
}

#root {
  width: 100%;
}`
      },
      nextjs: {
        'package.json': JSON.stringify({
          name: 'nextjs-app',
          version: '1.0.0',
          scripts: {
            dev: 'next dev',
            build: 'next build',
            start: 'next start'
          },
          dependencies: {
            next: '^14.0.0',
            react: '^18.2.0',
            'react-dom': '^18.2.0'
          },
          devDependencies: {
            '@types/react': '^18.2.0',
            '@types/react-dom': '^18.2.0',
            typescript: '^5.0.0'
          }
        }, null, 2),
        'pages/index.js': `export default function Home() {
  return (
    <div>
      <h1>Hello Next.js!</h1>
      <p>Welcome to your new Next.js application.</p>
    </div>
  )
}`
      }
    };

    const files = templates[template];
    
    for (const [path, content] of Object.entries(files)) {
      const dir = path.split('/').slice(0, -1).join('/');
      if (dir) {
        await this.createDirectory(dir);
      }
      await this.writeFile(path, content);
    }
  }

  getWebContainer(): WebContainer | null {
    return this.webcontainer;
  }
}