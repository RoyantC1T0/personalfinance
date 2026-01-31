import { NextRequest, NextResponse } from "next/server";
import { query, queryOne } from "@/lib/db";
import { authenticateRequest } from "@/lib/auth";
import { convertCurrency } from "@/lib/currency";
import { Transaction, CreateTransactionInput } from "@/types/database";

interface RouteParams {
  params: Promise<{ id: string }>;
}

// GET - Get single transaction
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const auth = await authenticateRequest(request);
    if (!auth) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const transactionId = parseInt(id);

    const transaction = await queryOne<Transaction>(
      `SELECT t.*, c.category_name, c.color_hex as category_color, c.icon as category_icon
       FROM transactions t
       JOIN categories c ON t.category_id = c.category_id
       WHERE t.transaction_id = $1 AND t.user_id = $2`,
      [transactionId, auth.userId],
    );

    if (!transaction) {
      return NextResponse.json(
        { error: "Transaction not found" },
        { status: 404 },
      );
    }

    return NextResponse.json(transaction);
  } catch (error) {
    console.error("Get transaction error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

// PUT - Update transaction
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const auth = await authenticateRequest(request);
    if (!auth) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const transactionId = parseInt(id);
    const body: Partial<CreateTransactionInput> = await request.json();

    // Check if transaction exists and belongs to user
    const existing = await queryOne<Transaction>(
      "SELECT * FROM transactions WHERE transaction_id = $1 AND user_id = $2",
      [transactionId, auth.userId],
    );

    if (!existing) {
      return NextResponse.json(
        { error: "Transaction not found" },
        { status: 404 },
      );
    }

    // Build update query
    const updates: string[] = [];
    const values: unknown[] = [];
    let paramIndex = 1;

    if (body.category_id !== undefined) {
      updates.push(`category_id = $${paramIndex++}`);
      values.push(body.category_id);
    }
    if (body.amount !== undefined) {
      updates.push(`amount = $${paramIndex++}`);
      values.push(body.amount);
    }
    if (body.currency_code !== undefined) {
      updates.push(`currency_code = $${paramIndex++}`);
      values.push(body.currency_code);
    }
    if (body.transaction_date !== undefined) {
      updates.push(`transaction_date = $${paramIndex++}`);
      values.push(body.transaction_date);
    }
    if (body.description !== undefined) {
      updates.push(`description = $${paramIndex++}`);
      values.push(body.description);
    }
    if (body.notes !== undefined) {
      updates.push(`notes = $${paramIndex++}`);
      values.push(body.notes);
    }

    // Recalculate base amount if amount or currency changed
    if (body.amount !== undefined || body.currency_code !== undefined) {
      const newAmount = body.amount ?? Number(existing.amount);
      const newCurrency = body.currency_code ?? existing.currency_code;
      const newDate = body.transaction_date
        ? new Date(body.transaction_date)
        : existing.transaction_date;

      const { convertedAmount, rate } = await convertCurrency(
        newAmount,
        newCurrency,
        "USD",
        newDate,
      );
      updates.push(`base_amount = $${paramIndex++}`);
      values.push(convertedAmount);
      updates.push(`exchange_rate_used = $${paramIndex++}`);
      values.push(rate);
    }

    if (updates.length === 0) {
      return NextResponse.json(existing);
    }

    values.push(transactionId, auth.userId);
    const result = await queryOne<Transaction>(
      `UPDATE transactions SET ${updates.join(", ")} 
       WHERE transaction_id = $${paramIndex++} AND user_id = $${paramIndex}
       RETURNING *`,
      values,
    );

    // Update balance cache
    await updateBalanceCache(auth.userId);

    return NextResponse.json(result);
  } catch (error) {
    console.error("Update transaction error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

// DELETE - Delete transaction
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const auth = await authenticateRequest(request);
    if (!auth) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const transactionId = parseInt(id);

    const result = await query(
      "DELETE FROM transactions WHERE transaction_id = $1 AND user_id = $2 RETURNING transaction_id",
      [transactionId, auth.userId],
    );

    if (result.rowCount === 0) {
      return NextResponse.json(
        { error: "Transaction not found" },
        { status: 404 },
      );
    }

    // Update balance cache
    await updateBalanceCache(auth.userId);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete transaction error:", error);
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
