"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Coins, Crown, Check, ArrowLeft, Zap, Shield, Clock } from "lucide-react";
import { useBilling } from "@/contexts/billing-context";

export default function BillingPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { billing, refetch } = useBilling();
  const [isProcessing, setIsProcessing] = useState(false);
  
  const redirect = searchParams.get('redirect');
  const prompt = searchParams.get('prompt');
  const framework = searchParams.get('framework');
  const model = searchParams.get('model');

  useEffect(() => {
    refetch();
  }, [refetch]);

  const plans = [
    {
      id: 'free',
      name: 'Free',
      price: '$0',
      credits: '50 credits',
      features: [
        '50 free credits',
        'Basic support',
        'Standard features',
        'Community access'
      ],
      popular: false,
      buttonText: 'Current Plan',
      disabled: true
    },
    {
      id: 'pro',
      name: 'Pro',
      price: '$19',
      credits: '500 credits/month',
      features: [
        '500 credits monthly',
        'Priority support',
        'Advanced features',
        'Early access to new features',
        'Priority queue',
        'Custom integrations'
      ],
      popular: true,
      buttonText: 'Upgrade to Pro',
      disabled: false
    }
  ];

  const handleUpgrade = async () => {
    setIsProcessing(true);
    try {
      const response = await fetch('/api/stripe/create-checkout-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          priceId: process.env.NEXT_PUBLIC_STRIPE_PRO_PRICE_ID || 'price_1234567890',
          successUrl: `${window.location.origin}?success=true&plan=pro&credits=500&app_created=true`,
          cancelUrl: redirect ? `${window.location.origin}${redirect}` : window.location.origin,
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

  const handleContinue = () => {
    if (redirect) {
      router.push(redirect);
    } else {
      router.push('/');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <Button
            variant="ghost"
            onClick={() => router.back()}
            className="mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Choose Your Plan
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Select the plan that best fits your needs and start building amazing apps
          </p>
        </div>

        {/* Current Status */}
        {billing && (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Coins className="h-5 w-5 text-yellow-500" />
                Current Status
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-900 dark:text-white">
                    {billing.credits}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    Credits Remaining
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-900 dark:text-white capitalize">
                    {billing.plan}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    Current Plan
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-900 dark:text-white">
                    {billing.plan === 'pro' ? 'Active' : 'Inactive'}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    Subscription Status
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Plans */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
          {plans.map((plan) => (
            <Card
              key={plan.id}
              className={`relative ${
                plan.popular
                  ? 'ring-2 ring-blue-500 shadow-lg'
                  : 'border-gray-200'
              }`}
            >
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                  <span className="bg-blue-600 text-white text-sm px-3 py-1 rounded-full font-medium">
                    Most Popular
                  </span>
                </div>
              )}
              
              <CardHeader className="text-center">
                <div className="flex items-center justify-center gap-2 mb-2">
                  {plan.id === 'pro' ? (
                    <Crown className="h-6 w-6 text-purple-600" />
                  ) : (
                    <Coins className="h-6 w-6 text-gray-600" />
                  )}
                  <CardTitle className="text-2xl">{plan.name}</CardTitle>
                </div>
                <div className="text-4xl font-bold text-gray-900 dark:text-white">
                  {plan.price}
                </div>
                <CardDescription className="text-lg">
                  {plan.credits}
                </CardDescription>
              </CardHeader>
              
              <CardContent>
                <ul className="space-y-3 mb-6">
                  {plan.features.map((feature, index) => (
                    <li key={index} className="flex items-center gap-3">
                      <Check className="h-4 w-4 text-green-600 flex-shrink-0" />
                      <span className="text-gray-700 dark:text-gray-300">{feature}</span>
                    </li>
                  ))}
                </ul>
                
                <Button
                  onClick={plan.id === 'pro' ? handleUpgrade : handleContinue}
                  disabled={plan.disabled || isProcessing}
                  className="w-full"
                  variant={plan.popular ? "default" : "outline"}
                >
                  {isProcessing && plan.id === 'pro' ? 'Processing...' : plan.buttonText}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Features Comparison */}
        <Card>
          <CardHeader>
            <CardTitle>Why Choose Pro?</CardTitle>
            <CardDescription>
              Get more done with our Pro plan features
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center">
                <Zap className="h-12 w-12 text-yellow-500 mx-auto mb-4" />
                <h3 className="font-semibold mb-2">Faster Processing</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Priority queue access for faster app generation
                </p>
              </div>
              <div className="text-center">
                <Shield className="h-12 w-12 text-blue-500 mx-auto mb-4" />
                <h3 className="font-semibold mb-2">Premium Support</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Get help when you need it with priority support
                </p>
              </div>
              <div className="text-center">
                <Clock className="h-12 w-12 text-green-500 mx-auto mb-4" />
                <h3 className="font-semibold mb-2">Early Access</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Try new features before they're publicly available
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}