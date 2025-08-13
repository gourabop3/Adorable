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

  const handleCreditPurchase = async (credits: number, price: string) => {
    setIsProcessing(true);
    try {
      const response = await fetch('/api/stripe/create-credit-purchase', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          creditPack: credits.toString(),
          credits: credits,
          successUrl: `${window.location.origin}?success=true&credits=${credits}&purchase=true`,
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
      console.error('Credit purchase error:', error);
      alert('Failed to process purchase. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="text-center flex items-center justify-center gap-2">
            <Crown className="h-6 w-6 text-purple-600" />
            Upgrade Your Plan
          </DialogTitle>
        </DialogHeader>
        
        <div className="flex-1 overflow-y-auto space-y-6">
          {/* Current Status */}
          <div className="p-4 bg-blue-50 dark:bg-blue-950 rounded-lg">
            <div className="text-center">
              <div className="text-lg font-semibold text-blue-800 dark:text-blue-200">
                Current Balance: {currentCredits} credits
              </div>
              <div className="text-sm text-blue-600 dark:text-blue-400 mt-1">
                Current Plan: {currentPlan === 'pro' ? 'Pro' : 'Free'}
              </div>
            </div>
          </div>

          {/* Subscription Plans */}
          <div>
            <h3 className="text-lg font-semibold mb-3 text-center">Subscription Plans</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
          </div>

          {/* Credit Packs */}
          <div>
            <h3 className="text-lg font-semibold mb-3 text-center">Or Buy Individual Credit Packs</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {[
                { id: "50", credits: 50, price: "$4.99", popular: false, savings: "" },
                { id: "100", credits: 100, price: "$8.99", popular: true, savings: "Save 10%" },
                { id: "250", credits: 250, price: "$19.99", popular: false, savings: "Save 20%" },
                { id: "500", credits: 500, price: "$34.99", popular: false, savings: "Save 30%" }
              ].map((pack) => (
                <div
                  key={pack.id}
                  className="relative p-3 border rounded-lg text-center cursor-pointer hover:border-blue-300 transition-colors"
                  onClick={() => handleCreditPurchase(pack.credits, pack.price)}
                >
                  {pack.popular && (
                    <div className="absolute -top-2 left-1/2 transform -translate-x-1/2">
                      <span className="bg-green-600 text-white text-xs px-2 py-1 rounded-full">
                        Best Value
                      </span>
                    </div>
                  )}
                  {pack.savings && (
                    <div className="absolute -top-2 right-2">
                      <span className="bg-green-600 text-white text-xs px-2 py-1 rounded-full">
                        {pack.savings}
                      </span>
                    </div>
                  )}
                  
                  <div className="text-2xl font-bold text-blue-600 mb-1">{pack.credits}</div>
                  <div className="text-sm text-gray-600 mb-1">Credits</div>
                  <div className="text-lg font-semibold">{pack.price}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-2 pt-4 border-t">
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