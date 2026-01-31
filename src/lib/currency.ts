import { queryOne, queryMany } from "./db";
import { ExchangeRate } from "@/types/database";

// DolarAPI.com response type for Blue Dollar
export interface DolarBlueResponse {
  moneda: string;
  casa: string;
  nombre: string;
  compra: number;
  venta: number;
  fechaActualizacion: string;
}

// Fetch Blue Dollar rate from API (cached)
let blueRateCache: { rate: DolarBlueResponse; timestamp: number } | null = null;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

async function getLiveBlueRate(): Promise<DolarBlueResponse | null> {
  // Check cache
  if (blueRateCache && Date.now() - blueRateCache.timestamp < CACHE_DURATION) {
    return blueRateCache.rate;
  }

  try {
    const response = await fetch("https://dolarapi.com/v1/dolares/blue", {
      cache: "no-store",
    });
    if (!response.ok) return null;
    const data: DolarBlueResponse = await response.json();
    blueRateCache = { rate: data, timestamp: Date.now() };
    return data;
  } catch (error) {
    console.error("Error fetching Blue Dollar rate:", error);
    return null;
  }
}

// Get exchange rate - uses live Blue Dollar for ARS
export async function getExchangeRate(
  fromCurrency: string,
  toCurrency: string,
  date: Date = new Date(),
): Promise<number> {
  if (fromCurrency === toCurrency) {
    return 1.0;
  }

  // For ARS <-> USD conversions, use live Blue Dollar rate
  if (
    (fromCurrency === "USD" && toCurrency === "ARS") ||
    (fromCurrency === "ARS" && toCurrency === "USD")
  ) {
    const blueRate = await getLiveBlueRate();
    if (blueRate) {
      if (fromCurrency === "USD" && toCurrency === "ARS") {
        // USD → ARS: multiply by venta (sell price)
        return blueRate.venta;
      } else {
        // ARS → USD: divide by venta (1 / venta)
        return 1 / blueRate.venta;
      }
    }
  }

  // Fallback to database for other currencies
  const dateStr = date.toISOString().split("T")[0];

  // Try direct rate
  const directRate = await queryOne<ExchangeRate>(
    `SELECT rate FROM exchange_rates 
     WHERE from_currency_code = $1 AND to_currency_code = $2 
     AND rate_date <= $3::date
     ORDER BY rate_date DESC LIMIT 1`,
    [fromCurrency, toCurrency, dateStr],
  );

  if (directRate) {
    return Number(directRate.rate);
  }

  // Try inverse rate
  const inverseRate = await queryOne<ExchangeRate>(
    `SELECT rate FROM exchange_rates 
     WHERE from_currency_code = $1 AND to_currency_code = $2 
     AND rate_date <= $3::date
     ORDER BY rate_date DESC LIMIT 1`,
    [toCurrency, fromCurrency, dateStr],
  );

  if (inverseRate) {
    return 1.0 / Number(inverseRate.rate);
  }

  // Fallback - should not happen for ARS/USD
  console.warn(`No exchange rate found for ${fromCurrency} to ${toCurrency}`);
  return 1.0;
}

// Convert amount between currencies
export async function convertCurrency(
  amount: number,
  fromCurrency: string,
  toCurrency: string,
  date: Date = new Date(),
): Promise<{ convertedAmount: number; rate: number }> {
  const rate = await getExchangeRate(fromCurrency, toCurrency, date);
  return {
    convertedAmount: amount * rate,
    rate,
  };
}

// Get all latest exchange rates for a base currency
export async function getLatestRates(
  baseCurrency: string = "USD",
): Promise<Record<string, number>> {
  const rates = await queryMany<{ to_currency_code: string; rate: number }>(
    `SELECT DISTINCT ON (to_currency_code) 
       to_currency_code, rate
     FROM exchange_rates
     WHERE from_currency_code = $1
     ORDER BY to_currency_code, rate_date DESC`,
    [baseCurrency],
  );

  const rateMap: Record<string, number> = { [baseCurrency]: 1.0 };
  rates.forEach((r) => {
    rateMap[r.to_currency_code] = Number(r.rate);
  });

  return rateMap;
}

