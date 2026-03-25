import type { WorkspaceBlueprint } from "@/types/workspace-blueprint";

export const barberBlueprint: WorkspaceBlueprint = {
  id: "beauty-wellness:barber",
  label: "Barber",
  description: "Booking-first workspace for barbers — simple service menu, quick appointments, and client management.",
  industryId: "beauty-wellness",
  personaId: "barber",

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
          "booking-reminders": true,
        },
      },
      {
        moduleId: "client-database",
        featureOverrides: {
          "client-tags": true,
        },
      },
    ],
  },

  presentation: {
    homePage: "bookings",
    sidebarOrder: ["bookings", "clients", "invoicing", "leads", "communication"],
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
        defaultColumns: ["name", "email", "phone", "status", "tags"],
      },
      bookings: {
        defaultColumns: ["title", "clientId", "date", "startTime", "assignedToName"],
      },
    },
  },

  adjustableBlocks: [
    {
      id: "sell-products",
      question: "Do you sell grooming products?",
      options: [
        {
          value: "yes",
          label: "Yes, I sell products",
          description: "Products module enabled with inventory tracking",
          functionalDelta: { addModules: ["products"] },
          presentationPatches: [
            { op: "reorder-sidebar", itemIds: ["bookings", "clients", "invoicing", "products", "leads", "communication"] },
          ],
        },
        {
          value: "no",
          label: "No, services only",
          description: "Simple setup without products",
          presentationPatches: [],
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
  ],
};
