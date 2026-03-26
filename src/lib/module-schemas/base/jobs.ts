import type { ModuleSchema } from "@/types/module-schema";

/**
 * Base schema: Jobs & Projects
 *
 * Table + Kanban views with stage pipeline.
 * Includes subRecords for tasks and time entries.
 */
export const jobsSchema: ModuleSchema = {
  id: "jobs",
  label: "Projects",
  description: "Track work from start to finish.",
  icon: "FolderKanban",
  slug: "jobs",

  fields: [
    {
      id: "title",
      label: "Title",
      type: "text",
      required: true,
      placeholder: "Project name",
      showInTable: true,
      showInForm: true,
      showInDetail: true,
      showInCard: true,
      sortable: true,
      searchable: true,
      group: "Details",
    },
    {
      id: "description",
      label: "Description",
      type: "textarea",
      placeholder: "What needs to be done...",
      showInForm: true,
      showInDetail: true,
      group: "Details",
    },
    {
      id: "clientId",
      label: "Client",
      type: "relation",
      relationTo: "clients",
      allowInlineCreate: true,
      showInTable: true,
      showInForm: true,
      showInDetail: true,
      showInCard: true,
      group: "Details",
    },
    {
      id: "stage",
      label: "Stage",
      type: "stage",
      required: true,
      defaultValue: "new",
      options: [
        { value: "new", label: "New", color: "bg-blue-500" },
        { value: "in-progress", label: "In Progress", color: "bg-amber-500" },
        { value: "review", label: "Review", color: "bg-violet-500" },
        { value: "completed", label: "Completed", color: "bg-emerald-500" },
        { value: "cancelled", label: "Cancelled", color: "bg-red-500" },
      ],
      showInTable: true,
      showInForm: true,
      showInDetail: true,
      showInCard: true,
      sortable: true,
      group: "Status",
    },
    {
      id: "dueDate",
      label: "Due Date",
      type: "date",
      showInTable: true,
      showInForm: true,
      showInDetail: true,
      showInCard: true,
      sortable: true,
      group: "Status",
    },
    {
      id: "assignedToId",
      label: "Assigned To",
      type: "relation",
      relationTo: "team",
      showInTable: true,
      showInForm: true,
      showInDetail: true,
      showInCard: true,
      group: "Status",
    },

    // ── Tasks (nested subRecords) ──
    {
      id: "tasks",
      label: "Tasks",
      type: "subRecords",
      showInForm: false,
      showInDetail: true,
      subFields: [
        { id: "title", label: "Task", type: "text", required: true, showInForm: true },
        { id: "completed", label: "Done", type: "boolean", defaultValue: false, showInForm: true },
        { id: "dueDate", label: "Due", type: "date", showInForm: true },
        { id: "assigneeId", label: "Assignee", type: "relation", relationTo: "team", showInForm: true },
      ],
    },

    // ── Time Entries (nested subRecords) ──
    {
      id: "timeEntries",
      label: "Time Entries",
      type: "subRecords",
      showInForm: false,
      showInDetail: true,
      subFields: [
        { id: "description", label: "Description", type: "text", required: true, showInForm: true },
        { id: "minutes", label: "Minutes", type: "number", required: true, min: 1, showInForm: true },
        { id: "date", label: "Date", type: "date", required: true, showInForm: true },
        { id: "billable", label: "Billable", type: "boolean", defaultValue: true, showInForm: true },
      ],
    },

    // ── Satisfaction ──
    {
      id: "satisfactionRating",
      label: "Rating",
      type: "rating",
      showInForm: false,
      showInDetail: true,
      group: "Feedback",
    },
    {
      id: "satisfactionFeedback",
      label: "Feedback",
      type: "textarea",
      showInForm: false,
      showInDetail: true,
      group: "Feedback",
    },

    // ── Timestamps ──
    { id: "createdAt", label: "Created", type: "date", showInTable: true, showInDetail: true, sortable: true },
    { id: "updatedAt", label: "Last Updated", type: "date", showInDetail: true, sortable: true },
  ],

  statusFlow: {
    field: "stage",
    states: [
      { value: "new", label: "New", color: "bg-blue-500" },
      { value: "in-progress", label: "In Progress", color: "bg-amber-500" },
      { value: "review", label: "Review", color: "bg-violet-500" },
      { value: "completed", label: "Completed", color: "bg-emerald-500", isClosed: true },
      { value: "cancelled", label: "Cancelled", color: "bg-red-500", isClosed: true },
    ],
    transitions: [
      { from: "new", to: ["in-progress", "cancelled"] },
      { from: "in-progress", to: ["review", "completed", "cancelled"] },
      { from: "review", to: ["in-progress", "completed"] },
    ],
  },

  relations: [
    { field: "clientId", targetModule: "clients", displayField: "name" },
    { field: "assignedToId", targetModule: "team", displayField: "name" },
  ],

  views: [
    {
      id: "table",
      type: "table",
      label: "List",
      visibleFields: ["title", "clientId", "stage", "dueDate", "assignedToId", "createdAt"],
      sortDefault: { field: "createdAt", direction: "desc" },
      colorField: "stage",
    },
    {
      id: "board",
      type: "kanban",
      label: "Board",
      isDefault: true,
      visibleFields: ["title", "clientId", "dueDate", "assignedToId"],
      groupByField: "stage",
      cardFields: ["title", "clientId", "dueDate", "assignedToId"],
    },
  ],

  primaryView: "board",

  primaryAction: { label: "Add Project", icon: "Plus" },

  emptyState: {
    title: "No projects yet",
    description: "Create your first project to start tracking work.",
  },

  capabilities: {
    canCreate: true,
    canEdit: true,
    canDelete: true,
    canBulkEdit: false,
    canImport: false,
    canExport: true,
    hasDetailPanel: true,
  },
};
