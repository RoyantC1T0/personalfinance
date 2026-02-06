"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useBalanceContext } from "@/components/balance-provider";
import { useCurrency } from "@/hooks/use-currency";
import { useBlueRate } from "@/hooks/use-blue-rate";
import { useLanguage } from "@/components/language-provider";
import { formatCurrency, formatDate } from "@/lib/utils";
import { transactionsApi, savingsApi, reportsApi } from "@/lib/api-client";
import {
  ArrowUpRight,
  ArrowDownRight,
  TrendingUp,
  PiggyBank,
  RefreshCcw,
  Plus,
  ArrowRight,
  DollarSign,
  Languages,
  CheckCircle,
} from "lucide-react";
import Link from "next/link";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

interface Transaction {
  transaction_id: number;
  amount: number;
  currency_code: string;
  transaction_type: string;
  category_name: string;
  category_color: string;
  transaction_date: string;
  description: string;
}

interface SavingsGoal {
  goal_id: number;
  goal_name: string;
  target_amount: number;
  currency_code: string;
  progress_percentage: number;
  accumulated_amount: number;
}

interface TrendData {
  month: string;
  income: number;
  expenses: number;
}

export default function DashboardPage() {
  const { balance, refetch, closeBalance } = useBalanceContext();
  const { blueRate, refetch: refetchBlue } = useBlueRate();
  const { language, setLanguage, t } = useLanguage();

  // Initialize display currency with user's configured currency from balance
  const userCurrency = (balance?.currency_code as "USD" | "ARS") || "USD";
  const { displayCurrency, toggleCurrency, setDisplayCurrency } = useCurrency({
    initialCurrency: userCurrency,
  });

  const [recentTransactions, setRecentTransactions] = useState<Transaction[]>(
    [],
  );
  const [savingsGoals, setSavingsGoals] = useState<SavingsGoal[]>([]);
  const [trendData, setTrendData] = useState<TrendData[]>([]);

  // Sync display currency when balance loads with user's currency
  useEffect(() => {
    if (balance?.currency_code) {
      setDisplayCurrency(balance.currency_code as "USD" | "ARS");
    }
  }, [balance?.currency_code, setDisplayCurrency]);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const [transRes, goalsRes, trendsRes] = await Promise.all([
          transactionsApi.list({ limit: "5" }),
          savingsApi.listGoals(),
          reportsApi.getTrends(6),
        ]);

        setRecentTransactions(transRes.transactions as Transaction[]);
        setSavingsGoals((goalsRes as SavingsGoal[]).slice(0, 3));
        setTrendData((trendsRes as { data: TrendData[] }).data || []);
      } catch (error) {
        console.error("Error fetching dashboard data:", error);
      }
    };

    fetchDashboardData();
  }, []);

  const getBalanceDisplay = () => {
    if (!balance) return { income: 0, expenses: 0, netBalance: 0, savings: 0 };

    const conv =
      balance.conversions?.[
        displayCurrency as keyof typeof balance.conversions
      ];
    if (conv) {
      return {
        income: conv.income,
        expenses: conv.expenses,
        netBalance: conv.balance,
        savings: conv.savings,
      };
    }

    return {
      income: balance.current_month_income,
      expenses: balance.current_month_expenses,
      netBalance: balance.current_month_balance,
      savings: balance.total_savings,
    };
  };

  const balanceData = getBalanceDisplay();
  const isPositiveBalance = balanceData.netBalance >= 0;

  const toggleLanguage = () => {
    setLanguage(language === "es" ? "en" : "es");
  };

  return (
    <div className="space-y-6 min-w-0 overflow-hidden">
      {/* Header */}
      <div className="flex flex-col gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold">{t("dashboard")}</h1>
          <p className="text-sm text-muted-foreground">
            {formatDate(new Date(), "long")}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={toggleLanguage}
            title={
              language === "es" ? "Switch to English" : "Cambiar a Español"
            }
          >
            <Languages className="h-4 w-4 mr-1" />
            {language.toUpperCase()}
          </Button>
          <Button
            variant={displayCurrency === userCurrency ? "outline" : "secondary"}
            size="sm"
            onClick={toggleCurrency}
            title={
              displayCurrency === userCurrency
                ? `Ver en ${displayCurrency === "ARS" ? "USD" : "ARS"}`
                : `Volver a ${userCurrency}`
            }
          >
            {displayCurrency}
            {displayCurrency !== userCurrency && (
              <span className="ml-1 text-xs opacity-70">→ {userCurrency}</span>
            )}
          </Button>
          <Button
            variant="outline"
            size="icon"
            className="h-9 w-9"
            onClick={() => refetch()}
          >
            <RefreshCcw className="h-4 w-4" />
          </Button>
          <Button
            variant="default"
            size="sm"
            className="bg-green-600 hover:bg-green-700"
            onClick={async () => {
              if (
                confirm(
                  "¿Estás seguro de cerrar el balance actual? Esto iniciará un nuevo período.",
                )
              ) {
                const result = await closeBalance();
                if (result.success) {
                  alert(
                    "Balance cerrado exitosamente. Iniciando nuevo período.",
                  );
                }
              }
            }}
          >
            <CheckCircle className="h-4 w-4 mr-1" />
            {language === "es" ? "Cerrar Balance" : "Close Balance"}
          </Button>
        </div>
      </div>

      {/* Balance Cards */}
      <div className="grid gap-3 sm:gap-4 grid-cols-2 lg:grid-cols-4">
        {/* Main Balance */}
        <Card className="col-span-2 bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20 overflow-hidden">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium text-muted-foreground flex items-center gap-2">
              {t("monthlyBalance")}
              <span className="px-2 py-0.5 rounded-full bg-primary/20 text-primary text-[10px] sm:text-xs font-semibold">
                {displayCurrency}
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-baseline gap-2">
              <span
                className={`text-2xl sm:text-3xl lg:text-4xl font-bold truncate ${isPositiveBalance ? "text-success" : "text-destructive"}`}
              >
                {formatCurrency(balanceData.netBalance, displayCurrency)}
              </span>
            </div>
            <p className="text-[10px] sm:text-xs text-muted-foreground mt-1">
              {blueRate && displayCurrency === "ARS" && (
                <>Dólar Blue: ${blueRate.venta}</>
              )}
            </p>
          </CardContent>
        </Card>

        {/* Blue Dollar Rate */}
        <Card className="bg-gradient-to-br from-green-500/10 to-emerald-500/5 border-green-500/20 overflow-hidden">
          <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-xs sm:text-sm font-medium flex items-center gap-1 sm:gap-2">
              <DollarSign className="h-3 w-3 sm:h-4 sm:w-4 text-green-600" />
              <span className="truncate">Dólar Blue</span>
            </CardTitle>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 flex-shrink-0"
              onClick={refetchBlue}
            >
              <RefreshCcw className="h-3 w-3" />
            </Button>
          </CardHeader>
          <CardContent className="pt-0">
            {blueRate ? (
              <div className="space-y-1">
                <div className="flex justify-between items-baseline gap-2">
                  <span className="text-[10px] sm:text-xs text-muted-foreground">
                    {t("buy")}
                  </span>
                  <span className="text-sm sm:text-lg font-bold text-green-600">
                    ${blueRate.compra.toLocaleString("es-AR")}
                  </span>
                </div>
                <div className="flex justify-between items-baseline gap-2">
                  <span className="text-[10px] sm:text-xs text-muted-foreground">
                    {t("sell")}
                  </span>
                  <span className="text-sm sm:text-lg font-bold text-green-600">
                    ${blueRate.venta.toLocaleString("es-AR")}
                  </span>
                </div>
                <p className="text-[9px] sm:text-[10px] text-muted-foreground pt-1 truncate">
                  {new Date(blueRate.fechaActualizacion).toLocaleString(
                    "es-AR",
                    {
                      hour: "2-digit",
                      minute: "2-digit",
                      day: "2-digit",
                      month: "short",
                    },
                  )}
                </p>
              </div>
            ) : (
              <span className="text-muted-foreground text-xs sm:text-sm">
                {t("loading")}
              </span>
            )}
          </CardContent>
        </Card>

        {/* Income */}
        <Card className="overflow-hidden">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium flex items-center gap-1 sm:gap-2">
              <ArrowUpRight className="h-3 w-3 sm:h-4 sm:w-4 text-success flex-shrink-0" />
              <span className="truncate">{t("income")}</span>
              <span className="px-1.5 py-0.5 rounded-full bg-success/20 text-success text-[9px] sm:text-[10px] font-semibold ml-auto">
                {displayCurrency}
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <span className="text-lg sm:text-xl lg:text-2xl font-bold text-success truncate block">
              {formatCurrency(balanceData.income, displayCurrency)}
            </span>
          </CardContent>
        </Card>

        {/* Expenses */}
        <Card className="overflow-hidden">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium flex items-center gap-1 sm:gap-2">
              <ArrowDownRight className="h-3 w-3 sm:h-4 sm:w-4 text-destructive flex-shrink-0" />
              <span className="truncate">{t("expenses")}</span>
              <span className="px-1.5 py-0.5 rounded-full bg-destructive/20 text-destructive text-[9px] sm:text-[10px] font-semibold ml-auto">
                {displayCurrency}
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <span className="text-lg sm:text-xl lg:text-2xl font-bold text-destructive truncate block">
              {formatCurrency(balanceData.expenses, displayCurrency)}
            </span>
          </CardContent>
        </Card>
      </div>

      {/* Charts and Recent Activity */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Monthly Trend Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-primary" />
              {t("monthlyTrend")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[200px]">
              {trendData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={trendData}>
                    <XAxis
                      dataKey="month"
                      tickFormatter={(value) => value.slice(5)}
                      fontSize={12}
                    />
                    <YAxis fontSize={12} tickFormatter={(v) => `$${v}`} />
                    <Tooltip
                      formatter={(value) =>
                        formatCurrency(Number(value) || 0, "USD")
                      }
                    />
                    <Bar
                      dataKey="income"
                      name="Income"
                      fill="hsl(var(--success))"
                      radius={[4, 4, 0, 0]}
                    />
                    <Bar
                      dataKey="expenses"
                      name="Expenses"
                      fill="hsl(var(--destructive))"
                      radius={[4, 4, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-muted-foreground">
                  {t("noDataAvailable")}
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Recent Transactions */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg">{t("recentTransactions")}</CardTitle>
            <Link href="/dashboard/transactions">
              <Button variant="ghost" size="sm">
                {t("viewAll")}
                <ArrowRight className="h-4 w-4 ml-1" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recentTransactions.length > 0 ? (
                recentTransactions.map((tx) => (
                  <div
                    key={tx.transaction_id}
                    className="flex items-center justify-between p-2 rounded-lg hover:bg-muted/50"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className="w-8 h-8 rounded-full flex items-center justify-center"
                        style={{ backgroundColor: tx.category_color + "20" }}
                      >
                        <span style={{ color: tx.category_color }}>
                          {tx.transaction_type === "income" ? "+" : "-"}
                        </span>
                      </div>
                      <div>
                        <p className="text-sm font-medium">
                          {t(tx.category_name)}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {tx.description ||
                            formatDate(tx.transaction_date, "short")}
                        </p>
                      </div>
                    </div>
                    <span
                      className={`text-sm font-medium ${
                        tx.transaction_type === "income"
                          ? "text-success"
                          : "text-destructive"
                      }`}
                    >
                      {tx.transaction_type === "income" ? "+" : "-"}
                      {formatCurrency(tx.amount, tx.currency_code)}
                    </span>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <p>{t("noRecentTransactions")}</p>
                  <Link href="/dashboard/transactions">
                    <Button variant="link" size="sm">
                      <Plus className="h-4 w-4 mr-1" />
                      {t("addTransaction")}
                    </Button>
                  </Link>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Savings Goals */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <PiggyBank className="h-5 w-5 text-primary" />
            {t("savingsGoals")}
          </CardTitle>
          <Link href="/dashboard/savings">
            <Button variant="ghost" size="sm">
              {t("viewAll")}
              <ArrowRight className="h-4 w-4 ml-1" />
            </Button>
          </Link>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            {savingsGoals.length > 0 ? (
              savingsGoals.map((goal) => (
                <div
                  key={goal.goal_id}
                  className="p-4 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
                >
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h3 className="font-medium">{goal.goal_name}</h3>
                      <p className="text-xs text-muted-foreground">
                        {formatCurrency(
                          goal.accumulated_amount,
                          goal.currency_code,
                        )}{" "}
                        /{" "}
                        {formatCurrency(goal.target_amount, goal.currency_code)}
                      </p>
                    </div>
                    <span className="text-sm font-medium text-primary">
                      {goal.progress_percentage || 0}%
                    </span>
                  </div>
                  <Progress
                    value={goal.progress_percentage || 0}
                    className="h-2"
                  />
                </div>
              ))
            ) : (
              <div className="col-span-3 text-center py-8 text-muted-foreground">
                <PiggyBank className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p>{t("noSavingsGoals")}</p>
                <Link href="/dashboard/savings">
                  <Button variant="link" size="sm">
                    <Plus className="h-4 w-4 mr-1" />
                    {t("newGoal")}
                  </Button>
                </Link>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
