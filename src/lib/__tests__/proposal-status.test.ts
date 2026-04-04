import { describe, expect, it, vi } from "vitest";
import { getEffectiveProposalStatus, isProposalExpired } from "@/lib/proposal-status";

describe("proposal-status", () => {
  it("marks sent proposals as expired once validUntil has passed", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-04-04T12:00:00.000Z"));

    expect(
      getEffectiveProposalStatus("sent", "2026-04-03T23:59:59.000Z"),
    ).toBe("expired");
    expect(isProposalExpired("2026-04-03T23:59:59.000Z", "sent")).toBe(true);

    vi.useRealTimers();
  });

  it("keeps accepted proposals accepted even if validUntil is in the past", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-04-04T12:00:00.000Z"));

    expect(
      getEffectiveProposalStatus("accepted", "2026-04-03T23:59:59.000Z"),
    ).toBe("accepted");
    expect(isProposalExpired("2026-04-03T23:59:59.000Z", "accepted")).toBe(false);

    vi.useRealTimers();
  });

  it("ignores invalid validUntil values", () => {
    expect(getEffectiveProposalStatus("viewed", "not-a-date")).toBe("viewed");
    expect(isProposalExpired("not-a-date", "viewed")).toBe(false);
  });
});
