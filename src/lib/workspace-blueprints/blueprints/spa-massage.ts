import type { WorkspaceBlueprint } from "@/types/workspace-blueprint";

export const spaMassageBlueprint: WorkspaceBlueprint = {
  id: "beauty-wellness:spa-massage",
  label: "Spa & Massage",
  description: "Booking-first workspace for spa and massage therapists — treatment menu, health profiles, and rebooking prompts.",
  industryId: "beauty-wellness",
  personaId: "spa-massage",

  functional: {
    workflowPattern: "booking-first",
    enabledModules: [
      "bookings-calendar",
      "products",
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
    ],
  },

  presentation: {
    homePage: "bookings",
    sidebarOrder: ["bookings", "clients", "invoicing", "products", "leads", "communication"],
    primaryAction: { label: "Book Appointment", href: "/dashboard/bookings", icon: "Calendar" },
    dashboardWidgets: [
      { instanceId: "w-setup", manifestId: "setup-checklist", x: 0, y: 0, w: 4, h: 2, config: {} },
      { instanceId: "w-upcoming", manifestId: "upcoming-bookings", x: 0, y: 2, w: 2, h: 2, config: {} },
      { instanceId: "w-rebook", manifestId: "rebookings-due", x: 2, y: 2, w: 2, h: 2, config: {} },
      { instanceId: "w-revenue", manifestId: "revenue-summary", x: 0, y: 4, w: 2, h: 1, config: {} },
      { instanceId: "w-activity", manifestId: "recent-activity", x: 2, y: 4, w: 2, h: 1, config: {} },
    ],
    modulePresentation: {
      clients: {
        defaultColumns: ["name", "email", "phone", "status", "tags", "field_pressure-preference", "field_injuries-conditions"],
      },
      bookings: {
        defaultColumns: ["title", "clientId", "date", "startTime", "assignedToName"],
      },
    },
  },

  adjustableBlocks: [
    {
      id: "sell-products",
      question: "Do you sell wellness products or retail items?",
      options: [
        {
          value: "yes",
          label: "Yes, I sell products",
          description: "Products module enabled with inventory tracking",
          presentationPatches: [],
        },
        {
          value: "no",
          label: "No, treatments only",
          description: "Products module hidden from sidebar",
          functionalDelta: { removeModules: ["products"] },
          presentationPatches: [
            { op: "reorder-sidebar", itemIds: ["bookings", "clients", "invoicing", "leads", "communication"] },
          ],
        },
      ],
      default: "no",
    },
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
      id: "track-health",
      question: "Do you need to track client contraindications?",
      options: [
        {
          value: "yes",
          label: "Yes, track health details",
          description: "Contraindications field visible in client profiles",
          presentationPatches: [
            { op: "set-module-default-columns", moduleId: "clients", columnIds: ["name", "email", "phone", "status", "tags", "field_pressure-preference", "field_injuries-conditions", "field_contraindications"] },
          ],
        },
        {
          value: "no",
          label: "No, keep it simple",
          description: "Standard client columns without contraindications",
          presentationPatches: [],
        },
      ],
      default: "yes",
    },
  ],
};
