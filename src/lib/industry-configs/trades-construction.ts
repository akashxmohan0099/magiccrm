import type { IndustryAdaptiveConfig, IndustryAdaptiveOverride } from "@/types/industry-config";

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

/** Persona overrides */
export const tradesPersonaOverrides: Record<string, IndustryAdaptiveOverride> = {
  "hvac-technician": {
    customFields: {
      clients: [
        { id: "unit-make-model", label: "Unit Make & Model", type: "text", placeholder: "e.g. Daikin FTXM25, Mitsubishi MSZ-AP25...", group: "Equipment Tracking" },
        { id: "serial-number", label: "Serial Number", type: "text", placeholder: "Unit serial number", group: "Equipment Tracking" },
        { id: "refrigerant-type", label: "Refrigerant Type", type: "select", options: ["R-410A", "R-32", "R-134a", "R-407C", "R-22", "Other"], group: "Equipment Tracking" },
        { id: "install-date", label: "Install Date", type: "date", group: "Equipment Tracking" },
        { id: "warranty-expiry", label: "Warranty Expiry", type: "date", group: "Equipment Tracking" },
      ],
    },
  },
  "electrician": {
    customFields: {
      clients: [
        { id: "switchboard-details", label: "Switchboard Details", type: "textarea", placeholder: "Switchboard type, age, capacity...", group: "Electrical Details" },
        { id: "circuit-info", label: "Circuit Info", type: "textarea", placeholder: "Number of circuits, load details...", group: "Electrical Details" },
        { id: "safety-cert-number", label: "Safety Certificate Number", type: "text", placeholder: "Certificate or compliance number", group: "Compliance" },
        { id: "compliance-status", label: "Compliance Status", type: "select", options: ["Compliant", "Non-Compliant", "Pending Inspection", "Expired"], group: "Compliance" },
      ],
    },
  },
  "cleaner": {
    vocabulary: {
      booking: "Clean",
      bookings: "Cleans",
      addBooking: "Schedule Clean",
      job: "Job",
      jobs: "Jobs",
    },
    customFields: {
      clients: [
        { id: "key-access-code", label: "Key / Access Code", type: "text" as const, group: "Access" },
        { id: "bedrooms", label: "Bedrooms", type: "number" as const, group: "Property" },
        { id: "bathrooms", label: "Bathrooms", type: "number" as const, group: "Property" },
        { id: "pets-in-home", label: "Pets in Home", type: "select" as const, options: ["None", "Dog", "Cat", "Other"], group: "Property" },
        { id: "product-preference", label: "Product Preference", type: "select" as const, options: ["Standard", "Eco-Friendly", "Client Supplies"], group: "Preferences" },
      ],
    },
    bookingMode: {
      defaultMode: "appointment" as const,
      defaultServices: [
        { id: "regular-clean", name: "Regular Clean", duration: 120, price: 120, category: "Cleaning" },
        { id: "deep-clean", name: "Deep Clean", duration: 240, price: 280, category: "Cleaning" },
        { id: "end-of-lease", name: "End of Lease", duration: 360, price: 450, category: "Cleaning" },
        { id: "oven-clean", name: "Oven Clean", duration: 60, price: 80, category: "Add-ons" },
        { id: "window-clean", name: "Window Cleaning", duration: 90, price: 100, category: "Add-ons" },
      ],
    },
  },
};
