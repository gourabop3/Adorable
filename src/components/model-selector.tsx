"use client";

import { cn } from "@/lib/utils";
import { ChevronDownIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export type SupportedModelId = "gemini-2.5-pro" | "gemini-2.0-flash-exp" | "gpt-4o" | "claude-3.5-sonnet" | "llama3-8b-8192" | "llama3-70b-8192" | "mixtral-8x7b-32768" | "gemma2-9b-it" | "llama3.1-8b-instant" | "llama3.1-70b-vision";

export const MODELS: Record<SupportedModelId, { name: string; provider: string }> = {
  "gemini-2.5-pro": { name: "Gemini 2.5 Pro", provider: "google" },
  "gemini-2.0-flash-exp": { name: "Gemini 2.0 Flash (exp)", provider: "google" },
  "gpt-4o": { name: "GPT-4o", provider: "openai" },
  "claude-3.5-sonnet": { name: "Claude 3.5 Sonnet", provider: "anthropic" },
  "llama3-8b-8192": { name: "Llama 3 8B", provider: "groq" },
  "llama3-70b-8192": { name: "Llama 3 70B", provider: "groq" },
  "mixtral-8x7b-32768": { name: "Mixtral 8x7B", provider: "groq" },
  "gemma2-9b-it": { name: "Gemma 2 9B", provider: "groq" },
  "llama3.1-8b-instant": { name: "Llama 3.1 8B Instant", provider: "groq" },
  "llama3.1-70b-vision": { name: "Llama 3.1 70B Vision", provider: "groq" },
};

export function ModelSelector({
  value = "gemini-2.5-pro",
  onChange,
  className,
}: {
  value?: SupportedModelId;
  onChange: (value: SupportedModelId) => void;
  className?: string;
}) {
  return (
    <div className={cn("relative", className)}>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            className="h-7 gap-2 px-2 text-xs bg-transparent border-none hover:bg-gray-100 hover:bg-opacity-50 shadow-none"
            style={{ boxShadow: "none" }}
          >
            {MODELS[value].name}
            <ChevronDownIcon className="h-3 w-3 opacity-70" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          align="start"
          className="min-w-[12rem] !shadow-none border border-gray-200"
          style={{ boxShadow: "none" }}
        >
          {Object.entries(MODELS).map(([key, model]) => (
            <DropdownMenuItem
              key={key}
              onClick={() => onChange(key as SupportedModelId)}
              className="gap-2 text-xs"
            >
              <div className="flex flex-col items-start">
                <span className="font-medium">{model.name}</span>
                <span className="text-xs text-gray-500 capitalize">{model.provider}</span>
              </div>
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}