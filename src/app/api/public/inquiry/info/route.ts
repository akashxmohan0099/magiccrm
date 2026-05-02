import { NextRequest, NextResponse } from "next/server";
import { rateLimit } from "@/lib/rate-limit";
import { lookupPublicInquiryFormBySlug } from "@/lib/server/public-inquiries";

export async function GET(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  const { allowed } = await rateLimit(`public-inquiry-info:${ip}`, 30, 60_000);
  if (!allowed) {
    return NextResponse.json({ error: "Too many requests." }, { status: 429 });
  }

  const { searchParams } = new URL(req.url);
  const slug = searchParams.get("slug");

  if (!slug) {
    return NextResponse.json({ error: "Missing slug" }, { status: 400 });
  }

  const lookup = await lookupPublicInquiryFormBySlug(slug);
  if (lookup.status === "error") {
    // DB / RLS / network failure. 5xx so the page can show "try again" copy
    // instead of telling visitors their real form doesn't exist.
    return NextResponse.json({ error: "Lookup failed" }, { status: 503 });
  }
  if (lookup.status === "not_found") {
    return NextResponse.json({ error: "Form not found" }, { status: 404 });
  }
  if (lookup.status === "ambiguous") {
    return NextResponse.json({ error: "Form slug is not unique" }, { status: 409 });
  }
  if (lookup.status === "disabled") {
    // 410 Gone is the closest semantic match for "this resource existed but
    // the owner has turned it off." The page reads the body to render the
    // right copy (rather than the generic "not found" message).
    return NextResponse.json({ error: "Form disabled", disabled: true }, { status: 410 });
  }

  const form = lookup.form;
  return NextResponse.json({
    id: form.id,
    name: form.name,
    slug: form.slug,
    fields: form.fields,
    branding: form.branding,
    autoPromoteToInquiry: form.autoPromoteToInquiry,
    workspaceLogo: form.workspaceLogo,
    services: form.services,
  });
}
