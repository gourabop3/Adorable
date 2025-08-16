import { createClient } from '@vercel/client';

export interface VercelDeploymentOptions {
  projectName: string;
  gitRepoUrl: string;
  framework?: 'nextjs' | 'react' | 'vue' | 'nuxt' | 'svelte';
  buildCommand?: string;
  outputDirectory?: string;
}

export interface VercelDeploymentResult {
  success: boolean;
  url?: string;
  error?: string;
  deploymentId?: string;
}

export class VercelDeploymentService {
  private client: ReturnType<typeof createClient>;

  constructor() {
    const token = process.env.VERCEL_TOKEN;
    if (!token) {
      throw new Error('VERCEL_TOKEN environment variable is required');
    }

    this.client = createClient({
      token,
    });
  }

  async deploySite(options: VercelDeploymentOptions): Promise<VercelDeploymentResult> {
    try {
      // Generate a unique project name
      const projectName = `${options.projectName}-${Date.now()}`;
      
      // Create a new Vercel project
      const project = await this.client.createProject({
        name: projectName,
        framework: options.framework || 'nextjs',
        gitRepository: {
          type: 'github',
          repo: options.gitRepoUrl,
        },
        buildCommand: options.buildCommand || 'npm run build',
        outputDirectory: options.outputDirectory || '.next',
      });

      // Trigger deployment
      const deployment = await this.client.createDeployment({
        projectId: project.id,
        target: 'production',
        gitSource: {
          type: 'github',
          repo: options.gitRepoUrl,
          ref: 'main',
        },
      });

      // Wait for deployment to complete
      let deploymentStatus = await this.client.getDeployment(deployment.id);
      let attempts = 0;
      const maxAttempts = 30; // 5 minutes max wait

      while (deploymentStatus.status !== 'READY' && attempts < maxAttempts) {
        await new Promise(resolve => setTimeout(resolve, 10000)); // Wait 10 seconds
        deploymentStatus = await this.client.getDeployment(deployment.id);
        attempts++;
      }

      if (deploymentStatus.status === 'READY') {
        return {
          success: true,
          url: deploymentStatus.url,
          deploymentId: deployment.id,
        };
      } else {
        return {
          success: false,
          error: `Deployment failed with status: ${deploymentStatus.status}`,
        };
      }
    } catch (error) {
      console.error('Vercel deployment error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown deployment error',
      };
    }
  }

  async deleteSite(deploymentId: string): Promise<boolean> {
    try {
      await this.client.deleteDeployment(deploymentId);
      return true;
    } catch (error) {
      console.error('Error deleting Vercel deployment:', error);
      return false;
    }
  }
}

// Export a singleton instance
export const vercelDeployment = new VercelDeploymentService();