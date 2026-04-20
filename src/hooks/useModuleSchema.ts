/**
 * useModuleSchema stub.
 * The old schema assembly system was removed.
 * Returns a minimal object so legacy components that read schema labels don't crash.
 */
export function useModuleSchema(_moduleId: string) {
  return {
    label: null as string | null,
    description: null as string | null,
    icon: null as string | null,
    statusLabels: {} as Record<string, string>,
    fieldLabels: {} as Record<string, string>,
    get: (key: string, fallback?: string) => fallback ?? key,
  };
}
