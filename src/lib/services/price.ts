import type { Service, DynamicPriceRule } from "@/types/models";

/**
 * Apply the first matching off-peak/premium rule to a base price. Rules are
 * operator-ordered; first match wins. Returns the original base when nothing
 * matches, or there's no startAt to evaluate against.
 *
 * Extracted from resolvePrice so the public cart's computeLine and the
 * server's submit handler share the exact same modifier math.
 */
export function applyDynamicPricing(
  base: number,
  rules: DynamicPriceRule[] | undefined | null,
  startAt: string | Date | null | undefined,
): number {
  if (!startAt || !rules || rules.length === 0) return base;
  const date = typeof startAt === "string" ? new Date(startAt) : startAt;
  const weekday = date.getDay();
  const minutes = date.getHours() * 60 + date.getMinutes();
  const toMin = (hhmm: string) => {
    const [h, m] = hhmm.split(":").map((n) => Number(n) || 0);
    return h * 60 + m;
  };
  for (const rule of rules) {
    if (rule.weekdays.length > 0 && !rule.weekdays.includes(weekday)) continue;
    const start = toMin(rule.startTime);
    const end = toMin(rule.endTime);
    if (minutes < start || minutes > end) continue;
    const adjusted =
      rule.modifierType === "percent"
        ? base + (base * rule.modifierValue) / 100
        : base + rule.modifierValue;
    return Math.max(0, Math.round(adjusted * 100) / 100);
  }
  return base;
}

/**
 * Resolves the actual price a client pays for a service given the optional
 * artist + variant selection. Single source of truth — the cart, the menu
 * card, the confirmation screen, and the booking engine all call this.
 *
 * Resolution order (highest priority first):
 *   1. Per-staff price override on member_services
 *   2. Variant price (when priceType === 'variants' and a variant is picked)
 *   3. Tier price (when priceType === 'tiered' and member is in a tier)
 *   4. Service.price (fallback)
 */
export function resolvePrice(
  service: Service,
  opts: {
    memberId?: string | null;
    /** Per-staff override pulled from member_services for this (service, member). */
    memberPriceOverride?: number;
    variantId?: string | null;
    /** Optional booking start to evaluate dynamic pricing rules. */
    startAt?: string | Date | null;
  } = {},
): number {
  const { memberId, memberPriceOverride, variantId, startAt } = opts;

  // Resolve the base price first (override → variant → tier → service.price).
  let base: number;
  if (memberPriceOverride !== undefined && memberPriceOverride !== null) {
    base = memberPriceOverride;
  } else if (service.priceType === "variants" && variantId) {
    const v = service.variants?.find((x) => x.id === variantId);
    base = v ? v.price : service.price;
  } else if (service.priceType === "tiered" && memberId) {
    const tier = service.priceTiers?.find((t) => t.memberIds.includes(memberId));
    base = tier ? tier.price : service.price;
  } else {
    base = service.price;
  }

  return applyDynamicPricing(base, service.dynamicPriceRules, startAt);
}

/**
 * Lowest possible price for a service across all its variants/tiers/overrides.
 * Drives the "From $X" display on the menu when priceType is from/variants/tiered.
 */
export function minPrice(
  service: Service,
  opts: { memberOverrides?: number[] } = {},
): number {
  const candidates: number[] = [service.price];

  if (service.priceType === "variants") {
    for (const v of service.variants ?? []) candidates.push(v.price);
  }
  if (service.priceType === "tiered") {
    for (const t of service.priceTiers ?? []) candidates.push(t.price);
  }
  for (const o of opts.memberOverrides ?? []) {
    if (typeof o === "number") candidates.push(o);
  }

  return Math.min(...candidates);
}

/**
 * Resolves the duration. Variants, tiers, and per-staff overrides can each
 * change it. Time split fields are summed when set.
 *
 * Resolution order (highest priority first):
 *   1. Per-staff duration override (member_services.durationOverride)
 *   2. Variant duration (when priceType === 'variants' and a variant is picked)
 *   3. Tier duration (when priceType === 'tiered', member is in a tier, and
 *      that tier has its own duration set)
 *   4. Sum of split fields (active before + processing + active after)
 *   5. Service.duration (fallback)
 */
