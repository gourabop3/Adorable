import Link from "next/link";
import { Button } from "@/components/ui/button";

export function Footer() {
  return (
    <footer className="bg-gradient-to-br from-gray-50/80 via-white/50 to-primary/5 border-t border-border/50 backdrop-blur-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12">
          {/* Company Info */}
          <div className="col-span-1 md:col-span-2 space-y-6">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-primary via-purple-600 to-blue-600 rounded-xl flex items-center justify-center shadow-medium">
                <span className="text-white font-bold text-xl">V</span>
              </div>
              <span className="text-2xl font-bold gradient-text">
                VIBE
              </span>
            </div>
            <p className="text-muted-foreground text-lg leading-relaxed max-w-lg">
              The next-generation AI website builder that transforms your ideas into stunning, 
              professional websites in seconds. No coding required.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Button variant="default" size="lg" className="shadow-medium">
                Get Started Free
              </Button>
              <Button variant="outline" size="lg">
                View Demo
              </Button>
            </div>
          </div>

          {/* Product */}
          <div className="space-y-4">
            <h3 className="font-bold text-foreground text-lg">Product</h3>
            <ul className="space-y-3">
              <li>
                <Link href="/features" className="text-muted-foreground hover:text-primary transition-colors duration-200 hover:translate-x-1 inline-block font-medium">
                  Features
                </Link>
              </li>
              <li>
                <Link href="/templates" className="text-muted-foreground hover:text-primary transition-colors duration-200 hover:translate-x-1 inline-block font-medium">
                  Templates
                </Link>
              </li>
              <li>
                <Link href="/pricing" className="text-muted-foreground hover:text-primary transition-colors duration-200 hover:translate-x-1 inline-block font-medium">
                  Pricing
                </Link>
              </li>
              <li>
                <Link href="/integrations" className="text-muted-foreground hover:text-primary transition-colors duration-200 hover:translate-x-1 inline-block font-medium">
                  Integrations
                </Link>
              </li>
            </ul>
          </div>

          {/* Company */}
          <div className="space-y-4">
            <h3 className="font-bold text-foreground text-lg">Company</h3>
            <ul className="space-y-3">
              <li>
                <Link href="/about" className="text-muted-foreground hover:text-primary transition-colors duration-200 hover:translate-x-1 inline-block font-medium">
                  About
                </Link>
              </li>
              <li>
                <Link href="/blog" className="text-muted-foreground hover:text-primary transition-colors duration-200 hover:translate-x-1 inline-block font-medium">
                  Blog
                </Link>
              </li>
              <li>
                <Link href="/careers" className="text-muted-foreground hover:text-primary transition-colors duration-200 hover:translate-x-1 inline-block font-medium">
                  Careers
                </Link>
              </li>
              <li>
                <Link href="/contact" className="text-muted-foreground hover:text-primary transition-colors duration-200 hover:translate-x-1 inline-block font-medium">
                  Contact
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Section */}
        <div className="border-t border-border/50 mt-16 pt-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="flex items-center flex-wrap gap-6">
              <Link href="/privacy" className="text-sm text-muted-foreground hover:text-primary transition-colors font-medium">
                Privacy Policy
              </Link>
              <Link href="/terms" className="text-sm text-muted-foreground hover:text-primary transition-colors font-medium">
                Terms of Service
              </Link>
              <Link href="/docs" className="text-sm text-muted-foreground hover:text-primary transition-colors font-medium">
                Documentation
              </Link>
            </div>
            <div className="text-sm text-muted-foreground font-medium">
              © 2024 VIBE. All rights reserved. • Deployed on Vercel
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}