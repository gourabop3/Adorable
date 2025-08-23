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
      <main className="min-h-screen bg-background">

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
        
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col items-center text-center pt-16 sm:pt-20 md:pt-24 lg:pt-32 pb-12">
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight text-foreground max-w-4xl">
              Build websites with AI
            </h1>
            <p className="mt-6 text-lg sm:text-xl text-muted-foreground max-w-2xl leading-relaxed">
              Transform your ideas into stunning websites in seconds. No coding required.
            </p>

            {/* Credit Balance Banner */}
            <div className="mt-8">
              <CreditBalanceBanner />
            </div>

            <div className="w-full max-w-3xl mt-8 mb-8">
              <div className="rounded-lg border border-border bg-background p-4">
                <PromptInput
                  leftSlot={
                    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 w-full sm:w-auto">
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
                      variant="default"
                      size="default"
                      onClick={handleSubmit}
                      disabled={isLoading || !prompt.trim()}
                      className="w-full sm:w-auto"
                      aria-label={isLoading ? "Creating your website..." : "Build website with AI"}
                      aria-describedby="build-website-description"
                    >
                      {isLoading ? (
                        <>
                          <div 
                            className="w-4 h-4 border-2 border-current/30 border-t-current rounded-full animate-spin mr-2" 
                            aria-hidden="true"
                          />
                          <span aria-live="polite">Creating...</span>
                        </>
                      ) : (
                        <>
                          Build Website
                        </>
                      )}
                    </Button>
                    <div id="build-website-description" className="sr-only">
                      Click to generate a website based on your description using AI
                    </div>
                  </PromptInputActions>
                </PromptInput>
              </div>
            </div>
            
            <Examples setPrompt={setPrompt} />
            
            <div className="mt-16 mb-16">
              <div className="text-center">
                <p className="text-sm text-muted-foreground">
                  Trusted by thousands of creators worldwide
                </p>
              </div>
            </div>
          </div>
        </div>
        <div className="border-t border-border py-12">
          <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
            <UserApps />
          </div>
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
