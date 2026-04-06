import type { VocabularyMap } from "@/types/industry-config";
import type { NeedsAssessment } from "@/types/onboarding";
import { FEATURE_BLOCKS } from "@/types/features";

export type ModuleStatus = "production" | "beta";

export interface ModuleDefinition {
  id: string;
  slug: string;
  name: string;
  icon: string;
  description: string;
  vocabKey?: keyof VocabularyMap;
  group: "business" | "grow" | "system";
  kind?: "core" | "addon";
  status?: ModuleStatus;
}

export const MODULE_REGISTRY: ModuleDefinition[] = [
  // ── Your Business (workflow order: acquire → manage → deliver → bill) ──
  // Always-on modules (no question needed — every business needs these):
  { id: "client-database", slug: "clients", name: "Clients", icon: "Users", description: "Your clients, all in one place.", vocabKey: "clients", group: "business", status: "production" },
  { id: "leads-pipeline", slug: "leads", name: "Leads", icon: "Inbox", description: "Never lose track of a potential customer.", vocabKey: "leads", group: "business", status: "production" },
  { id: "communication", slug: "communication", name: "Messages", icon: "MessageCircle", description: "Every conversation, one inbox.", group: "business", status: "production" },
  { id: "quotes-invoicing", slug: "invoicing", name: "Billing", icon: "Receipt", description: "Quotes, invoices, and payments.", group: "business", status: "production" },

  // Question-gated modules:
  { id: "bookings-calendar", slug: "bookings", name: "Scheduling", icon: "Calendar", description: "Bookings, appointments, and calendar.", group: "business", status: "production" },
  { id: "services", slug: "services", name: "Services", icon: "Sparkles", description: "Your service menu — pricing, categories, and duration.", group: "business", status: "production" },
  { id: "jobs-projects", slug: "jobs", name: "Projects", icon: "FolderKanban", description: "Track work from start to finish.", vocabKey: "jobs", group: "business", status: "beta" },

  // ── Grow ──
  { id: "marketing", slug: "marketing", name: "Marketing", icon: "Megaphone", description: "Campaigns, coupons, and referrals.", group: "grow", status: "production" },
  { id: "team", slug: "team", name: "Team", icon: "UsersRound", description: "Manage your team, roles, and permissions.", group: "grow", status: "production" },
  { id: "client-portal", slug: "portal", name: "Client Portal", icon: "Globe", description: "Self-service hub where clients view bookings, invoices, and docs.", group: "grow", status: "beta" },

  // ── Insights ──
  { id: "automations", slug: "automations", name: "Automations", icon: "Zap", description: "Automate repetitive tasks.", group: "system", status: "production" },
  { id: "reporting", slug: "reporting", name: "Reporting", icon: "BarChart3", description: "Dashboards and insights.", group: "system", status: "production" },

  // ── Add-ons (toggled from /dashboard/addons) ──
  { id: "documents", slug: "documents", name: "Documents", icon: "FileText", description: "Contracts, files, and signatures.", group: "business", kind: "addon", status: "production" },
  { id: "support", slug: "support", name: "Support", icon: "Headphones", description: "Track client requests and follow-ups.", group: "grow", kind: "addon", status: "beta" },
  { id: "memberships", slug: "memberships", name: "Memberships", icon: "Crown", description: "Session packs, recurring plans, and member tracking.", group: "business", kind: "addon", status: "beta" },
  { id: "before-after", slug: "before-after", name: "Before & After", icon: "Camera", description: "Capture proof of work with photos and checklists.", group: "business", kind: "addon", status: "beta" },
  { id: "intake-forms", slug: "forms", name: "Forms", icon: "FileInput", description: "Inquiry forms, booking requests, intake questionnaires, and contact forms.", group: "business", kind: "addon", status: "beta" },
  { id: "soap-notes", slug: "soap-notes", name: "Treatment Notes", icon: "ClipboardList", description: "Structured SOAP notes for clinical treatment records.", group: "business", kind: "addon", status: "beta" },
  { id: "loyalty", slug: "loyalty", name: "Loyalty & Referrals", icon: "Gift", description: "Points per visit, referral codes, and reward tracking.", group: "grow", kind: "addon", status: "beta" },
  { id: "win-back", slug: "win-back", name: "Win-Back", icon: "UserCheck", description: "Detect lapsed clients and auto-send re-engagement messages.", group: "grow", kind: "addon", status: "beta" },
  { id: "storefront", slug: "storefront", name: "Storefront", icon: "Store", description: "A public page showcasing your services and booking links.", group: "grow", kind: "addon", status: "beta" },
  { id: "ai-insights", slug: "insights", name: "AI Insights", icon: "Lightbulb", description: "Smart suggestions like overdue rebookings and revenue trends.", group: "system", kind: "addon", status: "beta" },
  { id: "notes-docs", slug: "notes", name: "Notes & Docs", icon: "NotebookPen", description: "Write notes, create docs, and share with your team. Simple formatting, no bloat.", group: "business", kind: "addon", status: "beta" },
  { id: "gift-cards", slug: "gift-cards", name: "Gift Cards", icon: "Ticket", description: "Create, sell, and track digital gift vouchers.", group: "grow", kind: "addon", status: "beta" },
  { id: "class-timetable", slug: "timetable", name: "Class Timetable", icon: "CalendarRange", description: "Visual weekly class schedule with capacity and check-in.", group: "business", kind: "addon", status: "beta" },
  { id: "vendor-management", slug: "vendors", name: "Vendors", icon: "Building2", description: "Track suppliers, vendor availability, contracts, and payments.", group: "business", kind: "addon", status: "beta" },
  { id: "proposals", slug: "proposals", name: "Proposals", icon: "ScrollText", description: "Branded proposal pages with design templates, interactive pricing, and e-signature.", group: "business", kind: "addon", status: "beta" },
  { id: "waitlist-manager", slug: "waitlist", name: "Waitlist", icon: "ListOrdered", description: "Manage walk-in queues and auto-notify clients when spots open up.", group: "business", kind: "addon", status: "beta" },
];

