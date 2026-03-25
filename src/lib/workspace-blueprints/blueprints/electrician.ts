import type { WorkspaceBlueprint } from "@/types/workspace-blueprint";

export const electricianBlueprint: WorkspaceBlueprint = {
  id: "trades-construction:electrician",
  label: "Electrician",
  description: "Inquiry-first workspace for electricians — leads pipeline, quoting, compliance tracking, and job management.",
  industryId: "trades-construction",
  personaId: "electrician",

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
        defaultColumns: ["name", "email", "phone", "status", "tags", "field_site-address", "field_switchboard-details", "field_compliance-status"],
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
      question: "Do you schedule site visits or inspections?",
      options: [
        {
          value: "yes",
          label: "Yes, I schedule visits",
          description: "Calendar for site visits and inspections",
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
      id: "track-compliance",
      question: "Do you track safety certificates and compliance?",
      options: [
        {
          value: "yes",
          label: "Yes, track compliance",
          description: "Safety certificate and circuit info visible in client profiles",
          presentationPatches: [
            { op: "set-module-default-columns", moduleId: "clients", columnIds: ["name", "email", "phone", "status", "tags", "field_site-address", "field_switchboard-details", "field_circuit-info", "field_safety-cert-number", "field_compliance-status"] },
          ],
        },
        {
          value: "no",
          label: "No, keep it simple",
          description: "Standard client columns without compliance fields",
          presentationPatches: [],
        },
      ],
      default: "yes",
    },
  ],
};
