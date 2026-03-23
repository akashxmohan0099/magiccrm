import type {
  PersonaQuestionConfig,
  PersonaQuestionsMap,
  DiscoveryQuestion,
} from "@/types/persona-questions";

// ═══════════════════════════════════════════════════════════════════════════
// HELPER: Build the 7 universal questions for a given persona prefix + subtitles
// ═══════════════════════════════════════════════════════════════════════════

interface UniversalSubtitles {
  bookings: string;
  projects: string;
  products: string;
  marketing: string;
  team: string;
  automations: string;
  reporting: string;
}

function universalQuestions(prefix: string, subs: UniversalSubtitles): DiscoveryQuestion[] {
  return [
    {
      id: `${prefix}-bookings`,
      text: "Do clients book appointments or sessions with you?",
      subtitle: subs.bookings,
      needsKey: "acceptBookings",
      activatesModules: ["bookings-calendar"],
      defaultOnFeatures: [
        { moduleId: "bookings-calendar", featureId: "booking-page" },
        { moduleId: "bookings-calendar", featureId: "booking-reminders" },
      ],
    },
    {
      id: `${prefix}-projects`,
      text: "Do you manage projects or jobs?",
      subtitle: subs.projects,
      needsKey: "manageProjects",
      activatesModules: ["jobs-projects"],
      defaultOnFeatures: [
        { moduleId: "jobs-projects", featureId: "job-kanban" },
        { moduleId: "jobs-projects", featureId: "file-attachments" },
      ],
    },
    {
      id: `${prefix}-products`,
      text: "Do you sell products or services?",
      subtitle: subs.products,
      activatesModules: ["products"],
      defaultOnFeatures: [
        { moduleId: "products", featureId: "product-categories" },
        { moduleId: "products", featureId: "inventory-tracking" },
      ],
    },
    {
      id: `${prefix}-marketing`,
      text: "Do you run marketing or promotions?",
      subtitle: subs.marketing,
      needsKey: "runMarketing",
      activatesModules: ["marketing"],
      defaultOnFeatures: [
        { moduleId: "marketing", featureId: "social-scheduling" },
        { moduleId: "marketing", featureId: "review-collection" },
      ],
    },
    {
      id: `${prefix}-team`,
      text: "Do you have a team?",
      subtitle: subs.team,
      activatesModules: ["team"],
      defaultOnFeatures: [
        { moduleId: "team", featureId: "activity-log" },
      ],
    },
    {
      id: `${prefix}-automations`,
      text: "Would you like to automate repetitive tasks?",
      subtitle: subs.automations,
      activatesModules: ["automations"],
      defaultOnFeatures: [
        { moduleId: "automations", featureId: "auto-reminders" },
      ],
    },
    {
      id: `${prefix}-reporting`,
      text: "Do you want dashboards and reports?",
      subtitle: subs.reporting,
      activatesModules: ["reporting"],
      defaultOnFeatures: [
        { moduleId: "reporting", featureId: "revenue-dashboard" },
      ],
    },
  ];
}

// ═══════════════════════════════════════════════════════════════════════════
// BEAUTY & WELLNESS
// ═══════════════════════════════════════════════════════════════════════════

const hairSalon: PersonaQuestionConfig = {
  personaId: "hair-salon",
  questions: [
    ...universalQuestions("hs", {
      bookings: "Manage your calendar, availability, and appointment reminders",
      projects: "Track colour corrections, bridal packages, and multi-visit plans",
      products: "Sell retail hair products and track stock levels",
      marketing: "Post before-and-after transformations, collect reviews, and run promos",
      team: "Manage stylists, schedules, commissions, and permissions",
      automations: "Auto-send booking reminders, follow-ups, and rebooking nudges",
      reporting: "Track revenue per stylist, retention rates, and appointment trends",
    }),
    {
      id: "hs-beforeafter",
      text: "Do you take before-and-after photos of colour or styling work?",
      subtitle: "Capture transformation photos linked to client profiles for your portfolio.",
      activatesModules: ["before-after"],
      defaultOnFeatures: [{ moduleId: "before-after", featureId: "side-by-side-view" }],
    },
    {
      id: "hs-loyalty",
      text: "Would you like a loyalty program to reward repeat clients?",
      subtitle: "Points per visit, punch cards, and reward tiers to keep clients coming back.",
      activatesModules: ["loyalty"],
      defaultOnFeatures: [{ moduleId: "loyalty", featureId: "points-per-visit" }],
    },
  ],
  visibility: {
    hiddenModules: ["jobs-projects", "documents"],
    hiddenFeatures: [
      { moduleId: "quotes-invoicing", featureId: "travel-costs" },
      { moduleId: "bookings-calendar", featureId: "travel-time" },
      { moduleId: "quotes-invoicing", featureId: "quote-expiry" },
    ],
    hiddenAddons: ["soap-notes", "client-portal"],
  },
  defaultChannels: ["email", "sms", "instagram-dms"],
};

const barber: PersonaQuestionConfig = {
  personaId: "barber",
  questions: [
    ...universalQuestions("bb", {
      bookings: "Online booking for clients who plan ahead, walk-in queue for the rest",
      projects: "Track multi-session work or special grooming packages",
      products: "Sell beard oils, pomades, and grooming kits at the counter",
      marketing: "Post your best fades, collect Google reviews, and run mate-rate promos",
      team: "Manage barber schedules, chair assignments, and commissions",
      automations: "Auto-send booking confirmations, no-show follow-ups, and review requests",
      reporting: "Track cuts per day, revenue per barber, and busiest hours",
    }),
    {
      id: "bb-loyalty",
      text: "Would you like a loyalty card — every 10th cut free?",
      subtitle: "Digital punch cards and loyalty points to keep regulars coming back.",
      activatesModules: ["loyalty"],
      defaultOnFeatures: [{ moduleId: "loyalty", featureId: "digital-punch-card" }],
    },
  ],
  visibility: {
    hiddenModules: ["jobs-projects", "documents", "support"],
    hiddenFeatures: [
      { moduleId: "quotes-invoicing", featureId: "travel-costs" },
      { moduleId: "bookings-calendar", featureId: "travel-time" },
      { moduleId: "quotes-invoicing", featureId: "quote-builder" },
      { moduleId: "quotes-invoicing", featureId: "quote-to-invoice" },
      { moduleId: "quotes-invoicing", featureId: "quote-expiry" },
      { moduleId: "quotes-invoicing", featureId: "recurring-invoices" },
    ],
    hiddenAddons: ["soap-notes", "client-portal", "notes-docs"],
  },
  defaultChannels: ["sms", "instagram-dms"],
};

