import type { WorkspaceBlueprint } from "@/types/workspace-blueprint";

export const physioChiroBlueprint: WorkspaceBlueprint = {
  id: "health-fitness:physio-chiro",
  label: "Physio / Chiro",
  description: "Booking-first workspace for physiotherapists and chiropractors — appointments, treatment plans, referring GP tracking, and health fund details.",
  industryId: "health-fitness",
  personaId: "physio-chiro",

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
          "rebooking-prompts": true,
          "booking-reminders": true,
        },
      },
      {
        moduleId: "quotes-invoicing",
        featureOverrides: {
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
    homePage: "bookings",
    sidebarOrder: ["bookings", "clients", "jobs", "invoicing", "leads", "communication"],
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
        defaultColumns: ["name", "email", "phone", "status", "tags", "field_referring-gp", "field_health-fund", "field_diagnosis-condition"],
        columnLabels: { name: "Patient" },
      },
      bookings: {
        defaultColumns: ["title", "clientId", "date", "startTime"],
        columnLabels: { title: "Appointment", clientId: "Patient" },
      },
      jobs: {
        defaultColumns: ["title", "clientId", "stage", "dueDate"],
        columnLabels: { title: "Treatment Plan", clientId: "Patient" },
      },
    },
  },

  adjustableBlocks: [
    {
      id: "treatment-plans",
      question: "Do you create treatment plans for patients?",
      options: [
        {
          value: "yes",
          label: "Yes, I track treatment plans",
          description: "Jobs/Projects module used for treatment plans with task checklists.",
          presentationPatches: [],
        },
        {
          value: "no",
          label: "No, just appointments",
          description: "Simplified — just bookings and invoicing, no treatment plan tracking.",
          functionalDelta: { removeModules: ["jobs-projects"] },
          presentationPatches: [
            { op: "reorder-sidebar", itemIds: ["bookings", "clients", "invoicing", "leads", "communication"] },
          ],
        },
      ],
      default: "yes",
    },
    {
      id: "accept-referrals",
      question: "Do patients come via GP referrals?",
      options: [
        {
          value: "yes",
          label: "Yes, GP referrals",
          description: "Leads pipeline enabled for tracking referrals from GPs.",
          presentationPatches: [],
        },
        {
          value: "no",
          label: "No, direct bookings only",
          description: "No leads pipeline — patients book directly.",
          presentationPatches: [
            { op: "reorder-sidebar", itemIds: ["bookings", "clients", "jobs", "invoicing", "communication"] },
          ],
        },
      ],
      default: "yes",
    },
  ],
};
