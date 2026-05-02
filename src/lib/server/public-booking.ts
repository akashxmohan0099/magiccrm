import "server-only";

import { createAdminClient } from "@/lib/supabase-server";
import type { Booking, MemberService, Service, TeamMember, WorkingHours } from "@/types/models";
import { mapMemberServiceFromDB, mapServiceFromDB } from "@/lib/db/services";
import { computeAvailability, type Slot } from "@/lib/services/availability";
import { maxDuration } from "@/lib/services/price";

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

const DAY_KEYS = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"] as const;

function isMissingBookingPageSlugError(error: { message?: string } | null | undefined) {
  return !!error?.message && error.message.includes("booking_page_slug");
}

function availabilityToWorkingHours(slots: AvailabilitySlot[]): Record<string, WorkingHours> {
  const out: Record<string, WorkingHours> = {};
  for (const s of slots) {
    if (!s.enabled) continue;
    out[DAY_KEYS[s.day]] = { start: s.startTime, end: s.endTime };
  }
  return out;
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

// Server-side input sanitisation for the public booking endpoints. The
// dashboard, email/SMS templates, and Stripe descriptions all read these
// fields back as plain text — React escapes by default but our SMS/email
// bodies don't, so we strip HTML tags here so a "<script>...</script>"
// payload never lands in a downstream channel that would render it.
//
// Block-level tag-pair stripper. Runs FIRST so `<script>alert(1)</script>`
// vanishes including its inner text — otherwise the simple tag-stripper
// below would leave "alert(1)" behind. Order matters: keep these aligned
// with elements that can carry executable / displayable content.
const SCRIPTABLE_TAGS_RE = /<(script|style|iframe|object|embed|noscript)\b[^>]*>[\s\S]*?<\/\1\s*>/gi;
const HTML_TAG_RE = /<[^>]*>/g;
// Strip C0/C1 control bytes that have no business in a name/notes field.
// Built with `new RegExp` so the source stays plain ASCII — embedding raw
// 0x00..0x1F bytes makes git treat the whole file as binary.
const CONTROL_CHARS_RE = new RegExp("[\x00-\x1F\x7F]", "g");

export function sanitizeClientText(value: string, maxLen: number): string {
  return (value ?? "")
    .replace(SCRIPTABLE_TAGS_RE, "")
    .replace(HTML_TAG_RE, "")
    .replace(CONTROL_CHARS_RE, "")
    .trim()
    .slice(0, maxLen);
}

/** Same email regex the client form uses — keep them in sync. */
export const EMAIL_REGEX = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/;

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

/**
 * Run the canonical availability engine for a (workspace, service, date).
 * Loads the service, members, member_services, bookings, and (if the service
 * needs them) resource locks, then defers to computeAvailability so the public
 * booking flow honors buffers, weekdays, locations, resources, min-notice, and
 * per-member duration overrides identically to the admin path.
 */
async function computeServiceAvailability(params: {
  workspaceId: string;
  serviceId: string;
  date: string;
  defaultAvailability: AvailabilitySlot[];
  step?: number;
  preferredMemberId?: string;
  locationId?: string;
  variantId?: string;
  /** Sum of selected add-on durations (or basket-wide overflow) added to base. */
  extraDurationMinutes?: number;
}): Promise<{ slots: Slot[]; service: Service | null }> {
  const supabase = await createAdminClient();

  const [serviceRes, memberRes, memberServicesRes, bookingRes, blockRes] = await Promise.all([
    supabase
      .from("services")
      .select("*")
      .eq("workspace_id", params.workspaceId)
      .eq("id", params.serviceId)
      .maybeSingle(),
    supabase
      .from("workspace_members")
      .select("id, status, working_hours, days_off, leave_periods")
      .eq("workspace_id", params.workspaceId)
      .eq("status", "active"),
    supabase
      .from("member_services")
      .select("*")
      .eq("workspace_id", params.workspaceId)
      .eq("service_id", params.serviceId),
    supabase
      .from("bookings")
      .select("id, assigned_to_id, start_at, end_at, service_id, status")
      .eq("workspace_id", params.workspaceId)
      .neq("status", "cancelled")
      .gte("start_at", `${params.date}T00:00:00`)
      .lte("start_at", `${params.date}T23:59:59`),
    supabase
      .from("calendar_blocks")
      .select("team_member_id, start_time, end_time")
      .eq("workspace_id", params.workspaceId)
      .gte("start_time", `${params.date}T00:00:00`)
      .lte("start_time", `${params.date}T23:59:59`),
  ]);

  if (!serviceRes.data) {
    return { slots: [], service: null };
  }

  const service = mapServiceFromDB(serviceRes.data as Record<string, unknown>);

  // Resource-by-location check. If the service requires a resource that
  // isn't physically present at the picked location, no slot is bookable —
  // skip the rest of the work and return empty slots.
  if (
    params.locationId &&
    service.requiredResourceIds &&
    service.requiredResourceIds.length > 0
  ) {
    const { data: rsrcRows } = await supabase
      .from("resources")
      .select("id, location_ids")
      .eq("workspace_id", params.workspaceId)
      .in("id", service.requiredResourceIds);
    const allAvailableHere = (rsrcRows ?? []).every((r) => {
      const ids = (r.location_ids as string[] | null) ?? [];
      return ids.length === 0 || ids.includes(params.locationId!);
    });
    if (!allAvailableHere) {
      return { slots: [], service };
    }
  }

  const memberRows = (memberRes.data ?? []) as Array<{
    id: string;
    status?: string;
    working_hours?: Record<string, WorkingHours>;
    days_off?: string[];
    leave_periods?: { start: string; end: string; reason?: string }[];
  }>;
  const members = memberRows.map((m) => ({
    id: m.id,
    status: (m.status ?? "active") as TeamMember["status"],
    workingHours: m.working_hours ?? {},
    daysOff: m.days_off ?? [],
    leavePeriods: m.leave_periods ?? [],
  })) as unknown as TeamMember[];

  const memberServices: MemberService[] = (memberServicesRes.data ?? []).map((row) =>
    mapMemberServiceFromDB(row as Record<string, unknown>),
  );

  const bookingRows = (bookingRes.data ?? []) as Array<{
    id: string;
    assigned_to_id: string | null;
    start_at: string;
    end_at: string;
    service_id: string | null;
  }>;

  // Pre-fetch buffers + required resources for every service that has a
  // booking on the day. Existing bookings get inflated by their own service's
  // bufferBefore/bufferAfter so a "15-min cleanup after" actually blocks the
  // chair, not just the visible service window.
  const otherServiceIds = Array.from(
    new Set(
      [params.serviceId, ...bookingRows.map((b) => b.service_id)].filter(
        (id): id is string => Boolean(id),
      ),
    ),
  );
  const bufByService = new Map<string, { before: number; after: number }>();
  const reqByService = new Map<string, string[]>();
  if (otherServiceIds.length > 0) {
    const { data: serviceRows } = await supabase
      .from("services")
      .select("id, buffer_before, buffer_after, buffer_minutes, required_resource_ids")
      .in("id", otherServiceIds);
    for (const r of (serviceRows ?? []) as Array<{
      id: string;
      buffer_before: number | null;
      buffer_after: number | null;
      buffer_minutes: number | null;
      required_resource_ids: string[] | null;
    }>) {
      const before = r.buffer_before ?? 0;
      const after = r.buffer_after ?? r.buffer_minutes ?? 0;
      bufByService.set(r.id, { before, after });
      reqByService.set(r.id, r.required_resource_ids ?? []);
    }
  }

  const bookings = bookingRows.map((b) => {
    const buf = (b.service_id && bufByService.get(b.service_id)) || { before: 0, after: 0 };
    const inflStart = new Date(new Date(b.start_at).getTime() - buf.before * 60_000).toISOString();
    const inflEnd = new Date(new Date(b.end_at).getTime() + buf.after * 60_000).toISOString();
    return {
      id: b.id,
      date: params.date,
      assignedToId: b.assigned_to_id ?? undefined,
      startAt: inflStart,
      endAt: inflEnd,
      serviceId: b.service_id ?? undefined,
    };
  }) as unknown as Booking[];

  // Calendar blocks (manual time-off, holds, lunch breaks) read by the engine
  // as ordinary busy intervals against the assigned member. A block with no
  // team_member_id is workspace-wide -> represented as a busy interval against
  // every active member.
  type BlockRow = { team_member_id: string | null; start_time: string; end_time: string };
  const blockRows = (blockRes.data ?? []) as BlockRow[];
  for (const block of blockRows) {
    const startAt = block.start_time;
    const endAt = block.end_time;
    if (block.team_member_id) {
      bookings.push({
        id: `block-${block.team_member_id}-${startAt}`,
        date: params.date,
        assignedToId: block.team_member_id,
        startAt,
        endAt,
      } as unknown as Booking);
    } else {
      for (const m of memberRows) {
        bookings.push({
          id: `block-all-${m.id}-${startAt}`,
          date: params.date,
          assignedToId: m.id,
          startAt,
          endAt,
        } as unknown as Booking);
      }
    }
  }

  let resourceBusyByDay: Map<string, { start: number; end: number }[]> | undefined;
  if (service.requiredResourceIds && service.requiredResourceIds.length > 0) {
    resourceBusyByDay = new Map();
    for (const b of bookingRows) {
      const reqs = (b.service_id && reqByService.get(b.service_id)) || [];
      if (reqs.length === 0) continue;
      const buf = (b.service_id && bufByService.get(b.service_id)) || { before: 0, after: 0 };
      const start =
        new Date(b.start_at).getHours() * 60 +
        new Date(b.start_at).getMinutes() -
        buf.before;
      const end =
        new Date(b.end_at).getHours() * 60 +
        new Date(b.end_at).getMinutes() +
        buf.after;
      for (const rid of reqs) {
        const list = resourceBusyByDay.get(rid) ?? [];
        list.push({ start, end });
        resourceBusyByDay.set(rid, list);
      }
    }
  }

  let memberDurationOverride: number | undefined;
  if (params.preferredMemberId) {
    const ms = memberServices.find(
      (x) => x.memberId === params.preferredMemberId && x.serviceId === params.serviceId,
    );
    if (ms?.durationOverride) memberDurationOverride = ms.durationOverride;
  }

  const workingHours = availabilityToWorkingHours(params.defaultAvailability);

  const slots = computeAvailability({
    date: params.date,
    service,
    workingHours,
    bookings,
    members,
    memberServices,
    preferredMemberId: params.preferredMemberId,
    locationId: params.locationId,
    step: params.step ?? 30,
    variantId: params.variantId,
    memberDurationOverride,
    resourceBusyByDay,
    extraDurationMinutes: params.extraDurationMinutes ?? 0,
  });

  return { slots, service };
}

interface MemberStub {
  id: string;
}

/**
 * Returns the members eligible to take a specific (date, startTime) slot.
 * Backed by computeAvailability so buffers, weekdays, locations, resources,
 * min-notice, and per-member duration overrides are all honored.
 */
export async function getAvailableMembersForSlot(params: {
  workspaceId: string;
  serviceId: string;
  date: string;
  startTime: string;
  /** Retained for compat — engine derives endTime from service + extraDurationMinutes. */
  endTime?: string;
  defaultAvailability: AvailabilitySlot[];
  preferredMemberId?: string;
  locationId?: string;
  variantId?: string;
  /** Sum of selected add-on durations the new booking will consume. */
  extraDurationMinutes?: number;
}): Promise<MemberStub[]> {
  const { slots } = await computeServiceAvailability({
    workspaceId: params.workspaceId,
    serviceId: params.serviceId,
    date: params.date,
    defaultAvailability: params.defaultAvailability,
    step: 30,
    preferredMemberId: params.preferredMemberId,
    locationId: params.locationId,
    variantId: params.variantId,
    extraDurationMinutes: params.extraDurationMinutes,
  });

  const target = slots.find((s) => s.time === params.startTime);
  if (!target) return [];
  return target.memberIds.map((id) => ({ id }));
}

/**
 * Returns the bookable times-of-day for a (date, service) pair, honoring
 * service-level rules via computeAvailability.
 */
export async function getAvailableTimeSlots(params: {
  workspaceId: string;
  serviceId: string;
  date: string;
  /**
   * The total duration the booking needs to occupy. When larger than the
   * engine's computed base (variants/tiers/longest-tier), the diff is forwarded
   * as extraDurationMinutes so the slot envelope expands. Used by basket-wide
   * sizing on the info endpoint.
   */
  durationMinutes: number;
  defaultAvailability: AvailabilitySlot[];
  preferredMemberId?: string;
  locationId?: string;
  variantId?: string;
}): Promise<string[]> {
  // Derive how much extra duration to ask the engine to reserve. The engine
  // already covers the longest tier/variant via maxDuration(service); only the
  // overflow (e.g. cart total > slowest tier) needs to be pushed in.
  const supabase = await createAdminClient();
  const { data: serviceRow } = await supabase
    .from("services")
    .select("*")
    .eq("workspace_id", params.workspaceId)
    .eq("id", params.serviceId)
    .maybeSingle();
  let extraDurationMinutes = 0;
  if (serviceRow) {
    const svc = mapServiceFromDB(serviceRow as Record<string, unknown>);
    const engineBase = maxDuration(svc);
    extraDurationMinutes = Math.max(0, params.durationMinutes - engineBase);
  }

  const { slots } = await computeServiceAvailability({
    workspaceId: params.workspaceId,
    serviceId: params.serviceId,
    date: params.date,
    defaultAvailability: params.defaultAvailability,
    step: 30,
    preferredMemberId: params.preferredMemberId,
    locationId: params.locationId,
    variantId: params.variantId,
    extraDurationMinutes,
  });

  const today = new Date();
  const isToday = params.date === today.toISOString().split("T")[0];
  const nowMin = today.getHours() * 60 + today.getMinutes();

  return slots
    .filter((s) => {
      if (!isToday) return true;
      const [h, m] = s.time.split(":").map(Number);
      return h * 60 + m > nowMin;
    })
    .map((s) => s.time);
}
