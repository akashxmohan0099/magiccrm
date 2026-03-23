import type { IndustryAdaptiveConfig, IndustryAdaptiveOverride } from "@/types/industry-config";

export const hospitalityEventsConfig: IndustryAdaptiveConfig = {
  id: "hospitality-events",
  label: "Events & Planning",

  vocabulary: {
    client: "Client",
    clients: "Clients",
    job: "Event",
    jobs: "Events",
    booking: "Booking",
    bookings: "Bookings",
    invoice: "Invoice",
    invoices: "Invoices",
    lead: "Inquiry",
    leads: "Inquiries",
    quote: "Quote",
    quotes: "Quotes",
    addClient: "Add Client",
    addJob: "New Event",
    addBooking: "New Booking",
    addInvoice: "New Invoice",
    addLead: "New Inquiry",
  },

  customFields: {
    clients: [
      { id: "event-date", label: "Event Date", type: "date", group: "Event Details" },
      { id: "venue", label: "Venue", type: "text", placeholder: "Venue name & address", group: "Event Details" },
      { id: "guest-count", label: "Guest Count", type: "number", placeholder: "Estimated headcount", group: "Event Details" },
      { id: "dietary-requirements", label: "Dietary Requirements", type: "textarea", placeholder: "Any dietary needs or restrictions...", group: "Event Details" },
    ],
  },

  relationships: [
    { id: "partner", label: "Partner", inverseLabel: "Partner" },
    { id: "event-planner", label: "Event Planner", inverseLabel: "Client" },
  ],

  jobStages: [
    { id: "inquiry", label: "Inquiry", color: "bg-blue-400" },
    { id: "planning", label: "Planning", color: "bg-cyan-400" },
    { id: "rehearsal", label: "Rehearsal", color: "bg-purple-400" },
    { id: "event-day", label: "Event Day", color: "bg-yellow-400" },
    { id: "wrap-up", label: "Wrap-up", color: "bg-orange-400" },
    { id: "completed", label: "Completed", color: "bg-green-400", isClosed: true },
    { id: "cancelled", label: "Cancelled", color: "bg-red-400", isClosed: true },
  ],

  leadStages: [
    { id: "new", label: "New Inquiry", color: "bg-blue-500" },
    { id: "consultation", label: "Consultation", color: "bg-cyan-500" },
    { id: "proposal", label: "Proposal Sent", color: "bg-purple-500" },
    { id: "negotiation", label: "Negotiation", color: "bg-orange-500" },
    { id: "won", label: "Booked", color: "bg-green-500", isClosed: true },
    { id: "lost", label: "Lost", color: "bg-red-500", isClosed: true },
  ],

  invoiceMode: {
    defaultMode: "milestone",
    availableModes: ["one-time", "milestone", "deposit-balance"],
  },

  bookingMode: {
    defaultMode: "date-exclusive",
  },

  dashboard: {
    quickActions: [
      { label: "New Event", icon: "FolderKanban", href: "/dashboard/jobs", shortcut: "⌘J" },
      { label: "Add Client", icon: "Users", href: "/dashboard/clients", shortcut: "⌘N" },
      { label: "New Invoice", icon: "Receipt", href: "/dashboard/invoicing", shortcut: "⌘I" },
      { label: "New Inquiry", icon: "Inbox", href: "/dashboard/leads", shortcut: "⌘L" },
    ],
  },
};

/** Persona overrides */
export const hospitalityPersonaOverrides: Record<string, IndustryAdaptiveOverride> = {
  "florist": {
    vocabulary: {
      job: "Order",
      jobs: "Orders",
      addJob: "New Order",
    },
    customFields: {
      clients: [
        { id: "event-date", label: "Event Date", type: "date", group: "Order Details" },
        { id: "event-type", label: "Event Type", type: "select", options: ["Wedding", "Corporate", "Funeral", "Birthday", "Other"], group: "Order Details" },
        { id: "flower-prefs", label: "Flower Preferences", type: "textarea", placeholder: "e.g. Peonies, roses, native Australian...", group: "Order Details" },
        { id: "color-palette", label: "Colour Palette", type: "text", placeholder: "e.g. Blush, sage, ivory...", group: "Order Details" },
      ],
    },
  },
  "wedding-planner": {
    bookingMode: {
      defaultMode: "date-exclusive",
      defaultServices: [
        { id: "full-planning", name: "Full Planning", duration: 480, price: 8000, category: "Packages" },
        { id: "month-of", name: "Month-Of Coordination", duration: 480, price: 3000, category: "Packages" },
        { id: "day-of", name: "Day-Of Coordination", duration: 720, price: 2000, category: "Packages" },
        { id: "consultation", name: "Consultation", duration: 60, price: 150, category: "Sessions" },
      ],
    },
  },
};
