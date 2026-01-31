"use client";

import { useState, useEffect, useCallback } from "react";

interface BlueRate {
  compra: number;
  venta: number;
  fechaActualizacion: string;
  source: string;
}

interface ExchangeRatesData {
  base_currency: string;
  rates: Record<string, number>;
  blue_dollar: BlueRate | null;
  last_updated: string | null;
}

export function useBlueRate() {
  const [blueRate, setBlueRate] = useState<BlueRate | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchBlueRate = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch("/api/exchange-rates");
      if (!response.ok) throw new Error("Failed to fetch rates");

      const data: ExchangeRatesData = await response.json();
      setBlueRate(data.blue_dollar);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error fetching rate");
    } finally {
      setIsLoading(false);
    }
  }, []);

  const syncRate = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await fetch("/api/exchange-rates", { method: "POST" });
      if (!response.ok) throw new Error("Failed to sync rates");

      const data = await response.json();
      setBlueRate(data.blue_dollar);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error syncing rate");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchBlueRate();
  }, [fetchBlueRate]);

  return {
    blueRate,
    isLoading,
    error,
    refetch: fetchBlueRate,
    sync: syncRate,
  };
}
