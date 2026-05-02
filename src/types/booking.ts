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
