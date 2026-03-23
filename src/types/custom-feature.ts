// ── Custom Feature Plugin System ──
// Custom features are sandboxed extensions that sit ON TOP of the core platform.
// They CANNOT modify core modules (clients, invoicing, etc.) — they can only:
// 1. Create their own data collections (tables)
// 2. Create their own pages/views
// 3. Read from core modules (read-only access)
// 4. Listen to core events (webhooks/triggers)
// 5. Appear in the sidebar as additional nav items

/** A field in a custom data collection */
export interface CustomField {
  id: string;
  name: string;
  type: "text" | "number" | "date" | "boolean" | "select" | "relation";
  required?: boolean;
  options?: string[];              // for select type
  relationTo?: string;             // for relation type — links to a core module or another collection
  defaultValue?: string | number | boolean;
}

/** A custom data collection (like a database table) */
export interface CustomCollection {
  id: string;
  name: string;
  icon: string;                    // lucide icon name
  fields: CustomField[];
  records: Record<string, unknown>[]; // actual data rows
}

/** A view/page for the custom feature */
export interface CustomView {
  id: string;
  type: "table" | "kanban" | "form" | "detail";
  title: string;
  collectionId: string;            // which collection this view shows
  fields: string[];                // which fields to display
  groupBy?: string;                // for kanban view
}

/** An automation trigger for the custom feature */
export interface CustomTrigger {
  id: string;
  event: string;                   // e.g. "record.created", "record.updated", "schedule.daily"
  action: string;                  // e.g. "send-email", "update-field", "create-record"
  config: Record<string, unknown>;
}

/** The complete custom feature definition — this is what the AI builder produces */
export interface CustomFeature {
  id: string;
  name: string;
  description: string;
  icon: string;                    // lucide icon name
  slug: string;                    // URL slug for the page
  status: "building" | "ready" | "failed";
  createdAt: string;
  creditCost: number;

  // What the feature creates
  collections: CustomCollection[];
  views: CustomView[];
  triggers: CustomTrigger[];

  // Permissions — what core data this feature can READ (never write)
  coreReadAccess: string[];        // e.g. ["clients", "bookings-calendar"] — read-only access to core modules
}

export type BuilderRequestStatus = "queued" | "generating" | "review-ready" | "failed";
export type BuilderRequestSource = "ai-builder" | "dashboard-builder" | "dashboard-widget-builder";

export interface BuilderRequest {
  id: string;
  prompt: string;
  source: BuilderRequestSource;
  requestType: "feature" | "widget";
  status: BuilderRequestStatus;
  creditCost: number;
  createdAt: string;
  updatedAt: string;
  result?: string;
  error?: string;
}

/** Sandboxed permissions — what custom features are allowed to do */
export const CUSTOM_FEATURE_PERMISSIONS = {
  // CAN do:
  canCreateCollections: true,      // create their own data tables
  canCreateViews: true,            // create their own UI views
  canReadCoreModules: true,        // read data from core modules (clients, bookings, etc.)
  canListenToEvents: true,         // react to core events (new booking, payment received, etc.)
  canSendNotifications: true,      // send emails/notifications
  canAppearInSidebar: true,        // show up as nav items

  // CANNOT do:
  canModifyCoreModules: false,     // cannot change core module structure
  canModifyCoreUI: false,          // cannot alter core page layouts
  canModifyCoreData: false,        // cannot directly write to core tables (only via API)
  canAccessSettings: false,        // cannot change platform settings
  canModifyBilling: false,         // cannot touch billing/subscription
} as const;
