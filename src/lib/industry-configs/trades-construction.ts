import type { IndustryAdaptiveConfig } from "@/types/industry-config";

export const tradesConstructionConfig: IndustryAdaptiveConfig = {
  id: "trades-construction",
  label: "Trades & Construction",

  vocabulary: {
    client: "Client",
    clients: "Clients",
    job: "Job",
    jobs: "Jobs",
    booking: "Site Visit",
    bookings: "Site Visits",
    invoice: "Invoice",
    invoices: "Invoices",
    lead: "Lead",
    leads: "Leads",
    quote: "Quote",
    quotes: "Quotes",
    addClient: "Add Client",
    addJob: "New Job",
    addBooking: "Schedule Visit",
    addInvoice: "New Invoice",
    addLead: "Add Lead",
  },

  customFields: {
    clients: [
      { id: "site-address", label: "Job Site Address", type: "text", placeholder: "123 Main St...", group: "Site Details" },
      { id: "property-type", label: "Property Type", type: "select", options: ["Residential", "Commercial", "Industrial", "Government"], group: "Site Details" },
      { id: "access-notes", label: "Access Notes", type: "textarea", placeholder: "Gate code, parking, key location...", group: "Site Details" },
    ],
    jobs: [
      { id: "job-site", label: "Job Site Address", type: "text", placeholder: "If different from client address..." },
      { id: "permit-required", label: "Permit Required", type: "toggle" },
    ],
  },

  relationships: [],

  jobStages: [
    { id: "quoted", label: "Quoted", color: "bg-blue-400" },
    { id: "scheduled", label: "Scheduled", color: "bg-cyan-400" },
    { id: "in-progress", label: "In Progress", color: "bg-yellow-400" },
    { id: "review", label: "Review", color: "bg-purple-400" },
    { id: "completed", label: "Complete", color: "bg-green-400", isClosed: true },
    { id: "cancelled", label: "Cancelled", color: "bg-red-400", isClosed: true },
  ],

  leadStages: [
    { id: "new", label: "New Inquiry", color: "bg-blue-500" },
    { id: "site-visit", label: "Site Visit", color: "bg-cyan-500" },
    { id: "quoted", label: "Quoted", color: "bg-purple-500" },
    { id: "negotiation", label: "Negotiation", color: "bg-orange-500" },
    { id: "won", label: "Won", color: "bg-green-500", isClosed: true },
    { id: "lost", label: "Lost", color: "bg-red-500", isClosed: true },
  ],

  invoiceMode: {
    defaultMode: "milestone",
    availableModes: ["one-time", "milestone", "deposit-balance"],
  },

  bookingMode: {
    defaultMode: "appointment",
  },

  dashboard: {
    quickActions: [
      { label: "New Job", icon: "FolderKanban", href: "/dashboard/jobs", shortcut: "⌘J" },
      { label: "New Quote", icon: "FileText", href: "/dashboard/invoicing", shortcut: "⌘Q" },
      { label: "Add Client", icon: "Users", href: "/dashboard/clients", shortcut: "⌘N" },
      { label: "Schedule Visit", icon: "Calendar", href: "/dashboard/bookings", shortcut: "⌘B" },
    ],
  },
};
