import { createClient } from "@/lib/supabase";
import type { Booking, AvailabilitySlot } from "@/types/models";

// ---------------------------------------------------------------------------
// Time conversion helpers
// ---------------------------------------------------------------------------

/**
 * Combine a date string ("2024-03-15") and a time string ("09:00") into
 * a TIMESTAMPTZ string that Supabase can store.
 */
function toTimestamptz(date: string, time: string): string {
  return `${date}T${time}:00`;
}

/**
 * Extract "HH:MM" from a TIMESTAMPTZ string.
 */
function extractTime(timestamptz: string): string {
  const d = new Date(timestamptz);
  const hh = String(d.getHours()).padStart(2, "0");
  const mm = String(d.getMinutes()).padStart(2, "0");
  return `${hh}:${mm}`;
}

/**
 * Extract "YYYY-MM-DD" from a TIMESTAMPTZ string.
 */
function extractDate(timestamptz: string): string {
  const d = new Date(timestamptz);
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

// ---------------------------------------------------------------------------
// snake_case <-> camelCase mapping
// ---------------------------------------------------------------------------

/** Convert a Supabase row (snake_case) to a frontend Booking (camelCase). */
export function mapBookingFromDB(row: Record<string, unknown>): Booking {
  const cancellationPolicyConsent = row.cancellation_policy_consent as
    | Booking["cancellationPolicyConsent"]
    | undefined;

  return {
    id: row.id as string,
    title: row.title as string,
    clientId: (row.client_id as string) || undefined,
    date: row.start_at ? extractDate(row.start_at as string) : (row.date as string) || "",
    startTime: row.start_at ? extractTime(row.start_at as string) : "",
    endTime: row.end_at ? extractTime(row.end_at as string) : "",
    status: row.status as Booking["status"],
    bookingType: (row.booking_type as Booking["bookingType"]) || undefined,
    notes: (row.notes as string) || "",
    recurring: (row.recurring as Booking["recurring"]) || undefined,
    serviceId: (row.service_id as string) || undefined,
    serviceName: (row.service_name as string) || undefined,
    price: (row.price as number) ?? undefined,
    duration: (row.duration as number) ?? undefined,
    cancellationReason: (row.cancellation_reason as string) || undefined,
    cancellationPolicyConsent: cancellationPolicyConsent ?? undefined,
    assignedToId: (row.assigned_to_id as string) || undefined,
    assignedToName: (row.assigned_to_name as string) || undefined,
    satisfactionRating: (row.satisfaction_rating as number) ?? undefined,
    satisfactionFeedback: (row.satisfaction_feedback as string) || undefined,
    ratedAt: (row.rated_at as string) || undefined,
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
  };
}

/** Convert a frontend Booking (camelCase) to a Supabase-ready object (snake_case). */
function mapBookingToDB(
  workspaceId: string,
  booking: Record<string, unknown>
): Record<string, unknown> {
  const row: Record<string, unknown> = { workspace_id: workspaceId };

  if (booking.id !== undefined) row.id = booking.id;
  if (booking.title !== undefined) row.title = booking.title;
  if (booking.clientId !== undefined) row.client_id = booking.clientId || null;
  if (booking.status !== undefined) row.status = booking.status;
  if (booking.bookingType !== undefined) row.booking_type = booking.bookingType || null;
  if (booking.notes !== undefined) row.notes = booking.notes || "";
  if (booking.recurring !== undefined) row.recurring = booking.recurring || null;
  if (booking.serviceId !== undefined) row.service_id = booking.serviceId || null;
  if (booking.serviceName !== undefined) row.service_name = booking.serviceName || null;
  if (booking.price !== undefined) row.price = booking.price ?? null;
  if (booking.duration !== undefined) row.duration = booking.duration ?? null;
  if (booking.cancellationReason !== undefined)
    row.cancellation_reason = booking.cancellationReason || null;
  if (booking.cancellationPolicyConsent !== undefined)
    row.cancellation_policy_consent = booking.cancellationPolicyConsent ?? null;
  if (booking.assignedToId !== undefined) row.assigned_to_id = booking.assignedToId || null;
  if (booking.assignedToName !== undefined) row.assigned_to_name = booking.assignedToName || null;
  if (booking.satisfactionRating !== undefined)
    row.satisfaction_rating = booking.satisfactionRating ?? null;
  if (booking.satisfactionFeedback !== undefined)
    row.satisfaction_feedback = booking.satisfactionFeedback || null;
  if (booking.ratedAt !== undefined) row.rated_at = booking.ratedAt || null;
  if (booking.createdAt !== undefined) row.created_at = booking.createdAt;
  if (booking.updatedAt !== undefined) row.updated_at = booking.updatedAt;

  // Convert date + startTime / endTime to TIMESTAMPTZ
  const date = booking.date as string | undefined;
  if (date && booking.startTime !== undefined) {
    row.start_at = toTimestamptz(date, booking.startTime as string);
  }
  if (date && booking.endTime !== undefined) {
    row.end_at = toTimestamptz(date, booking.endTime as string);
  }

  return row;
}

// ---------------------------------------------------------------------------
// CRUD operations
// ---------------------------------------------------------------------------

/** Fetch all bookings for a workspace. */
export async function fetchBookings(workspaceId: string) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("bookings")
    .select("*")
    .eq("workspace_id", workspaceId)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data;
}

