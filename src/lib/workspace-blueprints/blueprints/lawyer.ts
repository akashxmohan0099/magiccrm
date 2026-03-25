import type { WorkspaceBlueprint } from "@/types/workspace-blueprint";

export const lawyerBlueprint: WorkspaceBlueprint = {
  id: "professional-services:lawyer-solicitor",
  label: "Lawyer / Solicitor",
  description: "Inquiry-first workspace for lawyers — inquiry pipeline, matters tracking, engagement letters, and time-based billing.",
  industryId: "professional-services",
  personaId: "lawyer-solicitor",

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
          "recurring": true,
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
        defaultColumns: ["name", "email", "phone", "status", "tags", "field_company-name", "field_engagement-type"],
      },
      leads: {
        defaultColumns: ["name", "email", "stage", "value", "createdAt"],
        columnLabels: { name: "Inquiry" },
      },
      jobs: {
        defaultColumns: ["title", "clientId", "stage", "dueDate"],
        columnLabels: { title: "Matter" },
      },
    },
  },

  adjustableBlocks: [
    {
      id: "consultation-booking",
      question: "Do clients book consultations directly?",
      options: [
        {
          value: "no",
          label: "No, they inquire first",
          description: "Inquiry → engagement letter → matter. Leads are your entry point.",
          presentationPatches: [],
        },
        {
          value: "yes",
          label: "Yes, they book consultations",
          description: "Calendar-first with direct consultation bookings.",
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
      id: "time-tracking",
      question: "Do you track billable hours on matters?",
      options: [
        {
          value: "yes",
          label: "Yes, time-based billing",
          description: "Time tracking enabled on matters for billable hours.",
          presentationPatches: [],
        },
        {
          value: "no",
          label: "No, fixed-fee billing",
          description: "Fixed-fee — no time tracking needed.",
          presentationPatches: [],
        },
      ],
      default: "yes",
    },
  ],
};
