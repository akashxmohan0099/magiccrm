"use client";

import { Plus, Trash2, Check } from "lucide-react";
import type { ServicePriceType, TeamMember } from "@/types/models";
import { useMoney } from "@/lib/format/money";
import { generateId } from "@/lib/id";
import type { FormState, VariantInput, TierInput } from "./types";

const smallInputClass =
  "w-full px-3 py-2 bg-surface border border-border-light rounded-lg text-[13px] text-foreground placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/30";

/**
 * Pricing block — price-type picker (fixed/from/variants/tiered) plus the
 * variant table (rows with price + duration) or tier table (rows with
 * price + duration + member assignment).
 *
 * State is the parent's `form`, mutated through `update` for scalar fields
 * and `setForm` for the array helpers (variants/tiers). `activeMembers`
 * comes through so the tier picker can show member chips.
 */
export function PricingBlock({
  form,
  update,
  setForm,
  errors,
  activeMembers,
}: {
  form: FormState;
  update: <K extends keyof FormState>(field: K, value: FormState[K]) => void;
  setForm: React.Dispatch<React.SetStateAction<FormState>>;
  errors: Record<string, string>;
  activeMembers: TeamMember[];
}) {
  const money = useMoney();

  const setPriceType = (next: ServicePriceType) => update("priceType", next);

  // ── Variants ──
  const addVariant = () =>
    setForm((p) => ({
      ...p,
      variants: [
        ...p.variants,
        { id: generateId(), name: "", price: "", duration: p.duration || "60" },
      ],
    }));
  const updateVariant = (id: string, patch: Partial<VariantInput>) =>
    setForm((p) => ({
      ...p,
      variants: p.variants.map((v) => (v.id === id ? { ...v, ...patch } : v)),
    }));
  const removeVariant = (id: string) =>
    setForm((p) => ({ ...p, variants: p.variants.filter((v) => v.id !== id) }));

  // ── Tiers ──
  const addTier = () =>
    setForm((p) => ({
      ...p,
      priceTiers: [
        ...p.priceTiers,
        { id: generateId(), name: "", price: "", duration: "", memberIds: [] },
      ],
    }));
  const updateTier = (id: string, patch: Partial<TierInput>) =>
    setForm((p) => ({
      ...p,
      priceTiers: p.priceTiers.map((t) => (t.id === id ? { ...t, ...patch } : t)),
    }));
  const removeTier = (id: string) =>
    setForm((p) => ({ ...p, priceTiers: p.priceTiers.filter((t) => t.id !== id) }));
  const toggleTierMember = (tierId: string, memberId: string) => {
    setForm((p) => ({
      ...p,
      priceTiers: p.priceTiers.map((t) =>
        t.id === tierId
          ? {
              ...t,
              memberIds: t.memberIds.includes(memberId)
                ? t.memberIds.filter((id) => id !== memberId)
                : [...t.memberIds, memberId],
            }
          : t,
      ),
    }));
  };

  return (
    <div className="pt-5 border-t border-border-light">
      <p className="text-[11px] font-semibold text-text-tertiary uppercase tracking-wider mb-3">
        Pricing
      </p>
      <div className="space-y-4">
        {/* Price type picker */}
        <div className="grid grid-cols-2 gap-2">
          {(
            [
              { id: "fixed", label: "Fixed", hint: "One price" },
              { id: "from", label: "From", hint: "“From $X”" },
              { id: "variants", label: "Variants", hint: "Short / Medium / Long" },
              { id: "tiered", label: "Tiered", hint: "Per-artist tier" },
            ] as { id: ServicePriceType; label: string; hint: string }[]
          ).map((opt) => {
            const active = form.priceType === opt.id;
            return (
              <button
                key={opt.id}
                type="button"
                onClick={() => setPriceType(opt.id)}
                className={`text-left rounded-lg border px-3 py-2 cursor-pointer transition-all ${
                  active
                    ? "border-primary ring-2 ring-primary/20 bg-primary/5"
                    : "border-border-light hover:border-text-tertiary bg-card-bg"
                }`}
              >
                <p className="text-[12px] font-semibold text-foreground">{opt.label}</p>
                <p className="text-[11px] text-text-tertiary leading-snug">{opt.hint}</p>
              </button>
            );
          })}
        </div>

        {/* Base price — for fixed/from, this is THE price; for variants/tiered, it's a fallback anchor */}
        {(form.priceType === "fixed" || form.priceType === "from") && (
          <div>
            <label className="text-[11px] text-text-tertiary block mb-1">
              {form.priceType === "from" ? "Starting price ($)" : "Price ($)"}
            </label>
            <input
              type="number"
              min={0}
              value={form.price}
              onChange={(e) => update("price", e.target.value)}
              placeholder="0"
              className={smallInputClass}
            />
            {form.priceType === "from" && (
              <p className="text-[11px] text-text-tertiary mt-1">
                Menu shows “From ${form.price || "X"}”. You confirm the exact price after booking.
              </p>
            )}
          </div>
        )}

        {/* Variants table */}
        {form.priceType === "variants" && (
          <div>
            <label className="text-[11px] text-text-tertiary block mb-2">
              Variants — client picks one when booking
            </label>
            <div className="space-y-2">
              {form.variants.length > 0 && (
                <div className="grid grid-cols-[1fr_80px_80px_auto] gap-2 px-0.5 text-[10px] font-semibold text-text-tertiary uppercase tracking-wider">
                  <span>Name</span>
                  <span>Price ({money.symbol()})</span>
                  <span>Duration (min)</span>
                  <span />
                </div>
              )}
              {form.variants.map((v) => (
                <div
                  key={v.id}
                  className="grid grid-cols-[1fr_80px_80px_auto] gap-2 items-center"
                >
                  <input
                    type="text"
                    value={v.name}
                    onChange={(e) => updateVariant(v.id, { name: e.target.value })}
                    placeholder="e.g. Short"
                    className={smallInputClass}
                  />
                  <input
                    type="number"
                    min={0}
                    value={v.price}
                    onChange={(e) => updateVariant(v.id, { price: e.target.value })}
                    placeholder="$"
                    className={smallInputClass}
                  />
                  <input
                    type="number"
                    min={5}
                    step={5}
                    value={v.duration}
                    onChange={(e) => updateVariant(v.id, { duration: e.target.value })}
                    placeholder="min"
                    className={smallInputClass}
                  />
                  <button
                    type="button"
                    onClick={() => removeVariant(v.id)}
                    className="p-1.5 text-text-tertiary hover:text-red-500 cursor-pointer"
                    title="Remove"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
              <button
                type="button"
                onClick={addVariant}
                className="flex items-center gap-1.5 text-[12px] font-medium text-primary hover:underline cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" /> Add variant
              </button>
            </div>
            {errors.variants && (
              <p className="text-[11px] text-red-500 mt-1.5">{errors.variants}</p>
            )}
            <p className="text-[11px] text-text-tertiary mt-2">
              Menu shows “From $
              {form.variants.length > 0
                ? Math.min(...form.variants.map((v) => Number(v.price) || 0))
                : "X"}
              ”. Each variant has its own price and duration.
            </p>
          </div>
        )}

        {/* Tiered pricing */}
        {form.priceType === "tiered" && (
          <div>
            <label className="text-[11px] text-text-tertiary block mb-2">
              Pricing tiers — assign artists to a tier; they charge that price (and optionally take a different time)
            </label>
            <div className="space-y-3">
              {form.priceTiers.length > 0 && (
                <div className="grid grid-cols-[1fr_80px_80px_auto] gap-2 px-3.5 text-[10px] font-semibold text-text-tertiary uppercase tracking-wider">
                  <span>Tier name</span>
                  <span>Price ({money.symbol()})</span>
                  <span>Duration (min)</span>
                  <span />
                </div>
              )}
              {form.priceTiers.map((t) => (
                <div
                  key={t.id}
                  className="bg-card-bg border border-border-light rounded-lg p-3 space-y-2"
                >
                  <div className="grid grid-cols-[1fr_80px_80px_auto] gap-2 items-center">
                    <input
                      type="text"
                      value={t.name}
                      onChange={(e) => updateTier(t.id, { name: e.target.value })}
                      placeholder="e.g. Senior"
                      className={smallInputClass}
                    />
                    <input
                      type="number"
                      min={0}
                      value={t.price}
                      onChange={(e) => updateTier(t.id, { price: e.target.value })}
                      placeholder="$"
                      className={smallInputClass}
                    />
                    <input
                      type="number"
                      min={0}
                      step={5}
                      value={t.duration}
                      onChange={(e) => updateTier(t.id, { duration: e.target.value })}
                      placeholder="min"
                      title="Override duration for this tier (empty = use base)"
                      className={smallInputClass}
                    />
                    <button
                      type="button"
                      onClick={() => removeTier(t.id)}
                      className="p-1.5 text-text-tertiary hover:text-red-500 cursor-pointer"
                      title="Remove"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  {activeMembers.length > 0 && (
                    <div className="flex flex-wrap gap-1.5">
                      {activeMembers.map((m) => {
                        const inTier = t.memberIds.includes(m.id);
                        return (
                          <button
                            key={m.id}
                            type="button"
                            onClick={() => toggleTierMember(t.id, m.id)}
                            className={`px-2.5 py-1 rounded-md text-[11px] font-medium border cursor-pointer transition-colors ${
                              inTier
                                ? "bg-primary text-white border-primary"
                                : "bg-surface text-text-secondary border-border-light hover:text-foreground"
                            }`}
                          >
                            {inTier && <Check className="w-3 h-3 inline mr-0.5" />}
                            {m.name}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              ))}
              <button
                type="button"
                onClick={addTier}
                className="flex items-center gap-1.5 text-[12px] font-medium text-primary hover:underline cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" /> Add tier
              </button>
            </div>
            {errors.tiers && (
              <p className="text-[11px] text-red-500 mt-1.5">{errors.tiers}</p>
            )}
            <p className="text-[11px] text-text-tertiary mt-2">
              Menu shows the lowest tier as “From $X”. Cart updates to the artist&apos;s tier when picked. Leave duration blank to inherit the base duration.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
