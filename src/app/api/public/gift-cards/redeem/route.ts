/**
 * Public gift-card lookup. Used by the booking page to validate a code
 * before checkout — returns remaining balance + status. The actual
 * redemption (drawing down balance) happens server-side at checkout
 * via the operator-only redeem endpoint, since draw-down is irreversible.
 *
 * POST /api/public/gift-cards/redeem
 * Body: { slug, code }
 */
import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase-server";
import { rateLimit } from "@/lib/rate-limit";
import { resolveBookingWorkspaceBySlug } from "@/lib/server/public-booking";

export async function POST(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  const { allowed } = await rateLimit(`public-giftcard-lookup:${ip}`, 30, 60_000);
  if (!allowed) return NextResponse.json({ error: "Too many requests" }, { status: 429 });

  try {
    const body = await req.json();
    const { slug, code } = body;
    if (!slug || !code) return NextResponse.json({ error: "Missing fields" }, { status: 400 });

    const resolved = await resolveBookingWorkspaceBySlug(slug);
    if (!resolved) return NextResponse.json({ error: "Workspace not found" }, { status: 404 });

    const supabase = await createAdminClient();
    const { data: card } = await supabase
      .from("gift_cards")
      .select("id, code, remaining_balance, status, expires_at")
      .eq("workspace_id", resolved.workspaceId)
      .eq("code", code)
      .maybeSingle();

    if (!card) return NextResponse.json({ error: "Invalid code" }, { status: 404 });

    if (card.status !== "active") {
      return NextResponse.json(
        { error: `This card is ${card.status}.`, status: card.status },
        { status: 400 },
      );
    }
    if (card.expires_at && new Date(card.expires_at as string) < new Date()) {
      return NextResponse.json(
        { error: "This card has expired.", status: "expired" },
        { status: 400 },
      );
    }

    return NextResponse.json({
      id: card.id,
      remainingBalance: Number(card.remaining_balance),
      status: card.status,
    });
  } catch (err) {
    console.error("[gift-cards/redeem] error:", err);
    return NextResponse.json({ error: "Failed to look up card" }, { status: 500 });
  }
}
