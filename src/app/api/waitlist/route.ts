import { NextRequest, NextResponse } from "next/server";
import { rateLimit } from "@/lib/rate-limit";
import { createAdminClient } from "@/lib/supabase-server";
import { sendEmail } from "@/lib/integrations/email";

const ALLOWED_PERSONAS = new Set(["Hair", "Lash", "MUA", "Nails", "Spa", "Skin", "Other"]);
const NOTIFY_TO = "akashxmohan@gmail.com";

export async function POST(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  const { allowed } = await rateLimit(`waitlist-signup:${ip}`, 5, 60_000);
  if (!allowed) {
    return NextResponse.json({ error: "Too many requests." }, { status: 429 });
  }

  try {
    const body = await req.json().catch(() => ({}));
    const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
    const rawPersonas = Array.isArray(body.personas) ? body.personas : [];
    const personas = rawPersonas
      .filter((p: unknown): p is string => typeof p === "string")
      .filter((p: string) => ALLOWED_PERSONAS.has(p));
    const source = typeof body.source === "string" ? body.source.slice(0, 64) : "landing";

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: "Invalid email" }, { status: 400 });
    }

    const referrer = req.headers.get("referer") || null;
    const userAgent = req.headers.get("user-agent")?.slice(0, 256) || null;

    const supabase = await createAdminClient();
    const { error } = await supabase.from("landing_waitlist_signups").upsert(
      {
        email,
        personas,
        source,
        referrer,
        user_agent: userAgent,
        ip,
      },
      { onConflict: "email", ignoreDuplicates: false },
    );

    if (error) {
      console.error("[waitlist] Insert error:", error);
      return NextResponse.json({ error: "Failed to join waitlist" }, { status: 500 });
    }

    // Best-effort notification email — never block the response on this.
    // Resend is fire-and-forget; failures are logged server-side only.
    void sendEmail({
      to: NOTIFY_TO,
      subject: `New waitlist signup: ${email}`,
      html: `
        <p><strong>${email}</strong></p>
        <p>Personas: ${personas.length ? personas.join(", ") : "(none)"}</p>
        <p>Source: ${source}</p>
        <p>Referrer: ${referrer ?? "(none)"}</p>
        <p>IP: ${ip}</p>
      `,
    }).catch((err) => console.error("[waitlist] Notify failed:", err));

    return NextResponse.json({ success: true }, { status: 201 });
  } catch (err) {
    console.error("[waitlist] Unexpected error:", err);
    return NextResponse.json({ error: "Failed to join waitlist" }, { status: 500 });
  }
}
