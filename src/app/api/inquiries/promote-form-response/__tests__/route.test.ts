import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

// ── Stateful Supabase mock ────────────────────────────
//
// The promote-form-response route hits four query patterns:
//   1. form_responses select  → returns the row + back-pointer
//   2. forms select fields    → returns the form's field list
//   3. inquiries insert        → drives 23505/success branches
//   4. inquiries select id     → fallback after 23505
//   5. form_responses update   → back-pointer write
//
// Each test configures `tableHandlers` to drive the right behaviour. The
// chainable builder returns `this` until a terminal method (maybeSingle /
// insert / update) is hit, at which point we hand back the configured shape.

type QueryResult = { data?: unknown; error?: unknown };

interface TableHandlers {
  // Called when route does .from(<table>).select(...)...maybeSingle()
  selectMaybeSingle?: () => QueryResult;
  // Called when route does .from(<table>).insert(row). Receives the row.
  insert?: (row: Record<string, unknown>) => QueryResult;
  // Called when route does .from(<table>).update(payload).eq(...).
  update?: (payload: Record<string, unknown>) => QueryResult;
}

const tableHandlers: Record<string, TableHandlers> = {};

function makeBuilder(table: string) {
  let isInsert = false;
  let isUpdate = false;
  let updatePayload: Record<string, unknown> | undefined;
  const builder: Record<string, unknown> = {};
  const chain = () => builder;
  builder.select = vi.fn(() => chain());
  builder.eq = vi.fn(() => chain());
  builder.order = vi.fn(() => chain());
  builder.limit = vi.fn(() => chain());
  builder.ilike = vi.fn(() => chain());
  builder.maybeSingle = vi.fn(async () => {
    if (isInsert) {
      return tableHandlers[table]?.insert?.({}) ?? { data: null, error: null };
    }
    return tableHandlers[table]?.selectMaybeSingle?.() ?? { data: null, error: null };
  });
  // .then so awaited builders without .maybeSingle() resolve to the same place.
  builder.then = (resolve: (v: QueryResult) => unknown) => {
    if (isInsert) {
      return Promise.resolve(tableHandlers[table]?.insert?.({}) ?? { error: null }).then(resolve);
    }
    if (isUpdate) {
      return Promise.resolve(
        tableHandlers[table]?.update?.(updatePayload ?? {}) ?? { error: null },
      ).then(resolve);
    }
    return Promise.resolve({ data: null, error: null }).then(resolve);
  };
  builder.insert = vi.fn((row: Record<string, unknown>) => {
    isInsert = true;
    const result = tableHandlers[table]?.insert?.(row) ?? { error: null };
    // Return a thenable so `await supabase.from(t).insert(x)` works.
    return Promise.resolve(result);
  });
  builder.update = vi.fn((payload: Record<string, unknown>) => {
    isUpdate = true;
    updatePayload = payload;
    return chain();
  });
  return builder;
}

vi.mock("@/lib/supabase-server", () => ({
  createClient: vi.fn(async () => ({
    from: vi.fn((table: string) => makeBuilder(table)),
  })),
}));

vi.mock("@/lib/id", () => ({
  generateId: vi.fn(() => "fixed-inquiry-id"),
}));

// ── Helpers ───────────────────────────────────────────

function makeRequest(body: unknown): NextRequest {
  return new NextRequest("http://localhost/api/inquiries/promote-form-response", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
}

beforeEach(() => {
  for (const k of Object.keys(tableHandlers)) delete tableHandlers[k];
});

describe("POST /api/inquiries/promote-form-response", () => {
  it("returns 400 when formResponseId is missing", async () => {
    const { POST } = await import("../route");
    const res = await POST(makeRequest({}));
    expect(res.status).toBe(400);
  });

  it("returns 404 when the form response cannot be found", async () => {
    tableHandlers.form_responses = {
      selectMaybeSingle: () => ({ data: null, error: null }),
    };
    const { POST } = await import("../route");
    const res = await POST(makeRequest({ formResponseId: "missing" }));
    expect(res.status).toBe(404);
  });

  it("is idempotent: returns the existing inquiry id when already promoted", async () => {
    tableHandlers.form_responses = {
      selectMaybeSingle: () => ({
        data: {
          id: "r-1",
          workspace_id: "ws-1",
          form_id: "f-1",
          values: { name: "Jane" },
          inquiry_id: "existing-inquiry",
        },
        error: null,
      }),
    };
    const { POST } = await import("../route");
    const res = await POST(makeRequest({ formResponseId: "r-1" }));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.inquiryId).toBe("existing-inquiry");
  });

  it("creates a new inquiry on the happy path", async () => {
    tableHandlers.form_responses = {
      selectMaybeSingle: () => ({
        data: {
          id: "r-2",
          workspace_id: "ws-1",
          form_id: "f-1",
          values: { name: "Jane", email: "j@x.com" },
          inquiry_id: null,
        },
        error: null,
      }),
      update: () => ({ error: null }),
    };
    tableHandlers.forms = {
      selectMaybeSingle: () => ({
        data: {
          fields: [
            { name: "name", type: "text", label: "Name", required: true },
            { name: "email", type: "email", label: "Email", required: true },
          ],
        },
        error: null,
      }),
    };
    let insertedInquiry: Record<string, unknown> | null = null;
    tableHandlers.inquiries = {
      insert: (row) => {
        insertedInquiry = row;
        return { error: null };
      },
    };
    const { POST } = await import("../route");
    const res = await POST(makeRequest({ formResponseId: "r-2" }));
    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.inquiryId).toBe("fixed-inquiry-id");
    expect(insertedInquiry?.form_response_id).toBe("r-2");
    expect(insertedInquiry?.submission_values).toBeUndefined();
  });

  it("resolves a 23505 race by returning the inquiry that already won", async () => {
    tableHandlers.form_responses = {
      selectMaybeSingle: () => ({
        data: {
          id: "r-3",
          workspace_id: "ws-1",
          form_id: "f-1",
          values: { name: "Jane" },
          inquiry_id: null,
        },
        error: null,
      }),
    };
    tableHandlers.forms = {
      selectMaybeSingle: () => ({ data: { fields: [] }, error: null }),
    };
    let inquiriesCall = 0;
    tableHandlers.inquiries = {
      insert: () => ({ error: { code: "23505", message: "duplicate" } }),
      selectMaybeSingle: () => {
        inquiriesCall += 1;
        return { data: { id: "racer-won-inquiry" }, error: null };
      },
    };
    const { POST } = await import("../route");
    const res = await POST(makeRequest({ formResponseId: "r-3" }));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.inquiryId).toBe("racer-won-inquiry");
    expect(inquiriesCall).toBe(1);
  });

  it("returns 500 when the inquiry insert fails for a non-23505 reason", async () => {
    tableHandlers.form_responses = {
      selectMaybeSingle: () => ({
        data: {
          id: "r-4",
          workspace_id: "ws-1",
          form_id: null,
          values: {},
          inquiry_id: null,
        },
        error: null,
      }),
    };
    tableHandlers.inquiries = {
      insert: () => ({ error: { code: "23502", message: "not null" } }),
    };
    const { POST } = await import("../route");
    const res = await POST(makeRequest({ formResponseId: "r-4" }));
    expect(res.status).toBe(500);
  });
});
