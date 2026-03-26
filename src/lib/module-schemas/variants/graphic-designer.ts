import type { SchemaVariant } from "@/types/module-schema";

/**
 * Graphic Designer persona variants (creative-services)
 * Project-based. Quote → invoice. Remote-first. Retainer clients.
 */

export const graphicDesignerVariants: SchemaVariant[] = [
  {
    baseSchemaId: "leads-pipeline", variantId: "creative-services:graphic-designer:leads", personaId: "graphic-designer", industryId: "creative-services",
    overrides: {
      label: "Inquiries",
      description: "Incoming project requests and briefs.",
      fieldOverrides: {
        modify: [
          { id: "notes", label: "Project Brief", placeholder: "What they need, timeline, budget range..." },
          { id: "value", label: "Project Value" },
        ],
        add: [
          { id: "projectType", label: "Project Type", type: "select", options: [
            { value: "branding", label: "Branding / Identity" },
            { value: "packaging", label: "Packaging" },
            { value: "social", label: "Social Media" },
            { value: "print", label: "Print" },
            { value: "web", label: "Web Design" },
            { value: "other", label: "Other" },
          ], showInTable: true, showInForm: true, showInDetail: true, showInCard: true, group: "Pipeline" },
        ],
      },
      primaryAction: { label: "New Inquiry", icon: "Plus" },
    },
  },
  {
    baseSchemaId: "jobs-projects", variantId: "creative-services:graphic-designer:jobs", personaId: "graphic-designer", industryId: "creative-services",
    overrides: {
      label: "Projects",
      description: "Track every project from brief to delivery.",
      fieldOverrides: {
        modify: [
          { id: "title", label: "Project Name", placeholder: "e.g., Brand refresh — Acme Co" },
          { id: "description", label: "Brief", placeholder: "Deliverables, style direction, brand guidelines..." },
          { id: "stage", options: [
            { value: "briefing", label: "Briefing", color: "bg-blue-500" },
            { value: "concept", label: "Concept", color: "bg-violet-500" },
            { value: "design", label: "Design", color: "bg-amber-500" },
            { value: "revisions", label: "Revisions", color: "bg-orange-500" },
            { value: "delivered", label: "Delivered", color: "bg-emerald-500" },
          ]},
        ],
      },
      statusFlow: {
        field: "stage",
        states: [
          { value: "briefing", label: "Briefing", color: "bg-blue-500" },
          { value: "concept", label: "Concept", color: "bg-violet-500" },
          { value: "design", label: "Design", color: "bg-amber-500" },
          { value: "revisions", label: "Revisions", color: "bg-orange-500" },
          { value: "delivered", label: "Delivered", color: "bg-emerald-500", isClosed: true },
        ],
        transitions: [
          { from: "briefing", to: ["concept"] },
          { from: "concept", to: ["design", "briefing"] },
          { from: "design", to: ["revisions", "delivered"] },
          { from: "revisions", to: ["design", "delivered"] },
        ],
      },
      primaryAction: { label: "Add Project", icon: "Plus" },
    },
  },
  {
    baseSchemaId: "quotes-invoicing", variantId: "creative-services:graphic-designer:invoicing", personaId: "graphic-designer", industryId: "creative-services",
    overrides: {
      description: "Quotes, invoices, and retainer billing for your projects.",
      fieldOverrides: {
        modify: [
          { id: "paymentSchedule", label: "Billing", options: [
            { value: "one-time", label: "Project fee" },
            { value: "deposit-balance", label: "50% deposit + balance" },
            { value: "recurring", label: "Monthly retainer" },
          ]},
        ],
      },
    },
  },
];
