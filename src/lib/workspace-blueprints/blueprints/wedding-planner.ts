import type { WorkspaceBlueprint } from "@/types/workspace-blueprint";

export const weddingPlannerBlueprint: WorkspaceBlueprint = {
  id: "hospitality-events:wedding-planner",
  label: "Wedding Planner",
  description: "Inquiry-first workspace for wedding planners — inquiry pipeline, event planning, milestone invoicing, and vendor coordination.",
  industryId: "hospitality-events",
  personaId: "wedding-planner",

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
          "milestone": true,
          "deposit-balance": true,
        },
      },
      {
        moduleId: "jobs-projects",
        featureOverrides: {
          "task-checklists": true,
          "time-tracking": true,
        },
      },
    ],
  },

  presentation: {
    homePage: "leads",
    sidebarOrder: ["leads", "jobs", "clients", "bookings", "invoicing", "documents", "communication"],
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
        defaultColumns: ["name", "email", "phone", "status", "tags", "field_event-date", "field_venue", "field_guest-count"],
      },
      leads: {
        defaultColumns: ["name", "email", "stage", "value", "createdAt"],
      },
      jobs: {
        defaultColumns: ["title", "clientId", "stage", "dueDate"],
        columnLabels: { title: "Wedding" },
      },
    },
  },

  adjustableBlocks: [
    {
      id: "booking-style",
      question: "Do couples book consultations directly?",
      options: [
        {
          value: "no",
          label: "No, they inquire first",
          description: "Inquiry → consultation → proposal → wedding. Leads are your entry point.",
          presentationPatches: [],
        },
        {
          value: "yes",
          label: "Yes, they book consultations",
          description: "Calendar-first with direct consultation bookings alongside inquiries.",
          functionalDelta: { workflowPattern: "booking-first" },
          presentationPatches: [
            { op: "set-homepage", pageId: "bookings" },
            { op: "reorder-sidebar", itemIds: ["bookings", "leads", "jobs", "clients", "invoicing", "documents", "communication"] },
            { op: "replace-dashboard-widgets", widgets: [
              { instanceId: "w-setup", manifestId: "setup-checklist", x: 0, y: 0, w: 4, h: 2, config: {} },
              { instanceId: "w-upcoming", manifestId: "upcoming-bookings", x: 0, y: 2, w: 2, h: 2, config: {} },
              { instanceId: "w-inquiries", manifestId: "open-inquiries", x: 2, y: 2, w: 2, h: 2, config: {} },
              { instanceId: "w-jobs", manifestId: "active-jobs", x: 0, y: 4, w: 2, h: 1, config: {} },
              { instanceId: "w-revenue", manifestId: "revenue-summary", x: 2, y: 4, w: 2, h: 1, config: {} },
            ]},
          ],
        },
      ],
      default: "no",
    },
    {
      id: "vendor-docs",
      question: "Do you share documents with clients (timelines, vendor lists, etc.)?",
      options: [
        {
          value: "yes",
          label: "Yes, I share documents",
          description: "Documents module enabled for sharing timelines, contracts, and vendor lists.",
          presentationPatches: [],
        },
        {
          value: "no",
          label: "No, not needed",
          description: "Documents module hidden — manage files externally.",
          functionalDelta: { removeModules: ["documents"] },
          presentationPatches: [
            { op: "reorder-sidebar", itemIds: ["leads", "jobs", "clients", "bookings", "invoicing", "communication"] },
          ],
        },
      ],
      default: "yes",
    },
  ],
};
