// ═══════════════════════════════════════════════════
// MAGIC CRM — Core Type Definitions
// 5 core objects: Client, Booking, Inquiry, Conversation, PaymentDocument
// ═══════════════════════════════════════════════════

// ── Client ──────────────────────────────────────────

export interface Client {
  id: string;
  workspaceId: string;
  name: string;
  email: string;
  phone: string;
  notes: string;
  // Platform features
  birthday?: string;
  medicalAlerts?: string;
  source?: string;
  addressStreet?: string;
  addressSuburb?: string;
  addressPostcode?: string;
  addressState?: string;
  stripePaymentMethodId?: string;
  /**
   * Patch test history. Each entry stamps the test date plus the
   * service category it covers (e.g. "color", "lash_glue", "brow_tint").
   * The booking flow gates services that require a non-expired test.
   */
  patchTests?: ClientPatchTest[];
  /**
   * Operator-set flag: when true, this client is always charged a deposit
   * on services configured with `depositAppliesTo === 'flagged'` (typically
   * because of past no-shows or chargebacks).
   */
  depositRequired?: boolean;
  createdAt: string;
  updatedAt: string;
}

/**
 * SOAP-style treatment note. One row per service performed; locked once saved
 * (regulatory expectation in many jurisdictions for medspa / esthetic work).
 * Edits create amendments rather than overwriting.
 */
export interface TreatmentNote {
  id: string;
  workspaceId: string;
  clientId: string;
  bookingId?: string;
  serviceId?: string;
  authorMemberId?: string;
  /** Subjective — what the client reports. */
  subjective?: string;
  /** Objective — what the artist observes. */
  objective?: string;
  /** Assessment — diagnosis, classification. */
  assessment?: string;
  /** Plan — what was done, recommendations, next steps. */
  plan?: string;
  /** Free-form additional notes outside the SOAP frame. */
  notes?: string;
  /** Image attachments — Supabase storage URLs. */
  attachmentUrls?: string[];
  /** Once true, the note is read-only; further edits become amendments. */
  locked: boolean;
  /** Append-only chain of amendments (each is a partial Note diff). */
  amendments?: TreatmentNoteAmendment[];
  createdAt: string;
  updatedAt: string;
}

export interface TreatmentNoteAmendment {
  id: string;
  authorMemberId?: string;
  reason: string;
  delta: Partial<Pick<TreatmentNote, "subjective" | "objective" | "assessment" | "plan" | "notes">>;
  createdAt: string;
}

export interface ClientPatchTest {
  id: string;
  /** Free-form category — color, lash_glue, brow_tint, peel, …  */
  category: string;
  /** ISO date the test was performed. */
  testedAt: string;
  /** Free-text result/notes (e.g. "no reaction"). */
  result?: string;
  /** Optional reference to a Booking the test was done at. */
  bookingId?: string;
}

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
 * Bucket of related add-ons with min/max selection rules. e.g. "Pick 1 toner"
 * (min=1, max=1 — required radio), or "Pick up to 3 boosters" (min=0, max=3
 * — optional checkboxes). Ungrouped add-ons remain optional and unbounded.
 */
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
 * One line in a package/bundle. Pins to a specific Service and, when that
 * Service has variants, optionally pins to a specific variant. Quantity > 1
 * lets the same service appear multiple times (e.g. "two trials").
 */
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

// ── Conversation ────────────────────────────────────

export type Channel = 'instagram' | 'whatsapp' | 'facebook' | 'email' | 'sms';

