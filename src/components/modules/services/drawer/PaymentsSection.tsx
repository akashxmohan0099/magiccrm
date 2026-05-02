"use client";

import type { DepositAppliesTo } from "@/types/models";
import type { FormState } from "./types";
import { Section } from "./Section";
import { InfoHint } from "@/components/ui/InfoHint";

const smallInputClass =
  "w-full px-3 py-2 bg-surface border border-border-light rounded-lg text-[13px] text-foreground placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/30";

export function PaymentsSection({
  form,
  update,
}: {
  form: FormState;
  update: <K extends keyof FormState>(field: K, value: FormState[K]) => void;
}) {
  const hasData =
    form.requiresCardOnFile ||
    (form.depositType && form.depositType !== "none") ||
    !!form.cancellationWindowHours ||
    !!form.cancellationFee;

  return (
    <Section
      title="Payments & cancellation"
      defaultOpen={hasData}
      subtitle="Card on file, deposits, no-shows & cancellation fees"
    >
      <label className="flex items-center gap-2 text-[13px] text-text-secondary cursor-pointer mb-5">
        <input
          type="checkbox"
          checked={form.requiresCardOnFile}
          onChange={(e) => update("requiresCardOnFile", e.target.checked)}
          className="rounded"
        />
        Require a card on file before booking
        <InfoHint text="The booking page collects the client's card via Stripe SetupIntent before submitting. Used to charge no-show or late-cancel fees later." />
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
        <div className="grid grid-cols-3 gap-2 mb-5">
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
            <label className="text-[11px] text-text-tertiary mb-1 flex items-center gap-1">
              No-show fee (%)
              <InfoHint text="Charged when the client doesn't turn up at all. Different from the late-cancel fee below — that one fires when they cancel inside the window. Both can coexist." />
            </label>
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
            <label className="text-[11px] text-text-tertiary mb-1 flex items-center gap-1">
              Auto-cancel (hrs)
              <InfoHint align="right" text="System cancels the booking automatically if the deposit isn't paid within this many hours. Empty / Off = the booking just sits unpaid until you act on it." />
            </label>
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

      <p className="text-[11px] font-semibold text-text-tertiary uppercase tracking-wider mt-4 mb-2">
        Cancellation
      </p>
      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="text-[11px] text-text-tertiary mb-1 flex items-center gap-1">
            Window (hrs)
            <InfoHint text="How many hours before the booking the client can still cancel for free. Cancelling inside this window triggers the fee on the right." />
          </label>
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
          <label className="text-[11px] text-text-tertiary mb-1 flex items-center gap-1">
            Fee inside window (%)
            <InfoHint align="right" text="Charged when the client cancels inside the window. Different from the no-show fee above — that one fires when they don't show up at all." />
          </label>
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
