import { NextRequest, NextResponse } from "next/server";
import { query, queryOne, queryMany } from "@/lib/db";
import { authenticateRequest } from "@/lib/auth";
import { VoiceProcessRequest } from "@/types/database";

// LLM prompt for voice command processing
const SYSTEM_PROMPT = `You are a financial assistant for "Minimalist Wealth" app. Parse voice commands into structured JSON.

RESPOND ONLY WITH VALID JSON. No additional text.

Output format:
{
  "intent": "add_expense" | "add_income" | "add_savings" | "query_balance" | "other",
  "action": {
    "type": "transaction" | "savings_contribution" | "query",
    "transaction_type": "income" | "expense" | null,
    "amount": number | null,
    "currency": "USD" | "ARS" | "EUR",
    "category": "category name" | null,
    "description": "description" | null,
    "date": "YYYY-MM-DD" | null
  },
  "confidence": 0.0-1.0,
  "requires_confirmation": boolean,
  "clarification_needed": null | "question string",
  "suggested_response": "Response message for user"
}

Rules:
- "gasté", "compré", "pagué" → add_expense
- "cobré", "gané", "ingresé" → add_income  
- "ahorré", "guardé" → add_savings
- "cuánto tengo", "balance", "disponible" → query_balance
- Detect currency: "pesos/ARS" → ARS, "dólares/USD" → USD
- Default currency: USER_CURRENCY
- Default date: TODAY
- Categories: Food & Dining, Transportation, Housing, Utilities, Entertainment, Shopping, Healthcare, Salary, Freelance`;

