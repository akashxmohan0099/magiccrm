import type { IndustryAdaptiveConfig, IndustryAdaptiveOverride, VocabularyMap, ModuleFieldGroups, InvoiceModeConfig, BookingModeConfig, DashboardWidgetConfig } from "@/types/industry-config";
import { genericConfig } from "./generic";
import { beautyWellnessConfig, beautyPersonaOverrides } from "./beauty-wellness";

/** Registry mapping industry IDs → configs */
const INDUSTRY_CONFIG_MAP: Record<string, IndustryAdaptiveConfig> = {
  "beauty-wellness": beautyWellnessConfig,
};

/** Registry mapping industry IDs → persona override maps */
const PERSONA_OVERRIDE_MAP: Record<string, Record<string, IndustryAdaptiveOverride>> = {
  "beauty-wellness": beautyPersonaOverrides,
};

/** Deep-merge a partial override onto a full config */
function applyOverride(base: IndustryAdaptiveConfig, override: IndustryAdaptiveOverride): IndustryAdaptiveConfig {
  const result = { ...base };

  if (override.vocabulary) {
    result.vocabulary = { ...base.vocabulary, ...override.vocabulary } as VocabularyMap;
  }
  if (override.customFields) {
    const mergedClients = [
      ...(base.customFields.clients ?? []),
      ...(override.customFields?.clients ?? []),
    ];
    const mergedJobs = [
      ...(base.customFields.jobs ?? []),
      ...(override.customFields?.jobs ?? []),
    ];
    const mergedBookings = [
      ...(base.customFields.bookings ?? []),
      ...(override.customFields?.bookings ?? []),
    ];
    // Deduplicate by field id — override fields win on conflict
    const dedup = <T extends { id: string }>(arr: T[]): T[] => {
      const map = new Map<string, T>();
      for (const item of arr) map.set(item.id, item);
      return Array.from(map.values());
    };
    result.customFields = {
      clients: dedup(mergedClients),
      jobs: dedup(mergedJobs),
      bookings: dedup(mergedBookings),
    } as ModuleFieldGroups;
  }
  if (override.relationships) {
    result.relationships = override.relationships;
  }
  if (override.jobStages) {
    result.jobStages = override.jobStages;
  }
  if (override.leadStages) {
    result.leadStages = override.leadStages;
  }
  if (override.invoiceMode) {
    result.invoiceMode = { ...base.invoiceMode, ...override.invoiceMode } as InvoiceModeConfig;
  }
  if (override.bookingMode) {
    result.bookingMode = { ...base.bookingMode, ...override.bookingMode } as BookingModeConfig;
  }
  if (override.dashboard) {
    result.dashboard = { ...base.dashboard, ...override.dashboard } as DashboardWidgetConfig;
  }

  return result;
}

/**
 * Resolve the full industry adaptive config.
 * Deep-merges: generic → industry → persona overrides.
 */
export function getIndustryAdaptiveConfig(
  industryId?: string,
  personaId?: string
): IndustryAdaptiveConfig {
  // Start with generic
  if (!industryId || !INDUSTRY_CONFIG_MAP[industryId]) {
    return genericConfig;
  }

  // Get industry config (already a complete config, not a partial)
  let config = INDUSTRY_CONFIG_MAP[industryId];

  // Apply persona overrides if present
  if (personaId) {
    const personaOverrides = PERSONA_OVERRIDE_MAP[industryId];
    if (personaOverrides && personaOverrides[personaId]) {
      config = applyOverride(config, personaOverrides[personaId]);
    }
  }

  return config;
}

export { genericConfig };
