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
  // Triggered by the universal "visit-clients" chip.
  // The chip already enables bookings-calendar and jobs-projects.
  // This follow-up refines whether they CHARGE for travel.
  {
    id: "travel-charge",
    triggerChipId: "visit-clients",
    question: "Do you charge clients for travel?",
    moduleId: "quotes-invoicing",
    enables: [
      { featureId: "travel-costs", action: "auto" },
    ],
    followUp: {
      condition: "yes",
      question: "Should travel be calculated based on distance from your base?",
      enables: [
        { featureId: "travel-costs", action: "auto" },
      ],
      metaKey: "travel-costs:distance-mode",
    },
  },

  // ── Memberships / Session Packs ─────────────────────
  // The "memberships" chip activates the automations module.
  // This follow-up determines if they need prepaid credit tracking.
  {
    id: "memberships-packs",
    triggerChipId: "memberships",
    question: "Do you sell session packs with a set number of visits?",
    moduleId: "client-database",
    enables: [
      { featureId: "client-credit-balance", action: "auto" },
    ],
  },

  // ── Deposits ────────────────────────────────────────
  // The "deposits" chip (industry-specific add) activates automations.
  // This follow-up determines if auto-calculation is wanted.
  {
    id: "deposits-auto",
    triggerChipId: "deposits",
    question: "Do you want the deposit amount calculated automatically?",
    moduleId: "bookings-calendar",
    enables: [
      { featureId: "booking-deposits", action: "auto" },
    ],
  },

  // ── Team Services ───────────────────────────────────
  // The "team" chip activates the team module.
  // This follow-up determines if members have different service menus.
  {
    id: "team-services",
    triggerChipId: "team",
    question: "Do different team members offer different services?",
    moduleId: "team",
    enables: [
      { featureId: "availability-per-member", action: "auto" },
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
