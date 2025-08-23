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
  const { billing, refetch, isAuthenticated } = useBilling();

  // Check for payment success parameters
  const success = searchParams.get('success');
  const plan = searchParams.get('plan');
  const credits = searchParams.get('credits');
  const appCreated = searchParams.get('app_created');

      // Development mode detection
    const isDevelopment = process.env.NODE_ENV === 'development';

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
      <main className="min-h-screen relative overflow-hidden bg-gradient-to-br from-background via-primary/[0.02] to-blue-500/[0.02]">

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
        
        <div className="relative">
          {/* Background Elements */}
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-purple-500/5 to-blue-500/5 rounded-3xl" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(120,119,198,0.1),transparent_50%)]" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_80%,rgba(139,92,246,0.1),transparent_50%)]" />
          
          <div className="relative w-full max-w-4xl px-4 sm:px-6 lg:px-8 mx-auto flex flex-col items-center pt-16 sm:pt-20 md:pt-24 lg:pt-32 pb-8">
            <div className="text-center space-y-6 animate-fade-in">
              <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight" aria-label="Build Websites with AI Magic">
                <span className="block">Build Websites</span>
                <span className="block gradient-text" aria-hidden="true">with AI Magic</span>
              </h1>
              <p className="text-lg sm:text-xl md:text-2xl text-muted-foreground max-w-3xl mx-auto leading-relaxed animate-slide-up" role="banner">
                Transform your ideas into stunning, professional websites in seconds. 
                No coding required. Just describe what you want and watch it come to life with our advanced AI technology.
              </p>
            </div>

            {/* Credit Balance Banner */}
            <div className="animate-slide-up">
              <CreditBalanceBanner />
            </div>

            <div className="w-full max-w-3xl relative mt-8 mb-8 animate-scale-in">
              <div className="relative group">
                <div className="absolute -inset-1 bg-gradient-to-r from-primary/20 to-blue-500/20 rounded-2xl blur opacity-75 group-hover:opacity-100 transition duration-300"></div>
                <div className="relative bg-white/80 backdrop-blur-lg rounded-xl border border-border/50 shadow-large p-2">
                  <PromptInput
                    leftSlot={
                      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 w-full sm:w-auto p-2">
                        <FrameworkSelector value={framework} onChange={setFramework} />
                        <ModelSelector value={model as any} onChange={setModel as any} />
                      </div>
                    }
                    isLoading={isLoading}
                    value={prompt}
                    onValueChange={setPrompt}
                    onSubmit={handleSubmit}
                    className="border-none bg-transparent shadow-none focus-within:ring-0 focus-within:border-0"
                  >
                    <PromptInputTextareaWithTypingAnimation />
                    <PromptInputActions>
                      <Button
                        variant="gradient"
                        size="lg"
                        onClick={handleSubmit}
                        disabled={isLoading || !prompt.trim()}
                        className="w-full sm:w-auto shadow-large"
                        aria-label={isLoading ? "Creating your website..." : "Build website with AI"}
                        aria-describedby="build-website-description"
                      >
                        <span className="flex items-center gap-2">
                          {isLoading ? (
                            <>
                              <div 
                                className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" 
                                aria-hidden="true"
                              />
                              <span aria-live="polite">Creating...</span>
                            </>
                          ) : (
                            <>
                              <span aria-hidden="true">✨</span> Build Website
                              <span className="hidden sm:inline" aria-hidden="true">⏎</span>
                            </>
                          )}
                        </span>
                      </Button>
                      <div id="build-website-description" className="sr-only">
                        Click to generate a website based on your description using AI
                      </div>
                    </PromptInputActions>
                  </PromptInput>
                </div>
              </div>
            </div>
            
            <div className="animate-slide-up">
              <Examples setPrompt={setPrompt} />
            </div>
            
            <div className="mt-12 mb-16 animate-fade-in">
              <div className="text-center space-y-6">
                <p className="text-base text-muted-foreground font-medium">
                  Trusted by thousands of creators worldwide
                </p>
                <div className="flex flex-wrap justify-center gap-4 md:gap-6 text-sm text-muted-foreground">
                  <div className="flex items-center gap-2 bg-white/60 backdrop-blur-sm px-4 py-3 rounded-full shadow-soft hover:shadow-medium transition-all duration-200 animate-stagger-1">
                    <span className="text-lg" aria-hidden="true">⚡</span>
                    <span className="font-medium">Lightning Fast</span>
                  </div>
                  <div className="flex items-center gap-2 bg-white/60 backdrop-blur-sm px-4 py-3 rounded-full shadow-soft hover:shadow-medium transition-all duration-200 animate-stagger-2">
                    <span className="text-lg" aria-hidden="true">🎨</span>
                    <span className="font-medium">Beautiful Design</span>
                  </div>
                  <div className="flex items-center gap-2 bg-white/60 backdrop-blur-sm px-4 py-3 rounded-full shadow-soft hover:shadow-medium transition-all duration-200 animate-stagger-3">
                    <span className="text-lg" aria-hidden="true">🔒</span>
                    <span className="font-medium">Secure & Reliable</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="border-t border-border/30 py-12 mx-4 sm:mx-8">
          <UserApps />
        </div>
        <Footer />
      </main>
    </QueryClientProvider>
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
  return (
    <div className="mt-2">
      <div className="flex flex-col sm:flex-row flex-wrap justify-center gap-2 px-2">
        <ExampleButton
          text="E-commerce Store"
          promptText="Build a modern e-commerce website with product catalog, shopping cart, and payment integration."
          onClick={(text) => {
            console.log("Example clicked:", text);
            setPrompt(text);
          }}
        />
        <ExampleButton
          text="Business Website"
          promptText="Create a professional business website with company information, services, and contact forms."
          onClick={(text) => {
            console.log("Example clicked:", text);
            setPrompt(text);
          }}
        />
        <ExampleButton
          text="Portfolio Site"
          promptText="Build a stunning portfolio website to showcase my work, skills, and professional experience."
          onClick={(text) => {
            console.log("Example clicked:", text);
            setPrompt(text);
          }}
        />
      </div>
    </div>
  );
}
