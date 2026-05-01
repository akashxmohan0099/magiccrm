import type { LucideIcon } from "lucide-react";
import { FileText, Heart, Users, Flower2, Camera } from "lucide-react";
import type {
  FormFieldConfig,
  FormBranding,
  FormSuccessVariant,
} from "@/types/models";

// Shared across multiple starters. Same option set as the Wedding starter's
// referralSource so attribution data stays comparable across forms.
const REFERRAL_OPTIONS = [
  "Instagram",
  "Google",
  "Friend or family referral",
  "Vendor referral",
  "Pinterest",
  "TikTok",
  "Other",
];

// "Starter" = an opinionated form preset (fields + copy + routing) the user
// picks from a gallery when creating a new form. Distinct from `FormTemplate`
// in models.ts, which refers to the visual layout style (classic / minimal /
// editorial / slides).
export interface FormStarter {
  id: string;
  name: string;
  description: string;
  category: "bridal" | "beauty" | "event" | "general";
  icon: LucideIcon;
  // Default form name used in the Forms list.
  formName: string;
  // Default URL slug suggestion (user can edit after creation).
  slug: string;
  // Pre-loaded fields.
  fields: FormFieldConfig[];
  // Branding + auto-reply + thank-you defaults. Merged into `Form.branding`
  // on creation. Anything omitted falls back to existing app defaults.
  branding: FormBranding;
  // Whether this starter should auto-flow into Leads. Most do.
  autoPromoteToInquiry: boolean;
}

// ── Wedding Inquiry ──────────────────────────────────────────────────
//
// Anchor template. Field set is calibrated against an audit of 21 Gold
// Coast bridal MUA websites (April 2026):
//   Tier 1 (required, 100%): First name, Last name, Email, Mobile, Message
//   Tier 2 (62–95% of sites): Wedding date, Location, Ready-by time,
//     # needing hair, # needing makeup, Services
//   Tier 3 (10–24%, optional add-ons left on so the operator can prune):
//     Event type, Photographer, Referral source, Inspiration photos
// Deliberately omitted: budget (0/21 — gauche in this vertical),
// full address (audit flag), photography consent (1/21), hair extensions
// (1/21). Routed thank-you on `services` keeps next-step copy relevant
// for trial-included vs. day-of flows.

// Used for both # needing hair and # needing makeup. Dropdowns instead
// of free-number per audit's Hollywood Brides / Beauty Lineup pattern —
// makes pricing directly calculable from the inquiry.
const PEOPLE_COUNT_OPTIONS = [
  "1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "11", "12",
  "More than 12",
];

const WEDDING_SERVICES = [
  "Bridal Makeup",
  "Bridal Hair",
  "Trial",
  "Bridesmaids",
  "Mother of Bride",
  "Flower Girl",
  "Other",
];

const WEDDING_VARIANTS: FormSuccessVariant[] = [
  {
    id: "with-trial",
    label: "Trial included",
    matchValues: ["Trial"],
    message:
      "Thank you — we can't wait to be part of your day. Because you've asked about a trial, we'll suggest a few dates in our reply so you can lock one in alongside the wedding.",
    ctaLabel: "See our portfolio",
  },
  {
    id: "default",
    label: "Wedding day only",
    matchValues: [
      "Bridal Makeup",
      "Bridal Hair",
      "Bridesmaids",
      "Mother of Bride",
      "Flower Girl",
      "Other",
    ],
    message:
      "Thank you — we'll review your details and reply within 24 hours with availability and a tailored quote.",
    ctaLabel: "See our portfolio",
  },
];

const WEDDING_AUTO_REPLY_BODY = `Hi {{name}},

Thanks so much for reaching out to {{businessName}} — your wedding inquiry just landed in our inbox and we're already excited to read through it.

Here's what happens next:
• I personally read every wedding inquiry and will reply within 24 hours
• You'll get a tailored quote based on your party size and the services you mentioned
• If a trial is part of your plan, I'll suggest a few dates we can lock in alongside the day

In the meantime, feel free to send through any extra inspiration on Instagram — we love seeing the full mood you're going for.

Talk soon,
{{businessName}}`;

const WEDDING_AUTO_REPLY_SMS = `Hi {{name}}, thanks for your wedding inquiry with {{businessName}} — I've got your details and will reply with a quote within 24 hours.`;

