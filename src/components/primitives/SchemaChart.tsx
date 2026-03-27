"use client";

import { useMemo } from "react";
// Icons reserved for future trend indicators
import type { FieldDefinition, ViewDefinition } from "@/types/module-schema";

type RecordData = { id: string; [key: string]: unknown };

interface SchemaChartProps {
  fields: FieldDefinition[];
  view: ViewDefinition;
  records: RecordData[];
}

/**
 * Schema-driven chart/stats view.
 *
 * Renders stat cards with counts, sums, and breakdowns based on
 * the schema fields. Not a full charting library — focused on
 * the summary cards that give at-a-glance insight.
 */
export function SchemaChart({ fields, view, records }: SchemaChartProps) {
  const fieldMap = useMemo(() => new Map(fields.map((f) => [f.id, f])), [fields]);

  // Build stats from visible fields
  const stats = useMemo(() => {
    const result: StatCard[] = [];

    // Total record count
    result.push({
      label: "Total Records",
      value: records.length,
      type: "count",
    });

    // For each visible field, generate relevant stat
    for (const fieldId of view.visibleFields) {
      const field = fieldMap.get(fieldId);
      if (!field) continue;

      if (field.type === "currency") {
        // Sum of currency field
        const total = records.reduce((sum, r) => sum + (Number(r[field.id]) || 0), 0);
        result.push({
          label: `Total ${field.label}`,
          value: total,
          type: "currency",
        });
      }

      if (field.type === "status" || field.type === "stage") {
        // Breakdown by status/stage
        const counts: Record<string, number> = {};
        for (const r of records) {
          const val = (r[field.id] as string) || "unknown";
          counts[val] = (counts[val] || 0) + 1;
        }
        const options = field.options || [];
        result.push({
          label: `${field.label} Breakdown`,
          type: "breakdown",
          breakdown: options.map((opt) => ({
            label: opt.label,
            count: counts[opt.value] || 0,
            color: opt.color,
          })),
        });
      }

      if (field.type === "rating") {
        // Average rating
        const rated = records.filter((r) => r[field.id] != null);
        const avg = rated.length > 0
          ? rated.reduce((sum, r) => sum + (Number(r[field.id]) || 0), 0) / rated.length
          : 0;
        result.push({
          label: `Avg ${field.label}`,
          value: Math.round(avg * 10) / 10,
          type: "number",
          suffix: " / 5",
        });
      }
    }

    return result;
  }, [records, view.visibleFields, fieldMap]);

  if (stats.length === 0) {
    return <div className="text-center py-12 text-text-tertiary">No chart data available.</div>;
  }

  return (
    <div className="space-y-6">
      {/* Stat cards row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.filter((s) => s.type !== "breakdown").map((stat, i) => (
          <StatCardView key={i} stat={stat} />
        ))}
      </div>

      {/* Breakdown sections */}
      {stats.filter((s) => s.type === "breakdown").map((stat, i) => (
        <BreakdownView key={i} stat={stat} total={records.length} />
      ))}
    </div>
  );
}

// ── Types ────────────────────────────────────────────────────

interface StatCard {
  label: string;
  value?: number;
  type: "count" | "currency" | "number" | "breakdown";
  suffix?: string;
  breakdown?: { label: string; count: number; color?: string }[];
}

// ── Stat Card ────────────────────────────────────────────────

function StatCardView({ stat }: { stat: StatCard }) {
  const display = stat.type === "currency"
    ? `$${(stat.value || 0).toLocaleString("en-AU", { minimumFractionDigits: 2 })}`
    : `${stat.value || 0}${stat.suffix || ""}`;

  return (
    <div className="bg-white rounded-2xl border border-border-light p-5">
      <p className="text-[11px] font-semibold text-text-tertiary uppercase tracking-wider mb-2">
        {stat.label}
      </p>
      <p className="text-[28px] font-bold text-foreground tabular-nums leading-none">
        {display}
      </p>
    </div>
  );
}

// ── Breakdown View ───────────────────────────────────────────

function BreakdownView({ stat, total }: { stat: StatCard; total: number }) {
  if (!stat.breakdown) return null;

  return (
    <div className="bg-white rounded-2xl border border-border-light p-5">
      <p className="text-xs font-semibold text-text-tertiary uppercase tracking-wider mb-4">
        {stat.label}
      </p>
      <div className="space-y-3">
        {stat.breakdown.map((item) => {
          const pct = total > 0 ? (item.count / total) * 100 : 0;
          return (
            <div key={item.label}>
              <div className="flex items-center justify-between mb-1">
                <span className="text-[13px] text-foreground">{item.label}</span>
                <span className="text-[13px] font-medium text-foreground tabular-nums">
                  {item.count} <span className="text-text-tertiary">({Math.round(pct)}%)</span>
                </span>
              </div>
              <div className="h-2 bg-surface rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${item.color || "bg-primary"}`}
                  style={{ width: `${Math.max(pct, 1)}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