const nailTech: PersonaQuestionConfig = {
  personaId: "nail-tech",
  questions: [
    ...universalQuestions("nt", {
      bookings: "Let clients pick a time and service — gel set, infills, nail art",
      projects: "Track multi-session nail art projects or bridal packages",
      products: "Sell nail care products, press-ons, and accessories",
      marketing: "Post your nail sets on Instagram, collect reviews, and run promos",
      team: "Manage nail tech schedules, availability, and permissions",
      automations: "Auto-send booking reminders, rebooking nudges, and aftercare tips",
      reporting: "Track revenue per service type, client retention, and popular designs",
    }),
    {
      id: "nt-beforeafter",
      text: "Do you photograph your nail sets to build a portfolio?",
      subtitle: "Capture before-and-after transformation photos linked to clients.",
      activatesModules: ["before-after"],
      defaultOnFeatures: [{ moduleId: "before-after", featureId: "side-by-side-view" }],
    },
    {
      id: "nt-loyalty",
      text: "Would you like a loyalty program for repeat clients?",
      subtitle: "Digital punch cards or points per visit to reward regulars.",
      activatesModules: ["loyalty"],
      defaultOnFeatures: [{ moduleId: "loyalty", featureId: "points-per-visit" }],
    },
  ],
  visibility: {
    hiddenModules: ["jobs-projects", "documents", "support"],
    hiddenFeatures: [
      { moduleId: "quotes-invoicing", featureId: "travel-costs" },
      { moduleId: "bookings-calendar", featureId: "travel-time" },
      { moduleId: "quotes-invoicing", featureId: "recurring-invoices" },
      { moduleId: "quotes-invoicing", featureId: "quote-expiry" },
    ],
    hiddenAddons: ["soap-notes", "client-portal", "notes-docs"],
  },
  defaultChannels: ["sms", "instagram-dms"],
};

const lashBrowTech: PersonaQuestionConfig = {
  personaId: "lash-brow-tech",
  questions: [
    ...universalQuestions("lb", {
      bookings: "Online booking for extensions, lifts, lamination, and microblading",
      projects: "Track multi-session treatments like lash courses or brow transformations",
      products: "Sell lash serums, brow kits, and aftercare products",
      marketing: "Post lash and brow transformations, collect reviews, and run promos",
      team: "Manage tech schedules, room availability, and permissions",
      automations: "Auto-send patch test reminders, aftercare tips, and rebooking nudges",
      reporting: "Track revenue per treatment type, retention rates, and popular services",
    }),
    {
      id: "lb-beforeafter",
      text: "Do you take before-and-after photos of lash or brow treatments?",
      subtitle: "Side-by-side comparison photos linked to client profiles.",
      activatesModules: ["before-after"],
      defaultOnFeatures: [{ moduleId: "before-after", featureId: "side-by-side-view" }],
    },
    {
      id: "lb-loyalty",
      text: "Would you like a loyalty program for repeat clients?",
      subtitle: "Points per visit and reward tiers to keep clients coming back.",
      activatesModules: ["loyalty"],
      defaultOnFeatures: [{ moduleId: "loyalty", featureId: "points-per-visit" }],
    },
  ],
  visibility: {
    hiddenModules: ["jobs-projects", "documents", "support"],
    hiddenFeatures: [
      { moduleId: "quotes-invoicing", featureId: "travel-costs" },
      { moduleId: "bookings-calendar", featureId: "travel-time" },
      { moduleId: "quotes-invoicing", featureId: "recurring-invoices" },
      { moduleId: "quotes-invoicing", featureId: "quote-builder" },
      { moduleId: "quotes-invoicing", featureId: "quote-expiry" },
    ],
    hiddenAddons: ["soap-notes", "client-portal", "notes-docs"],
  },
  defaultChannels: ["sms", "instagram-dms"],
};

const makeupArtist: PersonaQuestionConfig = {
  personaId: "makeup-artist",
  questions: [
    ...universalQuestions("mu", {
      bookings: "Book appointments, trials, and event dates",
      projects: "Track bridal packages, editorial shoots, and multi-day events",
      products: "Sell makeup kits, skincare, and beauty accessories",
      marketing: "Share glam shots, collect testimonials, and run seasonal promos",
      team: "Manage assistants, second artists, and their schedules",
      automations: "Auto-send prep guides, booking confirmations, and post-event follow-ups",
      reporting: "Track revenue per event type, booking trends, and seasonal demand",
    }),
    {
      id: "mu-beforeafter",
      text: "Do you photograph your work — glam shots, bridal looks?",
      subtitle: "Build a portfolio of transformation photos linked to client profiles.",
      activatesModules: ["before-after"],
      defaultOnFeatures: [{ moduleId: "before-after", featureId: "side-by-side-view" }],
    },
  ],
  visibility: {
    hiddenModules: ["jobs-projects", "support"],
    hiddenFeatures: [
      { moduleId: "quotes-invoicing", featureId: "recurring-invoices" },
    ],
    hiddenAddons: ["soap-notes", "memberships", "loyalty"],
  },
  defaultChannels: ["email", "instagram-dms", "whatsapp"],
};

const spaMassage: PersonaQuestionConfig = {
  personaId: "spa-massage",
  questions: [
    ...universalQuestions("sm", {
      bookings: "Online booking with therapist and room assignment",
      projects: "Track treatment plans, wellness packages, and multi-session programs",
      products: "Sell skincare, essential oils, and wellness products",
      marketing: "Promote spa packages, seasonal offers, and collect reviews",
      team: "Manage therapist schedules, availability, and room assignments",
      automations: "Auto-send booking reminders, aftercare tips, and rebooking nudges",
      reporting: "Track revenue per therapist, popular treatments, and occupancy rates",
    }),
    {
      id: "sm-beforeafter",
      text: "Do you take before-and-after photos of skin treatments?",
      subtitle: "Capture treatment results linked to client profiles.",
      activatesModules: ["before-after"],
      defaultOnFeatures: [{ moduleId: "before-after", featureId: "side-by-side-view" }],
    },
    {
      id: "sm-loyalty",
      text: "Would you like a loyalty program for repeat visitors?",
      subtitle: "Points per visit, reward tiers, and special offers for regulars.",
      activatesModules: ["loyalty"],
      defaultOnFeatures: [{ moduleId: "loyalty", featureId: "points-per-visit" }],
    },
  ],
  visibility: {
    hiddenModules: ["jobs-projects", "documents"],
    hiddenFeatures: [
      { moduleId: "quotes-invoicing", featureId: "travel-costs" },
      { moduleId: "bookings-calendar", featureId: "travel-time" },
      { moduleId: "quotes-invoicing", featureId: "quote-builder" },
      { moduleId: "quotes-invoicing", featureId: "quote-expiry" },
    ],
    hiddenAddons: [],
  },
  defaultChannels: ["email", "sms"],
};

// ═══════════════════════════════════════════════════════════════════════════
// TRADES & CONSTRUCTION
// ═══════════════════════════════════════════════════════════════════════════

const tradesVisibility = {
  hiddenModules: [] as string[],
  hiddenFeatures: [
    { moduleId: "quotes-invoicing", featureId: "tipping" },
    { moduleId: "bookings-calendar", featureId: "multi-service-booking" },
    { moduleId: "bookings-calendar", featureId: "group-class-booking" },
    { moduleId: "bookings-calendar", featureId: "resource-room-assignment" },
  ],
  hiddenAddons: ["soap-notes", "loyalty", "memberships"],
};

const plumber: PersonaQuestionConfig = {
  personaId: "plumber",
  questions: universalQuestions("pl", {
    bookings: "Schedule call-outs, site visits, and follow-up inspections",
    projects: "Track jobs from quote to completion with stages and checklists",
    products: "Track parts, fittings, and materials used per job",
    marketing: "Collect Google reviews, run local ads, and get referral traffic",
    team: "Assign jobs, manage apprentices, and track team schedules",
    automations: "Auto-send job confirmations, ETAs, and payment reminders",
    reporting: "Track revenue per job type, quote conversion rates, and team output",
  }),
  visibility: tradesVisibility,
  defaultChannels: ["email", "sms"],
};

