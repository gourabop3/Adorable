import Link from "next/link";
import { CustomUserButton } from "@/components/custom-user-button";

// Navigation component for VIBE website

export function Navigation() {
  return (
    <nav className="bg-background border-b border-border sticky top-0 z-50" role="navigation" aria-label="Main navigation">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link 
            href="/" 
            className="flex items-center space-x-2 focus-ring rounded-md p-1 -m-1" 
            aria-label="VIBE homepage"
          >
            <span className="text-xl font-semibold text-foreground">
              VIBE
            </span>
          </Link>

          {/* Navigation Links */}
          <div className="hidden md:flex items-center space-x-8" role="menubar">
            <Link 
              href="/features" 
              className="text-sm text-muted-foreground hover:text-foreground transition-colors focus-ring rounded-md px-2 py-1"
              role="menuitem"
              aria-label="Features page"
            >
              Features
            </Link>
            <Link 
              href="/pricing" 
              className="text-sm text-muted-foreground hover:text-foreground transition-colors focus-ring rounded-md px-2 py-1"
              role="menuitem"
              aria-label="Pricing page"
            >
              Pricing
            </Link>
            <Link 
              href="/docs" 
              className="text-sm text-muted-foreground hover:text-foreground transition-colors focus-ring rounded-md px-2 py-1"
              role="menuitem"
              aria-label="Documentation"
            >
              Docs
            </Link>
            <Link 
              href="/about" 
              className="text-sm text-muted-foreground hover:text-foreground transition-colors focus-ring rounded-md px-2 py-1"
              role="menuitem"
              aria-label="About us"
            >
              About
            </Link>
          </div>

          {/* Right Side - Only CustomUserButton */}
          <div className="flex items-center">
            <CustomUserButton />
          </div>
        </div>
      </div>
    </nav>
  );
}