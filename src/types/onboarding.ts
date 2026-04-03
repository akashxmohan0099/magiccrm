export interface BusinessContext {
  businessName: string;
  businessDescription: string;
  industry: string;
  industryOther: string;
  location: string;
}

export interface NeedsAssessment {
  // Always-on (clients, leads, messaging, billing) — no question needed
  manageCustomers: boolean;
  receiveInquiries: boolean;
  communicateClients: boolean;
  sendInvoices: boolean;
  // Question-gated modules
  acceptBookings: boolean;
  manageProjects: boolean;
  runMarketing: boolean;
  // Removed from core — now add-ons (kept for backward compat)
  handleSupport: boolean;
  manageDocuments: boolean;
}

export type TeamSize = "" | "Just me" | "2-5" | "6-15" | "16+";

// ── Industry definitions with smart defaults and tailored copy ──

export interface IndustryConfig {
  id: string;
  label: string;
  emoji: string;
  description: string;
  // Which needs are typically YES for this industry
  smartDefaults: Partial<Record<keyof NeedsAssessment, boolean>>;
  // Tailored question labels per industry
  questionOverrides?: Partial<Record<keyof NeedsAssessment, { label: string; subtitle: string }>>;
  // Suggested team size
  suggestedTeamSize?: TeamSize;
  // Example business description placeholder
  descriptionPlaceholder: string;
  // Example business names
  namePlaceholder: string;
  // Persona categories for the two-step picker
  categories?: PersonaCategory[];
  // Role-specific personas within this industry
  personas?: PersonaConfig[];
}

export interface PersonaCategory {
  id: string;
  label: string;
  icon: string; // lucide icon name
  personaIds: string[];
}

export interface PersonaConfig {
  id: string;
  label: string;
  description: string;
  category: string; // matches PersonaCategory.id
  // Only specify differences from industry defaults
  smartDefaultOverrides?: Partial<Record<keyof NeedsAssessment, boolean>>;
  questionOverrides?: Partial<Record<keyof NeedsAssessment, { label: string; subtitle: string }>>;
  suggestedTeamSize?: TeamSize;
  descriptionPlaceholder?: string;
  namePlaceholder?: string;
}

