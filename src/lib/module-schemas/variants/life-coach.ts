import type { SchemaVariant } from "@/types/module-schema";

/**
 * Life/Business Coach persona variants (education-coaching)
 * Program-based. Video calls. Group cohorts. Monthly retainers.
 */

export const lifeCoachVariants: SchemaVariant[] = [
  {
    baseSchemaId: "client-database", variantId: "education-coaching:life-business-coach:clients", personaId: "life-business-coach", industryId: "education-coaching",
    overrides: {
      label: "Clients",
      description: "Your coaching clients and their goals.",
      fieldOverrides: {
        modify: [{ id: "company", label: "Business / Role", placeholder: "Their business or job title" }],
        add: [
          { id: "coachingGoal", label: "Coaching Goal", type: "select", options: [
            { value: "career", label: "Career Growth" },
            { value: "business", label: "Business Growth" },
            { value: "leadership", label: "Leadership" },
            { value: "life-balance", label: "Life Balance" },
            { value: "mindset", label: "Mindset / Confidence" },
            { value: "other", label: "Other" },
          ], showInTable: true, showInForm: true, showInDetail: true, group: "Coaching" },
          { id: "programName", label: "Current Program", type: "text", placeholder: "e.g., 12-Week Breakthrough", showInForm: true, showInDetail: true, group: "Coaching" },
        ],
      },
      emptyState: { title: "No clients yet", description: "Add your first coaching client." },
    },
  },
  {
    baseSchemaId: "leads-pipeline", variantId: "education-coaching:life-business-coach:leads", personaId: "life-business-coach", industryId: "education-coaching",
    overrides: {
      label: "Prospects",
      description: "People interested in coaching — track them from inquiry to enrollment.",
      fieldOverrides: {
        modify: [
          { id: "company", label: "Business / Role" },
          { id: "value", label: "Program Value" },
          { id: "notes", label: "What they're looking for", placeholder: "Goals, challenges, what drew them to coaching..." },
          { id: "stage", options: [
            { value: "new", label: "New Lead", color: "bg-blue-500" },
            { value: "discovery-call", label: "Discovery Call", color: "bg-amber-500" },
            { value: "proposal-sent", label: "Proposal Sent", color: "bg-violet-500" },
            { value: "won", label: "Enrolled", color: "bg-emerald-500" },
            { value: "lost", label: "Not Now", color: "bg-gray-400" },
          ]},
        ],
      },
      statusFlow: {
        field: "stage",
        states: [
          { value: "new", label: "New Lead", color: "bg-blue-500" },
          { value: "discovery-call", label: "Discovery Call", color: "bg-amber-500" },
          { value: "proposal-sent", label: "Proposal Sent", color: "bg-violet-500" },
          { value: "won", label: "Enrolled", color: "bg-emerald-500", isClosed: true },
          { value: "lost", label: "Not Now", color: "bg-gray-400", isClosed: true },
        ],
        transitions: [
          { from: "new", to: ["discovery-call", "lost"] },
          { from: "discovery-call", to: ["proposal-sent", "lost"] },
          { from: "proposal-sent", to: ["won", "lost"] },
        ],
      },
      primaryAction: { label: "Add Prospect", icon: "Plus" },
    },
  },
  {
    baseSchemaId: "bookings-calendar", variantId: "education-coaching:life-business-coach:bookings", personaId: "life-business-coach", industryId: "education-coaching",
    overrides: {
      label: "Sessions",
      description: "Coaching sessions, discovery calls, and group calls.",
      fieldOverrides: {
        modify: [{ id: "title", label: "Session", placeholder: "e.g., Coaching Session — Sarah M." }],
        add: [
          { id: "sessionFormat", label: "Format", type: "select", options: [
            { value: "1on1-video", label: "1-on-1 Video" },
            { value: "1on1-phone", label: "1-on-1 Phone" },
            { value: "group", label: "Group Call" },
            { value: "in-person", label: "In Person" },
            { value: "workshop", label: "Workshop" },
          ], showInTable: true, showInForm: true, showInDetail: true, group: "Session" },
        ],
      },
      primaryAction: { label: "Schedule Session", icon: "Plus" },
    },
  },
  {
    baseSchemaId: "products", variantId: "education-coaching:life-business-coach:products", personaId: "life-business-coach", industryId: "education-coaching",
    overrides: {
      label: "Programs",
      description: "Your coaching programs, packages, and pricing.",
      fieldOverrides: {
        modify: [
          { id: "name", label: "Program Name", placeholder: "e.g., 12-Week Business Breakthrough" },
          { id: "description", label: "What's included", placeholder: "e.g., 12 x 1-hour sessions, workbook, email support" },
          { id: "category", label: "Type", placeholder: "e.g., 1-on-1, Group, Workshop" },
          { id: "duration", label: "Program Length (weeks)", placeholder: "12" },
        ],
        remove: ["sku", "inStock", "quantity"],
      },
      viewOverrides: { modify: [{ id: "table", visibleFields: ["name", "category", "price", "duration", "createdAt"] }] },
      primaryAction: { label: "Add Program", icon: "Plus" },
    },
  },
  {
    baseSchemaId: "quotes-invoicing", variantId: "education-coaching:life-business-coach:invoicing", personaId: "life-business-coach", industryId: "education-coaching",
    overrides: {
      label: "Billing",
      description: "Program payments, retainers, and invoices.",
      fieldOverrides: {
        modify: [
          { id: "paymentSchedule", label: "Payment Type", options: [
            { value: "one-time", label: "Program fee" },
            { value: "recurring", label: "Monthly retainer" },
          ]},
        ],
      },
    },
  },
];
