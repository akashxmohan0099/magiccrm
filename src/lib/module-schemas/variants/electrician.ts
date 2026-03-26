import type { SchemaVariant } from "@/types/module-schema";

/**
 * Electrician persona variants (trades-construction)
 * Quote-first workflow. Compliance certificates. On-site work.
 */

export const electricianVariants: SchemaVariant[] = [
  {
    baseSchemaId: "client-database", variantId: "trades-construction:electrician:clients", personaId: "electrician", industryId: "trades-construction",
    overrides: {
      label: "Customers",
      description: "Homeowners, builders, and commercial clients.",
      fieldOverrides: {
        modify: [{ id: "address", label: "Property Address", showInTable: true }],
        add: [
          { id: "propertyType", label: "Property Type", type: "select", options: [
            { value: "residential", label: "Residential" }, { value: "commercial", label: "Commercial" },
            { value: "strata", label: "Strata" }, { value: "new-build", label: "New Build" },
          ], showInForm: true, showInDetail: true, showInTable: true, group: "Property" },
        ],
      },
      primaryAction: { label: "Add Customer", icon: "Plus" },
    },
  },
  {
    baseSchemaId: "leads-pipeline", variantId: "trades-construction:electrician:leads", personaId: "electrician", industryId: "trades-construction",
    overrides: {
      label: "Job Requests",
      description: "Incoming work requests and quote inquiries.",
      fieldOverrides: {
        modify: [
          { id: "notes", label: "Job Description", placeholder: "Wiring, switchboard upgrade, safety inspection..." },
          { id: "stage", label: "Status", options: [
            { value: "new", label: "New Request", color: "bg-blue-500" },
            { value: "contacted", label: "Contacted", color: "bg-amber-500" },
            { value: "site-visit", label: "Site Visit", color: "bg-violet-500" },
            { value: "quoted", label: "Quoted", color: "bg-indigo-500" },
            { value: "won", label: "Job Won", color: "bg-emerald-500" },
            { value: "lost", label: "Lost", color: "bg-red-500" },
          ]},
          { id: "value", label: "Quoted Amount" },
        ],
      },
      statusFlow: {
        field: "stage",
        states: [
          { value: "new", label: "New Request", color: "bg-blue-500" },
          { value: "contacted", label: "Contacted", color: "bg-amber-500" },
          { value: "site-visit", label: "Site Visit", color: "bg-violet-500" },
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
    },
  },
  {
    baseSchemaId: "jobs-projects", variantId: "trades-construction:electrician:jobs", personaId: "electrician", industryId: "trades-construction",
    overrides: {
      label: "Jobs",
      description: "Track every job from quote to compliance certificate.",
      fieldOverrides: {
        modify: [
          { id: "title", label: "Job Title", placeholder: "e.g., Switchboard upgrade — 15 George St" },
          { id: "stage", options: [
            { value: "scheduled", label: "Scheduled", color: "bg-blue-500" },
            { value: "in-progress", label: "On Site", color: "bg-amber-500" },
            { value: "parts-ordered", label: "Parts Ordered", color: "bg-violet-500" },
            { value: "completed", label: "Completed", color: "bg-emerald-500" },
            { value: "certified", label: "Certified", color: "bg-teal-500" },
          ]},
        ],
        add: [
          { id: "siteAddress", label: "Site Address", type: "text", showInTable: true, showInForm: true, showInDetail: true, showInCard: true, group: "Details" },
          { id: "certificateRequired", label: "Certificate Required", type: "boolean", defaultValue: false, showInForm: true, showInDetail: true, group: "Compliance" },
        ],
      },
      statusFlow: {
        field: "stage",
        states: [
          { value: "scheduled", label: "Scheduled", color: "bg-blue-500" },
          { value: "in-progress", label: "On Site", color: "bg-amber-500" },
          { value: "parts-ordered", label: "Parts Ordered", color: "bg-violet-500" },
          { value: "completed", label: "Completed", color: "bg-emerald-500", isClosed: true },
          { value: "certified", label: "Certified", color: "bg-teal-500", isClosed: true },
        ],
        transitions: [
          { from: "scheduled", to: ["in-progress", "parts-ordered"] },
          { from: "in-progress", to: ["parts-ordered", "completed"] },
          { from: "parts-ordered", to: ["in-progress", "completed"] },
          { from: "completed", to: ["certified"] },
        ],
      },
      primaryAction: { label: "Add Job", icon: "Plus" },
    },
  },
];
