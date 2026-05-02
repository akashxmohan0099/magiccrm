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

import type { Booking } from './booking';
import type { CalendarBlock } from './calendar';
import type { Client } from './client';
import type { TeamMember } from './team';
import type { Service } from './service';
import type { WorkspaceSettings } from './workspace';

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
