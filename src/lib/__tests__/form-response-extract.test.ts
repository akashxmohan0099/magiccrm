import { describe, it, expect } from "vitest";
import { extractContactFromValues } from "../form-response-extract";
import type { FormFieldConfig } from "@/types/models";

const baseFields: FormFieldConfig[] = [
  { name: "name", type: "text", label: "Full Name", required: true },
  { name: "email", type: "email", label: "Email", required: true },
  { name: "phone", type: "phone", label: "Phone", required: false },
  { name: "message", type: "textarea", label: "Message", required: false },
];

describe("extractContactFromValues", () => {
  it("extracts canonical name/email/phone/message", () => {
    const result = extractContactFromValues(
      { name: "Jane Doe", email: "jane@example.com", phone: "0412345678", message: "Hi there" },
      baseFields,
    );
    expect(result.name).toBe("Jane Doe");
    expect(result.email).toBe("jane@example.com");
    expect(result.phone).toBe("0412345678");
    expect(result.message).toBe("Hi there");
  });

  it("handles full_name and mobile aliases", () => {
    const result = extractContactFromValues(
      { full_name: "Alex", email: "a@b.com", mobile: "999" },
      baseFields,
    );
    expect(result.name).toBe("Alex");
    expect(result.phone).toBe("999");
  });

  it("falls back to Anonymous when no name field is present", () => {
    const result = extractContactFromValues({ email: "a@b.com" }, baseFields);
    expect(result.name).toBe("Anonymous");
  });

  it("returns null for missing email/phone/serviceInterest/eventType/dateRange", () => {
    const result = extractContactFromValues({ name: "X" }, baseFields);
    expect(result.email).toBeNull();
    expect(result.phone).toBeNull();
    expect(result.serviceInterest).toBeNull();
    expect(result.eventType).toBeNull();
    expect(result.dateRange).toBeNull();
  });

  it("appends supplemental field labels to the message", () => {
    const fields: FormFieldConfig[] = [
      ...baseFields,
      { name: "favorite_color", type: "text", label: "Favourite colour", required: false },
    ];
    const result = extractContactFromValues(
      { name: "X", message: "main note", favorite_color: "blue" },
      fields,
    );
    expect(result.message).toContain("main note");
    expect(result.message).toContain("Favourite colour: blue");
  });

  it("uses raw key when no matching field label exists", () => {
    const result = extractContactFromValues(
      { name: "X", custom_key: "value" },
      baseFields,
    );
    expect(result.message).toContain("custom_key: value");
  });

  it("extracts service_interest and event_type aliases", () => {
    const fields: FormFieldConfig[] = [
      ...baseFields,
      { name: "service_you_re_interested_in", type: "select", label: "Service", required: false },
      { name: "event_type", type: "text", label: "Event type", required: false },
      { name: "wedding_date___date_range", type: "text", label: "Date", required: false },
    ];
    const result = extractContactFromValues(
      {
        service_you_re_interested_in: "Hair",
        event_type: "Wedding",
        wedding_date___date_range: "May 2026",
      },
      fields,
    );
    expect(result.serviceInterest).toBe("Hair");
    expect(result.eventType).toBe("Wedding");
    expect(result.dateRange).toBe("May 2026");
  });

  it("ignores empty values when building supplemental lines", () => {
    const fields: FormFieldConfig[] = [
      ...baseFields,
      { name: "extra", type: "text", label: "Extra", required: false },
    ];
    const result = extractContactFromValues({ name: "X", extra: "" }, fields);
    expect(result.message).not.toContain("Extra");
  });
});