/** Insert a new booking row. */
export async function dbCreateBooking(
  workspaceId: string,
  booking: Booking
) {
  const supabase = createClient();
  const row = mapBookingToDB(workspaceId, booking as unknown as Record<string, unknown>);

  const { data, error } = await supabase
    .from("bookings")
    .insert(row)
    .select()
    .single();

  if (error) throw error;
  return data;
}

/** Update an existing booking row. Only sends fields that are provided. */
export async function dbUpdateBooking(
  workspaceId: string,
  id: string,
  updates: Partial<Booking>
) {
  const supabase = createClient();

  // If we have startTime or endTime but no date, we need the existing date to
  // build the TIMESTAMPTZ. Fetch it first if necessary.
  let effectiveUpdates = updates as Record<string, unknown>;
  if ((updates.startTime || updates.endTime) && !updates.date) {
    const { data: existing } = await supabase
      .from("bookings")
      .select("start_at")
      .eq("id", id)
      .eq("workspace_id", workspaceId)
      .single();
    if (existing?.start_at) {
      effectiveUpdates = {
        ...effectiveUpdates,
        date: extractDate(existing.start_at as string),
      };
    }
  }

  const row = mapBookingToDB(workspaceId, effectiveUpdates);
  // Remove workspace_id -- it's used in the filter, not the update payload
  delete row.workspace_id;

  const { error } = await supabase
    .from("bookings")
    .update(row)
    .eq("id", id)
    .eq("workspace_id", workspaceId);

  if (error) throw error;
}

/** Delete a booking row. */
export async function dbDeleteBooking(workspaceId: string, id: string) {
  const supabase = createClient();
  const { error } = await supabase
    .from("bookings")
    .delete()
    .eq("id", id)
    .eq("workspace_id", workspaceId);

  if (error) throw error;
}

/** Upsert many bookings at once (used for initial localStorage -> Supabase migration). */
export async function dbUpsertBookings(
  workspaceId: string,
  bookings: Booking[]
) {
  if (bookings.length === 0) return;

  const supabase = createClient();
  const rows = bookings.map((b) =>
    mapBookingToDB(workspaceId, b as unknown as Record<string, unknown>)
  );

  const { error } = await supabase
    .from("bookings")
    .upsert(rows, { onConflict: "id" });

  if (error) throw error;
}

// ---------------------------------------------------------------------------
// Booking settings in workspace_modules
// ---------------------------------------------------------------------------

export interface BookingSettings {
  availability: AvailabilitySlot[];
  cancellationPolicy: string;
}

/** Fetch booking settings from workspace_modules.settings JSONB. */
export async function fetchBookingSettings(
  workspaceId: string
): Promise<BookingSettings | null> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("workspace_modules")
    .select("settings")
    .eq("workspace_id", workspaceId)
    .eq("module_id", "bookings-calendar")
    .maybeSingle();

  if (error) throw error;
  if (!data?.settings) return null;

  const settings = data.settings as Record<string, unknown>;
  return {
    availability: (settings.availability as AvailabilitySlot[]) || [],
    cancellationPolicy: (settings.cancellationPolicy as string) || "",
  };
}

/** Save booking settings to workspace_modules.settings JSONB. */
export async function saveBookingSettings(
  workspaceId: string,
  settings: BookingSettings
) {
  const supabase = createClient();
  const { error } = await supabase
    .from("workspace_modules")
    .upsert(
      {
        workspace_id: workspaceId,
        module_id: "bookings-calendar",
        settings: {
          availability: settings.availability,
          cancellationPolicy: settings.cancellationPolicy,
        },
      },
      { onConflict: "workspace_id,module_id" }
    );

  if (error) throw error;
}
