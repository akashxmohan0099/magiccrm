import type {
  Suggestion,
  SuggestionGenerator,
  SuggestionGeneratorContext,
} from "@/types/models";
import { generateId } from "@/lib/id";
import { computeUtilization } from "../utilization";
import { todayString, addDays, lastVisitByClient, pickTopClients } from "./_helpers";

/**
 * Empty-day suggestion: a working day in the next ~7 days whose utilisation
 * is materially below the workspace's typical fill rate. Targets past
 * clients whose most recent visit was 4–10 weeks ago — i.e. people likely
 * to need a return appointment but who haven't booked yet.
 *
 * Triggered daily by the runner. Trigger key is per-date so re-running
 * doesn't duplicate, but the same date will recreate the suggestion the
 * next morning if still empty.
 */

// Open-slot threshold based on absolute unbooked minutes ÷ avg service
// duration. Aggregated `filledPct` masks multi-staff days where one artist
// is fully booked and another is empty — the salon could still take 4+
// bookings but the day reads "50% full" and gets skipped.
const MIN_OPEN_SLOTS = 2;
const HORIZON_DAYS = 7;
const AUDIENCE_LAST_VISIT_FROM_DAYS = 28; // 4 weeks
const AUDIENCE_LAST_VISIT_TO_DAYS = 70;   // 10 weeks
const AUDIENCE_CAP = 25;

export const emptyDayGenerator: SuggestionGenerator = {
  kind: "empty_day",
  generate(ctx: SuggestionGeneratorContext): Suggestion[] {
    const today = todayString(ctx.now);
    const horizonEnd = addDays(today, HORIZON_DAYS);

    const utilisation = computeUtilization({
      startDate: today,
      endDate: horizonEnd,
      workspaceWorkingHours: ctx.settings.workingHours ?? {},
      members: ctx.members,
      bookings: ctx.bookings,
      blocks: ctx.blocks,
      services: ctx.services,
    });

    if (!utilisation.perDay.length) return [];

    // Build the audience once — clients whose last visit fell in the window.
    const lastVisit = lastVisitByClient(ctx.bookings);
    const eligibleClients = ctx.clients.filter((client) => {
      const visit = lastVisit.get(client.id);
      if (!visit) return false; // never visited → not a "past" client
      const daysAgo = Math.floor(
        (ctx.now.getTime() - new Date(visit.startAt).getTime()) / 86400000,
      );
      return (
        daysAgo >= AUDIENCE_LAST_VISIT_FROM_DAYS &&
        daysAgo <= AUDIENCE_LAST_VISIT_TO_DAYS
      );
    });

    const top = pickTopClients(eligibleClients, lastVisit, AUDIENCE_CAP);
    if (!top.length) return [];

    const suggestions: Suggestion[] = [];
    const generatedAt = ctx.now.toISOString();

    const avg = utilisation.avgServiceDurationMin || 60;

    for (const day of utilisation.perDay) {
      // Today's already in flight — operators can't fill backwards.
      if (day.date === today) continue;
      // Skip closed days.
      if (day.bookableMinutes === 0) continue;

      const openMinutes = Math.max(0, day.bookableMinutes - day.bookedMinutes);
      const openSlots = Math.floor(openMinutes / avg);
      // Need at least N service slots of headroom to bother offering.
      if (openSlots < MIN_OPEN_SLOTS) continue;

      const weekday = new Date(`${day.date}T00:00:00`).toLocaleDateString(
        "en-US",
        { weekday: "long" },
      );

      suggestions.push({
        id: generateId(),
        workspaceId: ctx.workspaceId,
        kind: "empty_day",
        priority: day.bookedMinutes === 0 ? "high" : "medium",
        status: "open",
        title: `${weekday} has ${openSlots} open slot${openSlots === 1 ? "" : "s"}`,
        body: `Send a last-minute offer to ${top.length} past client${top.length === 1 ? "" : "s"}?`,
        reasonSummary: `${weekday} has ${openMinutes} unbooked minute${openMinutes === 1 ? "" : "s"} (${day.bookedMinutes} of ${day.bookableMinutes} booked).`,
        reasonDetails: [
          `Audience: clients whose last visit was ${AUDIENCE_LAST_VISIT_FROM_DAYS}–${AUDIENCE_LAST_VISIT_TO_DAYS} days ago.`,
          `${top.length} client${top.length === 1 ? "" : "s"} match the window.`,
          `Threshold: at least ${MIN_OPEN_SLOTS} service-length slots open (uses avg booked duration of ${avg}min).`,
        ],
        metrics: {
          date: day.date,
          openSlots,
          openMinutes,
          audienceCount: top.length,
        },
        audience: {
          kind: "past_clients",
          lastVisitedFromDays: AUDIENCE_LAST_VISIT_FROM_DAYS,
          lastVisitedToDays: AUDIENCE_LAST_VISIT_TO_DAYS,
        },
        audienceClientIds: top.map((c) => c.id),
        primaryAction: {
          kind: "send_message",
          channel: "sms",
          defaultMessage: `Hi {first_name} — we have a last-minute opening on ${weekday}. Want to book in? Reply YES and I'll lock in a time.`,
          slotDate: day.date,
        },
        secondaryAction: {
          kind: "open_calendar",
          date: day.date,
        },
        triggerKey: `empty_day:${day.date}`,
        // Suggestion stops being relevant at end-of-day on the target date.
        expiresAt: `${day.date}T23:59:59`,
        generatedAt,
        createdAt: generatedAt,
        updatedAt: generatedAt,
      });
    }

    return suggestions;
  },
};
