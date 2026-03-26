import type { SchemaVariant } from "@/types/module-schema";

/**
 * Tutor persona variants (education-coaching industry)
 *
 * Recurring-lesson workflow. Hourly billing. Travel to student homes.
 * Term-based scheduling with exam-peak demand.
 */

export const tutorClientsVariant: SchemaVariant = {
  baseSchemaId: "client-database",
  variantId: "education-coaching:tutor:clients",
  personaId: "tutor",
  industryId: "education-coaching",
  overrides: {
    label: "Students",
    description: "Your students and their parents' contact info.",
    fieldOverrides: {
      modify: [
        { id: "name", label: "Student Name" },
        { id: "company", label: "Parent / Guardian", showInTable: true },
      ],
      add: [
        { id: "yearLevel", label: "Year Level", type: "select", options: [
          { value: "primary", label: "Primary School" },
          { value: "year-7-8", label: "Year 7-8" },
          { value: "year-9-10", label: "Year 9-10" },
          { value: "year-11-12", label: "Year 11-12 (VCE/HSC)" },
          { value: "uni", label: "University" },
          { value: "adult", label: "Adult Learner" },
        ], showInTable: true, showInForm: true, showInDetail: true, group: "Education" },
        { id: "subjects", label: "Subjects", type: "text", placeholder: "e.g., Maths, English, Physics", showInTable: true, showInForm: true, showInDetail: true, searchable: true, group: "Education" },
        { id: "learningNotes", label: "Learning Notes", type: "textarea", placeholder: "Learning style, strengths, areas to work on...", showInForm: true, showInDetail: true, group: "Education" },
      ],
    },
    primaryAction: { label: "Add Student", icon: "Plus" },
    emptyState: { title: "No students yet", description: "Add your first student to start tracking their progress." },
  },
};

export const tutorBookingsVariant: SchemaVariant = {
  baseSchemaId: "bookings-calendar",
  variantId: "education-coaching:tutor:bookings",
  personaId: "tutor",
  industryId: "education-coaching",
  overrides: {
    label: "Lessons",
    description: "Your lesson schedule — weekly, one-off, and exam prep sessions.",
    fieldOverrides: {
      modify: [
        { id: "title", label: "Lesson", placeholder: "e.g., Maths — Year 11 — Sarah" },
        { id: "clientId", label: "Student" },
      ],
      add: [
        { id: "subject", label: "Subject", type: "text", placeholder: "e.g., Maths Methods", showInTable: true, showInForm: true, showInDetail: true, showInCard: true, group: "Lesson" },
        { id: "lessonLocation", label: "Location", type: "select", options: [
          { value: "student-home", label: "Student's Home" },
          { value: "library", label: "Library" },
          { value: "online", label: "Online" },
          { value: "my-place", label: "My Place" },
        ], showInForm: true, showInDetail: true, group: "Lesson" },
      ],
    },
    primaryAction: { label: "Schedule Lesson", icon: "Plus" },
    emptyState: { title: "No lessons scheduled", description: "Schedule your first lesson — weekly recurring or one-off." },
  },
};

export const tutorProductsVariant: SchemaVariant = {
  baseSchemaId: "products",
  variantId: "education-coaching:tutor:products",
  personaId: "tutor",
  industryId: "education-coaching",
  overrides: {
    label: "Rates",
    description: "Your tutoring rates by subject and level.",
    fieldOverrides: {
      modify: [
        { id: "name", label: "Rate Name", placeholder: "e.g., Year 11-12 Maths" },
        { id: "description", label: "Details", placeholder: "e.g., HSC/VCE level maths tutoring" },
        { id: "category", label: "Level", placeholder: "e.g., Primary, Secondary, VCE" },
        { id: "price", label: "Hourly Rate" },
        { id: "duration", label: "Session Length (min)", placeholder: "60" },
      ],
      remove: ["sku", "inStock", "quantity"],
    },
    viewOverrides: { modify: [{ id: "table", visibleFields: ["name", "category", "price", "duration", "createdAt"] }] },
    primaryAction: { label: "Add Rate", icon: "Plus" },
    emptyState: { title: "No rates set", description: "Define your tutoring rates by subject and year level." },
  },
};

export const tutorInvoicingVariant: SchemaVariant = {
  baseSchemaId: "quotes-invoicing",
  variantId: "education-coaching:tutor:invoicing",
  personaId: "tutor",
  industryId: "education-coaching",
  overrides: {
    label: "Billing",
    description: "Invoices for tutoring sessions — weekly or per-term.",
    fieldOverrides: {
      modify: [
        { id: "clientId", label: "Student / Parent" },
        { id: "paymentSchedule", label: "Billing Frequency", options: [
          { value: "one-time", label: "Per invoice" },
          { value: "recurring", label: "Weekly" },
        ]},
        { id: "jobId", showInForm: false, showInDetail: false },
      ],
    },
    actionOverrides: { remove: ["convert-quote-to-invoice"] },
    primaryAction: { label: "New Invoice", icon: "Plus" },
    emptyState: { title: "No invoices yet", description: "Create an invoice for completed lessons." },
  },
};

export const tutorLeadsVariant: SchemaVariant = {
  baseSchemaId: "leads-pipeline",
  variantId: "education-coaching:tutor:leads",
  personaId: "tutor",
  industryId: "education-coaching",
  overrides: {
    label: "Inquiries",
    description: "Parents and students who've reached out about tutoring.",
    fieldOverrides: {
      modify: [
        { id: "name", label: "Student / Parent Name" },
        { id: "company", showInForm: false, showInDetail: false, searchable: false },
        { id: "value", label: "Est. Weekly Value" },
        { id: "notes", label: "What they need", placeholder: "Subject, year level, goals, availability..." },
        { id: "source", label: "How they found you", options: [
          { value: "referral", label: "Word of mouth" },
          { value: "website", label: "Website" },
          { value: "school", label: "School referral" },
          { value: "facebook", label: "Facebook group" },
          { value: "other", label: "Other" },
        ]},
      ],
    },
    primaryAction: { label: "Add Inquiry", icon: "Plus" },
    emptyState: { title: "No inquiries yet", description: "When a parent or student asks about tutoring, add them here." },
  },
};

export const tutorVariants: SchemaVariant[] = [
  tutorClientsVariant,
  tutorBookingsVariant,
  tutorProductsVariant,
  tutorInvoicingVariant,
  tutorLeadsVariant,
];
