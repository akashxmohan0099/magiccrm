"use client";

// Soft, muted palette — easy on the eyes, uses the dot for color signaling
// instead of loud saturated backgrounds
const COLORS: Record<string, { bg: string; text: string; dot: string }> = {
  // ── Positive / active states ──
  active:      { bg: "bg-stone-50", text: "text-stone-600", dot: "bg-emerald-400" },
  confirmed:   { bg: "bg-stone-50", text: "text-stone-600", dot: "bg-emerald-400" },
  completed:   { bg: "bg-stone-50", text: "text-stone-600", dot: "bg-emerald-400" },
  paid:        { bg: "bg-stone-50", text: "text-stone-600", dot: "bg-emerald-400" },
  won:         { bg: "bg-stone-50", text: "text-stone-600", dot: "bg-emerald-400" },
  accepted:    { bg: "bg-stone-50", text: "text-stone-600", dot: "bg-emerald-400" },
  resolved:    { bg: "bg-stone-50", text: "text-stone-600", dot: "bg-emerald-400" },

  // ── Neutral / in-progress states ──
  new:           { bg: "bg-stone-50", text: "text-stone-600", dot: "bg-blue-400" },
  open:          { bg: "bg-stone-50", text: "text-stone-600", dot: "bg-blue-400" },
  sent:          { bg: "bg-stone-50", text: "text-stone-600", dot: "bg-blue-400" },
  contacted:     { bg: "bg-stone-50", text: "text-stone-600", dot: "bg-amber-400" },
  pending:       { bg: "bg-stone-50", text: "text-stone-600", dot: "bg-amber-400" },
  "in-progress": { bg: "bg-stone-50", text: "text-stone-600", dot: "bg-amber-400" },
  waiting:       { bg: "bg-stone-50", text: "text-stone-600", dot: "bg-amber-400" },
  scheduled:     { bg: "bg-stone-50", text: "text-stone-600", dot: "bg-blue-400" },
  qualified:     { bg: "bg-stone-50", text: "text-stone-600", dot: "bg-violet-400" },
  proposal:      { bg: "bg-stone-50", text: "text-stone-600", dot: "bg-violet-400" },
  review:        { bg: "bg-stone-50", text: "text-stone-600", dot: "bg-violet-400" },
  prospect:      { bg: "bg-stone-50", text: "text-stone-600", dot: "bg-blue-400" },
  vip:           { bg: "bg-stone-50", text: "text-stone-600", dot: "bg-violet-400" },

  // ── Inactive / closed states ──
  inactive:      { bg: "bg-stone-50", text: "text-stone-400", dot: "bg-stone-300" },
  draft:         { bg: "bg-stone-50", text: "text-stone-400", dot: "bg-stone-300" },
  expired:       { bg: "bg-stone-50", text: "text-stone-400", dot: "bg-stone-300" },
  "not-started": { bg: "bg-stone-50", text: "text-stone-400", dot: "bg-stone-300" },
  closed:        { bg: "bg-stone-50", text: "text-stone-400", dot: "bg-stone-300" },

  // ── Warning / negative states ──
  overdue:   { bg: "bg-red-50/60", text: "text-red-500", dot: "bg-red-400" },
  cancelled: { bg: "bg-stone-50", text: "text-stone-400", dot: "bg-red-300" },
  declined:  { bg: "bg-stone-50", text: "text-stone-400", dot: "bg-red-300" },
  lost:      { bg: "bg-stone-50", text: "text-stone-400", dot: "bg-red-300" },
  churned:   { bg: "bg-stone-50", text: "text-stone-400", dot: "bg-red-300" },
};

const DEFAULT = { bg: "bg-stone-50", text: "text-stone-500", dot: "bg-stone-300" };

interface StatusBadgeProps {
  status: string;
  className?: string;
}

export function StatusBadge({ status, className = "" }: StatusBadgeProps) {
  const colors = COLORS[status] || DEFAULT;
  const label = status.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${colors.bg} ${colors.text} ${className}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${colors.dot}`} />
      {label}
    </span>
  );
}