// GET - Get voice command history
export async function GET(request: NextRequest) {
  try {
    const auth = await authenticateRequest(request);
    if (!auth) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get("limit") || "10");

    const history = await queryMany(
      `SELECT * FROM voice_commands_log 
       WHERE user_id = $1 
       ORDER BY created_at DESC 
       LIMIT $2`,
      [auth.userId, limit],
    );

    return NextResponse.json(history);
  } catch (error) {
    console.error("Get voice history error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

// POST - Process voice command
export async function POST(request: NextRequest) {
  try {
    const auth = await authenticateRequest(request);
    if (!auth) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body: VoiceProcessRequest = await request.json();
    const { transcription, context } = body;

    if (!transcription) {
      return NextResponse.json(
        { error: "Transcription is required" },
        { status: 400 },
      );
    }

    // Get user preferences for default currency
    const userPrefs = await queryOne<{ default_currency_code: string }>(
      "SELECT default_currency_code FROM users WHERE user_id = $1",
      [auth.userId],
    );
    const defaultCurrency = userPrefs?.default_currency_code || "USD";

    // Get user categories
    const categories = await queryMany<{
      category_name: string;
      transaction_type: string;
    }>(
      "SELECT category_name, transaction_type FROM categories WHERE user_id = $1 AND is_active = true",
      [auth.userId],
    );
    const categoryList = categories
      .map((c) => `${c.category_name} (${c.transaction_type})`)
      .join(", ");

    // Prepare prompt
    const today = new Date().toISOString().split("T")[0];
    const userPrompt = `
USER_CURRENCY: ${defaultCurrency}
TODAY: ${today}
CURRENT_SCREEN: ${context.current_screen || "dashboard"}
AVAILABLE_CATEGORIES: ${categoryList}

TRANSCRIPTION: "${transcription}"
`;

    let parsedResponse;

    // Check if OpenAI API key is available
    if (process.env.OPENAI_API_KEY) {
      try {
        const openaiResponse = await fetch(
          "https://api.openai.com/v1/chat/completions",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
            },
            body: JSON.stringify({
              model: "gpt-4o-mini",
              messages: [
                { role: "system", content: SYSTEM_PROMPT },
                { role: "user", content: userPrompt },
              ],
              temperature: 0.3,
              max_tokens: 500,
            }),
          },
        );

        if (!openaiResponse.ok) {
          throw new Error("OpenAI API error");
        }

        const data = await openaiResponse.json();
        const content = data.choices[0]?.message?.content;
        parsedResponse = JSON.parse(content);
      } catch (llmError) {
        console.error("LLM error:", llmError);
        // Fallback to simple parsing
        parsedResponse = simpleParse(transcription, defaultCurrency, today);
      }
    } else {
      // No API key - use simple local parsing
      parsedResponse = simpleParse(transcription, defaultCurrency, today);
    }

    // Log the voice command
    const logEntry = await queryOne<{ command_id: number }>(
      `INSERT INTO voice_commands_log 
       (user_id, raw_transcription, processed_json, detected_intent, confidence_score, execution_status)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING command_id`,
      [
        auth.userId,
        transcription,
        JSON.stringify(parsedResponse),
        parsedResponse.intent,
        parsedResponse.confidence,
        parsedResponse.requires_confirmation ? "pending" : "pending",
      ],
    );

    // If it's a balance query, get the current balance
    if (parsedResponse.intent === "query_balance") {
      const balance = await queryOne<{ current_month_balance: number }>(
        "SELECT current_month_balance FROM user_balance_cache WHERE user_id = $1",
        [auth.userId],
      );

      return NextResponse.json({
        status: "success",
        action_executed: false,
        command_id: logEntry?.command_id,
        parsed: parsedResponse,
        balance: balance?.current_month_balance || 0,
        message: parsedResponse.suggested_response,
      });
    }

    // Return parsed result for confirmation or execution
    return NextResponse.json({
      status: parsedResponse.requires_confirmation
        ? "needs_confirmation"
        : "ready",
      action_executed: false,
      command_id: logEntry?.command_id,
      parsed: parsedResponse,
      message: parsedResponse.suggested_response,
    });
  } catch (error) {
    console.error("Voice process error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

// Simple local parsing fallback
function simpleParse(
  transcription: string,
  defaultCurrency: string,
  today: string,
) {
  const text = transcription.toLowerCase();

  // Detect intent
  let intent = "other";
  let transactionType = null;

  if (
    text.includes("gasté") ||
    text.includes("compré") ||
    text.includes("pagué")
  ) {
    intent = "add_expense";
    transactionType = "expense";
  } else if (
    text.includes("cobré") ||
    text.includes("gané") ||
    text.includes("ingresé")
  ) {
    intent = "add_income";
    transactionType = "income";
  } else if (text.includes("ahorré") || text.includes("guardé")) {
    intent = "add_savings";
  } else if (
    text.includes("balance") ||
    text.includes("cuánto") ||
    text.includes("disponible")
  ) {
    intent = "query_balance";
  }

  // Extract amount
  const numberMatch = text.match(/(\d+(?:[.,]\d+)?)/);
  const amount = numberMatch
    ? parseFloat(numberMatch[1].replace(",", "."))
    : null;

  // Detect currency
  let currency = defaultCurrency;
  if (text.includes("peso") || text.includes("ars")) currency = "ARS";
  if (text.includes("dólar") || text.includes("dollar") || text.includes("usd"))
    currency = "USD";
  if (text.includes("euro") || text.includes("eur")) currency = "EUR";

  // Detect category
  let category = null;
  if (
    text.includes("super") ||
    text.includes("comida") ||
    text.includes("café")
  )
    category = "Food & Dining";
  if (text.includes("uber") || text.includes("taxi") || text.includes("nafta"))
    category = "Transportation";
  if (text.includes("alquiler") || text.includes("rent")) category = "Housing";
  if (text.includes("luz") || text.includes("gas") || text.includes("agua"))
    category = "Utilities";

  return {
    intent,
    action: {
      type:
        intent === "add_savings"
          ? "savings_contribution"
          : intent === "query_balance"
            ? "query"
            : "transaction",
      transaction_type: transactionType,
      amount,
      currency,
      category,
      description: null,
      date: today,
    },
    confidence: amount ? 0.7 : 0.4,
    requires_confirmation: true,
    clarification_needed: amount
      ? null
      : "No pude detectar el monto. ¿Cuánto fue?",
    suggested_response: amount
      ? `¿Confirmas ${intent === "add_expense" ? "un gasto" : "un ingreso"} de ${amount} ${currency}${category ? ` en ${category}` : ""}?`
      : "No pude entender completamente. ¿Podrías repetir el monto?",
  };
}
