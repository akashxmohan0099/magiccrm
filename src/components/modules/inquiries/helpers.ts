import type { Inquiry, InquiryStatus } from "@/types/models";

// Map a form-field name to an Inquiry value. Prefers the structured
// submissionValues blob, falls back to the legacy structured columns.
export function inquiryFieldValue(inquiry: Inquiry, fieldName: string): string {
  const fromBlob = inquiry.submissionValues?.[fieldName];
  if (fromBlob != null && fromBlob !== "") return fromBlob;
  switch (fieldName) {
    case "name":
    case "full_name":
    case "fullName":
    case "client_name":
      return inquiry.name || "";
    case "email":
      return inquiry.email || "";
    case "phone":
    case "mobile":
    case "contact_phone":
      return inquiry.phone || "";
    case "message":
    case "your_message":
    case "details":
      return inquiry.message || "";
    case "service_interest":
    case "service_you_re_interested_in":
      return inquiry.serviceInterest || "";
    case "event_type":
      return inquiry.eventType || "";
    case "date_range":
    case "wedding_date___date_range":
      return inquiry.dateRange || "";
    default:
      return "";
  }
}

// Turn a snake_case form-field name into a Capital Case label so
// orphaned submission values (left over after a form edit) still render
// with a readable heading.
export function humaniseKey(key: string): string {
  return key
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

export const STATUS_OPTIONS: { value: InquiryStatus; label: string }[] = [
  { value: "new", label: "New" },
  { value: "in_progress", label: "In Progress" },
  { value: "converted", label: "Converted" },
  { value: "closed", label: "Closed" },
];