export const INDUSTRY_CONFIGS: IndustryConfig[] = [
  {
    id: "beauty-wellness",
    label: "Beauty & Wellness",
    emoji: "\u2728",
    description: "Salons, spas, makeup artists, lash techs, barbers",
    smartDefaults: {
      manageCustomers: true,
      acceptBookings: true,
      sendInvoices: true,
      communicateClients: true,
      runMarketing: true,
      receiveInquiries: true,
      handleSupport: false,
      manageProjects: false,
      manageDocuments: false,
    },
    questionOverrides: {
      manageCustomers: { label: "Do you keep client profiles with service history?", subtitle: "Track preferences, allergies, past treatments, and visit history." },
      acceptBookings: { label: "Do clients book appointments with you?", subtitle: "Online booking links, availability, and automated reminders." },
      sendInvoices: { label: "Do you charge per service or send invoices?", subtitle: "Per-visit payments, package deals, or invoiced corporate clients." },
      communicateClients: { label: "Do you message clients about bookings or promotions?", subtitle: "Appointment confirmations, rescheduling, and special offers via SMS or DM." },
      runMarketing: { label: "Do you promote your services on social media?", subtitle: "Before/after posts, seasonal promos, and review requests." },
      receiveInquiries: { label: "Do new clients reach out through DMs or your website?", subtitle: "Capture inquiries from Instagram, Facebook, Google, and your website." },
    },
    descriptionPlaceholder: "e.g. Mobile lash technician in Brisbane",
    namePlaceholder: "e.g. Glow Studio",
    suggestedTeamSize: "Just me",
    categories: [
      { id: "hair", label: "Hair Salon", icon: "Scissors", personaIds: ["hair-salon"] },
      { id: "barber", label: "Barber", icon: "Blade", personaIds: ["barber"] },
      { id: "nails", label: "Nails", icon: "Paintbrush", personaIds: ["nail-tech"] },
      { id: "lashes-brows", label: "Lashes & Brows", icon: "Eye", personaIds: ["lash-brow-tech"] },
      { id: "cosmetic-tattoo", label: "Cosmetic Tattoo", icon: "PenTool", personaIds: ["cosmetic-tattoo"] },
      { id: "skin-clinic", label: "Skin Clinic", icon: "Sparkles", personaIds: ["esthetician"] },
      { id: "spa-massage", label: "Spa & Massage", icon: "Flower2", personaIds: ["spa-massage"] },
      { id: "makeup", label: "Makeup", icon: "Palette", personaIds: ["makeup-artist"] },
      { id: "multi-service", label: "Multi-Service", icon: "Building2", personaIds: ["beauty-salon"] },
    ],
    personas: [
      // ── Hair Salon ──
      {
        id: "hair-salon",
        label: "Hairstylist",
        description: "Cuts, colour, styling, treatments",
        category: "hair",
        suggestedTeamSize: "2-5",
        descriptionPlaceholder: "e.g. I run a 3-chair salon in Surry Hills. We do cuts, colour, and styling. Most clients rebook every 6 weeks.",
      },
      // ── Barber ──
      {
        id: "barber",
        label: "Barber",
        description: "Men's cuts, fades, beard grooming",
        category: "barber",
        suggestedTeamSize: "2-5",
        descriptionPlaceholder: "e.g. I run a barbershop with 2 other barbers. Walk-ins and appointments. Fades, cuts, and beard trims.",
        namePlaceholder: "e.g. The Sharp Edge",
      },
      // ── Nails ──
      {
        id: "nail-tech",
        label: "Nail Tech",
        description: "Gel, acrylic, SNS, nail art",
        category: "nails",
        descriptionPlaceholder: "e.g. Solo nail tech working from my home studio. I do gel, acrylic, and nail art. Clients book via Instagram.",
        namePlaceholder: "e.g. Polished by Sarah",
      },
      // ── Lashes & Brows ──
      {
        id: "lash-brow-tech",
        label: "Lash & Brow Tech",
        description: "Extensions, lifts, lamination, tinting",
        category: "lashes-brows",
        descriptionPlaceholder: "e.g. I do lash extensions and brow lamination from a home studio. Most clients come every 2\u20133 weeks for fills.",
        namePlaceholder: "e.g. Lash Lab Co",
      },
      // ── Cosmetic Tattoo ──
      {
        id: "cosmetic-tattoo",
        label: "Cosmetic Tattoo Artist",
        description: "Microblading, lip blush, eyeliner, scalp micropigmentation",
        category: "cosmetic-tattoo",
        descriptionPlaceholder: "e.g. I specialise in microblading and lip blush. Clients need a consult first, then a session, then a touch-up 6 weeks later.",
        namePlaceholder: "e.g. Ink & Brow Studio",
      },
      // ── Skin Clinic ──
      {
        id: "esthetician",
        label: "Skin Therapist / Aesthetician",
        description: "Facials, peels, skin treatments, injectables",
        category: "skin-clinic",
        descriptionPlaceholder: "e.g. I run a skin clinic doing facials, chemical peels, and LED therapy. Clients are on treatment plans over 3\u20136 months.",
        namePlaceholder: "e.g. Skin by Sarah",
      },
      // ── Spa & Massage ──
      {
        id: "spa-massage",
        label: "Spa / Massage Therapist",
        description: "Remedial, relaxation, deep tissue, day spa packages",
        category: "spa-massage",
        suggestedTeamSize: "2-5",
        descriptionPlaceholder: "e.g. I own a day spa with 3 massage therapists. We offer relaxation, remedial, and hot stone. Gift vouchers are big for us.",
        namePlaceholder: "e.g. Serenity Day Spa",
      },
      // ── Makeup ──
      {
        id: "makeup-artist",
        label: "Makeup Artist",
        description: "Bridal, events, editorial, lessons",
        category: "makeup",
        descriptionPlaceholder: "e.g. I\u2019m a freelance MUA specialising in weddings. I do trials, then the wedding day. Most bookings come through referrals.",
      },
      // ── Multi-Service ──
      {
        id: "beauty-salon",
        label: "Beauty Salon / Studio",
        description: "Hair, nails, skin, and more under one roof",
        category: "multi-service",
        suggestedTeamSize: "2-5",
        descriptionPlaceholder: "e.g. We\u2019re a full-service beauty studio \u2014 hair, nails, lashes, and facials. 5 staff, mix of bookings and walk-ins.",
        namePlaceholder: "e.g. Glow Beauty Studio",
      },
    ],
  },
];

