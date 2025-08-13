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
    <div className="flex items-center gap-2">
      <div className="flex items-center gap-1 text-sm">
        <Coins className="h-4 w-4 text-yellow-500" />
        <span className={isLowCredits ? "text-red-600 font-medium" : ""}>
          {credits} credits
        </span>
      </div>
      
      {isPro && (
        <div className="flex items-center gap-1 text-sm text-purple-600">
          <Crown className="h-3 w-3" />
          <span className="font-medium">Pro</span>
        </div>
      )}
      
      <Button
        variant="outline"
        size="sm"
        onClick={onShowHistory}
        className="h-7 px-2 text-xs"
      >
        <History className="h-3 w-3 mr-1" />
        History
      </Button>
      
      {!isPro && (
        <Button
          variant="outline"
          size="sm"
          onClick={onUpgradeClick}
          className="h-7 px-2 text-xs"
        >
          Upgrade
        </Button>
      )}
    </div>
  );
}