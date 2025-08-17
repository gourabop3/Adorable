"use client";

import { useState, useRef, useEffect } from "react";
import { Check, ChevronDown, Brain, Zap, Crown, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

const models = [
  {
    id: "gemini-2.5-pro",
    name: "Gemini 2.5 Pro",
    description: "Google's most advanced AI model",
    icon: <Brain className="w-4 h-4" />,
    color: "from-blue-500 to-purple-500",
    tier: "premium"
  },
  {
    id: "gpt-4o",
    name: "GPT-4o",
    description: "OpenAI's latest flagship model",
    icon: <Crown className="w-4 h-4" />,
    color: "from-emerald-500 to-teal-500",
    tier: "premium"
  },
  {
    id: "claude-3-5-sonnet",
    name: "Claude 3.5 Sonnet",
    description: "Anthropic's balanced AI model",
    icon: <Sparkles className="w-4 h-4" />,
    color: "from-orange-500 to-red-500",
    tier: "premium"
  },
  {
    id: "gpt-3.5-turbo",
    name: "GPT-3.5 Turbo",
    description: "Fast and cost-effective",
    icon: <Zap className="w-4 h-4" />,
    color: "from-green-500 to-emerald-500",
    tier: "standard"
  },
  {
    id: "claude-3-haiku",
    name: "Claude 3 Haiku",
    description: "Lightning fast responses",
    icon: <Zap className="w-4 h-4" />,
    color: "from-purple-500 to-pink-500",
    tier: "standard"
  }
];

interface ModelSelectorProps {
  value: string;
  onChange: (value: string) => void;
}

export function ModelSelector({ value, onChange }: ModelSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const selectedModel = models.find(m => m.id === value) || models[0];

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        type="button"
        className={cn(
          "flex items-center justify-between w-full px-4 py-3 text-left bg-white border border-gray-200 rounded-xl shadow-sm hover:border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200",
          isOpen && "ring-2 ring-blue-500 border-transparent"
        )}
        onClick={() => setIsOpen(!isOpen)}
      >
        <div className="flex items-center space-x-3">
          <div className={cn(
            "w-8 h-8 rounded-lg flex items-center justify-center text-white",
            `bg-gradient-to-r ${selectedModel.color}`
          )}>
            {selectedModel.icon}
          </div>
          <div>
            <div className="font-medium text-gray-900 flex items-center space-x-2">
              <span>{selectedModel.name}</span>
              {selectedModel.tier === "premium" && (
                <span className="px-2 py-1 text-xs bg-gradient-to-r from-amber-400 to-orange-400 text-white rounded-full font-medium">
                  PRO
                </span>
              )}
            </div>
            <div className="text-sm text-gray-500">{selectedModel.description}</div>
          </div>
        </div>
        <ChevronDown 
          className={cn(
            "w-5 h-5 text-gray-400 transition-transform duration-200",
            isOpen && "transform rotate-180"
          )} 
        />
      </button>

      {isOpen && (
        <div className="absolute z-50 w-full mt-2 bg-white border border-gray-200 rounded-xl shadow-lg">
          <div className="py-2">
            {models.map((model) => (
              <button
                key={model.id}
                type="button"
                className={cn(
                  "w-full flex items-center space-x-3 px-4 py-3 text-left hover:bg-gray-50 transition-colors duration-150",
                  value === model.id && "bg-blue-50 border-r-2 border-blue-500"
                )}
                onClick={() => {
                  onChange(model.id);
                  setIsOpen(false);
                }}
              >
                <div className={cn(
                  "w-8 h-8 rounded-lg flex items-center justify-center text-white",
                  `bg-gradient-to-r ${model.color}`
                )}>
                  {model.icon}
                </div>
                <div className="flex-1">
                  <div className="font-medium text-gray-900 flex items-center space-x-2">
                    <span>{model.name}</span>
                    {model.tier === "premium" && (
                      <span className="px-2 py-1 text-xs bg-gradient-to-r from-amber-400 to-orange-400 text-white rounded-full font-medium">
                        PRO
                      </span>
                    )}
                  </div>
                  <div className="text-sm text-gray-500">{model.description}</div>
                </div>
                {value === model.id && (
                  <Check className="w-5 h-5 text-blue-500" />
                )}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}