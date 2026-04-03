/**
 * Local Follow-up Questions
 *
 * Deterministic questions triggered by specific chip selections in BubblesStep.
 * These run in Step 5 (AIQuestionsStep) BEFORE AI-generated questions.
 *
 * Same chip selections → same local questions every time.
 * AI then fills the gaps without duplicating these topics.
 *
 * Rules for adding questions here:
 * - Only ask when the bubble answer is a "partial yes" that needs refining
 * - If a chip clearly enables a whole module, don't ask — just enable it
 * - Keep to 1-2 follow-ups per chip at most
 */

export interface LocalFollowUpQuestion {
  id: string;
  triggerChipId: string;
  question: string;
  moduleId: string;
  enables: {
    featureId: string;
    action: "auto" | "recommend";
  }[];
  followUp?: {
    condition: "yes";
    question: string;
    enables: {
      featureId: string;
      action: "auto" | "recommend";
    }[];
    /** Arbitrary metadata stored in discoveryAnswers when answered yes */
    metaKey?: string;
  };
}

export const LOCAL_FOLLOWUP_QUESTIONS: LocalFollowUpQuestion[] = [
  // ── Travel ──────────────────────────────────────────
  {
    id: "travel-charge",
    triggerChipId: "visit-clients",
    question: "Do you add a travel fee to your pricing?",
    moduleId: "quotes-invoicing",
    enables: [
      { featureId: "travel-costs", action: "auto" },
    ],
    followUp: {
      condition: "yes",
      question: "Should we calculate travel cost based on distance?",
      enables: [
        { featureId: "travel-costs", action: "auto" },
      ],
      metaKey: "travel-costs:distance-mode",
    },
  },

  // ── Memberships / Session Packs ─────────────────────
  {
    id: "memberships-packs",
    triggerChipId: "memberships",
    question: "Do clients prepay for a set number of sessions?",
    moduleId: "client-database",
    enables: [
      { featureId: "client-credit-balance", action: "auto" },
    ],
  },

  // ── Deposits ────────────────────────────────────────
  {
    id: "deposits-auto",
    triggerChipId: "deposits",
    question: "Should deposits be added automatically when clients book?",
    moduleId: "bookings-calendar",
    enables: [
      { featureId: "booking-deposits", action: "auto" },
    ],
  },

  // ── Team Services ───────────────────────────────────
  {
    id: "team-services",
    triggerChipId: "op-team",
    question: "Do different team members specialise in different services?",
    moduleId: "team",
    enables: [
      { featureId: "availability-per-member", action: "auto" },
    ],
  },

  // ── Aftercare ───────────────────────────────────────
  {
    id: "aftercare-auto",
    triggerChipId: "aftercare",
    question: "Should aftercare instructions be sent automatically after each appointment?",
    moduleId: "bookings-calendar",
    enables: [
      { featureId: "booking-reminders", action: "auto" },
    ],
  },

  // ── Bridal parties ──────────────────────────────────
  {
    id: "bridal-party-size",
    triggerChipId: "bridal-parties",
    question: "Do you need to track each person in the party separately?",
    moduleId: "bookings-calendar",
    enables: [
      { featureId: "group-class-booking", action: "auto" },
    ],
  },

  // ── Patch tests ─────────────────────────────────────
  {
    id: "patch-test-auto",
    triggerChipId: "patch-tests",
    question: "Should we automatically schedule a patch test before a new client's first appointment?",
    moduleId: "bookings-calendar",
    enables: [
      { featureId: "pre-booking-form", action: "auto" },
    ],
  },
];

/**
 * Returns the local follow-up questions that should be shown,
 * based on which chips the user selected in BubblesStep.
 */
export function getLocalFollowUps(chipSelections: string[]): LocalFollowUpQuestion[] {
  const chipSet = new Set(chipSelections);
  return LOCAL_FOLLOWUP_QUESTIONS.filter((q) => chipSet.has(q.triggerChipId));
}
