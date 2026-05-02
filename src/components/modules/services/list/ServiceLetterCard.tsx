"use client";

import { categorySoftColor, UNCATEGORIZED } from "./category-colors";

export function ServiceLetterCard({ name, category }: { name: string; category?: string }) {
  const initial = (name || "?").trim().charAt(0).toUpperCase();
  const bg = categorySoftColor(category || UNCATEGORIZED);
  return (
    <div
      className="w-9 h-9 rounded-lg flex items-center justify-center text-[13px] font-semibold text-foreground/70 flex-shrink-0"
      style={{ backgroundColor: bg }}
      aria-hidden
    >
      {initial}
    </div>
  );
}
