import type { WorkspaceBlueprint } from "@/types/workspace-blueprint";

export const cleanerBlueprint: WorkspaceBlueprint = {
  id: "trades-construction:cleaner",
  label: "Cleaner",
  description: "Inquiry-first workspace for cleaners — leads pipeline, quoting, property details, and scheduling.",
  industryId: "trades-construction",
  personaId: "cleaner",

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
          "quoting": true,
        },
      },
      {
        moduleId: "bookings-calendar",
        featureOverrides: {
          "booking-reminders": true,
        },
      },
      {
        moduleId: "client-database",
        featureOverrides: {
          "client-tags": true,
          "follow-up-reminders": true,
        },
      },
    ],
  },

  presentation: {
    homePage: "leads",
    sidebarOrder: ["leads", "bookings", "clients", "jobs", "invoicing", "communication"],
    primaryAction: { label: "New Lead", href: "/dashboard/leads", icon: "Plus" },
    dashboardWidgets: [
      { instanceId: "w-setup", manifestId: "setup-checklist", x: 0, y: 0, w: 4, h: 2, config: {} },
      { instanceId: "w-inquiries", manifestId: "open-inquiries", x: 0, y: 2, w: 2, h: 2, config: {} },
      { instanceId: "w-upcoming", manifestId: "upcoming-bookings", x: 2, y: 2, w: 2, h: 2, config: {} },
      { instanceId: "w-revenue", manifestId: "revenue-summary", x: 0, y: 4, w: 2, h: 1, config: {} },
      { instanceId: "w-activity", manifestId: "recent-activity", x: 2, y: 4, w: 2, h: 1, config: {} },
    ],
    modulePresentation: {
      clients: {
        defaultColumns: ["name", "email", "phone", "status", "tags", "field_site-address", "field_key-access-code", "field_bedrooms", "field_pets-in-home"],
      },
      leads: {
        defaultColumns: ["name", "email", "stage", "value", "createdAt"],
      },
    },
  },

  adjustableBlocks: [
    {
      id: "track-projects",
      question: "Do you track cleaning jobs as projects?",
      options: [
        {
          value: "yes",
          label: "Yes, I track projects",
          description: "Jobs/Projects module for larger cleaning jobs",
          presentationPatches: [],
        },
        {
          value: "no",
          label: "No, just schedule and invoice",
          description: "Simplified — no project tracking",
          functionalDelta: { removeModules: ["jobs-projects"] },
          presentationPatches: [
            { op: "reorder-sidebar", itemIds: ["leads", "bookings", "clients", "invoicing", "communication"] },
          ],
        },
      ],
      default: "no",
    },
    {
      id: "recurring-cleans",
      question: "Do you have recurring cleaning clients?",
      options: [
        {
          value: "yes",
          label: "Yes, recurring cleans",
          description: "Recurring bookings enabled for regular clients",
          presentationPatches: [],
        },
        {
          value: "no",
          label: "No, one-off jobs",
          description: "Standard one-off booking setup",
          presentationPatches: [],
        },
      ],
      default: "yes",
    },
  ],
};