const weddingFields: FormFieldConfig[] = [
  // Tier 1 — required (100% of audited sites)
  { name: "firstName", type: "text", label: "First name", required: true },
  { name: "lastName", type: "text", label: "Last name", required: true },
  { name: "email", type: "email", label: "Email", required: true },
  { name: "phone", type: "phone", label: "Mobile", required: true },

  // Tier 2 — on by default, optional
  {
    name: "weddingDate",
    type: "date_range",
    label: "Wedding date",
    required: false,
    helpText: "If the date isn't locked yet, give us your window.",
  },
  {
    name: "location",
    type: "text",
    label: "Location / venue / suburb",
    required: false,
    placeholder: "Where you'll be getting ready",
  },
  {
    name: "readyByTime",
    type: "time",
    label: "Time you need to be ready by",
    required: false,
    helpText: "We schedule the morning backwards from this — even a rough guess helps.",
  },
  {
    name: "hairCount",
    type: "select",
    label: "How many people need hair?",
    required: false,
    options: PEOPLE_COUNT_OPTIONS,
  },
  {
    name: "makeupCount",
    type: "select",
    label: "How many people need makeup?",
    required: false,
    options: PEOPLE_COUNT_OPTIONS,
  },
  {
    name: "services",
    type: "multi_select",
    label: "Services required",
    required: true,
    options: WEDDING_SERVICES,
  },
  {
    name: "trialDate",
    type: "date",
    label: "Preferred trial date",
    required: false,
    helpText: "Only if you're considering a trial — we'll suggest dates if you're flexible.",
    showWhen: {
      fieldName: "services",
      operator: "includes",
      values: ["Trial"],
    },
  },
  {
    name: "vision",
    type: "textarea",
    label: "Tell us about your vision",
    required: true,
    placeholder:
      "Share your dream look, colour palette, the overall mood, anything that helps us picture your day…",
  },

  // Tier 3 — opinionated add-ons. On by default per the user's "easier
  // to remove than to remember to add" principle, but every one is
  // optional so the bride doesn't have to fill them in.
  {
    name: "eventType",
    type: "select",
    label: "Event type",
    required: false,
    options: [
      "Wedding",
      "Elopement",
      "Micro-wedding",
      "Vow renewal",
      "Engagement shoot",
    ],
  },
  {
    name: "photographer",
    type: "text",
    label: "Photographer (if booked)",
    required: false,
    placeholder: "We love coordinating timing with your photographer.",
  },
  {
    name: "referralSource",
    type: "select",
    label: "How did you hear about us?",
    required: false,
    options: [
      "Instagram",
      "Google",
      "Friend or family referral",
      "Vendor referral",
      "Pinterest",
      "TikTok",
      "Other",
    ],
  },
  {
    name: "inspirationPhotos",
    type: "file",
    label: "Inspiration photos",
    required: false,
    acceptedFileTypes: "image/*",
    multipleFiles: true,
    maxFileSizeMb: 10,
    helpText: "Optional — drop any references that capture the vibe.",
  },
];

const weddingStarter: FormStarter = {
  id: "wedding-inquiry",
  name: "Wedding inquiry",
  description: "For bridal hair & makeup pros.",
  category: "bridal",
  icon: Heart,
  formName: "Wedding inquiry",
  slug: "wedding",
  fields: weddingFields,
  autoPromoteToInquiry: true,
  branding: {
    description:
      "Tell us about your day — we'll reply within 24 hours with availability and a tailored quote.",
    template: "editorial",
    fontFamily: "serif",
    autoReplyEnabled: true,
    autoReplySubject:
      "We've got your wedding inquiry — {{businessName}}",
    autoReplyBody: WEDDING_AUTO_REPLY_BODY,
    autoReplySmsEnabled: false,
    autoReplySmsBody: WEDDING_AUTO_REPLY_SMS,
    notifyOwnerEmail: true,
    successMessage:
      "Thank you — we've got your details and will be in touch within 24 hours.",
    successCtaLabel: "See our portfolio",
    successRouteFieldName: "services",
    successVariants: WEDDING_VARIANTS,
  },
};

// ── General Inquiry ─────────────────────────────────────────────────
//
// Universal 4-field base. Calibrated against the cross-vertical audit
// (53 sites across hair / barber / nail / beauty-spa) which showed
// Phone is in 77–95% of forms across every category — making the true
// universal base 4 fields, not 3. Replaces the earlier "Blank" starter.
// Top of the gallery: this is the right answer for anyone who isn't
// in the bridal / group / medi-spa lanes covered by the other three.

