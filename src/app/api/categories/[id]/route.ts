import { NextRequest, NextResponse } from "next/server";
import { query, queryOne } from "@/lib/db";
import { authenticateRequest } from "@/lib/auth";
import { Category, CreateCategoryInput } from "@/types/database";

interface RouteParams {
  params: Promise<{ id: string }>;
}

// PUT - Update category
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const auth = await authenticateRequest(request);
    if (!auth) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const categoryId = parseInt(id);
    const body: Partial<CreateCategoryInput> = await request.json();

    // Check ownership
    const existing = await queryOne<Category>(
      "SELECT * FROM categories WHERE category_id = $1 AND user_id = $2",
      [categoryId, auth.userId],
    );

    if (!existing) {
      return NextResponse.json(
        { error: "Category not found" },
        { status: 404 },
      );
    }

    const updates: string[] = [];
    const values: unknown[] = [];
    let paramIndex = 1;

    if (body.category_name !== undefined) {
      updates.push(`category_name = $${paramIndex++}`);
      values.push(body.category_name);
    }
    if (body.color_hex !== undefined) {
      updates.push(`color_hex = $${paramIndex++}`);
      values.push(body.color_hex);
    }
    if (body.icon !== undefined) {
      updates.push(`icon = $${paramIndex++}`);
      values.push(body.icon);
    }

    if (updates.length === 0) {
      return NextResponse.json(existing);
    }

    values.push(categoryId, auth.userId);
    const result = await queryOne<Category>(
      `UPDATE categories SET ${updates.join(", ")} 
       WHERE category_id = $${paramIndex++} AND user_id = $${paramIndex}
       RETURNING *`,
      values,
    );

    return NextResponse.json(result);
  } catch (error) {
    console.error("Update category error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

// DELETE - Soft delete category
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const auth = await authenticateRequest(request);
    if (!auth) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const categoryId = parseInt(id);

    // Soft delete (set is_active = false)
    const result = await query(
      "UPDATE categories SET is_active = false WHERE category_id = $1 AND user_id = $2 RETURNING category_id",
      [categoryId, auth.userId],
    );

    if (result.rowCount === 0) {
      return NextResponse.json(
        { error: "Category not found" },
        { status: 404 },
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete category error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
