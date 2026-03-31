import type { SchemaVariant } from "@/types/module-schema";

/**
 * Spa / Massage persona variants (beauty-wellness)
 * Treatment-based, health-intake required, mix of regulars and one-offs.
 */

export const spaMassageVariants: SchemaVariant[] = [
  {
    baseSchemaId: "client-database", variantId: "beauty-wellness:spa-massage:clients", personaId: "spa-massage", industryId: "beauty-wellness",
    overrides: {
      fieldOverrides: {
        add: [
          { id: "pressurePreference", label: "Pressure Preference", type: "select", options: [
            { value: "light", label: "Light" }, { value: "medium", label: "Medium" },
            { value: "firm", label: "Firm" }, { value: "deep", label: "Deep" },
          ], showInForm: true, showInDetail: true, group: "Treatment Profile" },
          { id: "injuriesConditions", label: "Injuries / Conditions", type: "text", placeholder: "e.g. lower back pain, sciatica, desk worker tension", showInForm: true, showInDetail: true, group: "Treatment Profile" },
          { id: "contraindications", label: "Contraindications", type: "text", placeholder: "e.g. pregnancy, blood clots, recent surgery", showInForm: true, showInDetail: true, group: "Health" },
        ],
      },
      emptyState: { title: "No clients yet", description: "Add your clients with their health details and treatment preferences." },
    },
  },
  {
    baseSchemaId: "bookings-calendar", variantId: "beauty-wellness:spa-massage:bookings", personaId: "spa-massage", industryId: "beauty-wellness",
    overrides: {
      label: "Appointments",
      description: "Massage, facial, and treatment appointments.",
      primaryAction: { label: "New Appointment", icon: "Plus" },
      emptyState: { title: "No appointments yet", description: "Book a client for a massage, facial, or treatment." },
    },
  },
  {
    baseSchemaId: "quotes-invoicing", variantId: "beauty-wellness:spa-massage:invoicing", personaId: "spa-massage", industryId: "beauty-wellness",
    overrides: {
      label: "Invoices",
      description: "Invoices and payment records for treatments.",
      primaryAction: { label: "New Invoice", icon: "Plus" },
      emptyState: { title: "No invoices yet", description: "Create your first invoice after a treatment." },
    },
  },
  {
    baseSchemaId: "products", variantId: "beauty-wellness:spa-massage:products", personaId: "spa-massage", industryId: "beauty-wellness",
    overrides: {
      label: "Treatments",
      description: "Your treatment menu — massages, facials, body work.",
      fieldOverrides: {
        modify: [
          { id: "name", label: "Treatment Name", placeholder: "e.g. Deep Tissue Massage, Hydrating Facial" },
          { id: "description", label: "What's included", placeholder: "e.g. 60min full body, hot stones, aromatherapy" },
          { id: "category", label: "Category", placeholder: "e.g. Massage, Skin, Body" },
          { id: "duration", label: "Duration (min)" },
        ],
        remove: ["sku", "inStock", "quantity"],
      },
      viewOverrides: { modify: [{ id: "table", visibleFields: ["name", "category", "price", "duration", "createdAt"] }] },
      primaryAction: { label: "Add Treatment", icon: "Plus" },
    },
  },
  {
    baseSchemaId: "leads-pipeline", variantId: "beauty-wellness:spa-massage:leads", personaId: "spa-massage", industryId: "beauty-wellness",
    overrides: {
      label: "Inquiries",
      description: "Track new client inquiries and convert them to regulars.",
      fieldOverrides: {
        modify: [
          { id: "value", label: "Estimated Value" },
          { id: "source", label: "How they found you" },
        ],
      },
      primaryAction: { label: "Add Inquiry", icon: "Plus" },
      emptyState: { title: "No inquiries yet", description: "When someone calls or emails about treatments, track them here." },
    },
  },
];
