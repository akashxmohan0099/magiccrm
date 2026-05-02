import { createClient } from "@/lib/supabase";
import type { Booking, BookingStatus } from "@/types/models";

// ---------------------------------------------------------------------------
// snake_case <-> camelCase mapping
// ---------------------------------------------------------------------------

/** Convert a Supabase row (snake_case) to a frontend Booking (camelCase). */
export function mapBookingFromDB(row: Record<string, unknown>): Booking {
  return {
    id: row.id as string,
    workspaceId: row.workspace_id as string,
    clientId: row.client_id as string,
    serviceId: (row.service_id as string) || undefined,
    additionalServiceIds: (row.additional_service_ids as string[] | null) ?? undefined,
    assignedToId: (row.assigned_to_id as string) || undefined,
    date: row.date as string,
    startAt: row.start_at as string,
    endAt: row.end_at as string,
    status: row.status as BookingStatus,
    notes: (row.notes as string) || "",
    inquiryId: (row.inquiry_id as string) || undefined,
    conversationId: (row.conversation_id as string) || undefined,
    cancellationReason: (row.cancellation_reason as string) || undefined,
    reminderSentAt: (row.reminder_sent_at as string) || undefined,
    followupSentAt: (row.followup_sent_at as string) || undefined,
    reviewRequestSentAt: (row.review_request_sent_at as string) || undefined,
    intakeFormSentAt: (row.intake_form_sent_at as string) || undefined,
    groupParentBookingId: (row.group_parent_booking_id as string | null) ?? undefined,
    groupGuestName: (row.group_guest_name as string | null) ?? undefined,
    selectedVariantId: (row.selected_variant_id as string | null) ?? undefined,
    selectedAddonIds: (row.selected_addon_ids as string[] | null) ?? undefined,
    resolvedPrice:
      row.resolved_price === null || row.resolved_price === undefined
        ? undefined
        : Number(row.resolved_price),
    giftCardCode: (row.gift_card_code as string | null) ?? undefined,
    membershipId: (row.membership_id as string | null) ?? undefined,
    intakeAnswers: (row.intake_answers as Record<string, string> | null) ?? undefined,
    locationId: (row.location_id as string | null) ?? undefined,
    locationType: (row.location_type as string | null) ?? undefined,
    address: (row.address as string | null) ?? undefined,
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
  };
}

/** Convert a frontend Booking (camelCase) to a Supabase-ready object (snake_case). */
function mapBookingToDB(
  workspaceId: string,
  data: Record<string, unknown>
): Record<string, unknown> {
  const row: Record<string, unknown> = { workspace_id: workspaceId };

  if (data.id !== undefined) row.id = data.id;
  if (data.clientId !== undefined) row.client_id = data.clientId;
  if (data.serviceId !== undefined) row.service_id = data.serviceId || null;
  if (data.additionalServiceIds !== undefined) {
    const ids = (data.additionalServiceIds as string[] | undefined) ?? [];
    row.additional_service_ids = ids.length ? ids : null;
  }
  if (data.assignedToId !== undefined) row.assigned_to_id = data.assignedToId || null;
  if (data.date !== undefined) row.date = data.date;
  if (data.startAt !== undefined) row.start_at = data.startAt;
  if (data.endAt !== undefined) row.end_at = data.endAt;
  if (data.status !== undefined) row.status = data.status;
  if (data.notes !== undefined) row.notes = data.notes;
  if (data.inquiryId !== undefined) row.inquiry_id = data.inquiryId || null;
  if (data.conversationId !== undefined) row.conversation_id = data.conversationId || null;
  if (data.cancellationReason !== undefined) row.cancellation_reason = data.cancellationReason || null;
  if (data.reminderSentAt !== undefined) row.reminder_sent_at = data.reminderSentAt || null;
  if (data.followupSentAt !== undefined) row.followup_sent_at = data.followupSentAt || null;
  if (data.reviewRequestSentAt !== undefined) row.review_request_sent_at = data.reviewRequestSentAt || null;
  if (data.intakeFormSentAt !== undefined) row.intake_form_sent_at = data.intakeFormSentAt || null;
  if (data.groupParentBookingId !== undefined) row.group_parent_booking_id = data.groupParentBookingId || null;
  if (data.groupGuestName !== undefined) row.group_guest_name = data.groupGuestName || null;
  if (data.selectedVariantId !== undefined) row.selected_variant_id = data.selectedVariantId || null;
  if (data.selectedAddonIds !== undefined) row.selected_addon_ids = data.selectedAddonIds;
  if (data.resolvedPrice !== undefined) row.resolved_price = data.resolvedPrice;
  if (data.giftCardCode !== undefined) row.gift_card_code = data.giftCardCode || null;
  if (data.membershipId !== undefined) row.membership_id = data.membershipId || null;
  if (data.intakeAnswers !== undefined) row.intake_answers = data.intakeAnswers ?? {};
  if (data.locationId !== undefined) row.location_id = data.locationId || null;
  if (data.locationType !== undefined) row.location_type = data.locationType || null;
  if (data.address !== undefined) row.address = data.address || null;
  if (data.createdAt !== undefined) row.created_at = data.createdAt;
  if (data.updatedAt !== undefined) row.updated_at = data.updatedAt;

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
  return (data ?? []).map(mapBookingFromDB);
}

/** Insert a new booking row. */
export async function dbCreateBooking(
  workspaceId: string,
  data: Record<string, unknown>
) {
  const supabase = createClient();
  const row = mapBookingToDB(workspaceId, data);

  const { data: created, error } = await supabase
    .from("bookings")
    .insert(row)
    .select()
    .single();

  if (error) throw error;
  return mapBookingFromDB(created);
}

/** Update an existing booking row. Only sends fields that are provided. */
export async function dbUpdateBooking(
  workspaceId: string,
  id: string,
  data: Record<string, unknown>
) {
  const supabase = createClient();
  const row = mapBookingToDB(workspaceId, data);
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
