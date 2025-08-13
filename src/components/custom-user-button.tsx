"use client";

import { useState, useRef, useEffect } from "react";
import { useBilling } from "@/contexts/billing-context";
import { CreditCheck } from "./credit-check";
import { CreditHistory } from "./credit-history";
import { Crown, Coins, Settings, LogOut, ChevronDown, User, LogIn, Plus } from "lucide-react";
import { SignIn, SignUp, useUser } from "@stackframe/stack";
import { useRouter } from "next/navigation";

export function CustomUserButton() {
  const { billing, isAuthenticated } = useBilling();
  const router = useRouter();
  const [showDropdown, setShowDropdown] = useState(false);
  const [showCreditCheck, setShowCreditCheck] = useState(false);
  const [showCreditHistory, setShowCreditHistory] = useState(false);
  const [showSignIn, setShowSignIn] = useState(false);
  const [showSignUp, setShowSignUp] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Always show the dropdown button, but handle content based on auth state

  const isPro = billing?.plan === 'pro';

  return (
    <div className="relative" ref={dropdownRef}>
      {/* User Button with Dropdown Toggle */}
      <button
        onClick={() => setShowDropdown(!showDropdown)}
        className="flex items-center gap-2 p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
      >
        {isAuthenticated ? (
          <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
            <span className="text-white font-semibold text-sm">
              {billing?.name?.charAt(0) || 'U'}
            </span>
          </div>
        ) : (
          <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
            <User className="h-4 w-4 text-gray-600" />
          </div>
        )}
        <ChevronDown className="h-4 w-4 text-gray-500" />
      </button>

      {/* Dropdown Menu */}
      {showDropdown && (
        <div className="absolute right-0 top-full mt-2 w-64 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-50">
          {isAuthenticated ? (
            <>
              {/* User Info Section */}
              <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center text-white font-semibold">
                    {billing?.name?.charAt(0) || 'U'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-900 dark:text-white truncate">
                      {billing?.name || 'User'}
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
                      {billing?.email || 'user@example.com'}
                    </p>
                  </div>
                </div>
                
                {/* Credit Display */}
                <div className="mt-3 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Coins className="h-4 w-4 text-yellow-500" />
                    <span className="text-sm font-medium">
                      {billing?.credits || 0} credits
                    </span>
                  </div>
                  {isPro && (
                    <div className="flex items-center gap-1 text-xs text-purple-600">
                      <Crown className="h-3 w-3" />
                      <span>Pro</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Menu Items for Authenticated Users */}
              <div className="py-2">
                {/* Upgrade Option */}
                {!isPro && (
                  <button
                    onClick={() => {
                      setShowDropdown(false);
                      setShowCreditCheck(true);
                    }}
                    className="w-full flex items-center gap-3 px-4 py-2 text-left hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                  >
                    <Crown className="h-4 w-4 text-purple-600" />
                    <span className="font-medium">Upgrade to Pro</span>
                  </button>
                )}

                {/* Credit History */}
                <button
                  onClick={() => {
                    setShowDropdown(false);
                    setShowCreditHistory(true);
                  }}
                  className="w-full flex items-center gap-3 px-4 py-2 text-left hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                >
                  <Coins className="h-4 w-4 text-blue-600" />
                  <span>Credit History</span>
                </button>

                {/* Settings */}
                <button
                  onClick={() => setShowDropdown(false)}
                  className="w-full flex items-center gap-3 px-4 py-2 text-left hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                >
                  <Settings className="h-4 w-4 text-gray-600" />
                  <span>Settings</span>
                </button>

                {/* Logout */}
                <button
                  onClick={() => {
                    setShowDropdown(false);
                    try {
                      // Clear any stored tokens/cookies
                      document.cookie.split(";").forEach(function(c) { 
                        document.cookie = c.replace(/^ +/, "").replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/"); 
                      });
                      // Redirect to home page to trigger re-authentication
                      router.push('/');
                      console.log('Logout successful - redirected to home');
                    } catch (error) {
                      console.error('Logout error:', error);
                      // Fallback: just redirect
                      router.push('/');
                    }
                  }}
                  className="w-full flex items-center gap-3 px-4 py-2 text-left hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors text-red-600"
                >
                  <LogOut className="h-4 w-4" />
                  <span>Logout</span>
                </button>
              </div>
            </>
          ) : (
            <>
              {/* Menu Items for Unauthenticated Users */}
              <div className="p-4">
                <div className="text-center mb-4">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    Welcome to VIBE
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Sign in to access your account
                  </p>
                </div>
                
                <div className="space-y-2">
                  {/* Sign In Button */}
                  <button
                    onClick={() => {
                      setShowDropdown(false);
                      setShowSignIn(true);
                    }}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors"
                  >
                    <LogIn className="h-4 w-4" />
                    <span>Sign In</span>
                  </button>
                  
                  {/* Get Started Button */}
                  <button
                    onClick={() => {
                      setShowDropdown(false);
                      setShowSignUp(true);
                    }}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2 border border-purple-600 text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
                  >
                    <Plus className="h-4 w-4" />
                    <span>Get Started</span>
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {/* Modals */}
      {showCreditCheck && (
        <CreditCheck
          onClose={() => setShowCreditCheck(false)}
          currentCredits={billing?.credits || 0}
          currentPlan={billing?.plan || 'free'}
        />
      )}
      
      {showCreditHistory && (
        <CreditHistory
          onClose={() => setShowCreditHistory(false)}
        />
      )}

      {/* Stack Auth Components */}
      {showSignIn && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="relative w-full max-w-md mx-4">
            <SignIn fullPage={false} />
          </div>
        </div>
      )}
      
      {showSignUp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-white">
          <div className="relative w-full max-w-md mx-4">
            <SignUp fullPage={false} />
          </div>
        </div>
      )}
    </div>
  );
}