import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

// ── Mocks ─────────────────────────────────────────────
//
// The route pulls four collaborators we need to fake:
//   - rateLimit: gate the test to "always allowed" so we can focus on logic
//   - createAdminClient: stub the Supabase client used for inserts
//   - lookupPublicInquiryFormBySlug: drive the form-not-found / disabled /
//     error / ok branches
//   - sendInquiryConfirmation: never actually try to send email / SMS
//
// We don't want to mock the validators — the whole point is to exercise the
// route's validation parity end-to-end through the real validateFileFields
// and validatePublicInquirySubmission helpers.

vi.mock("@/lib/rate-limit", () => ({
  rateLimit: vi.fn(async () => ({ allowed: true, remaining: 10 })),
}));

// Capture every insert call so tests can inspect the persisted row shape.
const insertCalls: { table?: string; row: Record<string, unknown> }[] = [];
let nextInsertResults: { error: unknown }[] = [];
function nextInsertResult(): { error: unknown } {
  return nextInsertResults.length > 0 ? nextInsertResults.shift()! : { error: null };
}

const updateMock = vi.fn(() => ({
  eq: vi.fn(() => ({ eq: vi.fn(async () => ({ error: null })) })),
}));

vi.mock("@/lib/supabase-server", () => ({
  createAdminClient: vi.fn(async () => ({
    from: vi.fn((table: string) => ({
      insert: vi.fn((row: Record<string, unknown>) => {
        insertCalls.push({ table, row });
        return nextInsertResult();
      }),
      update: updateMock,
    })),
  })),
}));

const lookupMock = vi.fn();
vi.mock("@/lib/server/public-inquiries", () => ({
  lookupPublicInquiryFormBySlug: (slug: string) => lookupMock(slug),
}));

vi.mock("@/lib/server/send-inquiry-confirmation", () => ({
  sendInquiryConfirmation: vi.fn(async () => undefined),
}));

// ── Test helpers ──────────────────────────────────────

function makeRequest(body: unknown): NextRequest {
  return new NextRequest("http://localhost/api/public/inquiry", {
    method: "POST",
    headers: { "content-type": "application/json", "x-forwarded-for": "1.1.1.1" },
    body: JSON.stringify(body),
  });
}

const baseForm = {
  id: "form-1",
  workspaceId: "ws-1",
  name: "Wedding Inquiry",
  slug: "weddings",
  fields: [
    { name: "name", type: "text", label: "Name", required: true },
    { name: "email", type: "email", label: "Email", required: true },
  ],
  branding: {},
  autoPromoteToInquiry: false,
};

beforeEach(() => {
  insertCalls.length = 0;
  nextInsertResults = [];
  updateMock.mockClear();
  lookupMock.mockReset();
});

