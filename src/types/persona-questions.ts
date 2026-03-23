/**
 * Persona-specific onboarding question system.
 *
 * Each persona gets tailored yes/no discovery questions that decide which
 * modules are enabled. The questions use the persona's vocabulary and
 * map to specific modules/features.
 */

export interface DiscoveryQuestion {
  /** Unique ID for this question */
  id: string;
  /** The yes/no question text in persona vocabulary */
  text: string;
  /** Brief subtitle explaining what this means */
  subtitle: string;
  /** Which NeedsAssessment key this maps to (if any) */
  needsKey?: keyof import("./onboarding").NeedsAssessment;
  /** Module IDs that get activated when answered "yes" */
  activatesModules: string[];
  /** Sub-features that default to ON when this question is "yes" */
  defaultOnFeatures: { moduleId: string; featureId: string }[];
}

export interface PersonaFeatureVisibility {
  /** Modules completely hidden from this persona (not relevant to their work) */
  hiddenModules: string[];
  /** Specific sub-features hidden from this persona */
  hiddenFeatures: { moduleId: string; featureId: string }[];
  /** Add-on modules hidden from this persona */
  hiddenAddons: string[];
}

export interface PersonaQuestionConfig {
  /** Persona ID — must match the persona.id in IndustryConfig */
  personaId: string;
  /** Ordered list of discovery questions */
  questions: DiscoveryQuestion[];
  /** Which features/modules to hide entirely for this persona */
  visibility: PersonaFeatureVisibility;
  /** Default communication channels for this persona */
  defaultChannels: string[];
}

/**
 * Master config keyed by personaId.
 * Used by the onboarding flow to render persona-specific questions.
 */
export type PersonaQuestionsMap = Record<string, PersonaQuestionConfig>;
