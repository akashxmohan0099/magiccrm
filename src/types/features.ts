import { NeedsAssessment } from "./onboarding";

export interface SubFeature {
  id: string;
  label: string;
  description: string;
  defaultOn: boolean;
  requiresTeam?: boolean;
}

export interface FeatureBlock {
  id: string;
  name: string;
  icon: string;
  description: string;
  // Which Screen 2 need triggers this block
  triggeredBy?: keyof NeedsAssessment;
  // Auto-enabled when ANY of these needs are active (dependency logic)
  autoEnabledBy?: (keyof NeedsAssessment)[];
  // Always show regardless of answers
  alwaysShow?: boolean;
  subFeatures: SubFeature[];
}

export const FEATURE_BLOCKS: FeatureBlock[] = [
  // ── Core blocks (triggered by Screen 2 answers) ──────────────

  {
    id: "client-database",
    name: "Client Database",
    icon: "Users",
    description: "Your clients, all in one place.",
    triggeredBy: "manageCustomers",
    subFeatures: [
      { id: "client-profiles", label: "Client Profiles", description: "Contact details, notes, and history", defaultOn: true },
      { id: "client-tags", label: "Tags & Categories", description: "Group clients by tags or categories", defaultOn: false },
      { id: "segmentation-filters", label: "Segmentation Filters", description: "Filter by status, location, or type", defaultOn: false },
      { id: "follow-up-reminders", label: "Follow-Up Reminders", description: "Automatic follow-up reminders", defaultOn: true },
    ],
  },
  {
    id: "leads-pipeline",
    name: "Leads & Pipeline",
    icon: "Inbox",
    description: "Never lose track of a potential customer.",
    triggeredBy: "receiveInquiries",
    subFeatures: [
      { id: "lead-inbox", label: "Lead Inbox", description: "All incoming inquiries in one feed", defaultOn: true },
      { id: "pipeline-stages", label: "Pipeline Stages", description: "Track lead progress to conversion", defaultOn: true },
      { id: "web-forms", label: "Web Capture Forms", description: "Embeddable forms for your website or socials", defaultOn: true },
      { id: "follow-up-reminders", label: "Follow-Up Reminders", description: "So no lead goes cold", defaultOn: true },
      { id: "auto-assign-leads", label: "Auto-Assign Leads", description: "Route leads to team members", defaultOn: false, requiresTeam: true },
    ],
  },
  {
    id: "communication",
    name: "Communication",
    icon: "MessageCircle",
    description: "Every conversation, one inbox. Pick your channels.",
    triggeredBy: "communicateClients",
    autoEnabledBy: ["manageCustomers", "receiveInquiries"],
    subFeatures: [
      { id: "unified-inbox", label: "Unified Inbox", description: "All channels in one view", defaultOn: true },
      { id: "email", label: "Email", description: "Send and receive email from within the platform", defaultOn: true },
      { id: "sms", label: "SMS", description: "Text messaging to clients", defaultOn: false },
      { id: "instagram-dms", label: "Instagram DMs", description: "Direct messages on Instagram", defaultOn: false },
      { id: "facebook-messenger", label: "Facebook Messenger", description: "Messenger conversations", defaultOn: false },
      { id: "whatsapp", label: "WhatsApp", description: "WhatsApp messaging", defaultOn: false },
      { id: "linkedin", label: "LinkedIn Messaging", description: "LinkedIn conversations", defaultOn: false },
    ],
  },
  {
    id: "bookings-calendar",
    name: "Bookings & Calendar",
    icon: "Calendar",
    description: "Let customers book you without the back and forth.",
    triggeredBy: "acceptBookings",
    subFeatures: [
      { id: "booking-page", label: "Online Booking Page", description: "Shareable link where clients pick a slot", defaultOn: true },
      { id: "availability", label: "Availability Management", description: "Set your working hours, breaks, and days off", defaultOn: true },
      { id: "booking-reminders", label: "Automated Reminders", description: "Email or SMS reminders before appointments", defaultOn: true },
      { id: "recurring-bookings", label: "Recurring Appointments", description: "Set up repeat bookings on a schedule", defaultOn: false },
      { id: "team-calendar", label: "Team Calendar View", description: "See all team members' schedules in one view", defaultOn: false, requiresTeam: true },
      { id: "google-cal", label: "Google Calendar Sync", description: "Two-way sync with Google Calendar", defaultOn: false },
      { id: "outlook-cal", label: "Outlook Calendar Sync", description: "Two-way sync with Outlook / Microsoft 365", defaultOn: false },
    ],
  },
  {
    id: "quotes-invoicing",
    name: "Quotes & Invoicing",
    icon: "Receipt",
    description: "Quote the job, send the invoice, get paid.",
    triggeredBy: "sendInvoices",
    subFeatures: [
      { id: "invoice-builder", label: "Invoice Builder", description: "Create professional invoices with your branding", defaultOn: true },
      { id: "quote-builder", label: "Quote & Estimate Builder", description: "Send quotes that convert to invoices on approval", defaultOn: true },
      { id: "invoice-templates", label: "Reusable Invoice Templates", description: "Save templates for common jobs", defaultOn: true },
      { id: "recurring-invoices", label: "Recurring Invoices", description: "Auto-generate invoices on a schedule", defaultOn: false },
      { id: "late-reminders", label: "Late Payment Reminders", description: "Automated nudges for overdue invoices", defaultOn: true },
    ],
  },
  {
    id: "jobs-projects",
    name: "Jobs & Projects",
    icon: "FolderKanban",
    description: "Track every job from start to finish.",
    triggeredBy: "manageProjects",
    subFeatures: [
      { id: "job-tracker", label: "Job Tracker", description: "Track jobs with customizable stages", defaultOn: true },
      { id: "task-lists", label: "Task Lists & Checklists", description: "Break projects into actionable steps", defaultOn: true },
      { id: "due-dates", label: "Due Dates & Progress", description: "Set deadlines and track progress", defaultOn: true },
      { id: "file-attachments", label: "File Attachments", description: "Attach files and photos per job", defaultOn: true },
      { id: "task-delegation", label: "Task Delegation", description: "Assign tasks to team members", defaultOn: false, requiresTeam: true },
      { id: "time-tracking", label: "Time Tracking", description: "Log hours spent on tasks and projects", defaultOn: false },
    ],
  },
  {
    id: "marketing",
    name: "Marketing",
    icon: "Megaphone",
    description: "Get the word out and bring them back.",
    triggeredBy: "runMarketing",
    subFeatures: [
      { id: "email-campaigns", label: "Email Campaigns", description: "Design and send newsletters and promotions", defaultOn: true },
      { id: "campaign-templates", label: "Campaign Templates", description: "Pre-built templates for common campaigns", defaultOn: true },
      { id: "audience-segmentation", label: "Audience Segmentation", description: "Target campaigns to specific client groups", defaultOn: false },
      { id: "social-scheduling", label: "Social Media Scheduling", description: "Schedule posts to Instagram, Facebook, etc.", defaultOn: false },
      { id: "review-collection", label: "Review Collection", description: "Request and manage client reviews", defaultOn: false },
      { id: "coupon-codes", label: "Coupon & Discount Codes", description: "Create promotional offers for clients", defaultOn: false },
    ],
  },
  {
    id: "support",
    name: "Support",
    icon: "Headphones",
    description: "Keep clients happy after the job\u2019s done.",
    triggeredBy: "handleSupport",
    subFeatures: [
      { id: "support-tracker", label: "Support Request Tracker", description: "Log, track, and resolve support requests", defaultOn: true },
      { id: "auto-responses", label: "Auto-Responses", description: "Instant replies to common questions", defaultOn: true },
      { id: "assign-requests", label: "Assign Requests", description: "Route requests to team members", defaultOn: false, requiresTeam: true },
      { id: "satisfaction-ratings", label: "Satisfaction Ratings", description: "Collect client satisfaction scores", defaultOn: false },
      { id: "knowledge-base", label: "Knowledge Base", description: "Self-serve help articles for clients", defaultOn: false },
    ],
  },
  {
    id: "documents",
    name: "Documents",
    icon: "FileText",
    description: "Contracts, files, and signatures sorted.",
    triggeredBy: "manageDocuments",
    subFeatures: [
      { id: "file-storage", label: "File Storage", description: "Upload and organize business documents", defaultOn: true },
      { id: "contract-templates", label: "Contract Templates", description: "Reusable formats for common agreements", defaultOn: false },
      { id: "e-signatures", label: "E-Signatures", description: "Get documents signed digitally", defaultOn: false },
      { id: "client-sharing", label: "Client File Sharing", description: "Share files securely with clients", defaultOn: true },
    ],
  },

  // ── Auto-enabled dependency blocks ────────────────────────────

  {
    id: "payments",
    name: "Payments",
    icon: "CreditCard",
    description: "Stay on top of who\u2019s paid and who hasn\u2019t.",
    autoEnabledBy: ["sendInvoices"],
    subFeatures: [
      { id: "payment-dashboard", label: "Payment Status Dashboard", description: "See paid, pending, and overdue at a glance", defaultOn: true },
      { id: "payment-reminders", label: "Overdue Payment Reminders", description: "Automated reminders for overdue payments", defaultOn: true },
      { id: "revenue-log", label: "Revenue Log", description: "Running record of all incoming payments", defaultOn: true },
      { id: "refund-tracking", label: "Refund Tracking", description: "Log and manage client refunds", defaultOn: false },
    ],
  },
  {
    id: "automations",
    name: "Automations",
    icon: "Zap",
    description: "Let your CRM do the boring stuff.",
    autoEnabledBy: ["acceptBookings", "sendInvoices", "manageProjects"],
    subFeatures: [
      { id: "auto-status", label: "Auto Status Updates", description: "Move items through stages automatically", defaultOn: true },
      { id: "trigger-actions", label: "Trigger Actions", description: "When X happens, automatically do Y", defaultOn: false },
      { id: "scheduled-tasks", label: "Scheduled Recurring Tasks", description: "Create tasks that repeat on a schedule", defaultOn: false },
      { id: "notifications", label: "Smart Notifications", description: "Get alerted when important events happen", defaultOn: true },
      { id: "email-automations", label: "Email Automations", description: "Send automated emails based on triggers", defaultOn: false },
    ],
  },

  // ── Always-visible block ──────────────────────────────────────

  {
    id: "reporting",
    name: "Reporting",
    icon: "BarChart3",
    description: "See how your business is actually doing.",
    alwaysShow: true,
    subFeatures: [
      { id: "overview-dashboard", label: "Overview Dashboard", description: "Key metrics and activity at a glance", defaultOn: true },
      { id: "activity-feed", label: "Activity Feed", description: "Real-time log of all actions across your platform", defaultOn: true },
      { id: "export-reports", label: "Export Reports", description: "Download data as CSV or PDF", defaultOn: true },
      { id: "goal-tracking", label: "Goal Tracking", description: "Set targets and monitor progress over time", defaultOn: false },
      { id: "custom-dashboards", label: "Custom Dashboards", description: "Build personalized views with the metrics you care about", defaultOn: false },
    ],
  },
];
