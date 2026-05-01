import { describe, it, expect } from "vitest";
import {
  isTestFormResponse,
  isTestInquiry,
  withoutTestFormResponses,
  withoutTestInquiries,
} from "../test-submission";
import type { Inquiry, FormResponse } from "@/types/models";

const baseResponse = (over: Partial<FormResponse> = {}): FormResponse => ({
  id: "r1",
  workspaceId: "w1",
  formId: "f1",
  values: {},
  contactName: "Real",
  submittedAt: "2026-04-01T00:00:00Z",
  ...over,
});

const baseInquiry = (over: Partial<Inquiry> = {}): Inquiry => ({
  id: "i1",
  workspaceId: "w1",
  name: "Real Person",
  email: "real@example.com",
  phone: "",
  message: "",
  source: "form",
  status: "new",
  createdAt: "2026-04-01T00:00:00Z",
  updatedAt: "2026-04-01T00:00:00Z",
  ...over,
});

describe("isTestFormResponse", () => {
  it("returns true for rows tagged values.__test = 'true'", () => {
    expect(isTestFormResponse({ values: { __test: "true" } })).toBe(true);
  });
  it("also accepts the boolean true (defence-in-depth)", () => {
    expect(isTestFormResponse({ values: { __test: true } })).toBe(true);
  });
  it("returns false for real submissions", () => {
    expect(isTestFormResponse({ values: { name: "Jane" } })).toBe(false);
    expect(isTestFormResponse({ values: null })).toBe(false);
    expect(isTestFormResponse({})).toBe(false);
  });
});

describe("isTestInquiry", () => {
  it("flags rows whose name starts with [TEST]", () => {
    expect(isTestInquiry(baseInquiry({ name: "[TEST] Akash" }))).toBe(true);
  });
  it("flags rows with __test in submission_values", () => {
    expect(
      isTestInquiry(
        baseInquiry({ name: "Real", submissionValues: { __test: "true" } }),
      ),
    ).toBe(true);
  });
  it("returns false for real inquiries", () => {
    expect(isTestInquiry(baseInquiry({ name: "Akash" }))).toBe(false);
  });
});

describe("withoutTestFormResponses", () => {
  it("filters tagged rows out and preserves order of the rest", () => {
    const rows: FormResponse[] = [
      baseResponse({ id: "a" }),
      baseResponse({ id: "b", values: { __test: "true" } }),
      baseResponse({ id: "c" }),
    ];
    const result = withoutTestFormResponses(rows);
    expect(result.map((r) => r.id)).toEqual(["a", "c"]);
  });
});

describe("withoutTestInquiries", () => {
  it("filters tagged rows out and preserves order of the rest", () => {
    const rows: Inquiry[] = [
      baseInquiry({ id: "1", name: "Real A" }),
      baseInquiry({ id: "2", name: "[TEST] Operator" }),
      baseInquiry({
        id: "3",
        name: "Real B",
        submissionValues: { __test: "true" },
      }),
      baseInquiry({ id: "4", name: "Real C" }),
    ];
    const result = withoutTestInquiries(rows);
    expect(result.map((r) => r.id)).toEqual(["1", "4"]);
  });
});
