import type { FormFieldConfig } from "@/types/models";
import { isFieldVisible, splitMulti } from "@/lib/form-logic";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
// Loose phone check — strip non-digits then require ≥7 digits. We don't ship
// libphonenumber here; the goal is to reject obvious garbage like "12345"
// without blocking international formats. Real E.164 validation can layer on
// later if/when we ship a country selector.
const PHONE_MIN_DIGITS = 7;

// Hard cap for any single text-typed answer. Renderer enforces field-level
// `maxLength` for textareas; this is the floor for fields without one and a
// defence against a direct API submit dropping a 10MB string into JSONB.
// 50_000 chars covers any realistic answer including pasted email threads.
const ABSOLUTE_TEXT_LIMIT = 50_000;

const TEXT_TYPES = new Set(["text", "textarea", "email", "phone", "url"]);

export interface ValidationResult {
  fieldErrors: Record<string, string>;
  firstErrorField?: string;
}

export function validatePublicInquirySubmission(
  fields: FormFieldConfig[],
  values: Record<string, string>,
): ValidationResult {
  const errors: Record<string, string> = {};
  let firstErrorField: string | undefined;
  const record = (name: string, message: string) => {
    if (errors[name]) return;
    errors[name] = message;
    firstErrorField ??= name;
  };

  for (const field of fields) {
    if (field.type === "hidden") continue;
    if (!isFieldVisible(field, values, fields)) continue;

    const raw = (values[field.name] ?? "").trim();

    if (field.required && !raw) {
      record(field.name, `${field.label} is required`);
      continue;
    }
    if (!raw) continue;

    // Global text-size cap — protects the JSONB column from a single 10MB
    // string when the operator hasn't set a per-field maxLength.
    if (TEXT_TYPES.has(field.type) && raw.length > ABSOLUTE_TEXT_LIMIT) {
      record(field.name, `${field.label} is too long.`);
      continue;
    }

    if (field.type === "email" && !EMAIL_RE.test(raw)) {
      record(field.name, "Enter a valid email address");
      continue;
    }
    if (field.type === "phone") {
      const digits = raw.replace(/\D/g, "");
      if (digits.length < PHONE_MIN_DIGITS) {
        record(field.name, "Enter a valid phone number");
        continue;
      }
    }
    if (field.type === "url") {
      try {
        new URL(raw);
      } catch {
        record(field.name, "Enter a valid URL (including https://)");
        continue;
      }
    }
    if (field.type === "number") {
      const n = Number(raw);
      if (Number.isNaN(n)) {
        record(field.name, "Enter a number");
        continue;
      }
      if (typeof field.min === "number" && n < field.min) {
        record(field.name, `Must be at least ${field.min}`);
        continue;
      }
      if (typeof field.max === "number" && n > field.max) {
        record(field.name, `Must be at most ${field.max}`);
        continue;
      }
    }

    // Per-field maxLength on textareas. Editor surfaces this and the renderer
    // shows a live counter; we enforce it server-side so a direct API submit
    // can't paste a 100k-char rant past the operator's configured cap.
    if (field.type === "textarea" && typeof field.maxLength === "number") {
      if (raw.length > field.maxLength) {
        record(field.name, `${field.label} must be ${field.maxLength} characters or fewer.`);
        continue;
      }
    }

    // Single-pick option membership: select / radio. Reject answers that
    // aren't in the operator's published option list — a direct API submit
    // could otherwise persist whatever string they want.
    if ((field.type === "select" || field.type === "radio") && field.options?.length) {
      if (!field.options.includes(raw)) {
        record(field.name, `${field.label} must be one of the listed options.`);
        continue;
      }
    }

    // Multi-pick option membership + maxSelections. Multi-selects store as
    // a comma-separated string; splitMulti is the same parser the renderer
    // uses, so the contract is identical.
    if (field.type === "multi_select" || field.type === "checkbox") {
      const picked = splitMulti(raw);
      if (field.options?.length) {
        const allowed = new Set(field.options);
        const invalid = picked.find((p) => !allowed.has(p));
        if (invalid !== undefined) {
          record(field.name, `${field.label} must be from the listed options.`);
          continue;
        }
      }
      if (typeof field.maxSelections === "number" && picked.length > field.maxSelections) {
        record(
          field.name,
          `${field.label} allows up to ${field.maxSelections} selection${
            field.maxSelections === 1 ? "" : "s"
          }.`,
        );
        continue;
      }
    }
  }

  return { fieldErrors: errors, firstErrorField };
}