const generalInquiryStarter: FormStarter = {
  id: "general-inquiry",
  name: "General inquiry",
  description: "Name, email, mobile, message — the universal starting point.",
  category: "general",
  icon: FileText,
  formName: "General inquiry",
  // Slug intentionally blank so the operator picks /contact, /inquiry,
  // /get-in-touch, etc. — there's no obvious default for a generic form.
  slug: "",
  autoPromoteToInquiry: false,
  fields: [
    { name: "name", type: "text", label: "Name", required: true },
    { name: "email", type: "email", label: "Email", required: true },
    { name: "phone", type: "phone", label: "Mobile", required: true },
    { name: "message", type: "textarea", label: "Message", required: true },
  ],
  // No branding overrides — falls back to app defaults including the
  // generic DEFAULT_AUTO_REPLY_BODY in src/lib/integrations/email.ts.
  branding: {},
};

// ── Group / Package Booking ─────────────────────────────────────────
//
// Audit grounding: Stephanies Wellness Spa, RejoovMe Skin Clinic, Epic
// Hair Designs. Common pattern: base + date + # of people + services /
// package + location. Covers spa packages, group hair, group lash sets,
// hair-only weddings, group beauty events. No routed thank-you (too
// many possible Occasion values to make routing useful).

const groupPackageFields: FormFieldConfig[] = [
  // Base — required across every audited form
  { name: "name", type: "text", label: "Name", required: true },
  { name: "email", type: "email", label: "Email", required: true },
  { name: "phone", type: "phone", label: "Mobile", required: true },

  // Tier 2 — on by default, optional
  {
    name: "occasion",
    type: "text",
    label: "Occasion",
    required: false,
    placeholder: "Birthday, hen's party, corporate event…",
  },
  {
    name: "preferredDate",
    type: "date",
    label: "Preferred date",
    required: false,
  },
  {
    name: "groupSize",
    type: "select",
    label: "Number of people",
    required: false,
    options: PEOPLE_COUNT_OPTIONS,
  },
  {
    name: "services",
    type: "multi_select",
    label: "Services / packages",
    required: false,
    options: [
      "Hair styling",
      "Makeup",
      "Skin treatment",
      "Lashes & brows",
      "Massage",
      "Manicure / pedicure",
      "Other",
    ],
    helpText: "Edit these to match the packages you actually offer.",
  },
  {
    name: "location",
    type: "text",
    label: "Location / venue",
    required: false,
    helpText: "Where the booking will take place.",
  },
  {
    name: "timeOfDay",
    type: "time",
    label: "Time of day",
    required: false,
  },

  // Tier 3 — on but easy to remove
  {
    name: "referralSource",
    type: "select",
    label: "How did you hear about us?",
    required: false,
    options: REFERRAL_OPTIONS,
  },
  {
    name: "existingClient",
    type: "select",
    label: "Are you an existing client?",
    required: false,
    options: ["Yes", "No"],
  },
  {
    name: "message",
    type: "textarea",
    label: "Tell us about your event",
    required: true,
    placeholder:
      "Vibe, must-haves, anything we should know to put the right package together…",
  },
];

const GROUP_AUTO_REPLY_BODY = `Hi {{name}},

Thanks for reaching out to {{businessName}} — your group booking inquiry just landed in our inbox and we're excited to help put together something that feels right for the occasion.

Here's what happens next:
• I personally read every group inquiry and will reply within 24 hours
• You'll get a tailored quote based on your group size and the services you've selected
• If we need to go back and forth on package details, we'll handle it over email or a quick call

If you're working to a tight timeline, just reply to this email and let us know — we'll prioritise.

Talk soon,
{{businessName}}`;

const GROUP_AUTO_REPLY_SMS = `Hi {{name}}, thanks for your group booking inquiry with {{businessName}} — we'll reply with a tailored quote within 24 hours.`;

