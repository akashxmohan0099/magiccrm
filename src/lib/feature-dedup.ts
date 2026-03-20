/**
 * Feature deduplication rules.
 *
 * When two modules that overlap are both enabled, one is the "primary"
 * owner and the other hides or defers its version.
 *
 * Each rule: "When module X is enabled, hide feature Y in module Z
 * (because X already handles it)."
 */

export interface FeatureOverride {
  /** Feature ID to hide */
  featureId: string;
  /** Module the feature belongs to */
  inModule: string;
  /** Why it's hidden — shown as a note in the UI */
  reason: string;
  /** Which module handles this instead */
  managedBy: string;
}

interface DeduplicationRule {
  /** This rule applies when ALL of these modules are enabled */
  whenModules: string[];
  /** Features to hide/defer */
  overrides: FeatureOverride[];
}

const RULES: DeduplicationRule[] = [
  // ── Source tracking: Leads captures it, Clients auto-inherits ──
  {
    whenModules: ["leads-pipeline", "client-database"],
    overrides: [
      { featureId: "client-source-tracking", inModule: "client-database", reason: "Auto-filled from lead source when converted", managedBy: "Leads" },
    ],
  },

  // ── Referral: Marketing owns the program, Clients just stores the data ──
  {
    whenModules: ["marketing", "client-database"],
    overrides: [
      { featureId: "client-referral-tracking", inModule: "client-database", reason: "Managed by Marketing's Referral Program", managedBy: "Marketing" },
    ],
  },

  // ── Payment reminders: Payments owns it (always co-enabled with Invoicing) ──
  {
    whenModules: ["quotes-invoicing", "payments"],
    overrides: [
      { featureId: "late-reminders", inModule: "quotes-invoicing", reason: "Configured in Payments → Overdue Reminders", managedBy: "Payments" },
    ],
  },

  // ── Client invoice page: Client Portal supersedes ──
  {
    whenModules: ["quotes-invoicing"],
    overrides: [
      // This one checks for the addon separately
    ],
  },

  // ── Pre-booking form: Intake Forms addon supersedes ──
  // (Handled separately since it checks addon state)

  // ── Auto-reply: Communication owns the engine ──
  {
    whenModules: ["communication", "leads-pipeline"],
    overrides: [
      { featureId: "auto-response", inModule: "leads-pipeline", reason: "Configured in Messages → After-Hours Auto-Reply", managedBy: "Messages" },
    ],
  },

  // ── Activity timeline: Clients is master, Communication is messages-only ──
  {
    whenModules: ["communication", "client-database"],
    overrides: [
      { featureId: "contact-timeline", inModule: "communication", reason: "Included in Clients → Activity Timeline (messages tab)", managedBy: "Clients" },
    ],
  },

  // ── Segmentation: Clients defines segments, Marketing consumes them ──
  {
    whenModules: ["marketing", "client-database"],
    overrides: [
      { featureId: "audience-segmentation", inModule: "marketing", reason: "Uses saved segments from Clients", managedBy: "Clients" },
    ],
  },

  // ── Feedback: Support owns survey engine, Bookings triggers it ──
  {
    whenModules: ["bookings-calendar", "support"],
    overrides: [
      { featureId: "post-appointment-followup", inModule: "bookings-calendar", reason: "Uses Support's satisfaction survey", managedBy: "Support" },
    ],
  },

  // ── File attachments: Documents is the storage, Jobs uses it ──
  {
    whenModules: ["jobs-projects", "documents"],
    overrides: [
      { featureId: "file-attachments", inModule: "jobs-projects", reason: "Stored in Documents (auto-linked to job)", managedBy: "Documents" },
    ],
  },

  // ── Auto-responses in Support defer to Communication ──
  {
    whenModules: ["support", "communication"],
    overrides: [
      { featureId: "auto-responses", inModule: "support", reason: "Configured in Messages → Auto-Reply", managedBy: "Messages" },
    ],
  },
];

/**
 * Addon-specific dedup rules (check addon state separately)
 */
const ADDON_RULES: { whenAddon: string; overrides: FeatureOverride[] }[] = [
  {
    whenAddon: "client-portal",
    overrides: [
      { featureId: "client-invoice-portal", inModule: "quotes-invoicing", reason: "Included in Client Portal add-on", managedBy: "Client Portal" },
    ],
  },
  {
    whenAddon: "intake-forms",
    overrides: [
      { featureId: "pre-booking-form", inModule: "bookings-calendar", reason: "Managed by Forms add-on", managedBy: "Forms" },
    ],
  },
];

/**
 * Given the set of enabled module IDs and addon IDs,
 * return a map of featureId -> override info for features that should be hidden/deferred.
 */
export function getFeatureOverrides(
  enabledModuleIds: string[],
  enabledAddonIds: string[]
): Record<string, FeatureOverride> {
  const result: Record<string, FeatureOverride> = {};
  const moduleSet = new Set(enabledModuleIds);

  for (const rule of RULES) {
    if (rule.whenModules.every((m) => moduleSet.has(m))) {
      for (const override of rule.overrides) {
        result[`${override.inModule}:${override.featureId}`] = override;
      }
    }
  }

  const addonSet = new Set(enabledAddonIds);
  for (const rule of ADDON_RULES) {
    if (addonSet.has(rule.whenAddon)) {
      for (const override of rule.overrides) {
        result[`${override.inModule}:${override.featureId}`] = override;
      }
    }
  }

  return result;
}
