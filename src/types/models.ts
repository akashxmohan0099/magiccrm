// ── Client Database ────────────────────────────────────────

export interface ClientRelationship {
  clientId: string;
  type: string;
}

export interface Client {
  id: string;
  name: string;
  email: string;
  phone: string;
  company?: string;
  address?: string;
  tags: string[];
  notes: string;
  source?: "referral" | "website" | "social" | "other";
  status: "active" | "inactive" | "prospect";
  customData?: Record<string, unknown>;
  relationships?: ClientRelationship[];
  createdAt: string;
  updatedAt: string;
}

// ── Leads & Pipeline ──────────────────────────────────────

export type LeadStage = string;

export interface Lead {
  id: string;
  name: string;
  email: string;
  phone: string;
  company?: string;
  source?: string;
  stage: LeadStage;
  value?: number;
  notes: string;
  clientId?: string;
  createdAt: string;
  updatedAt: string;
}

// ── Jobs & Projects ───────────────────────────────────────

export type JobStage = string;

export interface Task {
  id: string;
  title: string;
  completed: boolean;
  dueDate?: string;
  assignee?: string;
}

export interface TimeEntry {
  id: string;
  description: string;
  minutes: number;
  date: string;
}

export interface FileAttachment {
  id: string;
  name: string;
  size: number;
  type: string;
  dataUrl: string;
  uploadedAt: string;
}

export interface Job {
  id: string;
  title: string;
  description: string;
  clientId?: string;
  stage: JobStage;
  tasks: Task[];
  timeEntries: TimeEntry[];
  files: FileAttachment[];
  dueDate?: string;
  createdAt: string;
  updatedAt: string;
}

// ── Quotes & Invoicing ────────────────────────────────────

export interface LineItem {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
  discount?: number;
}

export type InvoiceStatus = "draft" | "sent" | "paid" | "overdue" | "cancelled";
export type QuoteStatus = "draft" | "sent" | "accepted" | "declined" | "expired";

export interface InvoiceMilestone {
  id: string;
  label: string;
  percent: number;
  status: string;
}

export interface Invoice {
  id: string;
  number: string;
  clientId?: string;
  jobId?: string;
  lineItems: LineItem[];
  status: InvoiceStatus;
  dueDate?: string;
  notes: string;
  paymentSchedule?: string;
  depositPercent?: number;
  depositPaid?: boolean;
  milestones?: InvoiceMilestone[];
  createdAt: string;
  updatedAt: string;
}

export interface Quote {
  id: string;
  number: string;
  clientId?: string;
  lineItems: LineItem[];
  status: QuoteStatus;
  validUntil?: string;
  notes: string;
  createdAt: string;
  updatedAt: string;
}

// ── Payments ──────────────────────────────────────────────

export type PaymentMethod = "cash" | "card" | "bank-transfer" | "other";

export interface Payment {
  id: string;
  invoiceId?: string;
  clientId?: string;
  amount: number;
  method: PaymentMethod;
  notes: string;
  date: string;
  createdAt: string;
}

// ── Bookings & Calendar ───────────────────────────────────

export type BookingStatus = "confirmed" | "pending" | "cancelled" | "completed";
export type BookingType = "appointment" | "break" | "unavailable";

export interface Booking {
  id: string;
  title: string;
  clientId?: string;
  date: string;
  startTime: string;
  endTime: string;
  status: BookingStatus;
  bookingType?: BookingType;
  notes: string;
  recurring?: "weekly" | "biweekly" | "monthly";
  serviceId?: string;
  serviceName?: string;
  price?: number;
  duration?: number;
  createdAt: string;
  updatedAt: string;
}

export interface AvailabilitySlot {
  day: number; // 0=Sun, 6=Sat
  startTime: string;
  endTime: string;
  enabled: boolean;
}

// ── Communication ─────────────────────────────────────────

export type Channel = "email" | "sms" | "instagram" | "facebook" | "whatsapp" | "linkedin";

export interface Message {
  id: string;
  content: string;
  sender: "user" | "client";
  timestamp: string;
}

export interface Conversation {
  id: string;
  clientId?: string;
  clientName: string;
  channel: Channel;
  subject?: string;
  messages: Message[];
  lastMessageAt: string;
  createdAt: string;
}