const electrician: PersonaQuestionConfig = {
  personaId: "electrician",
  questions: universalQuestions("el", {
    bookings: "Schedule call-outs, inspections, and switchboard upgrades",
    projects: "Track electrical jobs from call-out through to compliance sign-off",
    products: "Track parts, switches, and materials used per job",
    marketing: "Collect Google reviews, run local ads, and build referral traffic",
    team: "Assign jobs to apprentices and sparkies, manage schedules",
    automations: "Auto-send job confirmations, compliance reminders, and invoice follow-ups",
    reporting: "Track revenue per job type, quote win rates, and compliance completion",
  }),
  visibility: tradesVisibility,
  defaultChannels: ["email", "sms"],
};

const builderCarpenter: PersonaQuestionConfig = {
  personaId: "builder-carpenter",
  questions: universalQuestions("bc", {
    bookings: "Schedule site visits, client meetings, and inspections",
    projects: "Track builds from quote through demolition, frame, lock-up to handover",
    products: "Track timber, hardware, and materials per build",
    marketing: "Showcase completed builds, collect reviews, and get referrals",
    team: "Manage subbies, apprentices, and crew schedules",
    automations: "Auto-send milestone updates, progress photos, and payment reminders",
    reporting: "Track revenue per project, profit margins, and team utilisation",
  }),
  visibility: tradesVisibility,
  defaultChannels: ["email", "sms"],
};

const painter: PersonaQuestionConfig = {
  personaId: "painter",
  questions: universalQuestions("pa", {
    bookings: "Schedule site visits, quoting appointments, and job start dates",
    projects: "Track painting jobs from quote through prep, prime, paint, to touch-up",
    products: "Track paint, primers, and materials per job",
    marketing: "Share before-and-after photos, collect reviews, and run seasonal promos",
    team: "Assign jobs to painters and apprentices, manage schedules",
    automations: "Auto-send job confirmations, progress updates, and invoice reminders",
    reporting: "Track revenue per job, quote conversion rates, and material costs",
  }),
  visibility: tradesVisibility,
  defaultChannels: ["email", "sms"],
};

const hvacTechnician: PersonaQuestionConfig = {
  personaId: "hvac-technician",
  questions: universalQuestions("hv", {
    bookings: "Schedule installs, service calls, and maintenance visits",
    projects: "Track installations and repairs from booking to completion",
    products: "Track units, parts, and refrigerant used per job",
    marketing: "Collect Google reviews, run seasonal service promos, and build referrals",
    team: "Assign service calls to technicians and manage schedules",
    automations: "Auto-send service reminders, warranty expiry alerts, and invoice follow-ups",
    reporting: "Track revenue per service type, warranty claims, and technician output",
  }),
  visibility: tradesVisibility,
  defaultChannels: ["email", "sms"],
};

const landscaper: PersonaQuestionConfig = {
  personaId: "landscaper",
  questions: universalQuestions("ls", {
    bookings: "Schedule site visits, design consults, and maintenance days",
    projects: "Track landscaping projects from design through planting to finish",
    products: "Track plants, mulch, pavers, and materials per project",
    marketing: "Showcase garden transformations, collect reviews, and run seasonal promos",
    team: "Assign jobs to crew members and manage schedules",
    automations: "Auto-send job confirmations, seasonal reminders, and invoice follow-ups",
    reporting: "Track revenue per project type, material costs, and crew utilisation",
  }),
  visibility: tradesVisibility,
  defaultChannels: ["email", "sms"],
};

const cleaner: PersonaQuestionConfig = {
  personaId: "cleaner",
  questions: universalQuestions("cl", {
    bookings: "Recurring weekly cleans and one-off end-of-lease bookings",
    projects: "Track deep clean projects or multi-room jobs with checklists",
    products: "Sell cleaning products or track supplies used per job",
    marketing: "Collect Google reviews, run promos, and build referral traffic",
    team: "Assign jobs to cleaners, manage schedules, and track performance",
    automations: "Auto-send booking confirmations, schedule reminders, and review requests",
    reporting: "Track revenue per client, cleaner productivity, and recurring vs one-off income",
  }),
  visibility: {
    hiddenModules: ["documents", "jobs-projects"],
    hiddenFeatures: [
      { moduleId: "quotes-invoicing", featureId: "tipping" },
      { moduleId: "bookings-calendar", featureId: "multi-service-booking" },
      { moduleId: "bookings-calendar", featureId: "group-class-booking" },
      { moduleId: "bookings-calendar", featureId: "resource-room-assignment" },
    ],
    hiddenAddons: ["soap-notes", "memberships", "client-portal"],
  },
  defaultChannels: ["sms", "email"],
};

// ═══════════════════════════════════════════════════════════════════════════
// PROFESSIONAL SERVICES
// ═══════════════════════════════════════════════════════════════════════════

const profServicesVisibility = {
  hiddenModules: ["products"] as string[],
  hiddenFeatures: [
    { moduleId: "quotes-invoicing", featureId: "tipping" },
    { moduleId: "bookings-calendar", featureId: "group-class-booking" },
    { moduleId: "bookings-calendar", featureId: "resource-room-assignment" },
  ],
  hiddenAddons: ["soap-notes", "before-after", "loyalty", "memberships", "win-back"],
};

const accountantBookkeeper: PersonaQuestionConfig = {
  personaId: "accountant-bookkeeper",
  questions: universalQuestions("ab", {
    bookings: "Schedule client meetings, BAS reviews, and tax planning sessions",
    projects: "Track engagements from info requested through to lodged",
    products: "Manage your service packages and pricing tiers",
    marketing: "Run referral campaigns, collect Google reviews, and share tax tips",
    team: "Manage bookkeepers, junior accountants, and their workloads",
    automations: "Auto-send deadline reminders, document chase-ups, and lodgement confirmations",
    reporting: "Track revenue per client, engagement turnaround, and team utilisation",
  }),
  visibility: { ...profServicesVisibility, hiddenModules: ["bookings-calendar"], hiddenFeatures: [...profServicesVisibility.hiddenFeatures, { moduleId: "quotes-invoicing", featureId: "travel-costs" }] },
  defaultChannels: ["email"],
};

const lawyerSolicitor: PersonaQuestionConfig = {
  personaId: "lawyer-solicitor",
  questions: universalQuestions("lw", {
    bookings: "Schedule initial consultations, client meetings, and settlement conferences",
    projects: "Track matters from instruction through research, drafting, to resolution",
    products: "Manage your service offerings and fee schedules",
    marketing: "Build your online reputation with reviews and thought leadership",
    team: "Manage associates, paralegals, and admin staff workloads",
    automations: "Auto-send court date reminders, document requests, and billing follow-ups",
    reporting: "Track revenue per matter type, billable hours, and matter turnaround",
  }),
  visibility: { ...profServicesVisibility, hiddenFeatures: [...profServicesVisibility.hiddenFeatures, { moduleId: "quotes-invoicing", featureId: "travel-costs" }] },
  defaultChannels: ["email"],
};

