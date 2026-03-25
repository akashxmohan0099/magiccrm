import type { WorkspaceBlueprint } from "@/types/workspace-blueprint";

export const professionalDefaultBlueprint: WorkspaceBlueprint = {
  id: "professional-services:default",
  label: "Professional Services",
  description: "Inquiry-first workspace for professional services — prospects pipeline, proposals, project tracking, and recurring billing.",
  industryId: "professional-services",
  personaId: "default",

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
          "proposals": true,
          "recurring": true,
        },
      },
      {
        moduleId: "jobs-projects",
        featureOverrides: {
          "task-checklists": true,
          "time-tracking": true,
        },
      },
    ],
  },

  presentation: {
    homePage: "leads",
    sidebarOrder: ["leads", "jobs", "clients", "bookings", "invoicing", "documents", "communication"],
    primaryAction: { label: "New Prospect", href: "/dashboard/leads", icon: "Plus" },
    dashboardWidgets: [
      { instanceId: "w-setup", manifestId: "setup-checklist", x: 0, y: 0, w: 4, h: 2, config: {} },
      { instanceId: "w-inquiries", manifestId: "open-inquiries", x: 0, y: 2, w: 2, h: 2, config: {} },
      { instanceId: "w-proposals", manifestId: "proposals-pending", x: 2, y: 2, w: 2, h: 2, config: {} },
      { instanceId: "w-jobs", manifestId: "active-jobs", x: 0, y: 4, w: 2, h: 1, config: {} },
      { instanceId: "w-revenue", manifestId: "revenue-summary", x: 2, y: 4, w: 2, h: 1, config: {} },
    ],
    modulePresentation: {
      clients: {
        defaultColumns: ["name", "email", "phone", "status", "tags", "field_company-name", "field_engagement-type"],
      },
      leads: {
        defaultColumns: ["name", "email", "stage", "value", "createdAt"],
        columnLabels: { name: "Prospect" },
      },
      jobs: {
        defaultColumns: ["title", "clientId", "stage", "dueDate"],
        columnLabels: { title: "Project" },
      },
    },
  },

  adjustableBlocks: [
    {
      id: "billing-style",
      question: "How do you typically bill clients?",
      options: [
        {
          value: "recurring",
          label: "Recurring retainers",
          description: "Monthly or periodic recurring invoicing for ongoing engagements.",
          presentationPatches: [],
        },
        {
          value: "project",
          label: "Per-project billing",
          description: "One-time or milestone invoicing per project.",
          presentationPatches: [],
        },
      ],
      default: "recurring",
    },
    {
      id: "track-projects",
      question: "Do you track work as projects with tasks?",
      options: [
        {
          value: "yes",
          label: "Yes, I track projects",
          description: "Jobs/Projects module with task checklists and time tracking.",
          presentationPatches: [],
        },
        {
          value: "no",
          label: "No, I just invoice",
          description: "Simplified — no project tracking, just invoicing.",
          functionalDelta: { removeModules: ["jobs-projects"] },
          presentationPatches: [
            { op: "reorder-sidebar", itemIds: ["leads", "clients", "bookings", "invoicing", "documents", "communication"] },
          ],
        },
      ],
      default: "yes",
    },
  ],
};
