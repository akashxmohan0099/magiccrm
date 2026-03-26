import { describe, expect, it } from "vitest";
import { extractTuningState } from "@/lib/onboarding-tuning";

describe("extractTuningState", () => {
  it("preserves combination IDs and exposes combination labels through moduleMeta", () => {
    const result = extractTuningState({
      patches: [
        {
          op: "apply-module-combination",
          combinationId: "book-pay",
          label: "Appointments & Checkout",
          description: "Handle bookings and payments together.",
        },
        {
          op: "set-module-meta",
          moduleId: "client-database",
          label: "Customers",
          description: "All of your customer records.",
        },
      ],
      moduleMeta: {
        "client-database": {
          label: "Customers",
          description: "All of your customer records.",
        },
      },
    });

    expect(result.combinationIds).toEqual(["book-pay"]);
    expect(result.moduleMeta["book-pay"]).toEqual({
      label: "Appointments & Checkout",
      description: "Handle bookings and payments together.",
    });
    expect(result.moduleMeta["client-database"]).toEqual({
      label: "Customers",
      description: "All of your customer records.",
    });
  });

  it("sanitizes and ignores invalid module meta payloads", () => {
    const result = extractTuningState({
      patches: [
        {
          op: "apply-module-combination",
          combinationId: "schedule-jobs",
          label: "  ",
        },
      ],
      moduleMeta: {
        valid: {
          label: "  Clean Label  ",
          description: "  Useful description.  ",
        },
        invalidMissingDescription: {
          label: "Ignored",
        },
      },
    });

    expect(result.combinationIds).toEqual(["schedule-jobs"]);
    expect(result.moduleMeta.valid).toEqual({
      label: "Clean Label",
      description: "Useful description.",
    });
    expect(result.moduleMeta.invalidMissingDescription).toBeUndefined();
    expect(result.moduleMeta["schedule-jobs"]).toBeUndefined();
  });
});
