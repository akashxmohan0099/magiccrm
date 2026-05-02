import { describe, it, expect } from "vitest";
import { generateId } from "../id";

describe("generateId", () => {
  it("returns a v4 UUID-shaped string", () => {
    const id = generateId();
    expect(id).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/,
    );
  });

  it("produces unique values across calls", () => {
    const ids = new Set(Array.from({ length: 50 }, () => generateId()));
    expect(ids.size).toBe(50);
  });
});
