"use client";

const COLORS: Record<string, { bg: string; text: string; dot: string }> = {
  active: { bg: "bg-emerald-50", text: "text-emerald-700", dot: "bg-emerald-500" },
  inactive: { bg: "bg-gray-50", text: "text-gray-600", dot: "bg-gray-400" },
  prospect: { bg: "bg-blue-50", text: "text-blue-700", dot: "bg-blue-500" },
  new: { bg: "bg-blue-50", text: "text-blue-700", dot: "bg-blue-500" },
  contacted: { bg: "bg-amber-50", text: "text-amber-700", dot: "bg-amber-500" },
  qualified: { bg: "bg-purple-50", text: "text-purple-700", dot: "bg-purple-500" },
  proposal: { bg: "bg-orange-50", text: "text-orange-700", dot: "bg-orange-500" },
  won: { bg: "bg-emerald-50", text: "text-emerald-700", dot: "bg-emerald-500" },
  lost: { bg: "bg-red-50", text: "text-red-700", dot: "bg-red-500" },
  draft: { bg: "bg-gray-50", text: "text-gray-600", dot: "bg-gray-400" },
  sent: { bg: "bg-blue-50", text: "text-blue-700", dot: "bg-blue-500" },
  paid: { bg: "bg-emerald-50", text: "text-emerald-700", dot: "bg-emerald-500" },
  overdue: { bg: "bg-red-50", text: "text-red-700", dot: "bg-red-500" },
  cancelled: { bg: "bg-red-50", text: "text-red-600", dot: "bg-red-400" },
  confirmed: { bg: "bg-emerald-50", text: "text-emerald-700", dot: "bg-emerald-500" },
  pending: { bg: "bg-amber-50", text: "text-amber-700", dot: "bg-amber-500" },
  completed: { bg: "bg-emerald-50", text: "text-emerald-700", dot: "bg-emerald-500" },
  accepted: { bg: "bg-emerald-50", text: "text-emerald-700", dot: "bg-emerald-500" },
  declined: { bg: "bg-red-50", text: "text-red-700", dot: "bg-red-500" },
  expired: { bg: "bg-gray-50", text: "text-gray-600", dot: "bg-gray-400" },
  open: { bg: "bg-blue-50", text: "text-blue-700", dot: "bg-blue-500" },
  "in-progress": { bg: "bg-amber-50", text: "text-amber-700", dot: "bg-amber-500" },
  "not-started": { bg: "bg-gray-50", text: "text-gray-600", dot: "bg-gray-400" },
  review: { bg: "bg-purple-50", text: "text-purple-700", dot: "bg-purple-500" },
  waiting: { bg: "bg-orange-50", text: "text-orange-700", dot: "bg-orange-500" },
  resolved: { bg: "bg-emerald-50", text: "text-emerald-700", dot: "bg-emerald-500" },
  closed: { bg: "bg-gray-50", text: "text-gray-600", dot: "bg-gray-400" },
  scheduled: { bg: "bg-blue-50", text: "text-blue-700", dot: "bg-blue-500" },
};

const DEFAULT = { bg: "bg-gray-50", text: "text-gray-600", dot: "bg-gray-400" };

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
