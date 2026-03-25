import type { WorkspaceBlueprint } from "@/types/workspace-blueprint";

export const lifeCoachBlueprint: WorkspaceBlueprint = {
  id: "education-coaching:life-business-coach",
  label: "Life / Business Coach",
  description: "Recurring workspace for life and business coaches — session scheduling, coaching programs, client goals tracking, and session packs.",
  industryId: "education-coaching",
  personaId: "life-business-coach",

  functional: {
    workflowPattern: "recurring",
    enabledModules: [
      "bookings-calendar",
      "jobs-projects",
    ],
    enabledAddons: [
      "memberships",
    ],
    moduleBehaviors: [
      {
        moduleId: "bookings-calendar",
        featureOverrides: {
          "service-menu": true,
          "recurring-bookings": true,
          "booking-reminders": true,
        },
      },
      {
        moduleId: "quotes-invoicing",
        featureOverrides: {
          "session-pack": true,
          "recurring": true,
        },
      },
      {
        moduleId: "client-database",
        featureOverrides: {
          "client-tags": true,
          "client-notes": true,
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
    homePage: "bookings",
    sidebarOrder: ["bookings", "clients", "jobs", "invoicing", "memberships", "leads", "communication"],
    primaryAction: { label: "Book Session", href: "/dashboard/bookings", icon: "Calendar" },
    dashboardWidgets: [
      { instanceId: "w-setup", manifestId: "setup-checklist", x: 0, y: 0, w: 4, h: 2, config: {} },
      { instanceId: "w-sessions", manifestId: "sessions-this-week", x: 0, y: 2, w: 2, h: 2, config: {} },
      { instanceId: "w-upcoming", manifestId: "upcoming-bookings", x: 2, y: 2, w: 2, h: 2, config: {} },
      { instanceId: "w-revenue", manifestId: "revenue-summary", x: 0, y: 4, w: 2, h: 1, config: {} },
      { instanceId: "w-activity", manifestId: "recent-activity", x: 2, y: 4, w: 2, h: 1, config: {} },
    ],
    modulePresentation: {
      clients: {
        defaultColumns: ["name", "email", "phone", "status", "tags", "field_company", "field_role", "field_coaching-goals"],
      },
      bookings: {
        defaultColumns: ["title", "clientId", "date", "startTime"],
        columnLabels: { title: "Session" },
      },
      jobs: {
        defaultColumns: ["title", "clientId", "stage", "dueDate"],
        columnLabels: { title: "Program" },
      },
    },
  },

  adjustableBlocks: [
    {
      id: "coaching-programs",
      question: "Do you run structured coaching programs?",
      options: [
        {
          value: "yes",
          label: "Yes, I run programs",
          description: "Jobs/Projects module for tracking coaching programs with milestones.",
          presentationPatches: [],
        },
        {
          value: "no",
          label: "No, ad-hoc sessions only",
          description: "Simplified — just bookings and invoicing, no program tracking.",
          functionalDelta: { removeModules: ["jobs-projects"] },
          presentationPatches: [
            { op: "reorder-sidebar", itemIds: ["bookings", "clients", "invoicing", "memberships", "leads", "communication"] },
          ],
        },
      ],
      default: "yes",
    },
    {
      id: "session-packs",
      question: "Do you sell session packs or memberships?",
      options: [
        {
          value: "yes",
          label: "Yes, session packs",
          description: "Memberships module with session-based billing.",
          presentationPatches: [],
        },
        {
          value: "no",
          label: "No, pay per session",
          description: "Simple per-session invoicing.",
          functionalDelta: { removeModules: ["memberships"] },
          presentationPatches: [
            { op: "reorder-sidebar", itemIds: ["bookings", "clients", "jobs", "invoicing", "leads", "communication"] },
          ],
        },
      ],
      default: "yes",
    },
  ],
};
