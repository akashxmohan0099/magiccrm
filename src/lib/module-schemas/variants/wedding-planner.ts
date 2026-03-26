import type { SchemaVariant } from "@/types/module-schema";

/**
 * Wedding Planner persona variants (hospitality-events)
 * Multi-month projects. Vendor coordination. Deposit-heavy. Seasonal.
 */

export const weddingPlannerVariants: SchemaVariant[] = [
  {
    baseSchemaId: "client-database", variantId: "hospitality-events:wedding-planner:clients", personaId: "wedding-planner", industryId: "hospitality-events",
    overrides: {
      label: "Couples",
      description: "Your couples and their wedding details.",
      fieldOverrides: {
        modify: [
          { id: "name", label: "Couple Names", placeholder: "e.g., Sarah & Tom" },
          { id: "company", showInForm: false, showInDetail: false, searchable: false },
        ],
        add: [
          { id: "weddingDate", label: "Wedding Date", type: "date", showInTable: true, showInForm: true, showInDetail: true, sortable: true, group: "Wedding" },
          { id: "venue", label: "Venue", type: "text", placeholder: "Venue name", showInTable: true, showInForm: true, showInDetail: true, group: "Wedding" },
          { id: "guestCount", label: "Guest Count", type: "number", placeholder: "150", showInForm: true, showInDetail: true, group: "Wedding" },
          { id: "budget", label: "Budget", type: "currency", showInForm: true, showInDetail: true, group: "Wedding" },
        ],
      },
      primaryAction: { label: "Add Couple", icon: "Plus" },
      emptyState: { title: "No couples yet", description: "Add your first couple to start planning their big day." },
    },
  },
  {
    baseSchemaId: "leads-pipeline", variantId: "hospitality-events:wedding-planner:leads", personaId: "wedding-planner", industryId: "hospitality-events",
    overrides: {
      label: "Inquiries",
      description: "Couples who've reached out about your planning services.",
      fieldOverrides: {
        modify: [
          { id: "name", label: "Couple Names" },
          { id: "company", showInForm: false, showInDetail: false, searchable: false },
          { id: "value", label: "Package Value" },
          { id: "notes", label: "Wedding Details", placeholder: "Date, venue, style, guest count, budget..." },
        ],
        add: [
          { id: "weddingDate", label: "Wedding Date", type: "date", showInTable: true, showInForm: true, showInDetail: true, showInCard: true, sortable: true, group: "Event" },
        ],
      },
      primaryAction: { label: "Add Inquiry", icon: "Plus" },
    },
  },
  {
    baseSchemaId: "jobs-projects", variantId: "hospitality-events:wedding-planner:jobs", personaId: "wedding-planner", industryId: "hospitality-events",
    overrides: {
      label: "Weddings",
      description: "Track every wedding from planning to the big day.",
      fieldOverrides: {
        modify: [
          { id: "title", label: "Wedding", placeholder: "e.g., Sarah & Tom — Yarra Valley, March 2026" },
          { id: "description", label: "Planning Notes" },
          { id: "stage", options: [
            { value: "planning", label: "Planning", color: "bg-blue-500" },
            { value: "vendors-confirmed", label: "Vendors Confirmed", color: "bg-violet-500" },
            { value: "final-details", label: "Final Details", color: "bg-amber-500" },
            { value: "day-of", label: "Day Of", color: "bg-pink-500" },
            { value: "completed", label: "Completed", color: "bg-emerald-500" },
          ]},
        ],
      },
      statusFlow: {
        field: "stage",
        states: [
          { value: "planning", label: "Planning", color: "bg-blue-500" },
          { value: "vendors-confirmed", label: "Vendors Confirmed", color: "bg-violet-500" },
          { value: "final-details", label: "Final Details", color: "bg-amber-500" },
          { value: "day-of", label: "Day Of", color: "bg-pink-500" },
          { value: "completed", label: "Completed", color: "bg-emerald-500", isClosed: true },
        ],
        transitions: [
          { from: "planning", to: ["vendors-confirmed"] },
          { from: "vendors-confirmed", to: ["final-details"] },
          { from: "final-details", to: ["day-of"] },
          { from: "day-of", to: ["completed"] },
        ],
      },
      primaryAction: { label: "Add Wedding", icon: "Plus" },
    },
  },
  {
    baseSchemaId: "quotes-invoicing", variantId: "hospitality-events:wedding-planner:invoicing", personaId: "wedding-planner", industryId: "hospitality-events",
    overrides: {
      description: "Packages, deposits, and milestone payments for your weddings.",
      fieldOverrides: {
        modify: [
          { id: "paymentSchedule", label: "Payment Terms", options: [
            { value: "deposit-balance", label: "Deposit + progress payments" },
            { value: "one-time", label: "Full payment" },
          ]},
        ],
      },
    },
  },
];
