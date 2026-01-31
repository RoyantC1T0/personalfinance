import { NextRequest, NextResponse } from "next/server";
import { queryOne } from "@/lib/db";
import { authenticateRequest } from "@/lib/auth";
import { User } from "@/types/database";

export async function GET(request: NextRequest) {
  try {
    const auth = await authenticateRequest(request);

    if (!auth) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get user with preferences (SQL JOIN returns flat results)
    const user = await queryOne<
      User & {
        theme?: string;
        language?: string;
        enable_voice_commands?: boolean;
        enable_notifications?: boolean;
        monthly_income?: number;
      }
    >(
      `SELECT 
        u.user_id, u.email, u.full_name, u.default_currency_code, u.created_at, u.updated_at,
        up.theme, up.language, up.enable_voice_commands, up.enable_notifications, up.monthly_income
       FROM users u
       LEFT JOIN user_preferences up ON u.user_id = up.user_id
       WHERE u.user_id = $1`,
      [auth.userId],
    );

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json({
      user_id: user.user_id,
      email: user.email,
      full_name: user.full_name,
      default_currency_code: user.default_currency_code,
      created_at: user.created_at,
      preferences: {
        theme: user.theme || "light",
        language: user.language || "en",
        enable_voice_commands: user.enable_voice_commands ?? true,
        enable_notifications: user.enable_notifications ?? true,
        monthly_income: user.monthly_income,
      },
    });
  } catch (error) {
    console.error("Get current user error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
