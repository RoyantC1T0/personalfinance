"use client";

import { useState, useEffect, useCallback } from "react";
import { balanceApi } from "@/lib/api-client";

interface BalanceData {
  current_month_income: number;
  current_month_expenses: number;
  current_month_balance: number;
  monthly_base_income: number;
  extra_income: number;
  total_savings: number;
  currency_code: string;
  conversions: {
    USD: { income: number; expenses: number; balance: number; savings: number };
    ARS: { income: number; expenses: number; balance: number; savings: number };
  };
  exchange_rate: {
    USD_to_ARS: number;
    updated_at: string;
  };
  last_updated: string;
}

export function useBalance() {
  const [balance, setBalance] = useState<BalanceData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchBalance = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await balanceApi.get();
      setBalance(data as BalanceData);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch balance");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchBalance();
  }, [fetchBalance]);

  const setMonthlyIncome = async (amount: number) => {
    await balanceApi.setMonthlyIncome(amount);
    await fetchBalance();
  };

  return {
    balance,
    isLoading,
    error,
    refetch: fetchBalance,
    setMonthlyIncome,
  };
}
