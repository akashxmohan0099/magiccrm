import type { WorkspaceBlueprint } from "@/types/workspace-blueprint";

export const therapistBlueprint: WorkspaceBlueprint = {
  id: "health-fitness:therapist",
  label: "Therapist",
  description: "Booking-first workspace for therapists — session scheduling, referral tracking, presenting concerns, and treatment plan management.",
  industryId: "health-fitness",
  personaId: "therapist",

  functional: {
    workflowPattern: "booking-first",
    enabledModules: [
      "bookings-calendar",
      "jobs-projects",
    ],
    enabledAddons: [],
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
    sidebarOrder: ["bookings", "clients", "jobs", "invoicing", "leads", "communication"],
    primaryAction: { label: "Schedule Session", href: "/dashboard/bookings", icon: "Calendar" },
    dashboardWidgets: [
      { instanceId: "w-setup", manifestId: "setup-checklist", x: 0, y: 0, w: 4, h: 2, config: {} },
      { instanceId: "w-upcoming", manifestId: "upcoming-bookings", x: 0, y: 2, w: 2, h: 2, config: {} },
      { instanceId: "w-rebook", manifestId: "rebookings-due", x: 2, y: 2, w: 2, h: 2, config: {} },
      { instanceId: "w-revenue", manifestId: "revenue-summary", x: 0, y: 4, w: 2, h: 1, config: {} },
      { instanceId: "w-activity", manifestId: "recent-activity", x: 2, y: 4, w: 2, h: 1, config: {} },
    ],
    modulePresentation: {
      clients: {
        defaultColumns: ["name", "email", "phone", "status", "tags", "field_referral-source", "field_presenting-concerns"],
      },
      bookings: {
        defaultColumns: ["title", "clientId", "date", "startTime"],
        columnLabels: { title: "Session" },
      },
      jobs: {
        defaultColumns: ["title", "clientId", "stage", "dueDate"],
        columnLabels: { title: "Treatment Plan" },
      },
    },
  },

  adjustableBlocks: [
    {
      id: "treatment-plans",
      question: "Do you create treatment plans for clients?",
      options: [
        {
          value: "yes",
          label: "Yes, I track treatment plans",
          description: "Jobs/Projects module used for treatment plans with task checklists.",
          presentationPatches: [],
        },
        {
          value: "no",
          label: "No, just sessions",
          description: "Simplified — just bookings and invoicing, no treatment plan tracking.",
          functionalDelta: { removeModules: ["jobs-projects"] },
          presentationPatches: [
            { op: "reorder-sidebar", itemIds: ["bookings", "clients", "invoicing", "leads", "communication"] },
          ],
        },
      ],
      default: "yes",
    },
    {
      id: "accept-referrals",
      question: "Do clients come via referrals (GP, EAP, etc.)?",
      options: [
        {
          value: "yes",
          label: "Yes, I receive referrals",
          description: "Leads pipeline enabled for tracking referrals.",
          presentationPatches: [],
        },
        {
          value: "no",
          label: "No, direct bookings only",
          description: "No leads pipeline — clients book sessions directly.",
          presentationPatches: [
            { op: "reorder-sidebar", itemIds: ["bookings", "clients", "jobs", "invoicing", "communication"] },
          ],
        },
      ],
      default: "yes",
    },
  ],
};
