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
