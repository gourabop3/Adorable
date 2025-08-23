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
      className={`hover:bg-accent focus-ring ${className || ""}`}
      onClick={() => onClick(promptText)}
      type="button"
      aria-label={`Use example prompt: ${promptText}`}
      title={promptText}
    >
      {text}
    </Button>
  );
}
