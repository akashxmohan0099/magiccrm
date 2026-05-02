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
