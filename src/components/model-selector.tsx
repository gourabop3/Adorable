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

export type SupportedModelId = "gemini-2.0-flash-exp" | "gemini-2.5-pro" | "gpt-4.1";

export const MODELS: Record<SupportedModelId, { name: string }> = {
  "gemini-2.0-flash-exp": { name: "Gemini 2.0 Flash (exp)" },
  "gemini-2.5-pro": { name: "Gemini 2.5 Pro" },
  "gpt-4.1": { name: "GPT-4.1" },
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
              {model.name}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}