"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface BillingData {
  credits: number;
  plan: 'free' | 'pro';
  stripeCustomerId?: string;
}

interface BillingContextType {
  billing: BillingData | null;
  isLoading: boolean;
  error: string | null;
  isAuthenticated: boolean;
  refetch: () => Promise<void>;
}

const defaultBilling: BillingData = {
  credits: 0,
  plan: 'free'
};

const BillingContext = createContext<BillingContextType>({
  billing: defaultBilling,
  isLoading: false,
  error: null,
  isAuthenticated: false,
  refetch: async () => {}
});

export const useBilling = () => {
  const context = useContext(BillingContext);
  if (!context) {
    throw new Error('useBilling must be used within a BillingProvider');
  }
  return context;
};

interface BillingProviderProps {
  children: ReactNode;
}

export const BillingProvider: React.FC<BillingProviderProps> = ({ children }) => {
  const [billing, setBilling] = useState<BillingData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  const fetchBillingData = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch('/api/user/billing');
      
      if (response.status === 401) {
        // User not authenticated - this is fine
        setIsAuthenticated(false);
        setBilling(null);
        return;
      }

      if (!response.ok) {
        // API error - use fallback
        console.warn('Billing API error, using fallback data');
        setIsAuthenticated(true);
        setBilling(defaultBilling);
        setError('Billing data temporarily unavailable');
        return;
      }

      const data = await response.json();
      
      if (data.user && data.user.id) {
        setIsAuthenticated(true);
        setBilling({
          credits: data.user.credits || 0,
          plan: data.user.plan || 'free',
          stripeCustomerId: data.user.stripeCustomerId
        });
      } else {
        // Invalid response - use fallback
        setIsAuthenticated(true);
        setBilling(defaultBilling);
        setError('Invalid billing data, using defaults');
      }
    } catch (error) {
      // Network error - use fallback, don't break the app
      console.warn('Billing fetch failed, using fallback:', error);
      setIsAuthenticated(true); // Assume authenticated if we can't check
      setBilling(defaultBilling);
      setError('Billing service temporarily unavailable');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchBillingData();
  }, []);

  const value: BillingContextType = {
    billing,
    isLoading,
    error,
    isAuthenticated,
    refetch: fetchBillingData
  };

  return (
    <BillingContext.Provider value={value}>
      {children}
    </BillingContext.Provider>
  );
};