"use client";

// Soft, muted palette — uses the dot for color signaling.
// bg/text use CSS variables so they adapt to dark mode.
const COLORS: Record<string, { bg: string; text: string; dot: string }> = {
  // ── Positive / active states ──
  active:      { bg: "bg-surface", text: "text-foreground", dot: "bg-emerald-400" },
  confirmed:   { bg: "bg-surface", text: "text-foreground", dot: "bg-emerald-400" },
  completed:   { bg: "bg-surface", text: "text-foreground", dot: "bg-emerald-400" },
  paid:        { bg: "bg-surface", text: "text-foreground", dot: "bg-emerald-400" },
  won:         { bg: "bg-surface", text: "text-foreground", dot: "bg-emerald-400" },
  accepted:    { bg: "bg-surface", text: "text-foreground", dot: "bg-emerald-400" },
  resolved:    { bg: "bg-surface", text: "text-foreground", dot: "bg-emerald-400" },

  // ── Neutral / in-progress states ──
  new:           { bg: "bg-surface", text: "text-foreground", dot: "bg-blue-400" },
  open:          { bg: "bg-surface", text: "text-foreground", dot: "bg-blue-400" },
  sent:          { bg: "bg-surface", text: "text-foreground", dot: "bg-blue-400" },
  contacted:     { bg: "bg-surface", text: "text-foreground", dot: "bg-amber-400" },
  pending:       { bg: "bg-surface", text: "text-foreground", dot: "bg-amber-400" },
  "in-progress": { bg: "bg-surface", text: "text-foreground", dot: "bg-amber-400" },
  waiting:       { bg: "bg-surface", text: "text-foreground", dot: "bg-amber-400" },
  scheduled:     { bg: "bg-surface", text: "text-foreground", dot: "bg-blue-400" },
  qualified:     { bg: "bg-surface", text: "text-foreground", dot: "bg-violet-400" },
  proposal:      { bg: "bg-surface", text: "text-foreground", dot: "bg-violet-400" },
  review:        { bg: "bg-surface", text: "text-foreground", dot: "bg-violet-400" },
  prospect:      { bg: "bg-surface", text: "text-foreground", dot: "bg-blue-400" },
  vip:           { bg: "bg-surface", text: "text-foreground", dot: "bg-violet-400" },

  // ── Inactive / closed states ──
  inactive:      { bg: "bg-surface", text: "text-text-tertiary", dot: "bg-text-tertiary" },
  draft:         { bg: "bg-surface", text: "text-text-tertiary", dot: "bg-text-tertiary" },
  expired:       { bg: "bg-surface", text: "text-text-tertiary", dot: "bg-text-tertiary" },
  "not-started": { bg: "bg-surface", text: "text-text-tertiary", dot: "bg-text-tertiary" },
  closed:        { bg: "bg-surface", text: "text-text-tertiary", dot: "bg-text-tertiary" },

  // ── Warning / negative states ──
  overdue:   { bg: "bg-red-500/10", text: "text-red-500", dot: "bg-red-400" },
  cancelled: { bg: "bg-surface", text: "text-text-tertiary", dot: "bg-red-400" },
  declined:  { bg: "bg-surface", text: "text-text-tertiary", dot: "bg-red-400" },
  lost:      { bg: "bg-surface", text: "text-text-tertiary", dot: "bg-red-400" },
  churned:   { bg: "bg-surface", text: "text-text-tertiary", dot: "bg-red-400" },
};

const DEFAULT = { bg: "bg-surface", text: "text-text-secondary", dot: "bg-text-tertiary" };

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
