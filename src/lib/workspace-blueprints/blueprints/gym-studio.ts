import type { WorkspaceBlueprint } from "@/types/workspace-blueprint";

export const gymStudioBlueprint: WorkspaceBlueprint = {
  id: "health-fitness:gym-studio-owner",
  label: "Gym / Studio Owner",
  description: "Recurring workspace for gym and studio owners — class scheduling, memberships, member tracking, and attendance.",
  industryId: "health-fitness",
  personaId: "gym-studio-owner",

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
          "service-menu": true,
          "booking-reminders": true,
        },
      },
      {
        moduleId: "quotes-invoicing",
        featureOverrides: {
          "recurring": true,
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
    primaryAction: { label: "Schedule Class", href: "/dashboard/bookings", icon: "Calendar" },
    dashboardWidgets: [
      { instanceId: "w-setup", manifestId: "setup-checklist", x: 0, y: 0, w: 4, h: 2, config: {} },
      { instanceId: "w-sessions", manifestId: "sessions-this-week", x: 0, y: 2, w: 2, h: 2, config: {} },
      { instanceId: "w-upcoming", manifestId: "upcoming-bookings", x: 2, y: 2, w: 2, h: 2, config: {} },
      { instanceId: "w-revenue", manifestId: "revenue-summary", x: 0, y: 4, w: 2, h: 1, config: {} },
      { instanceId: "w-activity", manifestId: "recent-activity", x: 2, y: 4, w: 2, h: 1, config: {} },
    ],
    modulePresentation: {
      clients: {
        defaultColumns: ["name", "email", "phone", "status", "tags", "field_fitness-goals"],
        columnLabels: { name: "Member" },
      },
      bookings: {
        defaultColumns: ["title", "clientId", "date", "startTime"],
        columnLabels: { title: "Class", clientId: "Member" },
      },
    },
  },

  adjustableBlocks: [
    {
      id: "memberships",
      question: "Do you offer memberships or class packs?",
      options: [
        {
          value: "yes",
          label: "Yes, memberships",
          description: "Memberships module with recurring billing and class credits.",
          presentationPatches: [],
        },
        {
          value: "no",
          label: "No, casual drop-in only",
          description: "Simple per-class invoicing, no memberships.",
          functionalDelta: { removeModules: ["memberships"] },
          presentationPatches: [
            { op: "reorder-sidebar", itemIds: ["bookings", "clients", "invoicing", "leads", "communication"] },
          ],
        },
      ],
      default: "yes",
    },
    {
      id: "accept-inquiries",
      question: "Do new members inquire before signing up?",
      options: [
        {
          value: "no",
          label: "No, they sign up directly",
          description: "Calendar-first — members book or sign up directly.",
          presentationPatches: [],
        },
        {
          value: "yes",
          label: "Yes, trial-first",
          description: "Leads pipeline for trial bookings and follow-ups.",
          presentationPatches: [],
        },
      ],
      default: "no",
    },
  ],
};
