/**
 * useFeature stub.
 * The old feature toggle system (onboarding-driven feature selections) was removed.
 * All features are now always enabled.
 */

/** Always returns true -- all features are enabled. */
export function useFeature(_moduleId: string, _featureId: string): boolean {
  return true;
}

/** Always returns true -- all modules are enabled. */
export function useModuleEnabled(_moduleId: string): boolean {
  return true;
}