export interface Conversation {
  id: string;
  workspaceId: string;
  contactName?: string;
  contactEmail?: string;
  contactPhone?: string;
  contactSocialHandle?: string;
  channel: Channel;
  clientId?: string;
  externalConversationId?: string;
  lastMessageAt?: string;
  unreadCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface Message {
  id: string;
  conversationId: string;
  workspaceId: string;
  content: string;
  sender: 'user' | 'client';
  externalMessageId?: string;
  createdAt: string;
}

// ── Inquiry ─────────────────────────────────────────

export type InquirySource = 'form' | 'comms';
export type InquiryStatus = 'new' | 'in_progress' | 'converted' | 'closed';

export interface Inquiry {
  id: string;
  workspaceId: string;
  name: string;
  email: string;
  phone: string;
  message: string;
  serviceInterest?: string;
  eventType?: string;
  dateRange?: string;
  source: InquirySource;
  status: InquiryStatus;
  conversationId?: string;
  formId?: string;
  formResponseId?: string;
  bookingId?: string;
  clientId?: string;
  notes?: string;
  submissionValues?: Record<string, string>;
  createdAt: string;
  updatedAt: string;
}

// ── Form Response ───────────────────────────────────

export interface FormResponse {
  id: string;
  workspaceId: string;
  formId?: string;
  values: Record<string, string>;
  contactName?: string;
  contactEmail?: string;
  contactPhone?: string;
  inquiryId?: string;
  submittedAt: string;
}

// ── Booking ─────────────────────────────────────────

export type BookingStatus = 'confirmed' | 'pending' | 'cancelled' | 'completed' | 'no_show';

export type RecurrencePattern = 'weekly' | 'fortnightly' | 'monthly' | 'custom';

export interface Booking {
  id: string;
  workspaceId: string;
  clientId: string;
  serviceId?: string;
  /**
   * Additional services stacked into the same appointment (e.g. Bridal
   * Package + Brow Tint, one client, one visit). The primary `serviceId`
   * still drives display labels, intake, and pricing snapshots; these
   * extras contribute to total duration and are listed alongside it.
   */
  additionalServiceIds?: string[];
  assignedToId?: string;
  date: string;               // YYYY-MM-DD
  startAt: string;            // ISO timestamp
  endAt: string;              // ISO timestamp
  status: BookingStatus;
  notes: string;
  inquiryId?: string;
  conversationId?: string;
  cancellationReason?: string;
  reminderSentAt?: string;
  followupSentAt?: string;
  reviewRequestSentAt?: string;
  intakeFormSentAt?: string;
  /**
   * Group booking: the lead booking the guest is attached to. The lead's
   * own groupParentBookingId is null; guest bookings reference the lead.
   * Cancelling the lead cancels every guest under it.
   */
  groupParentBookingId?: string;
  /** Free-text guest name when the guest doesn't have a Client row of their own. */
  groupGuestName?: string;
  /** Variant the client picked at booking time (when service.priceType === 'variants'). */
  selectedVariantId?: string;
  /** Add-ons the client selected on top of the service. */
  selectedAddonIds?: string[];
  /** Snapshot of the price actually paid (after dynamic pricing, gift cards, membership). */
  resolvedPrice?: number;
  /** Gift card code applied to this booking, if any. */
  giftCardCode?: string;
  /** Membership the booking was drawn against, if any. */
  membershipId?: string;
  /**
   * Inline intake answers captured at booking time, keyed by
   * ServiceIntakeQuestion.id. Distinct from the linked Form Builder form
   * (intakeFormId) which is sent post-booking by the intake-form cron.
   */
  intakeAnswers?: Record<string, string>;
  // Platform features
  recurrencePattern?: RecurrencePattern;
  recurrenceEndDate?: string;
  /** FK to the Location this booking happens at. Null on single-location workspaces. */
  locationId?: string;
  /** Snapshot of the location's kind at booking time ("studio" | "mobile"). */
  locationType?: string;
  /** Customer drop-off address for mobile bookings. */
  address?: string;
  createdAt: string;
  updatedAt: string;
}

// ── Payment Document ────────────────────────────────

export type PaymentDocLabel = 'quote' | 'invoice';
export type PaymentDocStatus = 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled';
export type PaymentMethod = 'stripe' | 'cash' | 'bank_transfer' | 'card_in_person';

export interface PaymentDocument {
  id: string;
  workspaceId: string;
  documentNumber: string;
  clientId: string;
  bookingId?: string;
  label: PaymentDocLabel;
  status: PaymentDocStatus;
  paymentMethod?: PaymentMethod;
  stripeInvoiceId?: string;
  stripeHostedUrl?: string;
  total: number;
  notes: string;
  sentAt?: string;
  paidAt?: string;
  dueDate?: string;
  createdAt: string;
  updatedAt: string;
}

export interface PaymentLineItem {
  id: string;
  paymentDocumentId: string;
  workspaceId: string;
  description: string;
  quantity: number;
  unitPrice: number;
  sortOrder: number;
}

// ── Form ────────────────────────────────────────────

export type FormType = 'booking' | 'inquiry';

export type FormFieldType =
  | 'text'
  | 'email'
  | 'phone'
  | 'url'
  | 'number'
  | 'textarea'
  | 'select'
  | 'multi_select'
  | 'radio'
  | 'checkbox'
  | 'file'
  | 'date'
  | 'date_range'
  | 'time'
  | 'service'
  | 'signature'
  | 'hidden';

// Conditional show rule. The field renders only when the referenced field's
// answer matches one of the listed values.
//   operator 'equals'   — value must be one of `values`
//   operator 'not_equals' — value must NOT be any of `values`
//   operator 'includes' — for multi-value answers (multi_select/checkbox), at
//                         least one selection must be in `values`
export interface FormFieldCondition {
  fieldName: string;
  operator: 'equals' | 'not_equals' | 'includes';
  values: string[];
}

export interface FormFieldConfig {
  name: string;
  type: FormFieldType;
  label: string;
  required: boolean;
  options?: string[];         // for select / multi_select / radio / checkbox
  placeholder?: string;       // optional placeholder, falls back to label
  helpText?: string;          // small supporting text under the field
  // ── Validation ──
  // Surfaced in the editor only for the field types where they apply, but
  // stored on the same flat config so the renderer can read them uniformly.
  min?: number;               // number fields — minimum value
  max?: number;               // number fields — maximum value
  maxLength?: number;         // textarea — character cap with live counter
  maxSelections?: number;     // multi_select / checkbox — caps how many options the user may pick
  // ── File upload (type === 'file') ──
  acceptedFileTypes?: string; // e.g. 'image/*' or '.pdf,.jpg'
  multipleFiles?: boolean;
  maxFileSizeMb?: number;     // per-file limit, default 5
  maxFiles?: number;          // only when multipleFiles is true; caps file count
  // ── Hidden field (type === 'hidden') ──
  // Auto-populated from URL params on the public page. Comma-separated keys
  // tried in order; first match wins.
  paramKeys?: string;         // e.g. 'utm_source,source,ref'
  defaultValue?: string;      // fallback when no param matches
  // ── Conditional show ──
  showWhen?: FormFieldCondition;
}

export type FormTemplate = 'classic' | 'minimal' | 'editorial' | 'slides';
export type FormFontFamily = 'sans' | 'serif' | 'display' | 'mono';
export type FormTheme = 'light' | 'dark' | 'auto';

// Variant thank-you screen, picked by matching an answer to a chosen field.
export interface FormSuccessVariant {
  id: string;
  label: string;             // operator-facing label, e.g. "Wedding"
  matchValues: string[];     // values of the routing field that activate this variant
  message?: string;
  ctaLabel?: string;
  ctaUrl?: string;
  redirectUrl?: string;
  redirectDelaySeconds?: number;
}

export interface FormBranding {
  logo?: string;
  primaryColor?: string;
  accentColor?: string;
  // Stored on the JSON column so we don't need a DB migration. These are
  // form-presentation settings that travel with the form's visual identity.
  description?: string;       // shown under form name on the public page
  successMessage?: string;    // custom thank-you copy after submit
  template?: FormTemplate;    // visual layout — defaults to 'classic'
  fontFamily?: FormFontFamily;        // body typography — defaults to 'sans'
  headingFontFamily?: FormFontFamily; // heading override; falls back to fontFamily when unset
  theme?: FormTheme;          // 'light' | 'dark' | 'auto' — defaults to 'light'
  coverImage?: string;        // hero image URL shown above form title

