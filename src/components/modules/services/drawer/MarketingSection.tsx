"use client";

import type { FormState } from "./types";
import { Section } from "./Section";

const smallInputClass =
  "w-full px-3 py-2 bg-surface border border-border-light rounded-lg text-[13px] text-foreground placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/30";

export function MarketingSection({
  form,
  update,
}: {
  form: FormState;
  update: <K extends keyof FormState>(field: K, value: FormState[K]) => void;
}) {
  // Default-open when any field has a value — operators land on what they've
  // already configured rather than a collapsed empty card.
  const hasMarketing = !!(
    form.featured ||
    form.tagsRaw.trim() ||
    form.promoLabel.trim() ||
    form.promoPrice ||
    form.promoPercent ||
    form.promoStart ||
    form.promoEnd
  );

  // Switching discount type clears the other side so saved state matches the
  // chosen mode (and the menu doesn't pick up a stale value via the both-set
  // tiebreak in displayPrice).
  const setPromoType = (next: FormState["promoType"]) => {
    if (next === form.promoType) return;
    update("promoType", next);
    if (next === "percent") update("promoPrice", "");
    else update("promoPercent", "");
  };

  return (
    <Section
      title="Marketing"
      defaultOpen={hasMarketing}
      subtitle="Tags, featured pin & promo pricing"
    >
      <div className="space-y-4">
        <div>
          <label className="text-[11px] text-text-tertiary block mb-1">Tags</label>
          <input
            type="text"
            value={form.tagsRaw}
            onChange={(e) => update("tagsRaw", e.target.value)}
            placeholder="color, mens, vegan, kids…"
            className={smallInputClass}
          />
          <p className="text-[11px] text-text-tertiary mt-1.5">
            Comma-separated. Become filter chips on the public booking page.
          </p>
        </div>

        <div className="pt-3 border-t border-border-light">
          <div className="flex items-center justify-between mb-2">
            <p className="text-[11px] font-semibold text-text-tertiary uppercase tracking-wider">
              Featured &amp; promo
            </p>
            <label className="flex items-center gap-1.5 text-[12px] text-text-secondary cursor-pointer">
              <input
                type="checkbox"
                checked={form.featured}
                onChange={(e) => update("featured", e.target.checked)}
                className="rounded"
              />
              Pin to top
            </label>
          </div>
          <div className="space-y-3">
            <div>
              <label className="text-[11px] text-text-tertiary block mb-1">Label</label>
              <input
                type="text"
                value={form.promoLabel}
                onChange={(e) => update("promoLabel", e.target.value)}
                placeholder="Today's offer / 20% off / New"
                className={smallInputClass}
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[11px] text-text-tertiary block mb-1">Discount</label>
                <select
                  value={form.promoType}
                  onChange={(e) => setPromoType(e.target.value as FormState["promoType"])}
                  className={smallInputClass}
                >
                  <option value="fixed">Fixed price ($)</option>
                  <option value="percent">% off</option>
                </select>
              </div>
              <div>
                <label className="text-[11px] text-text-tertiary block mb-1">
                  {form.promoType === "percent" ? "Amount (%)" : "Amount ($)"}
                </label>
                {form.promoType === "percent" ? (
                  <input
                    type="number"
                    min={0}
                    max={100}
                    value={form.promoPercent}
                    onChange={(e) => update("promoPercent", e.target.value)}
                    placeholder="20"
                    className={smallInputClass}
                  />
                ) : (
                  <input
                    type="number"
                    min={0}
                    value={form.promoPrice}
                    onChange={(e) => update("promoPrice", e.target.value)}
                    placeholder="Optional"
                    className={smallInputClass}
                  />
                )}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[11px] text-text-tertiary block mb-1">Starts</label>
                <input
                  type="date"
                  value={form.promoStart}
                  onChange={(e) => update("promoStart", e.target.value)}
                  className={smallInputClass}
                />
              </div>
              <div>
                <label className="text-[11px] text-text-tertiary block mb-1">Ends</label>
                <input
                  type="date"
                  value={form.promoEnd}
                  onChange={(e) => update("promoEnd", e.target.value)}
                  className={smallInputClass}
                />
              </div>
            </div>
            <p className="text-[11px] text-text-tertiary">
              Promo strikes through the original. Outside the date range, everything reverts.
            </p>
          </div>
        </div>
      </div>
    </Section>
  );
}
