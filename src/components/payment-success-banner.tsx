"use client";

import { CheckCircle, X } from "lucide-react";
import { Button } from "./ui/button";

interface PaymentSuccessBannerProps {
  plan?: string | null;
  credits?: string | null;
  onClose: () => void;
}

export function PaymentSuccessBanner({ plan, credits, onClose }: PaymentSuccessBannerProps) {
  const getMessage = () => {
    if (plan === 'pro') {
      return `Welcome to Pro! You now have ${credits || '500'} credits and access to advanced features.`;
    }
    return 'Payment successful! Your credits have been added to your account.';
  };

  return (
    <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50 bg-green-50 border border-green-200 rounded-lg p-4 shadow-lg max-w-md">
      <div className="flex items-start gap-3">
        <CheckCircle className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
        <div className="flex-1">
          <h3 className="font-medium text-green-800">Payment Successful!</h3>
          <p className="text-sm text-green-700 mt-1">{getMessage()}</p>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => {
            console.log('Closing payment success banner');
            onClose();
          }}
          className="h-6 w-6 p-0 text-green-600 hover:text-green-800 hover:bg-green-100"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}