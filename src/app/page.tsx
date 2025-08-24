"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { 
  ImageIcon, 
  Globe, 
  Send, 
  Star, 
  HelpCircle, 
  Settings, 
  LogOut,
  User
} from "lucide-react";

export default function Home() {
  const [appDescription, setAppDescription] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!appDescription.trim()) return;
    
    setIsSubmitting(true);
    // Simulate API call
    setTimeout(() => {
      setIsSubmitting(false);
      setAppDescription("");
      // Here you would typically redirect to app creation or show success
    }, 2000);
  };

  return (
    <div className="min-h-screen bg-white text-gray-900">
      {/* Header */}
      <header className="flex items-center justify-between p-6 border-b border-gray-200">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 bg-blue-600 rounded flex items-center justify-center">
            <span className="text-white font-bold text-sm">R</span>
          </div>
          <span className="text-xl font-bold text-gray-900">Rork</span>
        </div>
        
        {/* Profile Dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="p-2">
              <div className="w-8 h-8 bg-blue-600 rounded flex items-center justify-center">
                <span className="text-white font-bold text-sm">G</span>
              </div>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent 
            align="end" 
            className="w-80 bg-white border-gray-200 text-gray-900 shadow-lg"
          >
            {/* User Info */}
            <div className="p-4 border-b border-gray-200">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-blue-600 rounded flex items-center justify-center">
                  <span className="text-white font-bold">G</span>
                </div>
                <div>
                  <p className="font-medium text-gray-900">Gourab</p>
                  <p className="text-sm text-gray-500">gourabxopm@gmail.com</p>
                </div>
              </div>
            </div>

            {/* Daily Usage */}
            <div className="p-4 border-b border-gray-200">
              <div className="flex items-center justify-between mb-2">
                <span className="font-medium text-gray-900">Daily Usage</span>
                <span className="text-sm text-gray-600">2 / 5</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
                <div className="bg-blue-600 h-2 rounded-full" style={{ width: '40%' }}></div>
              </div>
              <p className="text-xs text-gray-500">Monthly limit: 5 messages</p>
            </div>

            {/* Menu Items */}
            <div className="p-2">
              <DropdownMenuItem className="flex items-center space-x-3 p-3 hover:bg-gray-100 rounded cursor-pointer text-gray-700">
                <Star className="w-4 h-4" />
                <span>Upgrade Plan</span>
              </DropdownMenuItem>
              <DropdownMenuItem className="flex items-center space-x-3 p-3 hover:bg-gray-100 rounded cursor-pointer text-gray-700">
                <HelpCircle className="w-4 h-4" />
                <span>FAQ</span>
              </DropdownMenuItem>
              <DropdownMenuItem className="flex items-center space-x-3 p-3 hover:bg-gray-100 rounded cursor-pointer text-gray-700">
                <Settings className="w-4 h-4" />
                <span>Account settings</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator className="bg-gray-200" />
              <DropdownMenuItem className="flex items-center space-x-3 p-3 hover:bg-gray-100 rounded cursor-pointer text-red-600">
                <LogOut className="w-4 h-4" />
                <span>Log out</span>
              </DropdownMenuItem>
            </div>
          </DropdownMenuContent>
        </DropdownMenu>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-6 py-12">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold mb-4 text-gray-900">
            Build native mobile apps, fast.
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Rork builds complete, cross-platform mobile apps using AI and React Native.
          </p>
        </div>

        {/* App Description Input */}
        <div className="max-w-3xl mx-auto mb-16">
          <div className="relative bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
            <textarea
              value={appDescription}
              onChange={(e) => setAppDescription(e.target.value)}
              placeholder="Describe the mobile app you want to build..."
              className="w-full bg-transparent text-gray-900 placeholder-gray-500 resize-none border-none outline-none text-lg min-h-[120px]"
              rows={4}
            />
            
            {/* Bottom Actions */}
            <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-200">
              <div className="flex items-center space-x-4">
                <button className="flex items-center space-x-2 text-gray-500 hover:text-gray-700 transition-colors">
                  <ImageIcon className="w-5 h-5" />
                  <span className="text-sm">Upload Image</span>
                </button>
              </div>
              
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2 text-gray-500">
                  <Globe className="w-4 h-4" />
                  <span className="text-sm">Public</span>
                </div>
                
                <Button
                  onClick={handleSubmit}
                  disabled={!appDescription.trim() || isSubmitting}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  ) : (
                    <Send className="w-4 h-4" />
                  )}
                  <span>{isSubmitting ? "Building..." : "Build App"}</span>
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Your Projects Section */}
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl font-bold mb-6 text-gray-900">Your Projects</h2>
          <div className="bg-white rounded-lg border border-gray-200 p-8 text-center shadow-sm">
            <div className="text-gray-500 mb-4">
              <User className="w-12 h-12 mx-auto mb-2" />
              <p>No projects yet</p>
              <p className="text-sm">Start by describing your first mobile app above</p>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-200 mt-16">
        <div className="max-w-4xl mx-auto px-6 py-8">
          <div className="flex items-center justify-center space-x-6 text-sm text-gray-500">
            <a href="#" className="hover:text-gray-700 transition-colors">FAQ</a>
            <span>•</span>
            <a href="#" className="hover:text-gray-700 transition-colors">Terms</a>
            <span>•</span>
            <a href="#" className="hover:text-gray-700 transition-colors">Privacy</a>
            <span>•</span>
            <a href="#" className="hover:text-gray-700 transition-colors">Showcase</a>
            <span>•</span>
            <a href="#" className="hover:text-gray-700 transition-colors">Affiliates</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
