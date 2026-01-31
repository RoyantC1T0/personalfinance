"use client";

import { useEffect, useState } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAuth } from "@/hooks/use-auth";
import { useTheme } from "@/components/theme-provider";
import { balanceApi, categoriesApi } from "@/lib/api-client";
import {
  User,
  DollarSign,
  Palette,
  Mic,
  Bell,
  Loader2,
  Save,
  Moon,
  Sun,
} from "lucide-react";

interface Category {
  category_id: number;
  category_name: string;
  transaction_type: string;
  color_hex: string;
  icon: string;
}

export default function SettingsPage() {
  const { user, refreshUser } = useAuth();
  const { setTheme, resolvedTheme } = useTheme();
  const [isLoading, setIsLoading] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [monthlyIncome, setMonthlyIncome] = useState("");
  const [preferences, setPreferences] = useState({
    currency: "USD",
    voice_enabled: true,
    notifications: true,
  });

  useEffect(() => {
    if (user?.preferences) {
      setPreferences({
        currency: user.default_currency_code || "USD",
        voice_enabled: user.preferences.enable_voice_commands ?? true,
        notifications: true,
      });
      if (user.preferences.monthly_income) {
        setMonthlyIncome(user.preferences.monthly_income.toString());
      }
    }

    fetchCategories();
  }, [user]);

  const fetchCategories = async () => {
    try {
      const data = await categoriesApi.list();
      setCategories(data as Category[]);
    } catch (error) {
      console.error("Error fetching categories:", error);
    }
  };

  const handleSaveIncome = async () => {
    if (!monthlyIncome) return;

    setIsLoading(true);
    try {
      await balanceApi.setMonthlyIncome(parseFloat(monthlyIncome));
      await refreshUser();
    } catch (error) {
      console.error("Error saving monthly income:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const expenseCategories = categories.filter(
    (c) => c.transaction_type === "expense",
  );
  const incomeCategories = categories.filter(
    (c) => c.transaction_type === "income",
  );

  return (
    <div className="space-y-6 max-w-3xl">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">Settings</h1>
        <p className="text-muted-foreground">
          Manage your account and preferences
        </p>
      </div>

      {/* Profile Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5 text-primary" />
            Profile
          </CardTitle>
          <CardDescription>Your personal information</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label>Full Name</Label>
              <Input value={user?.full_name || ""} disabled />
            </div>
            <div>
              <Label>Email</Label>
              <Input value={user?.email || ""} disabled />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Financial Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5 text-primary" />
            Financial Settings
          </CardTitle>
          <CardDescription>Configure your income and currency</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Monthly Base Income</Label>
              <div className="flex gap-2">
                <Input
                  type="number"
                  placeholder="0.00"
                  value={monthlyIncome}
                  onChange={(e) => setMonthlyIncome(e.target.value)}
                />
                <Button onClick={handleSaveIncome} disabled={isLoading}>
                  {isLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Save className="h-4 w-4" />
                  )}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Your fixed monthly income (salary, etc.)
              </p>
            </div>
            <div className="space-y-2">
              <Label>Default Currency</Label>
              <Select
                value={preferences.currency}
                onValueChange={(value) =>
                  setPreferences({ ...preferences, currency: value })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="USD">USD - US Dollar</SelectItem>
                  <SelectItem value="ARS">ARS - Argentine Peso</SelectItem>
                  <SelectItem value="EUR">EUR - Euro</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Preferences */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Palette className="h-5 w-5 text-primary" />
            Preferences
          </CardTitle>
          <CardDescription>Customize your experience</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label className="flex items-center gap-2">
                {resolvedTheme === "dark" ? (
                  <Moon className="h-4 w-4" />
                ) : (
                  <Sun className="h-4 w-4" />
                )}
                Dark Mode
              </Label>
              <p className="text-xs text-muted-foreground">
                Switch between light and dark theme
              </p>
            </div>
            <Switch
              checked={resolvedTheme === "dark"}
              onCheckedChange={(checked) =>
                setTheme(checked ? "dark" : "light")
              }
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label className="flex items-center gap-2">
                <Mic className="h-4 w-4" />
                Voice Commands
              </Label>
              <p className="text-xs text-muted-foreground">
                Enable voice input for quick transactions
              </p>
            </div>
            <Switch
              checked={preferences.voice_enabled}
              onCheckedChange={(checked) =>
                setPreferences({ ...preferences, voice_enabled: checked })
              }
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label className="flex items-center gap-2">
                <Bell className="h-4 w-4" />
                Notifications
              </Label>
              <p className="text-xs text-muted-foreground">
                Receive reminders and updates
              </p>
            </div>
            <Switch
              checked={preferences.notifications}
              onCheckedChange={(checked) =>
                setPreferences({ ...preferences, notifications: checked })
              }
            />
          </div>
        </CardContent>
      </Card>

      {/* Categories */}
      <Card>
        <CardHeader>
          <CardTitle>Categories</CardTitle>
          <CardDescription>Your transaction categories</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label className="text-sm font-medium">Expense Categories</Label>
            <div className="mt-2 flex flex-wrap gap-2">
              {expenseCategories.map((cat) => (
                <div
                  key={cat.category_id}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-full text-sm"
                  style={{
                    backgroundColor: cat.color_hex + "20",
                    color: cat.color_hex,
                  }}
                >
                  <div
                    className="w-2 h-2 rounded-full"
                    style={{ backgroundColor: cat.color_hex }}
                  />
                  {cat.category_name}
                </div>
              ))}
            </div>
          </div>

          <div>
            <Label className="text-sm font-medium">Income Categories</Label>
            <div className="mt-2 flex flex-wrap gap-2">
              {incomeCategories.map((cat) => (
                <div
                  key={cat.category_id}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-full text-sm"
                  style={{
                    backgroundColor: cat.color_hex + "20",
                    color: cat.color_hex,
                  }}
                >
                  <div
                    className="w-2 h-2 rounded-full"
                    style={{ backgroundColor: cat.color_hex }}
                  />
                  {cat.category_name}
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
