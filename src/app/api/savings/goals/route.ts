import { NextRequest, NextResponse } from "next/server";
import { query, queryOne, queryMany } from "@/lib/db";
import { authenticateRequest } from "@/lib/auth";
import { convertCurrency } from "@/lib/currency";
import {
  SavingsGoal,
  SavingsGoalWithProgress,
  CreateSavingsGoalInput,
} from "@/types/database";

// GET - List savings goals with progress
export async function GET(request: NextRequest) {
  try {
    const auth = await authenticateRequest(request);
    if (!auth) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const active_only = searchParams.get("active_only") !== "false";

    let whereClause = "WHERE sg.user_id = $1";
    if (active_only) {
      whereClause += " AND sg.is_active = true";
    }

    const goals = await queryMany<SavingsGoalWithProgress>(
      `SELECT 
        sg.*,
        COALESCE(SUM(sc.base_amount), 0) AS accumulated_amount,
        sg.target_amount - COALESCE(SUM(sc.base_amount), 0) AS remaining_amount,
        ROUND(COALESCE(SUM(sc.base_amount), 0) / NULLIF(sg.target_amount, 0) * 100, 2) AS progress_percentage
       FROM savings_goals sg
       LEFT JOIN savings_contributions sc ON sg.goal_id = sc.goal_id
       ${whereClause}
       GROUP BY sg.goal_id
       ORDER BY sg.created_at DESC`,
      [auth.userId],
    );

    return NextResponse.json(goals);
  } catch (error) {
    console.error("Get savings goals error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

// POST - Create savings goal
export async function POST(request: NextRequest) {
  try {
    const auth = await authenticateRequest(request);
    if (!auth) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body: CreateSavingsGoalInput = await request.json();
    const {
      goal_name,
      target_amount,
      currency_code,
      target_date,
      description,
    } = body;

    if (!goal_name || !target_amount || !currency_code) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 },
      );
    }

    if (target_amount <= 0) {
      return NextResponse.json(
        { error: "Target amount must be positive" },
        { status: 400 },
      );
    }

    const result = await queryOne<SavingsGoal>(
      `INSERT INTO savings_goals (user_id, goal_name, target_amount, currency_code, target_date, description)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [
        auth.userId,
        goal_name,
        target_amount,
        currency_code,
        target_date || null,
        description || null,
      ],
    );

    return NextResponse.json(
      {
        ...result,
        accumulated_amount: 0,
        remaining_amount: target_amount,
        progress_percentage: 0,
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("Create savings goal error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
