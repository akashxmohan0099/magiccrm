import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";
import { generateId } from "@/lib/id";
import { extractContactFromValues } from "@/lib/form-response-extract";
import type { FormFieldConfig, Form } from "@/types/models";

// POST /api/forms/[id]/test-submit
// Fires a fake submission through the same pipeline a public submit uses
// so the operator can verify auto-reply lands, owner notification fires,
// and (if auto-promote is on) the inquiry routes correctly. The result is
// marked as a test (name prefixed `[TEST]`, values include `__test: "true"`)
// so it doesn't pollute lead counts or analytics — Leads and Forms surfaces
// can filter on this marker if they need to.
//
// Auth: requires an authenticated workspace member who can read this form.
// RLS on the `forms` table gates the lookup; if the form id doesn't belong
// to the caller's workspace, the lookup returns nothing and we 404.

// Generate a deterministic sample value per field type. Skips file fields
// (can't fake an upload) and hidden fields (auto-populated only on the
// public page from URL params). Uses the field's first option for choice
// types so routed thank-you variants are reproducible from a test.
function sampleValueFor(field: FormFieldConfig): string | undefined {
  switch (field.type) {
    case "text":
      return field.placeholder?.trim() || "Test value";
    case "email":
      // Replaced server-side with the operator's actual email below so the
      // auto-reply lands somewhere they can see it.
      return "test@example.com";
    case "phone":
      return "+61400000000";
    case "url":
      return "https://example.com";
    case "number":
      return "1";
    case "textarea":
      return "This is a test submission from the form builder.";
    case "select":
    case "radio":
      return field.options?.[0] ?? "Test";
    case "multi_select":
    case "checkbox":
      return field.options?.[0] ?? "Test";
    case "date":
      return new Date().toISOString().slice(0, 10);
    case "date_range": {
      const today = new Date().toISOString().slice(0, 10);
      const week = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
        .toISOString()
        .slice(0, 10);
      return `${today} to ${week}`;
    }
    case "time":
      return "10:00";
    case "service":
      // Service-typed fields resolve via the live services list. Operator
      // can re-test with a real service from the public URL.
      return "Test service";
    case "file":
    case "hidden":
      return undefined;
    default:
      return "Test";
  }
}

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id: formId } = await params;
  if (!formId) {
    return NextResponse.json({ error: "Missing form id" }, { status: 400 });
  }

  try {
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // RLS scopes this lookup to forms in the caller's workspace.
    const { data: formRow, error: formErr } = await supabase
      .from("forms")
      .select(
        "id, workspace_id, type, name, fields, branding, slug, enabled, auto_promote_to_inquiry, created_at, updated_at",
      )
      .eq("id", formId)
      .maybeSingle();

    if (formErr || !formRow) {
      // Most common cause: autosave hasn't landed yet (or was held by a
      // validation error like a slug conflict), so the local Zustand row
      // exists but the DB doesn't. Surface that explicitly so the operator
      // knows to look at save state rather than chase a phantom 404.
      return NextResponse.json(
        {
          error:
            "We couldn't find this form in the database — it may not have finished saving yet, or another error is holding the autosave. Check the Form tab for any error indicator and try again in a moment.",
        },
        { status: 404 },
      );
    }

    const fields = (formRow.fields ?? []) as FormFieldConfig[];

    // Build sample values. Operator's email replaces the synthetic email
    // sample so the auto-reply email actually arrives in their inbox.
    const operatorEmail = user.email ?? "test@example.com";
    const operatorName =
      (user.user_metadata?.full_name as string | undefined) ||
      (user.user_metadata?.name as string | undefined) ||
      operatorEmail.split("@")[0] ||
      "Test";

    const values: Record<string, string> = { __test: "true" };
    for (const f of fields) {
      if (f.type === "email") {
        values[f.name] = operatorEmail;
        continue;
      }
      const sample = sampleValueFor(f);
      if (sample !== undefined) values[f.name] = sample;
    }

    const contact = extractContactFromValues(values, fields);
    // Force the operator's identity into the contact so confirmations route
    // back to them, and prefix `[TEST]` on the name so it's obvious in Leads.
    contact.name = `[TEST] ${operatorName}`;
    contact.email = operatorEmail;

    const now = new Date().toISOString();
    const responseId = generateId();

    const { error: responseError } = await supabase
      .from("form_responses")
      .insert({
        id: responseId,
        workspace_id: formRow.workspace_id,
        form_id: formRow.id,
        values,
        contact_name: contact.name,
        contact_email: contact.email,
        contact_phone: contact.phone,
        submitted_at: now,
      });

    if (responseError) {
      console.error("[forms/test-submit] form_response insert:", responseError);
      return NextResponse.json(
        { error: "Failed to record test submission" },
        { status: 500 },
      );
    }

    let inquiryId: string | null = null;
    if (formRow.auto_promote_to_inquiry) {
      inquiryId = generateId();
      const { error: inquiryError } = await supabase.from("inquiries").insert({
        id: inquiryId,
        workspace_id: formRow.workspace_id,
        name: contact.name,
        email: contact.email ?? "",
        phone: contact.phone ?? "",
        message: contact.message,
        service_interest: contact.serviceInterest,
        event_type: contact.eventType,
        date_range: contact.dateRange,
        source: "form",
        status: "new",
        form_id: formRow.id,
        form_response_id: responseId,
        created_at: now,
        updated_at: now,
      });

      if (inquiryError) {
        console.error("[forms/test-submit] inquiry insert:", inquiryError);
        // Form response already saved — surface but don't drop it.
        return NextResponse.json(
          { error: "Failed to record test inquiry" },
          { status: 500 },
        );
      }

      await supabase
        .from("form_responses")
        .update({ inquiry_id: inquiryId })
        .eq("id", responseId);
    }

    // Fire the same confirmations the public route fires, so the operator
    // sees auto-reply email + owner notification end-to-end. Awaited (not
    // fire-and-forget) so the toast can reflect actual send results.
    let confirmationResult: unknown = null;
    try {
      const { sendInquiryConfirmation } = await import(
        "@/lib/server/send-inquiry-confirmation"
      );
      const form: Pick<Form, "id" | "name" | "branding"> = {
        id: formRow.id,
        name: formRow.name,
        branding: formRow.branding ?? {},
      };
      confirmationResult = await sendInquiryConfirmation({
        workspaceId: formRow.workspace_id,
        form,
        contact,
        inquiryId,
      });
    } catch (err) {
      console.error("[forms/test-submit] confirmation send:", err);
    }

    return NextResponse.json({
      success: true,
      responseId,
      inquiryId,
      autoPromoted: !!inquiryId,
      confirmation: confirmationResult,
    });
  } catch (err) {
    console.error("[forms/test-submit] unexpected:", err);
    return NextResponse.json(
      { error: "Test submission failed" },
      { status: 500 },
    );
  }
}
