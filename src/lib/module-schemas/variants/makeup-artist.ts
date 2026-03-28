import type { SchemaVariant } from "@/types/module-schema";

/**
 * Makeup Artist persona variants (beauty-wellness industry)
 *
 * DUAL WORKFLOW: Studio bookings (direct) + Wedding inquiries (funnel).
 * Mobile work for events. Deposits required for weddings.
 * Communication → Inquiry conversion is critical for this persona.
 */

export const makeupClientsVariant: SchemaVariant = {
  baseSchemaId: "client-database",
  variantId: "beauty-wellness:makeup-artist:clients",
  personaId: "makeup-artist",
  industryId: "beauty-wellness",
  overrides: {
    fieldOverrides: {
      add: [
        { id: "skinType", label: "Skin Type", type: "select", options: [
          { value: "dry", label: "Dry" },
          { value: "oily", label: "Oily" },
          { value: "combination", label: "Combination" },
          { value: "sensitive", label: "Sensitive" },
          { value: "normal", label: "Normal" },
        ], showInForm: true, showInDetail: true, group: "Preferences" },
        { id: "allergies", label: "Allergies / Sensitivities", type: "text", placeholder: "Latex, fragrance, specific ingredients...", showInForm: true, showInDetail: true, group: "Health" },
        { id: "clientType", label: "Client Type", type: "select", options: [
          { value: "bride", label: "Bride" },
          { value: "bridal-party", label: "Bridal Party" },
          { value: "event", label: "Event" },
          { value: "editorial", label: "Editorial / Film" },
          { value: "lesson", label: "Lesson" },
          { value: "regular", label: "Regular" },
        ], showInTable: true, showInForm: true, showInDetail: true, group: "Type" },
      ],
    },
    emptyState: { title: "No clients yet", description: "Add your first client — brides, regulars, or anyone you've worked with." },
  },
};

/** Leads → "Wedding Inquiries" — the inquiry-first funnel for events */
export const makeupLeadsVariant: SchemaVariant = {
  baseSchemaId: "leads-pipeline",
  variantId: "beauty-wellness:makeup-artist:leads",
  personaId: "makeup-artist",
  industryId: "beauty-wellness",
  overrides: {
    label: "Wedding Inquiries",
    description: "Track wedding and event inquiries from first message to booking.",
    fieldOverrides: {
      modify: [
        { id: "name", label: "Bride / Client Name" },
        { id: "value", label: "Package Value" },
        { id: "company", showInForm: false, showInDetail: false, searchable: false },
        { id: "notes", label: "Event Details", placeholder: "Wedding date, venue, number of people, style preferences..." },
        { id: "source", label: "How they found you", options: [
          { value: "instagram", label: "Instagram" },
          { value: "referral", label: "Referral" },
          { value: "email", label: "Email" },
          { value: "wedding-directory", label: "Wedding Directory" },
          { value: "website", label: "Website" },
          { value: "other", label: "Other" },
        ]},
        { id: "stage", label: "Status", options: [
          { value: "new", label: "New Inquiry", color: "bg-blue-500" },
          { value: "contacted", label: "Replied", color: "bg-amber-500" },
          { value: "trial-booked", label: "Trial Booked", color: "bg-violet-500" },
          { value: "quoted", label: "Quoted", color: "bg-indigo-500" },
          { value: "won", label: "Booked", color: "bg-emerald-500" },
          { value: "lost", label: "Lost", color: "bg-red-500" },
        ]},
      ],
      add: [
        { id: "weddingDate", label: "Wedding Date", type: "date", showInTable: true, showInForm: true, showInDetail: true, showInCard: true, sortable: true, group: "Event" },
        { id: "venue", label: "Venue", type: "text", placeholder: "Venue name and location", showInForm: true, showInDetail: true, group: "Event" },
        { id: "partySize", label: "Party Size", type: "number", placeholder: "Bride + bridesmaids + mothers", min: 1, showInTable: true, showInForm: true, showInDetail: true, showInCard: true, group: "Event" },
        { id: "eventType", label: "Event Type", type: "select", options: [
          { value: "wedding", label: "Wedding" },
          { value: "engagement", label: "Engagement" },
          { value: "editorial", label: "Editorial / Film" },
          { value: "corporate", label: "Corporate Event" },
          { value: "other", label: "Other Event" },
        ], showInTable: true, showInForm: true, showInDetail: true, showInCard: true, group: "Event" },
      ],
    },
    statusFlow: {
      field: "stage",
      states: [
        { value: "new", label: "New Inquiry", color: "bg-blue-500" },
        { value: "contacted", label: "Replied", color: "bg-amber-500" },
        { value: "trial-booked", label: "Trial Booked", color: "bg-violet-500" },
        { value: "quoted", label: "Quoted", color: "bg-indigo-500" },
        { value: "won", label: "Booked", color: "bg-emerald-500", isClosed: true },
        { value: "lost", label: "Lost", color: "bg-red-500", isClosed: true },
      ],
      transitions: [
        { from: "new", to: ["contacted", "lost"] },
        { from: "contacted", to: ["trial-booked", "quoted", "lost"] },
        { from: "trial-booked", to: ["quoted", "lost"] },
        { from: "quoted", to: ["won", "lost"] },
      ],
    },
    primaryAction: { label: "Add Inquiry", icon: "Plus" },
    emptyState: {
      title: "No wedding inquiries yet",
      description: "When a bride DMs or emails, convert it from Messages or add it here manually.",
    },
  },
};

