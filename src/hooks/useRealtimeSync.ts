"use client";

import { useEffect, useRef } from "react";
import { createClient } from "@/lib/supabase";
import { useClientsStore } from "@/store/clients";
import { useBookingsStore } from "@/store/bookings";
import { useInvoicesStore } from "@/store/invoices";
import { useLeadsStore } from "@/store/leads";
import { useServicesStore } from "@/store/services";

/**
 * Subscribe to Supabase Realtime changes on critical tables.
 * When another user in the same workspace makes a change, the local store
 * is refreshed from the server.
 *
 * This is intentionally coarse-grained: on any change to a subscribed table,
 * we reload the full store. Fine-grained row-level patching adds complexity
 * with minimal UX benefit for the typical team sizes (2-10 users) in beauty/wellness.
 *
 * Call this at the top of the dashboard layout, after initial sync completes.
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

    // Debounce reloads to prevent flooding on bulk operations
    const reloadTimers: Record<string, ReturnType<typeof setTimeout>> = {};
    function debouncedReload(table: string, reloadFn: () => Promise<void>) {
      if (reloadTimers[table]) clearTimeout(reloadTimers[table]);
      reloadTimers[table] = setTimeout(() => {
        reloadFn().catch((err) =>
          console.warn(`[realtime] Failed to reload ${table}:`, err)
        );
      }, 500);
    }

    // Subscribe to changes on critical tables filtered by workspace_id
    const channel = supabase
      .channel(`workspace:${workspaceId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "clients",
          filter: `workspace_id=eq.${workspaceId}`,
        },
        () => debouncedReload("clients", () => useClientsStore.getState().loadFromSupabase(workspaceId))
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "bookings",
          filter: `workspace_id=eq.${workspaceId}`,
        },
        () => debouncedReload("bookings", () => useBookingsStore.getState().loadFromSupabase(workspaceId))
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "invoices",
          filter: `workspace_id=eq.${workspaceId}`,
        },
        () => debouncedReload("invoices", () => useInvoicesStore.getState().loadFromSupabase(workspaceId))
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "leads",
          filter: `workspace_id=eq.${workspaceId}`,
        },
        () => debouncedReload("leads", () => useLeadsStore.getState().loadFromSupabase(workspaceId))
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "services",
          filter: `workspace_id=eq.${workspaceId}`,
        },
        () => debouncedReload("services", () => useServicesStore.getState().loadFromSupabase(workspaceId))
      )
      .subscribe((status: string) => {
        if (status === "SUBSCRIBED") {
          console.log("[realtime] Connected to workspace channel");
        }
        if (status === "CHANNEL_ERROR") {
          console.warn("[realtime] Channel error, will retry automatically");
        }
      });

    channelRef.current = channel;

    return () => {
      // Clear all debounce timers
      Object.values(reloadTimers).forEach(clearTimeout);
      // Unsubscribe
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [workspaceId, enabled]);
}
