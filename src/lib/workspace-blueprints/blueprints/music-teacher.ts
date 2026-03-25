import type { WorkspaceBlueprint } from "@/types/workspace-blueprint";

export const musicTeacherBlueprint: WorkspaceBlueprint = {
  id: "education-coaching:music-teacher",
  label: "Music Teacher",
  description: "Recurring workspace for music teachers — lesson scheduling, student instrument tracking, exam preparation, and session packs.",
  industryId: "education-coaching",
  personaId: "music-teacher",

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
        defaultColumns: ["name", "email", "phone", "status", "tags", "field_instrument", "field_current-grade-level", "field_exam-board"],
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
      id: "session-packs",
      question: "Do you sell term packs or lesson bundles?",
      options: [
        {
          value: "yes",
          label: "Yes, term packs",
          description: "Memberships module with session-based billing.",
          presentationPatches: [],
        },
        {
          value: "no",
          label: "No, pay per lesson",
          description: "Simple per-lesson invoicing.",
          functionalDelta: { removeModules: ["memberships"] },
          presentationPatches: [
            { op: "reorder-sidebar", itemIds: ["bookings", "clients", "invoicing", "leads", "communication"] },
          ],
        },
      ],
      default: "yes",
    },
    {
      id: "group-lessons",
      question: "Do you teach group lessons or ensembles?",
      options: [
        {
          value: "no",
          label: "1-on-1 only",
          description: "Private music lessons only.",
          presentationPatches: [],
        },
        {
          value: "yes",
          label: "Yes, group lessons too",
          description: "Enable group bookings with max attendees.",
          presentationPatches: [],
        },
      ],
      default: "no",
    },
  ],
};
