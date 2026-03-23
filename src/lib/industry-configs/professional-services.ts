import type { IndustryAdaptiveConfig, IndustryAdaptiveOverride } from "@/types/industry-config";

export const professionalServicesConfig: IndustryAdaptiveConfig = {
  id: "professional-services",
  label: "Professional Services",

  vocabulary: {
    client: "Client",
    clients: "Clients",
    job: "Project",
    jobs: "Projects",
    booking: "Meeting",
    bookings: "Meetings",
    invoice: "Invoice",
    invoices: "Invoices",
    lead: "Prospect",
    leads: "Prospects",
    quote: "Proposal",
    quotes: "Proposals",
    addClient: "Add Client",
    addJob: "New Project",
    addBooking: "Schedule Meeting",
    addInvoice: "New Invoice",
    addLead: "Add Prospect",
  },

  customFields: {
    clients: [
      { id: "company-name", label: "Company", type: "text", placeholder: "Company or firm name", group: "Business Details" },
      { id: "abn", label: "ABN / Tax ID", type: "text", placeholder: "e.g. 12 345 678 901", group: "Business Details" },
      { id: "engagement-type", label: "Engagement Type", type: "select", options: ["Retainer", "Project-based", "Hourly", "Fixed Fee"], group: "Business Details" },
      { id: "billing-contact", label: "Billing Contact", type: "text", placeholder: "If different from primary", group: "Billing" },
    ],
  },

  relationships: [
    { id: "company-contact", label: "Company", inverseLabel: "Contact" },
  ],

  jobStages: [
    { id: "scoping", label: "Scoping", color: "bg-blue-400" },
    { id: "active", label: "Active", color: "bg-yellow-400" },
    { id: "review", label: "Review", color: "bg-purple-400" },
    { id: "completed", label: "Complete", color: "bg-green-400", isClosed: true },
    { id: "on-hold", label: "On Hold", color: "bg-gray-400", isClosed: false },
    { id: "cancelled", label: "Cancelled", color: "bg-red-400", isClosed: true },
  ],

  leadStages: [
    { id: "new", label: "New", color: "bg-blue-500" },
    { id: "discovery", label: "Discovery", color: "bg-cyan-500" },
    { id: "proposal", label: "Proposal Sent", color: "bg-purple-500" },
    { id: "negotiation", label: "Negotiation", color: "bg-orange-500" },
    { id: "won", label: "Won", color: "bg-green-500", isClosed: true },
    { id: "lost", label: "Lost", color: "bg-red-500", isClosed: true },
  ],

  invoiceMode: {
    defaultMode: "recurring",
    availableModes: ["one-time", "recurring", "milestone"],
  },

  bookingMode: {
    defaultMode: "appointment",
  },

  dashboard: {
    quickActions: [
      { label: "New Project", icon: "FolderKanban", href: "/dashboard/jobs", shortcut: "⌘J" },
      { label: "Add Client", icon: "Users", href: "/dashboard/clients", shortcut: "⌘N" },
      { label: "New Invoice", icon: "Receipt", href: "/dashboard/invoicing", shortcut: "⌘I" },
      { label: "Schedule Meeting", icon: "Calendar", href: "/dashboard/bookings", shortcut: "⌘B" },
    ],
  },
};

/** Persona overrides */
export const professionalPersonaOverrides: Record<string, IndustryAdaptiveOverride> = {
  "lawyer-solicitor": {
    vocabulary: {
      job: "Matter",
      jobs: "Matters",
      addJob: "New Matter",
      quote: "Engagement Letter",
      quotes: "Engagement Letters",
      booking: "Consultation",
      bookings: "Consultations",
      lead: "Inquiry",
      leads: "Inquiries",
    },
  },
  "real-estate-agent": {
    vocabulary: {
      job: "Listing",
      jobs: "Listings",
      addJob: "New Listing",
      booking: "Inspection",
      bookings: "Inspections",
      quote: "Appraisal",
      quotes: "Appraisals",
      lead: "Lead",
      leads: "Leads",
    },
  },
};
