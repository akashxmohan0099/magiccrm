import type { VocabularyMap } from "@/types/industry-config";

export interface ModuleDefinition {
  id: string;
  slug: string;
  name: string;
  icon: string;
  description: string;
  vocabKey?: keyof VocabularyMap;
  group: "people" | "operations" | "growth" | "system";
  kind?: "core" | "addon";
}

export const MODULE_REGISTRY: ModuleDefinition[] = [
  // ── People ──
  { id: "client-database", slug: "clients", name: "Clients", icon: "Users", description: "Your clients, all in one place.", vocabKey: "clients", group: "people" },
  { id: "leads-pipeline", slug: "leads", name: "Leads & Pipeline", icon: "Inbox", description: "Never lose track of a potential customer.", vocabKey: "leads", group: "people" },
  { id: "communication", slug: "communication", name: "Communication", icon: "MessageCircle", description: "Every conversation, one inbox.", group: "people" },
  { id: "support", slug: "support", name: "Support", icon: "Headphones", description: "Track client requests and follow-ups.", group: "people" },
  { id: "team", slug: "team", name: "Team", icon: "UsersRound", description: "Manage your team, roles, and permissions.", group: "people" },

  // ── Operations ──
  { id: "bookings-calendar", slug: "bookings", name: "Scheduling", icon: "Calendar", description: "Bookings, appointments, and calendar.", vocabKey: "bookings", group: "operations" },
  { id: "quotes-invoicing", slug: "invoicing", name: "Billing", icon: "Receipt", description: "Quotes, invoices, and payments.", vocabKey: "invoices", group: "operations" },
  { id: "payments", slug: "payments", name: "Payments", icon: "CreditCard", description: "Track who's paid and who hasn't.", group: "operations" },
  { id: "jobs-projects", slug: "jobs", name: "Work Management", icon: "FolderKanban", description: "Projects, tasks, and time tracking.", vocabKey: "jobs", group: "operations" },
  { id: "documents", slug: "documents", name: "Documents", icon: "FileText", description: "Contracts, files, and signatures.", group: "operations" },
  { id: "products", slug: "products", name: "Products", icon: "Package", description: "Your product and service catalog.", group: "operations" },

  // ── Growth ──
  { id: "marketing", slug: "marketing", name: "Marketing", icon: "Megaphone", description: "Campaigns, social, and reviews.", group: "growth" },

  // ── System ──
  { id: "automations", slug: "automations", name: "Automations", icon: "Zap", description: "Automate repetitive tasks.", group: "system" },
  { id: "reporting", slug: "reporting", name: "Reporting", icon: "BarChart3", description: "Dashboards and insights.", group: "system" },

  // ── Add-ons (not part of onboarding — users toggle these on from the sidebar) ──
  { id: "memberships", slug: "memberships", name: "Memberships", icon: "Crown", description: "Session packs, recurring plans, and member tracking.", group: "operations", kind: "addon" },
  { id: "before-after", slug: "before-after", name: "Before & After", icon: "Camera", description: "Capture proof of work with photos and checklists.", group: "operations", kind: "addon" },
  { id: "intake-forms", slug: "forms", name: "Forms", icon: "FileInput", description: "Inquiry forms, booking requests, intake questionnaires, and contact forms.", group: "operations", kind: "addon" },
  { id: "soap-notes", slug: "soap-notes", name: "Treatment Notes", icon: "ClipboardList", description: "Structured SOAP notes for clinical treatment records.", group: "operations", kind: "addon" },
  { id: "loyalty", slug: "loyalty", name: "Loyalty & Referrals", icon: "Gift", description: "Points per visit, referral codes, and reward tracking.", group: "growth", kind: "addon" },
  { id: "win-back", slug: "win-back", name: "Win-Back", icon: "UserCheck", description: "Detect lapsed clients and auto-send re-engagement messages.", group: "growth", kind: "addon" },
  { id: "storefront", slug: "storefront", name: "Storefront", icon: "Store", description: "A public page showcasing your services and booking links.", group: "growth", kind: "addon" },
  { id: "client-portal", slug: "portal", name: "Client Portal", icon: "Globe", description: "Self-service hub where clients view bookings, invoices, and docs.", group: "growth", kind: "addon" },
  { id: "ai-insights", slug: "insights", name: "AI Insights", icon: "Lightbulb", description: "Smart suggestions like overdue rebookings and revenue trends.", group: "system", kind: "addon" },
];

export const GROUP_LABELS: Record<string, string> = {
  people: "People",
  operations: "Operations",
  growth: "Growth",
  system: "Insights",
  build: "",
};

/** Get the display name for a module, using vocabulary if the module has a vocabKey. */
export function getModuleDisplayName(mod: ModuleDefinition, vocab: VocabularyMap): string {
  if (!mod.vocabKey) return mod.name;
  const vocabName = vocab[mod.vocabKey];
  if (!vocabName) return mod.name;

  switch (mod.id) {
    case "client-database": return vocabName;
    case "leads-pipeline": return `${vocabName} & Pipeline`;
    case "bookings-calendar": return `${vocabName} & Calendar`;
    case "quotes-invoicing": return `${vocab.quotes} & ${vocabName}`;
    case "jobs-projects": return `${vocabName} & Projects`;
    default: return vocabName;
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
