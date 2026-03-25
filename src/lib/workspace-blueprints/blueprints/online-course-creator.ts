import type { WorkspaceBlueprint } from "@/types/workspace-blueprint";

export const onlineCourseCreatorBlueprint: WorkspaceBlueprint = {
  id: "education-coaching:online-course-creator",
  label: "Online Course Creator",
  description: "Recurring workspace for online course creators — student management, memberships, course tracking, and email list growth.",
  industryId: "education-coaching",
  personaId: "online-course-creator",

  functional: {
    workflowPattern: "recurring",
    enabledModules: [
      "jobs-projects",
    ],
    enabledAddons: [
      "memberships",
    ],
    moduleBehaviors: [
      {
        moduleId: "quotes-invoicing",
        featureOverrides: {
          "recurring": true,
          "session-pack": true,
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
    homePage: "clients",
    sidebarOrder: ["clients", "jobs", "invoicing", "memberships", "leads", "communication"],
    primaryAction: { label: "Add Student", href: "/dashboard/clients", icon: "Plus" },
    dashboardWidgets: [
      { instanceId: "w-setup", manifestId: "setup-checklist", x: 0, y: 0, w: 4, h: 2, config: {} },
      { instanceId: "w-sessions", manifestId: "sessions-this-week", x: 0, y: 2, w: 2, h: 2, config: {} },
      { instanceId: "w-upcoming", manifestId: "upcoming-bookings", x: 2, y: 2, w: 2, h: 2, config: {} },
      { instanceId: "w-revenue", manifestId: "revenue-summary", x: 0, y: 4, w: 2, h: 1, config: {} },
      { instanceId: "w-activity", manifestId: "recent-activity", x: 2, y: 4, w: 2, h: 1, config: {} },
    ],
    modulePresentation: {
      clients: {
        defaultColumns: ["name", "email", "phone", "status", "tags", "field_platform", "field_course-topic"],
        columnLabels: { name: "Student" },
      },
      jobs: {
        defaultColumns: ["title", "clientId", "stage", "dueDate"],
        columnLabels: { title: "Course" },
      },
    },
  },

  adjustableBlocks: [
    {
      id: "memberships",
      question: "Do you offer memberships or subscription access?",
      options: [
        {
          value: "yes",
          label: "Yes, memberships",
          description: "Memberships module with recurring billing for course access.",
          presentationPatches: [],
        },
        {
          value: "no",
          label: "No, one-time purchases",
          description: "Simple one-time invoicing per course.",
          functionalDelta: { removeModules: ["memberships"] },
          presentationPatches: [
            { op: "reorder-sidebar", itemIds: ["clients", "jobs", "invoicing", "leads", "communication"] },
          ],
        },
      ],
      default: "yes",
    },
    {
      id: "course-tracking",
      question: "Do you track course creation as projects?",
      options: [
        {
          value: "yes",
          label: "Yes, I track courses",
          description: "Jobs/Projects module for tracking course creation with task checklists.",
          presentationPatches: [],
        },
        {
          value: "no",
          label: "No, just student management",
          description: "Simplified — focus on students and invoicing only.",
          functionalDelta: { removeModules: ["jobs-projects"] },
          presentationPatches: [
            { op: "reorder-sidebar", itemIds: ["clients", "invoicing", "memberships", "leads", "communication"] },
          ],
        },
      ],
      default: "yes",
    },
  ],
};
