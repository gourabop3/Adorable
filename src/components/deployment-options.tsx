"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, Globe, Zap, AlertCircle } from "lucide-react";

interface DeploymentOptionsProps {
  onDeploy: (type: 'freestyle' | 'vercel') => void;
  isDeploying?: boolean;
}

export function DeploymentOptions({ onDeploy, isDeploying = false }: DeploymentOptionsProps) {
  const [selectedOption, setSelectedOption] = useState<'freestyle' | 'vercel'>('vercel');

  return (
    <div className="space-y-4">
      <div className="text-center">
        <h3 className="text-lg font-semibold">Choose Deployment Option</h3>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Select how you want to deploy your AI-generated app
        </p>
      </div>

      <RadioGroup
        value={selectedOption}
        onValueChange={(value) => setSelectedOption(value as 'freestyle' | 'vercel')}
        className="space-y-3"
      >
        {/* Vercel Option */}
        <Card className={`cursor-pointer transition-all ${
          selectedOption === 'vercel' 
            ? 'ring-2 ring-blue-500 bg-blue-50 dark:bg-blue-950/20' 
            : 'hover:bg-gray-50 dark:hover:bg-gray-900/50'
        }`}>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="vercel" id="vercel" />
                <Label htmlFor="vercel" className="text-lg font-semibold cursor-pointer">
                  Deploy to Vercel
                </Label>
              </div>
              <Badge variant="secondary" className="bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400">
                Recommended
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <span>Free subdomain (your-app.vercel.app)</span>
              </div>
              <div className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <span>No custom domain required</span>
              </div>
              <div className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <span>Automatic HTTPS & CDN</span>
              </div>
              <div className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <span>Global edge deployment</span>
              </div>
              <div className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400">
                <Zap className="h-4 w-4 text-blue-500" />
                <span>Super fast deployment</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Freestyle Option */}
        <Card className={`cursor-pointer transition-all ${
          selectedOption === 'freestyle' 
            ? 'ring-2 ring-purple-500 bg-purple-50 dark:bg-purple-950/20' 
            : 'hover:bg-gray-50 dark:hover:bg-gray-900/50'
        }`}>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="freestyle" id="freestyle" />
                <Label htmlFor="freestyle" className="text-lg font-semibold cursor-pointer">
                  Deploy to Freestyle
                </Label>
              </div>
              <Badge variant="outline" className="text-purple-600 border-purple-300 dark:text-purple-400 dark:border-purple-700">
                Advanced
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400">
                <AlertCircle className="h-4 w-4 text-orange-500" />
                <span>Custom domain required</span>
              </div>
              <div className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <span>Full control over deployment</span>
              </div>
              <div className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <span>Custom server configuration</span>
              </div>
              <div className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400">
                <Globe className="h-4 w-4 text-purple-500" />
                <span>Your own domain</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </RadioGroup>

      <div className="pt-4">
        <Button 
          onClick={() => onDeploy(selectedOption)}
          disabled={isDeploying}
          className="w-full"
          size="lg"
        >
          {isDeploying ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
              Deploying...
            </>
          ) : (
            `Deploy to ${selectedOption === 'vercel' ? 'Vercel' : 'Freestyle'}`
          )}
        </Button>
      </div>

      {selectedOption === 'vercel' && (
        <div className="text-xs text-gray-500 dark:text-gray-400 text-center">
          <p>You'll need to connect your Vercel account first.</p>
          <p>Get your token from <a href="https://vercel.com/account/tokens" target="_blank" rel="noopener noreferrer" className="underline">vercel.com/account/tokens</a></p>
        </div>
      )}
    </div>
  );
}