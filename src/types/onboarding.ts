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

export const INDUSTRIES = [
  "Hospitality",
  "Retail",
  "Health and Wellness",
  "Professional Services",
  "Trades and Construction",
  "Creative Services",
  "Education",
  "Other",
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
