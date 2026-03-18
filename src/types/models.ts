// ── Client Database ────────────────────────────────────────

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
  createdAt: string;
  updatedAt: string;
}

// ── Leads & Pipeline ──────────────────────────────────────

export type LeadStage = "new" | "contacted" | "qualified" | "proposal" | "won" | "lost";

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

export type JobStage = "not-started" | "in-progress" | "review" | "completed" | "cancelled";

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
}

export type InvoiceStatus = "draft" | "sent" | "paid" | "overdue" | "cancelled";
export type QuoteStatus = "draft" | "sent" | "accepted" | "declined" | "expired";

export interface Invoice {
  id: string;
  number: string;
  clientId?: string;
  jobId?: string;
  lineItems: LineItem[];
  status: InvoiceStatus;
  dueDate?: string;
  notes: string;
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

export interface Booking {
  id: string;
  title: string;
  clientId?: string;
  date: string;
  startTime: string;
  endTime: string;
  status: BookingStatus;
  notes: string;
  recurring?: "weekly" | "biweekly" | "monthly";
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
