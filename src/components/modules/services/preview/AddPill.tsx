"use client";

import { Check, Plus } from "lucide-react";

export function AddPill({ selected, primaryColor }: { selected: boolean; primaryColor: string }) {
  if (selected) {
    return (
      <span
        className="flex items-center gap-1 px-3.5 py-1.5 rounded-full text-[12px] font-semibold text-white shadow-[0_4px_12px_-4px_rgba(0,0,0,0.18)]"
        style={{
          backgroundImage: `linear-gradient(135deg, ${primaryColor} 0%, ${primaryColor}dd 100%)`,
        }}
      >
        <Check className="w-3 h-3" /> Added
      </span>
    );
  }
  return (
    <span
      className="flex items-center gap-1 px-3.5 py-1.5 rounded-full text-[12px] font-semibold border bg-card-bg"
      style={{ borderColor: `${primaryColor}66`, color: primaryColor }}
    >
      <Plus className="w-3 h-3" /> Add
    </span>
  );
}
