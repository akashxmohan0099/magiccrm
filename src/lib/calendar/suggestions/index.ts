import type {
  Suggestion,
  SuggestionGenerator,
  SuggestionGeneratorContext,
} from "@/types/models";
import { emptyDayGenerator } from "./empty-day";
import { lastMinuteGapGenerator } from "./last-minute-gap";
import { overdueRebookGenerator } from "./overdue-rebook";

/**
 * Registered generators, ordered from most-time-sensitive (last-minute) to
 * longer-horizon (overdue rebooks). The runner calls them all and dedupes
 * by triggerKey — generators are responsible for stable, deterministic keys.
 */
export const SUGGESTION_GENERATORS: SuggestionGenerator[] = [
  lastMinuteGapGenerator,
  emptyDayGenerator,
  overdueRebookGenerator,
];

/**
 * Run all registered generators against a workspace snapshot. Pure: same
 * inputs (modulo `now`) → same outputs. Errors from a single generator
 * never break the whole batch — they're logged and that generator's
 * suggestions are skipped.
 */
export function runSuggestions(ctx: SuggestionGeneratorContext): Suggestion[] {
  const seen = new Set<string>();
  const out: Suggestion[] = [];

  for (const gen of SUGGESTION_GENERATORS) {
    let produced: Suggestion[] = [];
    try {
      produced = gen.generate(ctx);
    } catch (err) {
      console.warn(`[suggestions] generator ${gen.kind} failed:`, err);
      continue;
    }

    for (const s of produced) {
      if (seen.has(s.triggerKey)) continue;
      seen.add(s.triggerKey);
      out.push(s);
    }
  }

  return out;
}

export { emptyDayGenerator, lastMinuteGapGenerator, overdueRebookGenerator };
