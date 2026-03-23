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
  // Role-specific personas within this industry
  personas?: PersonaConfig[];
}

export interface PersonaConfig {
  id: string;
  label: string;
  description: string;
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
    personas: [
      {
        id: "hair-salon",
        label: "Hair Salon / Hairstylist",
        description: "Solo stylist or multi-chair salon",
        suggestedTeamSize: "2-5",
        descriptionPlaceholder: "e.g. Boutique hair salon in Surry Hills",
      },
      {
        id: "barber",
        label: "Barber / Barbershop",
        description: "Classic cuts and grooming",
        suggestedTeamSize: "2-5",
        descriptionPlaceholder: "e.g. Classic barbershop in the CBD",
        namePlaceholder: "e.g. The Sharp Edge",
      },
      {
        id: "nail-tech",
        label: "Nail Tech / Nail Salon",
        description: "Manicures, acrylics, nail art",
        descriptionPlaceholder: "e.g. Gel nails and nail art in Bondi",
        namePlaceholder: "e.g. Polished by Sarah",
      },
      {
        id: "lash-brow-tech",
        label: "Lash & Brow Tech",
        description: "Extensions, lifts, microblading",
        descriptionPlaceholder: "e.g. Lash extensions and brow styling",
        namePlaceholder: "e.g. Lash Lab Co",
      },
      {
        id: "makeup-artist",
        label: "Makeup Artist",
        description: "Bridal, events, editorial",
        descriptionPlaceholder: "e.g. Bridal and editorial makeup artist in Melbourne",
      },
      {
        id: "spa-massage",
        label: "Spa / Massage",
        description: "Day spas, remedial, relaxation",
        suggestedTeamSize: "2-5",
        descriptionPlaceholder: "e.g. Relaxation and remedial massage studio",
        namePlaceholder: "e.g. Serenity Day Spa",
      },
    ],
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
    personas: [
      {
        id: "plumber",
        label: "Plumber",
        description: "Residential and commercial plumbing",
        descriptionPlaceholder: "e.g. Residential plumbing and gas fitting in Melbourne",
        namePlaceholder: "e.g. Dave's Plumbing",
      },
      {
        id: "electrician",
        label: "Electrician",
        description: "Wiring, switchboards, installations",
        descriptionPlaceholder: "e.g. Residential and commercial electrical in Brisbane",
        namePlaceholder: "e.g. Spark Right Electrical",
      },
      {
        id: "builder-carpenter",
        label: "Builder / Carpenter",
        description: "Renovations, extensions, new builds",
        suggestedTeamSize: "6-15",
        descriptionPlaceholder: "e.g. Home renovations and extensions",
        namePlaceholder: "e.g. Summit Constructions",
      },
      {
        id: "painter",
        label: "Painter",
        description: "Interior and exterior painting",
        descriptionPlaceholder: "e.g. Interior and exterior house painting",
        namePlaceholder: "e.g. Fresh Coat Painters",
      },
      {
        id: "hvac-technician",
        label: "HVAC Technician",
        description: "Heating, cooling, air conditioning",
        descriptionPlaceholder: "e.g. Air conditioning installation and repair",
        namePlaceholder: "e.g. Cool Breeze HVAC",
      },
      {
        id: "landscaper",
        label: "Landscaper",
        description: "Gardens, hardscaping, maintenance",
        descriptionPlaceholder: "e.g. Residential landscaping and garden maintenance",
        namePlaceholder: "e.g. Green Edge Landscaping",
      },
      {
        id: "cleaner",
        label: "Cleaner",
        description: "Residential, commercial, end-of-lease",
        descriptionPlaceholder: "e.g. End-of-lease and regular home cleaning",
        namePlaceholder: "e.g. Sparkle Clean Co",
        smartDefaultOverrides: { runMarketing: true, acceptBookings: true },
      },
    ],
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
    personas: [
      {
        id: "accountant-bookkeeper",
        label: "Accountant / Bookkeeper",
        description: "Tax, BAS, payroll, advisory",
        descriptionPlaceholder: "e.g. Tax and bookkeeping for small businesses",
        namePlaceholder: "e.g. Clear Books Accounting",
        smartDefaultOverrides: { acceptBookings: false },
      },
      {
        id: "lawyer-solicitor",
        label: "Lawyer / Solicitor",
        description: "Legal advice, conveyancing, family law",
        descriptionPlaceholder: "e.g. Family law and conveyancing practice",
        namePlaceholder: "e.g. Clarke & Associates",
      },
      {
        id: "consultant",
        label: "Consultant",
        description: "Business, management, IT strategy",
        descriptionPlaceholder: "e.g. Management consulting for mid-size companies",
        namePlaceholder: "e.g. Apex Advisory",
      },
      {
        id: "real-estate-agent",
        label: "Real Estate Agent",
        description: "Property sales and management",
        descriptionPlaceholder: "e.g. Residential sales in Sydney's Eastern Suburbs",
        namePlaceholder: "e.g. Ray White Double Bay",
        smartDefaultOverrides: { runMarketing: true },
      },
      {
        id: "financial-advisor",
        label: "Financial Advisor",
        description: "Wealth, super, insurance planning",
        descriptionPlaceholder: "e.g. Wealth management and retirement planning",
      },
      {
        id: "marketing-agency",
        label: "Marketing Agency",
        description: "Digital marketing, SEO, social",
        descriptionPlaceholder: "e.g. Digital marketing for e-commerce brands",
        namePlaceholder: "e.g. Pixel & Co",
        smartDefaultOverrides: { runMarketing: true },
      },
    ],
  },
  {
    id: "health-fitness",
    label: "Health & Fitness",
    emoji: "\uD83C\uDFCB\uFE0F",
    description: "Personal trainers, physios, therapists, yoga studios, gyms, nutritionists",
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
    personas: [
      {
        id: "personal-trainer",
        label: "Personal Trainer",
        description: "1-on-1 and small group training",
        descriptionPlaceholder: "e.g. 1-on-1 personal training in Bondi",
      },
      {
        id: "gym-studio-owner",
        label: "Gym / Studio Owner",
        description: "Boutique gym or fitness studio",
        suggestedTeamSize: "6-15",
        descriptionPlaceholder: "e.g. Boutique fitness studio",
        namePlaceholder: "e.g. Iron House Fitness",
      },
      {
        id: "yoga-pilates-studio",
        label: "Yoga / Pilates Studio",
        description: "Class-based movement studio",
        suggestedTeamSize: "2-5",
        descriptionPlaceholder: "e.g. Vinyasa yoga studio",
        namePlaceholder: "e.g. Flow Studio",
      },
      {
        id: "physio-chiro",
        label: "Physio / Chiro",
        description: "Allied health practitioner",
        suggestedTeamSize: "2-5",
        descriptionPlaceholder: "e.g. Sports physiotherapy and rehabilitation",
        namePlaceholder: "e.g. Active Health Physio",
        smartDefaultOverrides: { manageDocuments: true },
      },
      {
        id: "nutritionist",
        label: "Nutritionist",
        description: "Meal planning, health coaching",
        descriptionPlaceholder: "e.g. Clinical nutrition and meal planning",
        namePlaceholder: "e.g. Nourish Nutrition",
      },
      {
        id: "therapist",
        label: "Therapist / Counsellor",
        description: "Psychologists, counsellors, psychotherapists",
        suggestedTeamSize: "Just me",
      },
    ],
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
    personas: [
      {
        id: "photographer",
        label: "Photographer",
        description: "Wedding, portrait, commercial",
        namePlaceholder: "e.g. Luminous Studios",
      },
      {
        id: "graphic-designer",
        label: "Graphic Designer",
        description: "Branding, print, digital design",
        descriptionPlaceholder: "e.g. Brand identity and packaging design",
      },
      {
        id: "web-designer-developer",
        label: "Web Designer / Developer",
        description: "Websites, apps, digital products",
        descriptionPlaceholder: "e.g. Custom website design and development",
        namePlaceholder: "e.g. Devhaus Studio",
        smartDefaultOverrides: { handleSupport: true },
      },
      {
        id: "videographer",
        label: "Videographer",
        description: "Events, corporate, content",
        descriptionPlaceholder: "e.g. Wedding and corporate videography",
      },
      {
        id: "interior-designer",
        label: "Interior Designer",
        description: "Residential and commercial interiors",
        descriptionPlaceholder: "e.g. Residential interior design and styling",
        namePlaceholder: "e.g. Haus Interiors",
      },
    ],
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
    personas: [
      {
        id: "wedding-planner",
        label: "Wedding Planner",
        description: "Full-service wedding planning",
        descriptionPlaceholder: "e.g. Full-service wedding planning in Sydney",
        namePlaceholder: "e.g. Sage & Thyme Weddings",
      },
      {
        id: "event-planner",
        label: "Event Planner",
        description: "Corporate events, parties, conferences",
        descriptionPlaceholder: "e.g. Corporate events and conferences",
      },
      {
        id: "caterer",
        label: "Caterer",
        description: "Full-service catering, private chef",
        descriptionPlaceholder: "e.g. Full-service catering for weddings and events",
      },
      {
        id: "venue-manager",
        label: "Venue Manager",
        description: "Function rooms, event spaces",
        descriptionPlaceholder: "e.g. Boutique event venue and function space",
        namePlaceholder: "e.g. The Garden Terrace",
        suggestedTeamSize: "6-15",
      },
      {
        id: "florist",
        label: "Florist",
        description: "Wedding flowers, event floristry",
        descriptionPlaceholder: "e.g. Wedding flowers and event floristry",
        namePlaceholder: "e.g. Wild Bloom Flowers",
      },
    ],
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
    personas: [
      {
        id: "tutor",
        label: "Tutor",
        description: "Academic tutoring, test prep",
        descriptionPlaceholder: "e.g. Maths and science tutoring for high school students",
        namePlaceholder: "e.g. BrightPath Tutoring",
      },
      {
        id: "life-business-coach",
        label: "Life / Business Coach",
        description: "Personal development, business growth",
        descriptionPlaceholder: "e.g. Executive coaching and leadership development",
        namePlaceholder: "e.g. Elevate Coaching",
      },
      {
        id: "music-teacher",
        label: "Music Teacher",
        description: "Piano, guitar, voice lessons",
        namePlaceholder: "e.g. Melody Music Academy",
      },
      {
        id: "driving-instructor",
        label: "Driving Instructor",
        description: "Learner driver lessons",
        descriptionPlaceholder: "e.g. Learner driver lessons",
        namePlaceholder: "e.g. FirstGear Driving School",
      },
      {
        id: "online-course-creator",
        label: "Online Course Creator",
        description: "Digital courses, memberships",
        descriptionPlaceholder: "e.g. Online courses for freelance designers",
        namePlaceholder: "e.g. Design Mastery",
        smartDefaultOverrides: { runMarketing: true, acceptBookings: false },
      },
    ],
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
      { id: "social-scheduling", label: "Social Media Scheduling", description: "Schedule and publish posts", selected: false },
      { id: "review-collection", label: "Review Collection", description: "Ask clients for reviews", selected: false },
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
