"use client";

import { Coins, Crown, History } from "lucide-react";
import { Button } from "./ui/button";

interface CreditDisplayProps {
  credits: number;
  plan: 'free' | 'pro';
  onUpgradeClick: () => void;
  onShowHistory: () => void;
}

export function CreditDisplay({ credits, plan, onUpgradeClick, onShowHistory }: CreditDisplayProps) {
  const isLowCredits = credits < 10;
  const isPro = plan === 'pro';

  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-3">
      {/* Credit Display - Mobile Stacked, Desktop Inline */}
      <div className="flex items-center gap-1 text-sm">
        <Coins className="h-4 w-4 text-yellow-500" />
        <span className={isLowCredits ? "text-red-600 font-medium" : ""}>
          {credits} credits
        </span>
      </div>
      
      {/* Plan Badge */}
      {isPro && (
        <div className="flex items-center gap-1 text-sm text-purple-600">
          <Crown className="h-3 w-3" />
          <span className="font-medium">Pro</span>
        </div>
      )}
      
      {/* Action Buttons - Mobile Stacked, Desktop Inline */}
      <div className="flex flex-col sm:flex-row gap-2 sm:gap-2 w-full sm:w-auto">
        <Button
          variant="outline"
          size="sm"
          onClick={onShowHistory}
          className="h-8 px-3 text-xs w-full sm:w-auto"
        >
          <History className="h-3 w-3 mr-1" />
          <span className="hidden sm:inline">History</span>
          <span className="sm:hidden">View History</span>
        </Button>
        
        {!isPro && (
          <Button
            variant="outline"
            size="sm"
            onClick={onUpgradeClick}
            className="h-8 px-3 text-xs w-full sm:w-auto"
          >
            <span className="hidden sm:inline">Upgrade</span>
            <span className="sm:hidden">Upgrade Plan</span>
          </Button>
        )}
      </div>
    </div>
  );
}