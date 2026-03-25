import type { WorkspaceBlueprint } from "@/types/workspace-blueprint";

export const hvacTechnicianBlueprint: WorkspaceBlueprint = {
  id: "trades-construction:hvac-technician",
  label: "HVAC Technician",
  description: "Inquiry-first workspace for HVAC technicians — leads pipeline, quoting, equipment tracking, and warranty management.",
  industryId: "trades-construction",
  personaId: "hvac-technician",

  functional: {
    workflowPattern: "inquiry-first",
    enabledModules: [
      "bookings-calendar",
      "jobs-projects",
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
        moduleId: "quotes-invoicing",
        featureOverrides: {
          "quoting": true,
          "milestone": true,
          "deposit-balance": true,
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
    sidebarOrder: ["leads", "jobs", "clients", "bookings", "invoicing", "documents", "communication"],
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
        defaultColumns: ["name", "email", "phone", "status", "tags", "field_site-address", "field_unit-make-model", "field_serial-number", "field_refrigerant-type"],
      },
      leads: {
        defaultColumns: ["name", "email", "stage", "value", "createdAt"],
      },
      jobs: {
        defaultColumns: ["title", "clientId", "stage", "dueDate"],
      },
    },
  },

  adjustableBlocks: [
    {
      id: "track-projects",
      question: "Do you track jobs as projects with tasks?",
      options: [
        {
          value: "yes",
          label: "Yes, I track projects",
          description: "Jobs/Projects module with task checklists",
          presentationPatches: [],
        },
        {
          value: "no",
          label: "No, just quote and invoice",
          description: "Simplified — no project tracking, just quoting and invoicing",
          functionalDelta: { removeModules: ["jobs-projects"] },
          presentationPatches: [
            { op: "reorder-sidebar", itemIds: ["leads", "clients", "bookings", "invoicing", "documents", "communication"] },
          ],
        },
      ],
      default: "yes",
    },
    {
      id: "schedule-visits",
      question: "Do you schedule site visits or service calls?",
      options: [
        {
          value: "yes",
          label: "Yes, I schedule visits",
          description: "Calendar for site visits and service calls",
          presentationPatches: [],
        },
        {
          value: "no",
          label: "No, I don't need a calendar",
          description: "Calendar hidden from sidebar",
          functionalDelta: { removeModules: ["bookings-calendar"] },
          presentationPatches: [
            { op: "reorder-sidebar", itemIds: ["leads", "jobs", "clients", "invoicing", "documents", "communication"] },
          ],
        },
      ],
      default: "yes",
    },
    {
      id: "track-warranty",
      question: "Do you track equipment warranty dates?",
      options: [
        {
          value: "yes",
          label: "Yes, track warranties",
          description: "Install date and warranty expiry visible in client profiles",
          presentationPatches: [
            { op: "set-module-default-columns", moduleId: "clients", columnIds: ["name", "email", "phone", "status", "tags", "field_site-address", "field_unit-make-model", "field_serial-number", "field_refrigerant-type", "field_install-date", "field_warranty-expiry"] },
          ],
        },
        {
          value: "no",
          label: "No, keep it simple",
          description: "Standard client columns without warranty tracking",
          presentationPatches: [],
        },
      ],
      default: "yes",
    },
  ],
};
