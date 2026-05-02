import { describe, it, expect } from "vitest";
import { resolveServiceCategoryName } from "../category";

const categories = [
  { id: "cat-1", name: "Hair" },
  { id: "cat-2", name: "Nails" },
];

describe("resolveServiceCategoryName", () => {
  it("returns the canonical name when categoryId resolves", () => {
    expect(resolveServiceCategoryName({ categoryId: "cat-1" }, categories)).toBe("Hair");
  });

  it("falls back to legacy category when categoryId is unset", () => {
    expect(
      resolveServiceCategoryName({ category: "Lashes" }, categories),
    ).toBe("Lashes");
  });

  it("falls back to legacy category when categoryId points at a deleted row", () => {
    expect(
      resolveServiceCategoryName({ categoryId: "cat-deleted", category: "Hair" }, categories),
    ).toBe("Hair");
  });

  it("returns empty string when nothing resolves", () => {
    expect(resolveServiceCategoryName({}, categories)).toBe("");
  });

  it("treats null categoryId as unset", () => {
    expect(
      resolveServiceCategoryName({ categoryId: null, category: "Skin" }, categories),
    ).toBe("Skin");
  });
});
