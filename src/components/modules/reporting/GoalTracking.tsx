"use client";

import { useState, useEffect } from "react";
import { Target } from "lucide-react";
import { motion } from "framer-motion";
import { usePaymentsStore } from "@/store/payments";
import { useClientsStore } from "@/store/clients";
import { useJobsStore } from "@/store/jobs";

interface Goal {
  id: string;
  label: string;
  target: number;
  unit: string;
}

const DEFAULT_GOALS: Goal[] = [
  { id: "monthly-revenue", label: "Monthly Revenue Target", target: 10000, unit: "$" },
  { id: "new-clients", label: "New Clients Target", target: 20, unit: "" },
  { id: "jobs-completed", label: "Jobs Completed Target", target: 15, unit: "" },
];

const STORAGE_KEY = "magic-crm-goals";

function loadGoals(): Goal[] {
  if (typeof window === "undefined") return DEFAULT_GOALS;
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) return JSON.parse(stored);
  } catch {
    // ignore parse errors
  }
  return DEFAULT_GOALS;
}

function saveGoals(goals: Goal[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(goals));
  } catch {
    // ignore storage errors
  }
}

export function GoalTracking() {
  const [goals, setGoals] = useState<Goal[]>(DEFAULT_GOALS);
  const [mounted, setMounted] = useState(false);
  const { getTotalRevenue } = usePaymentsStore();
  const { clients } = useClientsStore();
  const { jobs } = useJobsStore();

  useEffect(() => {
    setGoals(loadGoals());
    setMounted(true);
  }, []);

  const updateTarget = (id: string, target: number) => {
    const updated = goals.map((g) => (g.id === id ? { ...g, target } : g));
    setGoals(updated);
    saveGoals(updated);
  };

  const getProgress = (goalId: string): number => {
    switch (goalId) {
      case "monthly-revenue":
        return getTotalRevenue();
      case "new-clients":
        return clients.length;
      case "jobs-completed":
        return jobs.filter((j) => j.stage === "completed").length;
      default:
        return 0;
    }
  };

  if (!mounted) return null;

  return (
    <div className="bg-card-bg border border-border-warm rounded-xl p-6">
      <div className="flex items-center gap-2 mb-4">
        <Target className="w-5 h-5 text-brand" />
        <h2 className="text-lg font-semibold text-foreground tracking-tight">
          Goal Tracking
        </h2>
      </div>

      <div className="space-y-5">
        {goals.map((goal) => {
          const current = getProgress(goal.id);
          const pct = goal.target > 0 ? Math.min(100, Math.round((current / goal.target) * 100)) : 0;

          return (
            <div key={goal.id}>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-sm font-medium text-foreground">
                  {goal.label}
                </span>
                <span className="text-sm text-text-secondary">
                  {goal.unit === "$"
                    ? `$${current.toLocaleString("en-US", { minimumFractionDigits: 2 })}`
                    : current}{" "}
                  / {goal.unit === "$" ? `$${goal.target.toLocaleString()}` : goal.target}
                </span>
              </div>
              <div className="w-full h-2 bg-border-light rounded-full overflow-hidden mb-1.5">
                <motion.div
                  className="h-full bg-gradient-to-r from-[#FFE072] to-[#F2A000] rounded-full"
                  initial={{ width: 0 }}
                  animate={{ width: `${pct}%` }}
                  transition={{ duration: 0.5, ease: "easeOut" }}
                />
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-brand font-medium">{pct}%</span>
                <label className="text-xs text-text-secondary ml-auto">
                  Target:
                </label>
                <input
                  type="number"
                  value={goal.target}
                  onChange={(e) =>
                    updateTarget(goal.id, Math.max(0, Number(e.target.value)))
                  }
                  className="w-24 px-2 py-1 bg-surface border border-border-warm rounded text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-brand/20"
                  min={0}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
