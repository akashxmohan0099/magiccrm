"use client";

import { useEffect, useRef } from "react";
import { createClient } from "@/lib/supabase";
import { useClientsStore } from "@/store/clients";
import { useBookingsStore } from "@/store/bookings";
import { useCalendarBlocksStore } from "@/store/calendar-blocks";
import { useServicesStore } from "@/store/services";
import { usePaymentsStore } from "@/store/payments";
import { useInquiriesStore } from "@/store/inquiries";
import { useFormResponsesStore } from "@/store/form-responses";
import { useCommunicationStore } from "@/store/communication";
import { useLocationsStore } from "@/store/locations";
import { useResourcesStore } from "@/store/resources";
import { useMembershipsStore } from "@/store/memberships";
import { useGiftCardStore } from "@/store/gift-cards";

/**
 * Subscribe to Supabase Realtime changes on critical tables.
 * On any change to a subscribed table, reload the full store.
 */
export function useRealtimeSync({
  workspaceId,
  enabled,
}: {
  workspaceId: string | null;
  enabled: boolean;
}) {
  const channelRef = useRef<ReturnType<ReturnType<typeof createClient>["channel"]> | null>(null);

  useEffect(() => {
    if (!workspaceId || !enabled) return;

    const supabase = createClient();

    const reloadTimers: Record<string, ReturnType<typeof setTimeout>> = {};
    function debouncedReload(table: string, reloadFn: () => Promise<void>) {
      if (reloadTimers[table]) clearTimeout(reloadTimers[table]);
      reloadTimers[table] = setTimeout(() => {
        reloadFn().catch((err) =>
          console.warn(`[realtime] Failed to reload ${table}:`, err)
        );
      }, 500);
    }

    const channel = supabase
      .channel(`workspace:${workspaceId}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "clients", filter: `workspace_id=eq.${workspaceId}` },
        () => debouncedReload("clients", () => useClientsStore.getState().loadFromSupabase(workspaceId)))
      .on("postgres_changes", { event: "*", schema: "public", table: "bookings", filter: `workspace_id=eq.${workspaceId}` },
        () => debouncedReload("bookings", () => useBookingsStore.getState().loadFromSupabase(workspaceId)))
      .on("postgres_changes", { event: "*", schema: "public", table: "calendar_blocks", filter: `workspace_id=eq.${workspaceId}` },
        () => debouncedReload("calendar_blocks", () => useCalendarBlocksStore.getState().loadFromSupabase(workspaceId)))
      .on("postgres_changes", { event: "*", schema: "public", table: "services", filter: `workspace_id=eq.${workspaceId}` },
        () => debouncedReload("services", () => useServicesStore.getState().loadFromSupabase(workspaceId)))
      .on("postgres_changes", { event: "*", schema: "public", table: "payment_documents", filter: `workspace_id=eq.${workspaceId}` },
        () => debouncedReload("payments", () => usePaymentsStore.getState().loadFromSupabase(workspaceId)))
      .on("postgres_changes", { event: "*", schema: "public", table: "inquiries", filter: `workspace_id=eq.${workspaceId}` },
        () => debouncedReload("inquiries", () => useInquiriesStore.getState().loadFromSupabase(workspaceId)))
      .on("postgres_changes", { event: "*", schema: "public", table: "form_responses", filter: `workspace_id=eq.${workspaceId}` },
        () => debouncedReload("form_responses", () => useFormResponsesStore.getState().loadFromSupabase(workspaceId)))
      .on("postgres_changes", { event: "*", schema: "public", table: "conversations", filter: `workspace_id=eq.${workspaceId}` },
        () => debouncedReload("conversations", () => useCommunicationStore.getState().loadFromSupabase(workspaceId)))
      .on("postgres_changes", { event: "*", schema: "public", table: "messages", filter: `workspace_id=eq.${workspaceId}` },
        () => debouncedReload("messages", () => useCommunicationStore.getState().loadFromSupabase(workspaceId)))
      // Service taxonomy + per-staff overrides + library add-ons all live in
      // the services store. Reloading once on any of them refreshes every
      // dependent slice.
      .on("postgres_changes", { event: "*", schema: "public", table: "service_categories", filter: `workspace_id=eq.${workspaceId}` },
        () => debouncedReload("services", () => useServicesStore.getState().loadFromSupabase(workspaceId)))
      .on("postgres_changes", { event: "*", schema: "public", table: "library_addons", filter: `workspace_id=eq.${workspaceId}` },
        () => debouncedReload("services", () => useServicesStore.getState().loadFromSupabase(workspaceId)))
      .on("postgres_changes", { event: "*", schema: "public", table: "member_services", filter: `workspace_id=eq.${workspaceId}` },
        () => debouncedReload("services", () => useServicesStore.getState().loadFromSupabase(workspaceId)))
      .on("postgres_changes", { event: "*", schema: "public", table: "locations", filter: `workspace_id=eq.${workspaceId}` },
        () => debouncedReload("locations", () => useLocationsStore.getState().loadFromSupabase(workspaceId)))
      .on("postgres_changes", { event: "*", schema: "public", table: "resources", filter: `workspace_id=eq.${workspaceId}` },
        () => debouncedReload("resources", () => useResourcesStore.getState().loadFromSupabase(workspaceId)))
      .on("postgres_changes", { event: "*", schema: "public", table: "membership_plans", filter: `workspace_id=eq.${workspaceId}` },
        () => debouncedReload("memberships", () => useMembershipsStore.getState().loadFromSupabase(workspaceId)))
      .on("postgres_changes", { event: "*", schema: "public", table: "client_memberships", filter: `workspace_id=eq.${workspaceId}` },
        () => debouncedReload("memberships", () => useMembershipsStore.getState().loadFromSupabase(workspaceId)))
      .on("postgres_changes", { event: "*", schema: "public", table: "gift_cards", filter: `workspace_id=eq.${workspaceId}` },
        () => debouncedReload("gift_cards", () => useGiftCardStore.getState().loadFromSupabase(workspaceId)))
      .subscribe((status: string) => {
        if (status === "SUBSCRIBED") {
          console.debug("[realtime] Connected to workspace channel");
        }
      });

    channelRef.current = channel;

    return () => {
      Object.values(reloadTimers).forEach(clearTimeout);
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [workspaceId, enabled]);
}
