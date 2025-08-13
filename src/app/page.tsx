"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { PromptInput, PromptInputActions } from "@/components/ui/prompt-input";
import { FrameworkSelector } from "@/components/framework-selector";
import Image from "next/image";
import LogoSvg from "@/logo.svg";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { ExampleButton } from "@/components/ExampleButton";
import { UserButtonWithBilling } from "@/components/user-button-with-billing";
import { UserApps } from "@/components/user-apps";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { PromptInputTextareaWithTypingAnimation } from "@/components/prompt-input";
import { BillingProvider, useBilling } from "@/contexts/billing-context";
import { PaymentSuccessBanner } from "@/components/payment-success-banner";
import { ModelSelector } from "@/components/model-selector";

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

  // Refresh billing data when window regains focus (user returns from app creation)
  useEffect(() => {
    const handleFocus = () => {
      console.log('Window focused, refreshing billing data...');
      refetch();
    };

    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [refetch]);

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
    if (isDevelopment) {
      console.log(`[${requestId}] Development mode detected - double execution possible`);
    }
    
    setIsLoading(true);
    setCheckingCredits(true);

    try {
      // Check if user has enough credits before proceeding
      if (billing && billing.credits < 5) {
        console.log(`[${requestId}] Insufficient credits, redirecting to upgrade`);
        // Redirect to upgrade page with current parameters
        const upgradeUrl = new URL('/billing', window.location.origin);
        upgradeUrl.searchParams.set('redirect', encodeURIComponent(window.location.pathname + window.location.search));
        upgradeUrl.searchParams.set('prompt', prompt);
        upgradeUrl.searchParams.set('framework', framework);
        upgradeUrl.searchParams.set('model', model);
        window.location.href = upgradeUrl.toString();
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
      <main className="min-h-screen p-4 relative">
        <div className="flex w-full justify-between items-center">
          <h1 className="text-lg font-bold flex-1 sm:w-80">
            <a href="https://www.freestyle.sh">freestyle.sh</a>
          </h1>
          <Image
            className="dark:invert mx-2"
            src={LogoSvg}
            alt="Adorable Logo"
            width={36}
            height={36}
          />
          <div className="flex items-center gap-2 flex-1 sm:w-80 justify-end">
            <UserButtonWithBilling />
          </div>
        </div>

        {showPaymentSuccess && (
          <PaymentSuccessBanner
            plan={plan}
            credits={credits}
            onClose={() => setShowPaymentSuccess(false)}
          />
        )}
        
        <div>
          <div className="w-full max-w-lg px-4 sm:px-0 mx-auto flex flex-col items-center mt-16 sm:mt-24 md:mt-32 col-start-1 col-end-1 row-start-1 row-end-1 z-10">
            <p className="text-neutral-600 text-center mb-6 text-3xl sm:text-4xl md:text-5xl font-bold">
              Let AI Cook
            </p>

            <div className="w-full relative my-5">
              <div className="relative w-full max-w-full overflow-hidden">
                <div className="w-full bg-accent rounded-md relative z-10 border transition-colors">
                  <PromptInput
                    leftSlot={
                      <div className="flex items-center gap-1">
                        <FrameworkSelector value={framework} onChange={setFramework} />
                        <ModelSelector value={model as any} onChange={setModel as any} />
                      </div>
                    }
                    isLoading={isLoading}
                    value={prompt}
                    onValueChange={setPrompt}
                    onSubmit={handleSubmit}
                    className="relative z-10 border-none bg-transparent shadow-none focus-within:border-gray-400 focus-within:ring-1 focus-within:ring-gray-200 transition-all duration-200 ease-in-out "
                  >
                    <PromptInputTextareaWithTypingAnimation />
                    <PromptInputActions>
                      <Button
                        variant={"ghost"}
                        size="sm"
                        onClick={handleSubmit}
                        disabled={isLoading || !prompt.trim()}
                        className="h-7 text-xs"
                      >
                        <span className="hidden sm:inline">Start Creating ⏎</span>
                        <span className="sm:hidden">Create ⏎</span>
                      </Button>
                    </PromptInputActions>
                  </PromptInput>
                </div>
              </div>
            </div>
            <Examples setPrompt={setPrompt} />
            <div className="mt-8 mb-16">
              <a
                href="https://freestyle.sh"
                className="border rounded-md px-4 py-2 mt-4 text-sm font-semibold transition-colors duration-200 ease-in-out cursor-pointer w-full max-w-72 text-center block"
              >
                <span className="block font-bold">
                  By <span className="underline">freestyle.sh</span>
                </span>
                <span className="text-xs">JavaScript infrastructure for AI.</span>
              </a>
            </div>
          </div>
        </div>
        <div className="border-t py-8 mx-0 sm:-mx-4">
          <UserApps />
        </div>
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
      <div className="flex flex-wrap justify-center gap-2 px-2">
        <ExampleButton
          text="Dog Food Marketplace"
          promptText="Build a dog food marketplace where users can browse and purchase premium dog food."
          onClick={(text) => {
            console.log("Example clicked:", text);
            setPrompt(text);
          }}
        />
        <ExampleButton
          text="Personal Website"
          promptText="Create a personal website with portfolio, blog, and contact sections."
          onClick={(text) => {
            console.log("Example clicked:", text);
            setPrompt(text);
          }}
        />
        <ExampleButton
          text="Burrito B2B SaaS"
          promptText="Build a B2B SaaS for burrito shops to manage inventory, orders, and delivery logistics."
          onClick={(text) => {
            console.log("Example clicked:", text);
            setPrompt(text);
          }}
        />
      </div>
    </div>
  );
}
