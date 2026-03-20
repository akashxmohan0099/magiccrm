import { NeedsAssessment } from "./onboarding";

export interface SubFeature {
  id: string;
  label: string;
  description: string;
  defaultOn: boolean;
  requiresTeam?: boolean;
}

export interface CoreFeature {
  id: string;
  label: string;
  description: string;
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
  // Features intrinsic to this module — always on when module is enabled
  coreFeatures: CoreFeature[];
  // Toggleable features the user can enable/disable
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
    coreFeatures: [
      { id: "client-profiles", label: "Client Profiles", description: "Contact details, notes, and history" },
    ],
    subFeatures: [
      { id: "client-tags", label: "Tags & Categories", description: "Group clients by tags or categories", defaultOn: false },
      { id: "segmentation-filters", label: "Segmentation Filters", description: "Filter by status, location, or type", defaultOn: false },
      { id: "follow-up-reminders", label: "Follow-Up Reminders", description: "Automatic follow-up reminders", defaultOn: true },
      { id: "birthday-reminders", label: "Birthday Reminders", description: "Get reminded on client birthdays and milestones", defaultOn: false },
      { id: "import-export", label: "Import / Export", description: "Bulk import from CSV or export your full client list", defaultOn: true },
      { id: "merge-duplicates", label: "Merge Duplicates", description: "Detect and merge duplicate client records", defaultOn: false },
      { id: "activity-timeline", label: "Activity Timeline", description: "See every interaction with a client in one chronological view", defaultOn: true },
      { id: "auto-inactive-flag", label: "Auto-Inactive Flag", description: "Automatically mark clients inactive after X days of no activity", defaultOn: false },
      { id: "custom-fields-builder", label: "Custom Fields", description: "Add your own fields to client profiles beyond the defaults", defaultOn: false },
      { id: "client-notes", label: "Internal Notes", description: "Private notes on clients only visible to your team", defaultOn: true },
      { id: "client-lifecycle-stages", label: "Lifecycle Stages", description: "Assign clients to stages like Active, VIP, Churned with auto-transitions", defaultOn: false },
      { id: "client-referral-tracking", label: "Referral Tracking", description: "Record which client referred whom and count referrals", defaultOn: false },
      { id: "client-credit-balance", label: "Client Credits", description: "Maintain a running credit balance for prepayments and overpayments", defaultOn: false },
      { id: "bulk-actions", label: "Bulk Actions", description: "Select multiple clients to bulk-tag, archive, or assign at once", defaultOn: false },
      { id: "client-source-tracking", label: "Acquisition Source", description: "Record how each client was acquired — referral, walk-in, web, social", defaultOn: false },
    ],
  },
  {
    id: "leads-pipeline",
    name: "Leads & Pipeline",
    icon: "Inbox",
    description: "Never lose track of a potential customer.",
    triggeredBy: "receiveInquiries",
    coreFeatures: [
      { id: "lead-inbox", label: "Lead Inbox", description: "All incoming inquiries in one feed" },
      { id: "pipeline-stages", label: "Pipeline Stages", description: "Track lead progress to conversion" },
    ],
    subFeatures: [
      { id: "web-forms", label: "Web Capture Forms", description: "Embeddable inquiry form for your website, socials, or shareable link", defaultOn: true },
      { id: "lead-follow-up-reminders", label: "Follow-Up Reminders", description: "Auto-remind you to follow up so no lead goes cold", defaultOn: true },
      { id: "auto-assign-leads", label: "Auto-Assign Leads", description: "Automatically route new inquiries to a team member", defaultOn: false, requiresTeam: true },
      { id: "lead-scoring", label: "Lead Scoring", description: "Auto-prioritise leads as hot, warm, or cold based on activity", defaultOn: false },
      { id: "lead-source-tracking", label: "Source Tracking", description: "Track where each lead came from — website, Instagram, referral, etc.", defaultOn: false },
      { id: "auto-response", label: "Instant Auto-Response", description: "Auto-reply to new inquiries so they know you received it", defaultOn: false },
      { id: "auto-tag-from-form", label: "Auto-Tag from Form", description: "Automatically tag leads based on their form answers", defaultOn: false },
      { id: "lead-to-client", label: "Lead → Client Conversion", description: "One-click convert a lead to a full client record with history", defaultOn: true },
      { id: "lead-lost-reason", label: "Lost Reason Capture", description: "Prompt for a reason when marking a lead as lost", defaultOn: false },
      { id: "lead-notes-log", label: "Notes & Activity Log", description: "Internal notes and chronological activity history per lead", defaultOn: true },
      { id: "duplicate-lead-detection", label: "Duplicate Detection", description: "Flag when a new submission matches an existing lead or client", defaultOn: false },
      { id: "custom-pipeline-stages", label: "Custom Pipeline Stages", description: "Rename, add, reorder, or colour-code your pipeline stages", defaultOn: false },
    ],
  },
  {
    id: "communication",
    name: "Communication",
    icon: "MessageCircle",
    description: "Every conversation, one inbox. Pick your channels.",
    triggeredBy: "communicateClients",
    autoEnabledBy: ["manageCustomers", "receiveInquiries"],
    coreFeatures: [
      { id: "unified-inbox", label: "Unified Inbox", description: "All channels in one view" },
    ],
    subFeatures: [
      { id: "email", label: "Email", description: "Send and receive email from within the platform", defaultOn: true },
      { id: "sms", label: "SMS", description: "Text messaging to clients", defaultOn: false },
      { id: "instagram-dms", label: "Instagram DMs", description: "Direct messages on Instagram", defaultOn: false },
      { id: "facebook-messenger", label: "Facebook Messenger", description: "Messenger conversations", defaultOn: false },
      { id: "whatsapp", label: "WhatsApp", description: "WhatsApp messaging", defaultOn: false },
      { id: "linkedin", label: "LinkedIn Messaging", description: "LinkedIn conversations", defaultOn: false },
      { id: "canned-responses", label: "Canned Responses", description: "Save and insert pre-written reply templates", defaultOn: false },
      { id: "scheduled-send", label: "Scheduled Send", description: "Write a message now, choose when it gets delivered", defaultOn: false },
      { id: "after-hours-reply", label: "After-Hours Auto-Reply", description: "Auto-respond when messages arrive outside business hours", defaultOn: false },
      { id: "contact-timeline", label: "Contact Timeline", description: "See all messages with a client across every channel in one thread", defaultOn: true },
      { id: "template-variables", label: "Template Variables", description: "Use {name}, {date}, {service} in message templates", defaultOn: false },
      { id: "unread-notifications", label: "Unread Alerts", description: "Get notified when a message sits unread for too long", defaultOn: false },
      { id: "bulk-messaging", label: "Bulk Messaging", description: "Send a templated message to a filtered group of clients at once", defaultOn: false },
      { id: "conversation-assignment", label: "Conversation Assignment", description: "Assign a conversation to a specific team member to own", defaultOn: false, requiresTeam: true },
    ],
  },
  {
    id: "bookings-calendar",
    name: "Bookings & Calendar",
    icon: "Calendar",
    description: "Let customers book you without the back and forth.",
    triggeredBy: "acceptBookings",
    coreFeatures: [
      { id: "availability", label: "Availability Management", description: "Set your working hours, breaks, and days off" },
    ],
    subFeatures: [
      { id: "booking-page", label: "Online Booking Page", description: "Shareable link where clients pick a slot", defaultOn: true },
      { id: "booking-reminders", label: "Automated Reminders", description: "Email or SMS reminders before appointments", defaultOn: true },
      { id: "recurring-bookings", label: "Recurring Appointments", description: "Set up repeat bookings on a schedule", defaultOn: false },
      { id: "team-calendar", label: "Team Calendar View", description: "See all team members' schedules in one view", defaultOn: false, requiresTeam: true },
      { id: "google-cal", label: "Google Calendar Sync", description: "Two-way sync with Google Calendar", defaultOn: false },
      { id: "outlook-cal", label: "Outlook Calendar Sync", description: "Two-way sync with Outlook / Microsoft 365", defaultOn: false },
      { id: "waitlist", label: "Waitlist", description: "Clients join a queue for full slots, auto-notified when one opens", defaultOn: false },
      { id: "booking-deposits", label: "Booking Deposits", description: "Require a deposit at booking to reduce no-shows", defaultOn: false },
      { id: "buffer-time", label: "Buffer Time", description: "Auto-add padding between appointments for cleanup or travel", defaultOn: false },
      { id: "no-show-fees", label: "No-Show Protection", description: "Flag repeat no-showers and optionally charge a fee", defaultOn: false },
      { id: "cancellation-policy", label: "Cancellation Policy", description: "Enforce a cancellation window — late cancels get flagged or charged", defaultOn: false },
      { id: "pre-booking-form", label: "Pre-Booking Questionnaire", description: "Ask clients to fill out a form before their appointment", defaultOn: false },
      { id: "post-appointment-followup", label: "Post-Appointment Follow-Up", description: "Auto-send a thank you or feedback request after the visit", defaultOn: false },
      { id: "multi-service-booking", label: "Multi-Service Booking", description: "Client books multiple services in a single appointment", defaultOn: false },
      { id: "group-class-booking", label: "Group / Class Booking", description: "Book multiple clients into a single time slot for classes or workshops", defaultOn: false },
      { id: "resource-room-assignment", label: "Room / Resource Assignment", description: "Assign bookings to specific rooms, chairs, or equipment", defaultOn: false },
      { id: "block-time-off", label: "Block Time Off", description: "Block holidays, personal time, or breaks on the calendar", defaultOn: true },
      { id: "booking-confirmation-flow", label: "Booking Confirmation", description: "New bookings land as pending until manually or auto-confirmed", defaultOn: false },
    ],
  },
  {
    id: "quotes-invoicing",
    name: "Quotes & Invoicing",
    icon: "Receipt",
    description: "Quote the job, send the invoice, get paid.",
    triggeredBy: "sendInvoices",
    coreFeatures: [
      { id: "invoice-builder", label: "Invoice Builder", description: "Create professional invoices with your branding" },
    ],
    subFeatures: [
      { id: "quote-builder", label: "Quote & Estimate Builder", description: "Send quotes that convert to invoices on approval", defaultOn: true },
      { id: "invoice-templates", label: "Reusable Invoice Templates", description: "Save templates for common jobs", defaultOn: true },
      { id: "recurring-invoices", label: "Recurring Invoices", description: "Auto-generate invoices on a schedule", defaultOn: false },
      { id: "late-reminders", label: "Late Payment Reminders", description: "Automated nudges for overdue invoices", defaultOn: true },
      { id: "tipping", label: "Tipping", description: "Clients can add a tip when paying an invoice online", defaultOn: false },
      { id: "partial-payments", label: "Partial Payments", description: "Accept deposits or split payments and track the balance", defaultOn: false },
      { id: "auto-tax", label: "Auto Tax Calculation", description: "Auto-calculate GST or VAT based on your location", defaultOn: false },
      { id: "quote-to-invoice", label: "Quote → Invoice Conversion", description: "Convert an accepted quote to an invoice with one click", defaultOn: true },
      { id: "payment-links", label: "Payment Links", description: "Generate a shareable link so clients can pay online instantly", defaultOn: false },
      { id: "overdue-escalation", label: "Overdue Escalation", description: "Auto-escalate overdue invoices — reminder → warning → final notice", defaultOn: false },
      { id: "line-item-discounts", label: "Line Item Discounts", description: "Apply percentage or fixed discounts to individual line items", defaultOn: false },
      { id: "invoice-numbering", label: "Custom Invoice Numbers", description: "Customise invoice number format and starting number", defaultOn: false },
      { id: "credit-notes", label: "Credit Notes", description: "Issue credit notes for returns, errors, or goodwill adjustments", defaultOn: false },
      { id: "quote-expiry", label: "Quote Expiry Date", description: "Quotes auto-expire if not accepted by the deadline", defaultOn: false },
      { id: "invoice-status-workflow", label: "Invoice Status Workflow", description: "Track Draft → Sent → Viewed → Paid → Overdue automatically", defaultOn: true },
      { id: "client-invoice-portal", label: "Client Invoice Page", description: "Clients view, approve, and download invoices from a branded page", defaultOn: false },
    ],
  },
  {
    id: "jobs-projects",
    name: "Jobs & Projects",
    icon: "FolderKanban",
    description: "Track every job from start to finish.",
    triggeredBy: "manageProjects",
    coreFeatures: [
      { id: "job-tracker", label: "Job Tracker", description: "Track jobs with customizable stages" },
      { id: "task-lists", label: "Task Lists & Checklists", description: "Break projects into actionable steps" },
      { id: "due-dates", label: "Due Dates & Progress", description: "Set deadlines and track progress" },
    ],
    subFeatures: [
      { id: "file-attachments", label: "File Attachments", description: "Attach files and photos per job", defaultOn: true },
      { id: "task-delegation", label: "Task Delegation", description: "Assign tasks to team members", defaultOn: false, requiresTeam: true },
      { id: "time-tracking", label: "Time Tracking", description: "Log hours spent on tasks and projects", defaultOn: false },
      { id: "expense-tracking", label: "Expense Tracking", description: "Log costs against a job to see true profit", defaultOn: false },
      { id: "recurring-jobs", label: "Recurring Jobs", description: "Auto-create repeat jobs on a schedule", defaultOn: false },
      { id: "job-templates", label: "Job Templates", description: "Save reusable templates for common job types", defaultOn: false },
      { id: "client-approval", label: "Client Approval", description: "Send job scope to client for sign-off before starting", defaultOn: false },
      { id: "progress-updates", label: "Progress Notifications", description: "Auto-notify the client when a job moves to the next stage", defaultOn: false },
      { id: "job-kanban", label: "Job Kanban Board", description: "Drag-and-drop board view of jobs across workflow stages", defaultOn: true },
      { id: "job-priority", label: "Job Prioritisation", description: "Mark jobs as Low, Medium, High, or Urgent with visual indicators", defaultOn: false },
      { id: "profitability-summary", label: "Profitability Summary", description: "Auto-calculate profit per job from revenue minus time and expenses", defaultOn: false },
      { id: "custom-job-stages", label: "Custom Job Stages", description: "Rename, add, reorder, or colour-code your workflow stages", defaultOn: false },
      { id: "job-to-invoice", label: "Job → Invoice", description: "Generate an invoice from a completed job with tracked hours and expenses pre-filled", defaultOn: true },
    ],
  },
  {
    id: "marketing",
    name: "Marketing",
    icon: "Megaphone",
    description: "Get the word out and bring them back.",
    triggeredBy: "runMarketing",
    coreFeatures: [
      { id: "email-campaigns", label: "Email Campaigns", description: "Design and send newsletters and promotions" },
      { id: "campaign-templates", label: "Campaign Templates", description: "Pre-built templates for common campaigns" },
    ],
    subFeatures: [
      { id: "audience-segmentation", label: "Audience Segmentation", description: "Target campaigns to specific client groups", defaultOn: false },
      { id: "social-scheduling", label: "Social Media Scheduling", description: "Schedule posts to Instagram, Facebook, etc.", defaultOn: false },
      { id: "review-collection", label: "Review Collection", description: "Request and manage client reviews", defaultOn: false },
      { id: "coupon-codes", label: "Coupon & Discount Codes", description: "Create promotional offers for clients", defaultOn: false },
      { id: "email-sequences", label: "Email Sequences", description: "Multi-step drip campaigns triggered by events", defaultOn: false },
      { id: "campaign-analytics", label: "Campaign Performance", description: "Track open rates, click rates, and conversions per campaign", defaultOn: false },
      { id: "unsubscribe-management", label: "Unsubscribe Management", description: "Handle opt-outs and stay compliant automatically", defaultOn: true },
      { id: "send-time-optimization", label: "Smart Send Time", description: "Auto-pick the best time to send based on past open behaviour", defaultOn: false },
      { id: "ab-subject-lines", label: "A/B Subject Lines", description: "Test two subject lines on a small group, auto-send the winner", defaultOn: false },
      { id: "referral-program", label: "Referral Program", description: "Clients share a link — when someone books, both get a reward", defaultOn: false },
      { id: "bounce-tracking", label: "Bounce & Complaint Tracking", description: "Track bounces and spam complaints to auto-suppress bad addresses", defaultOn: false },
    ],
  },
  {
    id: "support",
    name: "Support",
    icon: "Headphones",
    description: "Keep clients happy after the job\u2019s done.",
    triggeredBy: "handleSupport",
    coreFeatures: [
      { id: "support-tracker", label: "Support Request Tracker", description: "Log, track, and resolve support requests" },
    ],
    subFeatures: [
      { id: "auto-responses", label: "Auto-Responses", description: "Instant replies to common questions", defaultOn: true },
      { id: "assign-requests", label: "Assign Requests", description: "Route requests to team members", defaultOn: false, requiresTeam: true },
      { id: "satisfaction-ratings", label: "Satisfaction Ratings", description: "Collect client satisfaction scores", defaultOn: false },
      { id: "knowledge-base", label: "Knowledge Base", description: "Self-serve help articles for clients", defaultOn: false },
      { id: "sla-timers", label: "SLA Timers", description: "Set response time targets and get alerted when approaching deadline", defaultOn: false },
      { id: "ticket-escalation", label: "Ticket Escalation", description: "Auto-escalate unresolved tickets after X hours", defaultOn: false },
      { id: "satisfaction-survey-trigger", label: "Post-Resolution Survey", description: "Auto-send a satisfaction survey when a ticket is closed", defaultOn: false },
      { id: "ticket-priority", label: "Ticket Priority Levels", description: "Mark tickets as Low, Medium, High, Critical with visual indicators", defaultOn: true },
      { id: "ticket-categories", label: "Ticket Categories", description: "Categorise tickets by type for filtering and reporting", defaultOn: false },
      { id: "internal-ticket-notes", label: "Internal Notes", description: "Private notes on tickets only visible to your team", defaultOn: true },
      { id: "ticket-to-job", label: "Ticket → Job Conversion", description: "Convert a support request into a job when it requires work", defaultOn: false },
    ],
  },
  {
    id: "documents",
    name: "Documents",
    icon: "FileText",
    description: "Contracts, files, and signatures sorted.",
    triggeredBy: "manageDocuments",
    coreFeatures: [
      { id: "file-storage", label: "File Storage", description: "Upload and organize business documents" },
      { id: "client-sharing", label: "Client File Sharing", description: "Share files securely with clients" },
    ],
    subFeatures: [
      { id: "contract-templates", label: "Contract Templates", description: "Reusable formats for common agreements", defaultOn: false },
      { id: "e-signatures", label: "E-Signatures", description: "Get documents signed digitally", defaultOn: false },
      { id: "auto-attach-to-job", label: "Auto-Attach to Job", description: "Documents auto-link to their related job or project", defaultOn: true },
      { id: "expiry-tracking", label: "Expiry Tracking", description: "Get alerted when a contract or document is about to expire", defaultOn: false },
      { id: "version-history", label: "Version History", description: "Track changes across document versions", defaultOn: false },
      { id: "document-tags", label: "Document Tags", description: "Organise documents by type — contract, receipt, ID, photo", defaultOn: false },
      { id: "doc-template-variables", label: "Template Variables", description: "Auto-fill {client_name}, {date}, {service} into contract templates", defaultOn: false },
      { id: "document-request", label: "Request from Client", description: "Request a client upload a specific document with a status tracker", defaultOn: false },
    ],
  },

  {
    id: "products",
    name: "Products & Services",
    icon: "Package",
    description: "Your product and service catalog.",
    autoEnabledBy: ["sendInvoices", "acceptBookings"],
    coreFeatures: [
      { id: "product-catalog", label: "Product Catalog", description: "Products and services with name, description, and price" },
    ],
    subFeatures: [
      { id: "product-categories", label: "Categories", description: "Group products and services into categories", defaultOn: true },
      { id: "inventory-tracking", label: "Inventory Tracking", description: "Track stock levels with low-stock alerts", defaultOn: false },
      { id: "price-variants", label: "Price Variants", description: "Multiple pricing tiers per product — small, medium, large", defaultOn: false },
      { id: "bundle-builder", label: "Bundle / Package Builder", description: "Combine multiple items into a discounted package", defaultOn: false },
      { id: "cost-margins", label: "Cost Price & Margins", description: "Record cost price alongside sell price to see margins", defaultOn: false },
      { id: "service-addons", label: "Service Add-Ons", description: "Optional extras clients can add to a service", defaultOn: false },
    ],
  },

  {
    id: "team",
    name: "Team",
    icon: "UsersRound",
    description: "Manage your team, assign roles, and collaborate.",
    autoEnabledBy: ["manageCustomers", "manageProjects"],
    coreFeatures: [
      { id: "team-roster", label: "Team Roster", description: "Add and manage team members with roles" },
      { id: "role-permissions", label: "Role Permissions", description: "Control who can access what" },
    ],
    subFeatures: [
      { id: "activity-log", label: "Team Activity Log", description: "See who did what and when", defaultOn: true },
      { id: "workload-view", label: "Workload View", description: "See each member's assigned tasks and bookings", defaultOn: false },
      { id: "availability-per-member", label: "Member Availability", description: "Each team member sets their own working hours", defaultOn: false },
      { id: "performance-dashboard", label: "Performance Dashboard", description: "Revenue, bookings, and tasks completed per team member", defaultOn: false },
      { id: "commission-tracking", label: "Commission Tracking", description: "Track commission or bonus per team member based on sales", defaultOn: false },
      { id: "shift-scheduling", label: "Shift Scheduling", description: "Create and assign shifts with a visual weekly planner", defaultOn: false },
      { id: "time-off-requests", label: "Time-Off Requests", description: "Team members request PTO — managers approve or deny", defaultOn: false },
    ],
  },

  // ── Auto-enabled dependency blocks ────────────────────────────

  {
    id: "payments",
    name: "Payments",
    icon: "CreditCard",
    description: "Stay on top of who\u2019s paid and who hasn\u2019t.",
    autoEnabledBy: ["sendInvoices"],
    coreFeatures: [
      { id: "payment-dashboard", label: "Payment Status Dashboard", description: "See paid, pending, and overdue at a glance" },
      { id: "revenue-log", label: "Revenue Log", description: "Running record of all incoming payments" },
    ],
    subFeatures: [
      { id: "payment-reminders", label: "Overdue Payment Reminders", description: "Automated reminders for overdue payments", defaultOn: true },
      { id: "refund-tracking", label: "Refund Tracking", description: "Log and manage client refunds", defaultOn: false },
      { id: "payment-receipts", label: "Auto Payment Receipts", description: "Auto-send a receipt when a payment is recorded", defaultOn: true },
      { id: "revenue-by-service", label: "Revenue by Service", description: "See which services generate the most revenue", defaultOn: false },
      { id: "payment-method-tracking", label: "Payment Method Tracking", description: "Record how each payment was made — cash, card, bank transfer", defaultOn: true },
      { id: "outstanding-balance-report", label: "Outstanding Balances", description: "Summary view of all clients with unpaid balances", defaultOn: false },
      { id: "payment-plans", label: "Payment Plans", description: "Split a large invoice into scheduled installments", defaultOn: false },
      { id: "write-off", label: "Write-Off / Bad Debt", description: "Mark an invoice as uncollectable and remove from totals", defaultOn: false },
      { id: "aging-report", label: "Aging Report", description: "Categorise outstanding invoices by 30, 60, 90+ days overdue", defaultOn: false },
    ],
  },
  {
    id: "automations",
    name: "Automations",
    icon: "Zap",
    description: "Let your CRM do the boring stuff.",
    autoEnabledBy: ["acceptBookings", "sendInvoices", "manageProjects"],
    coreFeatures: [
      { id: "auto-status", label: "Auto Status Updates", description: "Move items through stages automatically" },
      { id: "trigger-actions", label: "Trigger Actions", description: "When X happens, automatically do Y" },
      { id: "notifications", label: "Smart Notifications", description: "Get alerted when important events happen" },
    ],
    subFeatures: [
      { id: "scheduled-tasks", label: "Scheduled Recurring Tasks", description: "Create tasks that repeat on a schedule", defaultOn: false },
      { id: "email-automations", label: "Email Automations", description: "Send automated emails based on triggers", defaultOn: false },
      { id: "conditional-logic", label: "Conditional Logic", description: "If X then Y, else Z — branching automation paths", defaultOn: false },
      { id: "delay-steps", label: "Delay Steps", description: "Wait X hours or days before the next action fires", defaultOn: false },
      { id: "automation-templates", label: "Automation Templates", description: "Pre-built recipes for common workflows like new-lead follow-up", defaultOn: true },
      { id: "automation-log", label: "Automation Activity Log", description: "History of every automation run with its outcome", defaultOn: true },
      { id: "field-update-action", label: "Field Update Action", description: "Automation that updates a field value on a record", defaultOn: false },
      { id: "create-record-action", label: "Create Record Action", description: "Automation that creates a new task, follow-up, or note", defaultOn: false },
    ],
  },

  // ── Always-visible block ──────────────────────────────────────

  {
    id: "reporting",
    name: "Reporting",
    icon: "BarChart3",
    description: "See how your business is actually doing.",
    alwaysShow: true,
    coreFeatures: [
      { id: "overview-dashboard", label: "Overview Dashboard", description: "Key metrics and activity at a glance" },
      { id: "activity-feed", label: "Activity Feed", description: "Real-time log of all actions across your platform" },
    ],
    subFeatures: [
      { id: "export-reports", label: "Export Reports", description: "Download data as CSV or PDF", defaultOn: true },
      { id: "goal-tracking", label: "Goal Tracking", description: "Set targets and monitor progress over time", defaultOn: false },
      { id: "custom-dashboards", label: "Custom Dashboards", description: "Build personalized views with the metrics you care about", defaultOn: false },
      { id: "scheduled-reports", label: "Scheduled Reports", description: "Auto-email a report summary to yourself weekly or monthly", defaultOn: false },
      { id: "revenue-breakdown", label: "Revenue Breakdown", description: "See income by client, service, month, or team member", defaultOn: false },
      { id: "lead-conversion-report", label: "Lead Conversion Report", description: "Track leads by source, stage, and conversion rate over time", defaultOn: false },
      { id: "client-retention-report", label: "Client Retention Report", description: "Retention rate, churn rate, and average client lifespan", defaultOn: false },
      { id: "booking-utilization-report", label: "Booking Utilisation", description: "Percentage of available slots filled per member or service", defaultOn: false },
      { id: "comparison-periods", label: "Comparison Periods", description: "Compare this month vs last, this quarter vs last year", defaultOn: false },
      { id: "pipeline-value-report", label: "Pipeline Value Report", description: "Total estimated value of leads in each pipeline stage", defaultOn: false },
      { id: "tax-summary-report", label: "Tax Summary Report", description: "Total tax collected by period for tax filing", defaultOn: false },
      { id: "profit-loss-summary", label: "Profit & Loss Summary", description: "Revenue minus expenses by period", defaultOn: false },
    ],
  },
];

