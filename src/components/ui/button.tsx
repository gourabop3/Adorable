import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg text-sm font-semibold transition-all duration-200 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 [&_svg]:shrink-0 outline-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background active:scale-[0.98] transform-gpu",
  {
    variants: {
      variant: {
        default:
          "bg-gradient-to-r from-primary to-primary-dark text-primary-foreground shadow-medium hover:shadow-large hover:from-primary-light hover:to-primary hover:-translate-y-0.5",
        destructive:
          "bg-gradient-to-r from-destructive to-red-600 text-destructive-foreground shadow-medium hover:shadow-large hover:from-red-500 hover:to-destructive hover:-translate-y-0.5 focus-visible:ring-destructive/30",
        outline:
          "border-2 border-border bg-background shadow-soft hover:shadow-medium hover:bg-accent hover:text-accent-foreground hover:border-primary/30 hover:-translate-y-0.5",
        secondary:
          "bg-secondary text-secondary-foreground shadow-soft hover:shadow-medium hover:bg-secondary/80 hover:-translate-y-0.5",
        ghost: "hover:bg-accent hover:text-accent-foreground hover:shadow-soft",
        link: "text-primary underline-offset-4 hover:underline hover:text-primary-light",
        success: "bg-gradient-to-r from-success to-green-600 text-success-foreground shadow-medium hover:shadow-large hover:from-green-500 hover:to-success hover:-translate-y-0.5",
        gradient: "bg-gradient-to-r from-purple-600 via-primary to-blue-600 text-white shadow-large hover:shadow-xl hover:scale-105 hover:-translate-y-1 bg-size-200 hover:bg-pos-100 transition-all duration-300",
      },
      size: {
        default: "h-11 px-6 py-2.5",
        sm: "h-9 rounded-lg px-4 text-sm",
        lg: "h-12 rounded-xl px-8 text-base",
        xl: "h-14 rounded-xl px-10 text-lg",
        icon: "size-11 rounded-lg",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

function Button({
  className,
  variant,
  size,
  asChild = false,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean;
  }) {
  const Comp = asChild ? Slot : "button";

  return (
    <Comp
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  );
}

export { Button, buttonVariants };