// ── Marketing ─────────────────────────────────────────────

export type CampaignType = "email" | "social";
export type CampaignStatus = "draft" | "scheduled" | "sent" | "active";

export interface Campaign {
  id: string;
  name: string;
  type: CampaignType;
  status: CampaignStatus;
  subject?: string;
  content: string;
  audienceTags: string[];
  scheduledAt?: string;
  createdAt: string;
}

export interface ReviewRequest {
  id: string;
  clientId?: string;
  clientName: string;
  status: "pending" | "sent" | "received";
  rating?: number;
  feedback?: string;
  createdAt: string;
}

export interface Coupon {
  id: string;
  code: string;
  description: string;
  discountType: "percentage" | "fixed";
  discountValue: number;
  usageCount: number;
  maxUses?: number;
  expiresAt?: string;
  active: boolean;
  createdAt: string;
}

// ── Support ───────────────────────────────────────────────

export type TicketPriority = "low" | "medium" | "high" | "urgent";
export type TicketStatus = "open" | "in-progress" | "waiting" | "resolved" | "closed";

export interface TicketMessage {
  id: string;
  content: string;
  sender: "user" | "client";
  timestamp: string;
}

export interface SupportTicket {
  id: string;
  subject: string;
  clientId?: string;
  clientName: string;
  priority: TicketPriority;
  status: TicketStatus;
  messages: TicketMessage[];
  satisfaction?: number;
  createdAt: string;
  updatedAt: string;
}

export interface KnowledgeBaseArticle {
  id: string;
  title: string;
  content: string;
  category: string;
  published: boolean;
  createdAt: string;
  updatedAt: string;
}

// ── Documents ─────────────────────────────────────────────

export interface Document {
  id: string;
  name: string;
  category: string;
  isTemplate: boolean;
  size: number;
  type: string;
  dataUrl?: string;
  signatureStatus?: "none" | "pending" | "signed";
  shared: boolean;
  clientId?: string;
  createdAt: string;
  updatedAt: string;
}

// ── Products ──────────────────────────────────────────────

export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  sku?: string;
  inStock: boolean;
  quantity?: number;
  createdAt: string;
  updatedAt: string;
}

// ── Automations ───────────────────────────────────────────

export type AutomationTrigger =
  | "lead-created"
  | "lead-stage-changed"
  | "client-created"
  | "invoice-sent"
  | "invoice-overdue"
  | "booking-created"
  | "booking-cancelled"
  | "job-completed"
  | "ticket-created";

export type AutomationAction =
  | "send-email"
  | "create-task"
  | "update-status"
  | "send-notification"
  | "create-follow-up";

export interface AutomationRule {
  id: string;
  name: string;
  trigger: AutomationTrigger;
  action: AutomationAction;
  actionConfig: Record<string, string>;
  enabled: boolean;
  createdAt: string;
}

// ── SOAP Notes (Treatment Records) ───────────────────────

export interface SOAPNote {
  id: string;
  clientId: string;
  clientName: string;
  date: string;
  subjective: string;
  objective: string;
  assessment: string;
  plan: string;
  practitioner?: string;
  templateId?: string;
  createdAt: string;
  updatedAt: string;
}

// ── Intake Forms ─────────────────────────────────────────

export type IntakeFieldType = "text" | "textarea" | "select" | "checkbox" | "date" | "number" | "email" | "phone";

export interface IntakeFormField {
  id: string;
  label: string;
  type: IntakeFieldType;
  required: boolean;
  placeholder?: string;
  options?: string[];
  conditionalOn?: { fieldId: string; value: string };
}

