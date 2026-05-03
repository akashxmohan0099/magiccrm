/**
 * Format helpers shared across the public booking page components.
 * Prices are stored as plain numbers (AUD); durations are minutes.
 */

import { applyDynamicPricing } from "@/lib/services/price";
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
 * Returns the discounted price + the original (struckThrough) when a promo is
 * active — promoPercent and promoPrice are both supported. Variants and tiered
 * services use their cheapest child as the anchor; a fixed promoPrice is only
 * surfaced when it actually beats that anchor.
 *
 * service.price is the base/anchor for fixed and from pricing. For variants
 * and tiered it is unused by the operator (the children carry the prices),
 * so including it would let an unset 0 win and surface "From $0" on the
 * customer menu even when every child is priced.
 */
export function displayCardPrice(
  service: PublicService,
  now: Date = new Date(),
): { price: number; isFrom: boolean; struckThrough?: number } {
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

  if (isPromoActive(service, now)) {
    if (
      service.promoPercent != null &&
      service.promoPercent > 0 &&
      service.promoPercent < 100
    ) {
      const discounted = Math.round(min * (1 - service.promoPercent / 100));
      if (discounted < min) {
        return { price: discounted, isFrom, struckThrough: min };
      }
    }
    if (service.promoPrice != null && service.promoPrice < min) {
      return { price: service.promoPrice, isFrom, struckThrough: min };
    }
  }

  return { price: min, isFrom };
}

/**
 * Whether the service's promo is currently active. A promo is active when
 * either `promoPrice` or `promoPercent` is set and `today` falls inside
 * `[promoStart, promoEnd]` (open-ended bounds count as "always" on that side).
 *
 * Pure helper — accepts an explicit `now` so tests can pin time.
 */
export function isPromoActive(service: PublicService, now: Date = new Date()): boolean {
  if (service.promoPrice == null && service.promoPercent == null) return false;
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
 *   3. dynamic pricing rule (applied to the resolved base when startAt is supplied)
 *   4. addons (additive on top — addons themselves don't get the modifier)
 * Also enforces addon group min/max selection rules.
 *
 * `startAt` is an ISO datetime ("YYYY-MM-DDTHH:MM:SS"). When omitted, the
 * cart shows the un-adjusted base; when present, the cart total matches what
 * the server's submit handler will charge.
 */
export function computeLine(
  service: PublicService,
  selections: {
    variantId?: string;
    tierId?: string;
    addonIds: string[];
    startAt?: string | Date | null;
  }
): ComputedLine {
  let base = service.price;
  let duration = service.duration;
  const subtitleParts: string[] = [];

  if (selections.variantId) {
    const v = service.variants.find((x) => x.id === selections.variantId);
    if (v) {
      base = v.price;
      duration = v.duration;
      subtitleParts.push(v.name);
    }
  } else if (selections.tierId) {
    const t = service.priceTiers.find((x) => x.id === selections.tierId);
    if (t) {
      base = t.price;
      duration = t.duration ?? duration;
      subtitleParts.push(t.name);
    }
  }

  // Dynamic pricing applies to the resolved base BEFORE addons. Matches the
  // server-side resolvePrice + addons assembly in /api/public/book.
  let price = applyDynamicPricing(base, service.dynamicPriceRules, selections.startAt);

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
