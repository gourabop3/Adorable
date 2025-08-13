"use client";

import { useState } from "react";
import { Button } from "./ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "./ui/dialog";
import { Coins, Check, ShoppingCart, Zap, Crown } from "lucide-react";

interface CreditPurchaseProps {
  onClose: () => void;
  currentCredits: number;
}

export function CreditPurchase({ onClose, currentCredits }: CreditPurchaseProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [selectedPack, setSelectedPack] = useState<string>("100");

  const creditPacks = [
    {
      id: "50",
      credits: 50,
      price: "$4.99",
      pricePerCredit: "$0.10",
      popular: false,
      savings: "",
    },
    {
      id: "100",
      credits: 100,
      price: "$8.99",
      pricePerCredit: "$0.09",
      popular: true,
      savings: "Save 10%",
    },
    {
      id: "250",
      credits: 250,
      price: "$19.99",
      pricePerCredit: "$0.08",
      popular: false,
      savings: "Save 20%",
    },
    {
      id: "500",
      credits: 500,
      price: "$34.99",
      pricePerCredit: "$0.07",
      popular: false,
      savings: "Save 30%",
    },
  ];

  const handlePurchase = async () => {
    setIsProcessing(true);
    try {
      const response = await fetch('/api/stripe/create-credit-purchase', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          creditPack: selectedPack,
          credits: creditPacks.find(p => p.id === selectedPack)?.credits,
          successUrl: `${window.location.origin}?success=true&credits=${selectedPack}&purchase=true`,
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
      console.error('Purchase error:', error);
      alert('Failed to process purchase. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-center flex items-center justify-center gap-2">
            <Coins className="h-6 w-6 text-yellow-500" />
            Purchase Credits
          </DialogTitle>
        </DialogHeader>
        
        <div className="mb-4 p-4 bg-blue-50 dark:bg-blue-950 rounded-lg">
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">
              Current Balance: {currentCredits} credits
            </div>
            <div className="text-sm text-blue-600 mt-1">
              Each credit = 1 app creation or major feature
            </div>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          {creditPacks.map((pack) => (
            <div
              key={pack.id}
              className={`relative p-4 border rounded-lg cursor-pointer transition-all ${
                selectedPack === pack.id
                  ? 'border-blue-500 bg-blue-50 dark:bg-blue-950'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
              onClick={() => setSelectedPack(pack.id)}
            >
              {pack.popular && (
                <div className="absolute -top-2 left-1/2 transform -translate-x-1/2">
                  <span className="bg-blue-600 text-white text-xs px-2 py-1 rounded-full">
                    Most Popular
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
              
              <div className="text-center">
                <div className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                  {pack.credits}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                  Credits
                </div>
                <div className="text-2xl font-bold text-blue-600 mb-2">
                  {pack.price}
                </div>
                <div className="text-xs text-gray-500 mb-3">
                  {pack.pricePerCredit} per credit
                </div>
                
                <div className="flex items-center justify-center gap-1 text-xs text-gray-600">
                  <Zap className="h-3 w-3" />
                  {pack.credits} app creations
                </div>
              </div>
              
              {selectedPack === pack.id && (
                <div className="absolute top-2 right-2">
                  <Check className="h-5 w-5 text-blue-600" />
                </div>
              )}
            </div>
          ))}
        </div>
        
        <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg mb-6">
          <h4 className="font-semibold mb-2 flex items-center gap-2">
            <Crown className="h-4 w-4 text-purple-600" />
            What You Get
          </h4>
          <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
            <li>• Create {creditPacks.find(p => p.id === selectedPack)?.credits} AI-powered apps</li>
            <li>• Access to all AI models (Gemini, GPT-4, Claude)</li>
            <li>• Priority support and faster processing</li>
            <li>• Credits never expire</li>
            <li>• Instant delivery after payment</li>
          </ul>
        </div>
        
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={onClose}
            className="flex-1"
          >
            Cancel
          </Button>
          <Button
            onClick={handlePurchase}
            disabled={isProcessing}
            className="flex-1"
          >
            {isProcessing ? (
              <>
                <ShoppingCart className="h-4 w-4 mr-2 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                <ShoppingCart className="h-4 w-4 mr-2" />
                Buy {creditPacks.find(p => p.id === selectedPack)?.credits} Credits
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}