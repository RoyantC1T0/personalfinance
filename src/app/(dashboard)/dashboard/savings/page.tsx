"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
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
import { savingsApi } from "@/lib/api-client";
import { formatCurrency } from "@/lib/utils";
import { Plus, PiggyBank, Target, Loader2, DollarSign } from "lucide-react";

interface SavingsGoal {
  goal_id: number;
  goal_name: string;
  target_amount: number;
  currency_code: string;
  target_date: string | null;
  description: string | null;
  progress_percentage: number;
  accumulated_amount: number;
  remaining_amount: number;
}

export default function SavingsPage() {
  const [goals, setGoals] = useState<SavingsGoal[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isGoalModalOpen, setIsGoalModalOpen] = useState(false);
  const [isContributeModalOpen, setIsContributeModalOpen] = useState(false);
  const [selectedGoal, setSelectedGoal] = useState<SavingsGoal | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Goal form
  const [goalForm, setGoalForm] = useState({
    goal_name: "",
    target_amount: "",
    currency_code: "USD",
    target_date: "",
    description: "",
  });

  // Contribution form
  const [contributeForm, setContributeForm] = useState({
    amount: "",
    currency_code: "USD",
    contribution_date: new Date().toISOString().split("T")[0],
    notes: "",
  });

  useEffect(() => {
    fetchGoals();
  }, []);

  const fetchGoals = async () => {
    try {
      setIsLoading(true);
      const data = await savingsApi.listGoals();
      setGoals(data as SavingsGoal[]);
    } catch (error) {
      console.error("Error fetching goals:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateGoal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!goalForm.goal_name || !goalForm.target_amount) return;

    setIsSubmitting(true);
    try {
      await savingsApi.createGoal({
        ...goalForm,
        target_amount: parseFloat(goalForm.target_amount),
        target_date: goalForm.target_date || undefined,
      });
      setIsGoalModalOpen(false);
      setGoalForm({
        goal_name: "",
        target_amount: "",
        currency_code: "USD",
        target_date: "",
        description: "",
      });
      fetchGoals();
    } catch (error) {
      console.error("Error creating goal:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleContribute = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedGoal || !contributeForm.amount) return;

    setIsSubmitting(true);
    try {
      await savingsApi.contribute(selectedGoal.goal_id, {
        ...contributeForm,
        amount: parseFloat(contributeForm.amount),
      });
      setIsContributeModalOpen(false);
      setContributeForm({
        amount: "",
        currency_code: "USD",
        contribution_date: new Date().toISOString().split("T")[0],
        notes: "",
      });
      fetchGoals();
    } catch (error) {
      console.error("Error adding contribution:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const openContributeModal = (goal: SavingsGoal) => {
    setSelectedGoal(goal);
    setContributeForm({
      ...contributeForm,
      currency_code: goal.currency_code,
    });
    setIsContributeModalOpen(true);
  };

  // Calculate totals by currency
  const totalsByUSD = goals
    .filter((g) => g.currency_code === "USD")
    .reduce(
      (acc, g) => ({
        saved: acc.saved + Number(g.accumulated_amount),
        target: acc.target + Number(g.target_amount),
      }),
      { saved: 0, target: 0 },
    );

  const totalsByARS = goals
    .filter((g) => g.currency_code === "ARS")
    .reduce(
      (acc, g) => ({
        saved: acc.saved + Number(g.accumulated_amount),
        target: acc.target + Number(g.target_amount),
      }),
      { saved: 0, target: 0 },
    );

  const activeGoals = goals.length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Savings Goals</h1>
          <p className="text-muted-foreground">
            Track your progress towards financial goals
          </p>
        </div>
        <Button onClick={() => setIsGoalModalOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          New Goal
        </Button>
      </div>

      {/* Summary Cards - Separated by Currency */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {/* USD Totals */}
        <Card className="bg-gradient-to-br from-green-500/10 to-emerald-500/5 border-green-500/20">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-green-600" />
              USD Savings
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between items-baseline">
                <span className="text-xs text-muted-foreground">Saved</span>
                <span className="text-lg font-bold text-green-600">
                  {formatCurrency(totalsByUSD.saved, "USD")}
                </span>
              </div>
              <div className="flex justify-between items-baseline">
                <span className="text-xs text-muted-foreground">Target</span>
                <span className="text-sm font-medium">
                  {formatCurrency(totalsByUSD.target, "USD")}
                </span>
              </div>
              {totalsByUSD.target > 0 && (
                <Progress
                  value={(totalsByUSD.saved / totalsByUSD.target) * 100}
                  className="h-1.5"
                />
              )}
            </div>
          </CardContent>
        </Card>

        {/* ARS Totals */}
        <Card className="bg-gradient-to-br from-blue-500/10 to-sky-500/5 border-blue-500/20">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <PiggyBank className="h-4 w-4 text-blue-600" />
              ARS Savings
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between items-baseline">
                <span className="text-xs text-muted-foreground">Saved</span>
                <span className="text-lg font-bold text-blue-600">
                  {formatCurrency(totalsByARS.saved, "ARS")}
                </span>
              </div>
              <div className="flex justify-between items-baseline">
                <span className="text-xs text-muted-foreground">Target</span>
                <span className="text-sm font-medium">
                  {formatCurrency(totalsByARS.target, "ARS")}
                </span>
              </div>
              {totalsByARS.target > 0 && (
                <Progress
                  value={(totalsByARS.saved / totalsByARS.target) * 100}
                  className="h-1.5"
                />
              )}
            </div>
          </CardContent>
        </Card>

        {/* Active Goals */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Target className="h-4 w-4 text-primary" />
              Active Goals
            </CardTitle>
          </CardHeader>
          <CardContent>
            <span className="text-3xl font-bold">{activeGoals}</span>
            <p className="text-xs text-muted-foreground mt-1">
              {goals.filter((g) => g.progress_percentage >= 100).length}{" "}
              completed
            </p>
          </CardContent>
        </Card>

        {/* Quick Stats */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Quick Stats</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-1 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">USD Goals</span>
                <span className="font-medium">
                  {goals.filter((g) => g.currency_code === "USD").length}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">ARS Goals</span>
                <span className="font-medium">
                  {goals.filter((g) => g.currency_code === "ARS").length}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Avg Progress</span>
                <span className="font-medium">
                  {goals.length > 0
                    ? Math.round(
                        goals.reduce(
                          (sum, g) => sum + (g.progress_percentage || 0),
                          0,
                        ) / goals.length,
                      )
                    : 0}
                  %
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Goals Grid */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : goals.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {goals.map((goal) => (
            <Card
              key={goal.goal_id}
              className="hover:shadow-md transition-shadow"
            >
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span className="truncate">{goal.goal_name}</span>
                  <span className="text-sm font-normal text-primary">
                    {goal.progress_percentage || 0}%
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Progress
                  value={goal.progress_percentage || 0}
                  className="h-3"
                  indicatorColor={
                    (goal.progress_percentage || 0) >= 100
                      ? "bg-success"
                      : (goal.progress_percentage || 0) >= 50
                        ? "bg-primary"
                        : "bg-warning"
                  }
                />

                <div className="flex justify-between text-sm">
                  <div>
                    <p className="text-muted-foreground">Saved</p>
                    <p className="font-medium text-success">
                      {formatCurrency(
                        goal.accumulated_amount,
                        goal.currency_code,
                      )}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-muted-foreground">Target</p>
                    <p className="font-medium">
                      {formatCurrency(goal.target_amount, goal.currency_code)}
                    </p>
                  </div>
                </div>

                {goal.remaining_amount > 0 && (
                  <p className="text-xs text-muted-foreground text-center">
                    {formatCurrency(goal.remaining_amount, goal.currency_code)}{" "}
                    remaining
                  </p>
                )}

                {goal.target_date && (
                  <p className="text-xs text-muted-foreground text-center">
                    Target date:{" "}
                    {new Date(goal.target_date).toLocaleDateString()}
                  </p>
                )}

                <Button
                  className="w-full"
                  variant={
                    goal.progress_percentage >= 100 ? "outline" : "default"
                  }
                  onClick={() => openContributeModal(goal)}
                >
                  <DollarSign className="h-4 w-4 mr-2" />
                  Add Contribution
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="text-center py-12">
            <PiggyBank className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-medium mb-2">No savings goals yet</h3>
            <p className="text-muted-foreground mb-4">
              Create your first goal to start tracking your savings
            </p>
            <Button onClick={() => setIsGoalModalOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Create Goal
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Create Goal Modal */}
      <Dialog open={isGoalModalOpen} onOpenChange={setIsGoalModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Savings Goal</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleCreateGoal} className="space-y-4">
            <div>
              <Label>Goal Name</Label>
              <Input
                placeholder="e.g., Emergency Fund, Vacation"
                value={goalForm.goal_name}
                onChange={(e) =>
                  setGoalForm({ ...goalForm, goal_name: e.target.value })
                }
                required
              />
            </div>

            <div className="grid grid-cols-3 gap-2">
              <div className="col-span-2">
                <Label>Target Amount</Label>
                <Input
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={goalForm.target_amount}
                  onChange={(e) =>
                    setGoalForm({ ...goalForm, target_amount: e.target.value })
                  }
                  required
                />
              </div>
              <div>
                <Label>Currency</Label>
                <Select
                  value={goalForm.currency_code}
                  onValueChange={(value) =>
                    setGoalForm({ ...goalForm, currency_code: value })
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

            <div>
              <Label>Target Date (optional)</Label>
              <Input
                type="date"
                value={goalForm.target_date}
                onChange={(e) =>
                  setGoalForm({ ...goalForm, target_date: e.target.value })
                }
              />
            </div>

            <div>
              <Label>Description (optional)</Label>
              <Input
                placeholder="What are you saving for?"
                value={goalForm.description}
                onChange={(e) =>
                  setGoalForm({ ...goalForm, description: e.target.value })
                }
              />
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsGoalModalOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                )}
                Create Goal
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Contribute Modal */}
      <Dialog
        open={isContributeModalOpen}
        onOpenChange={setIsContributeModalOpen}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              Add Contribution to {selectedGoal?.goal_name}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleContribute} className="space-y-4">
            <div className="grid grid-cols-3 gap-2">
              <div className="col-span-2">
                <Label>Amount</Label>
                <Input
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={contributeForm.amount}
                  onChange={(e) =>
                    setContributeForm({
                      ...contributeForm,
                      amount: e.target.value,
                    })
                  }
                  required
                />
              </div>
              <div>
                <Label>Currency</Label>
                <Select
                  value={contributeForm.currency_code}
                  onValueChange={(value) =>
                    setContributeForm({
                      ...contributeForm,
                      currency_code: value,
                    })
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

            <div>
              <Label>Date</Label>
              <Input
                type="date"
                value={contributeForm.contribution_date}
                onChange={(e) =>
                  setContributeForm({
                    ...contributeForm,
                    contribution_date: e.target.value,
                  })
                }
                required
              />
            </div>

            <div>
              <Label>Notes (optional)</Label>
              <Input
                placeholder="Any notes about this contribution"
                value={contributeForm.notes}
                onChange={(e) =>
                  setContributeForm({
                    ...contributeForm,
                    notes: e.target.value,
                  })
                }
              />
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsContributeModalOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                )}
                Add Contribution
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
