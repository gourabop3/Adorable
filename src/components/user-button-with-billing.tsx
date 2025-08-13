"use client";

import { UserButton } from "@stackframe/stack";
import { useBilling } from "@/contexts/billing-context";
import { CreditDisplay } from "./credit-display";
import { CreditCheck } from "./credit-check";
import { useState } from "react";

export function UserButtonWithBilling() {
  const { billing, isAuthenticated } = useBilling();
  const [showCreditCheck, setShowCreditCheck] = useState(false);

  if (!isAuthenticated) {
    return <UserButton />;
  }

  return (
    <div className="flex items-center gap-2">
      <CreditDisplay 
        credits={billing?.credits || 0} 
        plan={billing?.plan || 'free'}
        onUpgradeClick={() => setShowCreditCheck(true)}
      />
      <UserButton />
      
      {showCreditCheck && (
        <CreditCheck
          onClose={() => setShowCreditCheck(false)}
          currentCredits={billing?.credits || 0}
          currentPlan={billing?.plan || 'free'}
        />
      )}
    </div>
  );
}