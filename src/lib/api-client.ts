// API client for frontend requests

const API_BASE = "/api";

interface FetchOptions extends RequestInit {
  token?: string;
}

async function fetchAPI<T>(
  endpoint: string,
  options: FetchOptions = {},
): Promise<T> {
  const { token, ...fetchOptions } = options;

  const headers: HeadersInit = {
    "Content-Type": "application/json",
    ...options.headers,
  };

  if (token) {
    (headers as Record<string, string>)["Authorization"] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...fetchOptions,
    headers,
    credentials: "include", // Include cookies
  });

  if (!response.ok) {
    const error = await response
      .json()
      .catch(() => ({ error: "Request failed" }));
    throw new Error(error.error || error.message || "Request failed");
  }

  return response.json();
}

// Auth API
export const authApi = {
  register: (data: { email: string; password: string; full_name?: string }) =>
    fetchAPI<{ user: object; token: string }>("/auth/register", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  login: (data: { email: string; password: string }) =>
    fetchAPI<{ user: object; token: string }>("/auth/login", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  logout: () => fetchAPI("/auth/logout", { method: "POST" }),

  me: () => fetchAPI<object>("/auth/me"),
};

// Transactions API
export const transactionsApi = {
  list: (params?: Record<string, string>) => {
    const query = params ? `?${new URLSearchParams(params)}` : "";
    return fetchAPI<{ transactions: object[]; pagination: object }>(
      `/transactions${query}`,
    );
  },

  get: (id: number) => fetchAPI<object>(`/transactions/${id}`),

  create: (data: object) =>
    fetchAPI<object>("/transactions", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  update: (id: number, data: object) =>
    fetchAPI<object>(`/transactions/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    }),

  delete: (id: number) =>
    fetchAPI<{ success: boolean }>(`/transactions/${id}`, { method: "DELETE" }),
};

// Categories API
export const categoriesApi = {
  list: (type?: "income" | "expense") => {
    const query = type ? `?type=${type}` : "";
    return fetchAPI<object[]>(`/categories${query}`);
  },

  create: (data: object) =>
    fetchAPI<object>("/categories", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  update: (id: number, data: object) =>
    fetchAPI<object>(`/categories/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    }),

  delete: (id: number) =>
    fetchAPI<{ success: boolean }>(`/categories/${id}`, { method: "DELETE" }),
};

// Balance API
export const balanceApi = {
  get: () => fetchAPI<object>("/balance"),

  setMonthlyIncome: (monthly_income: number) =>
    fetchAPI<{ success: boolean }>("/balance", {
      method: "POST",
      body: JSON.stringify({ monthly_income }),
    }),
};

// Savings API
export const savingsApi = {
  listGoals: () => fetchAPI<object[]>("/savings/goals"),

  getGoal: (id: number) => fetchAPI<object>(`/savings/goals/${id}`),

  createGoal: (data: object) =>
    fetchAPI<object>("/savings/goals", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  contribute: (goalId: number, data: object) =>
    fetchAPI<object>(`/savings/goals/${goalId}`, {
      method: "POST",
      body: JSON.stringify(data),
    }),

  deleteGoal: (id: number) =>
    fetchAPI<{ success: boolean }>(`/savings/goals/${id}`, {
      method: "DELETE",
    }),
};

// Reports API
export const reportsApi = {
  getSummary: (params?: Record<string, string>) => {
    const query = params
      ? `?${new URLSearchParams({ type: "summary", ...params })}`
      : "?type=summary";
    return fetchAPI<object>(`/reports${query}`);
  },

  getCategories: (params?: Record<string, string>) => {
    const query = `?${new URLSearchParams({ type: "categories", ...params })}`;
    return fetchAPI<object>(`/reports${query}`);
  },

  getTrends: (months?: number) => {
    const query = `?type=trends${months ? `&months=${months}` : ""}`;
    return fetchAPI<object>(`/reports${query}`);
  },
};

// Exchange Rates API
export const exchangeRatesApi = {
  get: (base?: string) => {
    const query = base ? `?base=${base}` : "";
    return fetchAPI<object>(`/exchange-rates${query}`);
  },

  sync: () => fetchAPI<object>("/exchange-rates", { method: "POST" }),
};

// Voice API
export const voiceApi = {
  process: (transcription: string, context: { current_screen?: string }) =>
    fetchAPI<object>("/voice/process", {
      method: "POST",
      body: JSON.stringify({ transcription, context }),
    }),

  execute: (commandId: number, confirm: boolean, updates?: object) =>
    fetchAPI<object>(`/voice/execute/${commandId}`, {
      method: "POST",
      body: JSON.stringify({ confirm, updates }),
    }),

  history: (limit?: number) => {
    const query = limit ? `?limit=${limit}` : "";
    return fetchAPI<object[]>(`/voice/process${query}`);
  },
};
