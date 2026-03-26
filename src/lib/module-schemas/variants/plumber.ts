import type { SchemaVariant } from "@/types/module-schema";

/**
 * Plumber persona variants (trades-construction industry)
 *
 * Inquiry-first workflow. Quote then invoice. On-site work.
 * Mix of emergency callouts and scheduled maintenance.
 * Jobs are the central module — track work from quote to completion.
 */

/** Clients → relabeled for trades context */
export const plumberClientsVariant: SchemaVariant = {
  baseSchemaId: "clients",
  variantId: "trades-construction:plumber:clients",
  personaId: "plumber",
  industryId: "trades-construction",
  overrides: {
    label: "Customers",
    description: "Your customers — homeowners, landlords, and property managers.",
    fieldOverrides: {
      modify: [
        { id: "address", label: "Property Address", placeholder: "Job site address", showInTable: true },
        { id: "company", label: "Property Manager / Company" },
      ],
      add: [
        {
          id: "propertyType",
          label: "Property Type",
          type: "select",
          options: [
            { value: "residential", label: "Residential" },
            { value: "commercial", label: "Commercial" },
            { value: "strata", label: "Strata / Body Corp" },
            { value: "rental", label: "Rental" },
          ],
          showInForm: true,
          showInDetail: true,
          showInTable: true,
          group: "Property",
        },
        {
          id: "accessNotes",
          label: "Access Notes",
          type: "textarea",
          placeholder: "Gate code, parking instructions, key location...",
          showInForm: true,
          showInDetail: true,
          group: "Property",
        },
      ],
    },
    primaryAction: { label: "Add Customer", icon: "Plus" },
    emptyState: {
      title: "No customers yet",
      description: "Add your first customer — homeowner, landlord, or property manager.",
    },
  },
};

/** Leads → "Job Requests" for plumber */
export const plumberLeadsVariant: SchemaVariant = {
  baseSchemaId: "leads",
  variantId: "trades-construction:plumber:leads",
  personaId: "plumber",
  industryId: "trades-construction",
  overrides: {
    label: "Job Requests",
    description: "Incoming requests — emergencies, quotes, and maintenance calls.",
    fieldOverrides: {
      modify: [
        { id: "name", label: "Customer Name" },
        { id: "stage", label: "Status", options: [
          { value: "new", label: "New Request", color: "bg-blue-500" },
          { value: "contacted", label: "Contacted", color: "bg-amber-500" },
          { value: "site-visit", label: "Site Visit Booked", color: "bg-violet-500" },
          { value: "quoted", label: "Quoted", color: "bg-indigo-500" },
          { value: "won", label: "Job Won", color: "bg-emerald-500" },
          { value: "lost", label: "Lost", color: "bg-red-500" },
        ]},
        { id: "value", label: "Quoted Amount" },
        { id: "source", label: "How they found you", options: [
          { value: "website", label: "Website" },
          { value: "referral", label: "Word of Mouth" },
          { value: "hipages", label: "hipages / ServiceSeeking" },
          { value: "google", label: "Google Search" },
          { value: "emergency", label: "Emergency Call" },
          { value: "other", label: "Other" },
        ]},
        { id: "notes", label: "Job Description", placeholder: "Describe the issue — blocked drain, leaking tap, hot water system..." },
      ],
      add: [
        {
          id: "urgency",
          label: "Urgency",
          type: "select",
          options: [
            { value: "emergency", label: "Emergency", color: "bg-red-500" },
            { value: "urgent", label: "Urgent (1-2 days)", color: "bg-amber-500" },
            { value: "standard", label: "Standard", color: "bg-blue-500" },
            { value: "flexible", label: "Flexible timing", color: "bg-gray-400" },
          ],
          showInTable: true,
          showInForm: true,
          showInDetail: true,
          showInCard: true,
          group: "Pipeline",
        },
      ],
    },
    // Update status flow for plumber pipeline
    statusFlow: {
      field: "stage",
      states: [
        { value: "new", label: "New Request", color: "bg-blue-500" },
        { value: "contacted", label: "Contacted", color: "bg-amber-500" },
        { value: "site-visit", label: "Site Visit Booked", color: "bg-violet-500" },
        { value: "quoted", label: "Quoted", color: "bg-indigo-500" },
        { value: "won", label: "Job Won", color: "bg-emerald-500", isClosed: true },
        { value: "lost", label: "Lost", color: "bg-red-500", isClosed: true },
      ],
      transitions: [
        { from: "new", to: ["contacted", "site-visit", "lost"] },
        { from: "contacted", to: ["site-visit", "quoted", "lost"] },
        { from: "site-visit", to: ["quoted", "lost"] },
        { from: "quoted", to: ["won", "lost"] },
      ],
    },
    primaryAction: { label: "New Job Request", icon: "Plus" },
    emptyState: {
      title: "No job requests yet",
      description: "When a customer calls or messages about a job, log it here to track from request to completion.",
    },
  },
};

