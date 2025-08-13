"use client";

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "./ui/dialog";
import { Button } from "./ui/button";
import { Coins, Clock, TrendingUp, TrendingDown, Receipt } from "lucide-react";

interface CreditTransaction {
  id: string;
  amount: number;
  description: string;
  type: 'purchase' | 'usage' | 'refund';
  createdAt: string;
  metadata?: any;
}

interface CreditHistoryProps {
  onClose: () => void;
}

export function CreditHistory({ onClose }: CreditHistoryProps) {
  const [transactions, setTransactions] = useState<CreditTransaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchTransactions();
  }, []);

  const fetchTransactions = async () => {
    try {
      const response = await fetch('/api/credits/history');
      if (response.ok) {
        const data = await response.json();
        setTransactions(data.transactions || []);
      }
    } catch (error) {
      console.error('Failed to fetch transactions:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getTransactionIcon = (type: string, amount: number) => {
    if (type === 'purchase') {
      return <TrendingUp className="h-4 w-4 text-green-600" />;
    } else if (type === 'usage') {
      return <TrendingDown className="h-4 w-4 text-red-600" />;
    } else {
      return <Receipt className="h-4 w-4 text-blue-600" />;
    }
  };

  const getTransactionColor = (type: string, amount: number) => {
    if (type === 'purchase' || amount > 0) {
      return 'text-green-600';
    } else {
      return 'text-red-600';
    }
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="text-center flex items-center justify-center gap-2">
            <Coins className="h-6 w-6 text-yellow-500" />
            Credit History
          </DialogTitle>
        </DialogHeader>
        
        <div className="flex-1 overflow-y-auto">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : transactions.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Coins className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p>No credit transactions yet</p>
              <p className="text-sm">Your credit usage and purchases will appear here</p>
            </div>
          ) : (
            <div className="space-y-3 p-2">
              {transactions.map((transaction) => (
                <div
                  key={transaction.id}
                  className="flex flex-col sm:flex-row sm:items-center justify-between p-3 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors gap-2"
                >
                  <div className="flex items-center gap-3 flex-1">
                    <div className="flex items-center justify-center w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-800 flex-shrink-0">
                      {getTransactionIcon(transaction.type, transaction.amount)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-sm truncate">
                        {transaction.description}
                      </p>
                      <div className="flex items-center gap-2 text-xs text-gray-500">
                        <Clock className="h-3 w-3" />
                        {formatDate(transaction.createdAt)}
                      </div>
                    </div>
                  </div>
                  
                  <div className={`font-semibold text-right ${getTransactionColor(transaction.type, transaction.amount)}`}>
                    {transaction.amount > 0 ? '+' : ''}{transaction.amount} credits
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        
        <div className="pt-4 border-t">
          <Button
            onClick={onClose}
            className="w-full"
          >
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}