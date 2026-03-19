"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import { useOnboardingStore } from "@/store/onboarding";

// Track if we've confirmed hydration across all mounts
let globalHydrated = false;

function subscribe(callback: () => void) {
  // Subscribe to onboarding store's persist hydration
  const unsub = useOnboardingStore.persist.onFinishHydration(callback);
  return typeof unsub === "function" ? unsub : () => {};
}

function getSnapshot() {
  if (globalHydrated) return true;
  if (typeof window === "undefined") return false;
  // Check if the critical store has finished hydrating
  const hydrated = useOnboardingStore.persist.hasHydrated();
  if (hydrated) globalHydrated = true;
  return hydrated;
}

function getServerSnapshot() {
  return false;
}

export function useHydration() {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