const groupPackageStarter: FormStarter = {
  id: "group-package-booking",
  name: "Group / package booking",
  description: "Hen's parties, group spa days, corporate events.",
  category: "event",
  icon: Users,
  formName: "Group booking inquiry",
  slug: "group",
  autoPromoteToInquiry: true,
  fields: groupPackageFields,
  branding: {
    description:
      "Tell us about your group — we'll reply within 24 hours with a tailored package quote.",
    template: "editorial",
    fontFamily: "sans",
    autoReplyEnabled: true,
    autoReplySubject:
      "We've got your group booking inquiry — {{businessName}}",
    autoReplyBody: GROUP_AUTO_REPLY_BODY,
    autoReplySmsEnabled: false,
    autoReplySmsBody: GROUP_AUTO_REPLY_SMS,
    notifyOwnerEmail: true,
    successMessage:
      "Thank you — we've got your details and will be in touch within 24 hours with a tailored quote.",
    successCtaLabel: "See our work",
  },
};

// ── Beauty / Medi-spa Consult ───────────────────────────────────────
//
// Audit grounding: Skin to Soul, RejoovMe, Forel Day Spa, Soul Good
// Beauty, Stephanies. Common pattern: base + treatment + date + clinic
// location + how-heard, with allergies/health surfacing on medi-spa
// specifically. Covers facials, skin treatments, lash, brow, PMU,
// wellness consults. First/Last split — medi-spa is enough like bridal
// that the name split fits.

const beautyConsultFields: FormFieldConfig[] = [
  { name: "firstName", type: "text", label: "First name", required: true },
  { name: "lastName", type: "text", label: "Last name", required: true },
  { name: "email", type: "email", label: "Email", required: true },
  { name: "phone", type: "phone", label: "Mobile", required: true },

  {
    name: "treatment",
    type: "select",
    label: "Treatment of interest",
    required: false,
    options: [
      "Facial",
      "Skin treatment",
      "Laser",
      "Injectables",
      "Lash extensions",
      "Brow shaping",
      "Permanent makeup",
      "Body treatment",
      "Massage",
      "Wellness",
      "Other",
    ],
  },
  {
    name: "preferredDate",
    type: "date",
    label: "Preferred date",
    required: false,
  },
  {
    name: "clinicLocation",
    type: "text",
    label: "Clinic location",
    required: false,
    helpText: "If we have multiple locations, which one suits you best?",
  },
  {
    name: "allergies",
    type: "textarea",
    label: "Allergies or sensitivities",
    required: false,
    helpText: "Anything we should know before your visit — skin reactions, current medications, recent treatments.",
  },
  {
    name: "referencePhotos",
    type: "file",
    label: "Reference photos",
    required: false,
    acceptedFileTypes: "image/*",
    multipleFiles: true,
    maxFileSizeMb: 10,
    helpText: "Optional — share a look or result you'd love to achieve.",
  },

  // Tier 3
  {
    name: "referralSource",
    type: "select",
    label: "How did you hear about us?",
    required: false,
    options: REFERRAL_OPTIONS,
  },
  {
    name: "existingClient",
    type: "select",
    label: "Are you an existing client?",
    required: false,
    options: ["Yes", "No"],
  },
  {
    name: "goals",
    type: "textarea",
    label: "What's bringing you in?",
    required: true,
    placeholder:
      "Goals, concerns, what you'd love to walk out with — the more we know, the better we can plan.",
  },
];

const BEAUTY_AUTO_REPLY_BODY = `Hi {{name}},

Thanks for reaching out to {{businessName}} — we've got your consultation request and we're glad you're considering us for your treatment.

Here's what happens next:
• I personally review every consultation request and will reply within 24 hours
• You'll get a brief intake call to discuss your goals, current routine, and any health considerations
• From there we'll put together a treatment plan tailored to you — no pressure, just clear options

If anything urgent comes up before then, feel free to reply to this email and we'll get back to you sooner.

Warmly,
{{businessName}}`;

const BEAUTY_AUTO_REPLY_SMS = `Hi {{name}}, thanks for your consultation inquiry with {{businessName}} — we'll be in touch within 24 hours to set up a quick chat about your goals.`;

const beautyConsultStarter: FormStarter = {
  id: "beauty-medispa-consult",
  name: "Beauty / medi-spa consult",
  description: "Facial, skin, lash, brow, PMU, and wellness consults.",
  category: "beauty",
  icon: Flower2,
  formName: "Consultation inquiry",
  slug: "consult",
  autoPromoteToInquiry: true,
  fields: beautyConsultFields,
  branding: {
    description:
      "Tell us a bit about your goals — we'll reply within 24 hours to set up a consultation.",
    template: "editorial",
    fontFamily: "serif",
    autoReplyEnabled: true,
    autoReplySubject:
      "We've got your consultation request — {{businessName}}",
    autoReplyBody: BEAUTY_AUTO_REPLY_BODY,
    autoReplySmsEnabled: false,
    autoReplySmsBody: BEAUTY_AUTO_REPLY_SMS,
    notifyOwnerEmail: true,
    successMessage:
      "Thank you — we've received your consultation request and will be in touch within 24 hours.",
    successCtaLabel: "See our treatments",
  },
};

