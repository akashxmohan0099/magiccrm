import type { WorkspaceBlueprint } from "@/types/workspace-blueprint";

export const tutorBlueprint: WorkspaceBlueprint = {
  id: "education-coaching:tutor",
  label: "Tutor",
  description: "Recurring workspace for tutors — lesson scheduling, session packs, student tracking, and attendance.",
  industryId: "education-coaching",
  personaId: "tutor",

  functional: {
    workflowPattern: "recurring",
    enabledModules: [
      "bookings-calendar",
    ],
    enabledAddons: [
      "memberships",
    ],
    moduleBehaviors: [
      {
        moduleId: "bookings-calendar",
        featureOverrides: {
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
    ],
  },

  presentation: {
    homePage: "bookings",
    sidebarOrder: ["bookings", "clients", "invoicing", "memberships", "leads", "communication"],
    primaryAction: { label: "Schedule Lesson", href: "/dashboard/bookings", icon: "Calendar" },
    dashboardWidgets: [
      { instanceId: "w-setup", manifestId: "setup-checklist", x: 0, y: 0, w: 4, h: 2, config: {} },
      { instanceId: "w-sessions", manifestId: "sessions-this-week", x: 0, y: 2, w: 2, h: 2, config: {} },
      { instanceId: "w-upcoming", manifestId: "upcoming-bookings", x: 2, y: 2, w: 2, h: 2, config: {} },
      { instanceId: "w-revenue", manifestId: "revenue-summary", x: 0, y: 4, w: 2, h: 1, config: {} },
      { instanceId: "w-activity", manifestId: "recent-activity", x: 2, y: 4, w: 2, h: 1, config: {} },
    ],
    modulePresentation: {
      clients: {
        defaultColumns: ["name", "email", "phone", "status", "tags"],
        columnLabels: { name: "Student" },
      },
      bookings: {
        defaultColumns: ["title", "clientId", "date", "startTime"],
        columnLabels: { title: "Lesson", clientId: "Student" },
      },
    },
  },

  adjustableBlocks: [
    {
      id: "group-classes",
      question: "Do you offer group classes or lessons?",
      options: [
        {
          value: "no",
          label: "1-on-1 only",
          description: "Private tutoring sessions only.",
          presentationPatches: [],
        },
        {
          value: "yes",
          label: "Yes, group classes too",
          description: "Enable group bookings with max attendees.",
          presentationPatches: [],
        },
      ],
      default: "no",
    },
    {
      id: "session-packs",
      question: "Do you sell lesson packs (e.g. 10 sessions)?",
      options: [
        {
          value: "yes",
          label: "Yes, session packs",
          description: "Memberships module with session-based billing.",
          presentationPatches: [],
        },
        {
          value: "no",
          label: "No, pay per lesson",
          description: "Simple per-session invoicing.",
          functionalDelta: { removeModules: ["memberships"] },
          presentationPatches: [
            { op: "reorder-sidebar", itemIds: ["bookings", "clients", "invoicing", "leads", "communication"] },
          ],
        },
      ],
      default: "yes",
    },
  ],
};
