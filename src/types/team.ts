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

export interface TeamMemberSocialLinks {
  instagram?: string;
  tiktok?: string;
  facebook?: string;
  website?: string;
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
  bio?: string;
  socialLinks?: TeamMemberSocialLinks;
  status: MemberStatus;
  workingHours: Record<string, WorkingHours>;  // { "mon": { start, end }, "tue": ... }
  daysOff: string[];          // ["sun"]
  leavePeriods: LeavePeriod[];
  createdAt: string;
  updatedAt: string;
}
