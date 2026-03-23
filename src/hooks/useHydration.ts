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

function subscribe(callback: () => void) {
  const unsubs = CRITICAL_STORES.map((store) =>
    store.persist.onFinishHydration(callback)
  );
  return () => {
    unsubs.forEach((unsub) => {
      if (typeof unsub === "function") unsub();
    });
  };
}

function getSnapshot() {
  if (typeof window === "undefined") return false;
  return CRITICAL_STORES.every((store) =>
    store.persist.hasHydrated()
  );
}

function getServerSnapshot() {
  return false;
}

export function useHydration() {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
