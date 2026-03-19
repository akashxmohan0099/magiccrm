export interface BusinessContext {
  businessName: string;
  businessDescription: string;
  industry: string;
  industryOther: string;
  location: string;
}

export interface NeedsAssessment {
  manageCustomers: boolean;
  receiveInquiries: boolean;
  communicateClients: boolean;
  acceptBookings: boolean;
  sendInvoices: boolean;
  manageProjects: boolean;
  runMarketing: boolean;
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
  },
  {
    id: "trades-construction",
    label: "Trades & Construction",
    emoji: "\uD83D\uDD27",
    description: "Plumbers, electricians, builders, HVAC, landscapers",
    smartDefaults: {
      manageCustomers: true,
      sendInvoices: true,
      manageProjects: true,
      receiveInquiries: true,
      communicateClients: true,
      manageDocuments: true,
      handleSupport: false,
      acceptBookings: false,
      runMarketing: false,
    },
    questionOverrides: {
      manageCustomers: { label: "Do you keep records of job sites and client details?", subtitle: "Property addresses, contact info, and job history per client." },
      sendInvoices: { label: "Do you quote jobs and send invoices?", subtitle: "Quotes that convert to invoices, progress payments, and receipts." },
      manageProjects: { label: "Do you manage jobs with multiple stages?", subtitle: "Track jobs from quote to completion with task lists and photos." },
      receiveInquiries: { label: "Do homeowners or businesses request quotes from you?", subtitle: "Capture leads from Google, word of mouth, or your website." },
      manageDocuments: { label: "Do you deal with contracts, permits, or compliance docs?", subtitle: "Store and share contracts, safety docs, and certificates." },
      communicateClients: { label: "Do you update clients on job progress?", subtitle: "Send updates, photos, and ETAs via text or email." },
    },
    descriptionPlaceholder: "e.g. Residential electrical contractor in Gold Coast",
    namePlaceholder: "e.g. Spark Right Electrical",
    suggestedTeamSize: "2-5",
  },
  {
    id: "professional-services",
    label: "Professional Services",
    emoji: "\uD83D\uDCBC",
    description: "Consultants, accountants, lawyers, agencies, coaches",
    smartDefaults: {
      manageCustomers: true,
      sendInvoices: true,
      manageProjects: true,
      communicateClients: true,
      receiveInquiries: true,
      manageDocuments: true,
      handleSupport: true,
      acceptBookings: true,
      runMarketing: false,
    },
    questionOverrides: {
      manageCustomers: { label: "Do you manage an ongoing client roster?", subtitle: "Client profiles, engagement history, and relationship tracking." },
      sendInvoices: { label: "Do you bill clients for your services?", subtitle: "Hourly billing, retainers, project-based invoicing, and expense tracking." },
      manageProjects: { label: "Do you run projects or engagements with deliverables?", subtitle: "Track milestones, tasks, and deliverables per client engagement." },
      manageDocuments: { label: "Do you send proposals, contracts, or reports?", subtitle: "Proposals, SOWs, NDAs, and deliverable documents." },
      handleSupport: { label: "Do clients come back with questions or follow-ups?", subtitle: "Track follow-up requests and ongoing client support." },
      acceptBookings: { label: "Do clients book consultations or meetings with you?", subtitle: "Discovery calls, strategy sessions, and recurring check-ins." },
    },
    descriptionPlaceholder: "e.g. Business coaching for SMEs",
    namePlaceholder: "e.g. Apex Advisory",
    suggestedTeamSize: "2-5",
  },
  {
    id: "health-fitness",
    label: "Health & Fitness",
    emoji: "\uD83C\uDFCB\uFE0F",
    description: "Personal trainers, physios, yoga studios, gyms, nutritionists",
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
      manageCustomers: { label: "Do you track client progress and health records?", subtitle: "Training plans, measurements, progress photos, and session notes." },
      acceptBookings: { label: "Do clients book sessions or classes?", subtitle: "1-on-1 sessions, group classes, and recurring weekly bookings." },
      sendInvoices: { label: "Do you charge per session, by package, or membership?", subtitle: "Session packs, monthly memberships, or per-visit billing." },
      runMarketing: { label: "Do you promote classes, offers, or transformations?", subtitle: "Transformation stories, class schedules, and seasonal promos." },
      communicateClients: { label: "Do you check in with clients between sessions?", subtitle: "Form checks, accountability messages, and scheduling updates." },
    },
    descriptionPlaceholder: "e.g. Personal training studio in Bondi",
    namePlaceholder: "e.g. Peak Performance PT",
    suggestedTeamSize: "Just me",
  },
  {
    id: "creative-services",
    label: "Creative & Design",
    emoji: "\uD83C\uDFA8",
    description: "Photographers, designers, videographers, content creators",
    smartDefaults: {
      manageCustomers: true,
      sendInvoices: true,
      manageProjects: true,
      communicateClients: true,
      receiveInquiries: true,
      manageDocuments: true,
      acceptBookings: true,
      runMarketing: true,
      handleSupport: false,
    },
    questionOverrides: {
      manageCustomers: { label: "Do you manage a client list with project history?", subtitle: "Track past projects, preferences, brand guidelines, and contacts." },
      sendInvoices: { label: "Do you send quotes and invoices for projects?", subtitle: "Project quotes, milestone invoicing, and deposit collection." },
      manageProjects: { label: "Do your projects have stages like brief, draft, review, deliver?", subtitle: "Track creative projects from briefing through to final delivery." },
      receiveInquiries: { label: "Do potential clients reach out for quotes or availability?", subtitle: "Inquiry forms, DMs, and referral tracking." },
      manageDocuments: { label: "Do you send contracts or share deliverables?", subtitle: "Creative briefs, contracts, mood boards, and file delivery." },
      acceptBookings: { label: "Do clients book shoots, sessions, or calls?", subtitle: "Discovery calls, shoot days, and review sessions." },
    },
    descriptionPlaceholder: "e.g. Wedding photography and videography",
    namePlaceholder: "e.g. Luminous Studios",
    suggestedTeamSize: "Just me",
  },
  {
    id: "hospitality-events",
    label: "Hospitality & Events",
    emoji: "\uD83C\uDF7D\uFE0F",
    description: "Restaurants, caterers, event planners, venues, food trucks",
    smartDefaults: {
      manageCustomers: true,
      acceptBookings: true,
      sendInvoices: true,
      communicateClients: true,
      receiveInquiries: true,
      manageProjects: true,
      runMarketing: true,
      handleSupport: false,
      manageDocuments: false,
    },
    questionOverrides: {
      manageCustomers: { label: "Do you keep records of past clients and events?", subtitle: "Guest preferences, dietary needs, and event history." },
      acceptBookings: { label: "Do clients book events, tables, or catering?", subtitle: "Event bookings, table reservations, and catering inquiries." },
      sendInvoices: { label: "Do you send quotes and invoices for events or orders?", subtitle: "Event proposals, deposit invoices, and final settlement." },
      manageProjects: { label: "Do you plan events with multiple moving parts?", subtitle: "Vendor coordination, timelines, checklists, and floor plans." },
      receiveInquiries: { label: "Do new clients inquire about availability or menus?", subtitle: "Capture event inquiries, menu requests, and venue tours." },
    },
    descriptionPlaceholder: "e.g. Boutique event planning and catering",
    namePlaceholder: "e.g. Sage & Thyme Events",
    suggestedTeamSize: "2-5",
  },
  {
    id: "education-coaching",
    label: "Education & Coaching",
    emoji: "\uD83D\uDCDA",
    description: "Tutors, course creators, music teachers, driving schools",
    smartDefaults: {
      manageCustomers: true,
      acceptBookings: true,
      sendInvoices: true,
      communicateClients: true,
      receiveInquiries: true,
      handleSupport: true,
      manageDocuments: true,
      runMarketing: false,
      manageProjects: false,
    },
    questionOverrides: {
      manageCustomers: { label: "Do you track students or learner progress?", subtitle: "Student profiles, progress notes, and attendance records." },
      acceptBookings: { label: "Do students book lessons or sessions?", subtitle: "One-on-one lessons, group classes, and recurring schedules." },
      sendInvoices: { label: "Do you charge per lesson, term, or course?", subtitle: "Per-session billing, term invoices, or course packages." },
      communicateClients: { label: "Do you communicate with students or parents?", subtitle: "Lesson reminders, progress updates, and schedule changes." },
      handleSupport: { label: "Do students have questions outside of sessions?", subtitle: "Homework help, resource sharing, and follow-up Q&A." },
      manageDocuments: { label: "Do you share worksheets, resources, or certificates?", subtitle: "Course materials, worksheets, and completion certificates." },
    },
    descriptionPlaceholder: "e.g. Private music lessons for kids and adults",
    namePlaceholder: "e.g. Melody Music Academy",
    suggestedTeamSize: "Just me",
  },
  {
    id: "retail-ecommerce",
    label: "Retail & E-commerce",
    emoji: "\uD83D\uDED2",
    description: "Online stores, boutiques, wholesalers, dropshippers",
    smartDefaults: {
      manageCustomers: true,
      sendInvoices: true,
      communicateClients: true,
      receiveInquiries: true,
      runMarketing: true,
      handleSupport: true,
      manageDocuments: false,
      acceptBookings: false,
      manageProjects: false,
    },
    questionOverrides: {
      manageCustomers: { label: "Do you track customer orders and purchase history?", subtitle: "Customer profiles, order history, and lifetime value tracking." },
      sendInvoices: { label: "Do you send invoices for wholesale or custom orders?", subtitle: "Wholesale invoicing, custom order quotes, and receipts." },
      runMarketing: { label: "Do you run promotions, email campaigns, or social ads?", subtitle: "Product launches, seasonal sales, and abandoned cart emails." },
      handleSupport: { label: "Do customers contact you about orders or returns?", subtitle: "Order inquiries, returns processing, and product questions." },
      communicateClients: { label: "Do you message customers about orders or promotions?", subtitle: "Shipping updates, restock alerts, and loyalty rewards." },
    },
    descriptionPlaceholder: "e.g. Online boutique selling handmade jewelry",
    namePlaceholder: "e.g. Luna & Stone",
    suggestedTeamSize: "Just me",
  },
  {
    id: "other",
    label: "Something else",
    emoji: "\uD83D\uDE80",
    description: "Tell us about your business and we'll figure it out",
    smartDefaults: {},
    descriptionPlaceholder: "Describe what your business does",
    namePlaceholder: "Your business name",
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
      { id: "client-profiles", label: "Client Profiles", description: "Contact details, notes, and history", selected: true },
      { id: "client-tags", label: "Tags & Categories", description: "Group clients by tags or categories", selected: false },
      { id: "segmentation-filters", label: "Segmentation Filters", description: "Filter by status, location, or type", selected: false },
      { id: "follow-up-reminders", label: "Follow-Up Reminders", description: "Automatic follow-up reminders", selected: true },
    ],
  },
  {
    id: "receiveInquiries",
    name: "Leads & Pipeline",
    icon: "Inbox",
    description: "Never lose track of a potential customer.",
    features: [
      { id: "lead-inbox", label: "Lead Inbox", description: "All incoming inquiries in one feed", selected: true },
      { id: "pipeline-stages", label: "Pipeline Stages", description: "Track lead progress to conversion", selected: true },
      { id: "web-forms", label: "Web Capture Forms", description: "Forms for your website or socials", selected: true },
      { id: "follow-up-reminders", label: "Follow-Up Reminders", description: "So no lead goes cold", selected: true },
      { id: "auto-assign-leads", label: "Auto-Assign Leads", description: "Route leads to team members", selected: false },
    ],
  },
  {
    id: "communicateClients",
    name: "Communication",
    icon: "MessageCircle",
    description: "Every conversation, one inbox.",
    features: [
      { id: "unified-inbox", label: "Unified Inbox", description: "All channels in one view", selected: true },
      { id: "email", label: "Email", description: "Send and receive email", selected: true },
      { id: "sms", label: "SMS", description: "Text messaging", selected: false },
      { id: "instagram-dms", label: "Instagram DMs", description: "Direct messages", selected: false },
      { id: "facebook-messenger", label: "Facebook Messenger", description: "Messenger conversations", selected: false },
      { id: "whatsapp", label: "WhatsApp", description: "WhatsApp messaging", selected: false },
      { id: "linkedin", label: "LinkedIn Messaging", description: "LinkedIn conversations", selected: false },
    ],
  },
  {
    id: "acceptBookings",
    name: "Bookings & Calendar",
    icon: "Calendar",
    description: "Let customers book you without the back and forth.",
    features: [
      { id: "booking-page", label: "Online Booking Page", description: "Shareable booking link", selected: true },
      { id: "availability", label: "Availability Management", description: "Set working hours and days off", selected: true },
      { id: "booking-reminders", label: "Automated Reminders", description: "Email or SMS before appointments", selected: true },
      { id: "recurring-bookings", label: "Recurring Appointments", description: "Repeat bookings on a schedule", selected: false },
      { id: "google-cal", label: "Google Calendar Sync", description: "Two-way sync", selected: false },
      { id: "outlook-cal", label: "Outlook Calendar Sync", description: "Two-way sync", selected: false },
    ],
  },
  {
    id: "sendInvoices",
    name: "Quotes & Invoicing",
    icon: "Receipt",
    description: "Quote the job, send the invoice, get paid.",
    features: [
      { id: "invoice-builder", label: "Invoice Builder", description: "Professional invoices with your branding", selected: true },
      { id: "quote-builder", label: "Quote Builder", description: "Quotes that convert to invoices", selected: true },
      { id: "invoice-templates", label: "Invoice Templates", description: "Reusable templates", selected: true },
      { id: "recurring-invoices", label: "Recurring Invoices", description: "Auto-generate on a schedule", selected: false },
      { id: "late-reminders", label: "Late Payment Reminders", description: "Nudges for overdue invoices", selected: true },
    ],
  },
  {
    id: "manageProjects",
    name: "Jobs & Projects",
    icon: "FolderKanban",
    description: "Track every job from start to finish.",
    features: [
      { id: "job-tracker", label: "Job Tracker", description: "Track jobs with stages", selected: true },
      { id: "task-lists", label: "Task Lists & Checklists", description: "Break work into steps", selected: true },
      { id: "due-dates", label: "Due Dates & Progress", description: "Track deadlines and progress", selected: true },
      { id: "file-attachments", label: "File Attachments", description: "Attach files per job", selected: true },
      { id: "task-delegation", label: "Task Delegation", description: "Assign to team members", selected: false },
      { id: "time-tracking", label: "Time Tracking", description: "Log hours on tasks", selected: false },
    ],
  },
  {
    id: "runMarketing",
    name: "Marketing",
    icon: "Megaphone",
    description: "Get the word out and bring them back.",
    features: [
      { id: "email-campaigns", label: "Email Campaigns", description: "Newsletters and promotions", selected: true },
      { id: "campaign-templates", label: "Campaign Templates", description: "Pre-built templates", selected: true },
      { id: "audience-segmentation", label: "Audience Segmentation", description: "Target specific groups", selected: false },
      { id: "social-scheduling", label: "Social Media Scheduling", description: "Schedule and publish posts", selected: false },
      { id: "review-collection", label: "Review Collection", description: "Ask clients for reviews", selected: false },
      { id: "coupon-codes", label: "Coupon & Discount Codes", description: "Promotional offers", selected: false },
    ],
  },
  {
    id: "handleSupport",
    name: "Support",
    icon: "Headphones",
    description: "Keep clients happy after the job's done.",
    features: [
      { id: "support-tracker", label: "Support Request Tracker", description: "Log and resolve requests", selected: true },
      { id: "auto-responses", label: "Auto-Responses", description: "Instant replies to common questions", selected: true },
      { id: "assign-requests", label: "Assign Requests", description: "Route to team members", selected: false },
      { id: "satisfaction-ratings", label: "Satisfaction Ratings", description: "Client satisfaction scores", selected: false },
      { id: "knowledge-base", label: "Knowledge Base", description: "Self-serve help articles", selected: false },
    ],
  },
  {
    id: "manageDocuments",
    name: "Documents",
    icon: "FileText",
    description: "Contracts, files, and signatures sorted.",
    features: [
      { id: "file-storage", label: "File Storage", description: "Upload and organize documents", selected: true },
      { id: "contract-templates", label: "Contract Templates", description: "Reusable agreement formats", selected: false },
      { id: "e-signatures", label: "E-Signatures", description: "Get documents signed digitally", selected: false },
      { id: "client-sharing", label: "Client File Sharing", description: "Share files securely", selected: true },
    ],
  },
];
