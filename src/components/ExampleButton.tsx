"use client";

import React from "react";
import { Button } from "./ui/button";

interface ExampleButtonProps {
  text: string;
  promptText: string;
  onClick: (text: string) => void;
  className?: string;
}

export function ExampleButton({
  text,
  promptText,
  onClick,
  className,
}: ExampleButtonProps) {
  return (
    <Button
      variant="outline"
      size="sm"
      className={`bg-white/80 backdrop-blur-sm border-primary/20 hover:bg-primary/5 hover:border-primary/40 hover:text-primary hover:shadow-medium rounded-full transition-all duration-300 group focus-ring ${
        className || ""
      }`}
      onClick={() => onClick(promptText)}
      type="button"
      aria-label={`Use example prompt: ${promptText}`}
      title={promptText}
    >
      <span className="relative z-10">{text}</span>
      <div className="absolute inset-0 rounded-full bg-gradient-to-r from-primary/10 to-blue-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" aria-hidden="true" />
    </Button>
  );
}
