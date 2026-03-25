import type { WorkspaceBlueprint } from "@/types/workspace-blueprint";

export const onlineStoreBlueprint: WorkspaceBlueprint = {
  id: "retail-ecommerce:online-store",
  label: "Online Store",
  description: "Order-focused workspace for online stores — customer management, order tracking, shipping details, and revenue insights.",
  industryId: "retail-ecommerce",
  personaId: "online-store",

  functional: {
    workflowPattern: "inquiry-first",
    enabledModules: [
      "jobs-projects",
    ],
    enabledAddons: [],
    moduleBehaviors: [
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
    homePage: "leads",
    sidebarOrder: ["leads", "clients", "jobs", "invoicing", "communication"],
    primaryAction: { label: "New Lead", href: "/dashboard/leads", icon: "Plus" },
    dashboardWidgets: [
      { instanceId: "w-setup", manifestId: "setup-checklist", x: 0, y: 0, w: 4, h: 2, config: {} },
      { instanceId: "w-inquiries", manifestId: "open-inquiries", x: 0, y: 2, w: 2, h: 2, config: {} },
      { instanceId: "w-jobs", manifestId: "active-jobs", x: 2, y: 2, w: 2, h: 2, config: {} },
      { instanceId: "w-revenue", manifestId: "revenue-summary", x: 0, y: 4, w: 2, h: 1, config: {} },
      { instanceId: "w-activity", manifestId: "recent-activity", x: 2, y: 4, w: 2, h: 1, config: {} },
    ],
    modulePresentation: {
      clients: {
        defaultColumns: ["name", "email", "phone", "status", "tags", "field_shipping-address", "field_preferred-shipping", "field_order-history-notes"],
        columnLabels: { name: "Customer" },
      },
      leads: {
        defaultColumns: ["name", "email", "stage", "value", "createdAt"],
        columnLabels: { name: "Customer Lead" },
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
      question: "Do you track orders as projects in the CRM?",
      options: [
        {
          value: "yes",
          label: "Yes, I track orders",
          description: "Jobs/Projects module for order tracking with fulfillment stages.",
          presentationPatches: [],
        },
        {
          value: "no",
          label: "No, just customer management",
          description: "Simplified — focus on customers and invoicing only.",
          functionalDelta: { removeModules: ["jobs-projects"] },
          presentationPatches: [
            { op: "reorder-sidebar", itemIds: ["leads", "clients", "invoicing", "communication"] },
          ],
        },
      ],
      default: "yes",
    },
    {
      id: "lead-capture",
      question: "Do you capture leads before they become customers?",
      options: [
        {
          value: "yes",
          label: "Yes, I capture leads",
          description: "Leads pipeline for nurturing prospects into customers.",
          presentationPatches: [],
        },
        {
          value: "no",
          label: "No, direct customers only",
          description: "Customer-first — skip the leads pipeline.",
          presentationPatches: [
            { op: "set-homepage", pageId: "clients" },
            { op: "reorder-sidebar", itemIds: ["clients", "jobs", "invoicing", "communication"] },
          ],
        },
      ],
      default: "yes",
    },
  ],
};
