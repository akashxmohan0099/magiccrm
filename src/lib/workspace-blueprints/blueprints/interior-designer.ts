import type { WorkspaceBlueprint } from "@/types/workspace-blueprint";

export const interiorDesignerBlueprint: WorkspaceBlueprint = {
  id: "creative-services:interior-designer",
  label: "Interior Designer",
  description: "Inquiry-first workspace for interior designers — leads pipeline, consultations, project tracking, and deposit invoicing.",
  industryId: "creative-services",
  personaId: "interior-designer",

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
          "deposit-balance": true,
          "milestone": true,
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
        defaultColumns: ["name", "email", "phone", "status", "tags", "field_style-preferences"],
      },
      leads: {
        defaultColumns: ["name", "email", "stage", "value", "createdAt"],
      },
      jobs: {
        defaultColumns: ["title", "clientId", "stage", "dueDate"],
        columnLabels: { title: "Project" },
      },
    },
  },

  adjustableBlocks: [
    {
      id: "booking-style",
      question: "Do clients book consultations directly?",
      options: [
        {
          value: "no",
          label: "No, they inquire first",
          description: "Inquiry → consultation → proposal → project. Leads are your entry point.",
          presentationPatches: [],
        },
        {
          value: "yes",
          label: "Yes, they book directly",
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
      id: "track-projects",
      question: "Do you track design projects with tasks?",
      options: [
        {
          value: "yes",
          label: "Yes, I track projects",
          description: "Jobs/Projects module with task checklists and time tracking.",
          presentationPatches: [],
        },
        {
          value: "no",
          label: "No, I just invoice",
          description: "Simplified — no project tracking, just invoicing after completion.",
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
