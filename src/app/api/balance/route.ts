import { NextRequest, NextResponse } from "next/server";
import { query, queryOne } from "@/lib/db";
import { authenticateRequest } from "@/lib/auth";
import { getBlueRate } from "@/lib/currency";
import { UserBalanceCache } from "@/types/database";

// GET - Get current balance
export async function GET(request: NextRequest) {
  try {
    const auth = await authenticateRequest(request);
    if (!auth) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get cached balance
    const balance = await queryOne<
      UserBalanceCache & { monthly_income: number | null }
    >(
      `SELECT ubc.*, up.monthly_income 
       FROM user_balance_cache ubc
       LEFT JOIN user_preferences up ON ubc.user_id = up.user_id
       WHERE ubc.user_id = $1`,
      [auth.userId],
    );

    if (!balance) {
      return NextResponse.json({
        current_month_income: 0,
        current_month_expenses: 0,
        current_month_balance: 0,
        total_savings: 0,
        currency_code: "USD",
        conversions: {
          USD: { income: 0, expenses: 0, balance: 0 },
          ARS: { income: 0, expenses: 0, balance: 0 },
        },
        last_updated: new Date().toISOString(),
      });
    }

    // Get Blue Dollar rate for ARS conversion (using "venta" price)
    let arsRate = 1;
    let blueRateInfo = null;
    try {
      const blueRate = await getBlueRate();
      arsRate = blueRate.venta; // Use "venta" (sell) price for USD → ARS
      blueRateInfo = blueRate;
    } catch (error) {
      console.warn("Could not fetch Blue Dollar rate, using fallback:", error);
      arsRate = 1;
    }

    const monthlyIncome = Number(balance.monthly_income) || 0;
    const income = Number(balance.current_month_income) + monthlyIncome;
    const expenses = Number(balance.current_month_expenses);
    const netBalance = income - expenses;

    // Calculate total savings
    const savingsResult = await queryOne<{ total: string }>(
      `SELECT COALESCE(SUM(base_amount), 0) as total FROM savings_contributions WHERE user_id = $1`,
      [auth.userId],
    );
    const totalSavings = parseFloat(savingsResult?.total || "0");

    return NextResponse.json({
      current_month_income: income,
      current_month_expenses: expenses,
      current_month_balance: netBalance,
      monthly_base_income: monthlyIncome,
      extra_income: Number(balance.current_month_income),
      total_savings: totalSavings,
      currency_code: balance.currency_code,
      conversions: {
        USD: {
          income,
          expenses,
          balance: netBalance,
          savings: totalSavings,
        },
        ARS: {
          income: income * arsRate,
          expenses: expenses * arsRate,
          balance: netBalance * arsRate,
          savings: totalSavings * arsRate,
        },
      },
      exchange_rate: {
        USD_to_ARS: arsRate,
        blue_dollar: blueRateInfo,
        updated_at: new Date().toISOString(),
      },
      last_updated: balance.last_updated,
    });
  } catch (error) {
    console.error("Get balance error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

// POST - Set monthly income
export async function POST(request: NextRequest) {
  try {
    const auth = await authenticateRequest(request);
    if (!auth) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { monthly_income } = body;

    if (monthly_income === undefined || monthly_income < 0) {
      return NextResponse.json(
        { error: "Invalid monthly income" },
        { status: 400 },
      );
    }

    // Update user preferences
    await query(
      `UPDATE user_preferences SET monthly_income = $1, updated_at = CURRENT_TIMESTAMP 
       WHERE user_id = $2`,
      [monthly_income, auth.userId],
    );

    // Recalculate balance
    const monthStart = new Date();
    monthStart.setDate(1);
    monthStart.setHours(0, 0, 0, 0);
    const monthStartStr = monthStart.toISOString().split("T")[0];

    await query(
      `UPDATE user_balance_cache SET
        current_month_balance = COALESCE((
          SELECT SUM(CASE WHEN transaction_type = 'income' THEN base_amount ELSE -base_amount END)
          FROM transactions 
          WHERE user_id = $1 
          AND transaction_date >= $2::date AND transaction_date < ($2::date + INTERVAL '1 month')
        ), 0) + $3,
        last_updated = CURRENT_TIMESTAMP
      WHERE user_id = $1`,
      [auth.userId, monthStartStr, monthly_income],
    );

    return NextResponse.json({ success: true, monthly_income });
  } catch (error) {
    console.error("Set monthly income error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
