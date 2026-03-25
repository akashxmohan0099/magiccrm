/**
 * Deep-dive question bank for onboarding sub-feature configuration.
 *
 * Each question maps conversational asks to specific sub-feature IDs.
 * The AI only rewords these — selection is deterministic via weighted scoring.
 *
 * Auto-enable rule: only if feature is reversible, immediately understandable,
 * does not affect money/routing/policy, and requires no additional setup.
 */

export interface DeepDiveQuestion {
  id: string;
  moduleId: string;
  question: string;
  enables: {
    featureId: string;
    action: "auto" | "recommend";
  }[];
  requiresModules: string[];
  relevantTo?: string[];       // industry IDs where especially relevant
  excludeFrom?: string[];      // industry IDs where irrelevant
  weight: number;              // base weight for scoring (1-5)
  /** Skip this question if any of these local follow-up IDs were already asked in Step 5 */
  skipIfLocalAsked?: string[];
  followUp?: {
    condition: "yes";
    question: string;
    enables: { featureId: string; action: "auto" | "recommend" }[];
  };
}

// Modules that skip deep-dive (use defaults, configure from dashboard)
export const DEEP_DIVE_SKIP_MODULES = new Set(["automations", "reporting"]);

// ── Question Bank ──────────────────────────────────────────

export const DEEP_DIVE_QUESTIONS: DeepDiveQuestion[] = [
  // ── bookings-calendar ──────────────────────────────────
  {
    id: "bookings-recurring",
    moduleId: "bookings-calendar",
    question: "Do clients rebook on a regular cycle?",
    enables: [
      { featureId: "recurring-bookings", action: "auto" },
      { featureId: "rebooking-prompts", action: "recommend" },
    ],
    requiresModules: ["bookings-calendar"],
    relevantTo: ["beauty-wellness", "health-fitness"],
    weight: 5,
  },
  {
    id: "bookings-no-show",
    moduleId: "bookings-calendar",
    question: "Do you need to protect against no-shows?",
    enables: [
      { featureId: "booking-deposits", action: "auto" },
    ],
    requiresModules: ["bookings-calendar"],
    weight: 4,
    followUp: {
      condition: "yes",
      question: "Should clients fill out a form before booking?",
      enables: [{ featureId: "pre-booking-form", action: "auto" }],
    },
  },
  {
    id: "bookings-travel",
    moduleId: "bookings-calendar",
    question: "Do you travel between appointments?",
    enables: [
      { featureId: "travel-time", action: "auto" },
      { featureId: "buffer-time", action: "auto" },
    ],
    requiresModules: ["bookings-calendar"],
    skipIfLocalAsked: ["travel-charge"],
    relevantTo: ["trades-construction", "health-fitness", "education-coaching"],
    excludeFrom: ["hospitality-events"],
    weight: 4,
  },
  {
    id: "bookings-group",
    moduleId: "bookings-calendar",
    question: "Do you run group sessions or classes?",
    enables: [
      { featureId: "group-class-booking", action: "auto" },
      { featureId: "waitlist", action: "recommend" },
    ],
    requiresModules: ["bookings-calendar"],
    relevantTo: ["health-fitness", "education-coaching"],
    excludeFrom: ["trades-construction", "professional-services"],
    weight: 4,
  },

  // ── quotes-invoicing ───────────────────────────────────
  {
    id: "billing-quotes",
    moduleId: "quotes-invoicing",
    question: "Do you send quotes before starting work?",
    enables: [
      { featureId: "quote-builder", action: "auto" },
      { featureId: "quote-to-invoice", action: "auto" },
    ],
    requiresModules: [],  // always-on module
    relevantTo: ["trades-construction", "creative-services", "professional-services"],
    excludeFrom: ["beauty-wellness"],
    weight: 5,
  },
  {
    id: "billing-recurring",
    moduleId: "quotes-invoicing",
    question: "Do you bill on a recurring schedule?",
    enables: [
      { featureId: "recurring-invoices", action: "auto" },
    ],
    requiresModules: [],
    relevantTo: ["professional-services", "education-coaching"],
    weight: 4,
  },
  {
    id: "billing-proposals",
    moduleId: "quotes-invoicing",
    question: "Do you create branded proposals?",
    enables: [
      { featureId: "proposals", action: "auto" },
      { featureId: "proposal-e-signature", action: "recommend" },
    ],
    requiresModules: [],
    relevantTo: ["creative-services", "professional-services", "hospitality-events"],
    excludeFrom: ["beauty-wellness", "health-fitness"],
    weight: 3,
  },

  // ── jobs-projects ──────────────────────────────────────
  {
    id: "projects-time",
    moduleId: "jobs-projects",
    question: "Do you track hours on jobs?",
    enables: [
      { featureId: "time-tracking", action: "auto" },
    ],
    requiresModules: ["jobs-projects"],
    weight: 5,
  },
  {
    id: "projects-expenses",
    moduleId: "jobs-projects",
    question: "Do you track materials or expenses?",
    enables: [
      { featureId: "expense-tracking", action: "auto" },
    ],
    requiresModules: ["jobs-projects"],
    relevantTo: ["trades-construction", "creative-services", "hospitality-events"],
    weight: 4,
    followUp: {
      condition: "yes",
      question: "Want to see profit per job?",
      enables: [{ featureId: "profitability-summary", action: "recommend" }],
    },
  },
  {
    id: "projects-templates",
    moduleId: "jobs-projects",
    question: "Do you reuse similar job setups?",
    enables: [
      { featureId: "job-templates", action: "auto" },
      { featureId: "recurring-jobs", action: "recommend" },
    ],
    requiresModules: ["jobs-projects"],
    weight: 3,
  },

  // ── communication (channel picker — handled specially in UI) ──
  {
    id: "comms-channels",
    moduleId: "communication",
    question: "WHERE_DO_CLIENTS_MESSAGE_YOU",  // Sentinel — UI renders channel picker instead
    enables: [],  // Mapped dynamically based on channel selection
    requiresModules: [],
    weight: 5,
  },
  {
    id: "comms-templates",
    moduleId: "communication",
    question: "Do you want saved reply templates?",
    enables: [
      { featureId: "canned-responses", action: "auto" },
    ],
    requiresModules: [],
    weight: 3,
  },

  // ── team ───────────────────────────────────────────────
  {
    id: "team-availability",
    moduleId: "team",
    question: "Do team members work different hours?",
    enables: [
      { featureId: "availability-per-member", action: "auto" },
    ],
    requiresModules: ["team"],
    weight: 4,
  },
  {
    id: "team-task-delegation",
    moduleId: "jobs-projects",
    question: "Do you delegate tasks to team members on jobs?",
    enables: [
      { featureId: "task-delegation", action: "auto" },
    ],
    requiresModules: ["jobs-projects", "team"],
    weight: 3,
  },

  // ── client-database ────────────────────────────────────
  {
    id: "clients-source",
    moduleId: "client-database",
    question: "Do you want to track how each client found you?",
    enables: [
      { featureId: "client-source-tracking", action: "auto" },
    ],
    requiresModules: [],
    weight: 3,
  },
  {
    id: "clients-credit",
    moduleId: "client-database",
    question: "Do clients carry prepaid credit or packages?",
    enables: [
      { featureId: "client-credit-balance", action: "auto" },
    ],
    requiresModules: [],
    relevantTo: ["beauty-wellness", "health-fitness", "education-coaching"],
    weight: 3,
  },

  // ── products ───────────────────────────────────────────
  {
    id: "products-inventory",
    moduleId: "products",
    question: "Do you track stock or inventory?",
    enables: [
      { featureId: "inventory-tracking", action: "auto" },
    ],
    requiresModules: ["products"],
    weight: 4,
  },
];

