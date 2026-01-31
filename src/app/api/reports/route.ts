import { NextRequest, NextResponse } from "next/server";
import { query, queryOne, queryMany } from "@/lib/db";
import { authenticateRequest } from "@/lib/auth";

interface CategorySummary {
  category_id: number;
  category_name: string;
  color_hex: string;
  icon: string;
  total: number;
  count: number;
  percentage: number;
}

interface MonthlyTrend {
  month: string;
  income: number;
  expenses: number;
  balance: number;
}

// GET - Get reports data
export async function GET(request: NextRequest) {
  try {
    const auth = await authenticateRequest(request);
    if (!auth) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type") || "summary"; // summary, categories, trends
    const from_date = searchParams.get("from_date");
    const to_date = searchParams.get("to_date");
    const months = parseInt(searchParams.get("months") || "6");

    // Default date range: current month
    const now = new Date();
    const defaultFromDate = new Date(now.getFullYear(), now.getMonth(), 1)
      .toISOString()
      .split("T")[0];
    const defaultToDate = now.toISOString().split("T")[0];

    const dateFrom = from_date || defaultFromDate;
    const dateTo = to_date || defaultToDate;

    if (type === "categories") {
      // Get expense breakdown by category
      const expenseCategories = await queryMany<CategorySummary>(
        `SELECT 
          c.category_id, c.category_name, c.color_hex, c.icon,
          COALESCE(SUM(t.base_amount), 0) as total,
          COUNT(t.transaction_id) as count
         FROM categories c
         LEFT JOIN transactions t ON c.category_id = t.category_id 
           AND t.transaction_date >= $2::date AND t.transaction_date <= $3::date
         WHERE c.user_id = $1 AND c.transaction_type = 'expense' AND c.is_active = true
         GROUP BY c.category_id
         HAVING COALESCE(SUM(t.base_amount), 0) > 0
         ORDER BY total DESC`,
        [auth.userId, dateFrom, dateTo],
      );

      // Calculate percentages
      const totalExpenses = expenseCategories.reduce(
        (sum, c) => sum + Number(c.total),
        0,
      );
      const categoriesWithPercentage = expenseCategories.map((c) => ({
        ...c,
        total: Number(c.total),
        count: Number(c.count),
        percentage:
          totalExpenses > 0
            ? Math.round((Number(c.total) / totalExpenses) * 100)
            : 0,
      }));

      return NextResponse.json({
        type: "categories",
        data: categoriesWithPercentage,
        total_expenses: totalExpenses,
        date_range: { from: dateFrom, to: dateTo },
      });
    }

    if (type === "trends") {
      // Get monthly trends for the last N months
      const trends = await queryMany<MonthlyTrend>(
        `SELECT 
          TO_CHAR(DATE_TRUNC('month', transaction_date), 'YYYY-MM') as month,
          COALESCE(SUM(CASE WHEN transaction_type = 'income' THEN base_amount ELSE 0 END), 0) as income,
          COALESCE(SUM(CASE WHEN transaction_type = 'expense' THEN base_amount ELSE 0 END), 0) as expenses,
          COALESCE(SUM(CASE WHEN transaction_type = 'income' THEN base_amount ELSE -base_amount END), 0) as balance
         FROM transactions
         WHERE user_id = $1 
           AND transaction_date >= (CURRENT_DATE - INTERVAL '${months} months')
         GROUP BY DATE_TRUNC('month', transaction_date)
         ORDER BY month ASC`,
        [auth.userId],
      );

      return NextResponse.json({
        type: "trends",
        data: trends.map((t) => ({
          month: t.month,
          income: Number(t.income),
          expenses: Number(t.expenses),
          balance: Number(t.balance),
        })),
        months,
      });
    }

    // Default: summary
    const summary = await queryOne<{
      total_income: string;
      total_expenses: string;
      net_balance: string;
      transaction_count: string;
    }>(
      `SELECT 
        COALESCE(SUM(CASE WHEN transaction_type = 'income' THEN base_amount ELSE 0 END), 0) as total_income,
        COALESCE(SUM(CASE WHEN transaction_type = 'expense' THEN base_amount ELSE 0 END), 0) as total_expenses,
        COALESCE(SUM(CASE WHEN transaction_type = 'income' THEN base_amount ELSE -base_amount END), 0) as net_balance,
        COUNT(*) as transaction_count
       FROM transactions
       WHERE user_id = $1 
         AND transaction_date >= $2::date AND transaction_date <= $3::date`,
      [auth.userId, dateFrom, dateTo],
    );

    // Get top expense categories
    const topCategories = await queryMany<CategorySummary>(
      `SELECT 
        c.category_id, c.category_name, c.color_hex, c.icon,
        COALESCE(SUM(t.base_amount), 0) as total
       FROM categories c
       JOIN transactions t ON c.category_id = t.category_id 
         AND t.transaction_date >= $2::date AND t.transaction_date <= $3::date
       WHERE c.user_id = $1 AND c.transaction_type = 'expense'
       GROUP BY c.category_id
       ORDER BY total DESC
       LIMIT 5`,
      [auth.userId, dateFrom, dateTo],
    );

    return NextResponse.json({
      type: "summary",
      data: {
        total_income: parseFloat(summary?.total_income || "0"),
        total_expenses: parseFloat(summary?.total_expenses || "0"),
        net_balance: parseFloat(summary?.net_balance || "0"),
        transaction_count: parseInt(summary?.transaction_count || "0"),
        top_expense_categories: topCategories.map((c) => ({
          ...c,
          total: Number(c.total),
        })),
      },
      date_range: { from: dateFrom, to: dateTo },
    });
  } catch (error) {
    console.error("Get reports error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
