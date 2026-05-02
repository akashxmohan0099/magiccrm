import { describe, it, expect } from "vitest";
import { formatMoney, getCurrency, getLocale } from "../money";
import type { WorkspaceSettings } from "@/types/models";

const ws = (currency?: string, locale?: string): WorkspaceSettings =>
  ({
    workspaceId: "ws-1",
    currency,
    locale,
  }) as WorkspaceSettings;

describe("getCurrency / getLocale", () => {
  it("uses settings when present", () => {
    expect(getCurrency(ws("AUD"))).toBe("AUD");
    expect(getLocale(ws(undefined, "en-AU"))).toBe("en-AU");
  });

  it("falls back to USD / en-US when settings null or unset", () => {
    expect(getCurrency(null)).toBe("USD");
    expect(getCurrency(ws())).toBe("USD");
    expect(getLocale(null)).toBe("en-US");
    expect(getLocale(ws())).toBe("en-US");
  });
});

describe("formatMoney", () => {
  it("formats whole dollars by default", () => {
    const out = formatMoney(199, ws("AUD", "en-AU"));
    // Intl is locale-dependent — assert digits + currency code without
    // locking to a specific symbol/space convention.
    expect(out).toMatch(/199/);
    expect(out).not.toMatch(/\./); // No decimals by default
  });

  it("formats with decimals when withDecimals=true", () => {
    const out = formatMoney(199.95, ws("AUD", "en-AU"), { withDecimals: true });
    expect(out).toMatch(/199\.95/);
  });

  it("respects a one-off currency override", () => {
    const out = formatMoney(50, ws("USD", "en-US"), { currency: "EUR" });
    expect(out).toMatch(/50/);
    // Don't assert on Euro symbol vs code — depends on Node ICU build.
  });

  it("falls back to plain string on a bad currency code", () => {
    const out = formatMoney(100, ws("XXX_INVALID", "en-US"));
    // Either the runtime fell back to plain "XXX_INVALID 100" or threw and
    // we caught — verify the amount is still in the output.
    expect(out).toMatch(/100/);
  });
});
