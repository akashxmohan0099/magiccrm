"use client";

import type { FormState } from "./types";

const smallInputClass =
  "w-full px-3 py-2 bg-surface border border-border-light rounded-lg text-[13px] text-foreground placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/30";

/**
 * Duration block — single duration field, OR split into
 * active-before / processing / active-after for services with hands-off
 * downtime (color processing, peels, etc). The `durationSplit` flag picks
 * which UI surface to show; the parent sums the three when split is on.
 */
export function DurationBlock({
  form,
  update,
  errors,
  totalSplitDuration,
}: {
  form: FormState;
  update: <K extends keyof FormState>(field: K, value: FormState[K]) => void;
  errors: Record<string, string>;
  totalSplitDuration: number;
}) {
  return (
    <div className="pt-5 border-t border-border-light">
      <div className="flex items-center justify-between mb-3">
        <p className="text-[11px] font-semibold text-text-tertiary uppercase tracking-wider">
          Duration
        </p>
        <label className="flex items-center gap-1.5 text-[11px] text-text-secondary cursor-pointer">
          <input
            type="checkbox"
            checked={form.durationSplit}
            onChange={(e) => update("durationSplit", e.target.checked)}
            className="rounded"
          />
          Split (active / processing / active)
        </label>
      </div>
      {!form.durationSplit ? (
        <div>
          <input
            type="number"
            min={5}
            step={5}
            value={form.duration}
            onChange={(e) => update("duration", e.target.value)}
            placeholder="60"
            className={smallInputClass}
          />
          <p className="text-[11px] text-text-tertiary mt-1.5">
            Total time the chair is occupied.
          </p>
          {errors.duration && (
            <p className="text-[11px] text-red-500 mt-1.5">{errors.duration}</p>
          )}
        </div>
      ) : (
        <div>
          <div className="grid grid-cols-3 gap-2">
            <div>
              <label className="text-[10px] text-text-tertiary block mb-1">Active before</label>
              <input
                type="number"
                min={0}
                step={5}
                value={form.durationActiveBefore}
                onChange={(e) => update("durationActiveBefore", e.target.value)}
                placeholder="0"
                className={smallInputClass}
              />
            </div>
            <div>
              <label className="text-[10px] text-text-tertiary block mb-1">Processing</label>
              <input
                type="number"
                min={0}
                step={5}
                value={form.durationProcessing}
                onChange={(e) => update("durationProcessing", e.target.value)}
                placeholder="0"
                className={smallInputClass}
              />
            </div>
            <div>
              <label className="text-[10px] text-text-tertiary block mb-1">Active after</label>
              <input
                type="number"
                min={0}
                step={5}
                value={form.durationActiveAfter}
                onChange={(e) => update("durationActiveAfter", e.target.value)}
                placeholder="0"
                className={smallInputClass}
              />
            </div>
          </div>
          <p className="text-[11px] text-text-tertiary mt-2">
            Chair is occupied for {totalSplitDuration} min total. Processing time is bookable for short services in someone else&apos;s gap.
          </p>
          {errors.duration && (
            <p className="text-[11px] text-red-500 mt-1.5">{errors.duration}</p>
          )}
        </div>
      )}
    </div>
  );
}
