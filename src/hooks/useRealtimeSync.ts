"use client";

import { useEffect, useRef } from "react";
import { createClient } from "@/lib/supabase";
import { useClientsStore } from "@/store/clients";
import { useBookingsStore } from "@/store/bookings";
import { useServicesStore } from "@/store/services";
import { usePaymentsStore } from "@/store/payments";
import { useInquiriesStore } from "@/store/inquiries";
import { useCommunicationStore } from "@/store/communication";

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
      .on("postgres_changes", { event: "*", schema: "public", table: "services", filter: `workspace_id=eq.${workspaceId}` },
        () => debouncedReload("services", () => useServicesStore.getState().loadFromSupabase(workspaceId)))
      .on("postgres_changes", { event: "*", schema: "public", table: "payment_documents", filter: `workspace_id=eq.${workspaceId}` },
        () => debouncedReload("payments", () => usePaymentsStore.getState().loadFromSupabase(workspaceId)))
      .on("postgres_changes", { event: "*", schema: "public", table: "inquiries", filter: `workspace_id=eq.${workspaceId}` },
        () => debouncedReload("inquiries", () => useInquiriesStore.getState().loadFromSupabase(workspaceId)))
      .on("postgres_changes", { event: "*", schema: "public", table: "conversations", filter: `workspace_id=eq.${workspaceId}` },
        () => debouncedReload("conversations", () => useCommunicationStore.getState().loadFromSupabase(workspaceId)))
      .on("postgres_changes", { event: "*", schema: "public", table: "messages", filter: `workspace_id=eq.${workspaceId}` },
        () => debouncedReload("messages", () => useCommunicationStore.getState().loadFromSupabase(workspaceId)))
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