export interface IntakeForm {
  id: string;
  name: string;
  description: string;
  fields: IntakeFormField[];
  linkedTo?: "booking" | "lead" | "client";
  active: boolean;
  submissionCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface IntakeSubmission {
  id: string;
  formId: string;
  formName: string;
  clientId?: string;
  clientName: string;
  responses: Record<string, string | boolean>;
  submittedAt: string;
}

// ── Memberships & Packages ───────────────────────────────

export type MembershipInterval = "weekly" | "fortnightly" | "monthly" | "quarterly" | "yearly";

export interface MembershipPlan {
  id: string;
  name: string;
  description: string;
  price: number;
  interval: MembershipInterval;
  sessionsIncluded?: number;
  unlimitedSessions?: boolean;
  active: boolean;
  createdAt: string;
}

export interface Membership {
  id: string;
  planId: string;
  planName: string;
  clientId: string;
  clientName: string;
  status: "active" | "paused" | "cancelled" | "expired";
  startDate: string;
  nextBillingDate: string;
  sessionsUsed: number;
  sessionsTotal?: number;
  createdAt: string;
  updatedAt: string;
}

// ── Before/After Photos & Checklists ─────────────────────

export interface ChecklistItem {
  id: string;
  label: string;
  checked: boolean;
}

export interface BeforeAfterRecord {
  id: string;
  jobId?: string;
  clientId?: string;
  clientName: string;
  title: string;
  beforePhotos: FileAttachment[];
  afterPhotos: FileAttachment[];
  checklist: ChecklistItem[];
  notes: string;
  createdAt: string;
}

// ── Win-Back Campaigns ───────────────────────────────────

export interface WinBackRule {
  id: string;
  name: string;
  inactiveDays: number;
  messageTemplate: string;
  channel: "email" | "sms";
  enabled: boolean;
  createdAt: string;
}

export interface LapsedClient {
  id: string;
  clientId: string;
  clientName: string;
  lastVisitDate: string;
  daysSinceVisit: number;
  ruleId: string;
  status: "detected" | "contacted" | "rebooked" | "dismissed";
  detectedAt: string;
}

// ── AI Client Insights ───────────────────────────────────

export type InsightType = "overdue-rebooking" | "hot-lead" | "empty-slot" | "revenue-trend" | "at-risk" | "upsell";

export interface ClientInsight {
  id: string;
  type: InsightType;
  title: string;
  description: string;
  entityType?: "client" | "lead" | "booking" | "invoice";
  entityId?: string;
  entityName?: string;
  priority: "low" | "medium" | "high";
  actionLabel?: string;
  dismissed: boolean;
  createdAt: string;
}

// ── Loyalty & Referrals ──────────────────────────────────

export interface LoyaltyTransaction {
  id: string;
  clientId: string;
  clientName: string;
  type: "earned" | "redeemed" | "bonus" | "referral";
  points: number;
  description: string;
  createdAt: string;
}

export interface ReferralCode {
  id: string;
  clientId: string;
  clientName: string;
  code: string;
  timesUsed: number;
  rewardPoints: number;
  createdAt: string;
}

// ── Storefront ───────────────────────────────────────────

export interface StorefrontConfig {
  id: string;
  businessName: string;
  tagline: string;
  description: string;
  showPricing: boolean;
  showDuration: boolean;
  accentColor: string;
  categories: string[];
  enabled: boolean;
  updatedAt: string;
}

// ── Client Portal ────────────────────────────────────────

export interface PortalConfig {
  id: string;
  enabled: boolean;
  showBookings: boolean;
  showInvoices: boolean;
  showDocuments: boolean;
  showMessages: boolean;
  showJobProgress: boolean;
  welcomeMessage: string;
  accentColor: string;
  updatedAt: string;
}

export interface PortalAccess {
  id: string;
  clientId: string;
  clientName: string;
  email: string;
  lastLoginAt?: string;
  enabled: boolean;
  createdAt: string;
}

// ── Team ─────────────────────────────────────────────────

export type TeamRole = "owner" | "admin" | "staff";
export type TeamMemberStatus = "active" | "invited" | "inactive";

export interface TeamMember {
  id: string;
  name: string;
  email: string;
  phone?: string;
  role: TeamRole;
  title?: string;
  status: TeamMemberStatus;
  avatar?: string;
  createdAt: string;
  updatedAt: string;
}

// ── Activity ──────────────────────────────────────────────

export interface ActivityEntry {
  id: string;
  type: string;
  module: string;
  description: string;
  entityId?: string;
  timestamp: string;
}

// ── Reminders ─────────────────────────────────────────────

export interface Reminder {
  id: string;
  title: string;
  entityType: "client" | "lead" | "job" | "invoice" | "booking";
  entityId: string;
  dueDate: string;
  completed: boolean;
  createdAt: string;
}
