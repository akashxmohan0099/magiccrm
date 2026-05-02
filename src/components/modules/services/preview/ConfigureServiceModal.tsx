"use client";

import { useState } from "react";
import { X } from "lucide-react";
import type { Service } from "@/types/models";
import { AddonRow } from "./AddonRow";

export function ConfigureServiceModal({
  service,
  primaryColor,
  onCancel,
  onAdd,
}: {
  service: Service;
  primaryColor: string;
  onCancel: () => void;
  onAdd: (variantId: string | undefined, addonIds: string[]) => void;
}) {
  const variants = service.variants ?? [];
  const addons = service.addons ?? [];
  const addonGroups = service.addonGroups ?? [];
  const hasVariants = variants.length > 0 && service.priceType === "variants";
  const hasAddons = addons.length > 0;

  const [variantId, setVariantId] = useState<string | undefined>(undefined);
  const [addonIds, setAddonIds] = useState<string[]>([]);

  const variantPrice = variants.find((v) => v.id === variantId)?.price ?? service.price;
  const variantDuration = variants.find((v) => v.id === variantId)?.duration ?? service.duration;
  const addonPriceTotal = addons
    .filter((a) => addonIds.includes(a.id))
    .reduce((s, a) => s + a.price, 0);
  const addonDurationTotal = addons
    .filter((a) => addonIds.includes(a.id))
    .reduce((s, a) => s + a.duration, 0);
  const totalPrice = variantPrice + addonPriceTotal;
  const totalDuration = variantDuration + addonDurationTotal;

  // Group enforcement: each group's selected count must satisfy minSelect.
  // The picker also blocks selections that would exceed maxSelect (handled in
  // the per-row click handler so the user gets visual feedback rather than
  // mysterious Add-button greying).
  const groupCounts = new Map<string, number>();
  for (const a of addons) {
    if (!a.groupId || !addonIds.includes(a.id)) continue;
    groupCounts.set(a.groupId, (groupCounts.get(a.groupId) ?? 0) + 1);
  }
  const failingGroups = addonGroups.filter(
    (g) => (groupCounts.get(g.id) ?? 0) < (g.minSelect ?? 0),
  );

  // The CTA is disabled until a variant is picked (when variants exist) AND
  // every required add-on group is satisfied.
  const canSubmit =
    (!hasVariants || variantId != null) && failingGroups.length === 0;

  const toggleAddon = (id: string) => {
    const a = addons.find((x) => x.id === id);
    if (!a) return;
    setAddonIds((prev) => {
      if (prev.includes(id)) return prev.filter((x) => x !== id);
      // Group max guard. When a group caps at N and the user picks an N+1th,
      // we either reject (max=1 → swap) or block (max>1 → no-op).
      if (a.groupId) {
        const group = addonGroups.find((g) => g.id === a.groupId);
        if (group?.maxSelect != null) {
          const currentInGroup = prev.filter((x) => {
            const candidate = addons.find((y) => y.id === x);
            return candidate?.groupId === a.groupId;
          });
          if (currentInGroup.length >= group.maxSelect) {
            // Single-pick groups feel like radios — replace prior selection.
            if (group.maxSelect === 1) {
              return [...prev.filter((x) => !currentInGroup.includes(x)), id];
            }
            return prev;
          }
        }
      }
      return [...prev, id];
    });
  };

  // Helpers for rendering: the addons that belong to a specific group, and
  // the addons that are ungrouped (rendered as a flat optional list).
  const addonsByGroup = (groupId: string) => addons.filter((a) => a.groupId === groupId);
  const ungroupedAddons = addons.filter((a) => !a.groupId);

  return (
    <div
      className="fixed inset-0 z-[90] bg-black/40 flex items-end sm:items-center justify-center"
      onClick={onCancel}
    >
      <div
        className="bg-card-bg rounded-t-3xl sm:rounded-3xl w-full sm:max-w-md max-h-[85vh] flex flex-col shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-5 pb-3">
          <div>
            <p className="text-[15px] font-bold text-foreground tracking-tight">
              {service.name}
            </p>
            {(hasVariants || hasAddons) && (
              <p className="text-[12px] text-text-tertiary">
                {hasVariants ? "Pick an option" : ""}
                {hasVariants && hasAddons ? " · " : ""}
                {hasAddons ? "add any extras" : ""}
              </p>
            )}
          </div>
          <button
            onClick={onCancel}
            className="p-1.5 rounded-lg hover:bg-surface text-text-secondary cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="px-5 overflow-y-auto flex-1 space-y-5">
          {hasVariants && (
            <div>
              <p className="text-[10px] font-semibold text-text-tertiary uppercase tracking-[0.1em] mb-2">
                Option
              </p>
              <div className="space-y-2">
                {variants.map((v) => {
                  const selected = variantId === v.id;
                  return (
                    <button
                      key={v.id}
                      onClick={() => setVariantId(v.id)}
                      className={`w-full border rounded-2xl px-4 py-3 flex items-center justify-between text-left cursor-pointer transition-colors ${
                        selected
                          ? "bg-card-bg"
                          : "bg-surface border-border-light hover:border-foreground/20"
                      }`}
                      style={selected ? { borderColor: primaryColor, borderWidth: 2 } : undefined}
                    >
                      <div>
                        <p className="text-[14px] font-semibold text-foreground">{v.name}</p>
                        <p className="text-[11px] text-text-tertiary tabular-nums">
                          {v.duration} min
                        </p>
                      </div>
                      <p
                        className="text-[15px] font-bold tabular-nums"
                        style={{ color: primaryColor }}
                      >
                        ${v.price}
                      </p>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {hasAddons && (
            <div className="space-y-5">
              {addonGroups.map((g) => {
                const groupAddons = addonsByGroup(g.id);
                if (groupAddons.length === 0) return null;
                const count = groupCounts.get(g.id) ?? 0;
                const min = g.minSelect ?? 0;
                const max = g.maxSelect;
                const failing = count < min;
                const ruleText =
                  min > 0 && max != null && min === max
                    ? `Pick ${min}`
                    : min > 0 && max != null
                      ? `Pick ${min}–${max}`
                      : min > 0
                        ? `Pick at least ${min}`
                        : max != null
                          ? `Pick up to ${max}`
                          : "Optional";
                return (
                  <div key={g.id}>
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-[10px] font-semibold text-text-tertiary uppercase tracking-[0.1em]">
                        {g.name}{" "}
                        <span
                          className={`normal-case font-medium tracking-normal ${
                            failing ? "text-red-500" : "text-text-tertiary"
                          }`}
                        >
                          · {ruleText}
                        </span>
                      </p>
                      <p className="text-[10px] text-text-tertiary tabular-nums">
                        {count}/{max ?? "∞"}
                      </p>
                    </div>
                    <div className="space-y-2">
                      {groupAddons.map((a) => (
                        <AddonRow
                          key={a.id}
                          addon={a}
                          selected={addonIds.includes(a.id)}
                          onToggle={() => toggleAddon(a.id)}
                          primaryColor={primaryColor}
                        />
                      ))}
                    </div>
                  </div>
                );
              })}

              {ungroupedAddons.length > 0 && (
                <div>
                  <p className="text-[10px] font-semibold text-text-tertiary uppercase tracking-[0.1em] mb-2">
                    Add-ons{" "}
                    <span className="text-text-tertiary normal-case font-normal tracking-normal">
                      (optional)
                    </span>
                  </p>
                  <div className="space-y-2">
                    {ungroupedAddons.map((a) => (
                      <AddonRow
                        key={a.id}
                        addon={a}
                        selected={addonIds.includes(a.id)}
                        onToggle={() => toggleAddon(a.id)}
                        primaryColor={primaryColor}
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Sticky footer with running total + Add CTA */}
        <div className="px-5 pt-3 pb-5 border-t border-border-light mt-3">
          <div className="flex items-center justify-between mb-3">
            <p className="text-[12px] text-text-tertiary tabular-nums">
              {totalDuration > 0 ? `${totalDuration} min · ` : ""}
              <span className="text-foreground font-semibold">${totalPrice}</span>
            </p>
          </div>
          <button
            onClick={() => onAdd(variantId, addonIds)}
            disabled={!canSubmit}
            className="w-full py-3 rounded-2xl text-[13px] font-semibold text-white cursor-pointer transition-opacity hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed"
            style={{
              backgroundImage: `linear-gradient(135deg, ${primaryColor} 0%, ${primaryColor}dd 100%)`,
            }}
          >
            {hasVariants && !variantId
              ? "Pick an option"
              : failingGroups.length > 0
                ? `Pick ${failingGroups[0].name}`
                : "Add to booking"}
          </button>
        </div>
      </div>
    </div>
  );
}
