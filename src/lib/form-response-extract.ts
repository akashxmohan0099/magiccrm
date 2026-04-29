import type { FormFieldConfig } from "@/types/models";

export interface ExtractedContact {
  name: string;
  email: string | null;
  phone: string | null;
  message: string;
  serviceInterest: string | null;
  eventType: string | null;
  dateRange: string | null;
}

const NAME_KEYS = ["name", "full_name", "fullName", "client_name"];
const EMAIL_KEYS = ["email"];
const PHONE_KEYS = ["phone", "mobile", "contact_phone"];
const MESSAGE_KEYS = ["message", "your_message", "details"];
const SERVICE_INTEREST_KEYS = ["service_interest", "service_you_re_interested_in"];
const EVENT_TYPE_KEYS = ["event_type"];
const DATE_RANGE_KEYS = ["date_range", "wedding_date___date_range"];

const HANDLED_KEYS = new Set<string>([
  ...NAME_KEYS,
  ...EMAIL_KEYS,
  ...PHONE_KEYS,
  ...MESSAGE_KEYS,
  ...SERVICE_INTEREST_KEYS,
  ...EVENT_TYPE_KEYS,
  ...DATE_RANGE_KEYS,
]);

function firstValue(values: Record<string, string>, keys: readonly string[]): string {
  for (const key of keys) {
    const value = values[key];
    if (value) return value;
  }
  return "";
}

export function extractContactFromValues(
  values: Record<string, string>,
  fields: FormFieldConfig[],
): ExtractedContact {
  const fieldLabels = new Map(fields.map((f) => [f.name, f.label]));

  // Any field declared as type "service" feeds into serviceInterest, even
  // when the user renames its label/key. The first non-empty service field
  // wins (matches the intent that a form has one canonical interest).
  const serviceFieldNames = fields
    .filter((f) => f.type === "service")
    .map((f) => f.name);
  const serviceFromTypedField = firstValue(values, serviceFieldNames);

  const name = firstValue(values, NAME_KEYS) || "Anonymous";
  const email = firstValue(values, EMAIL_KEYS) || null;
  const phone = firstValue(values, PHONE_KEYS) || null;
  const directMessage = firstValue(values, MESSAGE_KEYS);
  const serviceInterest =
    serviceFromTypedField || firstValue(values, SERVICE_INTEREST_KEYS) || null;
  const eventType = firstValue(values, EVENT_TYPE_KEYS) || null;
  const dateRange = firstValue(values, DATE_RANGE_KEYS) || null;

  // Service-typed fields are already accounted for via serviceInterest, so
  // exclude them from the supplemental message dump to avoid duplication.
  const handledServiceNames = new Set(serviceFieldNames);
  const supplementalLines = Object.entries(values)
    .filter(([key, value]) => value && !HANDLED_KEYS.has(key) && !handledServiceNames.has(key))
    .map(([key, value]) => `${fieldLabels.get(key) ?? key}: ${value}`);

  const message = [
    directMessage,
    supplementalLines.length > 0 ? supplementalLines.join("\n") : "",
  ]
    .filter(Boolean)
    .join(directMessage ? "\n\n" : "");

  return { name, email, phone, message, serviceInterest, eventType, dateRange };
}
