"use client";

import { useBilling } from "@/contexts/billing-context";
import { Coins, AlertTriangle } from "lucide-react";

export function CreditBalanceBanner() {
  const { billing, isAuthenticated } = useBilling();

  if (!isAuthenticated || !billing) {
    return null;
  }

  const isLowCredits = billing.credits < 5;
  const isCriticalCredits = billing.credits < 1;

  if (isCriticalCredits) {
    return (
      <div className="w-full p-4 bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded-lg mb-6">
        <div className="flex items-center gap-3">
          <AlertTriangle className="h-5 w-5 text-red-600" />
          <div className="flex-1">
            <h3 className="font-semibold text-red-800 dark:text-red-200">
              No Credits Available
            </h3>
            <p className="text-sm text-red-700 dark:text-red-300">
              You need at least 1 credit to create apps. Please purchase credits to continue.
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (isLowCredits) {
    return (
      <div className="w-full p-4 bg-yellow-50 dark:bg-yellow-950 border border-yellow-200 dark:border-yellow-800 rounded-lg mb-6">
        <div className="flex items-center gap-3">
          <Coins className="h-5 w-5 text-yellow-600" />
          <div className="flex-1">
            <h3 className="font-semibold text-yellow-800 dark:text-yellow-200">
              Low Credit Balance
            </h3>
            <p className="text-sm text-yellow-700 dark:text-yellow-300">
              You have {billing.credits} credits remaining. Consider purchasing more credits to continue creating apps.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full p-4 bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg mb-6">
      <div className="flex items-center gap-3">
        <Coins className="h-5 w-5 text-blue-600" />
        <div className="flex-1">
          <h3 className="font-semibold text-blue-800 dark:text-blue-200">
            Credit Balance: {billing.credits} credits
          </h3>
          <p className="text-sm text-blue-700 dark:text-blue-300">
            You can create {billing.credits} more apps with your current balance.
          </p>
        </div>
      </div>
    </div>
  );
}