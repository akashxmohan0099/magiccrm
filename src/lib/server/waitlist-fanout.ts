/**
 * Booking waitlist fan-out — when a booking is cancelled, notify every
 * active waitlist entry that matches the freed slot (same service, the
 * cancelled date falls within the entry's preferred window, optional
 * artist match).
 *
 * Each notified entry's `notified_at` is stamped so we don't re-notify
 * on subsequent cancellations of unrelated bookings. We intentionally
 * notify ALL matches in parallel — first-come-first-served on the
 * actual rebook, decided by who clicks the link first and grabs the slot.
 */
import { createAdminClient } from "@/lib/supabase-server";
import { sendEmail } from "@/lib/integrations/email";

export async function fanOutWaitlistForBooking(
  workspaceId: string,
  cancelledBookingId: string,
): Promise<{ notified: number }> {
  const supabase = await createAdminClient();

  // Pull the cancelled booking to know what slot freed up.
  const { data: booking } = await supabase
    .from("bookings")
    .select("id, service_id, date, assigned_to_id, workspace_id")
    .eq("id", cancelledBookingId)
    .eq("workspace_id", workspaceId)
    .maybeSingle();
  if (!booking) return { notified: 0 };

  // Find waitlist entries that match: same service, same workspace,
  // not yet notified, not yet fulfilled, and the cancelled date falls
  // inside the preferred window.
  const { data: entries } = await supabase
    .from("booking_waitlist")
    .select("*")
    .eq("workspace_id", workspaceId)
    .eq("service_id", booking.service_id)
    .is("notified_at", null)
    .is("fulfilled_booking_id", null);

  if (!entries || entries.length === 0) return { notified: 0 };

  const cancelledDate = booking.date as string;
  const matching = entries.filter((e) => {
    const start = e.preferred_date as string;
    const end = (e.preferred_date_end as string | null) ?? start;
    if (cancelledDate < start || cancelledDate > end) return false;
    // If the entry pinned an artist, only match when the freed booking
    // was that artist. Otherwise any artist counts.
    if (e.artist_id && e.artist_id !== booking.assigned_to_id) return false;
    return true;
  });

  if (matching.length === 0) return { notified: 0 };

  // Pull workspace name + booking page slug for the email body.
  const { data: settings } = await supabase
    .from("workspace_settings")
    .select("business_name, booking_page_slug")
    .eq("workspace_id", workspaceId)
    .maybeSingle();
  const businessName = (settings?.business_name as string) ?? "Your salon";
  const slug = (settings?.booking_page_slug as string) ?? "";
  const bookingUrl = slug ? `https://magiccrm.app/book/${slug}` : "";

  const now = new Date().toISOString();

  // Fire emails + mark notified in parallel. Failures don't roll back the
  // status flip — the entry stays "notified" because we've at least tried,
  // and we want to avoid re-spamming on future cancellations.
  await Promise.allSettled(
    matching.map(async (e) => {
      try {
        await sendEmail({
          to: e.client_email as string,
          subject: `A spot opened up at ${businessName} on ${cancelledDate}`,
          html: `
            <p>Hi ${e.client_name},</p>
            <p>Good news — a spot just opened up on <strong>${cancelledDate}</strong> for the service you waitlisted.</p>
            ${bookingUrl ? `<p><a href="${bookingUrl}">Tap here to grab it</a> before someone else does.</p>` : ""}
            <p>— ${businessName}</p>
          `,
        });
      } catch (err) {
        console.warn("[waitlist-fanout] email failed:", err);
      }
      await supabase
        .from("booking_waitlist")
        .update({ notified_at: now, updated_at: now })
        .eq("id", e.id as string)
        .eq("workspace_id", workspaceId);
    }),
  );

  return { notified: matching.length };
}
