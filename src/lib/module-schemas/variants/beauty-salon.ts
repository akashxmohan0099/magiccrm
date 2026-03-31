import type { SchemaVariant } from "@/types/module-schema";

/**
 * Beauty Salon / Studio persona variants (beauty-wellness)
 * Multi-service, team-based, cross-selling between services.
 */

export const beautySalonVariants: SchemaVariant[] = [
  {
    baseSchemaId: "client-database", variantId: "beauty-wellness:beauty-salon:clients", personaId: "beauty-salon", industryId: "beauty-wellness",
    overrides: {
      fieldOverrides: {
        add: [
          { id: "preferredServices", label: "Preferred Services", type: "text", placeholder: "e.g. hair colour, gel nails, facials", showInForm: true, showInDetail: true, group: "Preferences" },
        ],
      },
      emptyState: { title: "No clients yet", description: "Add your clients — regulars, walk-ins, or new bookings." },
    },
  },
  {
    baseSchemaId: "bookings-calendar", variantId: "beauty-wellness:beauty-salon:bookings", personaId: "beauty-salon", industryId: "beauty-wellness",
    overrides: {
      label: "Appointments",
      description: "All appointments across your salon services.",
      primaryAction: { label: "New Appointment", icon: "Plus" },
      emptyState: { title: "No appointments yet", description: "Book a client for any of your salon services." },
    },
  },
  {
    baseSchemaId: "quotes-invoicing", variantId: "beauty-wellness:beauty-salon:invoicing", personaId: "beauty-salon", industryId: "beauty-wellness",
    overrides: {
      label: "Receipts",
      description: "Payment records across all services.",
      primaryAction: { label: "New Receipt", icon: "Plus" },
    },
  },
  {
    baseSchemaId: "products", variantId: "beauty-wellness:beauty-salon:products", personaId: "beauty-salon", industryId: "beauty-wellness",
    overrides: {
      label: "Services",
      description: "All services offered across your salon.",
      fieldOverrides: {
        modify: [
          { id: "name", label: "Service Name", placeholder: "e.g. Women's Cut, Gel Manicure, Express Facial" },
          { id: "category", label: "Category", placeholder: "e.g. Hair, Nails, Skin, Brows" },
          { id: "duration", label: "Duration (min)" },
        ],
        remove: ["sku", "inStock", "quantity"],
      },
      viewOverrides: { modify: [{ id: "table", visibleFields: ["name", "category", "price", "duration", "createdAt"] }] },
      primaryAction: { label: "Add Service", icon: "Plus" },
    },
  },
  {
    baseSchemaId: "leads-pipeline", variantId: "beauty-wellness:beauty-salon:leads", personaId: "beauty-salon", industryId: "beauty-wellness",
    overrides: {
      label: "Inquiries",
      description: "Track new client inquiries and convert them.",
      primaryAction: { label: "Add Inquiry", icon: "Plus" },
      emptyState: { title: "No inquiries yet", description: "When new clients reach out, track them here." },
    },
  },
];
