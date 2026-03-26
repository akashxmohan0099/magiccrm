import type { ModuleSchema } from "@/types/module-schema";

/**
 * Base schema: Products & Services
 *
 * Simple table + form. The most straightforward gated module.
 */
export const productsSchema: ModuleSchema = {
  id: "products",
  label: "Products",
  description: "Your product and service catalog.",
  icon: "Package",
  slug: "products",

  fields: [
    {
      id: "name",
      label: "Name",
      type: "text",
      required: true,
      placeholder: "Product or service name",
      showInTable: true,
      showInForm: true,
      showInDetail: true,
      sortable: true,
      searchable: true,
      group: "Product",
    },
    {
      id: "description",
      label: "Description",
      type: "textarea",
      placeholder: "What this product or service includes...",
      showInForm: true,
      showInDetail: true,
      group: "Product",
    },
    {
      id: "category",
      label: "Category",
      type: "text",
      placeholder: "e.g., Services, Retail, Packages",
      showInTable: true,
      showInForm: true,
      showInDetail: true,
      sortable: true,
      searchable: true,
      group: "Product",
    },
    {
      id: "price",
      label: "Price",
      type: "currency",
      required: true,
      min: 0,
      showInTable: true,
      showInForm: true,
      showInDetail: true,
      sortable: true,
      group: "Pricing",
    },
    {
      id: "duration",
      label: "Duration (min)",
      type: "number",
      placeholder: "60",
      min: 0,
      showInForm: true,
      showInDetail: true,
      group: "Pricing",
    },
    {
      id: "sku",
      label: "SKU",
      type: "text",
      placeholder: "Optional product code",
      showInForm: true,
      showInDetail: true,
      group: "Inventory",
    },
    {
      id: "inStock",
      label: "In Stock",
      type: "boolean",
      defaultValue: true,
      showInTable: true,
      showInForm: true,
      showInDetail: true,
      group: "Inventory",
    },
    {
      id: "quantity",
      label: "Quantity",
      type: "number",
      min: 0,
      showInTable: true,
      showInForm: true,
      showInDetail: true,
      visibleWhen: { field: "inStock", operator: "truthy" },
      group: "Inventory",
    },

    // ── Timestamps ──
    { id: "createdAt", label: "Created", type: "date", showInTable: true, showInDetail: true, sortable: true },
    { id: "updatedAt", label: "Last Updated", type: "date", showInDetail: true, sortable: true },
  ],

  views: [
    {
      id: "table",
      type: "table",
      label: "All Products",
      isDefault: true,
      visibleFields: ["name", "category", "price", "inStock", "quantity", "createdAt"],
      sortDefault: { field: "name", direction: "asc" },
    },
  ],

  primaryView: "table",

  primaryAction: { label: "Add Product", icon: "Plus" },

  emptyState: {
    title: "No products yet",
    description: "Add your products and services so you can use them in bookings and invoices.",
    setupSteps: [
      { label: "Add a service", description: "Define what you offer with pricing" },
      { label: "Import from CSV", description: "Upload your existing product list" },
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
