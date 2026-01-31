import { NextRequest, NextResponse } from "next/server";
import { queryMany } from "@/lib/db";
import { authenticateRequest } from "@/lib/auth";
import { getLatestRates, syncExchangeRates, getBlueRate } from "@/lib/currency";
import { ExchangeRate } from "@/types/database";

// GET - Get latest exchange rates including Blue Dollar
export async function GET(request: NextRequest) {
  try {
    const auth = await authenticateRequest(request);
    if (!auth) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const base = searchParams.get("base") || "USD";

    // Get database rates
    const rates = await getLatestRates(base);

    // Get rate details
    const rateDetails = await queryMany<ExchangeRate>(
      `SELECT DISTINCT ON (to_currency_code) *
       FROM exchange_rates
       WHERE from_currency_code = $1
       ORDER BY to_currency_code, rate_date DESC`,
      [base],
    );

    // Get live Blue Dollar rate
    let blueRate = null;
    try {
      blueRate = await getBlueRate();
    } catch {
      console.warn("Could not fetch Blue Dollar rate");
    }

    return NextResponse.json({
      base_currency: base,
      rates,
      rate_details: rateDetails,
      last_updated: rateDetails[0]?.rate_date || null,
      blue_dollar: blueRate,
    });
  } catch (error) {
    console.error("Get exchange rates error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

// POST - Sync exchange rates from DolarAPI.com (Blue Dollar)
export async function POST(request: NextRequest) {
  try {
    const auth = await authenticateRequest(request);
    if (!auth) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Sync Blue Dollar rate
    const blueResult = await syncExchangeRates("USD");

    // Get updated rates
    const rates = await getLatestRates("USD");

    return NextResponse.json({
      success: true,
      message: "Blue Dollar rate synced successfully",
      blue_dollar: blueResult,
      rates,
    });
  } catch (error) {
    console.error("Sync exchange rates error:", error);
    return NextResponse.json(
      { error: "Failed to sync exchange rates" },
      { status: 500 },
    );
  }
}
