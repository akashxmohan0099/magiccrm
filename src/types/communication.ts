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
