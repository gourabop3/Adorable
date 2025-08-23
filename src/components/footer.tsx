import Link from "next/link";
import { Button } from "@/components/ui/button";

export function Footer() {
  return (
    <footer className="bg-background border-t border-border">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Company Info */}
          <div className="col-span-1 md:col-span-2">
            <div className="flex items-center space-x-2 mb-4">
              <span className="text-lg font-semibold text-foreground">
                VIBE
              </span>
            </div>
            <p className="text-muted-foreground max-w-md">
              The AI website builder that transforms your ideas into stunning websites in seconds.
            </p>
          </div>

          {/* Product */}
          <div>
            <h3 className="font-medium text-foreground mb-4">Product</h3>
            <ul className="space-y-2">
              <li>
                <Link href="/features" className="text-muted-foreground hover:text-foreground transition-colors text-sm">
                  Features
                </Link>
              </li>
              <li>
                <Link href="/templates" className="text-muted-foreground hover:text-foreground transition-colors text-sm">
                  Templates
                </Link>
              </li>
              <li>
                <Link href="/pricing" className="text-muted-foreground hover:text-foreground transition-colors text-sm">
                  Pricing
                </Link>
              </li>
              <li>
                <Link href="/integrations" className="text-muted-foreground hover:text-foreground transition-colors text-sm">
                  Integrations
                </Link>
              </li>
            </ul>
          </div>

          {/* Company */}
          <div>
            <h3 className="font-medium text-foreground mb-4">Company</h3>
            <ul className="space-y-2">
              <li>
                <Link href="/about" className="text-muted-foreground hover:text-foreground transition-colors text-sm">
                  About
                </Link>
              </li>
              <li>
                <Link href="/blog" className="text-muted-foreground hover:text-foreground transition-colors text-sm">
                  Blog
                </Link>
              </li>
              <li>
                <Link href="/careers" className="text-muted-foreground hover:text-foreground transition-colors text-sm">
                  Careers
                </Link>
              </li>
              <li>
                <Link href="/contact" className="text-muted-foreground hover:text-foreground transition-colors text-sm">
                  Contact
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Section */}
        <div className="border-t border-border mt-12 pt-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex items-center flex-wrap gap-6">
              <Link href="/privacy" className="text-xs text-muted-foreground hover:text-foreground transition-colors">
                Privacy Policy
              </Link>
              <Link href="/terms" className="text-xs text-muted-foreground hover:text-foreground transition-colors">
                Terms of Service
              </Link>
              <Link href="/docs" className="text-xs text-muted-foreground hover:text-foreground transition-colors">
                Documentation
              </Link>
            </div>
            <div className="text-xs text-muted-foreground">
              © 2024 VIBE. All rights reserved.
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}