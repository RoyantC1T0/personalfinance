import { NextRequest, NextResponse } from "next/server";
import { query, queryOne, queryMany } from "@/lib/db";
import { authenticateRequest } from "@/lib/auth";
import { convertCurrency } from "@/lib/currency";
import {
  Transaction,
  TransactionWithCategory,
  CreateTransactionInput,
} from "@/types/database";

// GET - List transactions with filters
export async function GET(request: NextRequest) {
  try {
    const auth = await authenticateRequest(request);
    if (!auth) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type"); // income, expense
    const category_id = searchParams.get("category_id");
    const from_date = searchParams.get("from_date");
    const to_date = searchParams.get("to_date");
    const search = searchParams.get("search");
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");
    const offset = (page - 1) * limit;

    let whereClause = "WHERE t.user_id = $1";
    const params: unknown[] = [auth.userId];
    let paramIndex = 2;

    if (type) {
      whereClause += ` AND t.transaction_type = $${paramIndex}`;
      params.push(type);
      paramIndex++;
    }

    if (category_id) {
      whereClause += ` AND t.category_id = $${paramIndex}`;
      params.push(parseInt(category_id));
      paramIndex++;
    }

    if (from_date) {
      whereClause += ` AND t.transaction_date >= $${paramIndex}::date`;
      params.push(from_date);
      paramIndex++;
    }

    if (to_date) {
      whereClause += ` AND t.transaction_date <= $${paramIndex}::date`;
      params.push(to_date);
      paramIndex++;
    }

    if (search) {
      whereClause += ` AND (t.description ILIKE $${paramIndex} OR t.notes ILIKE $${paramIndex})`;
      params.push(`%${search}%`);
      paramIndex++;
    }

    // Get total count
    const countResult = await queryOne<{ count: string }>(
      `SELECT COUNT(*) as count FROM transactions t ${whereClause}`,
      params,
    );
    const total = parseInt(countResult?.count || "0");

    // Get transactions with category info
    params.push(limit, offset);
    const transactions = await queryMany<TransactionWithCategory>(
      `SELECT 
        t.*,
        c.category_name,
        c.color_hex as category_color,
        c.icon as category_icon
       FROM transactions t
       JOIN categories c ON t.category_id = c.category_id
       ${whereClause}
       ORDER BY t.transaction_date DESC, t.created_at DESC
       LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`,
      params,
    );

    return NextResponse.json({
      transactions,
      pagination: {
        page,
        limit,
        total,
        total_pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Get transactions error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

// POST - Create transaction
export async function POST(request: NextRequest) {
  try {
    const auth = await authenticateRequest(request);
    if (!auth) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body: CreateTransactionInput = await request.json();
    const {
      category_id,
      transaction_type,
      amount,
      currency_code,
      transaction_date,
      description,
      notes,
    } = body;

    // Validation
    if (
      !category_id ||
      !transaction_type ||
      !amount ||
      !currency_code ||
      !transaction_date
    ) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 },
      );
    }

    if (amount <= 0) {
      return NextResponse.json(
        { error: "Amount must be positive" },
        { status: 400 },
      );
    }

    // Verify category belongs to user
    const category = await queryOne<{
      category_id: number;
      transaction_type: string;
    }>(
      "SELECT category_id, transaction_type FROM categories WHERE category_id = $1 AND user_id = $2",
      [category_id, auth.userId],
    );

    if (!category) {
      return NextResponse.json(
        { error: "Category not found" },
        { status: 404 },
      );
    }

    if (category.transaction_type !== transaction_type) {
      return NextResponse.json(
        { error: "Transaction type does not match category type" },
        { status: 400 },
      );
    }

    // Get user's base currency (USD for now)
    const baseCurrency = "USD";
    const { convertedAmount, rate } = await convertCurrency(
      amount,
      currency_code,
      baseCurrency,
      new Date(transaction_date),
    );

    // Insert transaction
    const result = await queryOne<Transaction>(
      `INSERT INTO transactions (
        user_id, category_id, transaction_type, amount, currency_code,
        transaction_date, description, notes, base_currency_code, base_amount, exchange_rate_used
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      RETURNING *`,
      [
        auth.userId,
        category_id,
        transaction_type,
        amount,
        currency_code,
        transaction_date,
        description || null,
        notes || null,
        baseCurrency,
        convertedAmount,
        rate,
      ],
    );

    // Update balance cache
    await updateBalanceCache(auth.userId);

    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    console.error("Create transaction error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

// Helper function to update balance cache
async function updateBalanceCache(userId: number) {
  const monthStart = new Date();
  monthStart.setDate(1);
  monthStart.setHours(0, 0, 0, 0);
  const monthStartStr = monthStart.toISOString().split("T")[0];

  await query(
    `UPDATE user_balance_cache SET
      current_month_income = COALESCE((
        SELECT SUM(base_amount) FROM transactions 
        WHERE user_id = $1 AND transaction_type = 'income'
        AND transaction_date >= $2::date AND transaction_date < ($2::date + INTERVAL '1 month')
      ), 0),
      current_month_expenses = COALESCE((
        SELECT SUM(base_amount) FROM transactions 
        WHERE user_id = $1 AND transaction_type = 'expense'
        AND transaction_date >= $2::date AND transaction_date < ($2::date + INTERVAL '1 month')
      ), 0),
      current_month_balance = COALESCE((
        SELECT SUM(CASE WHEN transaction_type = 'income' THEN base_amount ELSE -base_amount END)
        FROM transactions 
        WHERE user_id = $1 
        AND transaction_date >= $2::date AND transaction_date < ($2::date + INTERVAL '1 month')
      ), 0) + COALESCE((SELECT monthly_income FROM user_preferences WHERE user_id = $1), 0),
      last_updated = CURRENT_TIMESTAMP
    WHERE user_id = $1`,
    [userId, monthStartStr],
  );
}
