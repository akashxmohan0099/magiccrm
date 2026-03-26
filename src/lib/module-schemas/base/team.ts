import type { ModuleSchema } from "@/types/module-schema";

/**
 * Base schema: Team Management
 *
 * Simple table of team members. Referenced by other modules
 * via assignedToId relation fields.
 */
export const teamSchema: ModuleSchema = {
  id: "team",
  label: "Team",
  description: "Manage your team, roles, and permissions.",
  icon: "UsersRound",
  slug: "team",

  fields: [
    {
      id: "name",
      label: "Name",
      type: "text",
      required: true,
      placeholder: "Full name",
      showInTable: true,
      showInForm: true,
      showInDetail: true,
      sortable: true,
      searchable: true,
      group: "Details",
    },
    {
      id: "email",
      label: "Email",
      type: "email",
      required: true,
      showInTable: true,
      showInForm: true,
      showInDetail: true,
      searchable: true,
      group: "Details",
    },
    {
      id: "phone",
      label: "Phone",
      type: "phone",
      showInForm: true,
      showInDetail: true,
      group: "Details",
    },
    {
      id: "role",
      label: "Role",
      type: "select",
      required: true,
      defaultValue: "member",
      options: [
        { value: "owner", label: "Owner", color: "bg-purple-500" },
        { value: "admin", label: "Admin", color: "bg-blue-500" },
        { value: "member", label: "Member", color: "bg-emerald-500" },
      ],
      showInTable: true,
      showInForm: true,
      showInDetail: true,
      group: "Access",
    },
    {
      id: "status",
      label: "Status",
      type: "status",
      required: true,
      defaultValue: "active",
      options: [
        { value: "active", label: "Active", color: "bg-emerald-500" },
        { value: "invited", label: "Invited", color: "bg-amber-500" },
        { value: "inactive", label: "Inactive", color: "bg-gray-400" },
      ],
      showInTable: true,
      showInForm: true,
      showInDetail: true,
      group: "Access",
    },

    // Timestamps
    { id: "createdAt", label: "Joined", type: "date", showInTable: true, showInDetail: true, sortable: true },
    { id: "updatedAt", label: "Updated", type: "date", showInDetail: true, sortable: true },
  ],

  statusFlow: {
    field: "status",
    states: [
      { value: "active", label: "Active", color: "bg-emerald-500" },
      { value: "invited", label: "Invited", color: "bg-amber-500" },
      { value: "inactive", label: "Inactive", color: "bg-gray-400", isClosed: true },
    ],
  },

  views: [
    {
      id: "table",
      type: "table",
      label: "All Members",
      isDefault: true,
      visibleFields: ["name", "email", "role", "status", "createdAt"],
      sortDefault: { field: "name", direction: "asc" },
      colorField: "status",
    },
  ],

  primaryView: "table",

  primaryAction: { label: "Invite Member", icon: "Plus" },

  emptyState: {
    title: "Just you for now",
    description: "Invite team members when you're ready to share the workload.",
  },

  capabilities: {
    canCreate: true,
    canEdit: true,
    canDelete: true,
    canBulkEdit: false,
    canImport: false,
    canExport: false,
    hasDetailPanel: true,
  },
};
