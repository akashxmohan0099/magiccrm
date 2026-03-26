// ── Module Combination Registry ─────────────────────────────
//
// Pre-tested, validated module combinations. The AI (Kimi) selects
// from this registry — it never invents new combinations on the fly.
//
// Each combination merges 2+ modules into a single sidebar entry
// with a tabbed "smart hybrid" UI: tabs + cross-reference badges.
//
// Invariant: functional schema is NEVER changed by combinations.
// Only sidebar, routing, and presentation are affected.

// ── Types ────────────────────────────────────────────────────

export interface CombinationTab {
  id: string;
  label: string;
  /** Which module's page component to render inside this tab */
  moduleId: string;
}

export interface CrossReference {
  /** Which tab shows the cross-reference */
  fromTab: string;
  /** Which module provides the data */
  dataSource: string;
  /** How to display it */
  display: "badge" | "inline-row";
  /** Human-readable label (e.g., "Payment status") */
  label: string;
}

export interface CombinationApplicability {
  /** If specified, only these industries can use this combination */
  industries?: string[];
  /** If specified, only these personas can use this combination */
  personas?: string[];
  /** All of these modules must be enabled for this combination to apply */
  requiresModules: string[];
  /** Mutually exclusive combinations (e.g., book-pay conflicts with schedule-jobs) */
  conflictsWithCombinations?: string[];
}

export interface ModuleCombination {
  /** Unique identifier */
  id: string;
  /** Default display label (AI may override with persona-specific name) */
  defaultLabel: string;
  /** Lucide icon name */
  icon: string;
  /** Default description (AI may override) */
  defaultDescription: string;
  /** Route slug for the combined page */
  slug: string;
  /** Module IDs that get merged into this combined view */
  mergedModuleIds: string[];
  /** The primary module (determines insert position in sidebar) */
  primaryModuleId: string;
  /** Tab definitions for the combined page */
  tabs: CombinationTab[];
  /** Smart hybrid cross-references between tabs */
  crossReferences: CrossReference[];
  /** When this combination is applicable */
  applicableTo: CombinationApplicability;
  /** Semantic tags for AI reasoning when selecting combinations */
  semanticTags: string[];
}

// ── Registry ─────────────────────────────────────────────────

export const MODULE_COMBINATIONS: ModuleCombination[] = [
  // ── Book & Pay ──────────────────────────────────────────
  // For booking-first personas who don't send quotes.
  // They book, they pay, they're done.
  {
    id: "book-pay",
    defaultLabel: "Book & Pay",
    icon: "Calendar",
    defaultDescription: "Schedule appointments and collect payments in one place.",
    slug: "book-pay",
    mergedModuleIds: ["bookings-calendar", "quotes-invoicing"],
    primaryModuleId: "bookings-calendar",
    tabs: [
      { id: "schedule", label: "Schedule", moduleId: "bookings-calendar" },
      { id: "payments", label: "Payments", moduleId: "quotes-invoicing" },
    ],
    crossReferences: [
      {
        fromTab: "schedule",
        dataSource: "quotes-invoicing",
        display: "badge",
        label: "Payment status",
      },
      {
        fromTab: "payments",
        dataSource: "bookings-calendar",
        display: "badge",
        label: "Next booking",
      },
    ],
    applicableTo: {
      industries: [
        "beauty-wellness",
        "health-fitness",
        "education-coaching",
      ],
      requiresModules: ["bookings-calendar", "quotes-invoicing"],
      conflictsWithCombinations: ["schedule-jobs"],
    },
    semanticTags: [
      "booking-first",
      "no-quotes",
      "appointment-based",
      "service-provider",
      "pay-at-visit",
    ],
  },

  // ── Schedule & Jobs ─────────────────────────────────────
  // For personas that schedule work and track it as projects.
  // Calendar for when, jobs for progress.
  {
    id: "schedule-jobs",
    defaultLabel: "Schedule & Jobs",
    icon: "Calendar",
    defaultDescription: "Plan your calendar and track job progress together.",
    slug: "schedule-jobs",
    mergedModuleIds: ["bookings-calendar", "jobs-projects"],
    primaryModuleId: "bookings-calendar",
    tabs: [
      { id: "calendar", label: "Calendar", moduleId: "bookings-calendar" },
      { id: "jobs", label: "Jobs", moduleId: "jobs-projects" },
    ],
    crossReferences: [
      {
        fromTab: "calendar",
        dataSource: "jobs-projects",
        display: "badge",
        label: "Job status",
      },
      {
        fromTab: "jobs",
        dataSource: "bookings-calendar",
        display: "badge",
        label: "Scheduled date",
      },
    ],
    applicableTo: {
      industries: [
        "trades-construction",
        "creative-services",
        "hospitality-events",
      ],
      personas: [
        "cleaner",
        "photographer",
        "videographer",
        "event-planner",
        "wedding-planner",
        "florist",
      ],
      requiresModules: ["bookings-calendar", "jobs-projects"],
      conflictsWithCombinations: ["book-pay"],
    },
    semanticTags: [
      "schedule-work",
      "project-tracking",
      "field-service",
      "event-based",
      "multi-day-work",
    ],
  },
];

// ── Lookup Functions ─────────────────────────────────────────

/** Get all combinations applicable to a given industry/persona with the given enabled modules. */
export function getApplicableCombinations(
  industryId: string,
  personaId: string,
  enabledModuleIds: string[],
): ModuleCombination[] {
  const enabledSet = new Set(enabledModuleIds);

  return MODULE_COMBINATIONS.filter((combo) => {
    // All required modules must be enabled
    if (!combo.applicableTo.requiresModules.every((m) => enabledSet.has(m))) {
      return false;
    }

    // Industry filter (if specified)
    if (
      combo.applicableTo.industries &&
      !combo.applicableTo.industries.includes(industryId)
    ) {
      return false;
    }

    // Persona filter (if specified, at least one must match)
    if (
      combo.applicableTo.personas &&
      !combo.applicableTo.personas.includes(personaId)
    ) {
      return false;
    }

    return true;
  });
}

/** Get a combination by its ID. */
export function getCombinationById(
  id: string,
): ModuleCombination | undefined {
  return MODULE_COMBINATIONS.find((c) => c.id === id);
}

/** Get a combination by its route slug. */
export function getCombinationBySlug(
  slug: string,
): ModuleCombination | undefined {
  return MODULE_COMBINATIONS.find((c) => c.slug === slug);
}

/** Check if two combinations conflict with each other. */
export function combinationsConflict(
  aId: string,
  bId: string,
): boolean {
  const a = getCombinationById(aId);
  if (!a) return false;
  return a.applicableTo.conflictsWithCombinations?.includes(bId) ?? false;
}