// ── Add-on feature blocks (shown in the add-ons panel, not onboarding) ──

export interface AddonFeatureBlock {
  id: string;
  subFeatures: SubFeature[];
}

export const ADDON_FEATURE_BLOCKS: AddonFeatureBlock[] = [
  {
    id: "client-portal",
    subFeatures: [
      { id: "self-service-rebooking", label: "Self-Service Rebooking", description: "Clients reschedule or cancel from their portal", defaultOn: true },
      { id: "pay-from-portal", label: "Pay from Portal", description: "Clients view and pay invoices in the portal", defaultOn: true },
      { id: "portal-messaging", label: "Secure Messaging", description: "Clients message you through the portal", defaultOn: true },
      { id: "portal-branding", label: "Portal Branding", description: "Your logo, colours, and custom welcome message", defaultOn: false },
    ],
  },
  {
    id: "memberships",
    subFeatures: [
      { id: "session-pack-credits", label: "Session Pack Credits", description: "Sell N sessions, auto-deduct per visit", defaultOn: true },
      { id: "auto-recurring-billing", label: "Auto-Recurring Billing", description: "Charge members automatically on their billing cycle", defaultOn: true },
      { id: "freeze-pause", label: "Freeze / Pause", description: "Members pause without cancelling", defaultOn: false },
      { id: "expiry-alerts", label: "Expiry Alerts", description: "Auto-notify before a plan or pack expires", defaultOn: true },
      { id: "upgrade-downgrade", label: "Upgrade / Downgrade", description: "Client changes plan with prorated credit calculation", defaultOn: false },
      { id: "membership-revenue-report", label: "Membership Revenue Report", description: "Recurring revenue, churn, and active member count", defaultOn: false },
    ],
  },
  {
    id: "loyalty",
    subFeatures: [
      { id: "points-per-visit", label: "Points Per Visit", description: "Auto-award points on every completed booking", defaultOn: true },
      { id: "digital-punch-card", label: "Digital Punch Card", description: "Buy 9, get 10th free — tracked automatically", defaultOn: false },
      { id: "reward-tiers", label: "Reward Tiers", description: "Bronze, Silver, Gold status based on spend", defaultOn: false },
      { id: "auto-notify-reward", label: "Auto-Notify on Reward", description: "Message clients when they have enough points to redeem", defaultOn: true },
      { id: "custom-reward-catalog", label: "Reward Catalog", description: "Define what clients can redeem points for — free service, discount, product", defaultOn: false },
    ],
  },
  {
    id: "intake-forms",
    subFeatures: [
      { id: "auto-send-before-booking", label: "Auto-Send Before Booking", description: "Email the form automatically before an appointment", defaultOn: false },
      { id: "consent-signature", label: "Consent / E-Signature", description: "Add a signature field for waivers and consent forms", defaultOn: false },
      { id: "pre-fill-profile", label: "Pre-Fill from Profile", description: "Auto-populate name, email, phone from the client record", defaultOn: true },
      { id: "conditional-fields", label: "Conditional Fields", description: "Show or hide fields based on previous answers", defaultOn: false },
      { id: "form-notifications", label: "Submission Notifications", description: "Notify a team member when a form is submitted", defaultOn: true },
      { id: "form-response-table", label: "Response Viewer", description: "View all submissions in a spreadsheet-style table", defaultOn: true },
      { id: "file-upload-field", label: "File Upload Field", description: "Let respondents upload photos, documents, or files", defaultOn: false },
    ],
  },
  {
    id: "win-back",
    subFeatures: [
      { id: "auto-send-winback", label: "Auto-Send Messages", description: "Send re-engagement automatically when threshold is hit", defaultOn: false },
      { id: "winback-offer", label: "Win-Back Offer", description: "Attach a discount code to the re-engagement message", defaultOn: false },
      { id: "reengagement-tracking", label: "Re-engagement Tracking", description: "Track which lapsed clients actually came back", defaultOn: true },
      { id: "custom-thresholds", label: "Custom Thresholds", description: "Different lapse periods per service or client segment", defaultOn: false },
      { id: "winback-performance-report", label: "Performance Report", description: "Track returned clients and total recovered revenue", defaultOn: false },
    ],
  },
  {
    id: "storefront",
    subFeatures: [
      { id: "photo-gallery", label: "Photo Gallery", description: "Showcase your best work on the public page", defaultOn: false },
      { id: "reviews-display", label: "Reviews Display", description: "Show client reviews on your storefront", defaultOn: false },
      { id: "business-info-block", label: "Business Info Block", description: "Hours, location, phone, social links — auto-populated", defaultOn: true },
    ],
  },
  {
    id: "ai-insights",
    subFeatures: [
      { id: "rebooking-alerts", label: "Rebooking Alerts", description: "Flag clients overdue for their next visit", defaultOn: true },
      { id: "revenue-forecast", label: "Revenue Forecast", description: "Predict next month's revenue from your pipeline", defaultOn: false },
      { id: "churn-risk-score", label: "Churn Risk Score", description: "Red, yellow, green flag for clients likely to leave", defaultOn: false },
      { id: "weekly-digest", label: "Weekly Digest", description: "Auto-generated summary of your week's activity", defaultOn: true },
      { id: "anomaly-alerts", label: "Anomaly Alerts", description: "Flag unusual patterns like sudden drops in bookings or spikes in cancellations", defaultOn: false },
      { id: "client-lifetime-value", label: "Client Lifetime Value", description: "Calculate and display estimated lifetime value per client", defaultOn: false },
    ],
  },
  {
    id: "before-after",
    subFeatures: [
      { id: "side-by-side-view", label: "Side-by-Side View", description: "Split or slider comparison of before and after photos", defaultOn: true },
      { id: "client-consent-toggle", label: "Client Consent Toggle", description: "Mark whether client approved public use of photos", defaultOn: false },
      { id: "share-to-storefront", label: "Share to Storefront", description: "One-click publish approved photos to your public page", defaultOn: false },
    ],
  },
  {
    id: "soap-notes",
    subFeatures: [
      { id: "note-templates", label: "Note Templates", description: "Reusable templates per treatment type", defaultOn: false },
      { id: "auto-link-booking", label: "Auto-Link to Booking", description: "Notes auto-attach to the related appointment", defaultOn: true },
      { id: "practitioner-filter", label: "Practitioner Filter", description: "Filter notes by who wrote them", defaultOn: false },
      { id: "body-map-markup", label: "Body Map Markup", description: "Draw on a body diagram to mark treatment areas", defaultOn: false },
      { id: "note-locking", label: "Note Locking", description: "Lock notes after X hours so they cannot be edited — for compliance", defaultOn: false },
      { id: "treatment-plan-builder", label: "Treatment Plan Builder", description: "Multi-session treatment plans with progress tracking across visits", defaultOn: false },
    ],
  },
];
