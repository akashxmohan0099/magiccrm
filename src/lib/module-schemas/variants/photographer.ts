import type { SchemaVariant } from "@/types/module-schema";

/**
 * Photographer persona variants (creative-services industry)
 *
 * Inquiry-first workflow. Packages with deposits. On-location work.
 * Weddings, portraits, events, commercial — seasonal peaks.
 */

export const photographerClientsVariant: SchemaVariant = {
  baseSchemaId: "client-database",
  variantId: "creative-services:photographer:clients",
  personaId: "photographer",
  industryId: "creative-services",
  overrides: {
    fieldOverrides: {
      add: [
        { id: "shootType", label: "Shoot Preference", type: "select", options: [
          { value: "wedding", label: "Wedding" },
          { value: "portrait", label: "Portrait" },
          { value: "event", label: "Event" },
          { value: "commercial", label: "Commercial" },
          { value: "headshot", label: "Headshot" },
        ], showInForm: true, showInDetail: true, group: "Preferences" },
      ],
    },
    emptyState: { title: "No clients yet", description: "Add your first client — couples, businesses, or anyone you've shot for." },
  },
};

export const photographerLeadsVariant: SchemaVariant = {
  baseSchemaId: "leads-pipeline",
  variantId: "creative-services:photographer:leads",
  personaId: "photographer",
  industryId: "creative-services",
  overrides: {
    label: "Inquiries",
    description: "Incoming shoot requests and quote inquiries.",
    fieldOverrides: {
      modify: [
        { id: "value", label: "Package Value" },
        { id: "notes", label: "Shoot Details", placeholder: "Date, location, style, number of people..." },
        { id: "source", label: "How they found you", options: [
          { value: "referral", label: "Referral" },
          { value: "instagram", label: "Instagram" },
          { value: "website", label: "Website" },
          { value: "google", label: "Google" },
          { value: "wedding-directory", label: "Wedding Directory" },
          { value: "other", label: "Other" },
        ]},
      ],
      add: [
        { id: "eventDate", label: "Event Date", type: "date", showInTable: true, showInForm: true, showInDetail: true, showInCard: true, sortable: true, group: "Pipeline" },
        { id: "shootType", label: "Shoot Type", type: "select", options: [
          { value: "wedding", label: "Wedding" },
          { value: "portrait", label: "Portrait" },
          { value: "event", label: "Event" },
          { value: "commercial", label: "Commercial" },
        ], showInTable: true, showInForm: true, showInDetail: true, showInCard: true, group: "Pipeline" },
      ],
    },
    primaryAction: { label: "New Inquiry", icon: "Plus" },
    emptyState: { title: "No inquiries yet", description: "When someone asks about a shoot, log it here to track from inquiry to booking." },
  },
};

export const photographerJobsVariant: SchemaVariant = {
  baseSchemaId: "jobs-projects",
  variantId: "creative-services:photographer:jobs",
  personaId: "photographer",
  industryId: "creative-services",
  overrides: {
    label: "Shoots",
    description: "Track every shoot from booking to delivery.",
    fieldOverrides: {
      modify: [
        { id: "title", label: "Shoot Title", placeholder: "e.g., Sarah & Tom Wedding — Yarra Valley" },
        { id: "description", label: "Shot List / Brief", placeholder: "Key moments, group shots, locations..." },
        { id: "stage", label: "Stage", options: [
          { value: "booked", label: "Booked", color: "bg-blue-500" },
          { value: "shot", label: "Shot", color: "bg-amber-500" },
          { value: "editing", label: "Editing", color: "bg-violet-500" },
          { value: "delivered", label: "Delivered", color: "bg-emerald-500" },
          { value: "cancelled", label: "Cancelled", color: "bg-red-500" },
        ]},
      ],
      add: [
        { id: "shootDate", label: "Shoot Date", type: "date", showInTable: true, showInForm: true, showInDetail: true, showInCard: true, sortable: true, group: "Details" },
        { id: "location", label: "Location", type: "text", placeholder: "Venue or address", showInTable: true, showInForm: true, showInDetail: true, group: "Details" },
      ],
    },
    statusFlow: {
      field: "stage",
      states: [
        { value: "booked", label: "Booked", color: "bg-blue-500" },
        { value: "shot", label: "Shot", color: "bg-amber-500" },
        { value: "editing", label: "Editing", color: "bg-violet-500" },
        { value: "delivered", label: "Delivered", color: "bg-emerald-500", isClosed: true },
        { value: "cancelled", label: "Cancelled", color: "bg-red-500", isClosed: true },
      ],
      transitions: [
        { from: "booked", to: ["shot", "cancelled"] },
        { from: "shot", to: ["editing"] },
        { from: "editing", to: ["delivered"] },
      ],
    },
    primaryAction: { label: "Add Shoot", icon: "Plus" },
    emptyState: { title: "No shoots yet", description: "When a client books, add the shoot here to track it through to delivery." },
  },
};

export const photographerBookingsVariant: SchemaVariant = {
  baseSchemaId: "bookings-calendar",
  variantId: "creative-services:photographer:bookings",
  personaId: "photographer",
  industryId: "creative-services",
  overrides: {
    label: "Sessions",
    description: "Your shoot calendar — portrait sessions, meetings, second shoots.",
    fieldOverrides: {
      modify: [
        { id: "title", label: "Session", placeholder: "e.g., Portrait session — Sarah M." },
      ],
    },
    primaryAction: { label: "New Session", icon: "Plus" },
    emptyState: { title: "No sessions scheduled", description: "Add a portrait session, client meeting, or second shoot." },
  },
};

export const photographerInvoicingVariant: SchemaVariant = {
  baseSchemaId: "quotes-invoicing",
  variantId: "creative-services:photographer:invoicing",
  personaId: "photographer",
  industryId: "creative-services",
  overrides: {
    description: "Packages, quotes, and invoices for your shoots.",
    fieldOverrides: {
      modify: [
        { id: "paymentSchedule", label: "Payment Terms", options: [
          { value: "one-time", label: "Full payment" },
          { value: "deposit-balance", label: "Deposit + balance on delivery" },
        ]},
      ],
    },
    emptyState: { title: "No invoices yet", description: "Create a package quote or invoice for a shoot." },
  },
};

export const photographerProductsVariant: SchemaVariant = {
  baseSchemaId: "products",
  variantId: "creative-services:photographer:products",
  personaId: "photographer",
  industryId: "creative-services",
  overrides: {
    label: "Packages",
    description: "Your photography packages and pricing.",
    fieldOverrides: {
      modify: [
        { id: "name", label: "Package Name", placeholder: "e.g., Wedding Full Day" },
        { id: "description", label: "What's included", placeholder: "e.g., 8 hours, 2 photographers, 400+ edited images, online gallery" },
        { id: "category", label: "Category", placeholder: "e.g., Wedding, Portrait, Commercial" },
        { id: "duration", label: "Duration (hours)", placeholder: "8" },
      ],
      remove: ["sku", "inStock", "quantity"],
    },
    viewOverrides: { modify: [{ id: "table", visibleFields: ["name", "category", "price", "duration", "createdAt"] }] },
    primaryAction: { label: "Add Package", icon: "Plus" },
    emptyState: { title: "No packages yet", description: "Define your photography packages so you can quote clients faster." },
  },
};

export const photographerVariants: SchemaVariant[] = [
  photographerClientsVariant,
  photographerLeadsVariant,
  photographerJobsVariant,
  photographerBookingsVariant,
  photographerInvoicingVariant,
  photographerProductsVariant,
];
