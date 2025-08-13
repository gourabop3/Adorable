"use client";

import { UserButton } from "@stackframe/stack";
import { useBilling } from "@/contexts/billing-context";
import { CreditDisplay } from "./credit-display";
import { CreditCheck } from "./credit-check";
import { CreditHistory } from "./credit-history";
import { useState } from "react";

export function UserButtonWithBilling() {
  const { billing, isAuthenticated } = useBilling();
  const [showCreditCheck, setShowCreditCheck] = useState(false);
  const [showCreditHistory, setShowCreditHistory] = useState(false);

  if (!isAuthenticated) {
    return <UserButton />;
  }

  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-3 w-full sm:w-auto">
      <CreditDisplay 
        credits={billing?.credits || 0} 
        plan={billing?.plan || 'free'}
        onUpgradeClick={() => setShowCreditCheck(true)}
        onShowHistory={() => setShowCreditHistory(true)}
      />
      <UserButton />
      
      {showCreditCheck && (
        <CreditCheck
          onClose={() => setShowCreditCheck(false)}
          currentCredits={billing?.credits || 0}
          currentPlan={billing?.plan || 'free'}
        />
      )}
      
      {showCreditHistory && (
        <CreditHistory
          onClose={() => setShowCreditHistory(false)}
        />
      )}
    </div>
  );
}