import type { FormFieldConfig } from "@/types/models";
import { isFieldVisible } from "@/lib/form-logic";
import { validatePublicInquirySubmission } from "@/lib/forms/public-validation";
import { validateFileFields } from "@/lib/forms/server-file-validation";

/**
 * Public-submission sanitisation pipeline, shared between the production
 * POST handler and the dev Zustand fallback so the two paths can't drift.
 *
 * The pipeline is split in two so callers can short-circuit honeypot traps
 * before reaching the DB lookup — the renderer's hidden input means real
 * visitors never set `__hp`, so any submission that does is a bot, and we
 * deliberately don't pay the form-lookup cost for them.
 *
 *   prepareSubmission(rawValues)                — pre-lookup
 *     1. Drops reserved `__*` keys (except `__hp`) so a public submitter
 *        can't spoof markers like `__test` (which the dashboard filters
 *        out — letting a visitor set it would silently hide their row).
 *     2. Returns `{ kind: "honeypot" }` if the trap fired, otherwise
 *        `{ kind: "values", values }` with the stripped shape.
 *
 *   sanitiseAgainstForm(fields, values)         — post-lookup
 *     3. Whitelists keys to the form's configured field names.
 *     4. Strips values for conditionally-hidden fields (showWhen unmet).
 *     5. Runs validatePublicInquirySubmission (required + formats +
 *        option membership + maxLength + maxSelections).
 *     6. Runs validateFileFields (per-field operator rules + global caps).
 */

export type PrepareResult =
  | { kind: "honeypot" }
  | { kind: "values"; values: Record<string, string> };

export type SanitiseResult =
  | { ok: true; values: Record<string, string> }
  | {
      ok: false;
      kind: "field-error";
      error: string;
      fieldErrors: Record<string, string>;
      firstErrorField: string;
    }
  | { ok: false; kind: "file-error"; error: string };

const isReservedKey = (key: string) => key.startsWith("__");

/**
 * Pre-lookup phase. Pure — no `fields` needed, so the route can call this
 * before reaching for the DB and short-circuit on honeypot hits.
 */
export function prepareSubmission(
  rawValues: Record<string, string>,
): PrepareResult {
  const stripped: Record<string, string> = {};
  for (const [k, v] of Object.entries(rawValues)) {
    if (k === "__hp") {
      stripped[k] = v;
      continue;
    }
    if (isReservedKey(k)) continue;
    stripped[k] = v;
  }

  if (stripped.__hp) {
    return { kind: "honeypot" };
  }

  // __hp won't have been filled, but strip the key anyway so it never
  // reaches downstream validation/persist.
  delete stripped.__hp;
  return { kind: "values", values: stripped };
}

/**
 * Post-lookup phase. Whitelist → strip-hidden → validators. Accepts the
 * already-prepared values from `prepareSubmission`.
 */
export function sanitiseAgainstForm(
  fields: FormFieldConfig[],
  values: Record<string, string>,
): SanitiseResult {
  // Whitelist by configured field names.
  const fieldNames = new Set(fields.map((f) => f.name));
  const whitelisted: Record<string, string> = {};
  for (const [k, v] of Object.entries(values)) {
    if (fieldNames.has(k)) whitelisted[k] = v;
  }

  // Drop conditionally-hidden values. Hidden-type fields (URL params) stay
  // because they're meant to be invisible-but-present.
  for (const f of fields) {
    if (f.type === "hidden") continue;
    if (!isFieldVisible(f, whitelisted, fields)) {
      delete whitelisted[f.name];
    }
  }

  // Required + format + option-membership.
  const { fieldErrors, firstErrorField } = validatePublicInquirySubmission(
    fields,
    whitelisted,
  );
  if (firstErrorField) {
    return {
      ok: false,
      kind: "field-error",
      error: fieldErrors[firstErrorField] ?? "Invalid submission",
      fieldErrors,
      firstErrorField,
    };
  }

  // File payloads.
  const fileError = validateFileFields(fields, whitelisted);
  if (fileError) {
    return { ok: false, kind: "file-error", error: fileError };
  }

  return { ok: true, values: whitelisted };
}
