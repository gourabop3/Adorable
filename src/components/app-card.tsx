"use client";

import { useState } from "react";
import { Button } from "./ui/button";
import { Card, CardContent, CardFooter, CardHeader } from "./ui/card";
import { Badge } from "./ui/badge";
import { 
  ExternalLink, 
  Settings, 
  Trash2, 
  Calendar, 
  Globe, 
  Code,
  MoreVertical,
  Play,
  Pause
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";

interface AppCardProps {
  id?: string;
  name?: string;
  createdAt?: Date;
  onDelete?: () => void;
}

export function AppCard({ id = "demo-app", name = "My Amazing Website", createdAt = new Date() }: AppCardProps) {
  const [isDeploying, setIsDeploying] = useState(false);
  const [isDeployed, setIsDeployed] = useState(false);

  const handleDeploy = async () => {
    setIsDeploying(true);
    // Simulate deployment
    setTimeout(() => {
      setIsDeploying(false);
      setIsDeployed(true);
    }, 2000);
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    }).format(date);
  };

  return (
    <Card className="group hover:shadow-lg transition-all duration-300 border border-gray-200 overflow-hidden">
      {/* Header with gradient background */}
      <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-4 border-b border-gray-100">
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-gray-900 truncate group-hover:text-blue-600 transition-colors duration-200">
              {name}
            </h3>
            <p className="text-sm text-gray-600 mt-1">AI-generated website</p>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem>
                <Settings className="mr-2 h-4 w-4" />
                Settings
              </DropdownMenuItem>
              <DropdownMenuItem className="text-red-600">
                <Trash2 className="mr-2 h-4 w-4" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Content */}
      <CardContent className="p-4">
        <div className="space-y-3">
          {/* Status Badge */}
          <div className="flex items-center space-x-2">
            <Badge variant={isDeployed ? "default" : "secondary"} className="text-xs">
              {isDeployed ? "Live" : "Draft"}
            </Badge>
            {isDeployed && (
              <Badge variant="outline" className="text-xs text-green-600 border-green-200">
                Deployed
              </Badge>
            )}
          </div>

          {/* App Info */}
          <div className="space-y-2">
            <div className="flex items-center text-sm text-gray-600">
              <Calendar className="w-4 h-4 mr-2" />
              Created {formatDate(createdAt)}
            </div>
            <div className="flex items-center text-sm text-gray-600">
              <Code className="w-4 h-4 mr-2" />
              Next.js Template
            </div>
          </div>

          {/* Preview Image Placeholder */}
          <div className="w-full h-32 bg-gradient-to-br from-gray-100 to-gray-200 rounded-lg flex items-center justify-center">
            <div className="text-center">
              <Globe className="w-8 h-8 text-gray-400 mx-auto mb-2" />
              <p className="text-xs text-gray-500">Preview</p>
            </div>
          </div>
        </div>
      </CardContent>

      {/* Footer */}
      <CardFooter className="p-4 pt-0 space-x-2">
        {!isDeployed ? (
          <Button 
            onClick={handleDeploy}
            disabled={isDeploying}
            className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white"
          >
            {isDeploying ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                Deploying...
              </>
            ) : (
              <>
                <Play className="w-4 h-4 mr-2" />
                Deploy
              </>
            )}
          </Button>
        ) : (
          <Button 
            variant="outline" 
            className="flex-1 border-green-200 text-green-700 hover:bg-green-50"
          >
            <Globe className="w-4 h-4 mr-2" />
            View Live
          </Button>
        )}
        
        <Button variant="outline" size="sm" className="px-3">
          <ExternalLink className="w-4 h-4" />
        </Button>
      </CardFooter>
    </Card>
  );
}
