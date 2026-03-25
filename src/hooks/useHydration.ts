"use client";

import { useEffect, useState } from "react";
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

/**
 * Returns true once all critical Zustand stores have hydrated from localStorage.
 * Includes a 3-second safety timeout to prevent infinite skeleton states.
 */
export function useHydration() {
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    // Check if already hydrated
    const check = () => CRITICAL_STORES.every((store) => store.persist.hasHydrated());

    if (check()) {
      setHydrated(true);
      return;
    }

    // Listen for hydration completion
    const unsubs = CRITICAL_STORES.map((store) =>
      store.persist.onFinishHydration(() => {
        if (check()) setHydrated(true);
      })
    );

    // Safety timeout — don't hang forever if a store fails to hydrate
    const timeout = setTimeout(() => {
      if (!check()) {
        console.warn("[useHydration] Timeout — forcing hydration after 3s");
      }
      setHydrated(true);
    }, 3000);

    return () => {
      unsubs.forEach((unsub) => {
        if (typeof unsub === "function") unsub();
      });
      clearTimeout(timeout);
    };
  }, []);

  return hydrated;
}
