import { describe, it, expect, beforeEach } from "vitest";
import { rateLimit } from "../rate-limit";

describe("rateLimit", () => {
  // Use unique keys per test to avoid interference
  let keyCounter = 0;
  function uniqueKey(prefix: string) {
    return `${prefix}-${++keyCounter}-${Date.now()}`;
  }

  it("allows requests within the limit", () => {
    const key = uniqueKey("allow");
    const r1 = rateLimit(key, 3, 60_000);
    const r2 = rateLimit(key, 3, 60_000);
    const r3 = rateLimit(key, 3, 60_000);

    expect(r1.allowed).toBe(true);
    expect(r2.allowed).toBe(true);
    expect(r3.allowed).toBe(true);
    expect(r1.remaining).toBe(2);
    expect(r2.remaining).toBe(1);
    expect(r3.remaining).toBe(0);
  });

  it("blocks requests over the limit", () => {
    const key = uniqueKey("block");
    rateLimit(key, 2, 60_000);
    rateLimit(key, 2, 60_000);
    const r3 = rateLimit(key, 2, 60_000);

    expect(r3.allowed).toBe(false);
    expect(r3.remaining).toBe(0);
  });

  it("resets after the window expires", async () => {
    const key = uniqueKey("reset");
    rateLimit(key, 1, 50); // 50ms window
    const blocked = rateLimit(key, 1, 50);
    expect(blocked.allowed).toBe(false);

    // Wait for window to expire
    await new Promise((r) => setTimeout(r, 60));

    const afterReset = rateLimit(key, 1, 50);
    expect(afterReset.allowed).toBe(true);
    expect(afterReset.remaining).toBe(0);
  });

  it("different keys don't interfere with each other", () => {
    const key1 = uniqueKey("key1");
    const key2 = uniqueKey("key2");

    rateLimit(key1, 1, 60_000);
    const blocked = rateLimit(key1, 1, 60_000);
    const allowed = rateLimit(key2, 1, 60_000);

    expect(blocked.allowed).toBe(false);
    expect(allowed.allowed).toBe(true);
  });
});
