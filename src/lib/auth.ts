import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { User } from "@/types/database";
import { NextRequest } from "next/server";

const JWT_SECRET =
  process.env.JWT_SECRET || "fallback-secret-change-in-production";
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "7d";

export interface JwtPayload {
  userId: number;
  email: string;
  iat?: number;
  exp?: number;
}

// Password hashing
export async function hashPassword(password: string): Promise<string> {
  const saltRounds = 12;
  return bcrypt.hash(password, saltRounds);
}

export async function verifyPassword(
  password: string,
  hash: string,
): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

// JWT Token generation
export function generateToken(user: Pick<User, "user_id" | "email">): string {
  const payload: JwtPayload = {
    userId: user.user_id,
    email: user.email,
  };

  // expiresIn accepts seconds (number) or string like "7d", "1h"
  const expiresInSeconds = JWT_EXPIRES_IN.endsWith("d")
    ? parseInt(JWT_EXPIRES_IN) * 24 * 60 * 60
    : JWT_EXPIRES_IN.endsWith("h")
      ? parseInt(JWT_EXPIRES_IN) * 60 * 60
      : 60 * 60 * 24 * 7; // default 7 days

  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: expiresInSeconds,
  });
}

// JWT Token verification
export function verifyToken(token: string): JwtPayload | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as JwtPayload;
    return decoded;
  } catch {
    return null;
  }
}

// Extract token from request
export function extractToken(request: NextRequest): string | null {
  const authHeader = request.headers.get("authorization");

  if (authHeader?.startsWith("Bearer ")) {
    return authHeader.substring(7);
  }

  // Also check cookies for web client
  const tokenCookie = request.cookies.get("token");
  return tokenCookie?.value || null;
}

// Middleware helper for protected routes
export async function authenticateRequest(
  request: NextRequest,
): Promise<{ userId: number; email: string } | null> {
  const token = extractToken(request);

  if (!token) {
    return null;
  }

  const payload = verifyToken(token);

  if (!payload) {
    return null;
  }

  return {
    userId: payload.userId,
    email: payload.email,
  };
}

// Validation helpers
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

export function isValidPassword(password: string): boolean {
  // At least 8 characters, 1 uppercase, 1 lowercase, 1 number
  return (
    password.length >= 8 &&
    /[A-Z]/.test(password) &&
    /[a-z]/.test(password) &&
    /[0-9]/.test(password)
  );
}