const consultant: PersonaQuestionConfig = {
  personaId: "consultant",
  questions: universalQuestions("co", {
    bookings: "Schedule discovery calls, strategy sessions, and quarterly reviews",
    projects: "Track engagements through discovery, analysis, and delivery phases",
    products: "Manage your service packages, retainers, and workshop offerings",
    marketing: "Share case studies, thought leadership, and collect testimonials",
    team: "Manage account managers, analysts, and their capacity",
    automations: "Auto-send meeting reminders, deliverable follow-ups, and invoice nudges",
    reporting: "Track revenue per client, engagement profitability, and pipeline value",
  }),
  visibility: profServicesVisibility,
  defaultChannels: ["email", "linkedin"],
};

const realEstateAgent: PersonaQuestionConfig = {
  personaId: "real-estate-agent",
  questions: universalQuestions("re", {
    bookings: "Schedule open homes, private inspections, and appraisal appointments",
    projects: "Track listings through stages — listed, under offer, exchanged, sold",
    products: "Manage your listing packages and service offerings",
    marketing: "Run just-listed and just-sold campaigns, social ads, and newsletters",
    team: "Manage agents, admin, and property managers with performance tracking",
    automations: "Auto-send listing alerts, inspection reminders, and post-sale follow-ups",
    reporting: "Track listings, commissions, days on market, and conversion rates",
  }),
  visibility: { hiddenModules: [], hiddenFeatures: [{ moduleId: "quotes-invoicing", featureId: "tipping" }, { moduleId: "bookings-calendar", featureId: "group-class-booking" }], hiddenAddons: ["soap-notes", "before-after", "memberships", "intake-forms"] },
  defaultChannels: ["email", "sms"],
};

const financialAdvisor: PersonaQuestionConfig = {
  personaId: "financial-advisor",
  questions: universalQuestions("fa", {
    bookings: "Schedule annual reviews, discovery sessions, and strategy meetings",
    projects: "Track financial plans through fact-find, analysis, SOA, and implementation",
    products: "Manage your advice packages and fee schedules",
    marketing: "Share market commentary, collect reviews, and run educational seminars",
    team: "Manage paraplanners, admin, and their caseloads",
    automations: "Auto-send review reminders, document requests, and fee notices",
    reporting: "Track FUM growth, revenue per client, and review completion rates",
  }),
  visibility: { ...profServicesVisibility, hiddenFeatures: [...profServicesVisibility.hiddenFeatures, { moduleId: "quotes-invoicing", featureId: "travel-costs" }] },
  defaultChannels: ["email"],
};

const marketingAgency: PersonaQuestionConfig = {
  personaId: "marketing-agency",
  questions: universalQuestions("ma", {
    bookings: "Schedule kick-off calls, weekly check-ins, and quarterly reviews",
    projects: "Track campaigns from brief through creative, review, to launch",
    products: "Manage your service packages, retainers, and add-on offerings",
    marketing: "Market your own agency — case studies, thought leadership, and lead gen",
    team: "Manage account managers, designers, and copywriters with workload tracking",
    automations: "Auto-send campaign approvals, report deliveries, and invoice reminders",
    reporting: "Track revenue per client, campaign ROI, and team utilisation",
  }),
  visibility: { ...profServicesVisibility, hiddenFeatures: [...profServicesVisibility.hiddenFeatures, { moduleId: "quotes-invoicing", featureId: "travel-costs" }] },
  defaultChannels: ["email", "linkedin"],
};

// ═══════════════════════════════════════════════════════════════════════════
// HEALTH & FITNESS
// ═══════════════════════════════════════════════════════════════════════════

const personalTrainer: PersonaQuestionConfig = {
  personaId: "personal-trainer",
  questions: [
    ...universalQuestions("pt", {
      bookings: "1-on-1 sessions, group training, and recurring weekly slots",
      projects: "Track transformation programs, 12-week challenges, and PT packages",
      products: "Sell supplements, merchandise, and training gear",
      marketing: "Share transformation stories, collect reviews, and run seasonal promos",
      team: "Manage trainers, class instructors, and their schedules",
      automations: "Auto-send session reminders, progress check-ins, and rebooking nudges",
      reporting: "Track revenue per client, session completion rates, and retention",
    }),
    {
      id: "pt-soap",
      text: "Do you write session notes or track client measurements?",
      subtitle: "Structured session notes with body measurements and progress tracking.",
      activatesModules: ["soap-notes"],
      defaultOnFeatures: [{ moduleId: "soap-notes", featureId: "note-templates" }],
    },
    {
      id: "pt-timetable",
      text: "Do you run group classes on a timetable?",
      subtitle: "Publish a class timetable for clients to browse and book into.",
      activatesModules: ["class-timetable"],
      defaultOnFeatures: [{ moduleId: "class-timetable", featureId: "weekly-view" }],
    },
  ],
  visibility: { hiddenModules: ["jobs-projects", "documents", "support"], hiddenFeatures: [{ moduleId: "quotes-invoicing", featureId: "travel-costs" }, { moduleId: "quotes-invoicing", featureId: "quote-builder" }], hiddenAddons: ["client-portal", "notes-docs"] },
  defaultChannels: ["sms", "whatsapp", "instagram-dms"],
};

const gymStudioOwner: PersonaQuestionConfig = {
  personaId: "gym-studio-owner",
  questions: [
    ...universalQuestions("go", {
      bookings: "Class timetables, PT sessions, and recurring weekly bookings",
      projects: "Track gym challenges, programs, and membership drives",
      products: "Sell supplements, merchandise, and branded gear",
      marketing: "Promote classes, challenges, and new member offers",
      team: "Manage trainers, front desk staff, and class assignments",
      automations: "Auto-send class reminders, membership renewals, and win-back messages",
      reporting: "Track membership growth, class attendance, and revenue trends",
    }),
    {
      id: "go-timetable",
      text: "Do you run group classes on a weekly timetable?",
      subtitle: "Publish a class timetable for members to browse and book.",
      activatesModules: ["class-timetable"],
      defaultOnFeatures: [{ moduleId: "class-timetable", featureId: "weekly-view" }],
    },
    {
      id: "go-loyalty",
      text: "Would you like a loyalty program for members?",
      subtitle: "Points per visit, reward tiers, and referral credits.",
      activatesModules: ["loyalty"],
      defaultOnFeatures: [{ moduleId: "loyalty", featureId: "points-per-visit" }],
    },
  ],
  visibility: { hiddenModules: ["jobs-projects", "documents", "support"], hiddenFeatures: [{ moduleId: "quotes-invoicing", featureId: "travel-costs" }, { moduleId: "quotes-invoicing", featureId: "quote-builder" }, { moduleId: "quotes-invoicing", featureId: "tipping" }], hiddenAddons: ["soap-notes", "client-portal"] },
  defaultChannels: ["email", "sms", "instagram-dms"],
};