/** Jobs → "Jobs" with trades-specific stages */
export const plumberJobsVariant: SchemaVariant = {
  baseSchemaId: "jobs",
  variantId: "trades-construction:plumber:jobs",
  personaId: "plumber",
  industryId: "trades-construction",
  overrides: {
    label: "Jobs",
    description: "Track every job from site visit to sign-off.",
    fieldOverrides: {
      modify: [
        { id: "title", label: "Job Title", placeholder: "e.g., Blocked drain — 42 Smith St" },
        { id: "description", label: "Scope of Work", placeholder: "What needs to be done, materials needed..." },
        { id: "stage", label: "Stage", options: [
          { value: "scheduled", label: "Scheduled", color: "bg-blue-500" },
          { value: "in-progress", label: "On Site", color: "bg-amber-500" },
          { value: "parts-ordered", label: "Parts Ordered", color: "bg-violet-500" },
          { value: "completed", label: "Completed", color: "bg-emerald-500" },
          { value: "invoiced", label: "Invoiced", color: "bg-teal-500" },
        ]},
      ],
      add: [
        {
          id: "siteAddress",
          label: "Site Address",
          type: "text",
          placeholder: "Job site address",
          showInTable: true,
          showInForm: true,
          showInDetail: true,
          showInCard: true,
          group: "Details",
        },
      ],
    },
    statusFlow: {
      field: "stage",
      states: [
        { value: "scheduled", label: "Scheduled", color: "bg-blue-500" },
        { value: "in-progress", label: "On Site", color: "bg-amber-500" },
        { value: "parts-ordered", label: "Parts Ordered", color: "bg-violet-500" },
        { value: "completed", label: "Completed", color: "bg-emerald-500", isClosed: true },
        { value: "invoiced", label: "Invoiced", color: "bg-teal-500", isClosed: true },
      ],
      transitions: [
        { from: "scheduled", to: ["in-progress", "parts-ordered"] },
        { from: "in-progress", to: ["parts-ordered", "completed"] },
        { from: "parts-ordered", to: ["in-progress", "completed"] },
        { from: "completed", to: ["invoiced"] },
      ],
    },
    primaryAction: { label: "Add Job", icon: "Plus" },
    emptyState: {
      title: "No jobs yet",
      description: "When you win a job request, it shows up here for tracking.",
    },
  },
};

/** Bookings → "Site Visits" for plumber */
export const plumberBookingsVariant: SchemaVariant = {
  baseSchemaId: "bookings",
  variantId: "trades-construction:plumber:bookings",
  personaId: "plumber",
  industryId: "trades-construction",
  overrides: {
    label: "Site Visits",
    description: "Schedule site visits, inspections, and callouts.",
    fieldOverrides: {
      modify: [
        { id: "title", label: "Visit Title", placeholder: "e.g., Inspect leaking tap — 42 Smith St" },
      ],
      remove: ["serviceId", "recurring"],
    },
    primaryAction: { label: "Schedule Visit", icon: "Plus" },
    emptyState: {
      title: "No site visits scheduled",
      description: "Schedule your first site visit or callout.",
    },
  },
};

/** Invoicing → stays as "Invoicing" but with trades context */
export const plumberInvoicingVariant: SchemaVariant = {
  baseSchemaId: "invoicing",
  variantId: "trades-construction:plumber:invoicing",
  personaId: "plumber",
  industryId: "trades-construction",
  overrides: {
    label: "Invoicing",
    description: "Quotes, invoices, and payment tracking for your jobs.",
    fieldOverrides: {
      modify: [
        { id: "paymentSchedule", label: "Payment Terms", options: [
          { value: "one-time", label: "On completion" },
          { value: "deposit-balance", label: "Deposit + balance" },
          { value: "recurring", label: "Maintenance contract" },
        ]},
      ],
    },
    emptyState: {
      title: "No invoices yet",
      description: "Create a quote or invoice for a completed job.",
      setupSteps: [
        { label: "Set up billing", description: "Add your ABN and bank details" },
        { label: "Create a quote", description: "Quote your first job" },
      ],
    },
  },
};

/** All plumber variants */
export const plumberVariants: SchemaVariant[] = [
  plumberClientsVariant,
  plumberLeadsVariant,
  plumberJobsVariant,
  plumberBookingsVariant,
  plumberInvoicingVariant,
];
