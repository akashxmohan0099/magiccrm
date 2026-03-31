import type { SchemaVariant } from "@/types/module-schema";

/**
 * Lash & Brow Tech persona variants (beauty-wellness)
 * Appointment-based, Instagram-driven, fill intervals every 2-3 weeks.
 */

export const lashBrowTechVariants: SchemaVariant[] = [
  {
    baseSchemaId: "client-database", variantId: "beauty-wellness:lash-brow-tech:clients", personaId: "lash-brow-tech", industryId: "beauty-wellness",
    overrides: {
      fieldOverrides: {
        modify: [{ id: "company", showInForm: false, showInDetail: false, searchable: false }],
        add: [
          { id: "eyeShape", label: "Eye Shape", type: "text", placeholder: "e.g. almond, round, hooded, monolid", showInForm: true, showInDetail: true, group: "Lash Profile" },
          { id: "lashCondition", label: "Lash Condition", type: "text", placeholder: "e.g. healthy, sparse, damaged", showInForm: true, showInDetail: true, group: "Lash Profile" },
          { id: "adhesiveUsed", label: "Adhesive Used", type: "text", placeholder: "Brand and type", showInForm: true, showInDetail: true, group: "Lash Profile" },
          { id: "curlDiameterLength", label: "Curl / Diameter / Length", type: "text", placeholder: "e.g. C 0.07 12mm", showInForm: true, showInDetail: true, group: "Lash Profile" },
          { id: "allergies", label: "Allergies / Sensitivities", type: "text", placeholder: "Latex, adhesive, tape...", showInForm: true, showInDetail: true, group: "Health" },
        ],
      },
      emptyState: { title: "No clients yet", description: "Add your regulars — lash preferences, eye shape, and adhesive notes." },
    },
  },
  {
    baseSchemaId: "bookings-calendar", variantId: "beauty-wellness:lash-brow-tech:bookings", personaId: "lash-brow-tech", industryId: "beauty-wellness",
    overrides: {
      label: "Appointments",
      description: "Full sets, fills, lifts, and brow appointments.",
      primaryAction: { label: "New Appointment", icon: "Plus" },
      emptyState: { title: "No appointments yet", description: "Book a client for a full set, fill, or brow service." },
    },
  },
  {
    baseSchemaId: "quotes-invoicing", variantId: "beauty-wellness:lash-brow-tech:invoicing", personaId: "lash-brow-tech", industryId: "beauty-wellness",
    overrides: {
      label: "Receipts",
      description: "Payment records for lash and brow services.",
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
    baseSchemaId: "products", variantId: "beauty-wellness:lash-brow-tech:products", personaId: "lash-brow-tech", industryId: "beauty-wellness",
    overrides: {
      label: "Services",
      description: "Your lash and brow services with pricing.",
      fieldOverrides: {
        modify: [
          { id: "name", label: "Service Name", placeholder: "e.g. Classic Full Set, Brow Lamination" },
          { id: "description", label: "What's included", placeholder: "e.g. Full set with C-curl, sensitive adhesive" },
          { id: "category", label: "Category", placeholder: "e.g. Lashes, Brows" },
          { id: "duration", label: "Duration (min)" },
        ],
        remove: ["sku", "inStock", "quantity"],
      },
      viewOverrides: { modify: [{ id: "table", visibleFields: ["name", "category", "price", "duration", "createdAt"] }] },
      primaryAction: { label: "Add Service", icon: "Plus" },
    },
  },
  {
    baseSchemaId: "leads-pipeline", variantId: "beauty-wellness:lash-brow-tech:leads", personaId: "lash-brow-tech", industryId: "beauty-wellness",
    overrides: {
      label: "Inquiries",
      description: "New client inquiries from Instagram, referrals, and your website.",
      fieldOverrides: {
        modify: [
          { id: "value", label: "Estimated Value" },
          { id: "source", label: "How they found you" },
          { id: "company", showInForm: false, showInDetail: false },
        ],
      },
      primaryAction: { label: "Add Inquiry", icon: "Plus" },
      emptyState: { title: "No inquiries yet", description: "When someone DMs or emails you, add them here to track the follow-up." },
    },
  },
];
