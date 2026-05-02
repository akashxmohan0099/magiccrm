import { describe, it, expect, vi } from "vitest";
import type { Service } from "@/types/models";

vi.mock("server-only", () => ({}));

import { shouldRequireDeposit } from "../deposit";

/**
 * Decision flow for whether a public booking must collect a deposit.
 * Tests both the no-DB short-circuits (fixed/none/email-missing) and the
 * conditional paths via a minimal Supabase stub.
 */
const svc = (overrides: Partial<Service> = {}): Service =>
  ({
    id: "svc-1",
    workspaceId: "ws-1",
    name: "Test",
    description: "",
    duration: 60,
    price: 100,
    category: "x",
    enabled: true,
    sortOrder: 0,
    bufferMinutes: 0,
    requiresConfirmation: false,
    depositType: "fixed",
    depositAmount: 50,
    depositAppliesTo: "all",
    locationType: "studio",
    createdAt: "x",
    updatedAt: "x",
    ...overrides,
  }) as Service;

/**
 * Minimal chainable stub. Each call to `.from(...)` returns a new chain
 * driven by the next entry in `responses`. The shouldRequireDeposit fn
 * makes at most 2 chained calls (clients, then bookings).
 */
function makeSupabase(responses: unknown[]) {
  let i = 0;
  const next = () => responses[i++];
  return {
    from: () => {
      const result = next();
      const chain: Record<string, unknown> = {
        select: () => chain,
        eq: () => chain,
        neq: () => chain,
        maybeSingle: () => Promise.resolve(result),
      };
      // For the bookings count call, the terminal is the awaitable chain itself.
      Object.defineProperty(chain, "then", {
        value: (resolve: (value: unknown) => unknown) => resolve(result),
      });
      return chain;
    },
  } as never;
}

describe("shouldRequireDeposit", () => {
  it("returns false when depositType is 'none'", async () => {
    const r = await shouldRequireDeposit({
      supabase: makeSupabase([]),
      workspaceId: "ws-1",
      service: svc({ depositType: "none" }),
      clientEmail: "x@y.com",
    });
    expect(r).toBe(false);
  });

  it("returns false when depositAmount is 0", async () => {
    const r = await shouldRequireDeposit({
      supabase: makeSupabase([]),
      workspaceId: "ws-1",
      service: svc({ depositAmount: 0 }),
      clientEmail: "x@y.com",
    });
    expect(r).toBe(false);
  });

  it("returns true unconditionally when depositAppliesTo is 'all'", async () => {
    const r = await shouldRequireDeposit({
      supabase: makeSupabase([]),
      workspaceId: "ws-1",
      service: svc({ depositAppliesTo: "all" }),
      clientEmail: "x@y.com",
    });
    expect(r).toBe(true);
  });

  it("treats missing email as 'new client' → requires deposit", async () => {
    const r = await shouldRequireDeposit({
      supabase: makeSupabase([]),
      workspaceId: "ws-1",
      service: svc({ depositAppliesTo: "new" }),
      clientEmail: undefined,
    });
    expect(r).toBe(true);
  });

  it("'flagged' returns true when client row has deposit_required=true", async () => {
    const r = await shouldRequireDeposit({
      supabase: makeSupabase([{ data: { id: "cli-1", deposit_required: true } }]),
      workspaceId: "ws-1",
      service: svc({ depositAppliesTo: "flagged" }),
      clientEmail: "x@y.com",
    });
    expect(r).toBe(true);
  });

  it("'flagged' returns false when client row is unflagged", async () => {
    const r = await shouldRequireDeposit({
      supabase: makeSupabase([{ data: { id: "cli-1", deposit_required: false } }]),
      workspaceId: "ws-1",
      service: svc({ depositAppliesTo: "flagged" }),
      clientEmail: "x@y.com",
    });
    expect(r).toBe(false);
  });

  it("'new' returns true for unknown email (no client row)", async () => {
    const r = await shouldRequireDeposit({
      supabase: makeSupabase([{ data: null }]),
      workspaceId: "ws-1",
      service: svc({ depositAppliesTo: "new" }),
      clientEmail: "newcomer@example.com",
    });
    expect(r).toBe(true);
  });

  it("'new' returns false when client has prior non-cancelled bookings", async () => {
    const r = await shouldRequireDeposit({
      supabase: makeSupabase([
        { data: { id: "cli-1", deposit_required: false } },
        { count: 3 }, // bookings count
      ]),
      workspaceId: "ws-1",
      service: svc({ depositAppliesTo: "new" }),
      clientEmail: "regular@example.com",
    });
    expect(r).toBe(false);
  });
});
