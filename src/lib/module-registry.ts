export interface ModuleDefinition {
  id: string;
  slug: string;
  name: string;
  icon: string;
  description: string;
}

export const MODULE_REGISTRY: ModuleDefinition[] = [
  { id: "client-database", slug: "clients", name: "Client Database", icon: "Users", description: "Your clients, all in one place." },
  { id: "leads-pipeline", slug: "leads", name: "Leads & Pipeline", icon: "Inbox", description: "Never lose track of a potential customer." },
  { id: "communication", slug: "communication", name: "Communication", icon: "MessageCircle", description: "Every conversation, one inbox." },
  { id: "bookings-calendar", slug: "bookings", name: "Bookings & Calendar", icon: "Calendar", description: "Let customers book you without the back and forth." },
  { id: "quotes-invoicing", slug: "invoicing", name: "Quotes & Invoicing", icon: "Receipt", description: "Quote the job, send the invoice, get paid." },
  { id: "jobs-projects", slug: "jobs", name: "Jobs & Projects", icon: "FolderKanban", description: "Track every job from start to finish." },
  { id: "marketing", slug: "marketing", name: "Marketing", icon: "Megaphone", description: "Get the word out and bring them back." },
  { id: "support", slug: "support", name: "Support", icon: "Headphones", description: "Keep clients happy after the job's done." },
  { id: "documents", slug: "documents", name: "Documents", icon: "FileText", description: "Contracts, files, and signatures sorted." },
  { id: "payments", slug: "payments", name: "Payments", icon: "CreditCard", description: "Stay on top of who's paid and who hasn't." },
  { id: "automations", slug: "automations", name: "Automations", icon: "Zap", description: "Let your CRM do the boring stuff." },
  { id: "reporting", slug: "reporting", name: "Reporting", icon: "BarChart3", description: "See how your business is actually doing." },
];

export function getModuleBySlug(slug: string): ModuleDefinition | undefined {
  return MODULE_REGISTRY.find((m) => m.slug === slug);
}

export function getModuleById(id: string): ModuleDefinition | undefined {
  return MODULE_REGISTRY.find((m) => m.id === id);
}
