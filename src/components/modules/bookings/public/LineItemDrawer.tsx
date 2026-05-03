"use client";

import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Check, Sparkles, Instagram, Globe, Facebook, AlertCircle } from "lucide-react";
import type { CartLineItem } from "@/store/booking-cart";
import type { PublicAddon, PublicAddonGroup, PublicMember, PublicPriceTier, PublicService, PublicVariant } from "./types";
import { computeLine, displayCardDuration, displayCardPrice, formatDuration, formatPrice } from "./helpers";

interface LineItemDrawerProps {
  open: boolean;
  onClose: () => void;
  service: PublicService | null;
  item: CartLineItem | null;
  /** Members eligible to perform this service. Empty list = anyone. */
  eligibleMembers: PublicMember[];
  onSave: (patch: { artistId?: string; variantId?: string; tierId?: string; addonIds: string[] }) => void;
  onRemove: () => void;
  /** ISO datetime of the picked slot — see CartPane.startAt for rationale. */
  startAt?: string | null;
}

/**
 * Per-line drawer. Phase 2: artist selection only. Phase 3 will add
 * variant / tier / addon pickers to this same drawer.
 */
export function LineItemDrawer({
  open,
  onClose,
  service,
  item,
  eligibleMembers,
  onSave,
  onRemove,
  startAt = null,
}: LineItemDrawerProps) {
  const [artistId, setArtistId] = useState<string | undefined>(item?.artistId);
  const [variantId, setVariantId] = useState<string | undefined>(item?.variantId);
  const [tierId, setTierId] = useState<string | undefined>(item?.tierId);
  const [addonIds, setAddonIds] = useState<string[]>(item?.addonIds ?? []);

  // Reset local state whenever the drawer is opened against a different line.
  const sessionKey = open ? item?.lineId ?? null : null;
  const [lastKey, setLastKey] = useState<string | null>(sessionKey);
  if (sessionKey !== lastKey) {
    setLastKey(sessionKey);
    setArtistId(item?.artistId);
    setVariantId(item?.variantId);
    setTierId(item?.tierId);
    setAddonIds(item?.addonIds ?? []);
  }

  const computed = useMemo(() => {
    if (!service) return null;
    return computeLine(service, { variantId, tierId, addonIds, startAt });
  }, [service, variantId, tierId, addonIds, startAt]);

  const handleSave = () => {
    onSave({ artistId, variantId, tierId, addonIds });
    onClose();
  };

  const toggleAddon = (id: string) => {
    setAddonIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  };

  const setRadioAddon = (groupId: string, id: string | null) => {
    if (!service) return;
    const inGroup = new Set(service.addons.filter((a) => a.groupId === groupId).map((a) => a.id));
    setAddonIds((prev) => {
      const cleared = prev.filter((x) => !inGroup.has(x));
      return id ? [...cleared, id] : cleared;
    });
  };

  return (
    <AnimatePresence>
      {open && service && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            className="fixed inset-0 bg-black/50 z-[110]"
            onClick={onClose}
          />
          <motion.aside
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 30, stiffness: 280 }}
            className="fixed right-0 top-0 bottom-0 z-[120] w-full sm:max-w-md bg-card-bg shadow-xl overflow-y-auto"
            role="dialog"
            aria-modal="true"
            aria-label={`Customize ${service.name}`}
          >
            <header className="sticky top-0 bg-card-bg border-b border-border-light px-5 py-4 flex items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="text-[11px] font-semibold text-text-tertiary uppercase tracking-wider">Customize</p>
                <h3 className="text-[16px] font-bold text-foreground truncate">{service.name}</h3>
              </div>
              <button
                type="button"
                onClick={onClose}
                aria-label="Close"
                className="p-1.5 rounded-lg text-text-tertiary hover:text-foreground hover:bg-surface cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </header>

            <div className="px-5 py-5 space-y-6">
              <div className="flex items-baseline justify-between text-[12px] text-text-tertiary">
                <span>
                  {/*
                   * Before the customer has resolved a variant/tier (computed
                   * is null), fall back to the lowest plausible duration/price
                   * — not the unused service.duration / service.price (which
                   * are 0 for variants/tiered services and would render
                   * "0 min · $0" until they pick).
                   */}
                  {computed
                    ? formatDuration(computed.duration)
                    : formatDuration(displayCardDuration(service))}
                </span>
                <span className="text-[14px] font-semibold text-foreground tabular-nums">
                  {computed
                    ? formatPrice(computed.price)
                    : formatPrice(displayCardPrice(service).price)}
                </span>
              </div>

              {service.priceType === "variants" && service.variants.length > 0 && (
                <VariantPicker variants={service.variants} value={variantId} onChange={setVariantId} />
              )}

              {service.priceType === "tiered" && service.priceTiers.length > 0 && (
                <TierPicker tiers={service.priceTiers} value={tierId} onChange={setTierId} />
              )}

              <ArtistPicker
                members={eligibleMembers}
                value={artistId}
                onChange={setArtistId}
              />

              <AddonsSection
                addons={service.addons}
                groups={service.addonGroups}
                selectedIds={addonIds}
                onToggle={toggleAddon}
                onRadio={setRadioAddon}
              />
            </div>

            <footer className="sticky bottom-0 bg-card-bg border-t border-border-light px-5 py-4 flex items-center gap-3">
              <button
                type="button"
                onClick={() => { onRemove(); onClose(); }}
                className="text-[13px] text-text-secondary hover:text-red-500 cursor-pointer"
              >
                Remove
              </button>
              {computed?.invalidReason && (
                <span className="flex items-center gap-1.5 text-[12px] text-amber-600">
                  <AlertCircle className="w-3.5 h-3.5" />
                  {computed.invalidReason}
                </span>
              )}
              <button
                type="button"
                onClick={handleSave}
                disabled={!computed?.isValid}
                className={`ml-auto px-5 py-2.5 rounded-full text-[13px] font-semibold transition-all ${
                  computed?.isValid
                    ? "bg-foreground text-background hover:opacity-90 cursor-pointer active:scale-[0.98]"
                    : "bg-surface text-text-tertiary cursor-not-allowed"
                }`}
              >
                Save
              </button>
            </footer>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}

