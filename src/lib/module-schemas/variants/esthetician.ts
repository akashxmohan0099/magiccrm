import type { SchemaVariant } from "@/types/module-schema";

/**
 * Esthetician / Skin Therapist persona variants (beauty-wellness)
 * Skin-focused, treatment-plan driven, retail product sales.
 */

export const estheticianVariants: SchemaVariant[] = [
  {
    baseSchemaId: "client-database", variantId: "beauty-wellness:esthetician:clients", personaId: "esthetician", industryId: "beauty-wellness",
    overrides: {
      fieldOverrides: {
        add: [
          { id: "skinType", label: "Skin Type", type: "select", options: [
            { value: "normal", label: "Normal" }, { value: "oily", label: "Oily" },
            { value: "dry", label: "Dry" }, { value: "combination", label: "Combination" },
            { value: "sensitive", label: "Sensitive" },
          ], showInForm: true, showInDetail: true, group: "Skin Profile" },
          { id: "skinConcerns", label: "Skin Concerns", type: "text", placeholder: "e.g. acne, ageing, pigmentation, rosacea", showInForm: true, showInDetail: true, group: "Skin Profile" },
          { id: "productSensitivities", label: "Product Sensitivities", type: "text", placeholder: "e.g. retinol, AHA, fragrance", showInForm: true, showInDetail: true, group: "Skin Profile" },
        ],
      },
      emptyState: { title: "No clients yet", description: "Add your clients with skin type and treatment preferences." },
    },
  },
  {
    baseSchemaId: "bookings-calendar", variantId: "beauty-wellness:esthetician:bookings", personaId: "esthetician", industryId: "beauty-wellness",
    overrides: {
      label: "Appointments",
      description: "Facials, peels, and skin treatment appointments.",
      primaryAction: { label: "New Appointment", icon: "Plus" },
      emptyState: { title: "No appointments yet", description: "Book a client for a facial, peel, or skin consultation." },
    },
  },
  {
    baseSchemaId: "quotes-invoicing", variantId: "beauty-wellness:esthetician:invoicing", personaId: "esthetician", industryId: "beauty-wellness",
    overrides: {
      primaryAction: { label: "New Receipt", icon: "Plus" },
      emptyState: { title: "No invoices yet", description: "Create your first invoice after a treatment." },
    },
  },
  {
    baseSchemaId: "products", variantId: "beauty-wellness:esthetician:products", personaId: "esthetician", industryId: "beauty-wellness",
    overrides: {
      label: "Treatments",
      description: "Your facial and skin treatment menu.",
      fieldOverrides: {
        modify: [
          { id: "name", label: "Treatment Name", placeholder: "e.g. Signature Facial, Chemical Peel" },
          { id: "description", label: "What's included", placeholder: "e.g. Double cleanse, extraction, mask, LED" },
          { id: "category", label: "Category", placeholder: "e.g. Facials, Peels, Add-ons" },
          { id: "duration", label: "Duration (min)" },
        ],
        remove: ["sku", "inStock", "quantity"],
      },
      viewOverrides: { modify: [{ id: "table", visibleFields: ["name", "category", "price", "duration", "createdAt"] }] },
      primaryAction: { label: "Add Treatment", icon: "Plus" },
    },
  },
  {
    baseSchemaId: "leads-pipeline", variantId: "beauty-wellness:esthetician:leads", personaId: "esthetician", industryId: "beauty-wellness",
    overrides: {
      label: "Inquiries",
      description: "Track new client inquiries about treatments.",
      primaryAction: { label: "Add Inquiry", icon: "Plus" },
      emptyState: { title: "No inquiries yet", description: "When someone asks about treatments, add them here." },
    },
  },
];
