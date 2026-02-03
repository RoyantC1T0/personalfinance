"use client";

import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { transactionsApi, categoriesApi } from "@/lib/api-client";
import { useBalanceContext } from "@/components/balance-provider";
import { useLanguage } from "@/components/language-provider";
import { formatCurrency, formatDate } from "@/lib/utils";
import { Plus, Search, Filter, Trash2, Edit, Loader2 } from "lucide-react";

interface Transaction {
  transaction_id: number;
  amount: number;
  currency_code: string;
  transaction_type: "income" | "expense";
  category_id: number;
  category_name: string;
  category_color: string;
  category_icon: string;
  transaction_date: string;
  description: string;
  notes: string;
}

interface Category {
  category_id: number;
  category_name: string;
  transaction_type: string;
  color_hex: string;
}

export default function TransactionsPage() {
  const { refetch: refetchBalance } = useBalanceContext();
  const { t } = useLanguage();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTx, setEditingTx] = useState<Transaction | null>(null);
  const [filter, setFilter] = useState({ type: "all", search: "" });

  // Form state
  const [form, setForm] = useState({
    transaction_type: "expense" as "income" | "expense",
    category_id: "",
    amount: "",
    currency_code: "USD",
    transaction_date: new Date().toISOString().split("T")[0],
    description: "",
    notes: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchData();
  }, [filter.type]);

  const fetchData = async () => {
    try {
      setIsLoading(true);
      const params: Record<string, string> = { limit: "50" };
      if (filter.type !== "all") params.type = filter.type;

      const [txRes, catRes] = await Promise.all([
        transactionsApi.list(params),
        categoriesApi.list(),
      ]);

      setTransactions(txRes.transactions as Transaction[]);
      setCategories(catRes as Category[]);
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.category_id || !form.amount) return;

    setIsSubmitting(true);
    try {
      const data = {
        ...form,
        category_id: parseInt(form.category_id),
        amount: parseFloat(form.amount),
      };

      if (editingTx) {
        await transactionsApi.update(editingTx.transaction_id, data);
      } else {
        await transactionsApi.create(data);
      }

      setIsModalOpen(false);
      setEditingTx(null);
      resetForm();
      fetchData();
      refetchBalance();
    } catch (error) {
      console.error("Error saving transaction:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm(t("delete") + "?")) return;

    try {
      await transactionsApi.delete(id);
      fetchData();
      refetchBalance();
    } catch (error) {
      console.error("Error deleting transaction:", error);
    }
  };

  const handleEdit = (tx: Transaction) => {
    setEditingTx(tx);
    setForm({
      transaction_type: tx.transaction_type,
      category_id: tx.category_id.toString(),
      amount: tx.amount.toString(),
      currency_code: tx.currency_code,
      transaction_date: tx.transaction_date.split("T")[0],
      description: tx.description || "",
      notes: tx.notes || "",
    });
    setIsModalOpen(true);
  };

  const resetForm = () => {
    setForm({
      transaction_type: "expense",
      category_id: "",
      amount: "",
      currency_code: "USD",
      transaction_date: new Date().toISOString().split("T")[0],
      description: "",
      notes: "",
    });
  };

  const openNewModal = () => {
    resetForm();
    setEditingTx(null);
    setIsModalOpen(true);
  };

  const filteredCategories = categories.filter(
    (c) => c.transaction_type === form.transaction_type,
  );

  const filteredTransactions = transactions.filter((tx) => {
    if (filter.search) {
      const search = filter.search.toLowerCase();
      return (
        tx.category_name.toLowerCase().includes(search) ||
        tx.description?.toLowerCase().includes(search)
      );
    }
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">{t("transactions")}</h1>
          <p className="text-muted-foreground">{t("manageTransactions")}</p>
        </div>
        <Button onClick={openNewModal}>
          <Plus className="h-4 w-4 mr-2" />
          {t("addTransaction")}
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="py-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder={t("searchTransactions")}
                  className="pl-9"
                  value={filter.search}
                  onChange={(e) =>
                    setFilter({ ...filter, search: e.target.value })
                  }
                />
              </div>
            </div>
            <Select
              value={filter.type}
              onValueChange={(value) => setFilter({ ...filter, type: value })}
            >
              <SelectTrigger className="w-full sm:w-[180px]">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Filter by type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t("all")}</SelectItem>
                <SelectItem value="income">{t("income")}</SelectItem>
                <SelectItem value="expense">{t("expenses")}</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Transactions List */}
      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : filteredTransactions.length > 0 ? (
            <div className="divide-y">
              {filteredTransactions.map((tx) => (
                <div
                  key={tx.transaction_id}
                  className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-4 hover:bg-muted/50 gap-3"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className="w-10 h-10 flex-shrink-0 rounded-full flex items-center justify-center text-lg"
                      style={{
                        backgroundColor: tx.category_color + "20",
                        color: tx.category_color,
                      }}
                    >
                      {tx.transaction_type === "income" ? "↑" : "↓"}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-medium truncate">{tx.category_name}</p>
                      <p className="text-sm text-muted-foreground truncate">
                        {tx.description ||
                          formatDate(tx.transaction_date, "short")}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between sm:justify-end gap-2 sm:gap-4 pl-13 sm:pl-0">
                    <span
                      className={`font-semibold text-sm sm:text-base ${
                        tx.transaction_type === "income"
                          ? "text-success"
                          : "text-destructive"
                      }`}
                    >
                      {tx.transaction_type === "income" ? "+" : "-"}
                      {formatCurrency(tx.amount, tx.currency_code)}
                    </span>
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => handleEdit(tx)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive hover:text-destructive"
                        onClick={() => handleDelete(tx.transaction_id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              <p>{t("noTransactionsFound")}</p>
              <Button variant="link" onClick={openNewModal}>
                {t("addTransaction")}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add/Edit Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingTx ? t("editTransaction") : t("addNewTransaction")}
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Type Toggle */}
            <div className="grid grid-cols-2 gap-2">
              <Button
                type="button"
                variant={
                  form.transaction_type === "expense" ? "default" : "outline"
                }
                onClick={() =>
                  setForm({
                    ...form,
                    transaction_type: "expense",
                    category_id: "",
                  })
                }
              >
                {t("expenses")}
              </Button>
              <Button
                type="button"
                variant={
                  form.transaction_type === "income" ? "default" : "outline"
                }
                onClick={() =>
                  setForm({
                    ...form,
                    transaction_type: "income",
                    category_id: "",
                  })
                }
              >
                {t("income")}
              </Button>
            </div>

            {/* Amount + Currency */}
            <div className="grid grid-cols-3 gap-2">
              <div className="col-span-2">
                <Label>{t("amount")}</Label>
                <Input
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={form.amount}
                  onChange={(e) => setForm({ ...form, amount: e.target.value })}
                  required
                />
              </div>
              <div>
                <Label>{t("currency")}</Label>
                <Select
                  value={form.currency_code}
                  onValueChange={(value) =>
                    setForm({ ...form, currency_code: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="USD">USD</SelectItem>
                    <SelectItem value="ARS">ARS</SelectItem>
                    <SelectItem value="EUR">EUR</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Category */}
            <div>
              <Label>{t("category")}</Label>
              <Select
                value={form.category_id}
                onValueChange={(value) =>
                  setForm({ ...form, category_id: value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder={t("selectCategory")} />
                </SelectTrigger>
                <SelectContent>
                  {filteredCategories.map((cat) => (
                    <SelectItem
                      key={cat.category_id}
                      value={cat.category_id.toString()}
                    >
                      <div className="flex items-center gap-2">
                        <div
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: cat.color_hex }}
                        />
                        {cat.category_name}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Date */}
            <div>
              <Label>{t("date")}</Label>
              <Input
                type="date"
                value={form.transaction_date}
                onChange={(e) =>
                  setForm({ ...form, transaction_date: e.target.value })
                }
                required
              />
            </div>

            {/* Description */}
            <div>
              <Label>{t("description")}</Label>
              <Input
                placeholder="What was this for?"
                value={form.description}
                onChange={(e) =>
                  setForm({ ...form, description: e.target.value })
                }
              />
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsModalOpen(false)}
              >
                {t("cancel")}
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                )}
                {editingTx ? t("save") : t("add")}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