function ArtistPicker({
  members,
  value,
  onChange,
}: {
  members: PublicMember[];
  value: string | undefined;
  onChange: (id: string | undefined) => void;
}) {
  return (
    <section>
      <p className="text-[12px] font-semibold text-text-tertiary uppercase tracking-wider mb-3">
        Who would you like?
      </p>

      <div className="space-y-2">
        <ArtistRow
          selected={!value}
          onClick={() => onChange(undefined)}
          left={
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
              <Sparkles className="w-4 h-4 text-primary" />
            </div>
          }
          title="Anyone available"
          subtitle="Pick whoever's free first"
        />

        {members.map((m) => (
          <ArtistRow
            key={m.id}
            selected={value === m.id}
            onClick={() => onChange(m.id)}
            left={
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center overflow-hidden flex-shrink-0">
                {m.avatarUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={m.avatarUrl} alt={m.name} className="w-full h-full object-cover" />
                ) : (
                  <span className="text-[12px] font-bold text-primary">
                    {m.name.split(" ").map((n) => n[0]).join("").slice(0, 2)}
                  </span>
                )}
              </div>
            }
            title={m.name}
            subtitle={m.bio || (m.role === "owner" ? "Owner" : "Stylist")}
            socials={m.socialLinks}
          />
        ))}
      </div>
    </section>
  );
}

