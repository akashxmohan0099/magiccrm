import "server-only";

import { createAdminClient } from "@/lib/supabase-server";
import type { WorkingHours } from "@/types/models";

interface ResolvedBookingWorkspace {
  workspaceId: string;
  businessName: string;
}

export interface AvailabilitySlot {
  day: number;
  startTime: string;
  endTime: string;
  enabled: boolean;
}

interface WorkspaceMemberRow {
  id: string;
  working_hours?: Record<string, WorkingHours>;
  days_off?: string[];
  leave_periods?: { start: string; end: string; reason?: string }[];
}

interface ExistingBookingRow {
  assigned_to_id?: string | null;
  start_at: string;
  end_at: string;
}

const DAY_KEYS = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"] as const;

function isMissingBookingPageSlugError(error: { message?: string } | null | undefined) {
  return !!error?.message && error.message.includes("booking_page_slug");
}

function toMinutes(value: string) {
  const [hours, minutes] = value.split(":").map(Number);
  return hours * 60 + minutes;
}

function isMemberOnLeave(member: WorkspaceMemberRow, date: string) {
  const leavePeriods = member.leave_periods ?? [];
  return leavePeriods.some((leave) => leave.start <= date && leave.end >= date);
}

function getMemberWorkingHours(
  member: WorkspaceMemberRow,
  date: string,
  defaultAvailability: AvailabilitySlot[],
): WorkingHours | null {
  const dayIndex = new Date(`${date}T12:00:00`).getDay();
  const dayKey = DAY_KEYS[dayIndex];

  if ((member.days_off ?? []).includes(dayKey)) {
    return null;
  }

  if (isMemberOnLeave(member, date)) {
    return null;
  }

  const memberHours = member.working_hours?.[dayKey];
  if (memberHours?.start && memberHours?.end) {
    return memberHours;
  }

  const fallback = defaultAvailability.find((slot) => slot.day === dayIndex && slot.enabled);
  if (!fallback) {
    return null;
  }

  return {
    start: fallback.startTime,
    end: fallback.endTime,
  };
}

function slotConflicts(booking: ExistingBookingRow, memberId: string, slotStart: string, slotEnd: string) {
  if (booking.assigned_to_id && booking.assigned_to_id !== memberId) {
    return false;
  }

  return booking.start_at < slotEnd && booking.end_at > slotStart;
}

async function fetchActiveMembers(workspaceId: string): Promise<WorkspaceMemberRow[]> {
  const supabase = await createAdminClient();
  const { data } = await supabase
    .from("workspace_members")
    .select("id, working_hours, days_off, leave_periods")
    .eq("workspace_id", workspaceId)
    .eq("status", "active");

  return (data as WorkspaceMemberRow[] | null) ?? [];
}

async function fetchAssignedMemberIdsForService(workspaceId: string, serviceId: string): Promise<Set<string>> {
  const supabase = await createAdminClient();
  const { data } = await supabase
    .from("member_services")
    .select("member_id")
    .eq("workspace_id", workspaceId)
    .eq("service_id", serviceId);

  return new Set(((data as { member_id: string }[] | null) ?? []).map((row) => row.member_id));
}

async function fetchBookingsForDate(workspaceId: string, date: string): Promise<ExistingBookingRow[]> {
  const supabase = await createAdminClient();
  const { data } = await supabase
    .from("bookings")
    .select("assigned_to_id, start_at, end_at")
    .eq("workspace_id", workspaceId)
    .neq("status", "cancelled")
    .gte("start_at", `${date}T00:00:00`)
    .lte("start_at", `${date}T23:59:59`);

  return (data as ExistingBookingRow[] | null) ?? [];
}

export async function resolveBookingWorkspaceBySlug(
  slug: string,
): Promise<ResolvedBookingWorkspace | null> {
  const trimmedSlug = slug.trim();
  if (!trimmedSlug) return null;

  const supabase = await createAdminClient();

  const { data: settingsBySlug, error: settingsError } = await supabase
    .from("workspace_settings")
    .select("workspace_id")
    .ilike("booking_page_slug", trimmedSlug)
    .maybeSingle();

  if (settingsBySlug) {
    const { data: workspace } = await supabase
      .from("workspaces")
      .select("name")
      .eq("id", settingsBySlug.workspace_id)
      .maybeSingle();

    return {
      workspaceId: settingsBySlug.workspace_id,
      businessName: workspace?.name || "Business",
    };
  }

  if (settingsError && !isMissingBookingPageSlugError(settingsError)) {
    throw new Error(settingsError.message);
  }

  return null;
}

export function getDefaultAvailabilitySlots(): AvailabilitySlot[] {
  return [
    { day: 1, startTime: "09:00", endTime: "17:00", enabled: true },
    { day: 2, startTime: "09:00", endTime: "17:00", enabled: true },
    { day: 3, startTime: "09:00", endTime: "17:00", enabled: true },
    { day: 4, startTime: "09:00", endTime: "17:00", enabled: true },
    { day: 5, startTime: "09:00", endTime: "17:00", enabled: true },
    { day: 6, startTime: "09:00", endTime: "12:00", enabled: false },
    { day: 0, startTime: "09:00", endTime: "12:00", enabled: false },
  ];
}