const yogaPilatesStudio: PersonaQuestionConfig = {
  personaId: "yoga-pilates-studio",
  questions: [
    ...universalQuestions("yp", {
      bookings: "Class timetable, private sessions, and recurring weekly bookings",
      projects: "Track retreats, teacher trainings, and workshop programs",
      products: "Sell mats, props, and wellness accessories",
      marketing: "Promote workshops, retreats, and new class schedules",
      team: "Manage teachers, class assignments, and substitute cover",
      automations: "Auto-send class reminders, waitlist notifications, and membership renewals",
      reporting: "Track class attendance, membership revenue, and teacher utilisation",
    }),
    {
      id: "yp-timetable",
      text: "Do you run classes on a weekly timetable?",
      subtitle: "Publish a class timetable for students to browse and book.",
      activatesModules: ["class-timetable"],
      defaultOnFeatures: [{ moduleId: "class-timetable", featureId: "weekly-view" }],
    },
  ],
  visibility: { hiddenModules: ["jobs-projects", "documents", "support"], hiddenFeatures: [{ moduleId: "quotes-invoicing", featureId: "travel-costs" }, { moduleId: "quotes-invoicing", featureId: "quote-builder" }, { moduleId: "quotes-invoicing", featureId: "tipping" }], hiddenAddons: ["soap-notes", "client-portal", "before-after"] },
  defaultChannels: ["email", "instagram-dms"],
};

const physioChiro: PersonaQuestionConfig = {
  personaId: "physio-chiro",
  questions: [
    ...universalQuestions("pc", {
      bookings: "Online booking for initial consults, follow-ups, and treatment sessions",
      projects: "Track treatment plans with stages and milestones",
      products: "Sell rehab equipment, braces, and wellness products",
      marketing: "Collect Google reviews, share exercise tips, and run awareness campaigns",
      team: "Manage practitioner schedules, rooms, and caseloads",
      automations: "Auto-send appointment reminders, exercise follow-ups, and rebooking nudges",
      reporting: "Track revenue per practitioner, treatment outcomes, and patient retention",
    }),
    {
      id: "pc-soap",
      text: "Do you write treatment notes — SOAP, clinical, or progress notes?",
      subtitle: "Structured SOAP notes linked to appointments with body map markup.",
      activatesModules: ["soap-notes"],
      defaultOnFeatures: [{ moduleId: "soap-notes", featureId: "auto-link-booking" }],
    },
    {
      id: "pc-timetable",
      text: "Do you run group rehab classes on a timetable?",
      subtitle: "Publish a class timetable for group exercise or rehab sessions.",
      activatesModules: ["class-timetable"],
      defaultOnFeatures: [{ moduleId: "class-timetable", featureId: "weekly-view" }],
    },
  ],
  visibility: { hiddenModules: ["jobs-projects"], hiddenFeatures: [{ moduleId: "quotes-invoicing", featureId: "tipping" }, { moduleId: "quotes-invoicing", featureId: "travel-costs" }, { moduleId: "quotes-invoicing", featureId: "quote-builder" }], hiddenAddons: ["loyalty", "before-after"] },
  defaultChannels: ["email", "sms"],
};

const nutritionist: PersonaQuestionConfig = {
  personaId: "nutritionist",
  questions: [
    ...universalQuestions("nu", {
      bookings: "Initial consults, follow-ups, and recurring check-in sessions",
      projects: "Track meal plan programs and multi-week nutrition plans",
      products: "Sell supplements, meal prep guides, and recipe books",
      marketing: "Share recipes, client success stories, and collect reviews",
      team: "Manage dietitians, admin staff, and their schedules",
      automations: "Auto-send appointment reminders, meal plan check-ins, and review requests",
      reporting: "Track revenue per client, program completion rates, and referral sources",
    }),
    {
      id: "nu-soap",
      text: "Do you write clinical or consultation notes?",
      subtitle: "Structured consultation notes linked to client appointments.",
      activatesModules: ["soap-notes"],
      defaultOnFeatures: [{ moduleId: "soap-notes", featureId: "note-templates" }],
    },
  ],
  visibility: { hiddenModules: ["jobs-projects", "support"], hiddenFeatures: [{ moduleId: "quotes-invoicing", featureId: "tipping" }, { moduleId: "quotes-invoicing", featureId: "travel-costs" }, { moduleId: "quotes-invoicing", featureId: "quote-builder" }], hiddenAddons: ["before-after", "loyalty"] },
  defaultChannels: ["email", "whatsapp"],
};

// ═══════════════════════════════════════════════════════════════════════════
// CREATIVE & DESIGN
// ═══════════════════════════════════════════════════════════════════════════

const creativeVisibility = {
  hiddenModules: [] as string[],
  hiddenFeatures: [{ moduleId: "quotes-invoicing", featureId: "tipping" }, { moduleId: "bookings-calendar", featureId: "group-class-booking" }],
  hiddenAddons: ["soap-notes", "loyalty", "memberships", "win-back", "intake-forms"],
};

const photographer: PersonaQuestionConfig = {
  personaId: "photographer",
  questions: [
    ...universalQuestions("ph", {
      bookings: "Shoot day bookings, mini sessions, and consultation calls",
      projects: "Track shoots from enquiry through shoot day, editing, to delivery",
      products: "Sell prints, albums, and digital packages",
      marketing: "Showcase your portfolio, collect reviews, and promote mini sessions",
      team: "Manage second shooters, editors, and their availability",
      automations: "Auto-send prep guides, delivery updates, and review requests",
      reporting: "Track revenue per shoot type, booking trends, and average order value",
    }),
    {
      id: "ph-beforeafter",
      text: "Do you showcase before-and-after editing work?",
      subtitle: "Raw vs edited comparison photos for your portfolio.",
      activatesModules: ["before-after"],
      defaultOnFeatures: [{ moduleId: "before-after", featureId: "side-by-side-view" }],
    },
  ],
  visibility: creativeVisibility,
  defaultChannels: ["email", "instagram-dms"],
};

const graphicDesigner: PersonaQuestionConfig = {
  personaId: "graphic-designer",
  questions: universalQuestions("gd", {
    bookings: "Schedule discovery calls, feedback sessions, and design reviews",
    projects: "Track design projects from brief through concepts, revisions, to delivery",
    products: "Sell design templates, brand kits, and digital assets",
    marketing: "Showcase work on Dribbble, Behance, or Instagram and collect reviews",
    team: "Manage designers, illustrators, and their workloads",
    automations: "Auto-send revision reminders, delivery notifications, and invoice follow-ups",
    reporting: "Track revenue per project type, turnaround times, and client retention",
  }),
  visibility: creativeVisibility,
  defaultChannels: ["email", "linkedin"],
};

const webDesignerDeveloper: PersonaQuestionConfig = {
  personaId: "web-designer-developer",
  questions: universalQuestions("wd", {
    bookings: "Schedule discovery calls, sprint reviews, and launch meetings",
    projects: "Track web builds from wireframe through design, dev, QA, to launch",
    products: "Sell hosting plans, maintenance packages, and themes",
    marketing: "Showcase your portfolio, collect reviews, and run case studies",
    team: "Manage developers, designers, and their capacity",
    automations: "Auto-send milestone updates, feedback requests, and invoice reminders",
    reporting: "Track revenue per project, sprint velocity, and client retention",
  }),
  visibility: { ...creativeVisibility, hiddenAddons: ["soap-notes", "loyalty", "memberships", "win-back", "intake-forms", "before-after"] },
  defaultChannels: ["email"],
};

