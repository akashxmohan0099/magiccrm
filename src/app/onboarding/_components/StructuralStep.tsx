"use client";

import type { StructuralQuestion } from "@/lib/onboarding-v2";
import { PillOption } from "./PillOption";

export function StructuralStep({
  questions,
  values,
  onSelect,
}: {
  questions: StructuralQuestion[];
  values: Record<string, string>;
  onSelect: (key: string, value: string) => void;
}) {
  return (
    <div>
      <h2 className="text-[22px] font-bold text-foreground text-center mb-1">
        How do you run it?
      </h2>
      <p className="text-[13px] text-text-secondary text-center mb-8">
        Quick basics so we can shape the rest
      </p>
      <div className="space-y-7">
        {questions.map((q, qi) => (
          <div key={q.id}>
            <p className="text-[13px] font-semibold text-foreground text-center mb-3">
              {q.title}
            </p>
            <div className="space-y-2">
              {q.options.map((opt, oi) => (
                <PillOption
                  key={opt.value}
                  index={qi * 3 + oi}
                  label={opt.label}
                  selected={values[q.id] === opt.value}
                  onClick={() => onSelect(q.id, opt.value)}
                />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
