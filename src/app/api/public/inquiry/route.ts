import { NextRequest, NextResponse } from "next/server";
import { generateId } from "@/lib/id";
import { rateLimit } from "@/lib/rate-limit";
import { createAdminClient } from "@/lib/supabase-server";
import { fetchPublicInquiryFormBySlug } from "@/lib/server/public-inquiries";
import { extractContactFromValues } from "@/lib/form-response-extract";

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

    // Honeypot — silently swallow filled traps. Returning 201 means bots
    // get no signal that they were detected, while real users (who never
    // touch the hidden input) submit normally.
    if (values.__hp) {
      return NextResponse.json({ success: true }, { status: 201 });
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

    const contact = extractContactFromValues(values, form.fields);
    if (contact.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contact.email)) {
      return NextResponse.json({ error: "Invalid email address" }, { status: 400 });
    }

    const now = new Date().toISOString();
    const supabase = await createAdminClient();

    // Strip the honeypot field — never persist it.
    const { __hp: _hp, ...submissionValues } = values;
    void _hp;

    const responseId = generateId();
    const { error: responseError } = await supabase.from("form_responses").insert({
      id: responseId,
      workspace_id: form.workspaceId,
      form_id: form.id,
      values: submissionValues,
      contact_name: contact.name,
      contact_email: contact.email,
      contact_phone: contact.phone,
      submitted_at: now,
    });

    if (responseError) {
      console.error("[public/inquiry] form_response insert error:", responseError);
      return NextResponse.json({ error: "Failed to submit inquiry" }, { status: 500 });
    }

    let inquiryId: string | null = null;
    if (form.autoPromoteToInquiry) {
      inquiryId = generateId();
      const { error: inquiryError } = await supabase.from("inquiries").insert({
        id: inquiryId,
        workspace_id: form.workspaceId,
        name: contact.name,
        email: contact.email ?? "",
        phone: contact.phone ?? "",
        message: contact.message,
        service_interest: contact.serviceInterest,
        event_type: contact.eventType,
        date_range: contact.dateRange,
        source: "form",
        status: "new",
        form_id: form.id,
        form_response_id: responseId,
        submission_values: submissionValues,
        created_at: now,
        updated_at: now,
      });

      if (inquiryError) {
        console.error("[public/inquiry] inquiry insert error:", inquiryError);
        // The form_response succeeded — surface failure but don't lose the response.
        return NextResponse.json({ error: "Failed to submit inquiry" }, { status: 500 });
      }

      // Back-pointer for convenience queries (canonical FK is inquiries.form_response_id).
      await supabase
        .from("form_responses")
        .update({ inquiry_id: inquiryId })
        .eq("id", responseId)
        .eq("workspace_id", form.workspaceId);
    }

    try {
      await supabase.from("activity_log").insert({
        workspace_id: form.workspaceId,
        type: "create",
        entity_type: inquiryId ? "inquiries" : "form_responses",
        entity_id: inquiryId ?? responseId,
        description: `Form "${form.name}" submitted by ${contact.name}`,
      });
    } catch {
      // non-critical
    }

    // Fire-and-forget confirmations (auto-reply email/SMS + owner notify).
    // Never blocks the response — submission already succeeded.
    try {
      const { sendInquiryConfirmation } = await import(
        "@/lib/server/send-inquiry-confirmation"
      );
      await sendInquiryConfirmation({
        workspaceId: form.workspaceId,
        form: { id: form.id, name: form.name, branding: form.branding },
        contact,
        inquiryId,
      });
    } catch (err) {
      console.error("[public/inquiry] confirmation send error:", err);
    }

    return NextResponse.json({ success: true }, { status: 201 });
  } catch (error) {
    console.error("[public/inquiry] Unexpected error:", error);
    return NextResponse.json({ error: "Failed to submit inquiry" }, { status: 500 });
  }
}
