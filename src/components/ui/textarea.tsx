import * as React from "react";

import { cn } from "@/lib/utils";

function Textarea({ className, ...props }: React.ComponentProps<"textarea">) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(
        "border-input placeholder:text-muted-foreground flex field-sizing-content min-h-20 w-full rounded-lg border-2 bg-background px-4 py-3 text-base shadow-soft transition-all duration-200 outline-none focus-ring disabled:cursor-not-allowed disabled:opacity-50 resize-none",
        "hover:border-primary/30 hover:shadow-medium",
        "focus-visible:border-primary focus-visible:shadow-medium focus-visible:bg-white",
        "aria-invalid:border-destructive aria-invalid:ring-destructive/20",
        className,
      )}
      {...props}
    />
  );
}

export { Textarea };
