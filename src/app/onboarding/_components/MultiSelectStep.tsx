"use client";

import type { MultiOption } from "@/lib/onboarding-v2";
import { PillOption } from "./PillOption";

export function MultiSelectStep({
  title,
  options,
  selectedIds,
  onToggle,
}: {
  title: string;
  options: MultiOption[];
  selectedIds: string[];
  onToggle: (id: string) => void;
}) {
  return (
    <div>
      <h2 className="text-[22px] font-bold text-foreground text-center mb-1">
        {title}
      </h2>
      <p className="text-[13px] text-text-secondary text-center mb-8">
        Select all that apply
      </p>
      <div className="space-y-2">
        {options.map((opt, i) => (
          <PillOption
            key={opt.id}
            index={i}
            label={opt.label}
            selected={selectedIds.includes(opt.id)}
            onClick={() => onToggle(opt.id)}
          />
        ))}
      </div>
    </div>
  );
}
