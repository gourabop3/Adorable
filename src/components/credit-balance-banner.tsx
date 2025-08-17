"use client";

import { useBilling } from "@/contexts/billing-context";
import { Button } from "@/components/ui/button";
import { CreditCard, Zap, Crown } from "lucide-react";
import Link from "next/link";

export function CreditBalanceBanner() {
  const { billing } = useBilling();

  if (!billing) {
    return null;
  }

  const isLowCredits = billing.credits <= 5;
  const isOutOfCredits = billing.credits === 0;

  if (isOutOfCredits) {
    return (
      <div className="bg-gradient-to-r from-red-50 to-pink-50 border border-red-200 rounded-2xl p-6 mb-8 max-w-2xl mx-auto">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
              <CreditCard className="w-5 h-5 text-red-600" />
            </div>
            <div>
              <h3 className="font-semibold text-red-900">Out of Credits</h3>
              <p className="text-red-700 text-sm">Purchase credits to continue building</p>
            </div>
          </div>
          <Link href="/billing">
            <Button className="bg-red-600 hover:bg-red-700 text-white">
              <Crown className="w-4 h-4 mr-2" />
              Get Credits
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  if (isLowCredits) {
    return (
      <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-2xl p-6 mb-8 max-w-2xl mx-auto">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-amber-100 rounded-full flex items-center justify-center">
              <Zap className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <h3 className="font-semibold text-amber-900">Low Credit Balance</h3>
              <p className="text-amber-700 text-sm">
                You have {billing.credits} credits remaining
              </p>
            </div>
          </div>
          <Link href="/billing">
            <Button variant="outline" className="border-amber-300 text-amber-700 hover:bg-amber-50">
              <CreditCard className="w-4 h-4 mr-2" />
              Add Credits
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-2xl p-6 mb-8 max-w-2xl mx-auto">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
            <Zap className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <h3 className="font-semibold text-blue-900">Ready to Build</h3>
            <p className="text-blue-700 text-sm">
              You have {billing.credits} credits available
            </p>
          </div>
        </div>
        <div className="text-right">
          <div className="text-2xl font-bold text-blue-900">{billing.credits}</div>
          <div className="text-blue-600 text-sm">credits</div>
        </div>
      </div>
    </div>
  );
}