import { NextRequest, NextResponse } from "next/server";
import { query, queryOne } from "@/lib/db";
import {
  hashPassword,
  generateToken,
  isValidEmail,
  isValidPassword,
} from "@/lib/auth";
import { User } from "@/types/database";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password, full_name } = body;

    // Validation
    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password are required" },
        { status: 400 },
      );
    }

    if (!isValidEmail(email)) {
      return NextResponse.json(
        { error: "Invalid email format" },
        { status: 400 },
      );
    }

    if (!isValidPassword(password)) {
      return NextResponse.json(
        {
          error:
            "Password must be at least 8 characters with uppercase, lowercase, and number",
        },
        { status: 400 },
      );
    }

    // Check if user already exists
    const existingUser = await queryOne<User>(
      "SELECT user_id FROM users WHERE email = $1",
      [email.toLowerCase()],
    );

    if (existingUser) {
      return NextResponse.json(
        { error: "User with this email already exists" },
        { status: 409 },
      );
    }

    // Hash password and create user
    const passwordHash = await hashPassword(password);

    const result = await queryOne<User>(
      `INSERT INTO users (email, password_hash, full_name, default_currency_code)
       VALUES ($1, $2, $3, 'USD')
       RETURNING user_id, email, full_name, default_currency_code, created_at, updated_at`,
      [email.toLowerCase(), passwordHash, full_name || null],
    );

    if (!result) {
      throw new Error("Failed to create user");
    }

    // Create default categories for the user
    const defaultCategories = [
      // Expenses
      {
        name: "Food & Dining",
        type: "expense",
        color: "#FF6B6B",
        icon: "utensils",
      },
      {
        name: "Transportation",
        type: "expense",
        color: "#4ECDC4",
        icon: "car",
      },
      { name: "Housing", type: "expense", color: "#45B7D1", icon: "home" },
      { name: "Utilities", type: "expense", color: "#96CEB4", icon: "zap" },
      {
        name: "Entertainment",
        type: "expense",
        color: "#DDA0DD",
        icon: "film",
      },
      {
        name: "Shopping",
        type: "expense",
        color: "#FFB347",
        icon: "shopping-bag",
      },
      { name: "Healthcare", type: "expense", color: "#87CEEB", icon: "heart" },
      { name: "Education", type: "expense", color: "#98D8C8", icon: "book" },
      { name: "Alquiler", type: "expense", color: "#F4A460", icon: "home" },
      { name: "Servicios", type: "expense", color: "#96CEB4", icon: "zap" },
      { name: "Expensas", type: "expense", color: "#BC8F8F", icon: "building" },
      {
        name: "Tarjetas",
        type: "expense",
        color: "#4682B4",
        icon: "credit-card",
      },
      { name: "Creditos", type: "expense", color: "#DA70D6", icon: "wallet" },
      {
        name: "Other Expenses",
        type: "expense",
        color: "#8B8B8B",
        icon: "more-horizontal",
      },
      // Income
      { name: "Salary", type: "income", color: "#4CAF50", icon: "briefcase" },
      { name: "Freelance", type: "income", color: "#8BC34A", icon: "laptop" },
      {
        name: "Investments",
        type: "income",
        color: "#CDDC39",
        icon: "trending-up",
      },
      {
        name: "Other Income",
        type: "income",
        color: "#9E9E9E",
        icon: "plus-circle",
      },
    ];

    for (const cat of defaultCategories) {
      await query(
        `INSERT INTO categories (user_id, category_name, transaction_type, color_hex, icon)
         VALUES ($1, $2, $3, $4, $5)`,
        [result.user_id, cat.name, cat.type, cat.color, cat.icon],
      );
    }

    // Create user preferences
    await query(
      `INSERT INTO user_preferences (user_id, theme, language, enable_voice_commands)
       VALUES ($1, 'light', 'en', true)`,
      [result.user_id],
    );

    // Create user balance cache
    await query(
      `INSERT INTO user_balance_cache (user_id, currency_code)
       VALUES ($1, 'USD')`,
      [result.user_id],
    );

    // Generate token
    const token = generateToken(result);

    return NextResponse.json(
      {
        user: {
          user_id: result.user_id,
          email: result.email,
          full_name: result.full_name,
          default_currency_code: result.default_currency_code,
          created_at: result.created_at,
        },
        token,
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("Registration error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
