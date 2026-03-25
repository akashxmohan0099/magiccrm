import type { WorkspaceBlueprint } from "@/types/workspace-blueprint";

export const boutiqueShopBlueprint: WorkspaceBlueprint = {
  id: "retail-ecommerce:boutique-shop",
  label: "Boutique Shop",
  description: "Appointment-based workspace for boutique shops — in-store appointments, customer style profiles, VIP tiers, and wishlists.",
  industryId: "retail-ecommerce",
  personaId: "boutique-shop",

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
          "booking-reminders": true,
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
    primaryAction: { label: "New Appointment", href: "/dashboard/bookings", icon: "Calendar" },
    dashboardWidgets: [
      { instanceId: "w-setup", manifestId: "setup-checklist", x: 0, y: 0, w: 4, h: 2, config: {} },
      { instanceId: "w-upcoming", manifestId: "upcoming-bookings", x: 0, y: 2, w: 2, h: 2, config: {} },
      { instanceId: "w-rebook", manifestId: "rebookings-due", x: 2, y: 2, w: 2, h: 2, config: {} },
      { instanceId: "w-revenue", manifestId: "revenue-summary", x: 0, y: 4, w: 2, h: 1, config: {} },
      { instanceId: "w-activity", manifestId: "recent-activity", x: 2, y: 4, w: 2, h: 1, config: {} },
    ],
    modulePresentation: {
      clients: {
        defaultColumns: ["name", "email", "phone", "status", "tags", "field_size-preferences", "field_style-profile", "field_vip-tier"],
        columnLabels: { name: "Customer" },
      },
      bookings: {
        defaultColumns: ["title", "clientId", "date", "startTime"],
        columnLabels: { clientId: "Customer" },
      },
      jobs: {
        defaultColumns: ["title", "clientId", "stage", "dueDate"],
        columnLabels: { title: "Order", clientId: "Customer" },
      },
    },
  },

  adjustableBlocks: [
    {
      id: "order-tracking",
      question: "Do you track special orders as projects?",
      options: [
        {
          value: "yes",
          label: "Yes, I track orders",
          description: "Jobs/Projects module for special order tracking.",
          presentationPatches: [],
        },
        {
          value: "no",
          label: "No, just appointments and invoicing",
          description: "Simplified — no order tracking.",
          functionalDelta: { removeModules: ["jobs-projects"] },
          presentationPatches: [
            { op: "reorder-sidebar", itemIds: ["bookings", "clients", "invoicing", "leads", "communication"] },
          ],
        },
      ],
      default: "yes",
    },
    {
      id: "accept-inquiries",
      question: "Do customers inquire before visiting?",
      options: [
        {
          value: "no",
          label: "No, they book appointments",
          description: "Calendar-first — customers book in-store appointments.",
          presentationPatches: [],
        },
        {
          value: "yes",
          label: "Yes, they inquire first",
          description: "Leads pipeline for handling inquiries before appointments.",
          functionalDelta: { workflowPattern: "inquiry-first" },
          presentationPatches: [
            { op: "set-homepage", pageId: "leads" },
            { op: "reorder-sidebar", itemIds: ["leads", "bookings", "clients", "jobs", "invoicing", "communication"] },
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