function ArtistRow({
  selected,
  onClick,
  left,
  title,
  subtitle,
  socials,
}: {
  selected: boolean;
  onClick: () => void;
  left: React.ReactNode;
  title: string;
  subtitle?: string;
  socials?: Record<string, string>;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={selected}
      className={`w-full text-left flex items-start gap-3 p-3 rounded-xl border transition-all cursor-pointer ${
        selected
          ? "border-primary ring-2 ring-primary/20 bg-primary/5"
          : "border-border-light hover:border-foreground/15"
      }`}
    >
      {left}
      <div className="flex-1 min-w-0">
        <p className="text-[14px] font-semibold text-foreground leading-tight">{title}</p>
        {subtitle && (
          <p className="text-[12px] text-text-secondary mt-0.5 line-clamp-2">{subtitle}</p>
        )}
        {socials && (socials.instagram || socials.tiktok || socials.facebook || socials.website) && (
          <div className="flex items-center gap-2 mt-2 text-text-tertiary">
            {socials.instagram && <Instagram className="w-3.5 h-3.5" />}
            {socials.tiktok && (
              <svg viewBox="0 0 24 24" fill="currentColor" className="w-3.5 h-3.5" aria-hidden>
                <path d="M19.589 6.686a4.793 4.793 0 0 1-3.77-4.245V2h-3.445v13.672a2.896 2.896 0 0 1-5.201 1.743 2.896 2.896 0 0 1 2.305-4.638 2.91 2.91 0 0 1 .89.135V9.4a6.354 6.354 0 0 0-1-.083 6.34 6.34 0 0 0-3.486 11.643 6.337 6.337 0 0 0 9.823-5.291V8.687a8.182 8.182 0 0 0 4.773 1.526V6.79a4.83 4.83 0 0 1-.889-.104z" />
              </svg>
            )}
            {socials.facebook && <Facebook className="w-3.5 h-3.5" />}
            {socials.website && <Globe className="w-3.5 h-3.5" />}
          </div>
        )}
      </div>
      {selected && (
        <span className="w-6 h-6 rounded-full bg-primary text-white flex items-center justify-center flex-shrink-0">
          <Check className="w-3.5 h-3.5" strokeWidth={3} />
        </span>
      )}
    </button>
  );
}

// ── Variant picker ─────────────────────────────────────────────────

function VariantPicker({
  variants,
  value,
  onChange,
}: {
  variants: PublicVariant[];
  value: string | undefined;
  onChange: (id: string) => void;
}) {
  const sorted = [...variants].sort((a, b) => a.sortOrder - b.sortOrder);
  return (
    <section>
      <p className="text-[12px] font-semibold text-text-tertiary uppercase tracking-wider mb-3">Choose an option</p>
      <div className="grid grid-cols-1 gap-2">
        {sorted.map((v) => {
          const selected = value === v.id;
          return (
            <button
              key={v.id}
              type="button"
              onClick={() => onChange(v.id)}
              aria-pressed={selected}
              className={`flex items-center justify-between gap-3 p-3 rounded-xl border transition-all cursor-pointer text-left ${
                selected
                  ? "border-primary ring-2 ring-primary/20 bg-primary/5"
                  : "border-border-light hover:border-foreground/15"
              }`}
            >
              <div className="min-w-0">
                <p className="text-[14px] font-semibold text-foreground">{v.name}</p>
                <p className="text-[11px] text-text-tertiary mt-0.5">{formatDuration(v.duration)}</p>
              </div>
              <p className="text-[13px] font-semibold text-foreground tabular-nums">{formatPrice(v.price)}</p>
            </button>
          );
        })}
      </div>
    </section>
  );
}

// ── Tier picker ────────────────────────────────────────────────────

function TierPicker({
  tiers,
  value,
  onChange,
}: {
  tiers: PublicPriceTier[];
  value: string | undefined;
  onChange: (id: string) => void;
}) {
  const sorted = [...tiers].sort((a, b) => a.sortOrder - b.sortOrder);
  return (
    <section>
      <p className="text-[12px] font-semibold text-text-tertiary uppercase tracking-wider mb-3">Stylist level</p>
      <div className="grid grid-cols-1 gap-2">
        {sorted.map((t) => {
          const selected = value === t.id;
          return (
            <button
              key={t.id}
              type="button"
              onClick={() => onChange(t.id)}
              aria-pressed={selected}
              className={`flex items-center justify-between gap-3 p-3 rounded-xl border transition-all cursor-pointer text-left ${
                selected
                  ? "border-primary ring-2 ring-primary/20 bg-primary/5"
                  : "border-border-light hover:border-foreground/15"
              }`}
            >
              <div className="min-w-0">
                <p className="text-[14px] font-semibold text-foreground">{t.name}</p>
                {t.duration !== undefined && (
                  <p className="text-[11px] text-text-tertiary mt-0.5">{formatDuration(t.duration)}</p>
                )}
              </div>
              <p className="text-[13px] font-semibold text-foreground tabular-nums">{formatPrice(t.price)}</p>
            </button>
          );
        })}
      </div>
    </section>
  );
}

// ── Addons (grouped + ungrouped) ───────────────────────────────────

