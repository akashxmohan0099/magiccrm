"use client";

import type { FormState } from "./types";
import { Section } from "./Section";

const inputClass =
  "w-full px-3.5 py-2.5 bg-surface border border-border-light rounded-xl text-sm text-foreground placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/30";
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
    form.promoStart ||
    form.promoEnd
  );

  return (
    <Section
      title="Marketing"
      defaultOpen={hasMarketing}
      subtitle="Tags, featured pin, and promo pricing"
    >
      <div className="space-y-4">
        <div>
          <label className="text-[13px] font-medium text-foreground block mb-1.5">Tags</label>
          <input
            type="text"
            value={form.tagsRaw}
            onChange={(e) => update("tagsRaw", e.target.value)}
            placeholder="color, mens, vegan, kids…"
            className={inputClass}
          />
          <p className="text-[11px] text-text-tertiary mt-1.5">
            Comma-separated. Become filter chips on the public booking page.
          </p>
        </div>

        <div className="pt-3 border-t border-border-light">
          <div className="flex items-center justify-between mb-2">
            <label className="text-[13px] font-medium text-foreground">Featured & promo</label>
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
              <label className="text-[11px] text-text-tertiary block mb-1">Promo label</label>
              <input
                type="text"
                value={form.promoLabel}
                onChange={(e) => update("promoLabel", e.target.value)}
                placeholder="Today's offer / 20% off / New"
                className={smallInputClass}
              />
            </div>
            <div className="grid grid-cols-3 gap-2">
              <div>
                <label className="text-[11px] text-text-tertiary block mb-1">Promo price ($)</label>
                <input
                  type="number"
                  min={0}
                  value={form.promoPrice}
                  onChange={(e) => update("promoPrice", e.target.value)}
                  placeholder="Optional"
                  className={smallInputClass}
                />
              </div>
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
              Promo price strikes through the original. Outside the date range, everything reverts.
            </p>
          </div>
        </div>
      </div>
    </Section>
  );
}
