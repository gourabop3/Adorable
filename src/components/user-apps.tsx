"use client";

import { useBilling } from "@/contexts/billing-context";
import { AppCard } from "./app-card";
import { Button } from "./ui/button";
import { Plus, FolderOpen, Sparkles } from "lucide-react";
import Link from "next/link";

export function UserApps() {
  const { isAuthenticated } = useBilling();

  if (!isAuthenticated) {
    return (
      <div className="text-center py-16">
        <div className="w-20 h-20 bg-gradient-to-r from-blue-100 to-purple-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <Sparkles className="w-10 h-10 text-blue-600" />
        </div>
        <h3 className="text-2xl font-semibold text-gray-900 mb-4">
          Start Building Amazing Websites
        </h3>
        <p className="text-gray-600 mb-8 max-w-2xl mx-auto">
          Sign in to create your first AI-powered website. No coding required - just describe what you want and watch it come to life.
        </p>
        <Link href="/handler/sign-in">
          <Button size="lg" className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-8 py-3 rounded-xl font-semibold">
            <Plus className="w-5 h-5 mr-2" />
            Get Started Free
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold text-gray-900 mb-2">Your Projects</h2>
          <p className="text-gray-600">Manage and deploy your AI-generated websites</p>
        </div>
        <Link href="/app/new">
          <Button size="lg" className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-6 py-3 rounded-xl font-semibold">
            <Plus className="w-5 h-5 mr-2" />
            New Project
          </Button>
        </Link>
      </div>

      {/* Apps Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <AppCard />
      </div>

      {/* Empty State */}
      <div className="text-center py-16 border-2 border-dashed border-gray-200 rounded-2xl">
        <div className="w-16 h-16 bg-gradient-to-r from-blue-100 to-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <FolderOpen className="w-8 h-8 text-blue-600" />
        </div>
        <h3 className="text-xl font-semibold text-gray-900 mb-2">
          No projects yet
        </h3>
        <p className="text-gray-600 mb-6">
          Create your first AI-powered website to get started
        </p>
        <Link href="/app/new">
          <Button className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white">
            <Plus className="w-4 h-4 mr-2" />
            Create Your First Website
          </Button>
        </Link>
      </div>
    </div>
  );
}
