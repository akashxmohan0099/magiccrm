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

// ── "Features you might look for" ──
// When viewing Module X, show features from OTHER modules that users might expect here.

export interface RelatedFeature {
  featureId: string;
  featureLabel: string;
  description: string;
  livesIn: string;          // module ID where the feature actually lives
  livesInLabel: string;     // display name of that module
  canMirror: boolean;       // true = can be shown in both places (connected)
}

const RELATED_FEATURES_MAP: Record<string, RelatedFeature[]> = {
  "communication": [
    { featureId: "follow-up-reminders", featureLabel: "Follow-Up Reminders", description: "Automatic reminders to follow up with contacts", livesIn: "client-database", livesInLabel: "Clients", canMirror: true },
    { featureId: "auto-response", featureLabel: "Instant Auto-Response", description: "Auto-reply when someone submits an inquiry", livesIn: "leads-pipeline", livesInLabel: "Leads", canMirror: false },
    { featureId: "satisfaction-survey-trigger", featureLabel: "Post-Resolution Survey", description: "Send satisfaction survey after ticket resolved", livesIn: "support", livesInLabel: "Support", canMirror: false },
    { featureId: "post-appointment-followup", featureLabel: "Post-Appointment Follow-Up", description: "Auto-send thank you or feedback request after visit", livesIn: "bookings-calendar", livesInLabel: "Scheduling", canMirror: false },
  ],
  "client-database": [
    { featureId: "lead-to-client", featureLabel: "Lead → Client Conversion", description: "One-click convert leads to client records", livesIn: "leads-pipeline", livesInLabel: "Leads", canMirror: false },
    { featureId: "bulk-messaging", featureLabel: "Bulk Messaging", description: "Send a message to a filtered group of clients", livesIn: "communication", livesInLabel: "Messages", canMirror: true },
    { featureId: "conversation-assignment", featureLabel: "Conversation Assignment", description: "Assign client conversations to team members", livesIn: "communication", livesInLabel: "Messages", canMirror: false },
  ],
  "leads-pipeline": [
    { featureId: "canned-responses", featureLabel: "Canned Responses", description: "Pre-written reply templates for quick responses", livesIn: "communication", livesInLabel: "Messages", canMirror: true },
    { featureId: "follow-up-reminders", featureLabel: "Follow-Up Reminders", description: "Automatic reminders to follow up", livesIn: "client-database", livesInLabel: "Clients", canMirror: true },
  ],
  "bookings-calendar": [
    { featureId: "partial-payments", featureLabel: "Partial Payments / Deposits", description: "Accept deposit payments at time of booking", livesIn: "quotes-invoicing", livesInLabel: "Billing", canMirror: true },
    { featureId: "satisfaction-ratings", featureLabel: "Satisfaction Ratings", description: "Collect client satisfaction scores after visit", livesIn: "support", livesInLabel: "Support", canMirror: false },
  ],
  "quotes-invoicing": [
    { featureId: "job-to-invoice", featureLabel: "Job → Invoice", description: "Generate invoice from a completed job", livesIn: "jobs-projects", livesInLabel: "Projects", canMirror: false },
    { featureId: "payment-method-tracking", featureLabel: "Payment Method Tracking", description: "Track how each payment was made", livesIn: "payments", livesInLabel: "Payments", canMirror: true },
  ],
  "jobs-projects": [
    { featureId: "auto-attach-to-job", featureLabel: "Auto-Attach Documents", description: "Documents auto-link to their related job", livesIn: "documents", livesInLabel: "Documents", canMirror: true },
    { featureId: "e-signatures", featureLabel: "E-Signatures", description: "Get job scope signed digitally", livesIn: "documents", livesInLabel: "Documents", canMirror: false },
  ],
  "support": [
    { featureId: "after-hours-reply", featureLabel: "After-Hours Auto-Reply", description: "Auto-respond outside business hours", livesIn: "communication", livesInLabel: "Messages", canMirror: true },
    { featureId: "canned-responses", featureLabel: "Canned Responses", description: "Pre-written reply templates", livesIn: "communication", livesInLabel: "Messages", canMirror: true },
  ],
  "marketing": [
    { featureId: "client-tags", featureLabel: "Tags & Categories", description: "Segment clients for targeted campaigns", livesIn: "client-database", livesInLabel: "Clients", canMirror: true },
  ],
  "documents": [
    { featureId: "file-attachments", featureLabel: "Job File Attachments", description: "Files attached to jobs appear in Documents", livesIn: "jobs-projects", livesInLabel: "Projects", canMirror: true },
  ],
  "payments": [
    { featureId: "late-reminders", featureLabel: "Late Payment Reminders", description: "Automated nudges for overdue invoices", livesIn: "quotes-invoicing", livesInLabel: "Billing", canMirror: true },
  ],
};

/**
 * Get features that users might expect in this module but live elsewhere.
 * Only returns features where the "source" module is also enabled.
 */
export function getRelatedFeatures(
  moduleId: string,
  enabledModuleIds: string[]
): RelatedFeature[] {
  const related = RELATED_FEATURES_MAP[moduleId];
  if (!related) return [];
  const moduleSet = new Set(enabledModuleIds);
  return related.filter((r) => moduleSet.has(r.livesIn));
}
