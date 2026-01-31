import { NextRequest, NextResponse } from "next/server";
import { query, queryOne, queryMany } from "@/lib/db";
import { authenticateRequest } from "@/lib/auth";
import { Category, CreateCategoryInput } from "@/types/database";

// GET - List categories
export async function GET(request: NextRequest) {
  try {
    const auth = await authenticateRequest(request);
    if (!auth) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type"); // income, expense
    const active_only = searchParams.get("active_only") !== "false";

    let whereClause = "WHERE user_id = $1";
    const params: unknown[] = [auth.userId];

    if (active_only) {
      whereClause += " AND is_active = true";
    }

    if (type) {
      whereClause += " AND transaction_type = $2";
      params.push(type);
    }

    const categories = await queryMany<Category>(
      `SELECT * FROM categories ${whereClause} ORDER BY transaction_type, category_name`,
      params,
    );

    return NextResponse.json(categories);
  } catch (error) {
    console.error("Get categories error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

// POST - Create category
export async function POST(request: NextRequest) {
  try {
    const auth = await authenticateRequest(request);
    if (!auth) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body: CreateCategoryInput = await request.json();
    const { category_name, transaction_type, color_hex, icon } = body;

    if (!category_name || !transaction_type) {
      return NextResponse.json(
        { error: "Name and type are required" },
        { status: 400 },
      );
    }

    if (!["income", "expense"].includes(transaction_type)) {
      return NextResponse.json(
        { error: "Invalid transaction type" },
        { status: 400 },
      );
    }

    // Check for duplicate
    const existing = await queryOne<Category>(
      `SELECT category_id FROM categories 
       WHERE user_id = $1 AND category_name = $2 AND transaction_type = $3`,
      [auth.userId, category_name, transaction_type],
    );

    if (existing) {
      return NextResponse.json(
        { error: "Category already exists" },
        { status: 409 },
      );
    }

    const result = await queryOne<Category>(
      `INSERT INTO categories (user_id, category_name, transaction_type, color_hex, icon)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [
        auth.userId,
        category_name,
        transaction_type,
        color_hex || null,
        icon || null,
      ],
    );

    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    console.error("Create category error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
