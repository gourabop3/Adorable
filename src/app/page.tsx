"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { PromptInput, PromptInputActions } from "@/components/ui/prompt-input";
import { FrameworkSelector } from "@/components/framework-selector";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { ExampleButton } from "@/components/ExampleButton";
import { UserApps } from "@/components/user-apps";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { PromptInputTextareaWithTypingAnimation } from "@/components/prompt-input";
import { BillingProvider, useBilling } from "@/contexts/billing-context";
import { PaymentSuccessBanner } from "@/components/payment-success-banner";
import { ModelSelector } from "@/components/model-selector";
import { CreditBalanceBanner } from "@/components/credit-balance-banner";
import { Footer } from "@/components/footer";
import { Navigation } from "@/components/navigation";
import { ArrowRight, Sparkles, Zap, Shield, Globe, Code, Rocket, CheckCircle } from "lucide-react";

const queryClient = new QueryClient();

function HomeContent() {
  const [prompt, setPrompt] = useState("");
  const [framework, setFramework] = useState("nextjs");
  const [model, setModel] = useState("gemini-2.5-pro");
  const [isLoading, setIsLoading] = useState(false);
  const [showPaymentSuccess, setShowPaymentSuccess] = useState(false);
  const [checkingCredits, setCheckingCredits] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const { billing, refetch } = useBilling();

  // Check for payment success parameters
  const success = searchParams.get('success');
  const plan = searchParams.get('plan');
  const credits = searchParams.get('credits');
  const appCreated = searchParams.get('app_created');

  useEffect(() => {
    if (success && !showPaymentSuccess) {
      setShowPaymentSuccess(true);
      // Auto-hide the banner after 10 seconds
      const timer = setTimeout(() => {
        setShowPaymentSuccess(false);
        // Clear the success parameter from URL
        const newUrl = new URL(window.location.href);
        newUrl.searchParams.delete('success');
        newUrl.searchParams.delete('plan');
        newUrl.searchParams.delete('credits');
        window.history.replaceState({}, '', newUrl.toString());
      }, 10000);
      return () => clearTimeout(timer);
    }
  }, [success, showPaymentSuccess]);

  // Refresh billing data when user returns from app creation
  useEffect(() => {
    if (appCreated === 'true') {
      refetch();
      // Remove the parameter from URL
      const newUrl = new URL(window.location.href);
      newUrl.searchParams.delete('app_created');
      window.history.replaceState({}, '', newUrl.toString());
    }
  }, [appCreated, refetch]);

  const handleSubmit = async () => {
    // Generate a unique request ID for tracking
    const requestId = crypto.randomUUID();
    
    // Prevent multiple rapid submissions
    if (isLoading || checkingCredits) {
      console.log(`[${requestId}] Submission blocked - already processing`);
      return;
    }
    
    // Additional check to prevent empty submissions
    if (!prompt.trim()) {
      console.log(`[${requestId}] Submission blocked - empty prompt`);
      return;
    }
    
    console.log(`[${requestId}] Starting app creation process...`);
    
    // Set loading state immediately to prevent double submission
    setIsLoading(true);
    setCheckingCredits(true);

    try {
      // Check if user has enough credits before proceeding
      if (billing && billing.credits < 1) {
        console.log(`[${requestId}] Insufficient credits, redirecting to credit purchase`);
        // Show credit purchase modal or redirect
        alert('You need at least 1 credit to create an app. Please purchase credits to continue.');
        return;
      }

      // Deduct 1 credit for app creation
      try {
        const creditResponse = await fetch('/api/credits/use', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            credits: 1,
            description: `Created app with ${model} model`,
            appId: requestId,
          }),
        });

        if (!creditResponse.ok) {
          const errorData = await creditResponse.json();
          if (errorData.error === 'Insufficient credits') {
            alert(`Insufficient credits. You have ${errorData.currentCredits} credits but need ${errorData.requiredCredits}. Please purchase more credits.`);
            return;
          }
          throw new Error('Failed to deduct credits');
        }

        const creditData = await creditResponse.json();
        console.log(`[${requestId}] Credits deducted successfully. Remaining: ${creditData.remainingCredits}`);
        
        // Update billing context with new credit balance
        if (billing) {
          // Refresh billing data without page reload
          refetch();
        }
      } catch (error) {
        console.error(`[${requestId}] Error deducting credits:`, error);
        alert('Failed to process credit deduction. Please try again.');
        return;
      }

      // Proceed with app creation
      console.log(`[${requestId}] Credits sufficient, proceeding with app creation`);
      router.push(
        `/app/new?message=${encodeURIComponent(prompt)}&template=${framework}&model=${model}`
      );
    } catch (error) {
      console.error(`[${requestId}] Error during app creation:`, error);
      // Fallback to app creation without credit check
      router.push(
        `/app/new?message=${encodeURIComponent(prompt)}&template=${framework}&model=${model}`
      );
    } finally {
      setIsLoading(false);
      setCheckingCredits(false);
    }
  };

  return (
    <QueryClientProvider client={queryClient}>
      <Navigation />
      <main className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
        {showPaymentSuccess && (
          <PaymentSuccessBanner
            plan={plan}
            credits={credits}
            onClose={() => {
              setShowPaymentSuccess(false);
              // Clear the success parameter from URL immediately
              const newUrl = new URL(window.location.href);
              newUrl.searchParams.delete('success');
              newUrl.searchParams.delete('plan');
              newUrl.searchParams.delete('credits');
              window.history.replaceState({}, '', newUrl.toString());
            }}
          />
        )}
        
        {/* Hero Section */}
        <section className="relative overflow-hidden pt-20 pb-16">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-600/10 via-purple-600/10 to-indigo-600/10"></div>
          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center">
              {/* Badge */}
              <div className="inline-flex items-center px-4 py-2 rounded-full bg-blue-100 text-blue-800 text-sm font-medium mb-8">
                <Sparkles className="w-4 h-4 mr-2" />
                AI-Powered Website Builder
              </div>
              
              {/* Main Headline */}
              <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold text-gray-900 mb-6 leading-tight">
                Build Websites with
                <span className="bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 bg-clip-text text-transparent"> AI Magic</span>
              </h1>
              
              {/* Subtitle */}
              <p className="text-xl md:text-2xl text-gray-600 mb-12 max-w-4xl mx-auto leading-relaxed">
                Transform your ideas into stunning, professional websites in seconds. 
                No coding required. Just describe what you want and watch it come to life.
              </p>

              {/* Credit Balance Banner */}
              <CreditBalanceBanner />

              {/* Main Input Section */}
              <div className="max-w-4xl mx-auto mb-16">
                <div className="bg-white rounded-2xl shadow-2xl border border-gray-200 p-6 backdrop-blur-sm">
                  <div className="flex flex-col lg:flex-row gap-4 mb-6">
                    <FrameworkSelector value={framework} onChange={setFramework} />
                    <ModelSelector value={model} onChange={setModel} />
                  </div>
                  
                  <PromptInput
                    isLoading={isLoading}
                    value={prompt}
                    onValueChange={setPrompt}
                    onSubmit={handleSubmit}
                    className="relative z-10"
                  >
                    <PromptInputTextareaWithTypingAnimation />
                    <PromptInputActions>
                      <Button
                        size="lg"
                        onClick={handleSubmit}
                        disabled={isLoading || !prompt.trim()}
                        className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-8 py-3 rounded-xl font-semibold transition-all duration-200 transform hover:scale-105 shadow-lg"
                      >
                        <Rocket className="w-5 h-5 mr-2" />
                        Build Website
                        <ArrowRight className="w-5 h-5 ml-2" />
                      </Button>
                    </PromptInputActions>
                  </PromptInput>
                </div>
              </div>

              {/* Examples */}
              <Examples setPrompt={setPrompt} />
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="py-20 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="text-4xl font-bold text-gray-900 mb-4">
                Why Choose Vibe?
              </h2>
              <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                Built for developers, designers, and entrepreneurs who want to move fast without sacrificing quality.
              </p>
            </div>
            
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              <FeatureCard
                icon={<Zap className="w-8 h-8" />}
                title="Lightning Fast"
                description="Generate complete websites in seconds, not hours. Our AI understands your vision and executes it perfectly."
                color="blue"
              />
              <FeatureCard
                icon={<Code className="w-8 h-8" />}
                title="Production Ready"
                description="Every generated website follows best practices, is fully responsive, and ready for production deployment."
                color="purple"
              />
              <FeatureCard
                icon={<Shield className="w-8 h-8" />}
                title="Enterprise Grade"
                description="Built with security, scalability, and maintainability in mind. Your success is our priority."
                color="green"
              />
              <FeatureCard
                icon={<Globe className="w-8 h-8" />}
                title="Global Deployment"
                description="Deploy to Vercel, Freestyle, or your own infrastructure with just one click."
                color="indigo"
              />
              <FeatureCard
                icon={<Sparkles className="w-8 h-8" />}
                title="AI-Powered"
                description="Leverage the latest AI models including GPT-4, Claude, Gemini, and more for optimal results."
                color="pink"
              />
              <FeatureCard
                icon={<CheckCircle className="w-8 h-8" />}
                title="No Code Required"
                description="Focus on your business logic while we handle the technical implementation. Perfect for non-developers."
                color="emerald"
              />
            </div>
          </div>
        </section>

        {/* Stats Section */}
        <section className="py-20 bg-gradient-to-r from-blue-600 to-purple-600 text-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid md:grid-cols-3 gap-8 text-center">
              <div>
                <div className="text-4xl font-bold mb-2">10,000+</div>
                <div className="text-blue-100">Websites Built</div>
              </div>
              <div>
                <div className="text-4xl font-bold mb-2">99.9%</div>
                <div className="text-blue-100">Uptime</div>
              </div>
              <div>
                <div className="text-4xl font-bold mb-2">24/7</div>
                <div className="text-blue-100">Support</div>
              </div>
            </div>
          </div>
        </section>

        {/* User Apps Section */}
        <section className="py-20 bg-gray-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="text-4xl font-bold text-gray-900 mb-4">
                Your Creations
              </h2>
              <p className="text-xl text-gray-600">
                See all the amazing websites you've built with Vibe
              </p>
            </div>
            <UserApps />
          </div>
        </section>

        <Footer />
      </main>
    </QueryClientProvider>
  );
}

