import Link from "next/link";
import { CustomUserButton } from "@/components/custom-user-button";

// Navigation component for VIBE website

export function Navigation() {
  return (
    <nav className="glass-effect bg-white/95 backdrop-blur-lg border-b border-border/50 sticky top-0 z-50 animate-fade-in" role="navigation" aria-label="Main navigation">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-18">
          {/* Logo */}
          <Link 
            href="/" 
            className="flex items-center space-x-3 group focus-ring rounded-lg p-2 -m-2" 
            aria-label="VIBE homepage"
          >
            <div className="w-10 h-10 bg-gradient-to-br from-primary via-purple-600 to-blue-600 rounded-xl flex items-center justify-center shadow-medium group-hover:shadow-large transition-all duration-300 group-hover:scale-105" aria-hidden="true">
              <span className="text-white font-bold text-xl">V</span>
            </div>
            <span className="text-2xl font-bold gradient-text group-hover:scale-105 transition-transform duration-300">
              VIBE
            </span>
          </Link>

          {/* Navigation Links */}
          <div className="hidden md:flex items-center space-x-1" role="menubar">
            <Link 
              href="/features" 
              className="px-4 py-2 text-foreground/80 hover:text-primary hover:bg-accent/50 rounded-lg transition-all duration-200 font-medium focus-ring"
              role="menuitem"
              aria-label="Features page"
            >
              Features
            </Link>
            <Link 
              href="/pricing" 
              className="px-4 py-2 text-foreground/80 hover:text-primary hover:bg-accent/50 rounded-lg transition-all duration-200 font-medium focus-ring"
              role="menuitem"
              aria-label="Pricing page"
            >
              Pricing
            </Link>
            <Link 
              href="/docs" 
              className="px-4 py-2 text-foreground/80 hover:text-primary hover:bg-accent/50 rounded-lg transition-all duration-200 font-medium focus-ring"
              role="menuitem"
              aria-label="Documentation"
            >
              Docs
            </Link>
            <Link 
              href="/about" 
              className="px-4 py-2 text-foreground/80 hover:text-primary hover:bg-accent/50 rounded-lg transition-all duration-200 font-medium focus-ring"
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