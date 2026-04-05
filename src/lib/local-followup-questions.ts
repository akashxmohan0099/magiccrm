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
  {
    id: "travel-fee",
    triggerChipId: "op-mobile",
    question: "Do you charge a travel fee?",
    moduleId: "quotes-invoicing",
    enables: [
      { featureId: "travel-costs", action: "auto" },
    ],
  },
  {
    id: "deposit-percent",
    triggerChipId: "deposits",
    question: "Should deposits be added automatically when clients book?",
    moduleId: "bookings-calendar",
    enables: [
      { featureId: "booking-deposits", action: "auto" },
    ],
  },
  {
    id: "bridal-vs-everyday",
    triggerChipId: "bridal-wedding",
    question: "Do you have separate pricing for bridal vs everyday bookings?",
    moduleId: "products",
    enables: [
      { featureId: "service-categories", action: "auto" },
    ],
  },
  {
    id: "client-questionnaire",
    triggerChipId: "inquire-first",
    question: "Do you want clients to fill out a questionnaire before booking?",
    moduleId: "bookings-calendar",
    enables: [
      { featureId: "pre-booking-form", action: "auto" },
    ],
  },
  {
    id: "team-roster",
    triggerChipId: "op-team",
    question: "Would you like to manage team availability and rosters on the platform?",
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
