import type { ModuleSchema } from "@/types/module-schema";

/**
 * Base schema: Bookings & Calendar
 *
 * Table + Calendar views. Relation to clients and products (services).
 * Service selection auto-fills title, duration, and price.
 */
export const bookingsSchema: ModuleSchema = {
  id: "bookings",
  label: "Scheduling",
  description: "Bookings, appointments, and calendar.",
  icon: "Calendar",
  slug: "bookings",

  fields: [
    {
      id: "title",
      label: "Title",
      type: "text",
      required: true,
      placeholder: "Appointment title",
      showInTable: true,
      showInForm: true,
      showInDetail: true,
      showInCard: true,
      sortable: true,
      searchable: true,
      group: "Booking",
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
      group: "Booking",
    },
    {
      id: "serviceId",
      label: "Service",
      type: "relation",
      relationTo: "products",
      showInForm: true,
      showInDetail: true,
      autoFillFrom: [
        { sourceField: "name", targetField: "title" },
        { sourceField: "duration", targetField: "duration" },
        { sourceField: "price", targetField: "price" },
      ],
      group: "Booking",
    },
    {
      id: "date",
      label: "Date",
      type: "date",
      required: true,
      showInTable: true,
      showInForm: true,
      showInDetail: true,
      showInCard: true,
      sortable: true,
      group: "Schedule",
    },
    {
      id: "startTime",
      label: "Start Time",
      type: "time",
      required: true,
      showInTable: true,
      showInForm: true,
      showInDetail: true,
      group: "Schedule",
    },
    {
      id: "endTime",
      label: "End Time",
      type: "time",
      required: true,
      showInTable: true,
      showInForm: true,
      showInDetail: true,
      group: "Schedule",
    },
    {
      id: "duration",
      label: "Duration (min)",
      type: "number",
      placeholder: "60",
      showInForm: true,
      showInDetail: true,
      group: "Schedule",
    },
    {
      id: "status",
      label: "Status",
      type: "status",
      required: true,
      defaultValue: "confirmed",
      options: [
        { value: "pending", label: "Pending", color: "bg-amber-500" },
        { value: "confirmed", label: "Confirmed", color: "bg-blue-500" },
        { value: "completed", label: "Completed", color: "bg-emerald-500" },
        { value: "cancelled", label: "Cancelled", color: "bg-red-500" },
        { value: "no-show", label: "No Show", color: "bg-gray-400" },
      ],
      showInTable: true,
      showInForm: true,
      showInDetail: true,
      showInCard: true,
      sortable: true,
      group: "Status",
    },
    {
      id: "price",
      label: "Price",
      type: "currency",
      showInTable: true,
      showInForm: true,
      showInDetail: true,
      group: "Payment",
    },
    {
      id: "assignedToId",
      label: "Assigned To",
      type: "relation",
      relationTo: "team",
      showInTable: true,
      showInForm: true,
      showInDetail: true,
      group: "Assignment",
    },
    {
      id: "recurring",
      label: "Recurring",
      type: "select",
      options: [
        { value: "weekly", label: "Weekly" },
        { value: "biweekly", label: "Biweekly" },
        { value: "monthly", label: "Monthly" },
      ],
      showInForm: true,
      showInDetail: true,
      group: "Recurring",
    },
    {
      id: "notes",
      label: "Notes",
      type: "textarea",
      placeholder: "Booking notes...",
      showInForm: true,
      showInDetail: true,
      group: "Notes",
    },
    {
      id: "cancellationReason",
      label: "Cancellation Reason",
      type: "textarea",
      showInForm: false,
      showInDetail: true,
      visibleWhen: { field: "status", operator: "eq", value: "cancelled" },
      group: "Cancellation",
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

    // ── Timestamps ──
    { id: "createdAt", label: "Created", type: "date", showInTable: true, showInDetail: true, sortable: true },
    { id: "updatedAt", label: "Last Updated", type: "date", showInDetail: true, sortable: true },
  ],

  statusFlow: {
    field: "status",
    states: [
      { value: "pending", label: "Pending", color: "bg-amber-500" },
      { value: "confirmed", label: "Confirmed", color: "bg-blue-500" },
      { value: "completed", label: "Completed", color: "bg-emerald-500", isClosed: true },
      { value: "cancelled", label: "Cancelled", color: "bg-red-500", isClosed: true },
      { value: "no-show", label: "No Show", color: "bg-gray-400", isClosed: true },
    ],
    transitions: [
      { from: "pending", to: ["confirmed", "cancelled"] },
      { from: "confirmed", to: ["completed", "cancelled", "no-show"] },
    ],
  },

  relations: [
    { field: "clientId", targetModule: "clients", displayField: "name" },
    { field: "serviceId", targetModule: "products", displayField: "name" },
    { field: "assignedToId", targetModule: "team", displayField: "name" },
  ],

  views: [
    {
      id: "table",
      type: "table",
      label: "List",
      visibleFields: ["title", "clientId", "date", "startTime", "endTime", "status", "price", "assignedToId"],
      sortDefault: { field: "date", direction: "desc" },
      colorField: "status",
    },
    {
      id: "calendar",
      type: "calendar",
      label: "Calendar",
      isDefault: true,
      visibleFields: ["title", "clientId", "status", "price"],
      dateField: "date",
    },
  ],

  primaryView: "calendar",

  primaryAction: { label: "New Booking", icon: "Plus" },

  emptyState: {
    title: "No bookings yet",
    description: "Create your first booking or set up your availability.",
    setupSteps: [
      { label: "Add your services", description: "Define what you offer with pricing and duration" },
      { label: "Set availability", description: "Configure your working hours" },
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
