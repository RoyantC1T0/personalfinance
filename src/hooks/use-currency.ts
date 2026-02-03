"use client";

import { useState, useCallback } from "react";

type Currency = "USD" | "ARS";

interface CurrencyState {
  baseCurrency: Currency;
  displayCurrency: Currency;
}

interface UseCurrencyOptions {
  initialCurrency?: Currency;
}

export function useCurrency(options?: UseCurrencyOptions) {
  const [state, setState] = useState<CurrencyState>(() => ({
    baseCurrency: options?.initialCurrency || "USD",
    displayCurrency: options?.initialCurrency || "USD",
  }));

  const toggleCurrency = useCallback(() => {
    setState((prev) => ({
      ...prev,
      displayCurrency: prev.displayCurrency === "USD" ? "ARS" : "USD",
    }));
  }, []);

  const setDisplayCurrency = useCallback((currency: Currency) => {
    setState((prev) => ({ ...prev, displayCurrency: currency }));
  }, []);

  const formatAmount = useCallback(
    (
      amount: number,
      conversions?: { USD: { balance: number }; ARS: { balance: number } },
    ) => {
      if (conversions && state.displayCurrency in conversions) {
        const converted =
          conversions[state.displayCurrency as keyof typeof conversions];
        if (typeof converted === "object" && "balance" in converted) {
          return {
            amount: converted.balance,
            currency: state.displayCurrency,
            symbol: state.displayCurrency === "USD" ? "$" : "$",
            prefix: state.displayCurrency === "ARS" ? "ARS " : "USD ",
          };
        }
      }
      return {
        amount,
        currency: state.displayCurrency,
        symbol: "$",
        prefix: state.displayCurrency + " ",
      };
    },
    [state.displayCurrency],
  );

  return {
    ...state,
    toggleCurrency,
    setDisplayCurrency,
    formatAmount,
  };
}