// ── Channel picker config (used by ConfigureStep UI) ─────

export interface ChannelOption {
  id: string;           // matches sub-feature ID in communication block
  label: string;
  icon: string;         // lucide icon name
}

export const CHANNEL_OPTIONS: ChannelOption[] = [
  { id: "email", label: "Email", icon: "Mail" },
  { id: "sms", label: "SMS", icon: "MessageSquare" },
  { id: "whatsapp", label: "WhatsApp", icon: "MessageCircle" },
  { id: "instagram-dms", label: "Instagram", icon: "Instagram" },
  { id: "facebook-messenger", label: "Messenger", icon: "Facebook" },
  { id: "linkedin", label: "LinkedIn", icon: "Linkedin" },
];

// ── Selection function (weighted scoring) ────────────────

export function selectQuestionsForUser(
  enabledModules: string[],
  industry: string,
  chipSelections: string[],
  /** IDs of local follow-up questions already asked in Step 5. Questions with
   *  matching skipIfLocalAsked entries are excluded to avoid duplication. */
  answeredLocalIds?: string[],
): DeepDiveQuestion[] {
  const enabledSet = new Set(enabledModules);
  const localSet = new Set(answeredLocalIds || []);

  // Filter: must have ALL required modules enabled, not excluded for this industry,
  // and not already covered by a local follow-up question in Step 5
  const candidates = DEEP_DIVE_QUESTIONS.filter((q) => {
    if (DEEP_DIVE_SKIP_MODULES.has(q.moduleId)) return false;
    if (q.requiresModules.length > 0 && !q.requiresModules.every((m) => enabledSet.has(m))) return false;
    if (q.excludeFrom?.includes(industry)) return false;
    if (q.skipIfLocalAsked?.some((id) => localSet.has(id))) return false;
    return true;
  });

  // Score each question
  const scored = candidates.map((q) => {
    let score = q.weight;

    // +2 if industry explicitly in relevantTo
    if (q.relevantTo?.includes(industry)) score += 2;

    // +1 if the module was directly activated by a chip (not just auto-enabled)
    if (enabledSet.has(q.moduleId)) score += 1;

    return { question: q, score };
  });

  // Sort by score descending
  scored.sort((a, b) => b.score - a.score);

  // Deduplicate: max 2 questions per module, max 8 total
  const selected: DeepDiveQuestion[] = [];
  const moduleCount: Record<string, number> = {};

  for (const { question } of scored) {
    if (selected.length >= 8) break;
    const count = moduleCount[question.moduleId] ?? 0;
    if (count >= 2) continue;
    selected.push(question);
    moduleCount[question.moduleId] = count + 1;
  }

  return selected;
}
