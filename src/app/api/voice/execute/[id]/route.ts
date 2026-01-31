import { NextRequest, NextResponse } from "next/server";
import { query, queryOne } from "@/lib/db";
import { authenticateRequest } from "@/lib/auth";
import { convertCurrency } from "@/lib/currency";

interface RouteParams {
  params: Promise<{ id: string }>;
}

// POST - Execute a pending voice command
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const auth = await authenticateRequest(request);
    if (!auth) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const commandId = parseInt(id);
    const body = await request.json();
    const { confirm, updates } = body; // updates can override parsed values

    // Get the voice command
    const command = await queryOne<{
      command_id: number;
      processed_json: object;
      detected_intent: string;
      execution_status: string;
    }>(
      `SELECT * FROM voice_commands_log 
       WHERE command_id = $1 AND user_id = $2`,
      [commandId, auth.userId],
    );

    if (!command) {
      return NextResponse.json({ error: "Command not found" }, { status: 404 });
    }

    if (command.execution_status === "executed") {
      return NextResponse.json(
        { error: "Command already executed" },
        { status: 400 },
      );
    }

    if (!confirm) {
      // User cancelled
      await query(
        "UPDATE voice_commands_log SET execution_status = 'failed', error_message = 'Cancelled by user' WHERE command_id = $1",
        [commandId],
      );
      return NextResponse.json({ status: "cancelled" });
    }

    const parsed = command.processed_json as {
      action: {
        type: string;
        transaction_type: string | null;
        amount: number;
        currency: string;
        category: string | null;
        description: string | null;
        date: string;
      };
    };

    // Apply any updates from user
    const action = { ...parsed.action, ...updates };

    let transactionId = null;

    if (action.type === "transaction" && action.transaction_type) {
      // Find or create category
      let categoryId = null;
      if (action.category) {
        const cat = await queryOne<{ category_id: number }>(
          `SELECT category_id FROM categories 
           WHERE user_id = $1 AND category_name ILIKE $2 AND transaction_type = $3 AND is_active = true`,
          [auth.userId, `%${action.category}%`, action.transaction_type],
        );
        categoryId = cat?.category_id;

        // If not found, use default "Other" category
        if (!categoryId) {
          const otherCat = await queryOne<{ category_id: number }>(
            `SELECT category_id FROM categories 
             WHERE user_id = $1 AND category_name LIKE '%Other%' AND transaction_type = $2`,
            [auth.userId, action.transaction_type],
          );
          categoryId = otherCat?.category_id;
        }
      } else {
        // Use default category
        const defaultCat = await queryOne<{ category_id: number }>(
          `SELECT category_id FROM categories 
           WHERE user_id = $1 AND transaction_type = $2 AND is_active = true
           ORDER BY category_id LIMIT 1`,
          [auth.userId, action.transaction_type],
        );
        categoryId = defaultCat?.category_id;
      }

      if (!categoryId) {
        await query(
          "UPDATE voice_commands_log SET execution_status = 'failed', error_message = 'No valid category found' WHERE command_id = $1",
          [commandId],
        );
        return NextResponse.json(
          { error: "No valid category found" },
          { status: 400 },
        );
      }

      // Convert currency
      const { convertedAmount, rate } = await convertCurrency(
        action.amount,
        action.currency,
        "USD",
        new Date(action.date),
      );

      // Create transaction
      const result = await queryOne<{ transaction_id: number }>(
        `INSERT INTO transactions 
         (user_id, category_id, transaction_type, amount, currency_code, transaction_date, 
          description, base_currency_code, base_amount, exchange_rate_used)
         VALUES ($1, $2, $3, $4, $5, $6, $7, 'USD', $8, $9) RETURNING transaction_id`,
        [
          auth.userId,
          categoryId,
          action.transaction_type,
          action.amount,
          action.currency,
          action.date,
          action.description ||
            `Voice: ${action.category || action.transaction_type}`,
          convertedAmount,
          rate,
        ],
      );

      transactionId = result?.transaction_id;

      // Update balance cache
      const monthStart = new Date();
      monthStart.setDate(1);
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
            FROM transactions WHERE user_id = $1 
            AND transaction_date >= $2::date AND transaction_date < ($2::date + INTERVAL '1 month')
          ), 0) + COALESCE((SELECT monthly_income FROM user_preferences WHERE user_id = $1), 0),
          last_updated = CURRENT_TIMESTAMP
        WHERE user_id = $1`,
        [auth.userId, monthStartStr],
      );
    }

    // Update command status
    await query(
      `UPDATE voice_commands_log SET 
        execution_status = 'executed', 
        created_transaction_id = $2 
       WHERE command_id = $1`,
      [commandId, transactionId],
    );

    // Get updated balance
    const balance = await queryOne<{ current_month_balance: number }>(
      "SELECT current_month_balance FROM user_balance_cache WHERE user_id = $1",
      [auth.userId],
    );

    return NextResponse.json({
      status: "success",
      action_executed: true,
      transaction_id: transactionId,
      message: transactionId
        ? `✓ Registrado: ${action.amount} ${action.currency} como ${action.transaction_type}`
        : "Comando ejecutado",
      updated_balance: {
        current_month_balance: balance?.current_month_balance || 0,
        currency: "USD",
      },
    });
  } catch (error) {
    console.error("Execute voice command error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
