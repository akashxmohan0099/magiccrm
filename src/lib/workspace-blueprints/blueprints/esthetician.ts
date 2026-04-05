import type { WorkspaceBlueprint } from "@/types/workspace-blueprint";

export const estheticianBlueprint: WorkspaceBlueprint = {
  id: "beauty-wellness:esthetician",
  label: "Skin Clinic",
  description: "Booking-first workspace for estheticians and skin therapists — treatment plans, skin profiles, product sensitivities, and clinical notes.",
  industryId: "beauty-wellness",
  personaId: "esthetician",

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
        moduleId: "client-database",
        featureOverrides: {
          "client-tags": true,
          "follow-up-reminders": true,
        },
      },
      {
        moduleId: "leads-pipeline",
        featureOverrides: {
          "web-forms": true,
          "follow-up-reminders": true,
        },
      },
    ],
  },

  presentation: {
    homePage: "bookings",
    sidebarOrder: ["bookings", "clients", "invoicing", "leads", "communication"],
    primaryAction: { label: "Book Treatment", href: "/dashboard/bookings", icon: "Calendar" },
    dashboardWidgets: [
      { instanceId: "w-setup", manifestId: "setup-checklist", x: 0, y: 0, w: 4, h: 2, config: {} },
      { instanceId: "w-upcoming", manifestId: "upcoming-bookings", x: 0, y: 2, w: 2, h: 2, config: {} },
      { instanceId: "w-rebook", manifestId: "rebookings-due", x: 2, y: 2, w: 2, h: 2, config: {} },
      { instanceId: "w-revenue", manifestId: "revenue-summary", x: 0, y: 4, w: 2, h: 1, config: {} },
      { instanceId: "w-activity", manifestId: "recent-activity", x: 2, y: 4, w: 2, h: 1, config: {} },
    ],
    modulePresentation: {
      clients: {
        defaultColumns: ["name", "email", "phone", "status", "tags", "field_skin-type", "field_skin-concerns"],
      },
      bookings: {
        defaultColumns: ["title", "clientId", "date", "startTime", "status"],
      },
    },
  },

  adjustableBlocks: [
    {
      id: "accept-inquiries",
      question: "Do clients inquire before booking, or book directly?",
      options: [
        {
          value: "direct",
          label: "They book directly",
          description: "Calendar-first experience, leads are secondary",
          presentationPatches: [],
        },
        {
          value: "inquire-first",
          label: "They inquire first",
          description: "Leads become your primary entry point",
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
      default: "direct",
    },
    {
      id: "track-sensitivities",
      question: "Do you track product sensitivities per client?",
      options: [
        {
          value: "yes",
          label: "Yes, track sensitivities",
          description: "Product sensitivities field visible in client profiles",
          presentationPatches: [
            { op: "set-module-default-columns", moduleId: "clients", columnIds: ["name", "email", "phone", "status", "tags", "field_skin-type", "field_skin-concerns", "field_product-sensitivities"] },
          ],
        },
        {
          value: "no",
          label: "No, keep it simple",
          description: "Standard client columns without sensitivities",
          presentationPatches: [],
        },
      ],
      default: "yes",
    },
  ],
};
