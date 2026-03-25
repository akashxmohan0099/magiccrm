import type { WorkspaceBlueprint } from "@/types/workspace-blueprint";

export const handmadeArtisanBlueprint: WorkspaceBlueprint = {
  id: "retail-ecommerce:handmade-artisan",
  label: "Handmade / Artisan",
  description: "Inquiry-first workspace for handmade and artisan sellers — custom order inquiries, project tracking, materials preferences, and production timelines.",
  industryId: "retail-ecommerce",
  personaId: "handmade-artisan",

  functional: {
    workflowPattern: "inquiry-first",
    enabledModules: [
      "bookings-calendar",
      "jobs-projects",
    ],
    enabledAddons: [],
    moduleBehaviors: [
      {
        moduleId: "leads-pipeline",
        featureOverrides: {
          "web-forms": true,
          "follow-up-reminders": true,
        },
      },
      {
        moduleId: "quotes-invoicing",
        featureOverrides: {
          "proposals": true,
          "deposit-balance": true,
        },
      },
      {
        moduleId: "jobs-projects",
        featureOverrides: {
          "task-checklists": true,
        },
      },
    ],
  },

  presentation: {
    homePage: "leads",
    sidebarOrder: ["leads", "jobs", "clients", "bookings", "invoicing", "communication"],
    primaryAction: { label: "New Inquiry", href: "/dashboard/leads", icon: "Plus" },
    dashboardWidgets: [
      { instanceId: "w-setup", manifestId: "setup-checklist", x: 0, y: 0, w: 4, h: 2, config: {} },
      { instanceId: "w-inquiries", manifestId: "open-inquiries", x: 0, y: 2, w: 2, h: 2, config: {} },
      { instanceId: "w-proposals", manifestId: "proposals-pending", x: 2, y: 2, w: 2, h: 2, config: {} },
      { instanceId: "w-jobs", manifestId: "active-jobs", x: 0, y: 4, w: 2, h: 1, config: {} },
      { instanceId: "w-revenue", manifestId: "revenue-summary", x: 2, y: 4, w: 2, h: 1, config: {} },
    ],
    modulePresentation: {
      clients: {
        defaultColumns: ["name", "email", "phone", "status", "tags", "field_custom-brief", "field_materials-preference"],
        columnLabels: { name: "Customer" },
      },
      leads: {
        defaultColumns: ["name", "email", "stage", "value", "createdAt"],
        columnLabels: { name: "Inquiry" },
      },
      jobs: {
        defaultColumns: ["title", "clientId", "stage", "dueDate"],
        columnLabels: { title: "Custom Order", clientId: "Customer" },
      },
    },
  },

  adjustableBlocks: [
    {
      id: "order-tracking",
      question: "Do you track custom orders as projects?",
      options: [
        {
          value: "yes",
          label: "Yes, I track orders",
          description: "Jobs/Projects module for custom order tracking with production stages.",
          presentationPatches: [],
        },
        {
          value: "no",
          label: "No, just inquiries and invoicing",
          description: "Simplified — no order tracking, just leads and invoicing.",
          functionalDelta: { removeModules: ["jobs-projects"] },
          presentationPatches: [
            { op: "reorder-sidebar", itemIds: ["leads", "clients", "bookings", "invoicing", "communication"] },
          ],
        },
      ],
      default: "yes",
    },
    {
      id: "consultations",
      question: "Do you offer consultations for custom work?",
      options: [
        {
          value: "yes",
          label: "Yes, I book consultations",
          description: "Calendar enabled for scheduling custom order consultations.",
          presentationPatches: [],
        },
        {
          value: "no",
          label: "No, all via messages",
          description: "Bookings calendar hidden — handle everything via messages.",
          functionalDelta: { removeModules: ["bookings-calendar"] },
          presentationPatches: [
            { op: "reorder-sidebar", itemIds: ["leads", "jobs", "clients", "invoicing", "communication"] },
          ],
        },
      ],
      default: "yes",
    },
  ],
};
