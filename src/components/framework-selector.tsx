"use client";

import { useState, useRef, useEffect } from "react";
import { Check, ChevronDown, Code, Smartphone, Globe, Zap } from "lucide-react";
import { cn } from "@/lib/utils";

const frameworks = [
  {
    id: "nextjs",
    name: "Next.js",
    description: "Full-stack React framework",
    icon: <Code className="w-4 h-4" />,
    color: "from-blue-500 to-cyan-500"
  },
  {
    id: "react",
    name: "React",
    description: "Component-based UI library",
    icon: <Code className="w-4 h-4" />,
    color: "from-cyan-500 to-blue-500"
  },
  {
    id: "vue",
    name: "Vue.js",
    description: "Progressive JavaScript framework",
    icon: <Code className="w-4 h-4" />,
    color: "from-green-500 to-emerald-500"
  },
  {
    id: "html",
    name: "HTML/CSS",
    description: "Static website template",
    icon: <Globe className="w-4 h-4" />,
    color: "from-orange-500 to-red-500"
  },
  {
    id: "mobile",
    name: "Mobile App",
    description: "React Native mobile app",
    icon: <Smartphone className="w-4 h-4" />,
    color: "from-purple-500 to-pink-500"
  }
];

interface FrameworkSelectorProps {
  value: string;
  onChange: (value: string) => void;
}

export function FrameworkSelector({ value, onChange }: FrameworkSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const selectedFramework = frameworks.find(f => f.id === value) || frameworks[0];

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
            `bg-gradient-to-r ${selectedFramework.color}`
          )}>
            {selectedFramework.icon}
          </div>
          <div>
            <div className="font-medium text-gray-900">{selectedFramework.name}</div>
            <div className="text-sm text-gray-500">{selectedFramework.description}</div>
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
            {frameworks.map((framework) => (
              <button
                key={framework.id}
                type="button"
                className={cn(
                  "w-full flex items-center space-x-3 px-4 py-3 text-left hover:bg-gray-50 transition-colors duration-150",
                  value === framework.id && "bg-blue-50 border-r-2 border-blue-500"
                )}
                onClick={() => {
                  onChange(framework.id);
                  setIsOpen(false);
                }}
              >
                <div className={cn(
                  "w-8 h-8 rounded-lg flex items-center justify-center text-white",
                  `bg-gradient-to-r ${framework.color}`
                )}>
                  {framework.icon}
                </div>
                <div className="flex-1">
                  <div className="font-medium text-gray-900">{framework.name}</div>
                  <div className="text-sm text-gray-500">{framework.description}</div>
                </div>
                {value === framework.id && (
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
