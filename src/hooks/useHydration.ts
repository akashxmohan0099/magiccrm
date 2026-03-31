"use client";

import { useSyncExternalStore } from "react";
import { useOnboardingStore } from "@/store/onboarding";
import { useClientsStore } from "@/store/clients";
import { useBookingsStore } from "@/store/bookings";
import { useInvoicesStore } from "@/store/invoices";
import { useJobsStore } from "@/store/jobs";
import { useLeadsStore } from "@/store/leads";

// All critical stores that must hydrate before rendering
const CRITICAL_STORES = [
  useOnboardingStore,
  useClientsStore,
  useBookingsStore,
  useInvoicesStore,
  useJobsStore,
  useLeadsStore,
];

let forceHydrated = false;

function areCriticalStoresHydrated() {
  return CRITICAL_STORES.every((store) => store.persist.hasHydrated());
}

function getHydrationSnapshot() {
  return forceHydrated || areCriticalStoresHydrated();
}

function subscribeToHydration(onStoreChange: () => void) {
  const unsubs = CRITICAL_STORES.map((store) =>
    store.persist.onFinishHydration(() => {
      onStoreChange();
    }),
  );

  const timeout = setTimeout(() => {
    if (!areCriticalStoresHydrated()) {
      console.warn("[useHydration] Timeout — forcing hydration after 3s");
      forceHydrated = true;
      onStoreChange();
    }
  }, 3000);

  return () => {
    unsubs.forEach((unsub) => {
      if (typeof unsub === "function") unsub();
    });
    clearTimeout(timeout);
  };
}

/**
 * Returns true once all critical Zustand stores have hydrated from localStorage.
 * Includes a 3-second safety timeout to prevent infinite skeleton states.
 */
export function useHydration() {
  return useSyncExternalStore(
    subscribeToHydration,
    getHydrationSnapshot,
    () => false,
  );
}
