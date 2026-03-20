import type { IndustryAdaptiveConfig, IndustryAdaptiveOverride } from "@/types/industry-config";

export const creativeServicesConfig: IndustryAdaptiveConfig = {
  id: "creative-services",
  label: "Creative & Design",

  vocabulary: {
    client: "Client",
    clients: "Clients",
    job: "Project",
    jobs: "Projects",
    booking: "Session",
    bookings: "Sessions",
    invoice: "Invoice",
    invoices: "Invoices",
    lead: "Inquiry",
    leads: "Inquiries",
    quote: "Proposal",
    quotes: "Proposals",
    addClient: "Add Client",
    addJob: "New Project",
    addBooking: "Book Session",
    addInvoice: "New Invoice",
    addLead: "New Inquiry",
  },

  customFields: {
    clients: [
      { id: "project-type", label: "Project Types", type: "text", placeholder: "e.g. Branding, Web, Photography...", group: "Creative Preferences" },
      { id: "style-preferences", label: "Style Preferences", type: "textarea", placeholder: "Color palette, visual references, mood...", group: "Creative Preferences" },
      { id: "brand-guidelines", label: "Has Brand Guidelines", type: "toggle", group: "Creative Preferences" },
    ],
  },

  relationships: [],

  jobStages: [
    { id: "brief", label: "Brief", color: "bg-blue-400" },
    { id: "creating", label: "Creating", color: "bg-yellow-400" },
    { id: "review", label: "Review", color: "bg-purple-400" },
    { id: "delivered", label: "Delivered", color: "bg-green-400", isClosed: true },
    { id: "cancelled", label: "Cancelled", color: "bg-red-400", isClosed: true },
  ],

  leadStages: [
    { id: "new", label: "New Inquiry", color: "bg-blue-500" },
    { id: "discovery", label: "Discovery Call", color: "bg-cyan-500" },
    { id: "proposal", label: "Proposal Sent", color: "bg-purple-500" },
    { id: "negotiation", label: "Negotiation", color: "bg-orange-500" },
    { id: "won", label: "Won", color: "bg-green-500", isClosed: true },
    { id: "lost", label: "Lost", color: "bg-red-500", isClosed: true },
  ],

  invoiceMode: {
    defaultMode: "deposit-balance",
    availableModes: ["one-time", "deposit-balance", "milestone"],
  },

  bookingMode: {
    defaultMode: "date-exclusive",
  },

  dashboard: {
    quickActions: [
      { label: "New Project", icon: "FolderKanban", href: "/dashboard/jobs", shortcut: "⌘J" },
      { label: "Add Client", icon: "Users", href: "/dashboard/clients", shortcut: "⌘N" },
      { label: "New Proposal", icon: "FileText", href: "/dashboard/invoicing", shortcut: "⌘Q" },
      { label: "New Invoice", icon: "Receipt", href: "/dashboard/invoicing", shortcut: "⌘I" },
    ],
  },
};

/** Persona overrides */
export const creativePersonaOverrides: Record<string, IndustryAdaptiveOverride> = {
  "photographer": {
    bookingMode: {
      defaultMode: "date-exclusive",
      defaultServices: [
        { id: "6hr-coverage", name: "6 Hour Coverage", duration: 360, price: 2500, category: "Packages" },
        { id: "full-day", name: "Full Day Coverage", duration: 600, price: 4000, category: "Packages" },
        { id: "elopement", name: "Elopement", duration: 180, price: 1500, category: "Packages" },
        { id: "engagement", name: "Engagement Shoot", duration: 90, price: 500, category: "Sessions" },
      ],
    },
  },
};
