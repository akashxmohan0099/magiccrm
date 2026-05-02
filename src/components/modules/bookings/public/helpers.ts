/**
 * Format helpers shared across the public booking page components.
 * Prices are stored as plain numbers (AUD); durations are minutes.
 */

import type { PublicService } from "./types";

export function formatPrice(amount: number, currency = "AUD"): string {
  return new Intl.NumberFormat("en-AU", { style: "currency", currency }).format(amount);
}

/**
 * Deposit due today for a single line at the resolved per-line price.
 * Works on the *computed* price so deposits scale correctly with variants,
 * tiers, and addons. Percentage rounds to two decimals.
 */
export function lineDeposit(service: PublicService, linePrice: number): number {
  if (service.depositType === "fixed") return Math.max(0, service.depositAmount);
  if (service.depositType === "percentage") {
    const pct = Math.max(0, Math.min(100, service.depositAmount));
    return Math.round(linePrice * pct) / 100;
  }
  return 0;
}

/**
 * Catalog-card display price. Variants/tiers/from-priced services show their
 * lowest possible price prefixed "From".
 *
 * service.price is the base/anchor for fixed and from pricing. For variants
 * and tiered it is unused by the operator (the children carry the prices),
 * so including it would let an unset 0 win and surface "From $0" on the
 * customer menu even when every child is priced.
 */
export function displayCardPrice(service: PublicService): { price: number; isFrom: boolean } {
  const hasVariants =
    service.priceType === "variants" && service.variants.length > 0;
  const hasTiers =
    service.priceType === "tiered" && service.priceTiers.length > 0;

  const candidates: number[] = [];
  if (hasVariants) {
    for (const v of service.variants) candidates.push(v.price);
  } else if (hasTiers) {
    for (const t of service.priceTiers) candidates.push(t.price);
  } else {
    candidates.push(service.price);
  }

  const min = Math.min(...candidates);
  const isFrom =
    service.priceType === "from" ||
    service.priceType === "variants" ||
    service.priceType === "tiered";
  return { price: min, isFrom };
}

/**
 * Whether the service's promo is currently active. A promo is active when
 * `promoPrice` is set and `today` falls inside `[promoStart, promoEnd]`
 * (open-ended bounds count as "always" on that side).
 *
 * Pure helper — accepts an explicit `now` so tests can pin time.
 */
export function isPromoActive(service: PublicService, now: Date = new Date()): boolean {
  if (service.promoPrice == null) return false;
  const today = now.toISOString().slice(0, 10);
  if (service.promoStart && today < service.promoStart) return false;
  if (service.promoEnd && today > service.promoEnd) return false;
  return true;
}

/**
 * Lowest plausible duration for a service across its variants/tiers — the
 * honest number to show on the menu card before the customer picks one.
 */
export function displayCardDuration(service: PublicService): number {
  const hasVariants =
    service.priceType === "variants" && service.variants.length > 0;
  const hasTiers =
    service.priceType === "tiered" && service.priceTiers.length > 0;
  if (hasVariants) {
    const ds = service.variants.map((v) => v.duration).filter((d) => d > 0);
    if (ds.length > 0) return Math.min(...ds);
  }
  if (hasTiers) {
    const ds = service.priceTiers
      .map((t) => t.duration ?? 0)
      .filter((d) => d > 0);
    if (ds.length > 0) return Math.min(...ds);
  }
  return service.duration;
}

export function formatDuration(minutes: number): string {
  if (minutes < 60) return `${minutes} min`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
}

/** Slugify a category name to a stable scroll anchor. */
export function categoryAnchor(category: string): string {
  return `cat-${category.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "uncategorized"}`;
}

export interface ComputedLine {
  price: number;
  duration: number;
  /** Concise subtitle for cart display, e.g. "Senior · Long · Toner". */
  subtitle: string;
  /** Whether the line meets all addon group min/max requirements. */
  isValid: boolean;
  /** Human-readable validation reason when invalid. */
  invalidReason?: string;
}

/**
 * Resolve the effective price + duration for a cart line, applying:
 *   1. variant override (replaces base price+duration when chosen)
 *   2. tier override (replaces base, optionally overriding duration)
 *   3. addons (additive on top)
 * Also enforces addon group min/max selection rules.
 */
export function computeLine(
  service: PublicService,
  selections: { variantId?: string; tierId?: string; addonIds: string[] }
): ComputedLine {
  let price = service.price;
  let duration = service.duration;
  const subtitleParts: string[] = [];

  if (selections.variantId) {
    const v = service.variants.find((x) => x.id === selections.variantId);
    if (v) {
      price = v.price;
      duration = v.duration;
      subtitleParts.push(v.name);
    }
  } else if (selections.tierId) {
    const t = service.priceTiers.find((x) => x.id === selections.tierId);
    if (t) {
      price = t.price;
      duration = t.duration ?? duration;
      subtitleParts.push(t.name);
    }
  }

  for (const addonId of selections.addonIds) {
    const a = service.addons.find((x) => x.id === addonId);
    if (a) {
      price += a.price;
      duration += a.duration;
      subtitleParts.push(a.name);
    }
  }

  // Validate addon-group min/max.
  let isValid = true;
  let invalidReason: string | undefined;
  for (const group of service.addonGroups) {
    const inGroup = service.addons.filter((a) => a.groupId === group.id).map((a) => a.id);
    const chosenInGroup = selections.addonIds.filter((id) => inGroup.includes(id)).length;
    if (chosenInGroup < group.minSelect) {
      isValid = false;
      invalidReason = `${group.name}: pick ${group.minSelect}`;
      break;
    }
    if (group.maxSelect !== undefined && chosenInGroup > group.maxSelect) {
      isValid = false;
      invalidReason = `${group.name}: at most ${group.maxSelect}`;
      break;
    }
  }

  return {
    price,
    duration,
    subtitle: subtitleParts.join(" · "),
    isValid,
    invalidReason,
  };
}