function AddonsSection({
  addons,
  groups,
  selectedIds,
  onToggle,
  onRadio,
}: {
  addons: PublicAddon[];
  groups: PublicAddonGroup[];
  selectedIds: string[];
  onToggle: (id: string) => void;
  onRadio: (groupId: string, id: string | null) => void;
}) {
  if (addons.length === 0) return null;

  const sortedGroups = [...groups].sort((a, b) => a.sortOrder - b.sortOrder);
  const ungrouped = addons.filter((a) => !a.groupId).sort((a, b) => a.sortOrder - b.sortOrder);

  return (
    <section className="space-y-5">
      {sortedGroups.map((g) => {
        const groupAddons = addons.filter((a) => a.groupId === g.id).sort((a, b) => a.sortOrder - b.sortOrder);
        if (groupAddons.length === 0) return null;
        const isRadio = g.minSelect === 1 && g.maxSelect === 1;
        const hint = formatGroupHint(g);
        const chosenInGroup = selectedIds.filter((id) => groupAddons.some((a) => a.id === id)).length;
        const atMax = g.maxSelect !== undefined && chosenInGroup >= g.maxSelect;

        return (
          <div key={g.id}>
            <div className="flex items-baseline justify-between mb-2">
              <p className="text-[12px] font-semibold text-text-tertiary uppercase tracking-wider">{g.name}</p>
              <p className="text-[11px] text-text-tertiary">{hint}</p>
            </div>
            <div className="grid grid-cols-1 gap-2">
              {groupAddons.map((a) => {
                const selected = selectedIds.includes(a.id);
                const disabled = !selected && !isRadio && atMax;
                return (
                  <AddonRow
                    key={a.id}
                    addon={a}
                    selected={selected}
                    disabled={disabled}
                    isRadio={isRadio}
                    onClick={() => {
                      if (disabled) return;
                      if (isRadio) onRadio(g.id, selected ? null : a.id);
                      else onToggle(a.id);
                    }}
                  />
                );
              })}
            </div>
          </div>
        );
      })}

      {ungrouped.length > 0 && (
        <div>
          <p className="text-[12px] font-semibold text-text-tertiary uppercase tracking-wider mb-2">
            Optional extras
          </p>
          <div className="grid grid-cols-1 gap-2">
            {ungrouped.map((a) => (
              <AddonRow
                key={a.id}
                addon={a}
                selected={selectedIds.includes(a.id)}
                disabled={false}
                isRadio={false}
                onClick={() => onToggle(a.id)}
              />
            ))}
          </div>
        </div>
      )}
    </section>
  );
}

function AddonRow({
  addon,
  selected,
  disabled,
  isRadio,
  onClick,
}: {
  addon: PublicAddon;
  selected: boolean;
  disabled: boolean;
  isRadio: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-pressed={selected}
      className={`flex items-center gap-3 p-3 rounded-xl border transition-all text-left ${
        selected
          ? "border-primary ring-2 ring-primary/20 bg-primary/5"
          : disabled
          ? "border-border-light opacity-50 cursor-not-allowed"
          : "border-border-light hover:border-foreground/15 cursor-pointer"
      }`}
    >
      <span
        className={`w-5 h-5 ${isRadio ? "rounded-full" : "rounded-md"} border-2 flex items-center justify-center flex-shrink-0 ${
          selected ? "bg-primary border-primary text-white" : "border-border bg-card-bg"
        }`}
      >
        {selected && <Check className="w-3 h-3" strokeWidth={3} />}
      </span>
      <div className="flex-1 min-w-0">
        <p className="text-[14px] font-medium text-foreground leading-tight">{addon.name}</p>
        <p className="text-[11px] text-text-tertiary mt-0.5">+{formatDuration(addon.duration)}</p>
      </div>
      <p className="text-[13px] font-semibold text-foreground tabular-nums">+{formatPrice(addon.price)}</p>
    </button>
  );
}

function formatGroupHint(g: PublicAddonGroup): string {
  if (g.minSelect === 1 && g.maxSelect === 1) return "Pick 1";
  if (g.minSelect === g.maxSelect && g.minSelect > 0) return `Pick ${g.minSelect}`;
  if (g.minSelect > 0 && g.maxSelect !== undefined) return `Pick ${g.minSelect}–${g.maxSelect}`;
  if (g.minSelect > 0) return `Pick at least ${g.minSelect}`;
  if (g.maxSelect !== undefined) return `Pick up to ${g.maxSelect}`;
  return "Optional";
}
