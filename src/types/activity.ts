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
