"use client";

import { Check } from "lucide-react";

export function AddonRow({
  addon,
  selected,
  onToggle,
  primaryColor,
}: {
  addon: { id: string; name: string; price: number; duration: number };
  selected: boolean;
  onToggle: () => void;
  primaryColor: string;
}) {
  return (
    <button
      onClick={onToggle}
      className={`w-full border rounded-2xl px-4 py-3 flex items-center gap-3 text-left cursor-pointer transition-colors ${
        selected
          ? "bg-card-bg"
          : "bg-surface border-border-light hover:border-foreground/20"
      }`}
      style={selected ? { borderColor: primaryColor, borderWidth: 2 } : undefined}
    >
      <div
        className={`w-5 h-5 rounded-md border-2 flex items-center justify-center flex-shrink-0 ${
          selected ? "" : "border-border-light"
        }`}
        style={selected ? { borderColor: primaryColor, backgroundColor: primaryColor } : undefined}
      >
        {selected && <Check className="w-3 h-3 text-white" />}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[14px] font-semibold text-foreground truncate">{addon.name}</p>
        <p className="text-[11px] text-text-tertiary tabular-nums">
          +${addon.price} · +{addon.duration} min
        </p>
      </div>
    </button>
  );
}
