// ── Proactive Nudge Engine ────────────────────────────────────
//
// Deterministic, local-first. No API calls. Computes nudges from
// Zustand store snapshots using simple pattern-matching rules.

import type { Client, Booking, Invoice, Lead } from "@/types/models";
import { calculateInvoiceTotal } from "@/store/invoices";

// ── Types ─────────────────────────────────────────────────────

export type NudgeType =
  | "overdue-invoice"
  | "lapsed-client"
  | "unconfirmed-booking"
  | "follow-up-lead"
  | "empty-calendar"
  | "revenue-milestone";

export interface Nudge {
  id: string;
  type: NudgeType;
  priority: number;
  icon: string;
  title: string;
  description: string;
  action?: {
    label: string;
    href?: string;
    onAction?: () => void;
  };
  entityId?: string;
}

export interface NudgeRuleInput {
  invoices: Invoice[];
  clients: Client[];
  bookings: Booking[];
  leads: Lead[];
  clientLookup: Map<string, Client>;
  now: Date;
  today: string;
}

export type NudgeRule = (input: NudgeRuleInput) => Nudge[];

// ── Helpers ───────────────────────────────────────────────────

function daysBetween(dateStr: string, today: string): number {
  const d1 = new Date(dateStr);
  const d2 = new Date(today);
  return Math.floor((d2.getTime() - d1.getTime()) / (1000 * 60 * 60 * 24));
}

function isBusinessDay(date: Date): boolean {
  const day = date.getDay();
  return day !== 0 && day !== 6;
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-AU", { month: "short", day: "numeric" });
}

// ── Rule 1: Overdue Invoice ──────────────────────────────────

export const overdueInvoiceRule: NudgeRule = ({ invoices, clientLookup, today }) => {
  return invoices
    .filter((inv) => inv.status === "sent" && inv.dueDate && inv.dueDate < today)
    .sort((a, b) => (a.dueDate ?? "").localeCompare(b.dueDate ?? ""))
    .slice(0, 3)
    .map((inv) => {
      const client = inv.clientId ? clientLookup.get(inv.clientId) : undefined;
      const { total } = calculateInvoiceTotal(inv);
      const days = daysBetween(inv.dueDate!, today);
      return {
        id: `overdue-invoice:${inv.id}`,
        type: "overdue-invoice" as const,
        priority: 1,
        icon: "AlertCircle",
        title: `Invoice ${inv.number} is overdue`,
        description: `${client?.name ?? "Unknown"} — $${total.toFixed(0)} due ${days} day${days !== 1 ? "s" : ""} ago`,
        action: { label: "View Invoice", href: "/dashboard/invoicing" },
        entityId: inv.id,
      };
    });
};

// ── Rule 2: Lapsed Client ────────────────────────────────────

export const lapsedClientRule: NudgeRule = ({ clients, bookings, today }) => {
  const lastBookingByClient = new Map<string, string>();
  for (const b of bookings) {
    if (!b.clientId || b.status === "cancelled") continue;
    const existing = lastBookingByClient.get(b.clientId);
    if (!existing || b.date > existing) {
      lastBookingByClient.set(b.clientId, b.date);
    }
  }

  return clients
    .filter((c) => c.status === "active")
    .map((c) => {
      const lastDate = lastBookingByClient.get(c.id);
      if (!lastDate) return null;
      const days = daysBetween(lastDate, today);
      if (days < 30) return null;
      return { client: c, days, lastDate };
    })
    .filter(Boolean)
    .sort((a, b) => b!.days - a!.days)
    .slice(0, 3)
    .map((item) => {
      const { client, days, lastDate } = item!;
      return {
        id: `lapsed-client:${client.id}`,
        type: "lapsed-client" as const,
        priority: 2,
        icon: "UserMinus",
        title: `${client.name} hasn't visited in ${days} days`,
        description: `Last booking: ${formatDate(lastDate)}. Consider reaching out.`,
        action: { label: "Rebook", href: "/dashboard/bookings" },
        entityId: client.id,
      };
    });
};

// ── Rule 3: Unconfirmed Booking ──────────────────────────────

export const unconfirmedBookingRule: NudgeRule = ({ bookings, clientLookup, today, now }) => {
  const twoDaysFromNow = new Date(now);
  twoDaysFromNow.setDate(twoDaysFromNow.getDate() + 2);
  const cutoff = twoDaysFromNow.toISOString().split("T")[0];

  return bookings
    .filter((b) => b.status === "pending" && b.date >= today && b.date <= cutoff)
    .sort((a, b) => a.date.localeCompare(b.date) || a.startTime.localeCompare(b.startTime))
    .slice(0, 3)
    .map((b) => {
      const client = b.clientId ? clientLookup.get(b.clientId) : undefined;
      const clientName = client?.name ?? "";
      const dayLabel = b.date === today ? "today" : "tomorrow";
      return {
        id: `unconfirmed-booking:${b.id}`,
        type: "unconfirmed-booking" as const,
        priority: 1,
        icon: "CalendarClock",
        title: `Unconfirmed booking ${dayLabel}`,
        description: `${b.title}${clientName ? ` with ${clientName}` : ""} at ${b.startTime}`,
        action: { label: "Confirm" },
        entityId: b.id,
      };
    });
};

