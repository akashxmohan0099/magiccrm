import type { FormFieldConfig } from "@/types/models";

const MULTI_VALUE_TYPES: ReadonlyArray<FormFieldConfig["type"]> = [
  "multi_select",
  "checkbox",
];

/**
 * Split a stored answer into the list of selected values. Multi-value field
 * types (multi_select, checkbox) are stored as comma-joined strings to keep
 * the existing string-based submission pipeline intact.
 */
export function splitMulti(value: string): string[] {
  if (!value) return [];
  return value
    .split(",")
    .map((v) => v.trim())
    .filter(Boolean);
}

export function isMultiValueField(type: FormFieldConfig["type"]): boolean {
  return MULTI_VALUE_TYPES.includes(type);
}

/**
 * Evaluate a field's `showWhen` rule against the current answers. Fields with
 * no rule always show. Hidden fields always evaluate as visible — they're not
 * user-facing and are auto-populated.
 */
export function isFieldVisible(
  field: FormFieldConfig,
  values: Record<string, string>,
  fields: FormFieldConfig[],
): boolean {
  const rule = field.showWhen;
  if (!rule) return true;
  const refField = fields.find((f) => f.name === rule.fieldName);
  // Reference field was deleted — treat the rule as inert.
  if (!refField) return true;
  // If the reference field is itself hidden, the dependent field shows too.
  if (!isFieldVisible(refField, values, fields)) return false;

  const raw = (values[rule.fieldName] || "").trim();
  const targets = rule.values.map((v) => v.trim()).filter(Boolean);
  if (targets.length === 0) return true;

  if (rule.operator === "includes" || isMultiValueField(refField.type)) {
    const selected = splitMulti(raw);
    const overlap = selected.some((s) => targets.includes(s));
    if (rule.operator === "not_equals") return !overlap;
    return overlap;
  }

  if (rule.operator === "not_equals") return !targets.includes(raw);
  return targets.includes(raw);
}

/**
 * Capture URL-parameter values for hidden fields. `paramKeys` is comma-separated
 * — first matching key wins, falling back to `defaultValue`.
 */
export function captureHiddenFieldValues(
  fields: FormFieldConfig[],
  searchParams: URLSearchParams | null,
): Record<string, string> {
  const out: Record<string, string> = {};
  for (const f of fields) {
    if (f.type !== "hidden") continue;
    const keys = (f.paramKeys || "")
      .split(",")
      .map((k) => k.trim())
      .filter(Boolean);
    let v: string | null = null;
    for (const k of keys) {
      const got = searchParams?.get(k);
      if (got != null && got !== "") {
        v = got;
        break;
      }
    }
    if (v == null && f.defaultValue) v = f.defaultValue;
    if (v != null) out[f.name] = v;
  }
  return out;
}