  // ── Welcome screen (intro before fields) ──
  welcomeEnabled?: boolean;
  welcomeTitle?: string;
  welcomeSubtitle?: string;
  welcomeCtaLabel?: string;   // e.g. "Get started" — defaults to "Start"

  // ── Post-submission (success screen) ──
  successCtaLabel?: string;            // e.g. "Book a consultation"
  successCtaUrl?: string;              // absolute URL the CTA opens
  successRedirectUrl?: string;         // optional auto-redirect after submit
  successRedirectDelaySeconds?: number; // seconds before redirect (default 5)
  // Routed thank-you screens. When set, the renderer picks the first variant
  // whose matchValues overlap the answer to `successRouteFieldName`. Falls
  // back to the default success screen above when nothing matches.
  successRouteFieldName?: string;
  successVariants?: FormSuccessVariant[];

  // ── Auto-reply to the person who submitted ──
  autoReplyEnabled?: boolean;          // email auto-reply toggle
  autoReplySubject?: string;           // e.g. "We got your inquiry"
  autoReplyBody?: string;              // plain text, supports {{name}} {{businessName}} {{serviceInterest}}
  autoReplyDelayMinutes?: number;      // reserved for scheduled auto-replies; editor currently sends immediately
  autoReplySmsEnabled?: boolean;       // SMS auto-reply toggle (only if phone captured)
  autoReplySmsBody?: string;           // SMS text, same {{vars}}
  autoReplySmsDelayMinutes?: number;   // reserved for scheduled auto-replies; editor currently sends immediately

