import type { Form, FormFieldConfig } from "@/types/models";

/**
 * Editor-side validation for the form draft.
 *
 * Six independent rule blocks used to live in `FormEditor` as separate
 * `useMemo` calls. Consolidating them here gives the editor one input and
 * one output, makes every rule individually unit-testable, and keeps the
 * autosave gate logic trivial (`canSave === !errors.blocking`).
 *
 * Inputs:
 *   - `name`, `slug`, `fields` come from the editor's draft state.
 *   - `allForms` is the workspace's full forms list (for collision checks).
 *   - `formId` excludes the form being edited from those checks.
 *
 * Output shape:
 *   - Top-level form errors (`name`, `slug`) are single strings, empty when
 *     OK. The editor renders them under the relevant input.
 *   - Per-field errors are keyed maps so each field card can pin its own
 *     inline error.
 *   - `blocker` summarises the first blocking issue for the save-status
 *     pill ("can't autosave — Name is required").
 *   - `canSave` is the AND of all clear states; the editor reads this to
 *     decide whether to fire autosave.
 */
export interface FormDraftErrors {
  /** Empty string when the name is valid. */
  nameError: string;
  /** Empty string when the slug is valid. */
  slugError: string;
  /** Per-field map keyed by field.name. Empty when no option-field issues. */
  fieldOptionErrors: Record<string, string>;
  /** Per-field map keyed by field.name. Empty when no duplicate field names. */
  fieldNameDuplicates: Record<string, string>;
  /** Aggregate signal for the save-pill — non-empty when option-field issues exist. */
  optionsError: string;
  /** Aggregate signal for the save-pill — non-empty when field names collide. */
  fieldNameError: string;
  /** First blocking message for the save-status pill, or empty when canSave. */
  blocker: string;
  /** Whether autosave should fire. */
  canSave: boolean;
}

interface ValidateInput {
  name: string;
  slug: string;
  fields: FormFieldConfig[];
  allForms: Form[];
  formId: string;
}

const SLUG_RE = /^[a-z0-9-]+$/;
const PLACEHOLDER_OPTION_RE = /^option \d+$/i;

// Field types that present a list of selectable options to the visitor.
function fieldHasOptions(type: FormFieldConfig["type"]): boolean {
  return (
    type === "select" ||
    type === "multi_select" ||
    type === "radio" ||
    type === "checkbox"
  );
}

export function validateFormDraft(input: ValidateInput): FormDraftErrors {
  const { name, slug, fields, allForms, formId } = input;

  // ── Slug ────────────────────────────────────────────
  const trimmedSlug = slug.trim();
  let slugError = "";
  if (!trimmedSlug) {
    slugError = "Slug is required — this is the form's public URL.";
  } else if (!SLUG_RE.test(trimmedSlug)) {
    slugError = "Use lowercase letters, numbers, and dashes only.";
  } else if (
    allForms.some((f) => f.id !== formId && f.slug === trimmedSlug)
  ) {
    slugError = "Another form already uses this slug.";
  }

  // ── Name ────────────────────────────────────────────
  const trimmedName = name.trim();
  let nameError = "";
  if (!trimmedName) {
    nameError = "Name is required.";
  } else {
    const dupName = allForms.some(
      (f) =>
        f.id !== formId && f.name.trim().toLowerCase() === trimmedName.toLowerCase(),
    );
    if (dupName) nameError = "Another form already uses this name.";
  }

  // ── Option fields ───────────────────────────────────
  // Reject placeholder seeds (Option 1, Option 2) so dropdowns don't ship
  // with garbage on the public form. Required option fields need ≥2 real
  // options; optional ones need at least 1.
  const fieldOptionErrors: Record<string, string> = {};
  for (const f of fields) {
    if (!fieldHasOptions(f.type)) continue;
    const opts = (f.options ?? []).map((o) => o.trim()).filter(Boolean);
    const onlyPlaceholders =
      opts.length > 0 && opts.every((o) => PLACEHOLDER_OPTION_RE.test(o));
    if (opts.length === 0) {
      fieldOptionErrors[f.name] = "Add at least one option before publishing.";
    } else if (onlyPlaceholders) {
      fieldOptionErrors[f.name] =
        "Replace the placeholder options with real choices.";
    } else if (opts.length < 2 && f.required) {
      fieldOptionErrors[f.name] = "Add at least two options.";
    }
  }
  const optionsError =
    Object.keys(fieldOptionErrors).length > 0
      ? "One or more option fields need real choices."
      : "";

  // ── Field-name uniqueness ───────────────────────────
  // Names are stable post-creation, so this only fires on legacy forms
  // where labels used to derive `name`.
  const counts = new Map<string, number>();
  for (const f of fields) counts.set(f.name, (counts.get(f.name) ?? 0) + 1);
  const fieldNameDuplicates: Record<string, string> = {};
  for (const [n, c] of counts) {
    if (c > 1) fieldNameDuplicates[n] = `Duplicate field name "${n}" — rename one of them.`;
  }
  const fieldNameError =
    Object.keys(fieldNameDuplicates).length > 0
      ? "Two fields share the same internal name."
      : "";

  // ── Aggregate ───────────────────────────────────────
  // Order matters: the save-status pill displays only the first blocker, so
  // we pick the most actionable issue (name, then slug, then per-field) to
  // keep the operator's eye where the fix is.
  const blocker = nameError || slugError || optionsError || fieldNameError || "";
  const canSave = !blocker;

  return {
    nameError,
    slugError,
    fieldOptionErrors,
    fieldNameDuplicates,
    optionsError,
    fieldNameError,
    blocker,
    canSave,
  };
}
