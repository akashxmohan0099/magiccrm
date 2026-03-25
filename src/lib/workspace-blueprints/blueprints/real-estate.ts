import type { WorkspaceBlueprint } from "@/types/workspace-blueprint";

export const realEstateBlueprint: WorkspaceBlueprint = {
  id: "professional-services:real-estate-agent",
  label: "Real Estate Agent",
  description: "Inquiry-first workspace for real estate agents — leads pipeline, listings tracking, inspections calendar, and appraisals.",
  industryId: "professional-services",
  personaId: "real-estate-agent",

  functional: {
    workflowPattern: "inquiry-first",
    enabledModules: [
      "bookings-calendar",
      "jobs-projects",
    ],
    enabledAddons: [
      "documents",
    ],
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
    sidebarOrder: ["leads", "jobs", "clients", "bookings", "invoicing", "documents", "communication"],
    primaryAction: { label: "New Lead", href: "/dashboard/leads", icon: "Plus" },
    dashboardWidgets: [
      { instanceId: "w-setup", manifestId: "setup-checklist", x: 0, y: 0, w: 4, h: 2, config: {} },
      { instanceId: "w-inquiries", manifestId: "open-inquiries", x: 0, y: 2, w: 2, h: 2, config: {} },
      { instanceId: "w-jobs", manifestId: "active-jobs", x: 2, y: 2, w: 2, h: 2, config: {} },
      { instanceId: "w-upcoming", manifestId: "upcoming-bookings", x: 0, y: 4, w: 2, h: 1, config: {} },
      { instanceId: "w-revenue", manifestId: "revenue-summary", x: 2, y: 4, w: 2, h: 1, config: {} },
    ],
    modulePresentation: {
      clients: {
        defaultColumns: ["name", "email", "phone", "status", "tags", "field_company-name"],
      },
      leads: {
        defaultColumns: ["name", "email", "stage", "value", "createdAt"],
      },
      jobs: {
        defaultColumns: ["title", "clientId", "stage", "dueDate"],
        columnLabels: { title: "Listing" },
      },
      bookings: {
        defaultColumns: ["title", "clientId", "date", "startTime"],
        columnLabels: { title: "Inspection" },
      },
    },
  },

  adjustableBlocks: [
    {
      id: "listing-tracking",
      question: "Do you track listings as projects?",
      options: [
        {
          value: "yes",
          label: "Yes, I track listings",
          description: "Jobs/Projects module used for listings with task checklists.",
          presentationPatches: [],
        },
        {
          value: "no",
          label: "No, just leads and invoicing",
          description: "Simplified — no listing tracking, just leads and invoicing.",
          functionalDelta: { removeModules: ["jobs-projects"] },
          presentationPatches: [
            { op: "reorder-sidebar", itemIds: ["leads", "clients", "bookings", "invoicing", "documents", "communication"] },
          ],
        },
      ],
      default: "yes",
    },
    {
      id: "inspection-calendar",
      question: "Do you schedule inspections via calendar?",
      options: [
        {
          value: "yes",
          label: "Yes, I schedule inspections",
          description: "Calendar enabled for scheduling inspections and open homes.",
          presentationPatches: [],
        },
        {
          value: "no",
          label: "No, I manage inspections externally",
          description: "Bookings calendar hidden — manage inspections outside the CRM.",
          functionalDelta: { removeModules: ["bookings-calendar"] },
          presentationPatches: [
            { op: "reorder-sidebar", itemIds: ["leads", "jobs", "clients", "invoicing", "documents", "communication"] },
          ],
        },
      ],
      default: "yes",
    },
  ],
};
