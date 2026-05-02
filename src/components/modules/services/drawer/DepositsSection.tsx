"use client";

import type { DepositAppliesTo } from "@/types/models";
import type { FormState } from "./types";
import { Section } from "./Section";

const smallInputClass =
  "w-full px-3 py-2 bg-surface border border-border-light rounded-lg text-[13px] text-foreground placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/30";

export function DepositsSection({
  form,
  update,
}: {
  form: FormState;
  update: <K extends keyof FormState>(field: K, value: FormState[K]) => void;
}) {
  const hasData =
    form.requiresCardOnFile ||
    (form.depositType && form.depositType !== "none");

  return (
    <Section
      title="Deposits & payments"
      defaultOpen={hasData}
      subtitle="Card on file, deposit type & amount, no-show handling"
    >
      <label className="flex items-center gap-2 text-[13px] text-text-secondary cursor-pointer mb-5">
        <input
          type="checkbox"
          checked={form.requiresCardOnFile}
          onChange={(e) => update("requiresCardOnFile", e.target.checked)}
          className="rounded"
        />
        Require a card on file before booking
      </label>

      <p className="text-[11px] font-semibold text-text-tertiary uppercase tracking-wider mb-2">
        Deposit
      </p>
      <div className="grid grid-cols-2 gap-2 mb-3">
        <div>
          <label className="text-[11px] text-text-tertiary block mb-1">Type</label>
          <select
            value={form.depositType}
            onChange={(e) =>
              update("depositType", e.target.value as FormState["depositType"])
            }
            className={smallInputClass}
          >
            <option value="none">No deposit</option>
            <option value="percentage">Percentage</option>
            <option value="fixed">Fixed amount</option>
          </select>
        </div>
        <div>
          <label className="text-[11px] text-text-tertiary block mb-1">Amount</label>
          <input
            type="number"
            min={0}
            value={form.depositAmount}
            onChange={(e) => update("depositAmount", e.target.value)}
            placeholder="0"
            disabled={form.depositType === "none"}
            className={smallInputClass}
          />
        </div>
      </div>
      {form.depositType !== "none" && (
        <div className="grid grid-cols-3 gap-2">
          <div>
            <label className="text-[11px] text-text-tertiary block mb-1">Applies to</label>
            <select
              value={form.depositAppliesTo}
              onChange={(e) =>
                update("depositAppliesTo", e.target.value as DepositAppliesTo)
              }
              className={smallInputClass}
            >
              <option value="all">Everyone</option>
              <option value="new">New clients only</option>
              <option value="flagged">Flagged clients only</option>
            </select>
          </div>
          <div>
            <label className="text-[11px] text-text-tertiary block mb-1">No-show fee (%)</label>
            <input
              type="number"
              min={0}
              max={100}
              value={form.depositNoShowFee}
              onChange={(e) => update("depositNoShowFee", e.target.value)}
              placeholder="0"
              className={smallInputClass}
            />
          </div>
          <div>
            <label className="text-[11px] text-text-tertiary block mb-1">Auto-cancel (hrs)</label>
            <input
              type="number"
              min={0}
              value={form.depositAutoCancelHours}
              onChange={(e) => update("depositAutoCancelHours", e.target.value)}
              placeholder="Off"
              className={smallInputClass}
            />
          </div>
        </div>
      )}
    </Section>
  );
}