  // ── Owner notification ──
  notifyOwnerEmail?: boolean;          // also email the workspace owner
}

export interface Form {
  id: string;
  workspaceId: string;
  type: FormType;
  name: string;
  fields: FormFieldConfig[];
  branding: FormBranding;
  slug?: string;
  enabled: boolean;
  autoPromoteToInquiry: boolean;
  createdAt: string;
  updatedAt: string;
}

// ── Automation ──────────────────────────────────────

export type AutomationType =
  | 'booking_confirmation'
  | 'appointment_reminder'
  | 'post_service_followup'
  | 'review_request'
  | 'rebooking_nudge'
  | 'no_show_followup'
  | 'invoice_auto_send'
  | 'cancellation_confirmation';

export type AutomationChannel = 'email' | 'sms' | 'both';

export interface AutomationRule {
  id: string;
  workspaceId: string;
  type: AutomationType;
  enabled: boolean;
  channel: AutomationChannel;
  messageTemplate: string;
  timingValue?: number;       // e.g., 24 for 24 hours before
  timingUnit?: 'minutes' | 'hours' | 'days';
  createdAt: string;
  updatedAt: string;
}

// ── Marketing ───────────────────────────────────────

export type CampaignChannel = 'email' | 'sms' | 'both';
export type CampaignSegment = 'all' | 'new' | 'returning' | 'inactive' | 'high_value';
export type CampaignStatus = 'draft' | 'scheduled' | 'sending' | 'sent';

export interface Campaign {
  id: string;
  workspaceId: string;
  name: string;
  subject?: string;
  body: string;
  channel: CampaignChannel;
  targetSegment: CampaignSegment;
  inactiveDays?: number;
  status: CampaignStatus;
  scheduledAt?: string;
  sentCount: number;
  openCount: number;
  clickCount: number;
  createdAt: string;
  updatedAt: string;
}

// ── Team ────────────────────────────────────────────

export type TeamRole = 'owner' | 'staff';
export type MemberStatus = 'active' | 'invited' | 'inactive';

export interface WorkingHours {
  start: string;              // "09:00"
  end: string;                // "17:00"
}

export interface LeavePeriod {
  start: string;              // "2026-04-10"
  end: string;                // "2026-04-12"
  reason?: string;
}

export interface TeamMemberSocialLinks {
  instagram?: string;
  tiktok?: string;
  facebook?: string;
  website?: string;
}

export interface TeamMember {
  id: string;
  authUserId: string;
  workspaceId: string;
  name: string;
  email: string;
  phone?: string;
  role: TeamRole;
  avatarUrl?: string;
  bio?: string;
  socialLinks?: TeamMemberSocialLinks;
  status: MemberStatus;
  workingHours: Record<string, WorkingHours>;  // { "mon": { start, end }, "tue": ... }
  daysOff: string[];          // ["sun"]
  leavePeriods: LeavePeriod[];
  createdAt: string;
  updatedAt: string;
}

// ── Workspace & Settings ────────────────────────────

export type OnboardingArtistType =
  | 'hair_stylist'
  | 'nail_technician'
  | 'makeup_artist'
  | 'lash_brow_artist'
  | 'esthetician_facialist'
  | 'barber'
  | 'massage_therapist'
  | 'tattoo_artist'
  | 'spa_wellness'
  | 'other';

export type OnboardingWorkLocation = 'studio' | 'mobile' | 'both';

export type OnboardingTeamSize = 'solo' | 'small_team' | 'large_team';

export type OnboardingBookingChannel =
  | 'phone_text'
  | 'instagram_dms'
  | 'whatsapp'
  | 'facebook_messenger'
  | 'email'
  | 'website'
  | 'walk_ins'
  | 'booking_platform';

export type OnboardingPaymentMethod =
  | 'cash'
  | 'bank_transfer'
  | 'card_terminal'
  | 'stripe'
  | 'square'
  | 'paypal'
  | 'other';

export type OnboardingActionId =
  | 'treatment_notes'
  | 'deposit_requirements'
  | 'card_on_file_no_show_fee'
  | 'reminder_automations'
  | 'recurring_bookings'
  | 'rebooking_prompt'
  | 'before_after_photos'
  | 'pre_appointment_questionnaire'
  | 'review_request_automation'
  | 'tips'
  | 'proposals_addon'
  | 'travel_fee_calculation'
  | 'service_area'
  | 'group_bookings'
  | 'memberships_addon'
  | 'documents_addon'
  | 'booking_approval_mode';

export type OnboardingPersona =
  | 'hair_stylist_solo'
  | 'hair_stylist_team'
  | 'nail_technician_solo'
  | 'nail_technician_team'
  | 'makeup_artist_mobile'
  | 'makeup_artist_studio'
  | 'lash_brow_artist'
  | 'esthetician_facialist'
  | 'barber_solo'
  | 'barber_team'
  | 'massage_therapist_studio'
  | 'massage_therapist_mobile'
  | 'tattoo_artist'
  | 'spa_wellness'
  | 'other';

export type OnboardingDepositPreference = '25_percent' | '50_percent' | 'fixed_amount' | 'set_later';
export type OnboardingNoShowFeePreference = '50_percent' | '100_percent' | 'fixed_amount' | 'decide_later';
export type OnboardingTravelFeePreference = 'per_km_rate' | 'zone_flat_fee' | 'set_up_later';
export type OnboardingServiceAreaPreference = 'radius_from_base' | 'specific_postcodes' | 'set_up_later';
export type OnboardingMembershipPreference = 'subscription' | 'bundles' | 'both' | 'set_up_later';

export interface OnboardingFollowUps {
  depositPreference?: OnboardingDepositPreference;
  noShowFeePreference?: OnboardingNoShowFeePreference;
  travelFeePreference?: OnboardingTravelFeePreference;
  serviceAreaPreference?: OnboardingServiceAreaPreference;
  membershipPreference?: OnboardingMembershipPreference;
}

export type OnboardingFollowUpKey = keyof OnboardingFollowUps;

export interface Workspace {
  id: string;
  name: string;
  plan: 'free' | 'pro' | 'enterprise';
  createdAt: string;
  updatedAt: string;
}

export interface WorkspaceSettings {
  workspaceId: string;
  businessName?: string;
  logoUrl?: string;
  contactEmail?: string;
  contactPhone?: string;
  address?: string;
  stripeAccountId?: string;
  stripeOnboardingComplete: boolean;
  workingHours: Record<string, WorkingHours>;
  cancellationWindowHours: number;
  depositPercentage: number;
  noShowFee: number;
  messageTemplates: Record<string, string>;
  notificationDefaults: 'email' | 'sms' | 'both';
  branding: {
    logo?: string;
    primaryColor?: string;
    accentColor?: string;
    /** Wide hero photo shown above the booking page header. Data URL or remote URL. */
    coverImage?: string;
    /** Font pairing id, e.g. "modern-clean", "editorial". Drives heading + body. */
    fontPairing?: string;
  };
  bookingPageSlug?: string;
  // Platform features
  /** ISO 4217 currency code (e.g. "USD", "AUD", "GBP"). Defaults to "USD". */
  currency?: string;
  /** BCP-47 locale used for currency/date formatting (e.g. "en-US", "en-AU"). */
  locale?: string;
  taxRate?: number;
  taxId?: string;
  termsContent?: string;
  calendarSyncEnabled: boolean;
  minNoticeHours: number;
  maxAdvanceDays: number;
  autoReplyEnabled: boolean;
  autoReplyTemplate?: string;
  serviceAreaMode?: 'radius' | 'postcodes';
  radiusKm?: number;
  servicedPostcodes?: string[];
  travelFeeMode?: 'per_km' | 'zone';
  perKmRate?: number;
  travelZones?: { postcodes: string[]; fee: number }[];
  artistType?: OnboardingArtistType;
  workLocation?: OnboardingWorkLocation;
  teamSize?: OnboardingTeamSize;
  bookingChannels?: OnboardingBookingChannel[];
  paymentMethods?: OnboardingPaymentMethod[];
  resolvedPersona?: OnboardingPersona;
  selectedOnboardingActions?: OnboardingActionId[];
  onboardingFollowUps?: OnboardingFollowUps;
  // v2 onboarding: persona slug + raw answers stash so re-running the
  // questionnaire from settings can pre-populate the existing draft.
  persona?: string;
  onboardingAnswers?: {
    persona: string;
    structure: Record<string, string>;
    solutions: string[];
    marketing: string[];
    billing: string[];
    engagement: string[];
  };
  enabledAddons: string[];    // dashboard add-on module IDs
  enabledFeatures: string[];   // toggle-on feature IDs
  // Dev-only override used by /dev to flip the dashboard between owner/staff
  // views without re-authenticating. Real auth populates `member.role` from
  // workspace_members; this is only consulted when there's no real session.
  role?: 'owner' | 'staff';
  updatedAt: string;
}

// ── Platform Feature Types ──────────────────────────

export type BlockKind =
  | 'break'
  | 'cleanup'
  | 'lunch'
  | 'travel'
  | 'prep'
  | 'blocked'
  | 'unavailable'
  | 'admin'
  | 'training'
  | 'personal'
  | 'sick'
  | 'vacation'
  | 'deep_clean'
  | 'delivery'
  | 'holiday'
  | 'custom';

export interface CalendarBlock {
  id: string;
  workspaceId: string;
  teamMemberId?: string;
  kind: BlockKind;
  date: string;               // YYYY-MM-DD (local day of startTime)
  startTime: string;          // ISO timestamp
  endTime: string;            // ISO timestamp
  label?: string;             // optional override of the kind's default label
  reason?: string;            // private note (e.g. "Doctor", "Kids")
  isPrivate: boolean;         // when true, public booking page shows only "Unavailable"
  isRecurring: boolean;
  recurrencePattern?: 'daily' | 'weekdays' | 'weekly' | 'fortnightly' | 'monthly';
  recurrenceEndDate?: string; // YYYY-MM-DD
  color?: string;             // hex override of kind default
  createdAt: string;
  updatedAt: string;
}

export interface ClientTag {
  id: string;
  workspaceId: string;
  name: string;
  color: string;
}

export interface ClientPhoto {
  id: string;
  workspaceId: string;
  clientId: string;
  serviceId?: string;
  bookingId?: string;
  photoUrl: string;
  type: 'before' | 'after';
  createdAt: string;
}

export interface InternalNote {
  id: string;
  workspaceId: string;
  entityType: 'conversation' | 'inquiry' | 'client' | 'booking';
  entityId: string;
  noteText: string;
  authorId?: string;
  createdAt: string;
}

export interface QuestionnaireTemplate {
  id: string;
  workspaceId: string;
  name: string;
  fields: { name: string; type: string; label: string; required: boolean; options?: string[] }[];
  createdAt: string;
  updatedAt: string;
}

export interface QuestionnaireResponse {
  id: string;
  workspaceId: string;
  clientId: string;
  bookingId?: string;
  questionnaireId: string;
  responses: Record<string, string>;
  submittedAt: string;
}

export interface WaitlistEntry {
  id: string;
  workspaceId: string;
  serviceId?: string;
  teamMemberId?: string;
  slotDatetime: string;
  clientName: string;
  clientEmail?: string;
  clientPhone?: string;
  position: number;
  status: 'waiting' | 'notified' | 'confirmed' | 'expired';
  notifiedAt?: string;
  createdAt: string;
}

export interface Refund {
  id: string;
  workspaceId: string;
  paymentDocumentId: string;
  amount: number;
  reason?: string;
  status: 'processed' | 'failed';
  stripeRefundId?: string;
  createdAt: string;
}

// ── Activity Log ────────────────────────────────────

export interface ActivityEntry {
  id: string;
  workspaceId: string;
  type?: string;
  description?: string;
  entityType?: string;
  entityId?: string;
  userId?: string;
  createdAt: string;
}

// ── Gift Cards ──────────────────────────────────────

export type GiftCardStatus = 'active' | 'redeemed' | 'expired' | 'cancelled';

export interface GiftCard {
  id: string;
  workspaceId: string;
  code: string;
  originalAmount: number;
  remainingBalance: number;
  status: GiftCardStatus;
  purchaserName?: string;
  purchaserEmail?: string;
  recipientName?: string;
  recipientEmail?: string;
  expiresAt?: string;
  createdAt: string;
  updatedAt: string;
}

// ── Loyalty & Referrals ─────────────────────────────

export interface LoyaltyConfig {
  pointsPerBooking: number;
  pointsPerDollar: number;
  redemptionThreshold: number; // points needed for $1 off
  enabled: boolean;
}

export interface LoyaltyBalance {
  clientId: string;
  totalEarned: number;
  totalRedeemed: number;
  balance: number;
}

export interface ReferralCode {
  id: string;
  workspaceId: string;
  clientId: string;
  clientName: string;
  code: string;
  referralsMade: number;
  rewardsCredited: number;
  createdAt: string;
}

// ── Proposals ───────────────────────────────────────

export type ProposalStatus = 'draft' | 'sent' | 'viewed' | 'accepted' | 'declined';

export interface ProposalSection {
  id: string;
  type: 'cover' | 'text' | 'services' | 'timeline' | 'gallery' | 'terms' | 'payment';
  title?: string;
  content?: string;
  items?: { description: string; amount: number }[];
  images?: string[];
  sortOrder: number;
}

export interface Proposal {
  id: string;
  workspaceId: string;
  title: string;
  clientId?: string;
  clientName: string;
  status: ProposalStatus;
  sections: ProposalSection[];
  total: number;
  validUntil?: string;
  shareToken: string;
  viewCount: number;
  sentAt?: string;
  viewedAt?: string;
  acceptedAt?: string;
  notes: string;
  createdAt: string;
  updatedAt: string;
}

// ── Memberships ─────────────────────────────────────

export type MembershipStatus = 'active' | 'paused' | 'cancelled' | 'expired';

export interface MembershipPlan {
  id: string;
  workspaceId: string;
  name: string;
  description: string;
  serviceIds: string[];
  sessionsPerPeriod: number;
  price: number;
  billingCycle: 'weekly' | 'monthly';
  enabled: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ClientMembership {
  id: string;
  workspaceId: string;
  clientId: string;
  planId: string;
  status: MembershipStatus;
  sessionsUsed: number;
  currentPeriodStart: string;
  nextRenewalDate?: string;
  createdAt: string;
  updatedAt: string;
}

// ── Documents ───────────────────────────────────────

export type DocumentStatus = 'draft' | 'sent' | 'viewed' | 'signed' | 'expired';

export interface DocumentField {
  id: string;
  type: 'text' | 'checkbox' | 'signature' | 'date';
  label: string;
  required: boolean;
  value?: string;
}

export interface DocumentTemplate {
  id: string;
  workspaceId: string;
  name: string;
  description: string;
  content: string;
  fields: DocumentField[];
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface SentDocument {
  id: string;
  workspaceId: string;
  templateId: string;
  templateName: string;
  clientId: string;
  clientName: string;
  status: DocumentStatus;
  fields: DocumentField[];
  signedAt?: string;
  signatureName?: string;
  sentAt?: string;
  viewedAt?: string;
  createdAt: string;
  updatedAt: string;
}

// ── Calendar Suggestion ─────────────────────────────
//
// Suggestions are operator-facing nudges shown on the Calendar tab's right
// rail. Each suggestion has a deterministic trigger (data condition that
// produced it), a typed action payload (so the UI can render the right
// confirm flow), and a lifecycle (open → snoozed/dismissed/acted/expired).
//
// Generation is pure: a generator takes a workspace snapshot
// (bookings, clients, members, settings) and returns Suggestion rows. The
// store dedupes against existing suggestions via `triggerKey` so re-running
// a generator never produces duplicates for the same situation.

export type SuggestionKind =
  | 'empty_day'           // a working day with low utilisation
  | 'last_minute_gap'     // a hole opening today/tomorrow (cancellation, gap between bookings)
  | 'overdue_rebook'      // clients past their typical rebook window
  | 'no_deposit_risk'     // upcoming bookings missing a deposit on a deposit-required service
  | 'patch_test_due'      // upcoming services that need a fresh patch test
  | 'staff_underbooked'   // one team member is materially less booked than peers
  | 'recurring_lapsed';   // a recurring booking series stopped without an explicit cancel

export type SuggestionPriority = 'low' | 'medium' | 'high' | 'urgent';

export type SuggestionStatus = 'open' | 'snoozed' | 'dismissed' | 'acted' | 'expired';

/**
 * Who a suggestion targets. Resolved at generation time into a concrete
 * client list (`audienceClientIds`) so the operator can preview before
 * acting; the descriptor is kept around for "Why these clients?" copy.
 */
export type SuggestionAudience =
  | { kind: 'past_clients'; lastVisitedFromDays: number; lastVisitedToDays: number }
  | { kind: 'overdue_rebookers'; minDaysOverdue: number; serviceIds?: string[] }
  | { kind: 'specific_clients' }
  | { kind: 'nearby_clients'; postcode?: string; radiusKm?: number }
  | { kind: 'none' };

/**
 * Action payload — drives both the primary CTA copy and the confirm flow.
 * `send_message` never sends directly; the UI must show a preview screen
 * with editable copy and per-client opt-out before dispatch.
 */
export type SuggestionAction =
  | {
      kind: 'send_message';
      channel: 'sms' | 'email' | 'both';
      templateId?: string;
      defaultMessage: string;
      /** Slot date the offer points at, if applicable. */
      slotDate?: string;
      /** Slot time (HH:MM) when the offer is for a specific gap. */
      slotTime?: string;
    }
  | { kind: 'open_calendar'; date: string }
  | { kind: 'open_booking'; bookingId: string }
  | { kind: 'open_clients'; clientIds: string[] }
  | { kind: 'collect_deposit'; bookingId: string };

export interface Suggestion {
  id: string;
  workspaceId: string;
  kind: SuggestionKind;
  priority: SuggestionPriority;
  status: SuggestionStatus;

