// ── Service ─────────────────────────────────────────

export type ServiceLocationType = 'studio' | 'mobile' | 'both';
export type DepositType = 'none' | 'percentage' | 'fixed';

/**
 * How a service is priced.
 *  - fixed:    one number, what you see is what you pay
 *  - from:     "From $X" — operator confirms exact price after consult
 *  - variants: client picks a variant (Short/Medium/Long etc.) which
 *              drives both price and duration
 *  - tiered:   price varies by which artist delivers it (Junior/Senior/Master);
 *              tiers are operator-named, not enum
 */
export type ServicePriceType = 'fixed' | 'from' | 'variants' | 'tiered';

export interface ServiceVariant {
  id: string;
  name: string;          // operator-defined: "Short", "Medium", "Long", etc.
  price: number;
  duration: number;      // minutes; can override the parent service's duration
  sortOrder: number;
}

export interface ServicePriceTier {
  id: string;
  name: string;          // operator-defined: "Junior", "Senior", "Master", "Studio", "On-location"
  price: number;
  /**
   * Optional per-tier duration override in minutes. When set, an artist in
   * this tier takes this long for the service instead of the parent's base
   * duration. Empty/undefined = use service.duration. A Master tier might
   * be 25% faster than a Junior tier on the same cut.
   */
  duration?: number;
  memberIds: string[];   // members in this tier
  sortOrder: number;
}

/**
 * Optional extras a client can attach to a service when booking — toner with
 * colour, scalp massage with facial. Each adds its own price and duration.
 * Per-service for v1; can be promoted to a workspace-level library later.
 */
export interface ServiceAddon {
  id: string;
  name: string;
  price: number;
  duration: number;      // minutes
  sortOrder: number;
  /** Optional group this add-on belongs to. Ungrouped add-ons render as a flat "Optional extras" list. */
  groupId?: string;
}

/**
 * Workspace-level add-on template. Operators stock a master list once
 * ("Toner $15 / 15min", "Booster $25 / 10min") and copy it into specific
 * services via the drawer. Edits to a library entry don't propagate to
 * services that already pulled from it — that's intentional, so per-service
 * tweaks don't get blown away.
 */
export interface LibraryAddon {
  id: string;
  workspaceId: string;
  name: string;
  price: number;
  duration: number;
  createdAt: string;
  updatedAt: string;
}

/**
 * Bucket of related add-ons with min/max selection rules. e.g. "Pick 1 toner"
 * (min=1, max=1 — required radio), or "Pick up to 3 boosters" (min=0, max=3
 * — optional checkboxes). Ungrouped add-ons remain optional and unbounded.
 */
export interface ServiceAddonGroup {
  id: string;
  name: string;
  /** Minimum selections required to book. 0 = optional. */
  minSelect: number;
  /** Maximum selections allowed; null/undefined = unlimited. */
  maxSelect?: number;
  sortOrder: number;
}

/**
 * Custom form field a client must answer when booking this specific service.
 * Renders during the booking flow's Details step, hidden when empty.
 */
export type ServiceIntakeQuestionType = 'text' | 'longtext' | 'select' | 'yesno' | 'date' | 'number';

export interface ServiceIntakeQuestion {
  id: string;
  label: string;
  type: ServiceIntakeQuestionType;
  required: boolean;
  /** Options for type='select'; ignored otherwise. */
  options?: string[];
  /** Helper text shown beneath the field. */
  hint?: string;
  sortOrder: number;
}

/** Who a deposit charge applies to. */
export type DepositAppliesTo = 'all' | 'new' | 'flagged';

/**
 * Booking waitlist entry — a client wants a slot that wasn't free, and
 * asked to be notified if one opens up. When a matching booking is
 * cancelled, the cancellation hook fans out SMS/email to entries that
 * match (service + date window, optional artist).
 */