/** Bookings → "Appointments" — studio sessions (booking-first flow) */
export const makeupBookingsVariant: SchemaVariant = {
  baseSchemaId: "bookings-calendar",
  variantId: "beauty-wellness:makeup-artist:bookings",
  personaId: "makeup-artist",
  industryId: "beauty-wellness",
  overrides: {
    label: "Appointments",
    description: "Bridal trials, event bookings, and sessions.",
    fieldOverrides: {
      modify: [
        { id: "title", label: "Appointment", placeholder: "e.g., Bridal Trial — Sarah" },
      ],
      add: [
        { id: "appointmentType", label: "Type", type: "select", options: [
          { value: "bridal-trial", label: "Bridal Trial" },
          { value: "event-makeup", label: "Event Makeup" },
          { value: "lesson", label: "Makeup Lesson" },
          { value: "editorial", label: "Editorial / Shoot" },
          { value: "regular", label: "Regular Appointment" },
        ], showInTable: true, showInForm: true, showInDetail: true, showInCard: true, group: "Appointment" },
      ],
    },
    primaryAction: { label: "New Appointment", icon: "Plus" },
    emptyState: { title: "No appointments yet", description: "Book a trial, lesson, or session." },
  },
};

/** Invoicing → with deposit support for weddings */
export const makeupInvoicingVariant: SchemaVariant = {
  baseSchemaId: "quotes-invoicing",
  variantId: "beauty-wellness:makeup-artist:invoicing",
  personaId: "makeup-artist",
  industryId: "beauty-wellness",
  overrides: {
    description: "Quotes, invoices, and deposits for your bookings.",
    fieldOverrides: {
      modify: [
        { id: "paymentSchedule", label: "Payment Type", options: [
          { value: "one-time", label: "Pay in full" },
          { value: "deposit-balance", label: "Deposit + balance on day" },
        ]},
      ],
    },
    emptyState: { title: "No invoices yet", description: "Send a quote for a wedding package or invoice a completed session." },
  },
};

/** Products → "Services & Packages" */
export const makeupProductsVariant: SchemaVariant = {
  baseSchemaId: "products",
  variantId: "beauty-wellness:makeup-artist:products",
  personaId: "makeup-artist",
  industryId: "beauty-wellness",
  overrides: {
    label: "Services",
    description: "Your services and wedding packages.",
    fieldOverrides: {
      modify: [
        { id: "name", label: "Service Name", placeholder: "e.g., Bridal Package — Full Day" },
        { id: "description", label: "What's included", placeholder: "e.g., Trial + wedding day, airbrush, lashes, touch-up kit" },
        { id: "category", label: "Category", placeholder: "e.g., Bridal, Event, Lessons" },
        { id: "duration", label: "Duration (min)", placeholder: "90" },
      ],
      remove: ["sku", "inStock", "quantity"],
    },
    viewOverrides: { modify: [{ id: "table", visibleFields: ["name", "category", "price", "duration", "createdAt"] }] },
    primaryAction: { label: "Add Service", icon: "Plus" },
    emptyState: { title: "No services yet", description: "Add your services and wedding packages with pricing." },
  },
};

export const makeupArtistVariants: SchemaVariant[] = [
  makeupClientsVariant,
  makeupLeadsVariant,
  makeupBookingsVariant,
  makeupInvoicingVariant,
  makeupProductsVariant,
];
