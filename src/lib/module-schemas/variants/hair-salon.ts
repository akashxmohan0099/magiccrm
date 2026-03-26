import type { SchemaVariant } from "@/types/module-schema";

/**
 * Hair Salon persona variants (beauty-wellness industry)
 *
 * Booking-first workflow. Pay at point of sale. No quotes.
 * Clients are regulars who rebook every 4-8 weeks.
 * Services are time-based (cuts, colours, treatments).
 */

/** Clients → relabeled for salon context */
export const hairSalonClientsVariant: SchemaVariant = {
  baseSchemaId: "clients",
  variantId: "beauty-wellness:hair-salon:clients",
  personaId: "hair-salon",
  industryId: "beauty-wellness",
  overrides: {
    description: "Your regulars, walk-ins, and contact history.",
    fieldOverrides: {
      add: [
        {
          id: "hairType",
          label: "Hair Type",
          type: "select",
          options: [
            { value: "straight", label: "Straight" },
            { value: "wavy", label: "Wavy" },
            { value: "curly", label: "Curly" },
            { value: "coily", label: "Coily" },
          ],
          showInForm: true,
          showInDetail: true,
          group: "Preferences",
        },
        {
          id: "colourFormula",
          label: "Colour Formula",
          type: "textarea",
          placeholder: "e.g., 6N + 7A, 20vol, full head",
          showInForm: true,
          showInDetail: true,
          group: "Preferences",
        },
        {
          id: "allergies",
          label: "Allergies / Sensitivities",
          type: "text",
          placeholder: "Any known allergies or sensitivities",
          showInForm: true,
          showInDetail: true,
          group: "Health",
        },
      ],
    },
    emptyState: {
      title: "No clients yet",
      description: "Add your first client — regulars, walk-ins, or anyone who's sat in your chair.",
      setupSteps: [
        { label: "Add a client", description: "Create your first client record" },
        { label: "Import from CSV", description: "Upload your existing client list" },
      ],
    },
  },
};

/** Leads → "Inquiries" for salon context */
export const hairSalonLeadsVariant: SchemaVariant = {
  baseSchemaId: "leads",
  variantId: "beauty-wellness:hair-salon:leads",
  personaId: "hair-salon",
  industryId: "beauty-wellness",
  overrides: {
    label: "Inquiries",
    description: "Track new inquiries and turn them into regulars.",
    fieldOverrides: {
      modify: [
        { id: "value", label: "Estimated Value", placeholder: "Expected spend per visit" },
        { id: "source", label: "How they found you" },
      ],
      remove: ["company"],
    },
    primaryAction: { label: "Add Inquiry", icon: "Plus" },
    emptyState: {
      title: "No inquiries yet",
      description: "When someone reaches out about your services, add them here to track the conversation.",
    },
  },
};

/** Bookings → "Appointments" for salon context */
export const hairSalonBookingsVariant: SchemaVariant = {
  baseSchemaId: "bookings",
  variantId: "beauty-wellness:hair-salon:bookings",
  personaId: "hair-salon",
  industryId: "beauty-wellness",
  overrides: {
    label: "Appointments",
    description: "Your appointment book — schedule, manage, and track.",
    primaryAction: { label: "New Appointment", icon: "Plus" },
    emptyState: {
      title: "No appointments yet",
      description: "Book your first client in. Set up your services first so appointments auto-fill duration and price.",
      setupSteps: [
        { label: "Add your services", description: "Cuts, colours, treatments with pricing and duration" },
        { label: "Set your hours", description: "When you're available for bookings" },
      ],
    },
  },
};

/** Invoicing → "Receipts" for salon (no quotes, pay at point of sale) */
export const hairSalonInvoicingVariant: SchemaVariant = {
  baseSchemaId: "invoicing",
  variantId: "beauty-wellness:hair-salon:invoicing",
  personaId: "hair-salon",
  industryId: "beauty-wellness",
  overrides: {
    label: "Receipts",
    description: "Receipts and payment records for your services.",
    fieldOverrides: {
      modify: [
        { id: "number", label: "Receipt #", placeholder: "RCT-001" },
        { id: "paymentSchedule", label: "Payment Type", options: [
          { value: "one-time", label: "Pay now" },
          { value: "deposit-balance", label: "Deposit + Later" },
        ]},
      ],
      remove: ["jobId", "recurringSchedule"],
    },
    // Remove the quote→invoice action (salons don't quote)
    actionOverrides: { remove: ["convert-quote-to-invoice"] },
    primaryAction: { label: "New Receipt", icon: "Plus" },
    emptyState: {
      title: "No receipts yet",
      description: "Receipts are created when clients pay for their services.",
    },
  },
};

/** Products → "Services" for salon */
export const hairSalonProductsVariant: SchemaVariant = {
  baseSchemaId: "products",
  variantId: "beauty-wellness:hair-salon:products",
  personaId: "hair-salon",
  industryId: "beauty-wellness",
  overrides: {
    label: "Services",
    description: "Your service menu — what you offer, how long it takes, and what it costs.",
    fieldOverrides: {
      modify: [
        { id: "name", label: "Service Name", placeholder: "e.g., Cut & Blowdry" },
        { id: "description", label: "What's included", placeholder: "e.g., Wash, cut, style, and blowdry" },
        { id: "category", label: "Category", placeholder: "e.g., Cuts, Colour, Treatments" },
        { id: "price", label: "Price" },
        { id: "duration", label: "Duration (min)", placeholder: "45" },
      ],
      remove: ["sku", "inStock", "quantity"],
    },
    primaryAction: { label: "Add Service", icon: "Plus" },
    emptyState: {
      title: "No services yet",
      description: "Add your services so clients can book and you can generate receipts automatically.",
      setupSteps: [
        { label: "Add a service", description: "Name, duration, and price" },
      ],
    },
  },
};

/** All hair-salon variants */
export const hairSalonVariants: SchemaVariant[] = [
  hairSalonClientsVariant,
  hairSalonLeadsVariant,
  hairSalonBookingsVariant,
  hairSalonInvoicingVariant,
  hairSalonProductsVariant,
];
