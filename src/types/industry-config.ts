// ── Industry Adaptive Config Types ──────────────────────────

/** Remappable vocabulary terms used across the UI */
export interface VocabularyMap {
  // Nouns (singular / plural)
  client: string;
  clients: string;
  job: string;
  jobs: string;
  booking: string;
  bookings: string;
  invoice: string;
  invoices: string;
  lead: string;
  leads: string;
  quote: string;
  quotes: string;
  // Action labels
  addClient: string;
  addJob: string;
  addBooking: string;
  addInvoice: string;
  addLead: string;
}

/** Field types supported in custom fields */
export type CustomFieldType = "text" | "textarea" | "select" | "number" | "date" | "toggle";

/** A single custom field definition */
export interface CustomFieldDefinition {
  id: string;
  label: string;
  type: CustomFieldType;
  placeholder?: string;
  options?: string[]; // for "select" type
  group?: string;     // grouping header
}

/** Custom fields grouped by module */
export interface ModuleFieldGroups {
  clients?: CustomFieldDefinition[];
  jobs?: CustomFieldDefinition[];
  bookings?: CustomFieldDefinition[];
}

/** A relationship type between contacts */
export interface RelationshipTypeDefinition {
  id: string;
  label: string;
  inverseLabel: string;
}

/** A pipeline stage definition */
export interface StageDefinition {
  id: string;
  label: string;
  color: string;    // tailwind class e.g. "bg-blue-500"
  isClosed?: boolean; // marks terminal stages (won/lost, completed/cancelled)
}

/** Supported invoice payment modes */
export type InvoiceMode = "one-time" | "recurring" | "milestone" | "deposit-balance" | "session-pack";

/** Supported booking modes */
export type BookingMode = "appointment" | "service-menu" | "date-exclusive" | "recurring-lesson";

/** A service definition for service-menu booking mode */
export interface ServiceDefinition {
  id: string;
  name: string;
  duration: number;  // minutes
  price: number;
  category?: string;
}

/** Invoice mode configuration */
export interface InvoiceModeConfig {
  defaultMode: InvoiceMode;
  availableModes: InvoiceMode[];
}

/** Booking mode configuration */
export interface BookingModeConfig {
  defaultMode: BookingMode;
  defaultServices?: ServiceDefinition[];
}

/** Dashboard widget preset */
export interface DashboardWidgetConfig {
  quickActions: {
    label: string;
    icon: string;
    href: string;
    shortcut?: string;
  }[];
}

/** Master config for an industry (+ optional persona overlay) */
export interface IndustryAdaptiveConfig {
  id: string;
  label: string;
  vocabulary: VocabularyMap;
  customFields: ModuleFieldGroups;
  relationships: RelationshipTypeDefinition[];
  jobStages: StageDefinition[];
  leadStages: StageDefinition[];
  invoiceMode: InvoiceModeConfig;
  bookingMode: BookingModeConfig;
  dashboard: DashboardWidgetConfig;
}

/** Partial config used for persona-level overrides */
export type IndustryAdaptiveOverride = {
  [K in keyof IndustryAdaptiveConfig]?: K extends "vocabulary"
    ? Partial<VocabularyMap>
    : K extends "customFields"
    ? Partial<ModuleFieldGroups>
    : K extends "invoiceMode"
    ? Partial<InvoiceModeConfig>
    : K extends "bookingMode"
    ? Partial<BookingModeConfig>
    : K extends "dashboard"
    ? Partial<DashboardWidgetConfig>
    : IndustryAdaptiveConfig[K];
};
