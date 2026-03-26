import type { SchemaVariant } from "@/types/module-schema";

/**
 * Personal Trainer persona variants (health-fitness industry)
 *
 * Booking-first workflow. Session packs. Recurring clients.
 * Mix of gym, park, and home sessions.
 */

export const trainerClientsVariant: SchemaVariant = {
  baseSchemaId: "client-database",
  variantId: "health-fitness:personal-trainer:clients",
  personaId: "personal-trainer",
  industryId: "health-fitness",
  overrides: {
    fieldOverrides: {
      add: [
        { id: "fitnessGoal", label: "Fitness Goal", type: "select", options: [
          { value: "weight-loss", label: "Weight Loss" },
          { value: "muscle-gain", label: "Muscle Gain" },
          { value: "general-fitness", label: "General Fitness" },
          { value: "rehab", label: "Rehab / Injury Recovery" },
          { value: "sports-performance", label: "Sports Performance" },
          { value: "flexibility", label: "Flexibility / Mobility" },
        ], showInTable: true, showInForm: true, showInDetail: true, group: "Fitness" },
        { id: "injuries", label: "Injuries / Limitations", type: "textarea", placeholder: "Any injuries, conditions, or limitations to be aware of", showInForm: true, showInDetail: true, group: "Health" },
        { id: "preferredTime", label: "Preferred Time", type: "select", options: [
          { value: "early-morning", label: "Early Morning (5-7am)" },
          { value: "morning", label: "Morning (7-10am)" },
          { value: "midday", label: "Midday" },
          { value: "afternoon", label: "Afternoon" },
          { value: "evening", label: "Evening" },
        ], showInForm: true, showInDetail: true, group: "Preferences" },
      ],
    },
    emptyState: { title: "No clients yet", description: "Add your first client to start tracking their fitness journey." },
  },
};

export const trainerBookingsVariant: SchemaVariant = {
  baseSchemaId: "bookings-calendar",
  variantId: "health-fitness:personal-trainer:bookings",
  personaId: "personal-trainer",
  industryId: "health-fitness",
  overrides: {
    label: "Sessions",
    description: "Your training sessions — schedule, track, and manage.",
    fieldOverrides: {
      modify: [
        { id: "title", label: "Session", placeholder: "e.g., PT Session — Sarah M." },
      ],
      add: [
        { id: "sessionType", label: "Session Type", type: "select", options: [
          { value: "1on1", label: "1-on-1" },
          { value: "small-group", label: "Small Group" },
          { value: "online", label: "Online" },
          { value: "assessment", label: "Assessment" },
        ], showInTable: true, showInForm: true, showInDetail: true, showInCard: true, group: "Session" },
        { id: "location", label: "Location", type: "select", options: [
          { value: "gym", label: "Gym" },
          { value: "park", label: "Park / Outdoor" },
          { value: "home", label: "Client's Home" },
          { value: "online", label: "Online" },
        ], showInForm: true, showInDetail: true, group: "Session" },
      ],
    },
    primaryAction: { label: "Book Session", icon: "Plus" },
    emptyState: { title: "No sessions scheduled", description: "Book your first training session." },
  },
};

export const trainerProductsVariant: SchemaVariant = {
  baseSchemaId: "products",
  variantId: "health-fitness:personal-trainer:products",
  personaId: "personal-trainer",
  industryId: "health-fitness",
  overrides: {
    label: "Programs",
    description: "Your training programs, session packs, and pricing.",
    fieldOverrides: {
      modify: [
        { id: "name", label: "Program Name", placeholder: "e.g., 10-Session Pack" },
        { id: "description", label: "What's included", placeholder: "e.g., 10 x 1-hour PT sessions, program design, check-ins" },
        { id: "category", label: "Type", placeholder: "e.g., Session Pack, Program, Assessment" },
        { id: "duration", label: "Session Length (min)", placeholder: "60" },
      ],
      remove: ["sku", "inStock", "quantity"],
    },
    viewOverrides: { modify: [{ id: "table", visibleFields: ["name", "category", "price", "duration", "createdAt"] }] },
    primaryAction: { label: "Add Program", icon: "Plus" },
    emptyState: { title: "No programs yet", description: "Create your session packs and training programs." },
  },
};

export const trainerInvoicingVariant: SchemaVariant = {
  baseSchemaId: "quotes-invoicing",
  variantId: "health-fitness:personal-trainer:invoicing",
  personaId: "personal-trainer",
  industryId: "health-fitness",
  overrides: {
    label: "Payments",
    description: "Session pack payments and billing.",
    fieldOverrides: {
      modify: [
        { id: "paymentSchedule", label: "Billing Type", options: [
          { value: "one-time", label: "Session pack" },
          { value: "recurring", label: "Weekly billing" },
        ]},
        { id: "jobId", showInForm: false, showInDetail: false },
      ],
    },
    actionOverrides: { remove: ["convert-quote-to-invoice"] },
    primaryAction: { label: "New Payment", icon: "Plus" },
    emptyState: { title: "No payments yet", description: "Record a session pack purchase or set up weekly billing." },
  },
};

export const trainerLeadsVariant: SchemaVariant = {
  baseSchemaId: "leads-pipeline",
  variantId: "health-fitness:personal-trainer:leads",
  personaId: "personal-trainer",
  industryId: "health-fitness",
  overrides: {
    label: "Prospects",
    description: "People interested in training — track them from inquiry to first session.",
    fieldOverrides: {
      modify: [
        { id: "company", showInForm: false, showInDetail: false, searchable: false },
        { id: "value", label: "Potential Value", placeholder: "e.g., $800 for a 10-pack" },
        { id: "source", label: "How they found you", options: [
          { value: "referral", label: "Referral" },
          { value: "instagram", label: "Instagram" },
          { value: "gym-front-desk", label: "Gym Front Desk" },
          { value: "google", label: "Google" },
          { value: "other", label: "Other" },
        ]},
      ],
    },
    primaryAction: { label: "Add Prospect", icon: "Plus" },
    emptyState: { title: "No prospects yet", description: "When someone asks about training, add them here." },
  },
};

export const personalTrainerVariants: SchemaVariant[] = [
  trainerClientsVariant,
  trainerBookingsVariant,
  trainerProductsVariant,
  trainerInvoicingVariant,
  trainerLeadsVariant,
];
