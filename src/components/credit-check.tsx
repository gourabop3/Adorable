"use client";

import { useState } from "react";
import { Button } from "./ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "./ui/dialog";
import { Coins, Crown, Check, X } from "lucide-react";

interface CreditCheckProps {
  onClose: () => void;
  currentCredits: number;
  currentPlan: 'free' | 'pro';
}

export function CreditCheck({ onClose, currentCredits, currentPlan }: CreditCheckProps) {
  const [selectedPlan, setSelectedPlan] = useState<'free' | 'pro'>('pro');
  const [isProcessing, setIsProcessing] = useState(false);

  const plans = [
    {
      id: 'free',
      name: 'Free',
      price: '$0',
      credits: '50 credits',
      features: ['50 free credits', 'Basic support', 'Standard features'],
      popular: false
    },
    {
      id: 'pro',
      name: 'Pro',
      price: '$19',
      credits: '500 credits/month',
      features: ['500 credits monthly', 'Priority support', 'Advanced features', 'Early access'],
      popular: true
    }
  ];

  const handleUpgrade = async () => {
    if (selectedPlan === 'free') {
      onClose();
      return;
    }

    setIsProcessing(true);
    try {
      const response = await fetch('/api/stripe/create-checkout-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          priceId: process.env.NEXT_PUBLIC_STRIPE_PRO_PRICE_ID || 'price_1234567890',
          successUrl: `${window.location.origin}?success=true&plan=pro&credits=500`,
          cancelUrl: window.location.origin,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to create checkout session');
      }

      const { sessionId } = await response.json();
      
      // Redirect to Stripe Checkout
      const stripe = await import('@stripe/stripe-js');
      const stripeInstance = await stripe.loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);
      await stripeInstance?.redirectToCheckout({ sessionId });
    } catch (error) {
      console.error('Upgrade error:', error);
      alert('Failed to process upgrade. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-center">Choose Your Plan</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          {plans.map((plan) => (
            <div
              key={plan.id}
              className={`relative p-4 border rounded-lg cursor-pointer transition-all ${
                selectedPlan === plan.id
                  ? 'border-blue-500 bg-blue-50 dark:bg-blue-950'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
              onClick={() => setSelectedPlan(plan.id as 'free' | 'pro')}
            >
              {plan.popular && (
                <div className="absolute -top-2 left-1/2 transform -translate-x-1/2">
                  <span className="bg-blue-600 text-white text-xs px-2 py-1 rounded-full">
                    Most Popular
                  </span>
                </div>
              )}
              
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  {plan.id === 'pro' ? (
                    <Crown className="h-5 w-5 text-purple-600" />
                  ) : (
                    <Coins className="h-5 w-5 text-gray-600" />
                  )}
                  <h3 className="font-semibold">{plan.name}</h3>
                </div>
                {selectedPlan === plan.id && (
                  <Check className="h-5 w-5 text-blue-600" />
                )}
              </div>
              
              <div className="text-2xl font-bold mb-2">{plan.price}</div>
              <div className="text-sm text-gray-600 mb-3">{plan.credits}</div>
              
              <ul className="space-y-1">
                {plan.features.map((feature, index) => (
                  <li key={index} className="text-sm flex items-center gap-2">
                    <Check className="h-3 w-3 text-green-600" />
                    {feature}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        
        <div className="flex gap-2 pt-4">
          <Button
            variant="outline"
            onClick={onClose}
            className="flex-1"
          >
            Cancel
          </Button>
          <Button
            onClick={handleUpgrade}
            disabled={isProcessing}
            className="flex-1"
          >
            {isProcessing ? 'Processing...' : selectedPlan === 'free' ? 'Continue Free' : 'Upgrade to Pro'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}