import { describe, it, expect } from "vitest";
import { validatePublicInquirySubmission } from "../public-validation";
import type { FormFieldConfig } from "@/types/models";

const fields = (...defs: FormFieldConfig[]): FormFieldConfig[] => defs;

const fNameRequired: FormFieldConfig = {
  name: "name",
  type: "text",
  label: "Full name",
  required: true,
};
const fEmailRequired: FormFieldConfig = {
  name: "email",
  type: "email",
  label: "Email",
  required: true,
};
const fPhoneOptional: FormFieldConfig = {
  name: "phone",
  type: "phone",
  label: "Phone",
  required: false,
};
const fUrlOptional: FormFieldConfig = {
  name: "instagram",
  type: "url",
  label: "Instagram",
  required: false,
};
const fNumberRanged: FormFieldConfig = {
  name: "guests",
  type: "number",
  label: "Guests",
  required: false,
  min: 1,
  max: 12,
};
const fHidden: FormFieldConfig = {
  name: "utm_source",
  type: "hidden",
  label: "utm_source",
  required: false,
  paramKeys: "utm_source",
};

describe("validatePublicInquirySubmission", () => {
  it("flags every missing required field, not just the first", () => {
    const result = validatePublicInquirySubmission(
      fields(fNameRequired, fEmailRequired),
      {},
    );
    expect(Object.keys(result.fieldErrors).sort()).toEqual(["email", "name"]);
    expect(result.firstErrorField).toBe("name");
  });

  it("rejects malformed emails with a custom message", () => {
    const result = validatePublicInquirySubmission(
      fields(fNameRequired, fEmailRequired),
      { name: "Jane", email: "not-an-email" },
    );
    expect(result.fieldErrors.email).toBe("Enter a valid email address");
  });

  it("accepts emails that look real", () => {
    const result = validatePublicInquirySubmission(
      fields(fNameRequired, fEmailRequired),
      { name: "Jane", email: "jane@example.com" },
    );
    expect(result.fieldErrors).toEqual({});
  });

  it("rejects phone numbers with fewer than 7 digits", () => {
    const result = validatePublicInquirySubmission(
      fields(fNameRequired, fEmailRequired, fPhoneOptional),
      { name: "Jane", email: "jane@example.com", phone: "12345" },
    );
    expect(result.fieldErrors.phone).toBe("Enter a valid phone number");
  });

  it("accepts phone numbers in international format", () => {
    const result = validatePublicInquirySubmission(
      fields(fPhoneOptional),
      { phone: "+61 412 345 678" },
    );
    expect(result.fieldErrors).toEqual({});
  });

  it("rejects malformed URLs", () => {
    const result = validatePublicInquirySubmission(
      fields(fUrlOptional),
      { instagram: "not a url" },
    );
    expect(result.fieldErrors.instagram).toMatch(/valid url/i);
  });

  it("respects number min/max", () => {
    const tooLow = validatePublicInquirySubmission(
      fields(fNumberRanged),
      { guests: "0" },
    );
    expect(tooLow.fieldErrors.guests).toMatch(/at least 1/);

    const tooHigh = validatePublicInquirySubmission(
      fields(fNumberRanged),
      { guests: "100" },
    );
    expect(tooHigh.fieldErrors.guests).toMatch(/at most 12/);

    const inRange = validatePublicInquirySubmission(
      fields(fNumberRanged),
      { guests: "6" },
    );
    expect(inRange.fieldErrors).toEqual({});
  });

  it("skips hidden fields entirely", () => {
    // Hidden fields populate from URL params and should never block submission
    // even if they happen to be marked required.
    const required: FormFieldConfig = { ...fHidden, required: true };
    const result = validatePublicInquirySubmission(fields(required), {});
    expect(result.fieldErrors).toEqual({});
  });

  it("skips conditionally-hidden required fields when the condition isn't met", () => {
    const triggerField: FormFieldConfig = {
      name: "service",
      type: "select",
      label: "Service",
      required: true,
      options: ["Wedding", "Bridal trial"],
    };
    const conditionalField: FormFieldConfig = {
      name: "bridal_party_size",
      type: "number",
      label: "Bridal party size",
      required: true,
      showWhen: {
        fieldName: "service",
        operator: "equals",
        values: ["Wedding"],
      },
    };
    // Operator picked "Bridal trial" — bridal_party_size is hidden, so it
    // shouldn't be required.
    const result = validatePublicInquirySubmission(
      fields(triggerField, conditionalField),
      { service: "Bridal trial" },
    );
    expect(result.fieldErrors).toEqual({});
  });

  it("enforces conditionally-shown required fields when the condition matches", () => {
    const triggerField: FormFieldConfig = {
      name: "service",
      type: "select",
      label: "Service",
      required: true,
      options: ["Wedding", "Bridal trial"],
    };
    const conditionalField: FormFieldConfig = {
      name: "bridal_party_size",
      type: "number",
      label: "Bridal party size",
      required: true,
      showWhen: {
        fieldName: "service",
        operator: "equals",
        values: ["Wedding"],
      },
    };
    const result = validatePublicInquirySubmission(
      fields(triggerField, conditionalField),
      { service: "Wedding" },
    );
    expect(result.fieldErrors.bridal_party_size).toMatch(/required/i);
  });

  it("treats whitespace-only values as empty for required checks", () => {
    const result = validatePublicInquirySubmission(
      fields(fNameRequired),
      { name: "   " },
    );
    expect(result.fieldErrors.name).toMatch(/required/i);
  });

  it("rejects textarea answers longer than maxLength", () => {
    const f: FormFieldConfig = {
      name: "story",
      type: "textarea",
      label: "Story",
      required: false,
      maxLength: 50,
    };
    const result = validatePublicInquirySubmission(fields(f), {
      story: "x".repeat(51),
    });
    expect(result.fieldErrors.story).toMatch(/50 characters/);
  });

  it("rejects select answers not in the option list", () => {
    const f: FormFieldConfig = {
      name: "service",
      type: "select",
      label: "Service",
      required: false,
      options: ["Hair", "Makeup"],
    };
    const result = validatePublicInquirySubmission(fields(f), {
      service: "Skydiving",
    });
    expect(result.fieldErrors.service).toMatch(/listed options/);
  });

  it("accepts radio answers that match an option", () => {
    const f: FormFieldConfig = {
      name: "season",
      type: "radio",
      label: "Season",
      required: false,
      options: ["Spring", "Summer", "Fall", "Winter"],
    };
    const result = validatePublicInquirySubmission(fields(f), { season: "Summer" });
    expect(result.fieldErrors).toEqual({});
  });

  it("rejects multi_select answers containing options not in the list", () => {
    const f: FormFieldConfig = {
      name: "services",
      type: "multi_select",
      label: "Services",
      required: false,
      options: ["Hair", "Makeup", "Lashes"],
    };
    const result = validatePublicInquirySubmission(fields(f), {
      services: "Hair, Skydiving",
    });
    expect(result.fieldErrors.services).toMatch(/listed options/i);
  });

  it("enforces multi_select maxSelections", () => {
    const f: FormFieldConfig = {
      name: "services",
      type: "multi_select",
      label: "Services",
      required: false,
      options: ["Hair", "Makeup", "Lashes", "Brows"],
      maxSelections: 2,
    };
    const result = validatePublicInquirySubmission(fields(f), {
      services: "Hair, Makeup, Lashes",
    });
    expect(result.fieldErrors.services).toMatch(/up to 2 selections/);
  });

  it("rejects text answers larger than the absolute size cap", () => {
    const f: FormFieldConfig = {
      name: "blob",
      type: "textarea",
      label: "Blob",
      required: false,
    };
    const result = validatePublicInquirySubmission(fields(f), {
      blob: "z".repeat(60_000),
    });
    expect(result.fieldErrors.blob).toMatch(/too long/);
  });

  it("returns no errors when a clean submission lands", () => {
    const allOptional: FormFieldConfig = {
      name: "notes",
      type: "textarea",
      label: "Notes",
      required: false,
    };
    const result = validatePublicInquirySubmission(
      fields(fNameRequired, fEmailRequired, fPhoneOptional, allOptional),
      {
        name: "Jane Doe",
        email: "jane@example.com",
        phone: "0412345678",
        notes: "Looking forward",
      },
    );
    expect(result.fieldErrors).toEqual({});
    expect(result.firstErrorField).toBeUndefined();
  });
});
