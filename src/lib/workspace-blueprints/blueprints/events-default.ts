import type { WorkspaceBlueprint } from "@/types/workspace-blueprint";

export const eventsDefaultBlueprint: WorkspaceBlueprint = {
  id: "hospitality-events:default",
  label: "Events & Planning",
  description: "Inquiry-first workspace for events professionals — inquiry pipeline, event tracking, milestone invoicing, and vendor coordination.",
  industryId: "hospitality-events",
  personaId: "default",

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
        columnLabels: { title: "Event" },
      },
    },
  },

  adjustableBlocks: [
    {
      id: "booking-style",
      question: "Do clients book directly or inquire first?",
      options: [
        {
          value: "inquire",
          label: "They inquire first",
          description: "Inquiry → proposal → booking → event. Leads are your entry point.",
          presentationPatches: [],
        },
        {
          value: "book",
          label: "They book directly",
          description: "Calendar-first with direct bookings alongside inquiries.",
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
      default: "inquire",
    },
    {
      id: "track-events",
      question: "Do you track events as projects with tasks?",
      options: [
        {
          value: "yes",
          label: "Yes, I track events",
          description: "Jobs/Projects module with task checklists for event planning.",
          presentationPatches: [],
        },
        {
          value: "no",
          label: "No, I just invoice",
          description: "Simplified — no event tracking, just invoicing.",
          functionalDelta: { removeModules: ["jobs-projects"] },
          presentationPatches: [
            { op: "reorder-sidebar", itemIds: ["leads", "clients", "bookings", "invoicing", "documents", "communication"] },
          ],
        },
      ],
      default: "yes",
    },
  ],
};
