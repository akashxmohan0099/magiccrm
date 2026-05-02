// ── Calendar Block ──────────────────────────────────

export type BlockKind =
  | 'break'
  | 'cleanup'
  | 'lunch'
  | 'travel'
  | 'prep'
  | 'blocked'
  | 'unavailable'
  | 'admin'
  | 'training'
  | 'personal'
  | 'sick'
  | 'vacation'
  | 'deep_clean'
  | 'delivery'
  | 'holiday'
  | 'custom';

export interface CalendarBlock {
  id: string;
  workspaceId: string;
  teamMemberId?: string;
  kind: BlockKind;
  date: string;               // YYYY-MM-DD (local day of startTime)
  startTime: string;          // ISO timestamp
  endTime: string;            // ISO timestamp
  label?: string;             // optional override of the kind's default label
  reason?: string;            // private note (e.g. "Doctor", "Kids")
  isPrivate: boolean;         // when true, public booking page shows only "Unavailable"
  isRecurring: boolean;
  recurrencePattern?: 'daily' | 'weekdays' | 'weekly' | 'fortnightly' | 'monthly';
  recurrenceEndDate?: string; // YYYY-MM-DD
  color?: string;             // hex override of kind default
  createdAt: string;
  updatedAt: string;
}
