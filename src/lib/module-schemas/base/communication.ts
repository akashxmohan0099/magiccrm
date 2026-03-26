import type { ModuleSchema } from "@/types/module-schema";

/**
 * Base schema: Communication / Unified Inbox
 *
 * Unlike other modules, Communication is conversation-centric
 * rather than record-centric. But it still fits the schema model:
 * each "record" is a conversation thread.
 *
 * Critical feature: Convert actions on conversations.
 * An email or DM can be converted to a Lead (inquiry) or a Client
 * with one click — pulling name, email, phone from the message.
 */
export const communicationSchema: ModuleSchema = {
  id: "communication",
  label: "Messages",
  description: "Every conversation, one inbox.",
  icon: "MessageCircle",
  slug: "communication",

  fields: [
    {
      id: "contactName",
      label: "Contact",
      type: "text",
      required: true,
      showInTable: true,
      showInDetail: true,
      showInCard: true,
      searchable: true,
      group: "Contact",
    },
    {
      id: "contactEmail",
      label: "Email",
      type: "email",
      showInTable: true,
      showInDetail: true,
      searchable: true,
      group: "Contact",
    },
    {
      id: "contactPhone",
      label: "Phone",
      type: "phone",
      showInDetail: true,
      group: "Contact",
    },
    {
      id: "channel",
      label: "Channel",
      type: "select",
      options: [
        { value: "email", label: "Email", color: "bg-blue-500" },
        { value: "sms", label: "SMS", color: "bg-green-500" },
        { value: "instagram", label: "Instagram", color: "bg-pink-500" },
        { value: "facebook", label: "Facebook", color: "bg-indigo-500" },
        { value: "whatsapp", label: "WhatsApp", color: "bg-emerald-500" },
        { value: "website", label: "Website Form", color: "bg-violet-500" },
      ],
      showInTable: true,
      showInDetail: true,
      showInCard: true,
      group: "Message",
    },
    {
      id: "subject",
      label: "Subject",
      type: "text",
      showInTable: true,
      showInDetail: true,
      showInCard: true,
      searchable: true,
      group: "Message",
    },
    {
      id: "lastMessage",
      label: "Last Message",
      type: "textarea",
      showInTable: true,
      showInDetail: true,
      group: "Message",
    },
    {
      id: "status",
      label: "Status",
      type: "status",
      defaultValue: "unread",
      options: [
        { value: "unread", label: "Unread", color: "bg-blue-500" },
        { value: "open", label: "Open", color: "bg-amber-500" },
        { value: "replied", label: "Replied", color: "bg-emerald-500" },
        { value: "closed", label: "Closed", color: "bg-gray-400" },
      ],
      showInTable: true,
      showInDetail: true,
      group: "Status",
    },
    {
      id: "clientId",
      label: "Linked Client",
      type: "relation",
      relationTo: "client-database",
      showInDetail: true,
      group: "Links",
    },
    {
      id: "leadId",
      label: "Linked Inquiry",
      type: "relation",
      relationTo: "leads-pipeline",
      showInDetail: true,
      group: "Links",
    },
    {
      id: "lastMessageAt",
      label: "Last Activity",
      type: "datetime",
      showInTable: true,
      showInDetail: true,
      sortable: true,
      group: "Status",
    },

    // ── Timestamps ──
    { id: "createdAt", label: "Started", type: "date", showInDetail: true, sortable: true },
    { id: "updatedAt", label: "Updated", type: "date", showInDetail: true, sortable: true },
  ],

  statusFlow: {
    field: "status",
    states: [
      { value: "unread", label: "Unread", color: "bg-blue-500" },
      { value: "open", label: "Open", color: "bg-amber-500" },
      { value: "replied", label: "Replied", color: "bg-emerald-500" },
      { value: "closed", label: "Closed", color: "bg-gray-400", isClosed: true },
    ],
  },

  relations: [
    { field: "clientId", targetModule: "client-database", displayField: "name" },
    { field: "leadId", targetModule: "leads-pipeline", displayField: "name" },
  ],

  views: [
    {
      id: "table",
      type: "table",
      label: "All Messages",
      isDefault: true,
      visibleFields: ["contactName", "channel", "subject", "lastMessage", "status", "lastMessageAt"],
      sortDefault: { field: "lastMessageAt", direction: "desc" },
      colorField: "status",
    },
  ],

  primaryView: "table",

  // ── The key feature: Convert actions ──
  // These let the user turn a conversation into a Lead or Client with one click.
  // Data flows: contactName → name, contactEmail → email, contactPhone → phone
  actions: [
    {
      id: "convert-to-lead",
      type: "convert",
      label: "Convert to Inquiry",
      icon: "Inbox",
      showOn: "detail",
      targetModule: "leads-pipeline",
      fieldMapping: [
        { sourceField: "contactName", targetField: "name", transform: "copy" },
        { sourceField: "contactEmail", targetField: "email", transform: "copy" },
        { sourceField: "contactPhone", targetField: "phone", transform: "copy" },
        { sourceField: "subject", targetField: "notes", transform: "copy" },
        { sourceField: "channel", targetField: "source", transform: "copy" },
      ],
      sourceUpdates: [
        { field: "leadId", value: "$targetId" },
      ],
      targetDefaults: [
        { field: "stage", value: "new" },
      ],
    },
    {
      id: "convert-to-client",
      type: "convert",
      label: "Convert to Client",
      icon: "UserPlus",
      showOn: "detail",
      targetModule: "client-database",
      fieldMapping: [
        { sourceField: "contactName", targetField: "name", transform: "copy" },
        { sourceField: "contactEmail", targetField: "email", transform: "copy" },
        { sourceField: "contactPhone", targetField: "phone", transform: "copy" },
      ],
      sourceUpdates: [
        { field: "clientId", value: "$targetId" },
      ],
      targetDefaults: [
        { field: "status", value: "active" },
      ],
    },
  ],

  primaryAction: { label: "New Message", icon: "Plus" },

  emptyState: {
    title: "No conversations yet",
    description: "When clients email, message, or DM you — it all lands here. Connect your channels to get started.",
    setupSteps: [
      { label: "Connect email", description: "Link your business email" },
      { label: "Connect Instagram", description: "Link your Instagram business account" },
    ],
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