// Legacy compat - flat industry list
export const INDUSTRIES = INDUSTRY_CONFIGS.map((c) => c.label);

export const NEEDS_QUESTIONS: { key: keyof NeedsAssessment; label: string }[] = [
  { key: "manageCustomers", label: "Do you keep track of clients or customers?" },
  { key: "receiveInquiries", label: "Do you get inquiries or leads from new customers?" },
  { key: "communicateClients", label: "Do you communicate with clients through email, SMS, or social media?" },
  { key: "acceptBookings", label: "Do you take bookings or appointments?" },
  { key: "sendInvoices", label: "Do you send quotes or invoices?" },
  { key: "manageProjects", label: "Do you work on jobs or projects for clients?" },
  { key: "runMarketing", label: "Do you promote your business or run marketing?" },
  { key: "handleSupport", label: "Do you handle support requests or follow-ups after the job?" },
  { key: "manageDocuments", label: "Do you deal with contracts, agreements, or shared documents?" },
];

export const TEAM_SIZE_OPTIONS: Exclude<TeamSize, "">[] = [
  "Just me",
  "2-5",
  "6-15",
  "16+",
];

export interface FeatureDetail {
  id: string;
  label: string;
  description: string;
  selected: boolean;
}

export interface FeatureCategory {
  id: keyof NeedsAssessment;
  name: string;
  icon: string;
  description: string;
  features: FeatureDetail[];
}

export interface OnboardingState {
  step: number;
  businessContext: BusinessContext;
  needs: NeedsAssessment;
  teamSize: TeamSize;
  featureSelections: Record<string, FeatureDetail[]>;
  isBuilding: boolean;
  buildComplete: boolean;
}