const videographer: PersonaQuestionConfig = {
  personaId: "videographer",
  questions: [
    ...universalQuestions("vg", {
      bookings: "Shoot day bookings, pre-production calls, and review sessions",
      projects: "Track video productions from pre-production through shoot, edit, to delivery",
      products: "Sell stock footage, editing presets, and production packages",
      marketing: "Share showreels, behind-the-scenes, and collect client testimonials",
      team: "Manage camera ops, editors, and production crew",
      automations: "Auto-send production schedules, revision reminders, and delivery notifications",
      reporting: "Track revenue per production type, turnaround times, and client repeat rate",
    }),
    {
      id: "vg-beforeafter",
      text: "Do you showcase raw vs finished edits for your portfolio?",
      subtitle: "Before-and-after comparison of raw footage and final edit.",
      activatesModules: ["before-after"],
      defaultOnFeatures: [{ moduleId: "before-after", featureId: "side-by-side-view" }],
    },
  ],
  visibility: creativeVisibility,
  defaultChannels: ["email", "instagram-dms"],
};

const interiorDesigner: PersonaQuestionConfig = {
  personaId: "interior-designer",
  questions: [
    ...universalQuestions("id", {
      bookings: "Schedule consultations, site visits, and design presentations",
      projects: "Track design projects from concept through sourcing, install, to reveal",
      products: "Manage furniture, fixtures, and material selections for clients",
      marketing: "Showcase project reveals, share design tips, and collect reviews",
      team: "Manage junior designers, drafters, and their workloads",
      automations: "Auto-send sourcing updates, install schedules, and invoice reminders",
      reporting: "Track revenue per project, material margins, and client satisfaction",
    }),
    {
      id: "id-beforeafter",
      text: "Do you photograph room transformations?",
      subtitle: "Before-and-after comparison photos of design reveals.",
      activatesModules: ["before-after"],
      defaultOnFeatures: [{ moduleId: "before-after", featureId: "side-by-side-view" }],
    },
  ],
  visibility: creativeVisibility,
  defaultChannels: ["email", "instagram-dms"],
};

// ═══════════════════════════════════════════════════════════════════════════
// HOSPITALITY & EVENTS
// ═══════════════════════════════════════════════════════════════════════════

const eventVisibility = { hiddenModules: [] as string[], hiddenFeatures: [{ moduleId: "quotes-invoicing", featureId: "tipping" }], hiddenAddons: ["soap-notes", "loyalty", "memberships"] as string[] };

const weddingPlanner: PersonaQuestionConfig = {
  personaId: "wedding-planner",
  questions: universalQuestions("wp", {
    bookings: "Schedule consultations, venue walk-throughs, and planning sessions",
    projects: "Track weddings from inquiry through planning, rehearsal, to the big day",
    products: "Manage add-on packages, styling items, and hire inventory",
    marketing: "Showcase styled shoots, collect reviews, and post on wedding directories",
    team: "Manage coordinators, stylists, and day-of assistants",
    automations: "Auto-send planning checklists, vendor confirmations, and payment reminders",
    reporting: "Track revenue per wedding, booking lead time, and referral sources",
  }),
  visibility: eventVisibility,
  defaultChannels: ["email", "instagram-dms", "whatsapp"],
};

const eventPlanner: PersonaQuestionConfig = {
  personaId: "event-planner",
  questions: universalQuestions("ep", {
    bookings: "Schedule initial meetings, site visits, and planning sessions",
    projects: "Track events from concept through vendor lock, logistics, to execution",
    products: "Manage event packages, hire items, and add-on services",
    marketing: "Share event highlights, case studies, and collect reviews",
    team: "Manage coordinators, staff, and contractors with task assignments",
    automations: "Auto-send vendor confirmations, timeline updates, and payment reminders",
    reporting: "Track revenue per event, budget vs actual, and client satisfaction",
  }),
  visibility: eventVisibility,
  defaultChannels: ["email"],
};

const caterer: PersonaQuestionConfig = {
  personaId: "caterer",
  questions: universalQuestions("ca", {
    bookings: "Schedule tastings, menu consultations, and event service dates",
    projects: "Track catering events from inquiry through menu planning, prep, to service",
    products: "Manage your menu offerings, per-head pricing, and package deals",
    marketing: "Share food photography, event highlights, and collect reviews",
    team: "Manage chefs, wait staff, and coordinators with shift rosters",
    automations: "Auto-send menu confirmations, guest count reminders, and invoice follow-ups",
    reporting: "Track revenue per event, cost per head, and seasonal demand trends",
  }),
  visibility: eventVisibility,
  defaultChannels: ["email", "sms"],
};

const venueManager: PersonaQuestionConfig = {
  personaId: "venue-manager",
  questions: universalQuestions("vm", {
    bookings: "Manage venue bookings, date holds, and availability calendar",
    projects: "Track events from inquiry through setup, event day, to pack-down",
    products: "Manage hire packages, AV add-ons, and catering options",
    marketing: "Showcase your venue, share event highlights, and collect reviews",
    team: "Manage event staff, coordinators, and AV techs with shift scheduling",
    automations: "Auto-send booking confirmations, event run sheets, and payment reminders",
    reporting: "Track occupancy rates, revenue per event, and booking lead time",
  }),
  visibility: eventVisibility,
  defaultChannels: ["email"],
};

const florist: PersonaQuestionConfig = {
  personaId: "florist",
  questions: universalQuestions("fl", {
    bookings: "Schedule floral consultations, trial arrangements, and event dates",
    projects: "Track floral projects from consultation through sourcing, arranging, to delivery",
    products: "Sell ready-made bouquets, plants, and subscription flowers",
    marketing: "Showcase arrangements on Instagram, collect reviews, and promote workshops",
    team: "Manage florists, delivery drivers, and their schedules",
    automations: "Auto-send order confirmations, delivery reminders, and seasonal promos",
    reporting: "Track revenue per event type, product sales, and seasonal trends",
  }),
  visibility: eventVisibility,
  defaultChannels: ["email", "instagram-dms"],
};

// ═══════════════════════════════════════════════════════════════════════════
// EDUCATION & COACHING
// ═══════════════════════════════════════════════════════════════════════════

const eduVisibility = { hiddenModules: ["jobs-projects"] as string[], hiddenFeatures: [{ moduleId: "quotes-invoicing", featureId: "tipping" }, { moduleId: "quotes-invoicing", featureId: "travel-costs" }, { moduleId: "quotes-invoicing", featureId: "quote-builder" }], hiddenAddons: ["soap-notes", "before-after", "loyalty"] as string[] };

const tutor: PersonaQuestionConfig = {
  personaId: "tutor",
  questions: [
    ...universalQuestions("tu", {
      bookings: "1-on-1 lessons, group sessions, and recurring weekly slots",
      projects: "Track student programs, exam prep plans, and curriculum progress",
      products: "Sell study guides, workbooks, and course materials",
      marketing: "Collect parent reviews, run referral programs, and promote subjects",
      team: "Manage other tutors, their subjects, and availability",
      automations: "Auto-send lesson reminders, homework follow-ups, and invoice nudges",
      reporting: "Track revenue per student, lesson completion rates, and subject demand",
    }),
    {
      id: "tu-timetable",
      text: "Do you run group classes on a timetable?",
      subtitle: "Publish a class timetable for students to browse and book.",
      activatesModules: ["class-timetable"],
      defaultOnFeatures: [{ moduleId: "class-timetable", featureId: "weekly-view" }],
    },
  ],
  visibility: eduVisibility,
  defaultChannels: ["email", "sms"],
};

