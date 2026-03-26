import type { SchemaVariant } from "@/types/module-schema";

/**
 * Barber persona variants (beauty-wellness)
 * Walk-in heavy, high-frequency regulars, cash + card POS.
 */

export const barberVariants: SchemaVariant[] = [
  {
    baseSchemaId: "client-database", variantId: "beauty-wellness:barber:clients", personaId: "barber", industryId: "beauty-wellness",
    overrides: {
      fieldOverrides: {
        modify: [{ id: "company", showInForm: false, showInDetail: false, searchable: false }],
        add: [
          { id: "preferredStyle", label: "Preferred Style", type: "text", placeholder: "e.g., Skin fade, 2 on sides, scissors on top", showInForm: true, showInDetail: true, group: "Preferences" },
        ],
      },
      emptyState: { title: "No clients yet", description: "Add your regulars and walk-ins." },
    },
  },
  {
    baseSchemaId: "bookings-calendar", variantId: "beauty-wellness:barber:bookings", personaId: "barber", industryId: "beauty-wellness",
    overrides: {
      label: "Appointments",
      description: "Walk-ins, bookings, and your chair schedule.",
      primaryAction: { label: "New Appointment", icon: "Plus" },
      emptyState: { title: "No appointments yet", description: "Book a client in or set up walk-in queue." },
    },
  },
  {
    baseSchemaId: "quotes-invoicing", variantId: "beauty-wellness:barber:invoicing", personaId: "barber", industryId: "beauty-wellness",
    overrides: {
      label: "Receipts",
      description: "Payment records for your cuts and services.",
      fieldOverrides: {
        modify: [
          { id: "number", label: "Receipt #", placeholder: "RCT-001" },
          { id: "jobId", showInForm: false, showInDetail: false },
          { id: "paymentSchedule", label: "Payment", options: [{ value: "one-time", label: "Pay now" }] },
        ],
        remove: ["recurringSchedule"],
      },
      actionOverrides: { remove: ["convert-quote-to-invoice"] },
      primaryAction: { label: "New Receipt", icon: "Plus" },
      emptyState: { title: "No receipts yet", description: "Receipts are created when clients pay." },
    },
  },
  {
    baseSchemaId: "products", variantId: "beauty-wellness:barber:products", personaId: "barber", industryId: "beauty-wellness",
    overrides: {
      label: "Services",
      description: "Your cuts, trims, and shaves with pricing.",
      fieldOverrides: {
        modify: [
          { id: "name", label: "Service", placeholder: "e.g., Skin Fade" },
          { id: "category", label: "Type", placeholder: "e.g., Cuts, Beard, Combos" },
          { id: "duration", label: "Duration (min)", placeholder: "30" },
        ],
        remove: ["sku", "inStock", "quantity"],
      },
      viewOverrides: { modify: [{ id: "table", visibleFields: ["name", "category", "price", "duration", "createdAt"] }] },
      primaryAction: { label: "Add Service", icon: "Plus" },
      emptyState: { title: "No services yet", description: "Add your cuts, trims, and combos." },
    },
  },
];
