import type {
  Booking,
  Suggestion,
  SuggestionGenerator,
  SuggestionGeneratorContext,
} from "@/types/models";
import { generateId } from "@/lib/id";
import { lastVisitByClient, rebookCadence, todayString } from "./_helpers";

/**
 * Overdue rebook: clients past the rebook cadence for the last service
 * they booked. Cadence is per-service (`Service.rebookAfterDays`); falls
 * back to 42 days when not set. We bucket by overdue tier so the operator
 * sees one card with an action that scopes the audience.
 *
 * Tiers:
 *   - 1–14 days overdue → "due this week"  (gentle nudge)
 *   - 15–60 days overdue → "more than a month overdue"  (bigger pool)
 *   - 60+ days → "lapsed" (long-tail, optional)
 *
 * One suggestion per non-empty tier, capped at 30 client ids each.
 */

const TIERS = [
  { id: "due_now", label: "due this week", minOverdue: 1, maxOverdue: 14, priority: "high" as const },
  { id: "month_plus", label: "over a month overdue", minOverdue: 15, maxOverdue: 60, priority: "medium" as const },
  { id: "lapsed", label: "lapsed (60+ days)", minOverdue: 61, maxOverdue: 365, priority: "low" as const },
];

const CAP_PER_TIER = 30;

interface ClientOverdue {
  clientId: string;
  daysOverdue: number;
  lastBooking: Booking;
  serviceId?: string;
}

export const overdueRebookGenerator: SuggestionGenerator = {
  kind: "overdue_rebook",
  generate(ctx: SuggestionGeneratorContext): Suggestion[] {
    const lastVisit = lastVisitByClient(ctx.bookings);
    const servicesById = new Map(ctx.services.map((s) => [s.id, s]));
    const generatedAt = ctx.now.toISOString();
    const nowMs = ctx.now.getTime();

    // Compute days-overdue per client.
    const overdue: ClientOverdue[] = [];
    for (const client of ctx.clients) {
      const v = lastVisit.get(client.id);
      if (!v) continue;

      const cadence = rebookCadence(v.serviceId ? servicesById.get(v.serviceId) : undefined);
      const daysSince = Math.floor((nowMs - new Date(v.startAt).getTime()) / 86400000);
      const daysOverdue = daysSince - cadence;
      if (daysOverdue < 1) continue;

      // Skip clients with a future booking already on the calendar — not overdue.
      const hasFuture = ctx.bookings.some(
        (b) =>
          b.clientId === client.id &&
          b.status !== "cancelled" &&
          new Date(b.startAt).getTime() > nowMs,
      );
      if (hasFuture) continue;

      overdue.push({
        clientId: client.id,
        daysOverdue,
        lastBooking: v,
        serviceId: v.serviceId,
      });
    }

    if (!overdue.length) return [];

    // Bucket by tier, sort by most-overdue within each tier so the longest
    // gaps surface first.
    const out: Suggestion[] = [];
    for (const tier of TIERS) {
      const inTier = overdue
        .filter((o) => o.daysOverdue >= tier.minOverdue && o.daysOverdue <= tier.maxOverdue)
        .sort((a, b) => b.daysOverdue - a.daysOverdue)
        .slice(0, CAP_PER_TIER);
      if (!inTier.length) continue;

      const count = inTier.length;
      const medianOverdue = inTier[Math.floor(inTier.length / 2)].daysOverdue;

      out.push({
        id: generateId(),
        workspaceId: ctx.workspaceId,
        kind: "overdue_rebook",
        priority: tier.priority,
        status: "open",
        title: `${count} client${count === 1 ? "" : "s"} ${tier.label}`,
        body: `Send rebook reminder${count === 1 ? "" : "s"}?`,
        reasonSummary: `${count} client${count === 1 ? " is" : "s are"} past their typical rebook window (median ${medianOverdue} days over).`,
        reasonDetails: [
          `Cadence is per-service when set (Service.rebookAfterDays), otherwise defaults to 42 days.`,
          `Tier window: ${tier.minOverdue}–${tier.maxOverdue} days overdue.`,
          `Clients with a future booking already on the calendar are excluded.`,
        ],
        metrics: {
          tier: tier.id,
          clientCount: count,
          medianDaysOverdue: medianOverdue,
        },
        audience: {
          kind: "overdue_rebookers",
          minDaysOverdue: tier.minOverdue,
        },
        audienceClientIds: inTier.map((o) => o.clientId),
        primaryAction: {
          kind: "send_message",
          channel: "sms",
          defaultMessage:
            `Hi {first_name} — it's been a while! Want me to find a time for your next appointment? Reply with a day that works.`,
        },
        secondaryAction: {
          kind: "open_clients",
          clientIds: inTier.map((o) => o.clientId),
        },
        triggerKey: `overdue_rebook:${tier.id}`,
        // Refresh daily; expire end of today so a fresh run tomorrow rebuilds.
        // Use the workspace-local "today" — toISOString().slice(0,10)
        // returns UTC and would expire the suggestion a day early in the
        // operator's evening (or birth it already-expired).
        expiresAt: `${todayString(ctx.now)}T23:59:59`,
        generatedAt,
        createdAt: generatedAt,
        updatedAt: generatedAt,
      });
    }

    return out;
  },
};
