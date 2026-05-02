/**
 * Tests for the pure helpers in `lib/server/public-booking.ts`.
 *
 * The async functions in that module read from Supabase and would need
 * a stubbed admin client; covered separately. The helpers below are
 * security-critical (sanitizeClientText guards every public booking
 * write — name, notes, email, phone) so they get explicit coverage.
 */
import { describe, it, expect, vi } from "vitest";

// `import "server-only"` errors at module-init under jsdom because the
// browser export of that package throws on purpose. Stub it so the
// module can load in the test runner.
vi.mock("server-only", () => ({}));

import {
  sanitizeClientText,
  EMAIL_REGEX,
  getDefaultAvailabilitySlots,
} from "../public-booking";

describe("sanitizeClientText", () => {
  it("strips HTML tags", () => {
    expect(sanitizeClientText("<b>bold</b>", 100)).toBe("bold");
    expect(sanitizeClientText("<a href='evil'>x</a>", 100)).toBe("x");
  });

  it("strips scriptable tag pairs INCLUDING their inner content", () => {
    // Before fix: tag-stripper alone would leave "alert(1)Hi" — the
    // payload survived because the regex only matched the tags.
    expect(sanitizeClientText("<script>alert(1)</script>Hi", 100)).toBe("Hi");
    expect(sanitizeClientText("<style>body{x:y}</style>ok", 100)).toBe("ok");
    expect(sanitizeClientText("<iframe src='evil'></iframe>name", 100)).toBe("name");
    expect(sanitizeClientText("<noscript>fallback</noscript>name", 100)).toBe("name");
  });

  it("strips dangerous attribute-only tags (no inner content)", () => {
    expect(sanitizeClientText("<img src=x onerror=alert(1)>name", 100)).toBe("name");
    expect(sanitizeClientText("<input onfocus=alert(1) autofocus>name", 100)).toBe("name");
  });

  it("strips control characters (C0/C1)", () => {
    expect(sanitizeClientText("Hello\x00World", 100)).toBe("HelloWorld");
    expect(sanitizeClientText("Tab\tNewline\nReturn\r", 100)).toBe("TabNewlineReturn");
    expect(sanitizeClientText("\x1bEscape", 100)).toBe("Escape");
  });

  it("trims surrounding whitespace", () => {
    expect(sanitizeClientText("  spaced  ", 100)).toBe("spaced");
    expect(sanitizeClientText("\n\n  ok  \n", 100)).toBe("ok");
  });

  it("truncates to maxLen", () => {
    expect(sanitizeClientText("abcdefghij", 5)).toBe("abcde");
    expect(sanitizeClientText("short", 100)).toBe("short");
  });

  it("handles empty / null-ish inputs without throwing", () => {
    expect(sanitizeClientText("", 100)).toBe("");
    // The function is typed `string` but defensively coalesces undefined →
    // verify the runtime behaviour matches the contract.
    expect(sanitizeClientText(undefined as unknown as string, 100)).toBe("");
    expect(sanitizeClientText(null as unknown as string, 100)).toBe("");
  });

  it("composes: HTML + control chars + whitespace + length all in one pass", () => {
    const input = "  <b>Hello\x00 World!</b>     extra ";
    // After HTML strip: "  Hello\x00 World!     extra "
    // After control strip: "  Hello World!     extra "
    // After trim: "Hello World!     extra"
    // After slice(0, 12): "Hello World!"
    expect(sanitizeClientText(input, 12)).toBe("Hello World!");
  });
});

describe("EMAIL_REGEX", () => {
  it("accepts well-formed addresses", () => {
    expect(EMAIL_REGEX.test("a@b.co")).toBe(true);
    expect(EMAIL_REGEX.test("first.last+tag@sub.example.com")).toBe(true);
    expect(EMAIL_REGEX.test("user_123@xn--example.com")).toBe(true);
  });

  it("rejects malformed addresses", () => {
    expect(EMAIL_REGEX.test("plain")).toBe(false);
    expect(EMAIL_REGEX.test("a@b")).toBe(false); // No TLD
    expect(EMAIL_REGEX.test("@b.co")).toBe(false);
    expect(EMAIL_REGEX.test("a@.co")).toBe(false);
    expect(EMAIL_REGEX.test("a b@c.co")).toBe(false);
    expect(EMAIL_REGEX.test("a@b.c")).toBe(false); // TLD too short
  });
});

describe("getDefaultAvailabilitySlots", () => {
  it("returns 7 days, Mon-Fri enabled by default", () => {
    const slots = getDefaultAvailabilitySlots();
    expect(slots).toHaveLength(7);

    const enabledDays = slots.filter((s) => s.enabled).map((s) => s.day);
    expect(enabledDays).toEqual([1, 2, 3, 4, 5]); // Mon..Fri
  });

  it("uses 09:00–17:00 for the enabled days", () => {
    const slots = getDefaultAvailabilitySlots();
    for (const s of slots.filter((s) => s.enabled)) {
      expect(s.startTime).toBe("09:00");
      expect(s.endTime).toBe("17:00");
    }
  });

  it("includes both weekend days as disabled", () => {
    const slots = getDefaultAvailabilitySlots();
    const weekendDays = slots.filter((s) => s.day === 0 || s.day === 6);
    expect(weekendDays).toHaveLength(2);
    expect(weekendDays.every((s) => !s.enabled)).toBe(true);
  });
});
