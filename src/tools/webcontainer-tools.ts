import { WebContainerService } from '@/lib/webcontainer';
import { z } from 'zod';

const webcontainerService = WebContainerService.getInstance();

export const webcontainerTools = {
  create_file: {
    description: 'Create a new file in the WebContainer with specified content',
    parameters: z.object({
      path: z.string().describe('The file path relative to project root'),
      content: z.string().describe('The content to write to the file'),
    }),
    execute: async ({ path, content }: { path: string; content: string }) => {
      try {
        await webcontainerService.writeFile(path, content);
        return {
          success: true,
          message: `File '${path}' created successfully`,
          path
        };
      } catch (error) {
        return {
          success: false,
          error: `Failed to create file '${path}': ${error}`,
        };
      }
    },
  },

  read_file: {
    description: 'Read the contents of a file from the WebContainer',
    parameters: z.object({
      path: z.string().describe('The file path to read'),
    }),
    execute: async ({ path }: { path: string }) => {
      try {
        const content = await webcontainerService.readFile(path);
        return {
          success: true,
          content,
          path
        };
      } catch (error) {
        return {
          success: false,
          error: `Failed to read file '${path}': ${error}`,
        };
      }
    },
  },

  update_file: {
    description: 'Update an existing file in the WebContainer',
    parameters: z.object({
      path: z.string().describe('The file path to update'),
      content: z.string().describe('The new content for the file'),
    }),
    execute: async ({ path, content }: { path: string; content: string }) => {
      try {
        await webcontainerService.writeFile(path, content);
        return {
          success: true,
          message: `File '${path}' updated successfully`,
          path
        };
      } catch (error) {
        return {
          success: false,
          error: `Failed to update file '${path}': ${error}`,
        };
      }
    },
  },

  list_files: {
    description: 'List files and directories in a specified path',
    parameters: z.object({
      path: z.string().optional().describe('The directory path to list (defaults to root)'),
    }),
    execute: async ({ path = '.' }: { path?: string }) => {
      try {
        const entries = await webcontainerService.listDirectory(path);
        return {
          success: true,
          entries,
          path
        };
      } catch (error) {
        return {
          success: false,
          error: `Failed to list directory '${path}': ${error}`,
        };
      }
    },
  },

  create_directory: {
    description: 'Create a new directory in the WebContainer',
    parameters: z.object({
      path: z.string().describe('The directory path to create'),
    }),
    execute: async ({ path }: { path: string }) => {
      try {
        await webcontainerService.createDirectory(path);
        return {
          success: true,
          message: `Directory '${path}' created successfully`,
          path
        };
      } catch (error) {
        return {
          success: false,
          error: `Failed to create directory '${path}': ${error}`,
        };
      }
    },
  },

  execute_command: {
    description: 'Execute a shell command in the WebContainer',
    parameters: z.object({
      command: z.string().describe('The command to execute'),
      args: z.array(z.string()).optional().describe('Command arguments'),
    }),
    execute: async ({ command, args = [] }: { command: string; args?: string[] }) => {
      try {
        const result = await webcontainerService.executeCommand(command, args);
        return {
          success: true,
          stdout: result.stdout,
          stderr: result.stderr,
          exitCode: result.exitCode,
          command: `${command} ${args.join(' ')}`.trim()
        };
      } catch (error) {
        return {
          success: false,
          error: `Failed to execute command '${command}': ${error}`,
        };
      }
    },
  },

  install_dependencies: {
    description: 'Install npm dependencies in the WebContainer',
    parameters: z.object({
      packages: z.array(z.string()).optional().describe('Specific packages to install (if empty, runs npm install)'),
    }),
    execute: async ({ packages = [] }: { packages?: string[] }) => {
      try {
        if (packages.length > 0) {
          const result = await webcontainerService.executeCommand('npm', ['install', ...packages]);
          return {
            success: true,
            message: `Installed packages: ${packages.join(', ')}`,
            stdout: result.stdout,
            stderr: result.stderr
          };
        } else {
          await webcontainerService.installDependencies();
          return {
            success: true,
            message: 'Dependencies installed successfully'
          };
        }
      } catch (error) {
        return {
          success: false,
          error: `Failed to install dependencies: ${error}`,
        };
      }
    },
  },

  start_dev_server: {
    description: 'Start the development server for the project',
    parameters: z.object({
      script: z.string().optional().describe('The npm script to run (defaults to "dev")'),
    }),
    execute: async ({ script = 'dev' }: { script?: string }) => {
      try {
        const url = await webcontainerService.startDevServer();
        return {
          success: true,
          message: 'Development server started successfully',
          url,
          script
        };
      } catch (error) {
        return {
          success: false,
          error: `Failed to start dev server: ${error}`,
        };
      }
    },
  },

  create_project: {
    description: 'Create a new project with a specified template',
    parameters: z.object({
      template: z.enum(['react', 'nextjs', 'vue', 'vanilla']).describe('The project template to use'),
    }),
    execute: async ({ template }: { template: 'react' | 'nextjs' | 'vue' | 'vanilla' }) => {
      try {
        await webcontainerService.createProject(template);
        return {
          success: true,
          message: `${template} project created successfully`,
          template
        };
      } catch (error) {
        return {
          success: false,
          error: `Failed to create ${template} project: ${error}`,
        };
      }
    },
  },

  write_package_json: {
    description: 'Create or update package.json with specified configuration',
    parameters: z.object({
      name: z.string().describe('Project name'),
      dependencies: z.record(z.string()).optional().describe('Dependencies object'),
      devDependencies: z.record(z.string()).optional().describe('Dev dependencies object'),
      scripts: z.record(z.string()).optional().describe('NPM scripts'),
    }),
    execute: async ({ 
      name, 
      dependencies = {}, 
      devDependencies = {}, 
      scripts = {} 
    }: { 
      name: string; 
      dependencies?: Record<string, string>; 
      devDependencies?: Record<string, string>; 
      scripts?: Record<string, string>; 
    }) => {
      try {
        const packageJson = {
          name,
          version: '1.0.0',
          private: true,
          scripts: {
            dev: 'vite',
            build: 'vite build',
            preview: 'vite preview',
            ...scripts
          },
          dependencies,
          devDependencies
        };

        await webcontainerService.writeFile('package.json', JSON.stringify(packageJson, null, 2));
        return {
          success: true,
          message: 'package.json created successfully',
          packageJson
        };
      } catch (error) {
        return {
          success: false,
          error: `Failed to create package.json: ${error}`,
        };
      }
    },
  },
};

export type WebContainerTool = keyof typeof webcontainerTools;