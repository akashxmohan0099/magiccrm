import type { WorkspaceBlueprint } from "@/types/workspace-blueprint";

export const retailDefaultBlueprint: WorkspaceBlueprint = {
  id: "retail-ecommerce:default",
  label: "Retail & E-commerce",
  description: "Booking-first workspace for retail businesses — appointments, customer management, order tracking, and loyalty tiers.",
  industryId: "retail-ecommerce",
  personaId: "default",

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
        defaultColumns: ["name", "email", "phone", "status", "tags", "field_preferred-products", "field_loyalty-tier"],
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
      question: "Do you track orders as projects?",
      options: [
        {
          value: "yes",
          label: "Yes, I track orders",
          description: "Jobs/Projects module for order tracking with task checklists.",
          presentationPatches: [],
        },
        {
          value: "no",
          label: "No, just invoicing",
          description: "Simplified — no order tracking, just invoicing.",
          functionalDelta: { removeModules: ["jobs-projects"] },
          presentationPatches: [
            { op: "reorder-sidebar", itemIds: ["bookings", "clients", "invoicing", "leads", "communication"] },
          ],
        },
      ],
      default: "yes",
    },
    {
      id: "workflow-style",
      question: "How do customers typically reach you?",
      options: [
        {
          value: "book",
          label: "They book appointments",
          description: "Calendar-first — customers book in-store appointments.",
          presentationPatches: [],
        },
        {
          value: "inquire",
          label: "They inquire first",
          description: "Leads pipeline for handling inquiries before purchase.",
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
      default: "book",
    },
  ],
};
