import type { IndustryAdaptiveConfig } from "@/types/industry-config";

/** Generic / fallback config — matches exact current CRM behavior */
export const genericConfig: IndustryAdaptiveConfig = {
  id: "generic",
  label: "Generic",

  vocabulary: {
    client: "Client",
    clients: "Clients",
    job: "Job",
    jobs: "Jobs",
    booking: "Booking",
    bookings: "Bookings",
    invoice: "Invoice",
    invoices: "Invoices",
    lead: "Lead",
    leads: "Leads",
    quote: "Quote",
    quotes: "Quotes",
    addClient: "Add Client",
    addJob: "New Job",
    addBooking: "New Booking",
    addInvoice: "New Invoice",
    addLead: "Add Lead",
  },

  customFields: {},

  relationships: [],

  jobStages: [
    { id: "not-started", label: "Not Started", color: "bg-gray-400" },
    { id: "in-progress", label: "In Progress", color: "bg-yellow-400" },
    { id: "review", label: "Review", color: "bg-purple-400" },
    { id: "completed", label: "Completed", color: "bg-green-400", isClosed: true },
    { id: "cancelled", label: "Cancelled", color: "bg-red-400", isClosed: true },
  ],

  leadStages: [
    { id: "new", label: "New", color: "bg-blue-500" },
    { id: "contacted", label: "Contacted", color: "bg-yellow-500" },
    { id: "qualified", label: "Qualified", color: "bg-purple-500" },
    { id: "proposal", label: "Proposal", color: "bg-orange-500" },
    { id: "won", label: "Won", color: "bg-green-500", isClosed: true },
    { id: "lost", label: "Lost", color: "bg-red-500", isClosed: true },
  ],

  invoiceMode: {
    defaultMode: "one-time",
    availableModes: ["one-time"],
  },

  bookingMode: {
    defaultMode: "appointment",
  },

  dashboard: {
    quickActions: [
      { label: "Add Contact", icon: "Users", href: "/dashboard/clients", shortcut: "⌘N" },
      { label: "Create Invoice", icon: "Receipt", href: "/dashboard/invoicing", shortcut: "⌘I" },
      { label: "New Project", icon: "FolderKanban", href: "/dashboard/jobs", shortcut: "⌘J" },
      { label: "Send Message", icon: "MessageCircle", href: "/dashboard/communication", shortcut: "⌘M" },
    ],
  },
};
