// ═══════════════════════════════════════════════════
// MAGIC CRM — Core Type Definitions
// 5 core objects: Client, Booking, Inquiry, Conversation, PaymentDocument
// ═══════════════════════════════════════════════════

// ── Client ──────────────────────────────────────────

export interface Client {
  id: string;
  workspaceId: string;
  name: string;
  email: string;
  phone: string;
  notes: string;
  // Platform features
  birthday?: string;
  medicalAlerts?: string;
  source?: string;
  addressStreet?: string;
  addressSuburb?: string;
  addressPostcode?: string;
  addressState?: string;
  stripePaymentMethodId?: string;
  createdAt: string;
  updatedAt: string;
}

// ── Service ─────────────────────────────────────────

export type ServiceLocationType = 'studio' | 'mobile' | 'both';
export type DepositType = 'none' | 'percentage' | 'fixed';

export interface Service {
  id: string;
  workspaceId: string;
  name: string;
  description: string;
  duration: number;           // minutes
  price: number;
  category?: string;
  enabled: boolean;
  sortOrder: number;
  // Platform features
  bufferMinutes: number;
  minNoticeHours?: number;
  maxAdvanceDays?: number;
  requiresConfirmation: boolean;
  depositType: DepositType;
  depositAmount: number;
  cancellationWindowHours?: number;
  cancellationFee?: number;
  locationType: ServiceLocationType;
  priceMobile?: number;
  imageUrl?: string;
  createdAt: string;
  updatedAt: string;
}

export interface MemberService {
  id: string;
  memberId: string;
  serviceId: string;
  workspaceId: string;
}

// ── Conversation ────────────────────────────────────

export type Channel = 'instagram' | 'whatsapp' | 'facebook' | 'email' | 'sms';