export const FEATURE_CATEGORIES: FeatureCategory[] = [
  {
    id: "manageCustomers",
    name: "Client Database",
    icon: "Users",
    description: "Your clients, all in one place.",
    features: [
      { id: "client-tags", label: "Tags & Categories", description: "Group clients by tags or categories", selected: false },
      { id: "segmentation-filters", label: "Segmentation Filters", description: "Filter by status, location, or type", selected: false },
      { id: "follow-up-reminders", label: "Follow-Up Reminders", description: "Automatic follow-up reminders", selected: true },
      { id: "birthday-reminders", label: "Birthday Reminders", description: "Get reminded on client milestones", selected: false },
      { id: "import-export", label: "Import / Export", description: "Bulk import or export your client list", selected: true },
      { id: "merge-duplicates", label: "Merge Duplicates", description: "Detect and merge duplicate records", selected: false },
      { id: "activity-timeline", label: "Activity Timeline", description: "Every interaction in one view", selected: true },
      { id: "auto-inactive-flag", label: "Auto-Inactive Flag", description: "Flag clients after X days of no activity", selected: false },
      { id: "custom-fields-builder", label: "Custom Fields", description: "Add your own fields to profiles", selected: false },
      { id: "client-notes", label: "Internal Notes", description: "Private notes visible only to your team", selected: true },
      { id: "client-lifecycle-stages", label: "Lifecycle Stages", description: "Assign clients to stages like Active, VIP, Churned with auto-transitions", selected: false },
      { id: "client-referral-tracking", label: "Referral Tracking", description: "Record which client referred whom and count referrals", selected: false },
      { id: "client-credit-balance", label: "Client Credits", description: "Maintain a running credit balance for prepayments and overpayments", selected: false },
      { id: "bulk-actions", label: "Bulk Actions", description: "Select multiple clients to bulk-tag, archive, or assign at once", selected: false },
      { id: "client-source-tracking", label: "Acquisition Source", description: "Record how each client was acquired — referral, walk-in, web, social", selected: false },
    ],
  },
  {
    id: "receiveInquiries",
    name: "Leads & Pipeline",
    icon: "Inbox",
    description: "Never lose track of a potential customer.",
    features: [
      { id: "web-forms", label: "Web Capture Forms", description: "Inquiry form for your website or socials", selected: true },
      { id: "lead-follow-up-reminders", label: "Follow-Up Reminders", description: "So no lead goes cold", selected: true },
      { id: "auto-assign-leads", label: "Auto-Assign Leads", description: "Route inquiries to team members", selected: false },
      { id: "lead-scoring", label: "Lead Scoring", description: "Auto-prioritise as hot, warm, or cold", selected: false },
      { id: "lead-source-tracking", label: "Source Tracking", description: "Track where each lead came from", selected: false },
      { id: "auto-response", label: "Instant Auto-Response", description: "Auto-reply to new inquiries", selected: false },
      { id: "auto-tag-from-form", label: "Auto-Tag from Form", description: "Automatically tag leads based on their form answers", selected: false },
      { id: "lead-to-client", label: "Lead → Client Conversion", description: "One-click convert a lead to a full client record with history", selected: true },
      { id: "lead-lost-reason", label: "Lost Reason Capture", description: "Prompt for a reason when marking a lead as lost", selected: false },
      { id: "lead-notes-log", label: "Notes & Activity Log", description: "Internal notes and chronological activity history per lead", selected: true },
      { id: "duplicate-lead-detection", label: "Duplicate Detection", description: "Flag when a new submission matches an existing lead or client", selected: false },
      { id: "custom-pipeline-stages", label: "Custom Pipeline Stages", description: "Rename, add, reorder, or colour-code your pipeline stages", selected: false },
    ],
  },
  {
    id: "communicateClients",
    name: "Communication",
    icon: "MessageCircle",
    description: "Every conversation, one inbox.",
    features: [
      { id: "email", label: "Email", description: "Send and receive email", selected: true },
      { id: "sms", label: "SMS", description: "Text messaging", selected: false },
      { id: "instagram-dms", label: "Instagram DMs", description: "Direct messages", selected: false },
      { id: "facebook-messenger", label: "Facebook Messenger", description: "Messenger conversations", selected: false },
      { id: "whatsapp", label: "WhatsApp", description: "WhatsApp messaging", selected: false },
      { id: "linkedin", label: "LinkedIn Messaging", description: "LinkedIn conversations", selected: false },
      { id: "canned-responses", label: "Canned Responses", description: "Pre-written reply templates", selected: false },
      { id: "scheduled-send", label: "Scheduled Send", description: "Write now, deliver later", selected: false },
      { id: "after-hours-reply", label: "After-Hours Auto-Reply", description: "Auto-respond outside business hours", selected: false },
      { id: "contact-timeline", label: "Contact Timeline", description: "All messages across channels in one thread", selected: true },
      { id: "template-variables", label: "Template Variables", description: "Use {name}, {date}, {service} in templates", selected: false },
      { id: "unread-notifications", label: "Unread Alerts", description: "Alerts when messages sit unread too long", selected: false },
      { id: "bulk-messaging", label: "Bulk Messaging", description: "Send a templated message to a filtered group of clients at once", selected: false },
      { id: "conversation-assignment", label: "Conversation Assignment", description: "Assign a conversation to a specific team member to own", selected: false },
    ],
  },
  {
    id: "acceptBookings",
    name: "Bookings & Calendar",
    icon: "Calendar",
    description: "Let customers book you without the back and forth.",
    features: [
      { id: "booking-page", label: "Online Booking Page", description: "Shareable booking link", selected: true },
      { id: "booking-reminders", label: "Automated Reminders", description: "Email or SMS before appointments", selected: true },
      { id: "recurring-bookings", label: "Recurring Appointments", description: "Repeat bookings on a schedule", selected: false },
      { id: "team-calendar", label: "Team Calendar View", description: "See all team members' schedules", selected: false },
      { id: "google-cal", label: "Google Calendar Sync", description: "Two-way sync", selected: false },
      { id: "outlook-cal", label: "Outlook Calendar Sync", description: "Two-way sync", selected: false },
      { id: "waitlist", label: "Waitlist", description: "Clients queue for full slots", selected: false },
      { id: "booking-deposits", label: "Booking Deposits", description: "Require a deposit to reduce no-shows", selected: false },
      { id: "buffer-time", label: "Buffer Time", description: "Padding between appointments", selected: false },
      { id: "no-show-fees", label: "No-Show Protection", description: "Flag or charge repeat no-showers", selected: false },
      { id: "cancellation-policy", label: "Cancellation Policy", description: "Enforce a cancellation window", selected: false },
      { id: "pre-booking-form", label: "Pre-Booking Questionnaire", description: "Clients fill out a form before their visit", selected: false },
      { id: "post-appointment-followup", label: "Post-Appointment Follow-Up", description: "Auto-send thank you or feedback request", selected: false },
      { id: "multi-service-booking", label: "Multi-Service Booking", description: "Client books multiple services in a single appointment", selected: false },
      { id: "group-class-booking", label: "Group / Class Booking", description: "Book multiple clients into a single time slot for classes or workshops", selected: false },
      { id: "resource-room-assignment", label: "Room / Resource Assignment", description: "Assign bookings to specific rooms, chairs, or equipment", selected: false },
      { id: "block-time-off", label: "Block Time Off", description: "Block holidays, personal time, or breaks on the calendar", selected: true },
      { id: "booking-confirmation-flow", label: "Booking Confirmation", description: "New bookings land as pending until manually or auto-confirmed", selected: false },
      { id: "travel-time", label: "Travel Time", description: "Calculate and block travel time for on-site jobs", selected: false },
    ],
  },
  {
    id: "sendInvoices",
    name: "Quotes & Invoicing",
    icon: "Receipt",
    description: "Quote the job, send the invoice, get paid.",
    features: [
      { id: "quote-builder", label: "Quote Builder", description: "Quotes that convert to invoices", selected: true },
      { id: "invoice-templates", label: "Invoice Templates", description: "Reusable templates", selected: true },
      { id: "recurring-invoices", label: "Recurring Invoices", description: "Auto-generate on a schedule", selected: false },
      { id: "late-reminders", label: "Late Payment Reminders", description: "Nudges for overdue invoices", selected: true },
      { id: "tipping", label: "Tipping", description: "Clients add a tip when paying online", selected: false },
      { id: "partial-payments", label: "Partial Payments", description: "Accept deposits or split payments", selected: false },
      { id: "auto-tax", label: "Auto Tax Calculation", description: "Auto-calculate GST or VAT", selected: false },
      { id: "quote-to-invoice", label: "Quote → Invoice", description: "Convert accepted quotes in one click", selected: true },
      { id: "payment-links", label: "Payment Links", description: "Shareable link for online payment", selected: false },
      { id: "overdue-escalation", label: "Overdue Escalation", description: "Auto-escalate: reminder → warning → final notice", selected: false },
      { id: "line-item-discounts", label: "Line Item Discounts", description: "Apply percentage or fixed discounts to individual line items", selected: false },
      { id: "invoice-numbering", label: "Custom Invoice Numbers", description: "Customise invoice number format and starting number", selected: false },
      { id: "credit-notes", label: "Credit Notes", description: "Issue credit notes for returns, errors, or goodwill adjustments", selected: false },
      { id: "quote-expiry", label: "Quote Expiry Date", description: "Quotes auto-expire if not accepted by the deadline", selected: false },
      { id: "invoice-status-workflow", label: "Invoice Status Workflow", description: "Track Draft → Sent → Viewed → Paid → Overdue automatically", selected: true },
      { id: "client-invoice-portal", label: "Client Invoice Page", description: "Clients view, approve, and download invoices from a branded page", selected: false },
      { id: "travel-costs", label: "Travel Costs", description: "Calculate travel distance and cost, add to quote", selected: false },
    ],
  },
  {
    id: "manageProjects",
    name: "Jobs & Projects",
    icon: "FolderKanban",
    description: "Track every job from start to finish.",
    features: [
      { id: "file-attachments", label: "File Attachments", description: "Attach files per job", selected: true },
      { id: "task-delegation", label: "Task Delegation", description: "Assign to team members", selected: false },
      { id: "time-tracking", label: "Time Tracking", description: "Log hours on tasks", selected: false },
      { id: "expense-tracking", label: "Expense Tracking", description: "Log costs to see true job profit", selected: false },
      { id: "recurring-jobs", label: "Recurring Jobs", description: "Auto-create repeat jobs on a schedule", selected: false },
      { id: "job-templates", label: "Job Templates", description: "Reusable templates for common jobs", selected: false },
      { id: "client-approval", label: "Client Approval", description: "Send scope for sign-off before starting", selected: false },
      { id: "progress-updates", label: "Progress Notifications", description: "Auto-notify client when job moves stage", selected: false },
      { id: "job-kanban", label: "Job Kanban Board", description: "Drag-and-drop board view of jobs across workflow stages", selected: true },
      { id: "job-priority", label: "Job Prioritisation", description: "Mark jobs as Low, Medium, High, or Urgent with visual indicators", selected: false },
      { id: "profitability-summary", label: "Profitability Summary", description: "Auto-calculate profit per job from revenue minus time and expenses", selected: false },
      { id: "custom-job-stages", label: "Custom Job Stages", description: "Rename, add, reorder, or colour-code your workflow stages", selected: false },
      { id: "job-to-invoice", label: "Job → Invoice", description: "Generate an invoice from a completed job with tracked hours and expenses pre-filled", selected: true },
    ],
  },
  {
    id: "runMarketing",
    name: "Marketing",
    icon: "Megaphone",
    description: "Get the word out and bring them back.",
    features: [
      { id: "audience-segmentation", label: "Audience Segmentation", description: "Target specific groups", selected: false },
      { id: "coupon-codes", label: "Coupon & Discount Codes", description: "Promotional offers", selected: false },
      { id: "email-sequences", label: "Email Sequences", description: "Multi-step drip campaigns", selected: false },
      { id: "campaign-analytics", label: "Campaign Performance", description: "Track opens, clicks, conversions", selected: false },
      { id: "unsubscribe-management", label: "Unsubscribe Management", description: "Handle opt-outs automatically", selected: true },
      { id: "send-time-optimization", label: "Smart Send Time", description: "Auto-pick best send time per client", selected: false },
      { id: "ab-subject-lines", label: "A/B Subject Lines", description: "Test two subject lines on a small group, auto-send the winner", selected: false },
      { id: "referral-program", label: "Referral Program", description: "Clients share a link — when someone books, both get a reward", selected: false },
      { id: "bounce-tracking", label: "Bounce & Complaint Tracking", description: "Track bounces and spam complaints to auto-suppress bad addresses", selected: false },
    ],
  },
  {
    id: "handleSupport",
    name: "Support",
    icon: "Headphones",
    description: "Keep clients happy after the job's done.",
    features: [
      { id: "auto-responses", label: "Auto-Responses", description: "Instant replies to common questions", selected: true },
      { id: "assign-requests", label: "Assign Requests", description: "Route to team members", selected: false },
      { id: "satisfaction-ratings", label: "Satisfaction Ratings", description: "Client satisfaction scores", selected: false },
      { id: "knowledge-base", label: "Knowledge Base", description: "Self-serve help articles", selected: false },
      { id: "sla-timers", label: "SLA Timers", description: "Response time targets with alerts", selected: false },
      { id: "ticket-escalation", label: "Ticket Escalation", description: "Auto-escalate after X hours unresolved", selected: false },
      { id: "satisfaction-survey-trigger", label: "Post-Resolution Survey", description: "Auto-send survey when ticket is closed", selected: false },
      { id: "ticket-priority", label: "Ticket Priority Levels", description: "Mark tickets as Low, Medium, High, Critical with visual indicators", selected: true },
      { id: "ticket-categories", label: "Ticket Categories", description: "Categorise tickets by type for filtering and reporting", selected: false },
      { id: "internal-ticket-notes", label: "Internal Notes", description: "Private notes on tickets only visible to your team", selected: true },
      { id: "ticket-to-job", label: "Ticket → Job Conversion", description: "Convert a support request into a job when it requires work", selected: false },
    ],
  },
  {
    id: "manageDocuments",
    name: "Documents",
    icon: "FileText",
    description: "Contracts, files, and signatures sorted.",
    features: [
      { id: "contract-templates", label: "Contract Templates", description: "Reusable agreement formats", selected: false },
      { id: "e-signatures", label: "E-Signatures", description: "Get documents signed digitally", selected: false },
      { id: "auto-attach-to-job", label: "Auto-Attach to Job", description: "Documents link to their related job", selected: true },
      { id: "expiry-tracking", label: "Expiry Tracking", description: "Alerts when contracts are about to expire", selected: false },
      { id: "version-history", label: "Version History", description: "Track changes across document versions", selected: false },
      { id: "document-tags", label: "Document Tags", description: "Organise documents by type — contract, receipt, ID, photo", selected: false },
      { id: "doc-template-variables", label: "Template Variables", description: "Auto-fill {client_name}, {date}, {service} into contract templates", selected: false },
      { id: "document-request", label: "Request from Client", description: "Request a client upload a specific document with a status tracker", selected: false },
    ],
  },
];
