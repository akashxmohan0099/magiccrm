import { describe, it, expect } from "vitest";
import { validateFormDraft } from "../validate-form-draft";
import type { Form, FormFieldConfig } from "@/types/models";

const baseForm = (over: Partial<Form> = {}): Form => ({
  id: "form-self",
  workspaceId: "ws-1",
  type: "inquiry",
  name: "Wedding Inquiry",
  fields: [],
  branding: {},
  slug: "weddings",
  enabled: true,
  autoPromoteToInquiry: true,
  createdAt: "2026-04-01T00:00:00Z",
  updatedAt: "2026-04-01T00:00:00Z",
  ...over,
});

const field = (over: Partial<FormFieldConfig> & { name: string; type: FormFieldConfig["type"] }): FormFieldConfig => ({
  label: "Field",
  required: false,
  ...over,
});

const validInput = {
  name: "Wedding Inquiry",
  slug: "weddings",
  fields: [],
  allForms: [],
  formId: "form-self",
};

describe("validateFormDraft — name", () => {
  it("flags an empty name", () => {
    const r = validateFormDraft({ ...validInput, name: "" });
    expect(r.nameError).toMatch(/required/i);
    expect(r.canSave).toBe(false);
  });

  it("flags whitespace-only as empty", () => {
    const r = validateFormDraft({ ...validInput, name: "   " });
    expect(r.nameError).toMatch(/required/i);
  });

  it("flags a duplicate name (case-insensitive, trimmed)", () => {
    const r = validateFormDraft({
      ...validInput,
      name: "Wedding Inquiry",
      allForms: [baseForm({ id: "other", name: "wedding INQUIRY  " })],
    });
    expect(r.nameError).toMatch(/already uses this name/i);
  });

  it("does not flag the form's own name as a duplicate", () => {
    const r = validateFormDraft({
      ...validInput,
      allForms: [baseForm({ id: "form-self", name: "Wedding Inquiry" })],
    });
    expect(r.nameError).toBe("");
  });
});

describe("validateFormDraft — slug", () => {
  it("flags missing slug", () => {
    const r = validateFormDraft({ ...validInput, slug: "" });
    expect(r.slugError).toMatch(/required/i);
  });

  it("flags slugs with invalid characters", () => {
    const r = validateFormDraft({ ...validInput, slug: "Wedding Inquiry" });
    expect(r.slugError).toMatch(/lowercase letters, numbers, and dashes/i);
  });

  it("flags an underscore as invalid (only dashes allowed)", () => {
    const r = validateFormDraft({ ...validInput, slug: "wedding_inquiry" });
    expect(r.slugError).toMatch(/lowercase/i);
  });

  it("flags a slug collision against another form", () => {
    const r = validateFormDraft({
      ...validInput,
      slug: "weddings",
      allForms: [baseForm({ id: "other", slug: "weddings" })],
    });
    expect(r.slugError).toMatch(/already uses this slug/i);
  });

  it("does not flag the form's own slug as a collision", () => {
    const r = validateFormDraft({
      ...validInput,
      allForms: [baseForm({ id: "form-self", slug: "weddings" })],
    });
    expect(r.slugError).toBe("");
  });
});

describe("validateFormDraft — option fields", () => {
  it("flags an option field with no options", () => {
    const r = validateFormDraft({
      ...validInput,
      fields: [field({ name: "service", type: "select", options: [] })],
    });
    expect(r.fieldOptionErrors.service).toMatch(/at least one option/i);
    expect(r.optionsError).not.toBe("");
  });

  it("flags an option field with only Option N placeholders", () => {
    const r = validateFormDraft({
      ...validInput,
      fields: [field({ name: "service", type: "select", options: ["Option 1", "Option 2"] })],
    });
    expect(r.fieldOptionErrors.service).toMatch(/placeholder/i);
  });

  it("requires at least 2 options when the field is required", () => {
    const r = validateFormDraft({
      ...validInput,
      fields: [field({ name: "service", type: "radio", options: ["Hair"], required: true })],
    });
    expect(r.fieldOptionErrors.service).toMatch(/at least two/i);
  });

  it("accepts a single option on an optional field", () => {
    const r = validateFormDraft({
      ...validInput,
      fields: [field({ name: "service", type: "radio", options: ["Hair"], required: false })],
    });
    expect(r.fieldOptionErrors).toEqual({});
    expect(r.optionsError).toBe("");
  });

  it("ignores text/email/etc fields (rule only applies to option types)", () => {
    const r = validateFormDraft({
      ...validInput,
      fields: [field({ name: "anything", type: "text" })],
    });
    expect(r.fieldOptionErrors).toEqual({});
  });
});

describe("validateFormDraft — duplicate field names", () => {
  it("flags two fields sharing the same name", () => {
    const r = validateFormDraft({
      ...validInput,
      fields: [
        field({ name: "email", type: "email" }),
        field({ name: "email", type: "text" }),
      ],
    });
    expect(r.fieldNameDuplicates.email).toMatch(/duplicate field name/i);
    expect(r.fieldNameError).not.toBe("");
  });

  it("does not flag unique names", () => {
    const r = validateFormDraft({
      ...validInput,
      fields: [
        field({ name: "name", type: "text" }),
        field({ name: "email", type: "email" }),
      ],
    });
    expect(r.fieldNameDuplicates).toEqual({});
  });
});

describe("validateFormDraft — canSave / blocker", () => {
  it("canSave is true on a clean form", () => {
    const r = validateFormDraft(validInput);
    expect(r.canSave).toBe(true);
    expect(r.blocker).toBe("");
  });

  it("blocker prefers nameError over other categories", () => {
    const r = validateFormDraft({
      ...validInput,
      name: "",
      slug: "",
      fields: [field({ name: "service", type: "select", options: [] })],
    });
    expect(r.blocker).toMatch(/name is required/i);
  });

  it("blocker falls through to slug when name is OK", () => {
    const r = validateFormDraft({ ...validInput, slug: "" });
    expect(r.blocker).toMatch(/slug is required/i);
  });

  it("blocker falls through to options when name + slug are OK", () => {
    const r = validateFormDraft({
      ...validInput,
      fields: [field({ name: "service", type: "select", options: [] })],
    });
    expect(r.blocker).toMatch(/option fields/i);
  });
});
