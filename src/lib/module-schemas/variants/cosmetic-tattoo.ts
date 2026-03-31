import type { SchemaVariant } from "@/types/module-schema";

/**
 * Cosmetic Tattoo Artist persona variants (beauty-wellness)
 * Procedure-based, high-trust, deposit-required, touch-up scheduling.
 */

export const cosmeticTattooVariants: SchemaVariant[] = [
  {
    baseSchemaId: "client-database", variantId: "beauty-wellness:cosmetic-tattoo:clients", personaId: "cosmetic-tattoo", industryId: "beauty-wellness",
    overrides: {
      fieldOverrides: {
        modify: [{ id: "company", showInForm: false, showInDetail: false, searchable: false }],
        add: [
          { id: "skinType", label: "Skin Type", type: "select", options: [
            { value: "normal", label: "Normal" }, { value: "oily", label: "Oily" },
            { value: "dry", label: "Dry" }, { value: "combination", label: "Combination" },
            { value: "sensitive", label: "Sensitive" },
          ], showInForm: true, showInDetail: true, group: "Skin Profile" },
          { id: "pigmentBrand", label: "Pigment Brand", type: "text", placeholder: "e.g. PhiBrows, Perma Blend", showInForm: true, showInDetail: true, group: "Treatment Notes" },
          { id: "healedResult", label: "Healed Result Notes", type: "textarea", placeholder: "How the pigment healed, colour retention...", showInForm: true, showInDetail: true, group: "Treatment Notes" },
        ],
      },
      emptyState: { title: "No clients yet", description: "Add your clients with skin type and treatment notes." },
    },
  },
  {
    baseSchemaId: "bookings-calendar", variantId: "beauty-wellness:cosmetic-tattoo:bookings", personaId: "cosmetic-tattoo", industryId: "beauty-wellness",
    overrides: {
      label: "Appointments",
      description: "Procedures, consultations, and touch-up sessions.",
      primaryAction: { label: "New Appointment", icon: "Plus" },
      emptyState: { title: "No appointments yet", description: "Book a consultation, procedure, or touch-up session." },
    },
  },
  {
    baseSchemaId: "quotes-invoicing", variantId: "beauty-wellness:cosmetic-tattoo:invoicing", personaId: "cosmetic-tattoo", industryId: "beauty-wellness",
    overrides: {
      label: "Invoices",
      description: "Deposits, procedure fees, and touch-up invoicing.",
      fieldOverrides: {
        modify: [
          { id: "paymentSchedule", label: "Payment Type", options: [{ value: "deposit-balance", label: "Deposit + balance on day" }, { value: "one-time", label: "Pay in full" }] },
        ],
      },
      primaryAction: { label: "New Invoice", icon: "Plus" },
      emptyState: { title: "No invoices yet", description: "Create a deposit invoice for a procedure or touch-up." },
    },
  },
  {
    baseSchemaId: "products", variantId: "beauty-wellness:cosmetic-tattoo:products", personaId: "cosmetic-tattoo", industryId: "beauty-wellness",
    overrides: {
      label: "Services",
      description: "Your procedures and pricing.",
      fieldOverrides: {
        modify: [
          { id: "name", label: "Procedure Name", placeholder: "e.g. Microblading, Lip Blush" },
          { id: "description", label: "What's included", placeholder: "e.g. Consultation + procedure + 6-week touch-up" },
          { id: "category", label: "Category", placeholder: "e.g. Brows, Lips, Eyes" },
          { id: "duration", label: "Duration (min)" },
        ],
        remove: ["sku", "inStock", "quantity"],
      },
      viewOverrides: { modify: [{ id: "table", visibleFields: ["name", "category", "price", "duration", "createdAt"] }] },
      primaryAction: { label: "Add Procedure", icon: "Plus" },
    },
  },
  {
    baseSchemaId: "leads-pipeline", variantId: "beauty-wellness:cosmetic-tattoo:leads", personaId: "cosmetic-tattoo", industryId: "beauty-wellness",
    overrides: {
      label: "Inquiries",
      description: "Track consultation requests and convert them to bookings.",
      fieldOverrides: {
        modify: [
          { id: "value", label: "Estimated Value" },
          { id: "source", label: "How they found you" },
          { id: "company", showInForm: false, showInDetail: false },
        ],
      },
      primaryAction: { label: "Add Inquiry", icon: "Plus" },
      emptyState: { title: "No inquiries yet", description: "When someone DMs about a procedure, add them here." },
    },
  },
];
