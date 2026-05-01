import { NextRequest, NextResponse } from "next/server";
import { generateId } from "@/lib/id";
import { rateLimit } from "@/lib/rate-limit";
import { createAdminClient } from "@/lib/supabase-server";
import { lookupPublicInquiryFormBySlug } from "@/lib/server/public-inquiries";
import { extractContactFromValues } from "@/lib/form-response-extract";
import {
  prepareSubmission,
  sanitiseAgainstForm,
} from "@/lib/forms/sanitise-public-submission";

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

    // Pre-lookup sanitisation: drop reserved `__*` keys (so a public
    // submitter can't spoof `__test`) and short-circuit on honeypot hits
    // before paying for the DB lookup.
    const prepared = prepareSubmission(values);
    if (prepared.kind === "honeypot") {
      return NextResponse.json({ success: true }, { status: 201 });
    }

    // Use the typed lookup so DB errors and disabled-form state are
    // distinguishable from genuine 404s. The earlier helper collapsed
    // all three to null, which meant an outage during submission read as
    // "form gone" to the visitor.
    const lookup = await lookupPublicInquiryFormBySlug(slug);
    if (lookup.status === "error") {
      return NextResponse.json({ error: "Lookup failed" }, { status: 503 });
    }
    if (lookup.status === "not_found") {
      return NextResponse.json({ error: "Form not found" }, { status: 404 });
    }
    if (lookup.status === "disabled") {
      // Form exists but the operator turned it off — visitor shouldn't be
      // able to submit. 410 mirrors the info route.
      return NextResponse.json(
        { error: "This form isn't accepting responses right now.", disabled: true },
        { status: 410 },
      );
    }
    const form = lookup.form;

    // Post-lookup sanitisation: whitelist by configured field names, strip
    // conditionally-hidden values, run validators (formats + option
    // membership + maxLength + file payload).
    const sanitised = sanitiseAgainstForm(form.fields, prepared.values);
    if (!sanitised.ok) {
      if (sanitised.kind === "field-error") {
        return NextResponse.json(
          { error: sanitised.error, fieldErrors: sanitised.fieldErrors },
          { status: 400 },
        );
      }
      // file-error
      return NextResponse.json({ error: sanitised.error }, { status: 413 });
    }
    const submissionValues = sanitised.values;

    const contact = extractContactFromValues(submissionValues, form.fields);

    const now = new Date().toISOString();
    const supabase = await createAdminClient();

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
    let inquiryPromotionFailed = false;
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
        // The form_response insert above already succeeded. If we return 500
        // here, the visitor sees an error and may resubmit — creating a
        // duplicate form_response with no rollback path. Treat this as
        // partial success: the visitor's data is captured, and the operator
        // can re-promote from the dashboard. Logged loudly so the failure is
        // visible.
        console.error(
          "[public/inquiry] inquiry promotion failed, response saved as " +
            `id=${responseId}; operator can re-promote manually:`,
          inquiryError,
        );
        inquiryId = null;
        inquiryPromotionFailed = true;
      }

      // Back-pointer for convenience queries (canonical FK is inquiries.form_response_id).
      // Skip when promotion failed — the column stays null and the operator
      // can promote later from the dashboard.
      if (inquiryId) {
        await supabase
          .from("form_responses")
          .update({ inquiry_id: inquiryId })
          .eq("id", responseId)
          .eq("workspace_id", form.workspaceId);
      }
    }

    try {
      const { error: logError } = await supabase.from("activity_log").insert({
        workspace_id: form.workspaceId,
        type: "create",
        entity_type: inquiryId ? "inquiries" : "form_responses",
        entity_id: inquiryId ?? responseId,
        description: `Form "${form.name}" submitted by ${contact.name}`,
      });
      if (logError) {
        // Non-fatal but worth seeing in logs — the audit trail has gaps.
        console.warn("[public/inquiry] activity_log insert failed:", logError);
      }
    } catch (err) {
      console.warn("[public/inquiry] activity_log insert threw:", err);
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

    return NextResponse.json(
      { success: true, inquiryPromotionFailed },
      { status: 201 },
    );
  } catch (error) {
    console.error("[public/inquiry] Unexpected error:", error);
    return NextResponse.json({ error: "Failed to submit inquiry" }, { status: 500 });
  }
}
