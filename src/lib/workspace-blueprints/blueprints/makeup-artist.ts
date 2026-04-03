import type { WorkspaceBlueprint } from "@/types/workspace-blueprint";

export const makeupArtistBlueprint: WorkspaceBlueprint = {
  id: "beauty-wellness:makeup-artist",
  label: "Makeup Artist",
  description: "Inquiry-first workspace for makeup artists — event-based leads, deposit invoicing, and client product profiles.",
  industryId: "beauty-wellness",
  personaId: "makeup-artist",

  functional: {
    workflowPattern: "inquiry-first",
    enabledModules: [
      "bookings-calendar",
      "products",
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
        moduleId: "bookings-calendar",
        featureOverrides: {
          "service-menu": true,
          "booking-reminders": true,
        },
      },
      {
        moduleId: "quotes-invoicing",
        featureOverrides: {
          "deposit-balance": true,
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
    homePage: "leads",
    sidebarOrder: ["leads", "bookings", "clients", "invoicing", "products", "documents", "communication"],
    primaryAction: { label: "New Inquiry", href: "/dashboard/leads", icon: "Plus" },
    dashboardWidgets: [
      { instanceId: "w-setup", manifestId: "setup-checklist", x: 0, y: 0, w: 4, h: 2, config: {} },
      { instanceId: "w-inquiries", manifestId: "open-inquiries", x: 0, y: 2, w: 2, h: 2, config: {} },
      { instanceId: "w-upcoming", manifestId: "upcoming-bookings", x: 2, y: 2, w: 2, h: 2, config: {} },
      { instanceId: "w-revenue", manifestId: "revenue-summary", x: 0, y: 4, w: 2, h: 1, config: {} },
      { instanceId: "w-activity", manifestId: "recent-activity", x: 2, y: 4, w: 2, h: 1, config: {} },
    ],
    modulePresentation: {
      clients: {
        defaultColumns: ["name", "email", "phone", "status", "tags", "field_foundation-shade", "field_skin-tone", "field_undertone"],
      },
      leads: {
        defaultColumns: ["name", "email", "stage", "value", "createdAt"],
      },
    },
  },

  adjustableBlocks: [
    {
      id: "sell-products",
      question: "Do you sell makeup products or kits?",
      options: [
        {
          value: "yes",
          label: "Yes, I sell products",
          description: "Products module enabled with inventory tracking",
          presentationPatches: [],
        },
        {
          value: "no",
          label: "No, services only",
          description: "Products module hidden from sidebar",
          functionalDelta: { removeModules: ["products"] },
          presentationPatches: [
            { op: "reorder-sidebar", itemIds: ["leads", "bookings", "clients", "invoicing", "documents", "communication"] },
          ],
        },
      ],
      default: "yes",
    },
    {
      id: "booking-style",
      question: "Do some clients book directly (e.g. makeup lessons)?",
      options: [
        {
          value: "no",
          label: "No, all inquiries first",
          description: "Leads-first experience for event-based work",
          presentationPatches: [],
        },
        {
          value: "yes",
          label: "Yes, some book directly",
          description: "Calendar gets equal weight alongside inquiries",
          presentationPatches: [
            { op: "reorder-sidebar", itemIds: ["leads", "bookings", "clients", "invoicing", "documents", "communication"] },
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