const lifeBusinessCoach: PersonaQuestionConfig = {
  personaId: "life-business-coach",
  questions: universalQuestions("lc", {
    bookings: "1-on-1 sessions, group coaching calls, and recurring weekly check-ins",
    projects: "Track coaching programs, mastermind groups, and workshop deliverables",
    products: "Sell coaching packages, workbooks, and digital resources",
    marketing: "Share testimonials, thought leadership, and collect reviews",
    team: "Manage associate coaches, admin, and their calendars",
    automations: "Auto-send session reminders, accountability check-ins, and resource deliveries",
    reporting: "Track revenue per program, client progress, and retention rates",
  }),
  visibility: { ...eduVisibility, hiddenModules: [] },
  defaultChannels: ["email", "linkedin", "whatsapp"],
};

const musicTeacher: PersonaQuestionConfig = {
  personaId: "music-teacher",
  questions: [
    ...universalQuestions("mt", {
      bookings: "Recurring weekly lessons, make-up lessons, and group sessions",
      projects: "Track student progress through grades, recitals, and exam prep",
      products: "Sell sheet music, instrument accessories, and course materials",
      marketing: "Collect parent reviews, promote recitals, and run seasonal enrolment",
      team: "Manage other teachers, their instruments, and availability",
      automations: "Auto-send lesson reminders, practice assignments, and term invoices",
      reporting: "Track revenue per student, lesson attendance, and instrument demand",
    }),
    {
      id: "mt-timetable",
      text: "Do you run group lessons or ensemble sessions on a timetable?",
      subtitle: "Publish a lesson timetable for students to browse and book.",
      activatesModules: ["class-timetable"],
      defaultOnFeatures: [{ moduleId: "class-timetable", featureId: "weekly-view" }],
    },
  ],
  visibility: eduVisibility,
  defaultChannels: ["email", "sms"],
};

const drivingInstructor: PersonaQuestionConfig = {
  personaId: "driving-instructor",
  questions: universalQuestions("di", {
    bookings: "Lesson bookings, recurring weekly slots, and test-day scheduling",
    projects: "Track learner progress from first lesson to test readiness",
    products: "Sell lesson packs, test prep packages, and gift vouchers",
    marketing: "Collect Google reviews, run referral programs, and promote pass rates",
    team: "Manage other instructors, their cars, and availability",
    automations: "Auto-send lesson reminders, progress updates, and test-day prep tips",
    reporting: "Track pass rates, revenue per learner, and lesson utilisation",
  }),
  visibility: { ...eduVisibility, hiddenAddons: ["soap-notes", "before-after", "loyalty", "client-portal"] },
  defaultChannels: ["sms"],
};

const onlineCourseCreator: PersonaQuestionConfig = {
  personaId: "online-course-creator",
  questions: universalQuestions("oc", {
    bookings: "Schedule live Q&A calls, webinars, and coaching sessions",
    projects: "Track course creation from outline through filming, editing, to launch",
    products: "Manage your course catalog, pricing tiers, and bundle offers",
    marketing: "Run launch campaigns, webinar funnels, and social ads",
    team: "Manage editors, VAs, and community managers",
    automations: "Auto-send drip content, deadline reminders, and welcome sequences",
    reporting: "Track enrolments, completion rates, and revenue per course",
  }),
  visibility: { hiddenModules: ["jobs-projects", "bookings-calendar"], hiddenFeatures: [{ moduleId: "quotes-invoicing", featureId: "tipping" }, { moduleId: "quotes-invoicing", featureId: "travel-costs" }, { moduleId: "quotes-invoicing", featureId: "quote-builder" }], hiddenAddons: ["soap-notes", "before-after", "loyalty", "intake-forms", "win-back"] },
  defaultChannels: ["email"],
};

// ═══════════════════════════════════════════════════════════════════════════
// RETAIL & E-COMMERCE
// ═══════════════════════════════════════════════════════════════════════════

const retailVisibility = { hiddenModules: ["jobs-projects", "documents"] as string[], hiddenFeatures: [{ moduleId: "quotes-invoicing", featureId: "tipping" }, { moduleId: "quotes-invoicing", featureId: "travel-costs" }, { moduleId: "bookings-calendar", featureId: "group-class-booking" }], hiddenAddons: ["soap-notes", "before-after", "intake-forms", "client-portal"] as string[] };

const onlineStore: PersonaQuestionConfig = {
  personaId: "online-store",
  questions: [
    ...universalQuestions("os", {
      bookings: "Schedule consultations, personal shopping sessions, or pickups",
      projects: "Track custom orders, wholesale fulfillment, and seasonal campaigns",
      products: "Manage your product catalog with categories, variants, and stock levels",
      marketing: "Run email campaigns, social ads, and seasonal promotions",
      team: "Manage pickers, packers, and customer service staff",
      automations: "Auto-send order confirmations, shipping updates, and review requests",
      reporting: "Track sales, average order value, and customer lifetime value",
    }),
    {
      id: "os-loyalty",
      text: "Would you like a loyalty program for repeat customers?",
      subtitle: "Points per purchase, reward tiers, and referral credits.",
      activatesModules: ["loyalty"],
      defaultOnFeatures: [{ moduleId: "loyalty", featureId: "points-per-visit" }],
    },
  ],
  visibility: { ...retailVisibility, hiddenAddons: ["soap-notes", "before-after", "intake-forms", "client-portal", "memberships"] },
  defaultChannels: ["email"],
};

const boutiqueShop: PersonaQuestionConfig = {
  personaId: "boutique-shop",
  questions: [
    ...universalQuestions("bs", {
      bookings: "Schedule personal styling sessions, VIP previews, and consultations",
      projects: "Track custom orders, alterations, and seasonal collection launches",
      products: "Manage your inventory with categories, sizes, and stock levels",
      marketing: "Post new arrivals, run seasonal sales, and collect reviews",
      team: "Manage sales staff, stylists, and their schedules",
      automations: "Auto-send restock alerts, sale announcements, and loyalty rewards",
      reporting: "Track sales by category, top-selling items, and customer retention",
    }),
    {
      id: "bs-loyalty",
      text: "Would you like a loyalty program for regular customers?",
      subtitle: "Points per purchase and rewards for loyal shoppers.",
      activatesModules: ["loyalty"],
      defaultOnFeatures: [{ moduleId: "loyalty", featureId: "points-per-visit" }],
    },
  ],
  visibility: retailVisibility,
  defaultChannels: ["email", "instagram-dms"],
};

const handmadeArtisan: PersonaQuestionConfig = {
  personaId: "handmade-artisan",
  questions: universalQuestions("ha", {
    bookings: "Schedule market stalls, custom order consultations, and workshops",
    projects: "Track custom orders, commission pieces, and workshop preparation",
    products: "Manage your handmade catalog with materials, pricing, and stock levels",
    marketing: "Share your making process, market schedules, and collect reviews",
    team: "Manage workshop helpers, market staff, and their schedules",
    automations: "Auto-send order updates, market reminders, and restock notifications",
    reporting: "Track sales by product type, market vs online revenue, and material costs",
  }),
  visibility: { ...retailVisibility, hiddenAddons: ["soap-notes", "before-after", "intake-forms", "client-portal", "memberships"] },
  defaultChannels: ["email", "instagram-dms"],
};

