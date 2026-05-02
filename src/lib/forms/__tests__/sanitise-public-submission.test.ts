import { describe, it, expect } from "vitest";
import { prepareSubmission, sanitiseAgainstForm } from "../sanitise-public-submission";
import type { FormFieldConfig } from "@/types/models";

/**
 * The two-stage public-submission pipeline. Tests cover:
 *  - reserved-key stripping (so a visitor can't spoof __test markers)
 *  - honeypot detection (so bots get short-circuited cheaply)
 *  - field whitelisting + conditional-field stripping
 *
 * Validators downstream (validatePublicInquirySubmission, validateFileFields)
 * already have their own dedicated tests — only spot-check the integration.
 */
describe("prepareSubmission", () => {
  it("strips reserved __* keys except __hp", () => {
    const r = prepareSubmission({ name: "Jane", __test: "true", __admin: "1" });
    expect(r.kind).toBe("values");
    if (r.kind === "values") {
      expect(r.values).toEqual({ name: "Jane" });
      expect(r.values.__test).toBeUndefined();
      expect(r.values.__admin).toBeUndefined();
    }
  });

  it("returns honeypot when __hp is filled", () => {
    const r = prepareSubmission({ name: "Bot", __hp: "filled-by-script" });
    expect(r.kind).toBe("honeypot");
  });

  it("strips empty __hp from clean submissions", () => {
    const r = prepareSubmission({ name: "Jane", __hp: "" });
    expect(r.kind).toBe("values");
    if (r.kind === "values") {
      expect(r.values.__hp).toBeUndefined();
    }
  });

  it("preserves regular fields", () => {
    const r = prepareSubmission({
      name: "Jane",
      email: "j@x.com",
      phone: "0412",
      message: "Hello",
    });
    expect(r.kind).toBe("values");
    if (r.kind === "values") {
      expect(Object.keys(r.values).sort()).toEqual(["email", "message", "name", "phone"]);
    }
  });
});

describe("sanitiseAgainstForm", () => {
  const fields: FormFieldConfig[] = [
    { name: "name", type: "text", label: "Name", required: true },
    { name: "email", type: "email", label: "Email", required: true },
    { name: "phone", type: "phone", label: "Phone", required: false },
  ];

  it("whitelists keys to configured fields", () => {
    const r = sanitiseAgainstForm(fields, {
      name: "Jane",
      email: "jane@example.com",
      phone: "0412345678",
      rogue_field: "should drop",
    });
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.values).toEqual({
        name: "Jane",
        email: "jane@example.com",
        phone: "0412345678",
      });
      expect(r.values.rogue_field).toBeUndefined();
    }
  });

  it("returns field-error when required fields are missing", () => {
    const r = sanitiseAgainstForm(fields, { phone: "0412" });
    expect(r.ok).toBe(false);
    if (!r.ok && r.kind === "field-error") {
      expect(r.firstErrorField).toBeDefined();
      expect(Object.keys(r.fieldErrors).length).toBeGreaterThan(0);
    }
  });

  it("rejects malformed email", () => {
    const r = sanitiseAgainstForm(fields, {
      name: "Jane",
      email: "not-an-email",
    });
    expect(r.ok).toBe(false);
    if (!r.ok && r.kind === "field-error") {
      expect(r.fieldErrors.email).toBeDefined();
    }
  });

  it("accepts a valid minimal submission", () => {
    const r = sanitiseAgainstForm(fields, {
      name: "Jane",
      email: "j@example.com",
    });
    expect(r.ok).toBe(true);
  });
});
