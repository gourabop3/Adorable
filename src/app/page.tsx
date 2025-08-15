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
      <main className="min-h-screen p-4 relative">

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
        
        <div>
          <div className="w-full max-w-lg px-4 sm:px-0 mx-auto flex flex-col items-center mt-12 sm:mt-16 md:mt-24 lg:mt-32 col-start-1 col-end-1 row-start-1 row-end-1 z-10">
            <p className="text-neutral-600 text-center mb-4 sm:mb-6 text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold">
              Build Websites with AI
            </p>
            <p className="text-lg text-neutral-500 text-center mb-8 max-w-2xl mx-auto">
              Transform your ideas into stunning, professional websites in seconds. 
              No coding required. Just describe what you want and watch it come to life.
            </p>

            <div className="flex gap-4 justify-center mb-6">
              <Button
                onClick={() => router.push('/sandbox')}
                variant="outline"
                className="flex items-center gap-2 bg-gradient-to-r from-blue-500 to-purple-600 text-white border-none hover:from-blue-600 hover:to-purple-700"
              >
                🚀 Try Sandbox Mode
              </Button>
            </div>

            {/* Credit Balance Banner */}
            <CreditBalanceBanner />

            <div className="w-full relative my-4 sm:my-5">
              <div className="relative w-full max-w-full overflow-hidden">
                <div className="w-full bg-accent rounded-md relative z-10 border transition-colors">
                  <PromptInput
                    leftSlot={
                      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-1 w-full sm:w-auto">
                        <FrameworkSelector value={framework} onChange={setFramework} />
                        <ModelSelector value={model as any} onChange={setModel as any} />
                      </div>
                    }
                    isLoading={isLoading}
                    value={prompt}
                    onValueChange={setPrompt}
                    onSubmit={handleSubmit}
                    className="relative z-10 border-none bg-transparent shadow-none focus-within:border-gray-400 focus-within:ring-1 focus-within:ring-gray-200 transition-all duration-200 ease-in-out"
                  >
                    <PromptInputTextareaWithTypingAnimation />
                    <PromptInputActions>
                      <Button
                        variant={"ghost"}
                        size="sm"
                        onClick={handleSubmit}
                        disabled={isLoading || !prompt.trim()}
                        className="h-8 sm:h-7 text-xs w-full sm:w-auto"
                      >
                        <span className="hidden sm:inline">Build Website ⏎</span>
                        <span className="sm:hidden">Build Website ⏎</span>
                      </Button>
                    </PromptInputActions>
                  </PromptInput>
                </div>
              </div>
            </div>
            <Examples setPrompt={setPrompt} />
            <div className="mt-6 sm:mt-8 mb-12 sm:mb-16">
              <div className="text-center">
                <p className="text-sm text-gray-500 mb-4">
                  Trusted by thousands of creators worldwide
                </p>
                <div className="flex justify-center space-x-6 text-xs text-gray-400">
                  <span>⚡ Lightning Fast</span>
                  <span>🎨 Beautiful Design</span>
                  <span>🔒 Secure & Reliable</span>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="border-t py-8 mx-0 sm:-mx-4">
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