// ── Model Casting ──────────────────────────────────────────────────
//
// For studios, photographers, and agencies running open casting calls.
// Required base = identity + contact + age (compliance gate). Rest are
// optional — Instagram, location, physical specs, experience, headshots,
// shoot comfort, availability, and anything-else free-text.

const modelCastingFields: FormFieldConfig[] = [
  { name: "name", type: "text", label: "Full name", required: true },
  { name: "email", type: "email", label: "Email", required: true },
  { name: "phone", type: "phone", label: "Mobile", required: true },
  {
    name: "age",
    type: "number",
    label: "Age",
    required: true,
    helpText: "Must be 18+",
    min: 18,
  },

  {
    name: "instagram",
    type: "text",
    label: "Instagram handle",
    required: false,
    placeholder: "@yourhandle",
  },
  {
    name: "location",
    type: "text",
    label: "Suburb / city",
    required: false,
  },
  {
    name: "height",
    type: "text",
    label: "Height (cm)",
    required: false,
  },
  {
    name: "hairColour",
    type: "select",
    label: "Hair colour",
    required: false,
    options: ["Blonde", "Brunette", "Black", "Red", "Grey", "Other"],
  },
  {
    name: "experience",
    type: "select",
    label: "Experience",
    required: false,
    options: ["None", "Some", "Agency-signed", "Professional freelance"],
  },
  {
    name: "photos",
    type: "file",
    label: "Headshot + full-body shot",
    required: false,
    acceptedFileTypes: "image/*",
    multipleFiles: true,
    maxFileSizeMb: 10,
  },
  {
    name: "comfortableShooting",
    type: "multi_select",
    label: "Comfortable shooting",
    required: false,
    options: [
      "Beauty",
      "Editorial",
      "Fashion",
      "Bridal",
      "Swimwear",
      "Lingerie",
      "Boudoir",
    ],
  },
  {
    name: "availability",
    type: "text",
    label: "Availability",
    required: false,
    helpText: "Days, weeks, or 'flexible'",
  },
  {
    name: "notes",
    type: "textarea",
    label: "Anything else",
    required: false,
  },
];

const modelCastingStarter: FormStarter = {
  id: "model-casting",
  name: "Model casting",
  description: "Open casting call — talent, sizing, availability, references.",
  category: "event",
  icon: Camera,
  formName: "Model casting",
  slug: "casting",
  autoPromoteToInquiry: true,
  fields: modelCastingFields,
  branding: {
    description:
      "Tell us a bit about you and share a couple of recent shots — we'll be in touch if there's a fit.",
    template: "editorial",
    fontFamily: "sans",
    notifyOwnerEmail: true,
    successMessage:
      "Thanks — we've got your application. We'll reach out if you're a fit for an upcoming shoot.",
  },
};

// Export order = display order in the gallery. General leads as the
// universal base; Wedding next as the bridal anchor; then the
// vertical-specific starters.
export const FORM_STARTERS: FormStarter[] = [
  generalInquiryStarter,
  weddingStarter,
  groupPackageStarter,
  beautyConsultStarter,
  modelCastingStarter,
];

export function getStarter(id: string): FormStarter | undefined {
  return FORM_STARTERS.find((s) => s.id === id);
}

// Per-category accent so each gallery card gets a distinct visual cue.
// Mirrors the landing page's addon-card pattern: hex drives the inline
// gradient + icon tint; hoverBorder is the Tailwind class applied on hover.
export const STARTER_CATEGORY_STYLE: Record<
  FormStarter["category"],
  { hex: string; hoverBorder: string }
> = {
  bridal: { hex: "#EC4899", hoverBorder: "hover:border-pink-200" },
  beauty: { hex: "#8B5CF6", hoverBorder: "hover:border-violet-200" },
  event: { hex: "#F59E0B", hoverBorder: "hover:border-amber-200" },
  general: { hex: "#64748B", hoverBorder: "hover:border-slate-200" },
};

