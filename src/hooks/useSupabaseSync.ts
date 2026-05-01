"use client";

import { useEffect, useRef, useState } from "react";
import { useClientsStore } from "@/store/clients";
import { useBookingsStore } from "@/store/bookings";
import { useServicesStore } from "@/store/services";
import { useCommunicationStore } from "@/store/communication";
import { useTeamStore } from "@/store/team";
import { useInquiriesStore } from "@/store/inquiries";
import { usePaymentsStore } from "@/store/payments";
import { useMarketingStore } from "@/store/marketing";
import { useAutomationsStore } from "@/store/automations";
import { useFormsStore } from "@/store/forms";
import { useFormResponsesStore } from "@/store/form-responses";
import { useSettingsStore } from "@/store/settings";
import { useCalendarBlocksStore } from "@/store/calendar-blocks";
import { useLocationsStore } from "@/store/locations";
import { useResourcesStore } from "@/store/resources";
import { useTreatmentNotesStore } from "@/store/treatment-notes";
import { useMembershipsStore } from "@/store/memberships";
import { useGiftCardStore } from "@/store/gift-cards";

/**
 * Loads workspace data from Supabase once auth is ready.
 * Call this at the top of the dashboard layout.
 */
export function useSupabaseSync({
  workspaceId,
  authLoading,
}: {
  workspaceId: string | null;
  authLoading: boolean;
}) {
  const syncedForWorkspace = useRef<string | null>(null);
  const [syncing, setSyncing] = useState(true);

  useEffect(() => {
    if (authLoading) return;

    if (!workspaceId) {
      syncedForWorkspace.current = null;
      const timeout = setTimeout(() => setSyncing(false), 0);
      return () => clearTimeout(timeout);
    }

    // Skip Supabase sync if no real connection configured
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    if (!supabaseUrl || supabaseUrl.includes("placeholder") || supabaseUrl === "https://your-project.supabase.co") {
      syncedForWorkspace.current = workspaceId;
      const t = setTimeout(() => setSyncing(false), 0);
      return () => clearTimeout(t);
    }

    if (syncedForWorkspace.current === workspaceId) return;

    const loaders = [
      ["clients", () => useClientsStore.getState().loadFromSupabase(workspaceId)],
      ["bookings", () => useBookingsStore.getState().loadFromSupabase(workspaceId)],
      ["calendar-blocks", () => useCalendarBlocksStore.getState().loadFromSupabase(workspaceId)],
      ["services", () => useServicesStore.getState().loadFromSupabase(workspaceId)],
      ["communication", () => useCommunicationStore.getState().loadFromSupabase(workspaceId)],
      ["team", () => useTeamStore.getState().loadFromSupabase(workspaceId)],
      ["inquiries", () => useInquiriesStore.getState().loadFromSupabase(workspaceId)],
      ["payments", () => usePaymentsStore.getState().loadFromSupabase(workspaceId)],
      ["marketing", () => useMarketingStore.getState().loadFromSupabase(workspaceId)],
      ["automations", () => useAutomationsStore.getState().loadFromSupabase(workspaceId)],
      ["forms", () => useFormsStore.getState().loadFromSupabase(workspaceId)],
      ["form-responses", () => useFormResponsesStore.getState().loadFromSupabase(workspaceId)],
      ["settings", () => useSettingsStore.getState().loadFromSupabase(workspaceId)],
      ["locations", () => useLocationsStore.getState().loadFromSupabase(workspaceId)],
      ["resources", () => useResourcesStore.getState().loadFromSupabase(workspaceId)],
      ["treatment-notes", () => useTreatmentNotesStore.getState().loadFromSupabase(workspaceId)],
      ["memberships", () => useMembershipsStore.getState().loadFromSupabase(workspaceId)],
      ["gift-cards", () => useGiftCardStore.getState().loadFromSupabase(workspaceId)],
    ] as const;

    const sync = async () => {
      setSyncing(true);

      const results = await Promise.allSettled(loaders.map(([, load]) => load()));
      const failures = results.flatMap((result, index) =>
        result.status === "rejected"
          ? [{ store: loaders[index][0], reason: result.reason }]
          : []
      );

      if (failures.length > 0 && process.env.NODE_ENV === "development") {
        console.debug("[useSupabaseSync] Some stores failed (using local data):", failures.map((f) => f.store).join(", "));
      }

      syncedForWorkspace.current = workspaceId;
      setSyncing(false);
    };

    sync().catch(() => {
      setSyncing(false);
    });
  }, [authLoading, workspaceId]);

  return { syncing: authLoading || (!!workspaceId && syncing) };
}