const foodBeverage: PersonaQuestionConfig = {
  personaId: "food-beverage",
  questions: [
    ...universalQuestions("fb", {
      bookings: "Schedule tastings, catering consultations, and market appearances",
      projects: "Track wholesale orders, catering gigs, and seasonal product launches",
      products: "Manage your food catalog with categories, allergens, and stock levels",
      marketing: "Share food photography, seasonal launches, and collect reviews",
      team: "Manage kitchen staff, delivery drivers, and their schedules",
      automations: "Auto-send order confirmations, delivery updates, and reorder reminders",
      reporting: "Track sales by product, wholesale vs direct revenue, and seasonal trends",
    }),
    {
      id: "fb-loyalty",
      text: "Would you like a loyalty program for repeat customers?",
      subtitle: "Points per purchase, punch cards, and rewards.",
      activatesModules: ["loyalty"],
      defaultOnFeatures: [{ moduleId: "loyalty", featureId: "digital-punch-card" }],
    },
  ],
  visibility: retailVisibility,
  defaultChannels: ["email", "instagram-dms"],
};

// ═══════════════════════════════════════════════════════════════════════════
// MASTER MAP & EXPORTS
// ═══════════════════════════════════════════════════════════════════════════

export const PERSONA_QUESTIONS: PersonaQuestionsMap = {
  // Beauty & Wellness
  "hair-salon": hairSalon,
  "barber": barber,
  "nail-tech": nailTech,
  "lash-brow-tech": lashBrowTech,
  "makeup-artist": makeupArtist,
  "spa-massage": spaMassage,
  // Trades & Construction
  "plumber": plumber,
  "electrician": electrician,
  "builder-carpenter": builderCarpenter,
  "painter": painter,
  "hvac-technician": hvacTechnician,
  "landscaper": landscaper,
  "cleaner": cleaner,
  // Professional Services
  "accountant-bookkeeper": accountantBookkeeper,
  "lawyer-solicitor": lawyerSolicitor,
  "consultant": consultant,
  "real-estate-agent": realEstateAgent,
  "financial-advisor": financialAdvisor,
  "marketing-agency": marketingAgency,
  // Health & Fitness
  "personal-trainer": personalTrainer,
  "gym-studio-owner": gymStudioOwner,
  "yoga-pilates-studio": yogaPilatesStudio,
  "physio-chiro": physioChiro,
  "nutritionist": nutritionist,
  // Creative & Design
  "photographer": photographer,
  "graphic-designer": graphicDesigner,
  "web-designer-developer": webDesignerDeveloper,
  "videographer": videographer,
  "interior-designer": interiorDesigner,
  // Hospitality & Events
  "wedding-planner": weddingPlanner,
  "event-planner": eventPlanner,
  "caterer": caterer,
  "venue-manager": venueManager,
  "florist": florist,
  // Education & Coaching
  "tutor": tutor,
  "life-business-coach": lifeBusinessCoach,
  "music-teacher": musicTeacher,
  "driving-instructor": drivingInstructor,
  "online-course-creator": onlineCourseCreator,
  // Retail & E-commerce
  "online-store": onlineStore,
  "boutique-shop": boutiqueShop,
  "handmade-artisan": handmadeArtisan,
  "food-beverage": foodBeverage,
};

// ── Industry-agnostic fallback questions ──

const FALLBACK_QUESTIONS: DiscoveryQuestion[] = [
  {
    id: "fallback-bookings",
    text: "Do clients book appointments or sessions with you?",
    subtitle: "Manage your calendar and availability.",
    needsKey: "acceptBookings",
    activatesModules: ["bookings-calendar"],
    defaultOnFeatures: [
      { moduleId: "bookings-calendar", featureId: "booking-page" },
      { moduleId: "bookings-calendar", featureId: "booking-reminders" },
    ],
  },
  {
    id: "fallback-projects",
    text: "Do you manage projects or jobs?",
    subtitle: "Track tasks, deadlines, and deliverables.",
    needsKey: "manageProjects",
    activatesModules: ["jobs-projects"],
    defaultOnFeatures: [
      { moduleId: "jobs-projects", featureId: "job-kanban" },
      { moduleId: "jobs-projects", featureId: "file-attachments" },
    ],
  },
  {
    id: "fallback-products",
    text: "Do you sell products or services?",
    subtitle: "Manage your catalog, pricing, and inventory.",
    activatesModules: ["products"],
    defaultOnFeatures: [
      { moduleId: "products", featureId: "product-categories" },
      { moduleId: "products", featureId: "inventory-tracking" },
    ],
  },
  {
    id: "fallback-marketing",
    text: "Do you run marketing or promotions?",
    subtitle: "Campaigns, social media, reviews, and referrals.",
    needsKey: "runMarketing",
    activatesModules: ["marketing"],
    defaultOnFeatures: [
      { moduleId: "marketing", featureId: "social-scheduling" },
      { moduleId: "marketing", featureId: "review-collection" },
    ],
  },
  {
    id: "fallback-team",
    text: "Do you have a team?",
    subtitle: "Manage team members, roles, schedules, and permissions.",
    activatesModules: ["team"],
    defaultOnFeatures: [
      { moduleId: "team", featureId: "activity-log" },
    ],
  },
  {
    id: "fallback-automations",
    text: "Would you like to automate repetitive tasks?",
    subtitle: "Auto-send reminders, follow-ups, and status updates.",
    activatesModules: ["automations"],
    defaultOnFeatures: [
      { moduleId: "automations", featureId: "auto-reminders" },
    ],
  },
  {
    id: "fallback-reporting",
    text: "Do you want dashboards and reports?",
    subtitle: "Track revenue, goals, and business performance.",
    activatesModules: ["reporting"],
    defaultOnFeatures: [
      { moduleId: "reporting", featureId: "revenue-dashboard" },
    ],
  },
];

const FALLBACK_CONFIG: PersonaQuestionConfig = {
  personaId: "_fallback",
  questions: FALLBACK_QUESTIONS,
  visibility: { hiddenModules: [], hiddenFeatures: [], hiddenAddons: [] },
  defaultChannels: ["email"],
};

// ── Lookup helpers ──

/**
 * Get the question config for a specific persona.
 * Returns the persona-specific config if registered,
 * otherwise falls back to generic questions.
 */
export function getPersonaQuestions(personaId: string): PersonaQuestionConfig {
  return PERSONA_QUESTIONS[personaId] ?? FALLBACK_CONFIG;
}

/**
 * Get a generic fallback config for an industry when no persona is selected.
 * Uses the first persona in each industry as a reasonable representative.
 */
export function getIndustryFallbackQuestions(industryId: string): PersonaQuestionConfig | null {
  const fallbackMap: Record<string, string> = {
    "beauty-wellness": "hair-salon",
    "trades-construction": "plumber",
    "professional-services": "consultant",
    "health-fitness": "personal-trainer",
    "creative-services": "photographer",
    "hospitality-events": "wedding-planner",
    "education-coaching": "tutor",
    "retail-ecommerce": "online-store",
  };
  const fallbackPersona = fallbackMap[industryId];
  return fallbackPersona ? PERSONA_QUESTIONS[fallbackPersona] ?? null : null;
}

/**
 * Get the raw fallback questions (industry-agnostic).
 */
export function getFallbackQuestions(): DiscoveryQuestion[] {
  return FALLBACK_QUESTIONS;
}
