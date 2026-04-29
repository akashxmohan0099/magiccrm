import { NextRequest, NextResponse } from "next/server";
import { generateId } from "@/lib/id";
import { createClient } from "@/lib/supabase-server";
import { extractContactFromValues } from "@/lib/form-response-extract";
import type { FormFieldConfig } from "@/types/models";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const formResponseId =
      typeof body.formResponseId === "string" ? body.formResponseId : "";

    if (!formResponseId) {
      return NextResponse.json({ error: "Missing formResponseId" }, { status: 400 });
    }

    // RLS gates this: the row only resolves when the caller is the workspace owner.
    const supabase = await createClient();

    const { data: response, error: responseError } = await supabase
      .from("form_responses")
      .select("id, workspace_id, form_id, values, inquiry_id")
      .eq("id", formResponseId)
      .maybeSingle();

    if (responseError || !response) {
      return NextResponse.json({ error: "Form response not found" }, { status: 404 });
    }

    // Idempotent: if already promoted, return the existing inquiry id.
    if (response.inquiry_id) {
      return NextResponse.json({ inquiryId: response.inquiry_id }, { status: 200 });
    }

    let fields: FormFieldConfig[] = [];
    if (response.form_id) {
      const { data: form } = await supabase
        .from("forms")
        .select("fields")
        .eq("id", response.form_id)
        .maybeSingle();
      if (form?.fields) fields = form.fields as FormFieldConfig[];
    }

    const values = (response.values ?? {}) as Record<string, string>;
    const contact = extractContactFromValues(values, fields);

    const now = new Date().toISOString();
    const inquiryId = generateId();

    const { error: inquiryError } = await supabase.from("inquiries").insert({
      id: inquiryId,
      workspace_id: response.workspace_id,
      name: contact.name,
      email: contact.email ?? "",
      phone: contact.phone ?? "",
      message: contact.message,
      service_interest: contact.serviceInterest,
      event_type: contact.eventType,
      date_range: contact.dateRange,
      source: "form",
      status: "new",
      form_id: response.form_id,
      form_response_id: response.id,
      submission_values: values,
      created_at: now,
      updated_at: now,
    });

    if (inquiryError) {
      console.error("[promote-form-response] inquiry insert:", inquiryError);
      return NextResponse.json({ error: "Failed to promote" }, { status: 500 });
    }

    await supabase
      .from("form_responses")
      .update({ inquiry_id: inquiryId })
      .eq("id", response.id);

    return NextResponse.json({ inquiryId }, { status: 201 });
  } catch (error) {
    console.error("[promote-form-response] unexpected:", error);
    return NextResponse.json({ error: "Failed to promote" }, { status: 500 });
  }
}
