"use client";

import { useEffect, useRef, useState } from "react";
import { useOnboardingStore } from "@/store/onboarding";
import { useDashboardStore } from "@/store/dashboard";
import { useAddonsStore } from "@/store/addons";
import { useClientsStore } from "@/store/clients";
import { useBookingsStore } from "@/store/bookings";
import { useJobsStore } from "@/store/jobs";
import { useLeadsStore } from "@/store/leads";
import { useServicesStore } from "@/store/services";
import { useProductsStore } from "@/store/products";
import { useInvoicesStore } from "@/store/invoices";
import { usePaymentsStore } from "@/store/payments";
import { useCommunicationStore } from "@/store/communication";
import { useDocumentsStore } from "@/store/documents";
import { useProposalsStore } from "@/store/proposals";
import { useTeamStore } from "@/store/team";
import { useSupportStore } from "@/store/support";

import { useActivityStore } from "@/store/activity";
import { useRemindersStore } from "@/store/reminders";
import { useDiscussionsStore } from "@/store/discussions";
import { useAutomationsStore } from "@/store/automations";
import { useMarketingStore } from "@/store/marketing";

import { useLoyaltyStore } from "@/store/loyalty";
import { useMembershipsStore } from "@/store/memberships";
import { useGiftCardStore } from "@/store/gift-cards";
import { useSOAPNotesStore } from "@/store/soap-notes";
import { useBeforeAfterStore } from "@/store/before-after";
import { useIntakeFormsStore } from "@/store/intake-forms";
import { useWinBackStore } from "@/store/win-back";
import { useWaitlistStore } from "@/store/waitlist";
import { useRebookingStore } from "@/store/rebooking";
import { useClassTimetableStore } from "@/store/class-timetable";
import { useVendorManagementStore } from "@/store/vendor-management";
import { useStorefrontStore } from "@/store/storefront";
import { useClientPortalStore } from "@/store/client-portal";
import { useBrandSettingsStore } from "@/store/brand-settings";

/**
 * Loads workspace data from Supabase once auth is ready.
 * Call this at the top of the dashboard layout.
 *
 * - Waits for auth loading to finish
 * - On first load with a valid workspaceId, hydrates all stores
 * - Retries failed loads instead of permanently marking the workspace as synced
 */
export function useSupabaseSync({
  workspaceId,
  authLoading,
}: {
  workspaceId: string | null;
  authLoading: boolean;
}) {
  const syncedForWorkspace = useRef<string | null>(null);
  const retryTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [syncing, setSyncing] = useState(true);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    if (authLoading) return;

    if (!workspaceId) {
      syncedForWorkspace.current = null;
      const timeout = setTimeout(() => setSyncing(false), 0);
      return () => clearTimeout(timeout);
    }

    if (syncedForWorkspace.current === workspaceId) return;

    const loaders = [
      ["onboarding", () => useOnboardingStore.getState().loadFromSupabase(workspaceId)],
      ["dashboard", () => useDashboardStore.getState().loadFromSupabase(workspaceId)],
      ["addons", () => useAddonsStore.getState().loadFromSupabase(workspaceId)],
      ["clients", () => useClientsStore.getState().loadFromSupabase(workspaceId)],
      ["bookings", () => useBookingsStore.getState().loadFromSupabase(workspaceId)],
      ["jobs", () => useJobsStore.getState().loadFromSupabase(workspaceId)],
      ["leads", () => useLeadsStore.getState().loadFromSupabase(workspaceId)],
      ["services", () => useServicesStore.getState().loadFromSupabase(workspaceId)],
      ["products", () => useProductsStore.getState().loadFromSupabase(workspaceId)],
      ["invoices", () => useInvoicesStore.getState().loadFromSupabase(workspaceId)],
      ["payments", () => usePaymentsStore.getState().loadFromSupabase(workspaceId)],
      ["communication", () => useCommunicationStore.getState().loadFromSupabase(workspaceId)],
      ["documents", () => useDocumentsStore.getState().loadFromSupabase(workspaceId)],
      ["proposals", () => useProposalsStore.getState().loadFromSupabase(workspaceId)],
      ["team", () => useTeamStore.getState().loadFromSupabase(workspaceId)],
      ["support", () => useSupportStore.getState().loadFromSupabase(workspaceId)],
      ["activity", () => useActivityStore.getState().loadFromSupabase(workspaceId)],
      ["reminders", () => useRemindersStore.getState().loadFromSupabase(workspaceId)],
      ["discussions", () => useDiscussionsStore.getState().loadFromSupabase(workspaceId)],
      ["automations", () => useAutomationsStore.getState().loadFromSupabase(workspaceId)],
      ["marketing", () => useMarketingStore.getState().loadFromSupabase(workspaceId)],
      ["loyalty", () => useLoyaltyStore.getState().loadFromSupabase(workspaceId)],
      ["memberships", () => useMembershipsStore.getState().loadFromSupabase(workspaceId)],
      ["gift-cards", () => useGiftCardStore.getState().loadFromSupabase(workspaceId)],
      ["soap-notes", () => useSOAPNotesStore.getState().loadFromSupabase(workspaceId)],
      ["before-after", () => useBeforeAfterStore.getState().loadFromSupabase(workspaceId)],
      ["intake-forms", () => useIntakeFormsStore.getState().loadFromSupabase(workspaceId)],
      ["win-back", () => useWinBackStore.getState().loadFromSupabase(workspaceId)],
      ["waitlist", () => useWaitlistStore.getState().loadFromSupabase(workspaceId)],
      ["rebooking", () => useRebookingStore.getState().loadFromSupabase(workspaceId)],
      ["class-timetable", () => useClassTimetableStore.getState().loadFromSupabase(workspaceId)],
      ["vendor-management", () => useVendorManagementStore.getState().loadFromSupabase(workspaceId)],
      ["storefront", () => useStorefrontStore.getState().loadFromSupabase(workspaceId)],
      ["client-portal", () => useClientPortalStore.getState().loadFromSupabase(workspaceId)],
      ["brand-settings", () => useBrandSettingsStore.getState().loadFromSupabase(workspaceId)],
    ] as const;

    const sync = async () => {
      if (attempt === 0) {
        setSyncing(true);
      }

      const results = await Promise.allSettled(loaders.map(([, load]) => load()));
      const failures = results.flatMap((result, index) =>
        result.status === "rejected"
          ? [{ store: loaders[index][0], reason: result.reason }]
          : []
      );

      if (failures.length > 0) {
        console.error("[useSupabaseSync] failed:", failures);
        setSyncing(false);
        retryTimeout.current = setTimeout(() => {
          setAttempt((current) => current + 1);
        }, 5000);
        return;
      }

      syncedForWorkspace.current = workspaceId;
      setSyncing(false);
    };

    sync().catch((err) => {
      console.error("[useSupabaseSync] failed:", err);
      setSyncing(false);
      retryTimeout.current = setTimeout(() => {
        setAttempt((current) => current + 1);
      }, 5000);
    });

    return () => {
      if (retryTimeout.current) {
        clearTimeout(retryTimeout.current);
        retryTimeout.current = null;
      }
    };
  }, [attempt, authLoading, workspaceId]);

  return { syncing: authLoading || (!!workspaceId && syncing) };
}
