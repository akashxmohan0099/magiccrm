import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Suggestion } from "@/types/models";

/**
 * Suggestions are derived state — generators recompute the full list from
 * current bookings/clients/services on every calendar mount. What persists
 * across sessions is the *override* the operator applied to a triggerKey
 * (dismissed / snoozed / acted-on). The view filters generated suggestions
 * by these overrides so a dismissed suggestion stays dismissed even after
 * the generator re-runs.
 *
 * Why not persist the full Suggestion records?
 *   - They include resolved client lists that go stale within hours.
 *   - Re-deriving is cheap and always reflects the current calendar state.
 *   - Persistence noise (snoozedUntil drift, etc.) is much smaller as overrides.
 */

export type SuggestionOverrideStatus = "dismissed" | "snoozed" | "acted";

export interface SuggestionOverride {
  status: SuggestionOverrideStatus;
  at: string;          // ISO when the override was applied
  snoozedUntil?: string;
  actionResultRef?: string;
}

interface SuggestionsState {
  /** Generator output for the current session. Not persisted. */
  generated: Suggestion[];
  /** Persistent operator-applied overrides, keyed by triggerKey. */
  overrides: Record<string, SuggestionOverride>;
  /** ISO of the last successful generator run. */
  lastRanAt: string | null;

  setGenerated: (list: Suggestion[]) => void;
  dismiss: (triggerKey: string) => void;
  snooze: (triggerKey: string, untilIso: string) => void;
  markActed: (triggerKey: string, actionResultRef?: string) => void;
  reopen: (triggerKey: string) => void;
  /** Drop overrides whose snoozedUntil has elapsed. */
  pruneOverrides: () => void;
}

export const useSuggestionsStore = create<SuggestionsState>()(
  persist(
    (set, get) => ({
      generated: [],
      overrides: {},
      lastRanAt: null,

      setGenerated: (list) => {
        set({ generated: list, lastRanAt: new Date().toISOString() });
      },

      dismiss: (triggerKey) => {
        set((s) => ({
          overrides: {
            ...s.overrides,
            [triggerKey]: { status: "dismissed", at: new Date().toISOString() },
          },
        }));
      },

      snooze: (triggerKey, untilIso) => {
        set((s) => ({
          overrides: {
            ...s.overrides,
            [triggerKey]: {
              status: "snoozed",
              at: new Date().toISOString(),
              snoozedUntil: untilIso,
            },
          },
        }));
      },

      markActed: (triggerKey, actionResultRef) => {
        set((s) => ({
          overrides: {
            ...s.overrides,
            [triggerKey]: {
              status: "acted",
              at: new Date().toISOString(),
              actionResultRef,
            },
          },
        }));
      },

      reopen: (triggerKey) => {
        set((s) => {
          const next = { ...s.overrides };
          delete next[triggerKey];
          return { overrides: next };
        });
      },

      pruneOverrides: () => {
        const now = Date.now();
        const overrides = get().overrides;
        const next: Record<string, SuggestionOverride> = {};
        let changed = false;
        for (const [key, ov] of Object.entries(overrides)) {
          if (
            ov.status === "snoozed" &&
            ov.snoozedUntil &&
            new Date(ov.snoozedUntil).getTime() <= now
          ) {
            changed = true;
            continue; // drop — snooze elapsed
          }
          next[key] = ov;
        }
        if (changed) set({ overrides: next });
      },
    }),
    {
      name: "magic-crm-suggestions",
      version: 1,
      // Don't persist the generated list — only operator overrides.
      partialize: (s) => ({ overrides: s.overrides }) as Pick<
        SuggestionsState,
        "overrides"
      >,
    },
  ),
);

/**
 * Derived view: open suggestions only, sorted by priority then generated time.
 * Filters out dismissed, acted, and currently-snoozed suggestions.
 *
 * Signature is narrowed to the two fields the selector reads so callers can
 * construct a partial `{ generated, overrides }` from independent Zustand
 * subscriptions without an `as never` cast.
 */
export function selectActiveSuggestions(
  state: Pick<SuggestionsState, "generated" | "overrides">,
): Suggestion[] {
  const now = Date.now();
  const priorityRank: Record<string, number> = {
    urgent: 0,
    high: 1,
    medium: 2,
    low: 3,
  };
  return state.generated
    .filter((s) => {
      const ov = state.overrides[s.triggerKey];
      if (!ov) return true;
      if (ov.status === "dismissed" || ov.status === "acted") return false;
      if (ov.status === "snoozed") {
        const until = ov.snoozedUntil ? new Date(ov.snoozedUntil).getTime() : 0;
        return until <= now;
      }
      return true;
    })
    .filter((s) => {
      if (!s.expiresAt) return true;
      return new Date(s.expiresAt).getTime() > now;
    })
    .sort((a, b) => {
      const pa = priorityRank[a.priority] ?? 5;
      const pb = priorityRank[b.priority] ?? 5;
      if (pa !== pb) return pa - pb;
      return a.generatedAt < b.generatedAt ? 1 : -1;
    });
}
