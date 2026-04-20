import { NextRequest, NextResponse } from "next/server";
import { generateId } from "@/lib/id";
import { rateLimit } from "@/lib/rate-limit";
import { createAdminClient } from "@/lib/supabase-server";
import { fetchPublicInquiryFormBySlug } from "@/lib/server/public-inquiries";

function normalizeValues(raw: unknown): Record<string, string> {
  if (!raw || typeof raw !== "object") {
    return {};
  }

  return Object.fromEntries(
    Object.entries(raw as Record<string, unknown>).map(([key, value]) => [
      key,
      typeof value === "string" ? value.trim() : String(value ?? "").trim(),
    ]),
  );
}

function firstValue(
  values: Record<string, string>,
  keys: string[],
): string {
  for (const key of keys) {
    const value = values[key];
    if (value) return value;
  }
  return "";
}

export async function POST(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  const { allowed } = await rateLimit(`public-inquiry-submit:${ip}`, 10, 60_000);
  if (!allowed) {
    return NextResponse.json({ error: "Too many requests." }, { status: 429 });
  }

  try {
    const body = await req.json();
    const slug = typeof body.slug === "string" ? body.slug : "";
    const values = normalizeValues(body.values);

    if (!slug) {
      return NextResponse.json({ error: "Missing slug" }, { status: 400 });
    }

    const form = await fetchPublicInquiryFormBySlug(slug);
    if (!form) {
      return NextResponse.json({ error: "Form not found" }, { status: 404 });
    }

    for (const field of form.fields) {
      if (field.required && !values[field.name]) {
        return NextResponse.json({ error: `${field.label} is required` }, { status: 400 });
      }
    }

    const email = firstValue(values, ["email"]);
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: "Invalid email address" }, { status: 400 });
    }

    const fieldLabels = new Map(form.fields.map((field) => [field.name, field.label]));
    const name = firstValue(values, ["name", "full_name", "fullName", "client_name"]) || "Anonymous";
    const phone = firstValue(values, ["phone", "mobile", "contact_phone"]);
    const directMessage = firstValue(values, ["message", "your_message", "details"]);
    const serviceInterest = firstValue(values, ["service_interest", "service_you_re_interested_in"]);
    const eventType = firstValue(values, ["event_type"]);
    const dateRange = firstValue(values, ["date_range", "wedding_date___date_range"]);

    const handledKeys = new Set([
      "name",
      "full_name",
      "fullName",
      "client_name",
      "email",
      "phone",
      "mobile",
      "contact_phone",
      "message",
      "your_message",
      "details",
      "service_interest",
      "service_you_re_interested_in",
      "event_type",
      "date_range",
      "wedding_date___date_range",
    ]);

    const supplementalLines = Object.entries(values)
      .filter(([key, value]) => value && !handledKeys.has(key))
      .map(([key, value]) => `${fieldLabels.get(key) ?? key}: ${value}`);

    const message = [
      directMessage,
      supplementalLines.length > 0 ? supplementalLines.join("\n") : "",
    ]
      .filter(Boolean)
      .join(directMessage ? "\n\n" : "");

    const now = new Date().toISOString();
    const inquiryId = generateId();
    const supabase = await createAdminClient();

    const { error: inquiryError } = await supabase.from("inquiries").insert({
      id: inquiryId,
      workspace_id: form.workspaceId,
      name,
      email,
      phone,
      message,
      service_interest: serviceInterest || null,
      event_type: eventType || null,
      date_range: dateRange || null,
      source: "form",
      status: "new",
      form_id: form.id,
      created_at: now,
      updated_at: now,
    });

    if (inquiryError) {
      console.error("[public/inquiry] Insert error:", inquiryError);
      return NextResponse.json({ error: "Failed to submit inquiry" }, { status: 500 });
    }

    try {
      await supabase.from("activity_log").insert({
        workspace_id: form.workspaceId,
        type: "create",
        entity_type: "inquiries",
        entity_id: inquiryId,
        description: `Public inquiry submitted via "${form.name}" by ${name}`,
      });
    } catch {
      // non-critical
    }

    return NextResponse.json({ success: true }, { status: 201 });
  } catch (error) {
    console.error("[public/inquiry] Unexpected error:", error);
    return NextResponse.json({ error: "Failed to submit inquiry" }, { status: 500 });
  }
}
