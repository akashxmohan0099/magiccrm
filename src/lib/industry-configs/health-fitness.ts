import type { IndustryAdaptiveConfig, IndustryAdaptiveOverride } from "@/types/industry-config";

export const healthFitnessConfig: IndustryAdaptiveConfig = {
  id: "health-fitness",
  label: "Health & Fitness",

  vocabulary: {
    client: "Client",
    clients: "Clients",
    job: "Program",
    jobs: "Programs",
    booking: "Session",
    bookings: "Sessions",
    invoice: "Invoice",
    invoices: "Invoices",
    lead: "Lead",
    leads: "Leads",
    quote: "Quote",
    quotes: "Quotes",
    addClient: "Add Client",
    addJob: "New Program",
    addBooking: "Book Session",
    addInvoice: "New Invoice",
    addLead: "Add Lead",
  },

  customFields: {
    clients: [
      { id: "fitness-goals", label: "Fitness Goals", type: "textarea", placeholder: "e.g. weight loss, muscle gain, marathon prep...", group: "Health Profile" },
      { id: "injuries", label: "Injuries / Conditions", type: "textarea", placeholder: "Any current or past injuries to be aware of...", group: "Health Profile" },
      { id: "emergency-contact", label: "Emergency Contact", type: "text", placeholder: "Name & phone number", group: "Health Profile" },
    ],
  },

  relationships: [],

  jobStages: [
    { id: "assessment", label: "Assessment", color: "bg-blue-400" },
    { id: "active", label: "Active", color: "bg-yellow-400" },
    { id: "review", label: "Review", color: "bg-purple-400" },
    { id: "completed", label: "Completed", color: "bg-green-400", isClosed: true },
    { id: "paused", label: "Paused", color: "bg-gray-400", isClosed: false },
    { id: "cancelled", label: "Cancelled", color: "bg-red-400", isClosed: true },
  ],

  leadStages: [
    { id: "new", label: "New Inquiry", color: "bg-blue-500" },
    { id: "trial", label: "Trial Booked", color: "bg-cyan-500" },
    { id: "follow-up", label: "Follow Up", color: "bg-purple-500" },
    { id: "won", label: "Signed Up", color: "bg-green-500", isClosed: true },
    { id: "lost", label: "Lost", color: "bg-red-500", isClosed: true },
  ],

  invoiceMode: {
    defaultMode: "session-pack",
    availableModes: ["one-time", "recurring", "session-pack"],
  },

  bookingMode: {
    defaultMode: "service-menu",
    defaultServices: [
      { id: "pt-session", name: "PT Session", duration: 60, price: 80, category: "Training" },
      { id: "group-class", name: "Group Class", duration: 45, price: 25, category: "Classes" },
      { id: "assessment", name: "Initial Assessment", duration: 90, price: 100, category: "Assessment" },
      { id: "nutrition", name: "Nutrition Consult", duration: 45, price: 70, category: "Nutrition" },
      { id: "rehab", name: "Rehab Session", duration: 45, price: 75, category: "Rehab" },
    ],
  },

  dashboard: {
    quickActions: [
      { label: "Book Session", icon: "Calendar", href: "/dashboard/bookings", shortcut: "⌘B" },
      { label: "Add Client", icon: "Users", href: "/dashboard/clients", shortcut: "⌘N" },
      { label: "New Invoice", icon: "Receipt", href: "/dashboard/invoicing", shortcut: "⌘I" },
      { label: "Send Message", icon: "MessageCircle", href: "/dashboard/communication", shortcut: "⌘M" },
    ],
  },
};

/** Persona overrides */
export const healthFitnessPersonaOverrides: Record<string, IndustryAdaptiveOverride> = {
  "physio-chiro": {
    vocabulary: {
      client: "Patient",
      clients: "Patients",
      addClient: "Add Patient",
      job: "Treatment Plan",
      jobs: "Treatment Plans",
      addJob: "New Treatment Plan",
      booking: "Appointment",
      bookings: "Appointments",
      addBooking: "Book Appointment",
      lead: "Referral",
      leads: "Referrals",
      addLead: "Add Referral",
    },
    bookingMode: {
      defaultMode: "appointment" as const,
      defaultServices: [
        { id: "initial-consult", name: "Initial Consultation", duration: 60, price: 120, category: "Consultations" },
        { id: "standard-treatment", name: "Standard Treatment", duration: 30, price: 80, category: "Treatments" },
        { id: "extended-treatment", name: "Extended Treatment", duration: 45, price: 110, category: "Treatments" },
        { id: "follow-up", name: "Follow-Up", duration: 20, price: 65, category: "Consultations" },
      ],
    },
    customFields: {
      clients: [
        { id: "referring-gp", label: "Referring GP", type: "text" as const, group: "Medical" },
        { id: "health-fund", label: "Health Fund", type: "text" as const, group: "Medical" },
        { id: "diagnosis-condition", label: "Diagnosis / Condition", type: "textarea" as const, group: "Medical" },
        { id: "medicare-number", label: "Medicare Number", type: "text" as const, group: "Medical" },
      ],
    },
  },
  "gym-studio-owner": {
    vocabulary: {
      client: "Member",
      clients: "Members",
      addClient: "Add Member",
    },
  },
};
