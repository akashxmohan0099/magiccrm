import { useIndustryConfig } from "./useIndustryConfig";
import type { VocabularyMap } from "@/types/industry-config";

/** Convenience hook returning just the vocabulary map. */
export function useVocabulary(): VocabularyMap {
  return useIndustryConfig().vocabulary;
}