function FeatureCard({ icon, title, description, color }: {
  icon: React.ReactNode;
  title: string;
  description: string;
  color: string;
}) {
  const colorClasses = {
    blue: "text-blue-600 bg-blue-100",
    purple: "text-purple-600 bg-purple-100",
    green: "text-green-600 bg-green-100",
    indigo: "text-indigo-600 bg-indigo-100",
    pink: "text-pink-600 bg-pink-100",
    emerald: "text-emerald-600 bg-emerald-100",
  };

  return (
    <div className="bg-white rounded-2xl p-8 shadow-lg border border-gray-200 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
      <div className={`w-16 h-16 rounded-2xl ${colorClasses[color]} flex items-center justify-center mb-6`}>
        {icon}
      </div>
      <h3 className="text-xl font-semibold text-gray-900 mb-4">{title}</h3>
      <p className="text-gray-600 leading-relaxed">{description}</p>
    </div>
  );
}

export default function Home() {
  return (
    <BillingProvider>
      <HomeContent />
    </BillingProvider>
  );
}

function Examples({ setPrompt }: { setPrompt: (text: string) => void }) {
  const examples = [
    {
      title: "E-commerce Store",
      description: "Modern online store with product catalog, shopping cart, and payment integration",
      prompt: "Build a modern e-commerce website with product catalog, shopping cart, and payment integration.",
      icon: "🛍️"
    },
    {
      title: "Business Website",
      description: "Professional business site with company information, services, and contact forms",
      prompt: "Create a professional business website with company information, services, and contact forms.",
      icon: "🏢"
    },
    {
      title: "Portfolio Site",
      description: "Stunning portfolio to showcase your work, skills, and professional experience",
      prompt: "Build a stunning portfolio website to showcase my work, skills, and professional experience.",
      icon: "🎨"
    },
    {
      title: "Blog Platform",
      description: "Content management system with beautiful typography and reader engagement",
      prompt: "Create a modern blog platform with beautiful typography, categories, and reader engagement features.",
      icon: "📝"
    }
  ];

  return (
    <div className="mb-16">
      <h3 className="text-2xl font-semibold text-gray-900 mb-8 text-center">
        Popular Use Cases
      </h3>
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 max-w-6xl mx-auto">
        {examples.map((example, index) => (
          <ExampleButton
            key={index}
            text={example.title}
            promptText={example.prompt}
            onClick={(text) => {
              console.log("Example clicked:", text);
              setPrompt(text);
            }}
            className="bg-white hover:bg-gray-50 border border-gray-200 rounded-xl p-4 text-center transition-all duration-200 hover:shadow-md"
          />
        ))}
      </div>
    </div>
  );
}