describe("POST /api/public/inquiry", () => {
  it("returns 503 when the form lookup hits a DB error", async () => {
    lookupMock.mockResolvedValue({ status: "error", error: "boom" });
    const { POST } = await import("../route");
    const res = await POST(makeRequest({ slug: "weddings", values: { name: "Jane", email: "j@x.com" } }));
    expect(res.status).toBe(503);
    expect(insertCalls).toHaveLength(0);
  });

  it("returns 410 with disabled flag when the form is turned off", async () => {
    lookupMock.mockResolvedValue({ status: "disabled" });
    const { POST } = await import("../route");
    const res = await POST(makeRequest({ slug: "weddings", values: { name: "Jane", email: "j@x.com" } }));
    expect(res.status).toBe(410);
    const body = await res.json();
    expect(body.disabled).toBe(true);
  });

  it("returns 404 when the slug doesn't exist", async () => {
    lookupMock.mockResolvedValue({ status: "not_found" });
    const { POST } = await import("../route");
    const res = await POST(makeRequest({ slug: "nope", values: {} }));
    expect(res.status).toBe(404);
  });

  it("rejects missing required field with a 400 and field error map", async () => {
    lookupMock.mockResolvedValue({ status: "ok", form: baseForm });
    const { POST } = await import("../route");
    const res = await POST(makeRequest({ slug: "weddings", values: { email: "j@x.com" } }));
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.fieldErrors.name).toMatch(/required/i);
  });

  it("rejects malformed email even when client validation is bypassed", async () => {
    lookupMock.mockResolvedValue({ status: "ok", form: baseForm });
    const { POST } = await import("../route");
    const res = await POST(makeRequest({ slug: "weddings", values: { name: "Jane", email: "not-an-email" } }));
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.fieldErrors.email).toMatch(/valid email/i);
  });

  it("rejects oversized file payloads with a 413", async () => {
    const fileForm = {
      ...baseForm,
      fields: [
        ...baseForm.fields,
        {
          name: "uploads",
          type: "file",
          label: "Uploads",
          required: false,
          multipleFiles: false,
          maxFileSizeMb: 1,
        },
      ],
    };
    lookupMock.mockResolvedValue({ status: "ok", form: fileForm });
    // base64 ~3MB blob — well above the 1MB per-field cap
    const big = "A".repeat(4 * 1024 * 1024);
    const dataUrl = `data:image/png;base64,${big}`;
    const { POST } = await import("../route");
    const res = await POST(
      makeRequest({
        slug: "weddings",
        values: {
          name: "Jane",
          email: "j@x.com",
          uploads: JSON.stringify([{ name: "big.png", type: "image/png", dataUrl }]),
        },
      }),
    );
    expect(res.status).toBe(413);
  });

  it("silently 201s on honeypot fill (no DB write)", async () => {
    const { POST } = await import("../route");
    const res = await POST(makeRequest({ slug: "weddings", values: { __hp: "spam" } }));
    expect(res.status).toBe(201);
    expect(lookupMock).not.toHaveBeenCalled();
    expect(insertCalls).toHaveLength(0);
  });

  it("returns 201 + success on a valid submission and inserts a form_response", async () => {
    lookupMock.mockResolvedValue({ status: "ok", form: baseForm });
    const { POST } = await import("../route");
    const res = await POST(
      makeRequest({ slug: "weddings", values: { name: "Jane", email: "j@x.com" } }),
    );
    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(insertCalls.length).toBeGreaterThan(0);
  });

  it("strips spoofed __test from public submissions before persisting", async () => {
    lookupMock.mockResolvedValue({ status: "ok", form: baseForm });
    const { POST } = await import("../route");
    const res = await POST(
      makeRequest({
        slug: "weddings",
        values: { name: "Jane", email: "j@x.com", __test: "true" },
      }),
    );
    expect(res.status).toBe(201);
    const responseInsert = insertCalls.find((c) => c.table === "form_responses");
    expect(responseInsert).toBeDefined();
    const persistedValues = responseInsert!.row.values as Record<string, unknown>;
    // __test must be gone — otherwise the dashboard's test filter would
    // hide this row from the operator.
    expect(persistedValues.__test).toBeUndefined();
  });

  it("drops unknown keys not declared on the form", async () => {
    lookupMock.mockResolvedValue({ status: "ok", form: baseForm });
    const { POST } = await import("../route");
    const res = await POST(
      makeRequest({
        slug: "weddings",
        values: {
          name: "Jane",
          email: "j@x.com",
          junk: "should not persist",
          another: "x",
        },
      }),
    );
    expect(res.status).toBe(201);
    const responseInsert = insertCalls.find((c) => c.table === "form_responses");
    expect(responseInsert).toBeDefined();
    const persistedValues = responseInsert!.row.values as Record<string, unknown>;
    expect(persistedValues.name).toBe("Jane");
    expect(persistedValues.email).toBe("j@x.com");
    expect(persistedValues.junk).toBeUndefined();
    expect(persistedValues.another).toBeUndefined();
  });

  it("drops conditionally-hidden field values from the persisted row", async () => {
    const conditionalForm = {
      ...baseForm,
      fields: [
        { name: "name", type: "text", label: "Name", required: true },
        { name: "email", type: "email", label: "Email", required: true },
        {
          name: "service",
          type: "select",
          label: "Service",
          required: false,
          options: ["Wedding", "Bridal trial"],
        },
        {
          name: "bridal_party_size",
          type: "number",
          label: "Bridal party size",
          required: false,
          showWhen: {
            fieldName: "service",
            operator: "equals",
            values: ["Wedding"],
          },
        },
      ],
    };
    lookupMock.mockResolvedValue({ status: "ok", form: conditionalForm });
    const { POST } = await import("../route");
    // Visitor picked "Bridal trial" but a direct API hit smuggles in
    // bridal_party_size anyway. Validation skips it (because hidden), and
    // the route should now also drop it from the persisted row.
    const res = await POST(
      makeRequest({
        slug: "weddings",
        values: {
          name: "Jane",
          email: "j@x.com",
          service: "Bridal trial",
          bridal_party_size: "12",
        },
      }),
    );
    expect(res.status).toBe(201);
    const responseInsert = insertCalls.find((c) => c.table === "form_responses");
    expect(responseInsert).toBeDefined();
    const persistedValues = responseInsert!.row.values as Record<string, unknown>;
    expect(persistedValues.service).toBe("Bridal trial");
    expect(persistedValues.bridal_party_size).toBeUndefined();
  });

  it("returns 201 (partial success) when inquiry promotion fails after form_response saved", async () => {
    lookupMock.mockResolvedValue({
      status: "ok",
      form: { ...baseForm, autoPromoteToInquiry: true },
    });
    // First insert (form_responses) succeeds. Second insert (inquiries) fails.
    nextInsertResults = [
      { error: null },
      { error: { code: "23505", message: "duplicate" } },
    ];
    const { POST } = await import("../route");
    const res = await POST(
      makeRequest({ slug: "weddings", values: { name: "Jane", email: "j@x.com" } }),
    );
    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.inquiryPromotionFailed).toBe(true);
  });
});
