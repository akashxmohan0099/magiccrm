import type { IndustryAdaptiveConfig, IndustryAdaptiveOverride, VocabularyMap, ModuleFieldGroups, InvoiceModeConfig, BookingModeConfig, DashboardWidgetConfig } from "@/types/industry-config";
import { genericConfig } from "./generic";
import { beautyWellnessConfig, beautyPersonaOverrides } from "./beauty-wellness";
import { tradesConstructionConfig } from "./trades-construction";
import { professionalServicesConfig, professionalPersonaOverrides } from "./professional-services";
import { healthFitnessConfig, healthFitnessPersonaOverrides } from "./health-fitness";
import { creativeServicesConfig, creativePersonaOverrides } from "./creative-services";
import { hospitalityEventsConfig, hospitalityPersonaOverrides } from "./hospitality-events";
import { educationCoachingConfig, educationPersonaOverrides } from "./education-coaching";
import { retailEcommerceConfig } from "./retail-ecommerce";

/** Registry mapping industry IDs → configs */
const INDUSTRY_CONFIG_MAP: Record<string, IndustryAdaptiveConfig> = {
  "beauty-wellness": beautyWellnessConfig,
  "trades-construction": tradesConstructionConfig,
  "professional-services": professionalServicesConfig,
  "health-fitness": healthFitnessConfig,
  "creative-services": creativeServicesConfig,
  "hospitality-events": hospitalityEventsConfig,
  "education-coaching": educationCoachingConfig,
  "retail-ecommerce": retailEcommerceConfig,
};

/** Registry mapping industry IDs → persona override maps */
const PERSONA_OVERRIDE_MAP: Record<string, Record<string, IndustryAdaptiveOverride>> = {
  "beauty-wellness": beautyPersonaOverrides,
  "creative-services": creativePersonaOverrides,
  "hospitality-events": hospitalityPersonaOverrides,
  "professional-services": professionalPersonaOverrides,
  "health-fitness": healthFitnessPersonaOverrides,
  "education-coaching": educationPersonaOverrides,
};

/** Deep-merge a partial override onto a full config */
function applyOverride(base: IndustryAdaptiveConfig, override: IndustryAdaptiveOverride): IndustryAdaptiveConfig {
  const result = { ...base };

  if (override.vocabulary) {
    result.vocabulary = { ...base.vocabulary, ...override.vocabulary } as VocabularyMap;
  }
  if (override.customFields) {
    result.customFields = {
      clients: override.customFields.clients ?? base.customFields.clients,
      jobs: override.customFields.jobs ?? base.customFields.jobs,
      bookings: override.customFields.bookings ?? base.customFields.bookings,
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