export const GROUP_LABELS: Record<string, string> = {
  business: "Your Business",
  grow: "Grow",
  system: "Insights",
  build: "",
};

/** Get the display name for a module, using vocabulary if the module has a vocabKey. */
export function getModuleDisplayName(mod: ModuleDefinition, vocab: VocabularyMap): string {
  if (!mod.vocabKey) return mod.name;
  const vocabName = vocab[mod.vocabKey];
  if (!vocabName) return mod.name;

  switch (mod.id) {
    case "client-database": return vocabName; // "Clients", "Patients", "Students"
    case "leads-pipeline": return vocabName;   // "Leads", "Inquiries", "Prospects"
    case "jobs-projects": return vocabName;    // "Jobs", "Projects", "Services", "Events"
    default: return mod.name;                  // Scheduling, Billing, etc. — universal
  }
}

export function getModuleBySlug(slug: string): ModuleDefinition | undefined {
  return MODULE_REGISTRY.find((m) => m.slug === slug);
}

export function getModuleById(id: string): ModuleDefinition | undefined {
  return MODULE_REGISTRY.find((m) => m.id === id);
}

export function getCoreModules(): ModuleDefinition[] {
  return MODULE_REGISTRY.filter((m) => m.kind !== "addon");
}

export function getAddonModules(): ModuleDefinition[] {
  return MODULE_REGISTRY.filter((m) => m.kind === "addon");
}

export function isModuleProduction(id: string): boolean {
  const mod = getModuleById(id);
  return (mod?.status ?? "production") === "production";
}

// ── Shared module enablement logic ──────────────────────────────
// Single source of truth used by SummaryStep, BuildingScreen, dashboard hooks, etc.

export const ALWAYS_ON_MODULES = new Set([
  "client-database",
  "bookings-calendar",
  "communication",
  "quotes-invoicing",
  "automations",
  "reporting",
  "services",
]);

/** Maps module IDs to their NeedsAssessment trigger keys */
export const MODULE_TO_NEED: Record<string, keyof NeedsAssessment> = {
  "client-database": "manageCustomers",
  "leads-pipeline": "receiveInquiries",
  "communication": "communicateClients",
  "quotes-invoicing": "sendInvoices",
  "jobs-projects": "manageProjects",
  "marketing": "runMarketing",
};

/**
 * Pure function: computes the set of enabled core module IDs from onboarding state.
 * Does NOT include add-ons (those live in the addons store).
 *
 * discoveryAnswers convention:
 *   "module:{id}" === true  → explicitly enabled
 *   "module:{id}" === false → explicitly disabled (user removed it on Summary)
 */
export function computeEnabledModuleIds(
  needs: NeedsAssessment,
  discoveryAnswers: Record<string, boolean>,
): Set<string> {
  const enabled = new Set<string>(ALWAYS_ON_MODULES);

  // 1. Needs-gated modules
  for (const [moduleId, needKey] of Object.entries(MODULE_TO_NEED)) {
    if (needs[needKey]) enabled.add(moduleId);
  }

  // 2. Direct discovery answers from AI questions
  for (const [key, val] of Object.entries(discoveryAnswers)) {
    if (key.startsWith("module:") && val === true) {
      enabled.add(key.replace("module:", ""));
    }
  }

  // 3. FEATURE_BLOCKS auto-enable rules (only question-gated needs)
  for (const block of FEATURE_BLOCKS) {
    if (block.autoEnabledBy?.some((trigger) => needs[trigger])) {
      enabled.add(block.id);
    }
  }

  // 4. Respect explicit disables (user removed module on Summary)
  for (const [key, val] of Object.entries(discoveryAnswers)) {
    if (key.startsWith("module:") && val === false) {
      const id = key.replace("module:", "");
      if (!ALWAYS_ON_MODULES.has(id)) enabled.delete(id);
    }
  }

  return enabled;
}
