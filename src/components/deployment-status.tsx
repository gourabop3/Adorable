"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ExternalLink, CheckCircle, Clock, AlertCircle, Globe } from "lucide-react";

interface DeploymentStatusProps {
  status: 'deploying' | 'success' | 'failed';
  deploymentUrl?: string;
  deploymentType: 'freestyle' | 'vercel';
  error?: string;
}

export function DeploymentStatus({ 
  status, 
  deploymentUrl, 
  deploymentType, 
  error 
}: DeploymentStatusProps) {
  const getStatusIcon = () => {
    switch (status) {
      case 'deploying':
        return <Clock className="h-5 w-5 text-blue-500 animate-spin" />;
      case 'success':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'failed':
        return <AlertCircle className="h-5 w-5 text-red-500" />;
    }
  };

  const getStatusText = () => {
    switch (status) {
      case 'deploying':
        return 'Deploying...';
      case 'success':
        return 'Deployed Successfully!';
      case 'failed':
        return 'Deployment Failed';
    }
  };

  const getStatusBadge = () => {
    switch (status) {
      case 'deploying':
        return <Badge variant="secondary" className="bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400">Deploying</Badge>;
      case 'success':
        return <Badge variant="secondary" className="bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400">Live</Badge>;
      case 'failed':
        return <Badge variant="secondary" className="bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400">Failed</Badge>;
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            {getStatusIcon()}
            <div>
              <CardTitle className="text-lg">{getStatusText()}</CardTitle>
              <CardDescription>
                Deployed to {deploymentType === 'vercel' ? 'Vercel' : 'Freestyle'}
              </CardDescription>
            </div>
          </div>
          {getStatusBadge()}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {status === 'success' && deploymentUrl && (
          <div className="space-y-3">
            <div className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400">
              <Globe className="h-4 w-4" />
              <span>Your app is now live at:</span>
            </div>
            <div className="bg-gray-100 dark:bg-gray-800 p-3 rounded-lg">
              <code className="text-sm break-all">{deploymentUrl}</code>
            </div>
            <Button 
              onClick={() => window.open(deploymentUrl, '_blank')}
              className="w-full"
              size="lg"
            >
              <ExternalLink className="h-4 w-4 mr-2" />
              Open Live Site
            </Button>
          </div>
        )}

        {status === 'failed' && error && (
          <div className="space-y-3">
            <div className="bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 p-3 rounded-lg">
              <p className="text-sm text-red-800 dark:text-red-200">
                <strong>Error:</strong> {error}
              </p>
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Please check your configuration and try again. If the problem persists, contact support.
            </p>
          </div>
        )}

        {status === 'deploying' && (
          <div className="space-y-3">
            <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 p-3 rounded-lg">
              <p className="text-sm text-blue-800 dark:text-blue-200">
                Your app is being deployed to {deploymentType === 'vercel' ? 'Vercel' : 'Freestyle'}.
                This usually takes 2-5 minutes.
              </p>
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              You'll receive a notification when deployment is complete.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}