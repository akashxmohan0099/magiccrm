"use client";

import type { FormState } from "./types";
import { Section } from "./Section";

const smallInputClass =
  "w-full px-3 py-2 bg-surface border border-border-light rounded-lg text-[13px] text-foreground placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/30";

export function CancellationSection({
  form,
  update,
}: {
  form: FormState;
  update: <K extends keyof FormState>(field: K, value: FormState[K]) => void;
}) {
  const hasData = !!(form.cancellationWindowHours || form.cancellationFee);

  return (
    <Section
      title="Cancellation"
      defaultOpen={hasData}
      subtitle="Window before the booking and fee inside it"
    >
      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="text-[11px] text-text-tertiary block mb-1">Window (hrs)</label>
          <input
            type="number"
            min={0}
            value={form.cancellationWindowHours}
            onChange={(e) => update("cancellationWindowHours", e.target.value)}
            placeholder="Default"
            className={smallInputClass}
          />
        </div>
        <div>
          <label className="text-[11px] text-text-tertiary block mb-1">Fee inside window (%)</label>
          <input
            type="number"
            min={0}
            max={100}
            value={form.cancellationFee}
            onChange={(e) => update("cancellationFee", e.target.value)}
            placeholder="0"
            className={smallInputClass}
          />
        </div>
      </div>
    </Section>
  );
}