  // Display
  title: string;          // e.g. "Thu has 5 empty slots"
  body: string;           // e.g. "Send offers to 12 past clients?"

  /**
   * One-sentence summary of why this suggestion fired. Shown next to a
   * "Why?" affordance. Keep it concrete: numbers + the data fact.
   */
  reasonSummary: string;
  /** Optional bullet-list expansion shown when the operator opens "Why?". */
  reasonDetails?: string[];
  /**
   * Numeric/string facts the UI may surface inline (e.g. potentialRevenue,
   * clientCount). Keep keys stable per kind.
   */
  metrics?: Record<string, number | string>;

  // Targeting
  audience: SuggestionAudience;
  /** Concrete client ids resolved at generation time. Capped (typically 50). */
  audienceClientIds?: string[];

  // Action
  primaryAction: SuggestionAction;
  secondaryAction?: SuggestionAction;

  /**
   * Stable dedupe key per workspace, e.g. "empty_day:2026-05-08" or
   * "last_minute_gap:booking_<id>". The store rejects inserts that collide
   * with an existing open/snoozed suggestion's triggerKey.
   */
  triggerKey: string;

  // Lifecycle
  /** ISO — when this suggestion stops being relevant (day passes, booking starts). */
  expiresAt?: string;
  snoozedUntil?: string;
  actedAt?: string;
  /** Foreign-key-ish reference to whatever the action produced (e.g. campaign id). */
  actionResultRef?: string;
  dismissedAt?: string;
  generatedAt: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * Generator interface — every suggestion kind implements this. Generators
 * are pure: same input → same output (modulo `now`). The runner calls each
 * registered generator on a schedule (daily for date-driven kinds) or on
 * an event (booking cancelled → re-run last_minute_gap).
 */
export interface SuggestionGeneratorContext {
  workspaceId: string;
  now: Date;
  bookings: Booking[];
  blocks: CalendarBlock[];
  clients: Client[];
  members: TeamMember[];
  services: Service[];
  settings: WorkspaceSettings;
}

export interface SuggestionGenerator {
  kind: SuggestionKind;
  /** Returns suggestions to upsert. The runner handles dedupe via triggerKey. */
  generate(ctx: SuggestionGeneratorContext): Suggestion[];
}
