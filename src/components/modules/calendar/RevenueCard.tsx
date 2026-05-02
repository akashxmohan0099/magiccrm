"use client";

import { TrendingDown, TrendingUp } from "lucide-react";
import type { UtilizationResult } from "@/lib/calendar/utilization";
import { useMoney } from "@/lib/format/money";

interface Props {
  weekly: UtilizationResult;
  /** Booked revenue for the comparison window (prior week or week-before-next). */
  comparisonRevenue: number | null;
  comparisonLabel: string;
}

function pctDelta(curr: number, prev: number): number | null {
  if (prev <= 0) return null;
  return Math.round(((curr - prev) / prev) * 100);
}

export function RevenueCard({
  weekly,
  comparisonRevenue,
  comparisonLabel,
}: Props) {
  const money = useMoney();
  const opportunity = Math.max(0, weekly.opportunityRevenue);
  const delta =
    comparisonRevenue !== null
      ? pctDelta(weekly.bookedRevenue, comparisonRevenue)
      : null;

  return (
    <div className="bg-card-bg border border-border-light rounded-xl p-4">
      <p className="text-[10px] font-semibold tracking-wide text-text-tertiary uppercase mb-3">
        Revenue
      </p>

      <div className="flex items-baseline gap-1.5">
        <span className="text-[28px] font-semibold text-foreground tabular-nums leading-none">
          {money.format(weekly.bookedRevenue)}
        </span>
        <span className="text-[12px] text-text-secondary">booked</span>
      </div>

      <div className="mt-3 space-y-1.5">
        {opportunity > 0 && (
          <div className="flex items-center justify-between text-[12px]">
            <span className="text-text-secondary">Open capacity</span>
            <span className="font-medium text-primary tabular-nums">
              +{money.format(opportunity)}
            </span>
          </div>
        )}
        {delta !== null && (
          <div className="flex items-center justify-between text-[12px]">
            <span className="text-text-secondary">{comparisonLabel}</span>
            <span
              className={`inline-flex items-center gap-0.5 font-medium tabular-nums ${
                delta >= 0 ? "text-primary" : "text-red-500"
              }`}
            >
              {delta >= 0 ? (
                <TrendingUp className="w-3 h-3" />
              ) : (
                <TrendingDown className="w-3 h-3" />
              )}
              {delta >= 0 ? "+" : ""}
              {delta}%
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
