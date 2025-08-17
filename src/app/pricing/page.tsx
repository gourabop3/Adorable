"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Check, Sparkles, Zap, Crown, Star } from "lucide-react";
import { Navigation } from "@/components/navigation";
import { Footer } from "@/components/footer";

export default function PricingPage() {
  const [isAnnual, setIsAnnual] = useState(true);

  const plans = [
    {
      name: "Starter",
      description: "Perfect for individuals and small projects",
      price: isAnnual ? 9 : 12,
      credits: 100,
      features: [
        "100 AI website generations",
        "Basic templates",
        "Community support",
        "Standard AI models",
        "Basic analytics",
        "1 project at a time"
      ],
      popular: false,
      icon: <Zap className="w-6 h-6" />,
      color: "from-blue-500 to-cyan-500"
    },
    {
      name: "Pro",
      description: "Ideal for professionals and growing businesses",
      price: isAnnual ? 29 : 39,
      credits: 500,
      features: [
        "500 AI website generations",
        "Premium templates",
        "Priority support",
        "Advanced AI models (GPT-4, Claude)",
        "Advanced analytics",
        "Unlimited projects",
        "Custom domains",
        "Team collaboration"
      ],
      popular: true,
      icon: <Crown className="w-6 h-6" />,
      color: "from-purple-500 to-pink-500"
    },
    {
      name: "Enterprise",
      description: "For large teams and organizations",
      price: isAnnual ? 99 : 129,
      credits: 2000,
      features: [
        "2000 AI website generations",
        "Custom templates",
        "24/7 dedicated support",
        "All AI models including custom",
        "Enterprise analytics",
        "Unlimited projects",
        "Custom domains & SSL",
        "Advanced team management",
        "API access",
        "White-label options"
      ],
      popular: false,
      icon: <Star className="w-6 h-6" />,
      color: "from-emerald-500 to-teal-500"
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      <Navigation />
      
      <main className="pt-20">
        {/* Header */}
        <section className="text-center py-20">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <Badge className="mb-6 bg-blue-100 text-blue-800 hover:bg-blue-100">
              <Sparkles className="w-4 h-4 mr-2" />
              Pricing Plans
            </Badge>
            <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6">
              Choose Your Plan
            </h1>
            <p className="text-xl text-gray-600 mb-12 max-w-3xl mx-auto">
              Start building amazing websites with AI. Choose the plan that fits your needs and scale as you grow.
            </p>

            {/* Billing Toggle */}
            <div className="flex items-center justify-center space-x-4 mb-16">
              <span className={`text-lg ${!isAnnual ? 'text-gray-900' : 'text-gray-500'}`}>Monthly</span>
              <button
                onClick={() => setIsAnnual(!isAnnual)}
                className={`relative inline-flex h-8 w-16 items-center rounded-full transition-colors ${
                  isAnnual ? 'bg-blue-600' : 'bg-gray-200'
                }`}
              >
                <span
                  className={`inline-block h-6 w-6 transform rounded-full bg-white transition-transform ${
                    isAnnual ? 'translate-x-9' : 'translate-x-1'
                  }`}
                />
              </button>
              <span className={`text-lg ${isAnnual ? 'text-gray-900' : 'text-gray-500'}`}>
                Annual
                <Badge className="ml-2 bg-green-100 text-green-800 text-xs">Save 20%</Badge>
              </span>
            </div>
          </div>
        </section>

        {/* Pricing Cards */}
        <section className="py-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {plans.map((plan, index) => (
                <Card 
                  key={plan.name}
                  className={`relative overflow-hidden transition-all duration-300 hover:shadow-2xl hover:-translate-y-2 ${
                    plan.popular ? 'ring-2 ring-purple-500 shadow-xl' : 'shadow-lg'
                  }`}
                >
                  {plan.popular && (
                    <div className="absolute top-0 left-0 right-0 bg-gradient-to-r from-purple-500 to-pink-500 text-white text-center py-2 text-sm font-medium">
                      Most Popular
                    </div>
                  )}
                  
                  <CardHeader className={`pt-8 ${plan.popular ? 'pt-12' : ''}`}>
                    <div className={`w-16 h-16 rounded-2xl bg-gradient-to-r ${plan.color} flex items-center justify-center text-white mx-auto mb-4`}>
                      {plan.icon}
                    </div>
                    <CardTitle className="text-2xl font-bold text-center">{plan.name}</CardTitle>
                    <CardDescription className="text-center text-gray-600">{plan.description}</CardDescription>
                  </CardHeader>

                  <CardContent className="px-8">
                    <div className="text-center mb-8">
                      <div className="text-4xl font-bold text-gray-900">${plan.price}</div>
                      <div className="text-gray-600">per month</div>
                      <div className="text-sm text-gray-500 mt-2">
                        {plan.credits} AI generations included
                      </div>
                    </div>

                    <ul className="space-y-4">
                      {plan.features.map((feature, featureIndex) => (
                        <li key={featureIndex} className="flex items-start space-x-3">
                          <Check className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                          <span className="text-gray-700">{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>

                  <CardFooter className="px-8 pb-8">
                    <Button 
                      className={`w-full py-3 text-lg font-semibold ${
                        plan.popular 
                          ? 'bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white'
                          : 'bg-gray-900 hover:bg-gray-800 text-white'
                      }`}
                    >
                      {plan.name === 'Enterprise' ? 'Contact Sales' : 'Get Started'}
                    </Button>
                  </CardFooter>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* FAQ Section */}
        <section className="py-20 bg-white">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="text-4xl font-bold text-gray-900 mb-4">Frequently Asked Questions</h2>
              <p className="text-xl text-gray-600">Everything you need to know about our pricing and plans</p>
            </div>

            <div className="space-y-8">
              <div className="border-b border-gray-200 pb-8">
                <h3 className="text-xl font-semibold text-gray-900 mb-4">How do credits work?</h3>
                <p className="text-gray-600">
                  Each AI website generation costs 1 credit. Credits are used when you create a new website or make significant updates. 
                  Unused credits roll over to the next month.
                </p>
              </div>

              <div className="border-b border-gray-200 pb-8">
                <h3 className="text-xl font-semibold text-gray-900 mb-4">Can I change my plan anytime?</h3>
                <p className="text-gray-600">
                  Yes! You can upgrade or downgrade your plan at any time. Changes take effect immediately, and we'll prorate any charges.
                </p>
              </div>

              <div className="border-b border-gray-200 pb-8">
                <h3 className="text-xl font-semibold text-gray-900 mb-4">What AI models are available?</h3>
                <p className="text-gray-600">
                  Starter plans include standard AI models. Pro and Enterprise plans include access to GPT-4, Claude, Gemini, and other advanced models.
                </p>
              </div>

              <div className="pb-8">
                <h3 className="text-xl font-semibold text-gray-900 mb-4">Is there a free trial?</h3>
                <p className="text-gray-600">
                  Yes! All new users get 50 free credits to start building. No credit card required to begin.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-20 bg-gradient-to-r from-blue-600 to-purple-600 text-white">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="text-4xl font-bold mb-6">Ready to Start Building?</h2>
            <p className="text-xl text-blue-100 mb-8 max-w-2xl mx-auto">
              Join thousands of creators who are already building amazing websites with AI. 
              Start your free trial today.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" className="bg-white text-blue-600 hover:bg-gray-100 px-8 py-3 text-lg font-semibold">
                Start Free Trial
              </Button>
              <Button size="lg" variant="outline" className="border-white text-white hover:bg-white hover:text-blue-600 px-8 py-3 text-lg font-semibold">
                View Demo
              </Button>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}