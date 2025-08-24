"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";

export function RorkNavigation() {
  return (
    <div className="fixed top-4 left-4 z-50">
      <Link href="/rork">
        <Button variant="outline" className="bg-gray-900 border-gray-700 text-white hover:bg-gray-800">
          View Rork Demo
        </Button>
      </Link>
    </div>
  );
}