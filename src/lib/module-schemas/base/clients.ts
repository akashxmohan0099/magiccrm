import type { ModuleSchema } from "@/types/module-schema";

/**
 * Base schema: Client Database
 *
 * The simplest core module — table + form + detail panel.
 * Every persona gets this. Persona variants override labels,
 * add/remove fields, and reorder views.
 */
export const clientsSchema: ModuleSchema = {
  id: "client-database",
  label: "Clients",
  description: "Your clients, all in one place.",
  icon: "Users",
  slug: "clients",

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
      sortable: true,
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
      showInTable: true,
      showInForm: true,
      showInDetail: true,
      sortable: true,
      searchable: true,
      group: "Contact Info",
    },
    {
      id: "address",
      label: "Address",
      type: "text",
      placeholder: "Street address",
      showInForm: true,
      showInDetail: true,
      group: "Contact Info",
    },

    // ── Status & Organization ──
    {
      id: "status",
      label: "Status",
      type: "status",
      required: true,
      defaultValue: "active",
      options: [
        { value: "active", label: "Active", color: "bg-green-500" },
        { value: "prospect", label: "Prospect", color: "bg-blue-500" },
        { value: "vip", label: "VIP", color: "bg-purple-500" },
        { value: "inactive", label: "Inactive", color: "bg-gray-400" },
        { value: "churned", label: "Churned", color: "bg-red-500" },
      ],
      showInTable: true,
      showInForm: true,
      showInDetail: true,
      showInCard: true,
      sortable: true,
      group: "Status",
    },
    {
      id: "tags",
      label: "Tags",
      type: "multiselect",
      options: [],  // populated dynamically from user-created tags
      showInTable: true,
      showInForm: true,
      showInDetail: true,
      group: "Status",
    },
    {
      id: "source",
      label: "Source",
      type: "select",
      options: [
        { value: "referral", label: "Referral" },
        { value: "website", label: "Website" },
        { value: "social", label: "Social Media" },
        { value: "other", label: "Other" },
      ],
      showInForm: true,
      showInDetail: true,
      sortable: true,
      group: "Status",
    },

    // ── Notes ──
    {
      id: "notes",
      label: "Notes",
      type: "textarea",
      placeholder: "Internal notes about this client...",
      showInForm: true,
      showInDetail: true,
      group: "Notes",
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
    field: "status",
    states: [
      { value: "prospect", label: "Prospect", color: "bg-blue-500" },
      { value: "active", label: "Active", color: "bg-green-500" },
      { value: "vip", label: "VIP", color: "bg-purple-500" },
      { value: "inactive", label: "Inactive", color: "bg-gray-400" },
      { value: "churned", label: "Churned", color: "bg-red-500", isClosed: true },
    ],
  },

  views: [
    {
      id: "table",
      type: "table",
      label: "All Clients",
      isDefault: true,
      visibleFields: ["name", "email", "phone", "company", "status", "tags", "createdAt"],
      sortDefault: { field: "name", direction: "asc" },
      colorField: "status",
    },
  ],

  primaryView: "table",

  actions: [
    {
      id: "cascade-delete-client",
      type: "cascade-delete",
      targetModules: [
        { moduleId: "bookings-calendar", foreignKey: "clientId" },
        { moduleId: "quotes-invoicing", foreignKey: "clientId" },
        { moduleId: "jobs-projects", foreignKey: "clientId" },
        { moduleId: "leads-pipeline", foreignKey: "clientId" },
        { moduleId: "communication", foreignKey: "clientId" },
      ],
    },
  ],

  primaryAction: {
    label: "Add Client",
    icon: "Plus",
  },

  emptyState: {
    title: "No clients yet",
    description: "Add your first client to get started. You can also import clients from a CSV file.",
    setupSteps: [
      { label: "Add a client", description: "Create your first client record" },
      { label: "Import from CSV", description: "Upload your existing client list" },
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