export interface Conversation {
  id: string;
  workspaceId: string;
  contactName?: string;
  contactEmail?: string;
  contactPhone?: string;
  contactSocialHandle?: string;
  channel: Channel;
  clientId?: string;
  externalConversationId?: string;
  lastMessageAt?: string;
  unreadCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface Message {
  id: string;
  conversationId: string;
  workspaceId: string;
  content: string;
  sender: 'user' | 'client';
  externalMessageId?: string;
  createdAt: string;
}

// ── Inquiry ─────────────────────────────────────────

export type InquirySource = 'form' | 'comms';
export type InquiryStatus = 'new' | 'in_progress' | 'converted' | 'closed';

export interface Inquiry {
  id: string;
  workspaceId: string;
  name: string;
  email: string;
  phone: string;
  message: string;
  serviceInterest?: string;
  eventType?: string;
  dateRange?: string;
  source: InquirySource;
  status: InquiryStatus;
  conversationId?: string;
  formId?: string;
  bookingId?: string;
  clientId?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

// ── Booking ─────────────────────────────────────────

export type BookingStatus = 'confirmed' | 'pending' | 'cancelled' | 'completed' | 'no_show';

export type RecurrencePattern = 'weekly' | 'fortnightly' | 'monthly' | 'custom';

export interface Booking {
  id: string;
  workspaceId: string;
  clientId: string;
  serviceId?: string;
  assignedToId?: string;
  date: string;               // YYYY-MM-DD
  startAt: string;            // ISO timestamp
  endAt: string;              // ISO timestamp
  status: BookingStatus;
  notes: string;
  inquiryId?: string;
  conversationId?: string;
  cancellationReason?: string;
  reminderSentAt?: string;
  followupSentAt?: string;
  reviewRequestSentAt?: string;
  // Platform features
  recurrencePattern?: RecurrencePattern;
  recurrenceEndDate?: string;
  locationType?: string;
  address?: string;
  createdAt: string;
  updatedAt: string;
}

// ── Payment Document ────────────────────────────────

export type PaymentDocLabel = 'quote' | 'invoice';
export type PaymentDocStatus = 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled';
export type PaymentMethod = 'stripe' | 'cash' | 'bank_transfer' | 'card_in_person';

export interface PaymentDocument {
  id: string;
  workspaceId: string;
  documentNumber: string;
  clientId: string;
  bookingId?: string;
  label: PaymentDocLabel;
  status: PaymentDocStatus;
  paymentMethod?: PaymentMethod;
  stripeInvoiceId?: string;
  stripeHostedUrl?: string;
  total: number;
  notes: string;
  sentAt?: string;
  paidAt?: string;
  dueDate?: string;
  createdAt: string;
  updatedAt: string;
}

export interface PaymentLineItem {
  id: string;
  paymentDocumentId: string;
  workspaceId: string;
  description: string;
  quantity: number;
  unitPrice: number;
  sortOrder: number;
}

// ── Form ────────────────────────────────────────────

export type FormType = 'booking' | 'inquiry';

export interface FormFieldConfig {
  name: string;
  type: 'text' | 'email' | 'phone' | 'textarea' | 'select' | 'date' | 'date_range';
  label: string;
  required: boolean;
  options?: string[];         // for select fields
}

export interface Form {
  id: string;
  workspaceId: string;
  type: FormType;
  name: string;
  fields: FormFieldConfig[];
  branding: {
    logo?: string;
    primaryColor?: string;
    accentColor?: string;
  };
  slug?: string;
  enabled: boolean;
  createdAt: string;
  updatedAt: string;
}

// ── Automation ──────────────────────────────────────

export type AutomationType =
  | 'booking_confirmation'
  | 'appointment_reminder'
  | 'post_service_followup'
  | 'review_request'
  | 'rebooking_nudge'
  | 'no_show_followup'
  | 'invoice_auto_send'
  | 'cancellation_confirmation';

export type AutomationChannel = 'email' | 'sms' | 'both';

export interface AutomationRule {
  id: string;
  workspaceId: string;
  type: AutomationType;
  enabled: boolean;
  channel: AutomationChannel;
  messageTemplate: string;
  timingValue?: number;       // e.g., 24 for 24 hours before
  timingUnit?: 'minutes' | 'hours' | 'days';
  createdAt: string;
  updatedAt: string;
}

// ── Marketing ───────────────────────────────────────

export type CampaignChannel = 'email' | 'sms' | 'both';
export type CampaignSegment = 'all' | 'new' | 'returning' | 'inactive' | 'high_value';
export type CampaignStatus = 'draft' | 'scheduled' | 'sending' | 'sent';

export interface Campaign {
  id: string;
  workspaceId: string;
  name: string;
  subject?: string;
  body: string;
  channel: CampaignChannel;
  targetSegment: CampaignSegment;
  inactiveDays?: number;
  status: CampaignStatus;
  scheduledAt?: string;
  sentCount: number;
  openCount: number;
  clickCount: number;
  createdAt: string;
  updatedAt: string;
}

// ── Team ────────────────────────────────────────────

export type TeamRole = 'owner' | 'staff';
export type MemberStatus = 'active' | 'invited' | 'inactive';

export interface WorkingHours {
  start: string;              // "09:00"
  end: string;                // "17:00"
}

export interface LeavePeriod {
  start: string;              // "2026-04-10"
  end: string;                // "2026-04-12"
  reason?: string;
}

export interface TeamMember {
  id: string;
  authUserId: string;
  workspaceId: string;
  name: string;
  email: string;
  phone?: string;
  role: TeamRole;
  avatarUrl?: string;
  status: MemberStatus;
  workingHours: Record<string, WorkingHours>;  // { "mon": { start, end }, "tue": ... }
  daysOff: string[];          // ["sun"]
  leavePeriods: LeavePeriod[];
  createdAt: string;
  updatedAt: string;
}

// ── Workspace & Settings ────────────────────────────

export type OnboardingArtistType =
  | 'hair_stylist'
  | 'nail_technician'
  | 'makeup_artist'
  | 'lash_brow_artist'
  | 'esthetician_facialist'
  | 'barber'
  | 'massage_therapist'
  | 'tattoo_artist'
  | 'spa_wellness'
  | 'other';

export type OnboardingWorkLocation = 'studio' | 'mobile' | 'both';

export type OnboardingTeamSize = 'solo' | 'small_team' | 'large_team';

export type OnboardingBookingChannel =
  | 'phone_text'
  | 'instagram_dms'
  | 'whatsapp'
  | 'facebook_messenger'
  | 'email'
  | 'website'
  | 'walk_ins'
  | 'booking_platform';

export type OnboardingPaymentMethod =
  | 'cash'
  | 'bank_transfer'
  | 'card_terminal'
  | 'stripe'
  | 'square'
  | 'paypal'
  | 'other';

export type OnboardingActionId =
  | 'treatment_notes'
  | 'deposit_requirements'
  | 'card_on_file_no_show_fee'
  | 'reminder_automations'
  | 'recurring_bookings'
  | 'rebooking_prompt'
  | 'before_after_photos'
  | 'pre_appointment_questionnaire'
  | 'review_request_automation'
  | 'tips'
  | 'proposals_addon'
  | 'travel_fee_calculation'
  | 'service_area'
  | 'group_bookings'
  | 'memberships_addon'
  | 'documents_addon'
  | 'booking_approval_mode';

export type OnboardingPersona =
  | 'hair_stylist_solo'
  | 'hair_stylist_team'
  | 'nail_technician_solo'
  | 'nail_technician_team'
  | 'makeup_artist_mobile'
  | 'makeup_artist_studio'
  | 'lash_brow_artist'
  | 'esthetician_facialist'
  | 'barber_solo'
  | 'barber_team'
  | 'massage_therapist_studio'
  | 'massage_therapist_mobile'
  | 'tattoo_artist'
  | 'spa_wellness'
  | 'other';

export type OnboardingDepositPreference = '25_percent' | '50_percent' | 'fixed_amount' | 'set_later';
export type OnboardingNoShowFeePreference = '50_percent' | '100_percent' | 'fixed_amount' | 'decide_later';
export type OnboardingTravelFeePreference = 'per_km_rate' | 'zone_flat_fee' | 'set_up_later';
export type OnboardingServiceAreaPreference = 'radius_from_base' | 'specific_postcodes' | 'set_up_later';
export type OnboardingMembershipPreference = 'subscription' | 'bundles' | 'both' | 'set_up_later';

export interface OnboardingFollowUps {
  depositPreference?: OnboardingDepositPreference;
  noShowFeePreference?: OnboardingNoShowFeePreference;
  travelFeePreference?: OnboardingTravelFeePreference;
  serviceAreaPreference?: OnboardingServiceAreaPreference;
  membershipPreference?: OnboardingMembershipPreference;
}

export type OnboardingFollowUpKey = keyof OnboardingFollowUps;

export interface Workspace {
  id: string;
  name: string;
  plan: 'free' | 'pro' | 'enterprise';
  createdAt: string;
  updatedAt: string;
}

export interface WorkspaceSettings {
  workspaceId: string;
  businessName?: string;
  logoUrl?: string;
  contactEmail?: string;
  contactPhone?: string;
  address?: string;
  stripeAccountId?: string;
  stripeOnboardingComplete: boolean;
  workingHours: Record<string, WorkingHours>;
  cancellationWindowHours: number;
  depositPercentage: number;
  noShowFee: number;
  messageTemplates: Record<string, string>;
  notificationDefaults: 'email' | 'sms' | 'both';
  branding: {
    logo?: string;
    primaryColor?: string;
    accentColor?: string;
  };
  bookingPageSlug?: string;
  // Platform features
  taxRate?: number;
  taxId?: string;
  termsContent?: string;
  calendarSyncEnabled: boolean;
  minNoticeHours: number;
  maxAdvanceDays: number;
  autoReplyEnabled: boolean;
  autoReplyTemplate?: string;
  serviceAreaMode?: 'radius' | 'postcodes';
  radiusKm?: number;
  servicedPostcodes?: string[];
  travelFeeMode?: 'per_km' | 'zone';
  perKmRate?: number;
  travelZones?: { postcodes: string[]; fee: number }[];
  artistType?: OnboardingArtistType;
  workLocation?: OnboardingWorkLocation;
  teamSize?: OnboardingTeamSize;
  bookingChannels?: OnboardingBookingChannel[];
  paymentMethods?: OnboardingPaymentMethod[];
  resolvedPersona?: OnboardingPersona;
  selectedOnboardingActions?: OnboardingActionId[];
  onboardingFollowUps?: OnboardingFollowUps;
  // v2 onboarding: persona slug + raw answers stash so re-running the
  // questionnaire from settings can pre-populate the existing draft.
  persona?: string;
  onboardingAnswers?: {
    persona: string;
    structure: Record<string, string>;
    solutions: string[];
    marketing: string[];
    billing: string[];
    engagement: string[];
  };
  enabledAddons: string[];    // dashboard add-on module IDs
  enabledFeatures: string[];   // toggle-on feature IDs
  // Dev-only override used by /dev to flip the dashboard between owner/staff
  // views without re-authenticating. Real auth populates `member.role` from
  // workspace_members; this is only consulted when there's no real session.
  role?: 'owner' | 'staff';
  updatedAt: string;
}

// ── Platform Feature Types ──────────────────────────

export interface CalendarBlock {
  id: string;
  workspaceId: string;
  teamMemberId?: string;
  startTime: string;
  endTime: string;
  label: string;
  isRecurring: boolean;
  recurrencePattern?: 'daily' | 'weekdays' | 'weekly';
  createdAt: string;
}

export interface ClientTag {
  id: string;
  workspaceId: string;
  name: string;
  color: string;
}

export interface ClientPhoto {
  id: string;
  workspaceId: string;
  clientId: string;
  serviceId?: string;
  bookingId?: string;
  photoUrl: string;
  type: 'before' | 'after';
  createdAt: string;
}

export interface TreatmentNote {
  id: string;
  workspaceId: string;
  clientId: string;
  bookingId?: string;
  serviceId?: string;
  teamMemberId?: string;
  notes: string;
  createdAt: string;
}

export interface InternalNote {
  id: string;
  workspaceId: string;
  entityType: 'conversation' | 'inquiry' | 'client' | 'booking';
  entityId: string;
  noteText: string;
  authorId?: string;
  createdAt: string;
}

export interface QuestionnaireTemplate {
  id: string;
  workspaceId: string;
  name: string;
  fields: { name: string; type: string; label: string; required: boolean; options?: string[] }[];
  createdAt: string;
  updatedAt: string;
}

export interface QuestionnaireResponse {
  id: string;
  workspaceId: string;
  clientId: string;
  bookingId?: string;
  questionnaireId: string;
  responses: Record<string, string>;
  submittedAt: string;
}

export interface WaitlistEntry {
  id: string;
  workspaceId: string;
  serviceId?: string;
  teamMemberId?: string;
  slotDatetime: string;
  clientName: string;
  clientEmail?: string;
  clientPhone?: string;
  position: number;
  status: 'waiting' | 'notified' | 'confirmed' | 'expired';
  notifiedAt?: string;
  createdAt: string;
}

export interface Refund {
  id: string;
  workspaceId: string;
  paymentDocumentId: string;
  amount: number;
  reason?: string;
  status: 'processed' | 'failed';
  stripeRefundId?: string;
  createdAt: string;
}

// ── Activity Log ────────────────────────────────────

export interface ActivityEntry {
  id: string;
  workspaceId: string;
  type?: string;
  description?: string;
  entityType?: string;
  entityId?: string;
  userId?: string;
  createdAt: string;
}

// ── Gift Cards ──────────────────────────────────────

export type GiftCardStatus = 'active' | 'redeemed' | 'expired' | 'cancelled';

export interface GiftCard {
  id: string;
  workspaceId: string;
  code: string;
  originalAmount: number;
  remainingBalance: number;
  status: GiftCardStatus;
  purchaserName?: string;
  purchaserEmail?: string;
  recipientName?: string;
  recipientEmail?: string;
  expiresAt?: string;
  createdAt: string;
  updatedAt: string;
}

// ── Loyalty & Referrals ─────────────────────────────

export interface LoyaltyConfig {
  pointsPerBooking: number;
  pointsPerDollar: number;
  redemptionThreshold: number; // points needed for $1 off
  enabled: boolean;
}

export interface LoyaltyBalance {
  clientId: string;
  totalEarned: number;
  totalRedeemed: number;
  balance: number;
}

export interface ReferralCode {
  id: string;
  workspaceId: string;
  clientId: string;
  clientName: string;
  code: string;
  referralsMade: number;
  rewardsCredited: number;
  createdAt: string;
}

// ── Proposals ───────────────────────────────────────

export type ProposalStatus = 'draft' | 'sent' | 'viewed' | 'accepted' | 'declined';

export interface ProposalSection {
  id: string;
  type: 'cover' | 'text' | 'services' | 'timeline' | 'gallery' | 'terms' | 'payment';
  title?: string;
  content?: string;
  items?: { description: string; amount: number }[];
  images?: string[];
  sortOrder: number;
}

export interface Proposal {
  id: string;
  workspaceId: string;
  title: string;
  clientId?: string;
  clientName: string;
  status: ProposalStatus;
  sections: ProposalSection[];
  total: number;
  validUntil?: string;
  shareToken: string;
  viewCount: number;
  sentAt?: string;
  viewedAt?: string;
  acceptedAt?: string;
  notes: string;
  createdAt: string;
  updatedAt: string;
}

// ── Memberships ─────────────────────────────────────

export type MembershipStatus = 'active' | 'paused' | 'cancelled' | 'expired';

export interface MembershipPlan {
  id: string;
  workspaceId: string;
  name: string;
  description: string;
  serviceIds: string[];
  sessionsPerPeriod: number;
  price: number;
  billingCycle: 'weekly' | 'monthly';
  enabled: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ClientMembership {
  id: string;
  workspaceId: string;
  clientId: string;
  planId: string;
  status: MembershipStatus;
  sessionsUsed: number;
  currentPeriodStart: string;
  nextRenewalDate?: string;
  createdAt: string;
  updatedAt: string;
}

// ── Documents ───────────────────────────────────────

export type DocumentStatus = 'draft' | 'sent' | 'viewed' | 'signed' | 'expired';

export interface DocumentField {
  id: string;
  type: 'text' | 'checkbox' | 'signature' | 'date';
  label: string;
  required: boolean;
  value?: string;
}

export interface DocumentTemplate {
  id: string;
  workspaceId: string;
  name: string;
  description: string;
  content: string;
  fields: DocumentField[];
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface SentDocument {
  id: string;
  workspaceId: string;
  templateId: string;
  templateName: string;
  clientId: string;
  clientName: string;
  status: DocumentStatus;
  fields: DocumentField[];
  signedAt?: string;
  signatureName?: string;
  sentAt?: string;
  viewedAt?: string;
  createdAt: string;
  updatedAt: string;
}
