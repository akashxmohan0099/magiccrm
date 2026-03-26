import type { ModuleSchema } from "@/types/module-schema";

/**
 * Base schema: Quotes & Invoicing
 *
 * Table view with lineItems, conditional payment mode fields,
 * and Quote → Invoice conversion action. The hardest schema
 * because it tests lineItems, computed fields, and conditional visibility.
 */
export const invoicingSchema: ModuleSchema = {
  id: "quotes-invoicing",
  label: "Billing",
  description: "Quotes, invoices, and payments.",
  icon: "Receipt",
  slug: "invoicing",

  fields: [
    {
      id: "number",
      label: "Number",
      type: "text",
      required: true,
      placeholder: "INV-001",
      showInTable: true,
      showInForm: true,
      showInDetail: true,
      sortable: true,
      searchable: true,
      group: "Invoice",
    },
    {
      id: "clientId",
      label: "Client",
      type: "relation",
      relationTo: "client-database",
      required: true,
      allowInlineCreate: true,
      showInTable: true,
      showInForm: true,
      showInDetail: true,
      group: "Invoice",
    },
    {
      id: "jobId",
      label: "Related Job",
      type: "relation",
      relationTo: "jobs-projects",
      showInForm: true,
      showInDetail: true,
      group: "Invoice",
    },
    {
      id: "status",
      label: "Status",
      type: "status",
      required: true,
      defaultValue: "draft",
      options: [
        { value: "draft", label: "Draft", color: "bg-gray-400" },
        { value: "sent", label: "Sent", color: "bg-blue-500" },
        { value: "paid", label: "Paid", color: "bg-emerald-500" },
        { value: "overdue", label: "Overdue", color: "bg-red-500" },
        { value: "cancelled", label: "Cancelled", color: "bg-gray-300" },
      ],
      showInTable: true,
      showInForm: true,
      showInDetail: true,
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
      sortable: true,
      group: "Status",
    },

    // ── Line Items ──
    {
      id: "lineItems",
      label: "Line Items",
      type: "lineItems",
      showInForm: true,
      showInDetail: true,
      subFields: [
        { id: "description", label: "Description", type: "text", required: true, showInForm: true },
        { id: "quantity", label: "Qty", type: "number", required: true, min: 1, defaultValue: 1, showInForm: true },
        { id: "unitPrice", label: "Unit Price", type: "currency", required: true, defaultValue: 0, showInForm: true },
        { id: "discount", label: "Discount", type: "currency", defaultValue: 0, showInForm: true },
      ],
      group: "Items",
    },

    // ── Totals (computed) ──
    {
      id: "subtotal",
      label: "Subtotal",
      type: "computed",
      computeExpression: "SUM(lineItems.quantity * lineItems.unitPrice - lineItems.discount)",
      showInForm: false,
      showInDetail: true,
      group: "Totals",
    },
    {
      id: "taxRate",
      label: "Tax Rate (%)",
      type: "percentage",
      defaultValue: 10,
      showInForm: true,
      showInDetail: true,
      group: "Totals",
    },
    {
      id: "total",
      label: "Total",
      type: "computed",
      computeExpression: "subtotal * (1 + taxRate / 100)",
      showInTable: true,
      showInDetail: true,
      group: "Totals",
    },
    {
      id: "paidAmount",
      label: "Paid",
      type: "currency",
      showInTable: true,
      showInDetail: true,
      group: "Totals",
    },

    // ── Payment Mode (conditional fields) ──
    {
      id: "paymentSchedule",
      label: "Payment Mode",
      type: "select",
      options: [
        { value: "one-time", label: "One-time" },
        { value: "deposit-balance", label: "Deposit + Balance" },
        { value: "recurring", label: "Recurring" },
      ],
      defaultValue: "one-time",
      showInForm: true,
      showInDetail: true,
      group: "Payment",
    },
    {
      id: "depositPercent",
      label: "Deposit %",
      type: "percentage",
      defaultValue: 50,
      showInForm: true,
      showInDetail: true,
      visibleWhen: { field: "paymentSchedule", operator: "eq", value: "deposit-balance" },
      group: "Payment",
    },
    {
      id: "depositPaid",
      label: "Deposit Paid",
      type: "boolean",
      showInDetail: true,
      visibleWhen: { field: "paymentSchedule", operator: "eq", value: "deposit-balance" },
      group: "Payment",
    },
    {
      id: "recurringSchedule",
      label: "Recurring Frequency",
      type: "select",
      options: [
        { value: "weekly", label: "Weekly" },
        { value: "fortnightly", label: "Fortnightly" },
        { value: "monthly", label: "Monthly" },
        { value: "quarterly", label: "Quarterly" },
      ],
      showInForm: true,
      showInDetail: true,
      visibleWhen: { field: "paymentSchedule", operator: "eq", value: "recurring" },
      group: "Payment",
    },

    // ── Notes ──
    {
      id: "notes",
      label: "Notes",
      type: "textarea",
      placeholder: "Payment terms, notes for client...",
      showInForm: true,
      showInDetail: true,
      group: "Notes",
    },

    // ── Timestamps ──
    { id: "createdAt", label: "Created", type: "date", showInTable: true, showInDetail: true, sortable: true },
    { id: "updatedAt", label: "Last Updated", type: "date", showInDetail: true, sortable: true },
  ],

  statusFlow: {
    field: "status",
    states: [
      { value: "draft", label: "Draft", color: "bg-gray-400" },
      { value: "sent", label: "Sent", color: "bg-blue-500" },
      { value: "paid", label: "Paid", color: "bg-emerald-500", isClosed: true },
      { value: "overdue", label: "Overdue", color: "bg-red-500" },
      { value: "cancelled", label: "Cancelled", color: "bg-gray-300", isClosed: true },
    ],
    transitions: [
      { from: "draft", to: ["sent", "cancelled"] },
      { from: "sent", to: ["paid", "overdue", "cancelled"] },
      { from: "overdue", to: ["paid", "cancelled"] },
    ],
  },

  relations: [
    { field: "clientId", targetModule: "client-database", displayField: "name" },
    { field: "jobId", targetModule: "jobs-projects", displayField: "title" },
  ],

  views: [
    {
      id: "table",
      type: "table",
      label: "Invoices",
      isDefault: true,
      visibleFields: ["number", "clientId", "status", "dueDate", "total", "paidAmount", "createdAt"],
      sortDefault: { field: "createdAt", direction: "desc" },
      colorField: "status",
    },
  ],

  primaryView: "table",

  actions: [
    // Quote → Invoice conversion (used when invoicing module handles quotes too)
    {
      id: "convert-quote-to-invoice",
      type: "convert",
      label: "Convert to Invoice",
      icon: "Receipt",
      showOn: "detail",
      targetModule: "quotes-invoicing",
      fieldMapping: [
        { sourceField: "clientId", targetField: "clientId", transform: "copy" },
        { sourceField: "lineItems", targetField: "lineItems", transform: "clone-line-items" },
        { sourceField: "notes", targetField: "notes", transform: "copy" },
      ],
      sourceUpdates: [
        { field: "status", value: "sent" },
      ],
      targetDefaults: [
        { field: "status", value: "draft" },
      ],
    },
  ],

  primaryAction: { label: "New Invoice", icon: "Plus" },

  emptyState: {
    title: "No invoices yet",
    description: "Create your first invoice to start tracking payments.",
    setupSteps: [
      { label: "Set up billing", description: "Add your payment details and bank info" },
      { label: "Create an invoice", description: "Bill your first client" },
    ],
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