export function resolveDuration(
  service: Service,
  opts: {
    variantId?: string | null;
    memberId?: string | null;
    /** Per-staff override pulled from member_services for this (service, member). */
    memberDurationOverride?: number;
  } = {},
): number {
  if (
    opts.memberDurationOverride !== undefined &&
    opts.memberDurationOverride !== null &&
    opts.memberDurationOverride > 0
  ) {
    return opts.memberDurationOverride;
  }

  if (service.priceType === "variants" && opts.variantId) {
    const v = service.variants?.find((x) => x.id === opts.variantId);
    if (v) return v.duration;
  }

  if (service.priceType === "tiered" && opts.memberId) {
    const tier = service.priceTiers?.find((t) => t.memberIds.includes(opts.memberId!));
    if (tier && tier.duration && tier.duration > 0) return tier.duration;
  }

  // If the operator split duration into active/processing/active, that's
  // the total. Otherwise fall back to the single duration field.
  const before = service.durationActiveBefore ?? 0;
  const proc = service.durationProcessing ?? 0;
  const after = service.durationActiveAfter ?? 0;
  const split = before + proc + after;
  if (split > 0) return split;

  return service.duration;
}

/**
 * The longest duration any eligible member could take for this service.
 * Used by the public slot generator: when the customer picks a slot before
 * the system auto-assigns a member, the slot must be at least as long as
 * the slowest possible tier so a Junior taking it never overbooks.
 */
export function maxDuration(service: Service): number {
  const before = service.durationActiveBefore ?? 0;
  const proc = service.durationProcessing ?? 0;
  const after = service.durationActiveAfter ?? 0;
  const split = before + proc + after;
  const baseDuration = split > 0 ? split : service.duration;

  const candidates: number[] = [baseDuration];
  if (service.priceType === "variants") {
    for (const v of service.variants ?? []) candidates.push(v.duration);
  }
  if (service.priceType === "tiered") {
    for (const t of service.priceTiers ?? []) {
      if (t.duration && t.duration > 0) candidates.push(t.duration);
    }
  }
  return Math.max(...candidates);
}

/**
 * Resolves buffer minutes split into before / after. Prefers the new
 * bufferBefore + bufferAfter fields; falls back to the legacy bufferMinutes
 * (which historically meant "after" — most operators added padding for
 * cleanup, not setup).
 */
export function resolveBuffer(service: Service): { before: number; after: number } {
  const before = service.bufferBefore;
  const after = service.bufferAfter;
  if (before != null || after != null) {
    return { before: before ?? 0, after: after ?? 0 };
  }
  return { before: 0, after: service.bufferMinutes ?? 0 };
}

/** True when the service should display "From $X" in the menu. */
export function isFromPriced(service: Service): boolean {
  if (!service.priceType || service.priceType === "fixed") return false;
  if (service.priceType === "from") return true;
  if (service.priceType === "variants") return (service.variants?.length ?? 0) > 0;
  if (service.priceType === "tiered") return (service.priceTiers?.length ?? 0) > 0;
  return false;
}

/**
 * Whether a service's promo is currently active. A promo with no date range
 * is always-on (when featured). With a range, today must fall within it.
 */
export function isPromoActive(service: Service, today: Date = new Date()): boolean {
  const todayStr = today.toISOString().slice(0, 10);
  const startOk = !service.promoStart || service.promoStart <= todayStr;
  const endOk = !service.promoEnd || service.promoEnd >= todayStr;
  return startOk && endOk;
}

/** Effective price the menu should display (taking promo into account). */
export function displayPrice(
  service: Service,
): { price: number; max?: number; struckThrough?: number } {
  const min = minPrice(service);
  // % off wins over fixed promo price if both are set — matches the editor,
  // which makes the two mutually exclusive but defensively coexists with
  // older rows that may have both.
  if (
    service.promoPercent != null &&
    service.promoPercent > 0 &&
    service.promoPercent < 100 &&
    isPromoActive(service)
  ) {
    const discounted = Math.round(min * (1 - service.promoPercent / 100));
    if (discounted < min) {
      return { price: discounted, struckThrough: min };
    }
  }
  if (
    service.promoPrice != null &&
    service.promoPrice < min &&
    isPromoActive(service)
  ) {
    return { price: service.promoPrice, struckThrough: min };
  }
  // Only surface the upper bound for explicit "from" pricing — variants /
  // tiered already enumerate their own prices, so a max would double up
  // with the per-row figures.
  const max =
    service.priceType === "from" &&
    service.priceMax != null &&
    service.priceMax > min
      ? service.priceMax
      : undefined;
  return { price: min, max };
}
