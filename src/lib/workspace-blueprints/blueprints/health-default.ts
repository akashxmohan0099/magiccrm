import type { WorkspaceBlueprint } from "@/types/workspace-blueprint";

export const healthDefaultBlueprint: WorkspaceBlueprint = {
  id: "health-fitness:default",
  label: "Health & Fitness",
  description: "Booking-first workspace for health and fitness professionals — service menu, client health profiles, session packs, and rebooking prompts.",
  industryId: "health-fitness",
  personaId: "default",

  functional: {
    workflowPattern: "booking-first",
    enabledModules: [
      "bookings-calendar",
    ],
    enabledAddons: [],
    moduleBehaviors: [
      {
        moduleId: "bookings-calendar",
        featureOverrides: {
          "service-menu": true,
          "rebooking-prompts": true,
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
    sidebarOrder: ["bookings", "clients", "invoicing", "leads", "communication"],
    primaryAction: { label: "Book Session", href: "/dashboard/bookings", icon: "Calendar" },
    dashboardWidgets: [
      { instanceId: "w-setup", manifestId: "setup-checklist", x: 0, y: 0, w: 4, h: 2, config: {} },
      { instanceId: "w-upcoming", manifestId: "upcoming-bookings", x: 0, y: 2, w: 2, h: 2, config: {} },
      { instanceId: "w-rebook", manifestId: "rebookings-due", x: 2, y: 2, w: 2, h: 2, config: {} },
      { instanceId: "w-revenue", manifestId: "revenue-summary", x: 0, y: 4, w: 2, h: 1, config: {} },
      { instanceId: "w-activity", manifestId: "recent-activity", x: 2, y: 4, w: 2, h: 1, config: {} },
    ],
    modulePresentation: {
      clients: {
        defaultColumns: ["name", "email", "phone", "status", "tags", "field_fitness-goals", "field_injuries"],
      },
      bookings: {
        defaultColumns: ["title", "clientId", "date", "startTime"],
      },
    },
  },

  adjustableBlocks: [
    {
      id: "session-packs",
      question: "Do you sell session packs (e.g. 10 sessions)?",
      options: [
        {
          value: "yes",
          label: "Yes, session packs",
          description: "Session-pack invoicing for bulk purchases.",
          presentationPatches: [],
        },
        {
          value: "no",
          label: "No, pay per session",
          description: "Simple per-session invoicing only.",
          presentationPatches: [],
        },
      ],
      default: "yes",
    },
    {
      id: "accept-inquiries",
      question: "Do new clients inquire before booking?",
      options: [
        {
          value: "no",
          label: "No, they book directly",
          description: "Calendar-first — clients book sessions directly.",
          presentationPatches: [],
        },
        {
          value: "yes",
          label: "Yes, they inquire first",
          description: "Leads pipeline becomes the primary entry point.",
          functionalDelta: { workflowPattern: "inquiry-first" },
          presentationPatches: [
            { op: "set-homepage", pageId: "leads" },
            { op: "reorder-sidebar", itemIds: ["leads", "bookings", "clients", "invoicing", "communication"] },
            { op: "replace-dashboard-widgets", widgets: [
              { instanceId: "w-setup", manifestId: "setup-checklist", x: 0, y: 0, w: 4, h: 2, config: {} },
              { instanceId: "w-inquiries", manifestId: "open-inquiries", x: 0, y: 2, w: 2, h: 2, config: {} },
              { instanceId: "w-upcoming", manifestId: "upcoming-bookings", x: 2, y: 2, w: 2, h: 2, config: {} },
              { instanceId: "w-revenue", manifestId: "revenue-summary", x: 0, y: 4, w: 2, h: 1, config: {} },
              { instanceId: "w-activity", manifestId: "recent-activity", x: 2, y: 4, w: 2, h: 1, config: {} },
            ]},
          ],
        },
      ],
      default: "no",
    },
  ],
};