export async function fetchWorkspaceAvailability(workspaceId: string): Promise<AvailabilitySlot[]> {
  const supabase = await createAdminClient();
  const { data: settings } = await supabase
    .from("workspace_settings")
    .select("working_hours")
    .eq("workspace_id", workspaceId)
    .maybeSingle();

  const workingHours = settings?.working_hours as Record<string, { start: string; end: string }> | null;
  if (!workingHours || Object.keys(workingHours).length === 0) {
    return getDefaultAvailabilitySlots();
  }

  const slots: AvailabilitySlot[] = DAY_KEYS.map((key, index) => {
    const hours = workingHours[key];
    if (hours?.start && hours?.end) {
      return { day: index, startTime: hours.start, endTime: hours.end, enabled: true };
    }
    return { day: index, startTime: "09:00", endTime: "17:00", enabled: false };
  });

  return slots.some((s) => s.enabled) ? slots : getDefaultAvailabilitySlots();
}

export async function getAvailableMembersForSlot(params: {
  workspaceId: string;
  serviceId: string;
  date: string;
  startTime: string;
  endTime: string;
  defaultAvailability: AvailabilitySlot[];
}) {
  const members = await fetchActiveMembers(params.workspaceId);
  if (members.length === 0) {
    return [] as WorkspaceMemberRow[];
  }

  const assignedMemberIds = await fetchAssignedMemberIdsForService(params.workspaceId, params.serviceId);
  const eligibleMembers = members.filter((member) => assignedMemberIds.size === 0 || assignedMemberIds.has(member.id));

  if (eligibleMembers.length === 0) {
    return [] as WorkspaceMemberRow[];
  }

  const bookings = await fetchBookingsForDate(params.workspaceId, params.date);
  const slotStart = `${params.date}T${params.startTime}:00`;
  const slotEnd = `${params.date}T${params.endTime}:00`;

  return eligibleMembers.filter((member) => {
    const hours = getMemberWorkingHours(member, params.date, params.defaultAvailability);
    if (!hours) {
      return false;
    }

    if (toMinutes(params.startTime) < toMinutes(hours.start) || toMinutes(params.endTime) > toMinutes(hours.end)) {
      return false;
    }

    return !bookings.some((booking) => slotConflicts(booking, member.id, slotStart, slotEnd));
  });
}

export async function getAvailableTimeSlots(params: {
  workspaceId: string;
  serviceId: string;
  date: string;
  durationMinutes: number;
  defaultAvailability: AvailabilitySlot[];
}) {
  const members = await fetchActiveMembers(params.workspaceId);
  if (members.length === 0) {
    return [] as string[];
  }

  const assignedMemberIds = await fetchAssignedMemberIdsForService(params.workspaceId, params.serviceId);
  const eligibleMembers = members.filter((member) => assignedMemberIds.size === 0 || assignedMemberIds.has(member.id));
  if (eligibleMembers.length === 0) {
    return [] as string[];
  }

  const dailyHours = eligibleMembers
    .map((member) => getMemberWorkingHours(member, params.date, params.defaultAvailability))
    .filter((hours): hours is WorkingHours => Boolean(hours));

  if (dailyHours.length === 0) {
    return [] as string[];
  }

  const dayStart = Math.min(...dailyHours.map((hours) => toMinutes(hours.start)));
  const dayEnd = Math.max(...dailyHours.map((hours) => toMinutes(hours.end)));
  const bookings = await fetchBookingsForDate(params.workspaceId, params.date);
  const availableSlots: string[] = [];
  const today = new Date();
  const isToday = params.date === today.toISOString().split("T")[0];

  for (let minute = dayStart; minute + params.durationMinutes <= dayEnd; minute += 30) {
    const slotStart = `${String(Math.floor(minute / 60)).padStart(2, "0")}:${String(minute % 60).padStart(2, "0")}`;
    const slotEndMinutes = minute + params.durationMinutes;
    const slotEnd = `${String(Math.floor(slotEndMinutes / 60)).padStart(2, "0")}:${String(slotEndMinutes % 60).padStart(2, "0")}`;

    if (isToday) {
      const slotDateTime = new Date(`${params.date}T${slotStart}:00`);
      if (slotDateTime <= today) {
        continue;
      }
    }

    const slotStartIso = `${params.date}T${slotStart}:00`;
    const slotEndIso = `${params.date}T${slotEnd}:00`;
    const hasCapacity = eligibleMembers.some((member) => {
      const hours = getMemberWorkingHours(member, params.date, params.defaultAvailability);
      if (!hours) {
        return false;
      }

      if (toMinutes(slotStart) < toMinutes(hours.start) || toMinutes(slotEnd) > toMinutes(hours.end)) {
        return false;
      }

      return !bookings.some((booking) => slotConflicts(booking, member.id, slotStartIso, slotEndIso));
    });

    if (hasCapacity) {
      availableSlots.push(slotStart);
    }
  }

  return availableSlots;
}
