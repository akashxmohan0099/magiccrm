import type { WorkspaceBlueprint } from "@/types/workspace-blueprint";

export const webDesignerBlueprint: WorkspaceBlueprint = {
  id: "creative-services:web-designer-developer",
  label: "Web Designer / Developer",
  description: "Inquiry-first, project-focused workspace for web designers and developers — leads pipeline, project tracking, proposals, and milestone invoicing.",
  industryId: "creative-services",
  personaId: "web-designer-developer",

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
          "milestone": true,
          "deposit-balance": true,
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
    primaryAction: { label: "New Inquiry", href: "/dashboard/leads", icon: "Plus" },
    dashboardWidgets: [
      { instanceId: "w-setup", manifestId: "setup-checklist", x: 0, y: 0, w: 4, h: 2, config: {} },
      { instanceId: "w-inquiries", manifestId: "open-inquiries", x: 0, y: 2, w: 2, h: 2, config: {} },
      { instanceId: "w-proposals", manifestId: "proposals-pending", x: 2, y: 2, w: 2, h: 2, config: {} },
      { instanceId: "w-jobs", manifestId: "active-jobs", x: 0, y: 4, w: 2, h: 1, config: {} },
      { instanceId: "w-revenue", manifestId: "revenue-summary", x: 2, y: 4, w: 2, h: 1, config: {} },
    ],
    modulePresentation: {
      clients: {
        defaultColumns: ["name", "email", "phone", "status", "tags", "field_project-type", "field_brand-guidelines"],
      },
      leads: {
        defaultColumns: ["name", "email", "stage", "value", "createdAt"],
      },
      jobs: {
        defaultColumns: ["title", "clientId", "stage", "dueDate"],
        columnLabels: { title: "Project" },
      },
    },
  },

  adjustableBlocks: [
    {
      id: "discovery-calls",
      question: "Do you schedule discovery calls with prospects?",
      options: [
        {
          value: "yes",
          label: "Yes, I book calls",
          description: "Calendar enabled for scheduling calls with prospects and clients.",
          presentationPatches: [],
        },
        {
          value: "no",
          label: "No, just email/chat",
          description: "Bookings calendar hidden — communicate via email or messaging.",
          functionalDelta: { removeModules: ["bookings-calendar"] },
          presentationPatches: [
            { op: "reorder-sidebar", itemIds: ["leads", "jobs", "clients", "invoicing", "documents", "communication"] },
          ],
        },
      ],
      default: "yes",
    },
    {
      id: "track-projects",
      question: "Do you track web projects with tasks and milestones?",
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