// Fetch Blue Dollar rate from DolarAPI.com (FREE API - no key needed)
export async function fetchDolarBlue(): Promise<DolarBlueResponse> {
  const response = await fetch("https://dolarapi.com/v1/dolares/blue", {
    next: { revalidate: 300 }, // Cache for 5 minutes
  });

  if (!response.ok) {
    throw new Error(`DolarAPI responded with status ${response.status}`);
  }

  return response.json();
}

// Sync exchange rates using DolarAPI.com (Blue Dollar)
export async function syncExchangeRates(
  baseCurrency: string = "USD",
): Promise<{ compra: number; venta: number; fechaActualizacion: string }> {
  try {
    const blueRate = await fetchDolarBlue();

    const today = new Date().toISOString().split("T")[0];

    // Store the "venta" (sell) rate as USD -> ARS conversion
    // This is what you'd pay to buy USD with ARS (or receive when converting USD to ARS)
    await queryOne(
      `INSERT INTO exchange_rates (from_currency_code, to_currency_code, rate, rate_date, source)
       VALUES ($1, $2, $3, $4::date, 'dolarapi.com/blue')
       ON CONFLICT (from_currency_code, to_currency_code, rate_date) 
       DO UPDATE SET rate = EXCLUDED.rate, source = EXCLUDED.source`,
      [baseCurrency, "ARS", blueRate.venta, today],
    );

    // Also store the buy rate for reference (compra - what you'd get selling USD)
    await queryOne(
      `INSERT INTO exchange_rates (from_currency_code, to_currency_code, rate, rate_date, source)
       VALUES ($1, $2, $3, $4::date, 'dolarapi.com/blue/compra')
       ON CONFLICT (from_currency_code, to_currency_code, rate_date) 
       DO UPDATE SET rate = EXCLUDED.rate, source = EXCLUDED.source`,
      ["ARS", baseCurrency, 1 / blueRate.compra, today],
    );

    console.log(
      `Blue Dollar rates synced: Compra ${blueRate.compra}, Venta ${blueRate.venta}`,
    );

    return {
      compra: blueRate.compra,
      venta: blueRate.venta,
      fechaActualizacion: blueRate.fechaActualizacion,
    };
  } catch (error) {
    console.error("Error syncing Blue Dollar rates:", error);
    throw error;
  }
}

// Get current Blue Dollar rate (cached or fresh)
export async function getBlueRate(): Promise<{
  compra: number;
  venta: number;
  fechaActualizacion: string;
  source: string;
}> {
  try {
    const blueRate = await fetchDolarBlue();
    return {
      compra: blueRate.compra,
      venta: blueRate.venta,
      fechaActualizacion: blueRate.fechaActualizacion,
      source: "dolarapi.com",
    };
  } catch (error) {
    console.error("Error fetching Blue Dollar rate:", error);
    // Fallback to database rate
    const dbRate = await queryOne<ExchangeRate>(
      `SELECT rate, rate_date FROM exchange_rates 
       WHERE from_currency_code = 'USD' AND to_currency_code = 'ARS'
       AND source LIKE '%blue%'
       ORDER BY rate_date DESC LIMIT 1`,
      [],
    );

    if (dbRate) {
      return {
        compra: Number(dbRate.rate) * 0.97, // Approximate spread
        venta: Number(dbRate.rate),
        fechaActualizacion: dbRate.rate_date?.toString() || "",
        source: "database-cached",
      };
    }

    throw error;
  }
}

// Format currency symbol
export function getCurrencySymbol(currencyCode: string): string {
  const symbols: Record<string, string> = {
    USD: "US$",
    ARS: "AR$",
    EUR: "€",
    GBP: "£",
  };
  return symbols[currencyCode] || currencyCode;
}