export interface BookingWaitlistEntry {
  id: string;
  workspaceId: string;
  /** Linked client when known; otherwise the entry is anonymous (email/phone only). */
  clientId?: string;
  clientName: string;
  clientEmail: string;
  clientPhone?: string;
  serviceId: string;
  /** Specific date the client wants. When dateRangeEnd is also set, treats as a window. */
  preferredDate: string;
  /** Optional end of a flexible window. */
  preferredDateEnd?: string;
  /** Pinned artist preference; empty = anyone. */
  artistId?: string;
  notes?: string;
  notifiedAt?: string;
  /** Set when the client books from the notification — closes the entry. */
  fulfilledBookingId?: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * A bookable, scarce object that a service may need: a treatment room, a
 * pedicure chair, a specific machine. Bookings reserve the resource for
 * their full envelope; the availability engine rejects slots that would
 * double-book a resource (independent of artist availability).
 */
export interface Resource {
  id: string;
  workspaceId: string;
  name: string;
  /** Free-text type label for grouping ("Room", "Chair", "Machine"). */
  kind?: string;
  /** Restrict this resource to a specific location. Empty = available at all locations. */
  locationIds?: string[];
  enabled: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

/**
 * A physical location (or "On location") the workspace operates from.
 * Workspaces with a single location stay invisible — the UI only surfaces
 * location pickers once a second one exists. Empty Service.locationIds /
 * MemberService.locationIds means "available everywhere" for that resource.
 */
export interface Location {
  id: string;
  workspaceId: string;
  name: string;
  /** Optional street address; rendered on the booking page when set. */
  address?: string;
  /** "studio" = fixed shop; "mobile" = artist travels to client. */
  kind: 'studio' | 'mobile';
  enabled: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

/**
 * Dynamic pricing rule. Matches when:
 *   - the booking's weekday is in `weekdays` (or weekdays is empty),
 *   - and start time falls within [startTime, endTime] (24h "HH:MM").
 * Modifier applies as `percent` (e.g. -20 ⇒ 20% off) or `amount` (dollars).
 * Use a NEGATIVE percent/amount for off-peak discounts, positive for premium hours.
 */
export interface DynamicPriceRule {
  id: string;
  label: string;
  weekdays: number[]; // 0=Sun..6=Sat; empty = any day
  startTime: string;  // "HH:MM"
  endTime: string;    // "HH:MM"
  modifierType: 'percent' | 'amount';
  modifierValue: number;
}

export interface PackageItem {
  id: string;
  serviceId: string;
  variantId?: string;
  quantity?: number;
}

/**
 * First-class category. Persists name, color, and sort order so operators
 * can reorder, recolor, and rename without rewriting every Service row.
 * Service.categoryId is the canonical link; the legacy Service.category
 * (free-text) is kept as a fallback and gets backfilled into a category
 * row on first load.
 */
export interface ServiceCategory {
  id: string;
  workspaceId: string;
  name: string;
  /** Optional override; when null, color is derived from the name hash (legacy behavior). */
  color?: string;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

export interface Service {
  id: string;
  workspaceId: string;
  name: string;
  description: string;
  duration: number;           // minutes — total = activeBefore + processing + activeAfter when split
  price: number;              // base price; for tiered/variants this is a fallback / "from" anchor
  /** Legacy free-text category. Kept for back-compat; new code uses categoryId. */
  category?: string;
  /** Canonical category link. Falls back to `category` (free-text) when absent.
   *  Pass `null` on update to clear the link (e.g. moving to "Uncategorized"
   *  or after deleting a category row). */
  categoryId?: string | null;
  enabled: boolean;
  sortOrder: number;
  // Pricing
  priceType?: ServicePriceType;       // defaults to 'fixed'
  variants?: ServiceVariant[];        // populated when priceType === 'variants'
  priceTiers?: ServicePriceTier[];    // populated when priceType === 'tiered'
  addons?: ServiceAddon[];            // optional extras client can tick on
  // when adding the service to the basket
  /** Optional grouping for add-ons with min/max selection rules. */
  addonGroups?: ServiceAddonGroup[];
  // Time
  durationActiveBefore?: number;      // minutes — artist working before processing
  durationProcessing?: number;        // minutes — chair occupied, artist free; bookable for short services
  durationActiveAfter?: number;       // minutes — artist working after processing
  // Platform features
  /** @deprecated — kept as legacy fallback. Prefer bufferBefore + bufferAfter. */
  bufferMinutes: number;
  /** Padding minutes BEFORE the active service (chair occupied, artist working). */
  bufferBefore?: number;
  /** Padding minutes AFTER the active service (chair occupied, artist working). */
  bufferAfter?: number;
  minNoticeHours?: number;
  maxAdvanceDays?: number;
  requiresConfirmation: boolean;
  depositType: DepositType;
  depositAmount: number;
  /** Who the deposit applies to. Defaults to 'all'. */
  depositAppliesTo?: DepositAppliesTo;
  /** No-show fee — percentage of price charged when client doesn't show up. */
  depositNoShowFee?: number;
  /** Hours after booking before auto-cancel if deposit isn't paid. */
  depositAutoCancelHours?: number;
  /**
   * Require a card on file before this service can be booked. Used for
   * services with a no-show fee — the booking page collects the card via
   * SetupIntent before submitting the booking.
   */
  requiresCardOnFile?: boolean;
  cancellationWindowHours?: number;
  cancellationFee?: number;
  /** Per-service custom intake questions shown in the booking flow's details step. */
  intakeQuestions?: ServiceIntakeQuestion[];
  /**
   * Optional reference to a Form (built in the Forms module) used as the
   * intake step instead of the inline `intakeQuestions`. Lets operators
   * reuse the rich form builder (sections, conditionals, file upload).
   */
  intakeFormId?: string;
  /**
   * When true, the booking flow blocks this service unless the client has a
   * non-expired patch test on file. Operators set the validity window per
   * service (color, lash glue, brow tint typically 24-48h before; some
   * jurisdictions require fresh tests every 6 months).
   */
  requiresPatchTest?: boolean;
  /** Days a patch test stays valid for this service. */
  patchTestValidityDays?: number;
  /** Minimum hours BEFORE the appointment a patch test must have been done. */
  patchTestMinLeadHours?: number;
  /** Patch-test category clients must have on file. Matches ClientPatchTest.category. */
  patchTestCategory?: string;
  /**
   * Default rebook cadence in days. Used by the rebook-nudge cron and the
   * confirm-screen "Book your next" CTA to suggest the next appointment.
   * 0/undefined = no auto rebook prompt for this service.
   */
  rebookAfterDays?: number;
  /**
   * When true the booking flow exposes a "+ guest" affordance so one
   * primary client can book additional people in the same time block.
   * Each guest still consumes their own artist + chair; the basket endpoint
   * chains the bookings under the primary client.
   */
  allowGroupBooking?: boolean;
  /** Cap on guests per booking (incl. primary). Default 4 when allowed. */
  maxGroupSize?: number;
  /**
   * Off-peak / dynamic pricing rules. Each rule is matched against the
   * appointment's weekday + time-of-day; the FIRST match wins. Modifier
   * is either a percent (e.g. -20 for 20% off) or a fixed dollar delta.
   * resolvePrice consults this list before the deposit step.
   */
  dynamicPriceRules?: DynamicPriceRule[];
  /** Weekdays this service can be booked. 0=Sun..6=Sat. Empty = any day. */
  availableWeekdays?: number[];
  /** Pin to a "Featured" row on the public booking page. */
  featured?: boolean;
  /** Free-text label shown as a small ribbon when featured: "Today's offer", "20% off", "New". */
  promoLabel?: string;
  /** Discounted price; the original price gets struck through next to it. */
  promoPrice?: number;
  /** Optional auto-expiring date range (ISO yyyy-mm-dd). Outside = revert to normal. */
  promoStart?: string;
  promoEnd?: string;
  /** Free-form tags driving the public-page filter chips. */
  tags?: string[];
  /**
   * When true, this Service is a bundle of other Services. The Service's own
   * `price` is the bundle price (typically a discount vs. summing items);
   * `duration` defaults to the summed item durations but can be overridden.
   */
  isPackage?: boolean;
  /** Items in the bundle. Only meaningful when isPackage is true. */
  packageItems?: PackageItem[];
  /**
   * @deprecated Use `locationIds` + `Location.kind`. Studio/Mobile/Both is now
   * a property of the location, not the service. Kept optional only so old DB
   * rows round-trip; no UI surface writes it anymore.
   */
  locationType?: ServiceLocationType;
  /** Restrict this service to specific locations. Empty/undefined = all. */
  locationIds?: string[];
  /**
   * Resources required for this service to run (e.g. a specific room).
   * Each id must be free for the booking's full envelope; if any are busy,
   * the slot is rejected even when the artist is available.
   */
  requiredResourceIds?: string[];
  imageUrl?: string;
  createdAt: string;
  updatedAt: string;
}

export interface MemberService {
  id: string;
  memberId: string;
  serviceId: string;
  workspaceId: string;
  /**
   * One-off price for this member on this service. Overrides the service's
   * base price AND any tier price the member would otherwise inherit.
   */
  priceOverride?: number;
  /**
   * One-off duration (minutes) for this member on this service. Overrides
   * the service's base duration AND any tier-level duration override. Use
   * for the rare case where a single staffer is faster/slower than their
   * tier on a specific service.
   */
  durationOverride?: number;
  /** Restrict this artist's eligibility for this service to specific locations. Empty/undefined = all. */
  locationIds?: string[];
}
