// Database Types - Matching PostgreSQL Schema

export type TransactionType = "income" | "expense";

export interface User {
  user_id: number;
  email: string;
  password_hash: string;
  full_name: string | null;
  default_currency_code: string;
  created_at: Date;
  updated_at: Date;
}

export interface Currency {
  currency_code: string;
  currency_name: string;
  symbol: string | null;
  is_active: boolean;
  created_at: Date;
}

export interface ExchangeRate {
  exchange_rate_id: number;
  from_currency_code: string;
  to_currency_code: string;
  rate: number;
  rate_date: Date;
  source: string | null;
  created_at: Date;
}

export interface Category {
  category_id: number;
  user_id: number;
  category_name: string;
  transaction_type: TransactionType;
  color_hex: string | null;
  icon: string | null;
  is_active: boolean;
  created_at: Date;
}

export interface Transaction {
  transaction_id: number;
  user_id: number;
  category_id: number;
  transaction_type: TransactionType;
  amount: number;
  currency_code: string;
  transaction_date: Date;
  description: string | null;
  notes: string | null;
  base_currency_code: string;
  base_amount: number;
  exchange_rate_used: number;
  created_at: Date;
  updated_at: Date;
}

export interface SavingsGoal {
  goal_id: number;
  user_id: number;
  goal_name: string;
  target_amount: number;
  currency_code: string;
  target_date: Date | null;
  description: string | null;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface MonthlySavingsTarget {
  target_id: number;
  user_id: number;
  goal_id: number | null;
  month_year: Date;
  target_amount: number;
  currency_code: string;
  notes: string | null;
  created_at: Date;
  updated_at: Date;
}

export interface SavingsContribution {
  contribution_id: number;
  user_id: number;
  goal_id: number | null;
  amount: number;
  currency_code: string;
  contribution_date: Date;
  base_currency_code: string;
  base_amount: number;
  exchange_rate_used: number;
  notes: string | null;
  created_at: Date;
}

export interface MonthClosure {
  closure_id: number;
  user_id: number;
  month_year: Date;
  closure_date: Date;
  total_income: number;
  total_expenses: number;
  net_balance: number;
  total_savings: number;
  currency_code: string;
  accumulated_balance: number;
  accumulated_savings: number;
  notes: string | null;
  is_locked: boolean;
}

export interface VoiceCommandLog {
  command_id: number;
  user_id: number;
  raw_transcription: string;
  processed_json: Record<string, unknown> | null;
  detected_intent: string | null;
  confidence_score: number | null;
  execution_status: "pending" | "executed" | "failed" | "ambiguous";
  error_message: string | null;
  created_transaction_id: number | null;
  created_at: Date;
}

export interface UserPreferences {
  preference_id: number;
  user_id: number;
  theme: "light" | "dark" | "auto";
  language: string;
  enable_voice_commands: boolean;
  enable_notifications: boolean;
  monthly_income: number | null;
  created_at: Date;
  updated_at: Date;
}

export interface UserBalanceCache {
  balance_id: number;
  user_id: number;
  current_month_income: number;
  current_month_expenses: number;
  current_month_balance: number;
  total_savings: number;
  currency_code: string;
  last_updated: Date;
}

// Extended Types with Joins

export interface TransactionWithCategory extends Transaction {
  category_name: string;
  category_color: string | null;
  category_icon: string | null;
}

export interface SavingsGoalWithProgress extends SavingsGoal {
  accumulated_amount: number;
  remaining_amount: number;
  progress_percentage: number;
}

// API Request/Response Types

export interface CreateTransactionInput {
  category_id: number;
  transaction_type: TransactionType;
  amount: number;
  currency_code: string;
  transaction_date: string;
  description?: string;
  notes?: string;
}

export interface CreateCategoryInput {
  category_name: string;
  transaction_type: TransactionType;
  color_hex?: string;
  icon?: string;
}

export interface CreateSavingsGoalInput {
  goal_name: string;
  target_amount: number;
  currency_code: string;
  target_date?: string;
  description?: string;
}

export interface CreateContributionInput {
  goal_id?: number;
  amount: number;
  currency_code: string;
  contribution_date: string;
  notes?: string;
}

export interface BalanceResponse {
  current_month_income: number;
  current_month_expenses: number;
  current_month_balance: number;
  total_savings: number;
  currency_code: string;
  conversions: {
    USD: {
      income: number;
      expenses: number;
      balance: number;
    };
    ARS: {
      income: number;
      expenses: number;
      balance: number;
    };
  };
  last_updated: string;
}

export interface VoiceProcessRequest {
  transcription: string;
  context: {
    current_screen: string;
    user_id?: number;
  };
}

export interface VoiceProcessResponse {
  status: "success" | "error" | "needs_confirmation";
  action_executed: boolean;
  transaction_id?: number;
  message: string;
  updated_balance?: {
    current_month_balance: number;
    currency: string;
  };
  clarification_needed?: string;
  suggested_options?: string[];
}

export interface AuthResponse {
  user: Omit<User, "password_hash">;
  token: string;
}

export interface ApiError {
  error: string;
  message: string;
  statusCode: number;
}
