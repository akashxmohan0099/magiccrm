import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

// ── Mocks ─────────────────────────────────────────────
//
// We mock the rate limiter (always allow) and the public-booking helpers
// the route depends on. The point of the route's own tests is to verify
// input validation + error mapping; the engine itself has its own tests
// (basket-availability.test.ts).

vi.mock("@/lib/rate-limit", () => ({
  rateLimit: vi.fn(async () => ({ allowed: true, remaining: 10 })),
}));

let resolvedWorkspace: { workspaceId: string; businessName: string } | null = {
  workspaceId: "ws-test",
  businessName: "Test Studio",
};
const getAvailableBasketSlots = vi.fn(async () => [
  {
    time: "10:00",
    startAt: "2026-05-04T10:00:00.000Z",
    endAt: "2026-05-04T11:30:00.000Z",
    assignments: [
      { serviceId: "svc-1", memberId: "tm-1", startAt: "2026-05-04T10:00:00.000Z", endAt: "2026-05-04T11:00:00.000Z" },
      { serviceId: "svc-2", memberId: "tm-1", startAt: "2026-05-04T11:00:00.000Z", endAt: "2026-05-04T11:30:00.000Z" },
    ],
  },
]);

vi.mock("@/lib/server/public-booking", () => ({
  resolveBookingWorkspaceBySlug: vi.fn(async () => resolvedWorkspace),
  fetchWorkspaceAvailability: vi.fn(async () => []),
  getAvailableBasketSlots: (...args: unknown[]) => getAvailableBasketSlots(...(args as [])),
}));

// Import AFTER mocks so the route picks them up.
import { POST } from "../route";

beforeEach(() => {
  resolvedWorkspace = { workspaceId: "ws-test", businessName: "Test Studio" };
  getAvailableBasketSlots.mockClear();
});

function makeReq(body: unknown): NextRequest {
  return new NextRequest("http://localhost/api/public/availability/basket", {
    method: "POST",
    body: typeof body === "string" ? body : JSON.stringify(body),
    headers: { "content-type": "application/json" },
  });
}

describe("POST /api/public/availability/basket", () => {
  it("rejects malformed JSON with 400", async () => {
    const res = await POST(makeReq("not-json"));
    expect(res.status).toBe(400);
  });

  it("rejects missing slug with 400", async () => {
    const res = await POST(makeReq({ date: "2026-05-04", items: [{ serviceId: "x" }] }));
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toMatch(/slug/i);
  });

  it("rejects bad date format with 400", async () => {
    const res = await POST(
      makeReq({ slug: "studio", date: "May 4 2026", items: [{ serviceId: "x" }] }),
    );
    expect(res.status).toBe(400);
  });

  it("rejects empty basket with 400", async () => {
    const res = await POST(makeReq({ slug: "studio", date: "2026-05-04", items: [] }));
    expect(res.status).toBe(400);
  });

  it("rejects basket > 10 items with 400", async () => {
    const items = Array.from({ length: 11 }, (_, i) => ({ serviceId: `svc-${i}` }));
    const res = await POST(makeReq({ slug: "studio", date: "2026-05-04", items }));
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toMatch(/too large/i);
  });

  it("rejects item without serviceId with 400", async () => {
    const res = await POST(
      makeReq({
        slug: "studio",
        date: "2026-05-04",
        items: [{ variantId: "v1" }],
      }),
    );
    expect(res.status).toBe(400);
  });

  it("returns 404 when slug doesn't resolve", async () => {
    resolvedWorkspace = null;
    const res = await POST(
      makeReq({ slug: "ghost", date: "2026-05-04", items: [{ serviceId: "x" }] }),
    );
    expect(res.status).toBe(404);
  });

  it("returns 200 + slots when basket fits", async () => {
    const res = await POST(
      makeReq({
        slug: "studio",
        date: "2026-05-04",
        items: [
          { serviceId: "svc-1" },
          { serviceId: "svc-2", extraDurationMinutes: 15 },
        ],
      }),
    );
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.slots).toHaveLength(1);
    expect(body.slots[0].time).toBe("10:00");
    expect(body.slots[0].assignments).toHaveLength(2);

    // Verify the mock was called with the parsed item shape.
    expect(getAvailableBasketSlots).toHaveBeenCalledTimes(1);
    const callArg = getAvailableBasketSlots.mock.calls[0][0] as Record<string, unknown>;
    expect(callArg.workspaceId).toBe("ws-test");
    expect(callArg.date).toBe("2026-05-04");
    expect(callArg.items).toEqual([
      { serviceId: "svc-1", variantId: undefined, extraDurationMinutes: undefined, preferredMemberId: undefined },
      { serviceId: "svc-2", variantId: undefined, extraDurationMinutes: 15, preferredMemberId: undefined },
    ]);
  });

  it("returns 200 + empty slots when nothing fits (not an error)", async () => {
    getAvailableBasketSlots.mockResolvedValueOnce([]);
    const res = await POST(
      makeReq({ slug: "studio", date: "2026-05-04", items: [{ serviceId: "svc-1" }] }),
    );
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.slots).toEqual([]);
  });
});
