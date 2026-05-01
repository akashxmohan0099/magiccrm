import { describe, it, expect } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useFormDraft, buildBrandingFromDraft } from "../use-form-draft";
import type { Form, FormFieldConfig } from "@/types/models";

const baseForm = (over: Partial<Form> = {}): Form => ({
  id: "form-1",
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

const f = (over: Partial<FormFieldConfig> & { name: string }): FormFieldConfig => ({
  type: "text",
  label: over.name,
  required: false,
  ...over,
});

describe("useFormDraft — initialization", () => {
  it("seeds the draft from the form's name, slug, and branding", () => {
    const { result } = renderHook(() =>
      useFormDraft(
        baseForm({
          name: "Wedding",
          slug: "weddings",
          branding: { primaryColor: "#FF0000", description: "Hi" },
        }),
      ),
    );
    expect(result.current.draft.name).toBe("Wedding");
    expect(result.current.draft.slug).toBe("weddings");
    expect(result.current.draft.slugTouched).toBe(true);
    expect(result.current.draft.branding.primaryColor).toBe("#FF0000");
    expect(result.current.draft.branding.description).toBe("Hi");
  });

  it("treats a form with no slug as untouched", () => {
    const { result } = renderHook(() =>
      useFormDraft(baseForm({ slug: undefined })),
    );
    expect(result.current.draft.slug).toBe("");
    expect(result.current.draft.slugTouched).toBe(false);
  });

  it("falls back to sensible defaults when branding is empty", () => {
    const { result } = renderHook(() => useFormDraft(baseForm({ branding: {} })));
    const b = result.current.draft.branding;
    expect(b.primaryColor).toBe("#8B5CF6");
    expect(b.template).toBe("classic");
    expect(b.fontFamily).toBe("sans");
    expect(b.headingFontFamily).toBe("sans");
    expect(b.theme).toBe("light");
    expect(b.notifyOwnerEmail).toBe(true);
    expect(b.autoReplyEnabled).toBe(true);
  });
});

describe("useFormDraft — uniquify on load", () => {
  it("does not flag uniquify when names are already unique", () => {
    const { result } = renderHook(() =>
      useFormDraft(
        baseForm({
          fields: [f({ name: "name" }), f({ name: "email" })],
        }),
      ),
    );
    expect(result.current.didUniquifyOnLoad).toBe(false);
    expect(result.current.draft.fields.map((x) => x.name)).toEqual(["name", "email"]);
  });

  it("suffixes duplicate names and reports didUniquifyOnLoad=true", () => {
    const { result } = renderHook(() =>
      useFormDraft(
        baseForm({
          fields: [
            f({ name: "email" }),
            f({ name: "email" }),
            f({ name: "email" }),
          ],
        }),
      ),
    );
    expect(result.current.didUniquifyOnLoad).toBe(true);
    const names = result.current.draft.fields.map((x) => x.name);
    expect(names).toEqual(["email", "email_2", "email_3"]);
  });
});

describe("useFormDraft — updateDraft", () => {
  it("merges the patch into top-level draft fields", () => {
    const { result } = renderHook(() => useFormDraft(baseForm()));
    act(() => result.current.updateDraft({ name: "Renamed" }));
    expect(result.current.draft.name).toBe("Renamed");
    expect(result.current.draft.slug).toBe("weddings"); // untouched
  });

  it("does not affect branding or fields", () => {
    const { result } = renderHook(() => useFormDraft(baseForm()));
    const beforeBranding = result.current.draft.branding;
    act(() => result.current.updateDraft({ slug: "new-slug", slugTouched: true }));
    expect(result.current.draft.branding).toBe(beforeBranding);
  });
});

describe("useFormDraft — updateBranding", () => {
  it("merges into branding without touching unrelated keys", () => {
    const { result } = renderHook(() => useFormDraft(baseForm()));
    act(() => result.current.updateBranding({ primaryColor: "#0000FF" }));
    expect(result.current.draft.branding.primaryColor).toBe("#0000FF");
    expect(result.current.draft.branding.template).toBe("classic"); // untouched
  });

  it("preserves draft.name when only branding is patched", () => {
    const { result } = renderHook(() => useFormDraft(baseForm({ name: "Original" })));
    act(() => result.current.updateBranding({ accentColor: "red" }));
    expect(result.current.draft.name).toBe("Original");
  });
});

describe("useFormDraft — fieldOps", () => {
  it("addField appends with the given name when unique", () => {
    const { result } = renderHook(() =>
      useFormDraft(baseForm({ fields: [f({ name: "name" })] })),
    );
    let resolved = "";
    act(() => {
      resolved = result.current.fieldOps.addField(f({ name: "email", type: "email" }));
    });
    expect(resolved).toBe("email");
    expect(result.current.draft.fields.map((x) => x.name)).toEqual(["name", "email"]);
  });

  it("addField suffixes when the requested name collides", () => {
    const { result } = renderHook(() =>
      useFormDraft(baseForm({ fields: [f({ name: "text_1" })] })),
    );
    let resolved = "";
    act(() => {
      resolved = result.current.fieldOps.addField(f({ name: "text_1" }));
    });
    expect(resolved).toBe("text_1_2");
    expect(result.current.draft.fields.map((x) => x.name)).toEqual(["text_1", "text_1_2"]);
  });

  it("updateField patches a single field by index", () => {
    const { result } = renderHook(() =>
      useFormDraft(baseForm({ fields: [f({ name: "a" }), f({ name: "b" })] })),
    );
    act(() => result.current.fieldOps.updateField(0, { label: "First" }));
    expect(result.current.draft.fields[0].label).toBe("First");
    expect(result.current.draft.fields[1].label).toBe("b");
  });

  it("removeField drops the field at the given index", () => {
    const { result } = renderHook(() =>
      useFormDraft(
        baseForm({ fields: [f({ name: "a" }), f({ name: "b" }), f({ name: "c" })] }),
      ),
    );
    act(() => result.current.fieldOps.removeField(1));
    expect(result.current.draft.fields.map((x) => x.name)).toEqual(["a", "c"]);
  });

  it("reorderField moves a field to the new index", () => {
    const { result } = renderHook(() =>
      useFormDraft(
        baseForm({ fields: [f({ name: "a" }), f({ name: "b" }), f({ name: "c" })] }),
      ),
    );
    act(() => result.current.fieldOps.reorderField(2, 0));
    expect(result.current.draft.fields.map((x) => x.name)).toEqual(["c", "a", "b"]);
  });

  it("reorderField is a no-op when from === to", () => {
    const { result } = renderHook(() =>
      useFormDraft(baseForm({ fields: [f({ name: "a" }), f({ name: "b" })] })),
    );
    const before = result.current.draft.fields;
    act(() => result.current.fieldOps.reorderField(1, 1));
    expect(result.current.draft.fields).toBe(before);
  });

  it("duplicateField inserts a copy after the source with a unique name", () => {
    const { result } = renderHook(() =>
      useFormDraft(baseForm({ fields: [f({ name: "color", label: "Color" })] })),
    );
    act(() => result.current.fieldOps.duplicateField(0));
    expect(result.current.draft.fields.map((x) => x.name)).toEqual([
      "color",
      "color_copy",
    ]);
    expect(result.current.draft.fields[1].label).toBe("Color (copy)");
  });

  it("setFields accepts a function updater", () => {
    const { result } = renderHook(() =>
      useFormDraft(baseForm({ fields: [f({ name: "a" })] })),
    );
    act(() =>
      result.current.fieldOps.setFields((prev) => [
        ...prev,
        f({ name: "z" }),
      ]),
    );
    expect(result.current.draft.fields.map((x) => x.name)).toEqual(["a", "z"]);
  });
});

describe("buildBrandingFromDraft — coercion", () => {
  it("collapses empty strings to undefined for the persisted shape", () => {
    const { result } = renderHook(() => useFormDraft(baseForm()));
    const branding = buildBrandingFromDraft(result.current.draft.branding, {});
    expect(branding.description).toBeUndefined();
    expect(branding.successCtaLabel).toBeUndefined();
    expect(branding.successRedirectDelaySeconds).toBeUndefined();
  });

  it("preserves the configured redirect delay only when a redirect URL is set", () => {
    const { result } = renderHook(() => useFormDraft(baseForm()));
    act(() =>
      result.current.updateBranding({
        successRedirectUrl: "https://example.com/thanks",
        successRedirectDelaySeconds: 8,
      }),
    );
    const branding = buildBrandingFromDraft(result.current.draft.branding, {});
    expect(branding.successRedirectUrl).toBe("https://example.com/thanks");
    expect(branding.successRedirectDelaySeconds).toBe(8);
  });

  it("clamps the redirect delay to [0, 60]", () => {
    const { result } = renderHook(() => useFormDraft(baseForm()));
    act(() =>
      result.current.updateBranding({
        successRedirectUrl: "https://x",
        successRedirectDelaySeconds: 999,
      }),
    );
    const branding = buildBrandingFromDraft(result.current.draft.branding, {});
    expect(branding.successRedirectDelaySeconds).toBe(60);
  });

  it("merges the base branding so fields the draft doesn't manage are preserved", () => {
    const { result } = renderHook(() => useFormDraft(baseForm()));
    const branding = buildBrandingFromDraft(result.current.draft.branding, {
      // Hypothetical future branding key the draft doesn't know about.
      // The merge should keep it intact.
      // @ts-expect-error — synthetic key for the test
      futureKey: "preserved",
    });
    // @ts-expect-error — synthetic key
    expect(branding.futureKey).toBe("preserved");
  });
});
