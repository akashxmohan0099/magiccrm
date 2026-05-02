// ── Form ────────────────────────────────────────────

export type FormType = 'booking' | 'inquiry';

export type FormFieldType =
  | 'text'
  | 'email'
  | 'phone'
  | 'url'
  | 'number'
  | 'textarea'
  | 'select'
  | 'multi_select'
  | 'radio'
  | 'checkbox'
  | 'file'
  | 'date'
  | 'date_range'
  | 'time'
  | 'service'
  | 'signature'
  | 'hidden';

// Conditional show rule. The field renders only when the referenced field's
// answer matches one of the listed values.
//   operator 'equals'   — value must be one of `values`
//   operator 'not_equals' — value must NOT be any of `values`
//   operator 'includes' — for multi-value answers (multi_select/checkbox), at
//                         least one selection must be in `values`
export interface FormFieldCondition {
  fieldName: string;
  operator: 'equals' | 'not_equals' | 'includes';
  values: string[];
}

export interface FormFieldConfig {
  name: string;
  type: FormFieldType;
  label: string;
  required: boolean;
  options?: string[];         // for select / multi_select / radio / checkbox
  placeholder?: string;       // optional placeholder, falls back to label
  helpText?: string;          // small supporting text under the field
  // ── Validation ──
  // Surfaced in the editor only for the field types where they apply, but
  // stored on the same flat config so the renderer can read them uniformly.
  min?: number;               // number fields — minimum value
  max?: number;               // number fields — maximum value
  maxLength?: number;         // textarea — character cap with live counter
  maxSelections?: number;     // multi_select / checkbox — caps how many options the user may pick
  // ── File upload (type === 'file') ──
  acceptedFileTypes?: string; // e.g. 'image/*' or '.pdf,.jpg'
  multipleFiles?: boolean;
  maxFileSizeMb?: number;     // per-file limit, default 5
  maxFiles?: number;          // only when multipleFiles is true; caps file count
  // ── Hidden field (type === 'hidden') ──
  // Auto-populated from URL params on the public page. Comma-separated keys
  // tried in order; first match wins.
  paramKeys?: string;         // e.g. 'utm_source,source,ref'
  defaultValue?: string;      // fallback when no param matches
  // ── Conditional show ──
  showWhen?: FormFieldCondition;
}

export type FormTemplate = 'classic' | 'minimal' | 'editorial' | 'slides';
export type FormFontFamily = 'sans' | 'serif' | 'display' | 'mono';
export type FormTheme = 'light' | 'dark' | 'auto';

// Variant thank-you screen, picked by matching an answer to a chosen field.
export interface FormSuccessVariant {
  id: string;
  label: string;             // operator-facing label, e.g. "Wedding"
  matchValues: string[];     // values of the routing field that activate this variant
  message?: string;
  ctaLabel?: string;
  ctaUrl?: string;
  redirectUrl?: string;
  redirectDelaySeconds?: number;
}

export interface FormBranding {
  logo?: string;
  primaryColor?: string;
  accentColor?: string;
  // Stored on the JSON column so we don't need a DB migration. These are
  // form-presentation settings that travel with the form's visual identity.
  description?: string;       // shown under form name on the public page
  successMessage?: string;    // custom thank-you copy after submit
  template?: FormTemplate;    // visual layout — defaults to 'classic'
  fontFamily?: FormFontFamily;        // body typography — defaults to 'sans'
  headingFontFamily?: FormFontFamily; // heading override; falls back to fontFamily when unset
  theme?: FormTheme;          // 'light' | 'dark' | 'auto' — defaults to 'light'
  coverImage?: string;        // hero image URL shown above form title

  // ── Welcome screen (intro before fields) ──
  welcomeEnabled?: boolean;
  welcomeTitle?: string;
  welcomeSubtitle?: string;
  welcomeCtaLabel?: string;   // e.g. "Get started" — defaults to "Start"

  // ── Post-submission (success screen) ──
  successCtaLabel?: string;            // e.g. "Book a consultation"
  successCtaUrl?: string;              // absolute URL the CTA opens
  successRedirectUrl?: string;         // optional auto-redirect after submit
  successRedirectDelaySeconds?: number; // seconds before redirect (default 5)
  // Routed thank-you screens. When set, the renderer picks the first variant
  // whose matchValues overlap the answer to `successRouteFieldName`. Falls
  // back to the default success screen above when nothing matches.
  successRouteFieldName?: string;
  successVariants?: FormSuccessVariant[];

  // ── Auto-reply to the person who submitted ──
  autoReplyEnabled?: boolean;          // email auto-reply toggle
  autoReplySubject?: string;           // e.g. "We got your inquiry"
  autoReplyBody?: string;              // plain text, supports {{name}} {{businessName}} {{serviceInterest}}
  autoReplyDelayMinutes?: number;      // reserved for scheduled auto-replies; editor currently sends immediately
  autoReplySmsEnabled?: boolean;       // SMS auto-reply toggle (only if phone captured)
  autoReplySmsBody?: string;           // SMS text, same {{vars}}
  autoReplySmsDelayMinutes?: number;   // reserved for scheduled auto-replies; editor currently sends immediately

  // ── Owner notification ──
  notifyOwnerEmail?: boolean;          // also email the workspace owner
}

export interface Form {
  id: string;
  workspaceId: string;
  type: FormType;
  name: string;
  fields: FormFieldConfig[];
  branding: FormBranding;
  slug?: string;
  enabled: boolean;
  autoPromoteToInquiry: boolean;
  createdAt: string;
  updatedAt: string;
}

// ── Form Response ───────────────────────────────────

export interface FormResponse {
  id: string;
  workspaceId: string;
  formId?: string;
  values: Record<string, string>;
  contactName?: string;
  contactEmail?: string;
  contactPhone?: string;
  inquiryId?: string;
  submittedAt: string;
}
