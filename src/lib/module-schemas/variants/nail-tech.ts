import type { SchemaVariant } from "@/types/module-schema";

/**
 * Nail Tech persona variants (beauty-wellness)
 * Appointment-based, Instagram-driven, repeat clients every 2-4 weeks.
 */

export const nailTechVariants: SchemaVariant[] = [
  {
    baseSchemaId: "client-database", variantId: "beauty-wellness:nail-tech:clients", personaId: "nail-tech", industryId: "beauty-wellness",
    overrides: {
      fieldOverrides: {
        modify: [{ id: "company", showInForm: false, showInDetail: false, searchable: false }],
        add: [
          { id: "nailType", label: "Nail Type", type: "select", options: [
            { value: "natural", label: "Natural" }, { value: "biters", label: "Biters" },
            { value: "thin", label: "Thin / Weak" }, { value: "damaged", label: "Damaged" },
          ], showInForm: true, showInDetail: true, group: "Preferences" },
          { id: "preferredShape", label: "Preferred Shape", type: "select", options: [
            { value: "almond", label: "Almond" }, { value: "coffin", label: "Coffin" },
            { value: "stiletto", label: "Stiletto" }, { value: "square", label: "Square" },
            { value: "round", label: "Round" }, { value: "oval", label: "Oval" },
          ], showInForm: true, showInDetail: true, group: "Preferences" },
          { id: "allergies", label: "Allergies", type: "text", placeholder: "Latex, gel, specific products...", showInForm: true, showInDetail: true, group: "Health" },
        ],
      },
      emptyState: { title: "No clients yet", description: "Add your regulars — name, preferences, and nail type." },
    },
  },
  {
    baseSchemaId: "bookings-calendar", variantId: "beauty-wellness:nail-tech:bookings", personaId: "nail-tech", industryId: "beauty-wellness",
    overrides: {
      label: "Appointments",
      description: "Your appointment book for all nail services.",
      primaryAction: { label: "New Appointment", icon: "Plus" },
      emptyState: { title: "No appointments yet", description: "Book your first client in." },
    },
  },
  {
    baseSchemaId: "quotes-invoicing", variantId: "beauty-wellness:nail-tech:invoicing", personaId: "nail-tech", industryId: "beauty-wellness",
    overrides: {
      label: "Receipts",
      description: "Payment records for your nail services.",
      fieldOverrides: {
        modify: [
          { id: "number", label: "Receipt #" },
          { id: "jobId", showInForm: false, showInDetail: false },
          { id: "paymentSchedule", label: "Payment", options: [{ value: "one-time", label: "Pay now" }] },
        ],
        remove: ["recurringSchedule"],
      },
      actionOverrides: { remove: ["convert-quote-to-invoice"] },
      primaryAction: { label: "New Receipt", icon: "Plus" },
    },
  },
  {
    baseSchemaId: "products", variantId: "beauty-wellness:nail-tech:products", personaId: "nail-tech", industryId: "beauty-wellness",
    overrides: {
      label: "Services",
      description: "Your nail services and pricing.",
      fieldOverrides: {
        modify: [
          { id: "name", label: "Service", placeholder: "e.g., Gel Manicure" },
          { id: "category", label: "Type", placeholder: "e.g., Gel, Acrylic, Art, Pedicure" },
          { id: "duration", label: "Duration (min)", placeholder: "60" },
        ],
        remove: ["sku", "inStock", "quantity"],
      },
      viewOverrides: { modify: [{ id: "table", visibleFields: ["name", "category", "price", "duration", "createdAt"] }] },
      primaryAction: { label: "Add Service", icon: "Plus" },
    },
  },
];
