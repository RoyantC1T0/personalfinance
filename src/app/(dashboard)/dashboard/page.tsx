"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useBalance } from "@/hooks/use-balance";
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
  const { balance, refetch } = useBalance();
  const { displayCurrency, toggleCurrency } = useCurrency();
  const { blueRate, refetch: refetchBlue } = useBlueRate();
  const { language, setLanguage, t } = useLanguage();
  const [recentTransactions, setRecentTransactions] = useState<Transaction[]>(
    [],
  );
  const [savingsGoals, setSavingsGoals] = useState<SavingsGoal[]>([]);
  const [trendData, setTrendData] = useState<TrendData[]>([]);

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
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">{t("dashboard")}</h1>
          <p className="text-muted-foreground">
            {formatDate(new Date(), "long")}
          </p>
        </div>
        <div className="flex gap-2">
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
          <Button variant="outline" size="sm" onClick={toggleCurrency}>
            {displayCurrency}
          </Button>
          <Button variant="outline" size="icon" onClick={() => refetch()}>
            <RefreshCcw className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Balance Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {/* Main Balance */}
        <Card className="md:col-span-2 bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {t("monthlyBalance")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-baseline gap-2">
              <span
                className={`text-4xl font-bold ${isPositiveBalance ? "text-success" : "text-destructive"}`}
              >
                {formatCurrency(balanceData.netBalance, displayCurrency)}
              </span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {blueRate && displayCurrency === "ARS" && (
                <>Dólar Blue: ${blueRate.venta}</>
              )}
            </p>
          </CardContent>
        </Card>

        {/* Blue Dollar Rate */}
        <Card className="bg-gradient-to-br from-green-500/10 to-emerald-500/5 border-green-500/20">
          <CardHeader className="pb-2 flex flex-row items-center justify-between">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-green-600" />
              Dólar Blue
            </CardTitle>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6"
              onClick={refetchBlue}
            >
              <RefreshCcw className="h-3 w-3" />
            </Button>
          </CardHeader>
          <CardContent>
            {blueRate ? (
              <div className="space-y-1">
                <div className="flex justify-between items-baseline">
                  <span className="text-xs text-muted-foreground">
                    {t("buy")}
                  </span>
                  <span className="text-lg font-bold text-green-600">
                    ${blueRate.compra.toLocaleString("es-AR")}
                  </span>
                </div>
                <div className="flex justify-between items-baseline">
                  <span className="text-xs text-muted-foreground">
                    {t("sell")}
                  </span>
                  <span className="text-lg font-bold text-green-600">
                    ${blueRate.venta.toLocaleString("es-AR")}
                  </span>
                </div>
                <p className="text-[10px] text-muted-foreground pt-1">
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
              <span className="text-muted-foreground text-sm">
                {t("loading")}
              </span>
            )}
          </CardContent>
        </Card>

        {/* Income */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <ArrowUpRight className="h-4 w-4 text-success" />
              {t("income")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <span className="text-2xl font-bold text-success">
              {formatCurrency(balanceData.income, displayCurrency)}
            </span>
          </CardContent>
        </Card>

        {/* Expenses */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <ArrowDownRight className="h-4 w-4 text-destructive" />
              {t("expenses")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <span className="text-2xl font-bold text-destructive">
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
                          {tx.category_name}
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
