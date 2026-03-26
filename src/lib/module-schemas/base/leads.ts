import type { ModuleSchema } from "@/types/module-schema";

/**
 * Base schema: Leads Pipeline
 *
 * Table + Kanban views with a stage-based pipeline.
 * Includes the Lead → Client conversion action.
 */
export const leadsSchema: ModuleSchema = {
  id: "leads",
  label: "Leads",
  description: "Never lose track of a potential customer.",
  icon: "Inbox",
  slug: "leads",

  fields: [
    // ── Contact Info ──
    {
      id: "name",
      label: "Name",
      type: "text",
      required: true,
      placeholder: "Full name",
      showInTable: true,
      showInForm: true,
      showInDetail: true,
      showInCard: true,
      sortable: true,
      searchable: true,
      group: "Contact Info",
    },
    {
      id: "email",
      label: "Email",
      type: "email",
      placeholder: "email@example.com",
      showInTable: true,
      showInForm: true,
      showInDetail: true,
      searchable: true,
      group: "Contact Info",
    },
    {
      id: "phone",
      label: "Phone",
      type: "phone",
      placeholder: "Phone number",
      showInTable: true,
      showInForm: true,
      showInDetail: true,
      group: "Contact Info",
    },
    {
      id: "company",
      label: "Company",
      type: "text",
      placeholder: "Company or business name",
      showInForm: true,
      showInDetail: true,
      searchable: true,
      group: "Contact Info",
    },

    // ── Pipeline ──
    {
      id: "stage",
      label: "Stage",
      type: "stage",
      required: true,
      defaultValue: "new",
      options: [
        { value: "new", label: "New", color: "bg-blue-500" },
        { value: "contacted", label: "Contacted", color: "bg-amber-500" },
        { value: "qualified", label: "Qualified", color: "bg-violet-500" },
        { value: "proposal", label: "Proposal", color: "bg-indigo-500" },
        { value: "won", label: "Won", color: "bg-emerald-500" },
        { value: "lost", label: "Lost", color: "bg-red-500" },
      ],
      showInTable: true,
      showInForm: true,
      showInDetail: true,
      showInCard: true,
      sortable: true,
      group: "Pipeline",
    },
    {
      id: "value",
      label: "Value",
      type: "currency",
      placeholder: "Estimated deal value",
      showInTable: true,
      showInForm: true,
      showInDetail: true,
      showInCard: true,
      sortable: true,
      group: "Pipeline",
    },
    {
      id: "source",
      label: "Source",
      type: "select",
      options: [
        { value: "website", label: "Website" },
        { value: "referral", label: "Referral" },
        { value: "social", label: "Social Media" },
        { value: "cold-outreach", label: "Cold Outreach" },
        { value: "event", label: "Event" },
        { value: "other", label: "Other" },
      ],
      showInTable: true,
      showInForm: true,
      showInDetail: true,
      sortable: true,
      group: "Pipeline",
    },

    // ── Follow-up ──
    {
      id: "lastContactedAt",
      label: "Last Contacted",
      type: "date",
      showInTable: true,
      showInDetail: true,
      sortable: true,
      group: "Follow-up",
    },
    {
      id: "nextFollowUpDate",
      label: "Next Follow-up",
      type: "date",
      showInTable: true,
      showInForm: true,
      showInDetail: true,
      sortable: true,
      group: "Follow-up",
    },

    // ── Notes ──
    {
      id: "notes",
      label: "Notes",
      type: "textarea",
      placeholder: "Notes about this lead...",
      showInForm: true,
      showInDetail: true,
      group: "Notes",
    },

    // ── Internal reference (hidden from forms, set by convert action) ──
    {
      id: "clientId",
      label: "Converted Client",
      type: "relation",
      relationTo: "clients",
      showInForm: false,
      showInDetail: true,
      group: "Conversion",
    },

    // ── Timestamps ──
    {
      id: "createdAt",
      label: "Created",
      type: "date",
      showInTable: true,
      showInDetail: true,
      sortable: true,
    },
    {
      id: "updatedAt",
      label: "Last Updated",
      type: "date",
      showInDetail: true,
      sortable: true,
    },
  ],

  statusFlow: {
    field: "stage",
    states: [
      { value: "new", label: "New", color: "bg-blue-500" },
      { value: "contacted", label: "Contacted", color: "bg-amber-500" },
      { value: "qualified", label: "Qualified", color: "bg-violet-500" },
      { value: "proposal", label: "Proposal", color: "bg-indigo-500" },
      { value: "won", label: "Won", color: "bg-emerald-500", isClosed: true },
      { value: "lost", label: "Lost", color: "bg-red-500", isClosed: true },
    ],
    transitions: [
      { from: "new", to: ["contacted", "qualified", "lost"] },
      { from: "contacted", to: ["qualified", "proposal", "lost"] },
      { from: "qualified", to: ["proposal", "won", "lost"] },
      { from: "proposal", to: ["won", "lost"] },
    ],
  },

  relations: [
    {
      field: "clientId",
      targetModule: "clients",
      displayField: "name",
    },
  ],

  views: [
    {
      id: "table",
      type: "table",
      label: "List",
      visibleFields: ["name", "email", "phone", "stage", "value", "source", "nextFollowUpDate", "createdAt"],
      sortDefault: { field: "createdAt", direction: "desc" },
      colorField: "stage",
    },
    {
      id: "pipeline",
      type: "kanban",
      label: "Pipeline",
      isDefault: true,
      visibleFields: ["name", "value", "source", "nextFollowUpDate"],
      groupByField: "stage",
      cardFields: ["name", "value", "source", "nextFollowUpDate"],
    },
  ],

  primaryView: "pipeline",

  actions: [
    // The core cross-module action: Lead → Client conversion
    {
      id: "convert-to-client",
      type: "convert",
      label: "Convert to Client",
      icon: "UserCheck",
      showOn: "detail",
      targetModule: "clients",
      fieldMapping: [
        { sourceField: "name", targetField: "name", transform: "copy" },
        { sourceField: "email", targetField: "email", transform: "copy" },
        { sourceField: "phone", targetField: "phone", transform: "copy" },
        { sourceField: "company", targetField: "company", transform: "copy" },
        { sourceField: "notes", targetField: "notes", transform: "copy" },
      ],
      sourceUpdates: [
        { field: "stage", value: "won" },
        { field: "clientId", value: "$targetId" },
      ],
      targetDefaults: [
        { field: "status", value: "active" },
      ],
    },
  ],

  primaryAction: {
    label: "Add Lead",
    icon: "Plus",
  },

  emptyState: {
    title: "No leads yet",
    description: "Add your first lead to start building your pipeline.",
    setupSteps: [
      { label: "Add a lead", description: "Create your first lead" },
      { label: "Set up your pipeline", description: "Customize pipeline stages" },
    ],
  },

  capabilities: {
    canCreate: true,
    canEdit: true,
    canDelete: true,
    canBulkEdit: true,
    canImport: true,
    canExport: true,
    hasDetailPanel: true,
  },
};
