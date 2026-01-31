import { NextRequest, NextResponse } from "next/server";
import { query, queryOne } from "@/lib/db";
import { authenticateRequest } from "@/lib/auth";
import { convertCurrency } from "@/lib/currency";
import { SavingsContribution, CreateContributionInput } from "@/types/database";

interface RouteParams {
  params: Promise<{ id: string }>;
}

// POST - Add contribution to savings goal
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const auth = await authenticateRequest(request);
    if (!auth) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const goalId = parseInt(id);
    const body: CreateContributionInput = await request.json();
    const { amount, currency_code, contribution_date, notes } = body;

    if (!amount || !currency_code || !contribution_date) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 },
      );
    }

    // Verify goal exists and belongs to user - get goal currency
    const goal = await queryOne<{ goal_id: number; currency_code: string }>(
      "SELECT goal_id, currency_code FROM savings_goals WHERE goal_id = $1 AND user_id = $2 AND is_active = true",
      [goalId, auth.userId],
    );

    if (!goal) {
      return NextResponse.json({ error: "Goal not found" }, { status: 404 });
    }

    // Convert contribution to the goal's currency
    // For example: if goal is in ARS and contribution is in USD, convert USD to ARS
    // If goal is in USD and contribution is in ARS, convert ARS to USD
    const goalCurrency = goal.currency_code;
    let convertedAmount = amount;
    let rate = 1;

    if (currency_code !== goalCurrency) {
      const conversion = await convertCurrency(
        amount,
        currency_code,
        goalCurrency,
        new Date(contribution_date),
      );
      convertedAmount = conversion.convertedAmount;
      rate = conversion.rate;
    }

    const result = await queryOne<SavingsContribution>(
      `INSERT INTO savings_contributions 
       (user_id, goal_id, amount, currency_code, contribution_date, base_currency_code, base_amount, exchange_rate_used, notes)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *`,
      [
        auth.userId,
        goalId,
        amount,
        currency_code,
        contribution_date,
        goalCurrency, // Use goal's currency as base
        convertedAmount, // Amount converted to goal's currency
        rate,
        notes || null,
      ],
    );

    // Update total savings in balance cache
    // The query handles conversion internally by checking currency
    await query(
      `UPDATE user_balance_cache SET
        total_savings = COALESCE((
          SELECT SUM(
            CASE 
              WHEN sc.base_currency_code = 'USD' THEN sc.base_amount
              ELSE sc.base_amount / NULLIF(sc.exchange_rate_used, 0)
            END
          ) FROM savings_contributions sc WHERE sc.user_id = $1
        ), 0),
        last_updated = CURRENT_TIMESTAMP
      WHERE user_id = $1`,
      [auth.userId],
    );

    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    console.error("Add contribution error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

// GET - Get goal details with contributions
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const auth = await authenticateRequest(request);
    if (!auth) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const goalId = parseInt(id);

    const goal = await queryOne(
      `SELECT 
        sg.*,
        COALESCE(SUM(sc.base_amount), 0) AS accumulated_amount,
        sg.target_amount - COALESCE(SUM(sc.base_amount), 0) AS remaining_amount,
        ROUND(COALESCE(SUM(sc.base_amount), 0) / NULLIF(sg.target_amount, 0) * 100, 2) AS progress_percentage
       FROM savings_goals sg
       LEFT JOIN savings_contributions sc ON sg.goal_id = sc.goal_id
       WHERE sg.goal_id = $1 AND sg.user_id = $2
       GROUP BY sg.goal_id`,
      [goalId, auth.userId],
    );

    if (!goal) {
      return NextResponse.json({ error: "Goal not found" }, { status: 404 });
    }

    // Get contributions
    const contributions = await query<SavingsContribution>(
      `SELECT * FROM savings_contributions 
       WHERE goal_id = $1 AND user_id = $2 
       ORDER BY contribution_date DESC`,
      [goalId, auth.userId],
    );

    return NextResponse.json({
      ...goal,
      contributions: contributions.rows,
    });
  } catch (error) {
    console.error("Get goal details error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

// DELETE - Delete savings goal
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const auth = await authenticateRequest(request);
    if (!auth) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const goalId = parseInt(id);

    // Soft delete
    const result = await query(
      "UPDATE savings_goals SET is_active = false WHERE goal_id = $1 AND user_id = $2 RETURNING goal_id",
      [goalId, auth.userId],
    );

    if (result.rowCount === 0) {
      return NextResponse.json({ error: "Goal not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete goal error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
