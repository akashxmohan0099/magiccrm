"use client";

import { useMemo, useCallback, useState } from "react";
import { useClientsStore } from "@/store/clients";
import { useBookingsStore } from "@/store/bookings";
import { useInvoicesStore } from "@/store/invoices";
import { useLeadsStore } from "@/store/leads";
import { useDashboardStore } from "@/store/dashboard";
import { computeNudges, type NudgeRuleInput, type Nudge } from "@/lib/nudge-engine";

const DISMISSED_KEY = "magic-crm-dismissed-nudges";

function loadDismissed(): Set<string> {
  try {
    const raw = localStorage.getItem(DISMISSED_KEY);
    return raw ? new Set(JSON.parse(raw)) : new Set();
  } catch {
    return new Set();
  }
}

function saveDismissed(set: Set<string>): void {
  localStorage.setItem(DISMISSED_KEY, JSON.stringify([...set]));
}

export function useNudges(): { nudges: Nudge[]; dismiss: (id: string) => void } {
  const clients = useClientsStore((s) => s.clients);
  const bookings = useBookingsStore((s) => s.bookings);
  const invoices = useInvoicesStore((s) => s.invoices);
  const leads = useLeadsStore((s) => s.leads);
  const widgets = useDashboardStore((s) => s.widgets);

  const [dismissed, setDismissed] = useState<Set<string>>(() => loadDismissed());

  const visibleWidgetTypes = useMemo(
    () => new Set(widgets.map((w) => w.type)),
    [widgets],
  );

  const clientLookup = useMemo(
    () => new Map(clients.map((c) => [c.id, c])),
    [clients],
  );

  const nudges = useMemo(() => {
    const now = new Date();
    const today = now.toISOString().split("T")[0];
    const input: NudgeRuleInput = {
      invoices,
      clients,
      bookings,
      leads,
      clientLookup,
      now,
      today,
    };
    const computed = computeNudges(input, dismissed, visibleWidgetTypes);

    // Enrich unconfirmed-booking nudges with inline confirm action
    return computed.map((n) => {
      if (n.type === "unconfirmed-booking" && n.entityId) {
        const bookingId = n.entityId;
        return {
          ...n,
          action: {
            ...n.action!,
            onAction: () => {
              useBookingsStore.getState().updateBooking(bookingId, {
                status: "confirmed",
                updatedAt: new Date().toISOString(),
              });
            },
          },
        };
      }
      return n;
    });
  }, [invoices, clients, bookings, leads, clientLookup, dismissed, visibleWidgetTypes]);

  const dismiss = useCallback((nudgeId: string) => {
    setDismissed((prev) => {
      const next = new Set(prev);
      next.add(nudgeId);
      saveDismissed(next);
      return next;
    });
  }, []);

  return { nudges, dismiss };
}
