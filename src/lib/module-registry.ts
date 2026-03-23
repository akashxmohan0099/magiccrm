import type { VocabularyMap } from "@/types/industry-config";

export interface ModuleDefinition {
  id: string;
  slug: string;
  name: string;
  icon: string;
  description: string;
  vocabKey?: keyof VocabularyMap;
  group: "business" | "grow" | "system";
  kind?: "core" | "addon";
}

export const MODULE_REGISTRY: ModuleDefinition[] = [
  // ── Your Business (workflow order: acquire → manage → deliver → bill) ──
  // Always-on modules (no question needed — every business needs these):
  { id: "client-database", slug: "clients", name: "Clients", icon: "Users", description: "Your clients, all in one place.", vocabKey: "clients", group: "business" },
  { id: "leads-pipeline", slug: "leads", name: "Leads", icon: "Inbox", description: "Never lose track of a potential customer.", vocabKey: "leads", group: "business" },
  { id: "communication", slug: "communication", name: "Messages", icon: "MessageCircle", description: "Every conversation, one inbox.", group: "business" },
  { id: "quotes-invoicing", slug: "invoicing", name: "Billing", icon: "Receipt", description: "Quotes, invoices, and payments.", group: "business" },

  // Question-gated modules:
  { id: "bookings-calendar", slug: "bookings", name: "Scheduling", icon: "Calendar", description: "Bookings, appointments, and calendar.", group: "business" },
  { id: "jobs-projects", slug: "jobs", name: "Projects", icon: "FolderKanban", description: "Track work from start to finish.", vocabKey: "jobs", group: "business" },
  { id: "products", slug: "products", name: "Products", icon: "Package", description: "Your product and service catalog.", group: "business" },

  // ── Grow ──
  { id: "marketing", slug: "marketing", name: "Marketing", icon: "Megaphone", description: "Campaigns, coupons, and referrals.", group: "grow" },
  { id: "team", slug: "team", name: "Team", icon: "UsersRound", description: "Manage your team, roles, and permissions.", group: "grow" },
  { id: "client-portal", slug: "portal", name: "Client Portal", icon: "Globe", description: "Self-service hub where clients view bookings, invoices, and docs.", group: "grow" },

  // ── Insights ──
  { id: "automations", slug: "automations", name: "Automations", icon: "Zap", description: "Automate repetitive tasks.", group: "system" },
  { id: "reporting", slug: "reporting", name: "Reporting", icon: "BarChart3", description: "Dashboards and insights.", group: "system" },

  // ── Add-ons (toggled from /dashboard/addons) ──
  { id: "documents", slug: "documents", name: "Documents", icon: "FileText", description: "Contracts, files, and signatures.", group: "business", kind: "addon" },
  { id: "support", slug: "support", name: "Support", icon: "Headphones", description: "Track client requests and follow-ups.", group: "grow", kind: "addon" },
  { id: "memberships", slug: "memberships", name: "Memberships", icon: "Crown", description: "Session packs, recurring plans, and member tracking.", group: "business", kind: "addon" },
  { id: "before-after", slug: "before-after", name: "Before & After", icon: "Camera", description: "Capture proof of work with photos and checklists.", group: "business", kind: "addon" },
  { id: "intake-forms", slug: "forms", name: "Forms", icon: "FileInput", description: "Inquiry forms, booking requests, intake questionnaires, and contact forms.", group: "business", kind: "addon" },
  { id: "soap-notes", slug: "soap-notes", name: "Treatment Notes", icon: "ClipboardList", description: "Structured SOAP notes for clinical treatment records.", group: "business", kind: "addon" },
  { id: "loyalty", slug: "loyalty", name: "Loyalty & Referrals", icon: "Gift", description: "Points per visit, referral codes, and reward tracking.", group: "grow", kind: "addon" },
  { id: "win-back", slug: "win-back", name: "Win-Back", icon: "UserCheck", description: "Detect lapsed clients and auto-send re-engagement messages.", group: "grow", kind: "addon" },
  { id: "storefront", slug: "storefront", name: "Storefront", icon: "Store", description: "A public page showcasing your services and booking links.", group: "grow", kind: "addon" },
  { id: "ai-insights", slug: "insights", name: "AI Insights", icon: "Lightbulb", description: "Smart suggestions like overdue rebookings and revenue trends.", group: "system", kind: "addon" },
  { id: "notes-docs", slug: "notes", name: "Notes & Docs", icon: "NotebookPen", description: "Write notes, create docs, and share with your team. Simple formatting, no bloat.", group: "business", kind: "addon" },
  { id: "gift-cards", slug: "gift-cards", name: "Gift Cards", icon: "Ticket", description: "Create, sell, and track digital gift vouchers.", group: "grow", kind: "addon" },
  { id: "class-timetable", slug: "timetable", name: "Class Timetable", icon: "CalendarRange", description: "Visual weekly class schedule with capacity and check-in.", group: "business", kind: "addon" },
  { id: "vendor-management", slug: "vendors", name: "Vendors", icon: "Building2", description: "Track suppliers, vendor availability, contracts, and payments.", group: "business", kind: "addon" },
  { id: "proposals", slug: "proposals", name: "Proposals", icon: "ScrollText", description: "Branded proposal pages with design templates, interactive pricing, and e-signature.", group: "business", kind: "addon" },
  { id: "waitlist-manager", slug: "waitlist", name: "Waitlist", icon: "ListOrdered", description: "Manage walk-in queues and auto-notify clients when spots open up.", group: "business", kind: "addon" },
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