// ── Rule 4: Follow-Up Lead ───────────────────────────────────

const CLOSED_STAGES = new Set(["won", "lost", "closed"]);

export const followUpLeadRule: NudgeRule = ({ leads, today }) => {
  return leads
    .filter((l) => l.nextFollowUpDate && l.nextFollowUpDate <= today && !CLOSED_STAGES.has(l.stage))
    .sort((a, b) => (a.nextFollowUpDate ?? "").localeCompare(b.nextFollowUpDate ?? ""))
    .slice(0, 3)
    .map((l) => ({
      id: `follow-up-lead:${l.id}`,
      type: "follow-up-lead" as const,
      priority: 2,
      icon: "Target",
      title: `Follow up with ${l.name}`,
      description: `Scheduled for ${l.nextFollowUpDate === today ? "today" : formatDate(l.nextFollowUpDate!)}. Stage: ${l.stage}`,
      action: { label: "View Lead", href: "/dashboard/leads" },
      entityId: l.id,
    }));
};

// ── Rule 5: Empty Calendar Day ───────────────────────────────

export const emptyCalendarRule: NudgeRule = ({ bookings, now, today }) => {
  const nudges: Nudge[] = [];
  const check = new Date(now);

  for (let i = 0; i < 7 && nudges.length === 0; i++) {
    check.setDate(check.getDate() + (i === 0 ? 1 : 1));
    if (!isBusinessDay(check)) continue;

    const dateStr = check.toISOString().split("T")[0];
    const dayBookings = bookings.filter((b) => b.date === dateStr && b.status !== "cancelled");

    if (dayBookings.length === 0) {
      const dayName = check.toLocaleDateString("en-AU", { weekday: "long" });
      nudges.push({
        id: `empty-calendar:${dateStr}`,
        type: "empty-calendar",
        priority: 3,
        icon: "CalendarX",
        title: `Your calendar is open on ${dayName}`,
        description: `No appointments scheduled for ${formatDate(dateStr)}.`,
        action: { label: "View Calendar", href: "/dashboard/bookings" },
      });
    }
  }

  return nudges;
};

// ── Rule 6: Revenue Milestone ────────────────────────────────

const MILESTONES = [100000, 50000, 25000, 10000, 5000, 1000];

export const revenueMilestoneRule: NudgeRule = ({ invoices, now }) => {
  const year = now.getFullYear();
  const month = now.getMonth();
  const monthStart = `${year}-${String(month + 1).padStart(2, "0")}-01`;

  let paidCount = 0;
  let paidTotal = 0;

  for (const inv of invoices) {
    if (inv.status !== "paid") continue;
    if (inv.createdAt < monthStart) continue;
    const { total } = calculateInvoiceTotal(inv);
    paidTotal += total;
    paidCount++;
  }

  for (const milestone of MILESTONES) {
    if (paidTotal >= milestone) {
      return [{
        id: `revenue-milestone:${year}-${month}:${milestone}`,
        type: "revenue-milestone" as const,
        priority: 5,
        icon: "Trophy",
        title: `You've hit $${milestone.toLocaleString()} this month!`,
        description: `${paidCount} invoice${paidCount !== 1 ? "s" : ""} paid. Keep it up.`,
      }];
    }
  }

  return [];
};

// ── Registry ──────────────────────────────────────────────────

const NUDGE_RULES: NudgeRule[] = [
  overdueInvoiceRule,
  lapsedClientRule,
  unconfirmedBookingRule,
  followUpLeadRule,
  emptyCalendarRule,
  revenueMilestoneRule,
];

// ── Orchestrator ──────────────────────────────────────────────

const WIDGET_SUPPRESSION: Record<string, NudgeType> = {
  "overdue-invoices": "overdue-invoice",
};

export function computeNudges(
  input: NudgeRuleInput,
  dismissedIds: Set<string>,
  visibleWidgetTypes: Set<string>,
  maxNudges = 3,
): Nudge[] {
  const all: Nudge[] = [];
  for (const rule of NUDGE_RULES) {
    all.push(...rule(input));
  }

  const suppressedTypes = new Set<NudgeType>();
  for (const [widgetType, nudgeType] of Object.entries(WIDGET_SUPPRESSION)) {
    if (visibleWidgetTypes.has(widgetType)) {
      suppressedTypes.add(nudgeType);
    }
  }

  return all
    .filter((n) => !dismissedIds.has(n.id) && !suppressedTypes.has(n.type))
    .sort((a, b) => a.priority - b.priority)
    .slice(0, maxNudges);
}
