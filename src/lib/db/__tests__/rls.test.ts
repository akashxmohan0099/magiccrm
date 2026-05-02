/**
 * RLS isolation test fixture.
 *
 * REPO_GUIDE.md Section 9 says:
 *   "Test it: as User A, attempt a write with User B's workspace_id.
 *    Should fail."
 *
 * This spec exercises that contract against a real Supabase instance so a
 * misconfigured policy gets caught BEFORE it ships.
 *
 * ── How to run ─────────────────────────────────────────────────────────
 * Requires a test Supabase project (NOT prod). Set:
 *
 *   RLS_TEST_SUPABASE_URL=https://<project>.supabase.co
 *   RLS_TEST_SUPABASE_ANON_KEY=<anon key>
 *   RLS_TEST_SUPABASE_SERVICE_KEY=<service role key>
 *   RLS_TEST_USER_A_EMAIL=<email>
 *   RLS_TEST_USER_A_PASSWORD=<password>
 *   RLS_TEST_USER_B_EMAIL=<email>
 *   RLS_TEST_USER_B_PASSWORD=<password>
 *
 * Pre-create both users in the test project and run the migration. Each
 * user will be assigned to their own workspace by `setupWorkspace` below.
 *
 * Without these env vars the suite is skipped — CI doesn't have them
 * (and shouldn't, given the cost of standing up a real Supabase per run).
 *
 * ── What it proves ─────────────────────────────────────────────────────
 * 1. User A can SELECT clients in their own workspace.
 * 2. User A CANNOT SELECT clients in User B's workspace.
 * 3. User A CANNOT INSERT a client with User B's workspace_id.
 * 4. The same isolation holds for bookings (the highest-volume table).
 *
 * If any of these assertions fails, the migration's RLS coverage has a
 * hole — fix the policy before merging.
 */
import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const url = process.env.RLS_TEST_SUPABASE_URL;
const anonKey = process.env.RLS_TEST_SUPABASE_ANON_KEY;
const serviceKey = process.env.RLS_TEST_SUPABASE_SERVICE_KEY;
const userA = {
  email: process.env.RLS_TEST_USER_A_EMAIL,
  password: process.env.RLS_TEST_USER_A_PASSWORD,
};
const userB = {
  email: process.env.RLS_TEST_USER_B_EMAIL,
  password: process.env.RLS_TEST_USER_B_PASSWORD,
};

const haveCreds = Boolean(
  url &&
    anonKey &&
    serviceKey &&
    userA.email &&
    userA.password &&
    userB.email &&
    userB.password,
);

// Run conditionally: real spec when env is present, doc-only stub when not.
const describeRls = haveCreds ? describe : describe.skip;

describeRls("RLS isolation", () => {
  let admin: SupabaseClient;
  let aClient: SupabaseClient;
  let bClient: SupabaseClient;
  let workspaceA: string;
  let workspaceB: string;
  let aClientRowId: string;

  beforeAll(async () => {
    admin = createClient(url!, serviceKey!);
    aClient = createClient(url!, anonKey!);
    bClient = createClient(url!, anonKey!);

    // Sign each test user in.
    const [{ data: signA }, { data: signB }] = await Promise.all([
      aClient.auth.signInWithPassword({ email: userA.email!, password: userA.password! }),
      bClient.auth.signInWithPassword({ email: userB.email!, password: userB.password! }),
    ]);
    if (!signA.user || !signB.user) {
      throw new Error("RLS test users couldn't sign in — verify env vars + accounts.");
    }

    // Look up each user's workspace_id from workspace_members. Each test
    // user must already be assigned to exactly one workspace.
    const [aMember, bMember] = await Promise.all([
      admin
        .from("workspace_members")
        .select("workspace_id")
        .eq("auth_user_id", signA.user.id)
        .single(),
      admin
        .from("workspace_members")
        .select("workspace_id")
        .eq("auth_user_id", signB.user.id)
        .single(),
    ]);
    workspaceA = aMember.data!.workspace_id as string;
    workspaceB = bMember.data!.workspace_id as string;
    expect(workspaceA).not.toBe(workspaceB);

    // Seed one client in workspace A so the cross-tenant SELECT has
    // something it shouldn't be able to read from B's session.
    const { data: created } = await admin
      .from("clients")
      .insert({ workspace_id: workspaceA, name: "RLS-test client", email: "rls@test.invalid" })
      .select("id")
      .single();
    aClientRowId = created!.id as string;
  });

  afterAll(async () => {
    if (admin && aClientRowId) {
      await admin.from("clients").delete().eq("id", aClientRowId);
    }
  });

  it("User A can read their own workspace's clients", async () => {
    const { data, error } = await aClient
      .from("clients")
      .select("id")
      .eq("id", aClientRowId);
    expect(error).toBeNull();
    expect(data).toHaveLength(1);
  });

  it("User B CANNOT see User A's clients (cross-tenant SELECT blocked)", async () => {
    const { data, error } = await bClient
      .from("clients")
      .select("id")
      .eq("id", aClientRowId);
    // RLS doesn't error on a forbidden read — it returns an empty set.
    // That's the contract: user B simply doesn't see rows that aren't theirs.
    expect(error).toBeNull();
    expect(data ?? []).toHaveLength(0);
  });

  it("User A CANNOT insert a client with User B's workspace_id", async () => {
    const { data, error } = await aClient
      .from("clients")
      .insert({
        workspace_id: workspaceB, // ← attempting cross-tenant write
        name: "should never persist",
        email: "violation@test.invalid",
      })
      .select("id");
    // Either the insert errors (RLS WITH CHECK rejects it) or it returns
    // no rows (some configs translate to silent failure). Both prove the
    // write didn't land in B's workspace.
    expect(error || (data ?? []).length === 0).toBeTruthy();

    // Belt-and-suspenders: confirm B can't see the row either.
    const { data: bRows } = await bClient
      .from("clients")
      .select("id")
      .eq("email", "violation@test.invalid");
    expect(bRows ?? []).toHaveLength(0);
  });

  it("User A CANNOT insert a booking with User B's workspace_id", async () => {
    // Bookings are the highest-volume table — same isolation must hold.
    const { error } = await aClient.from("bookings").insert({
      workspace_id: workspaceB,
      client_id: aClientRowId, // even with their own client id, write to B is forbidden
      date: "2099-01-01",
      start_at: "2099-01-01T10:00:00Z",
      end_at: "2099-01-01T11:00:00Z",
      status: "pending",
    });
    expect(error).not.toBeNull();
  });
});

if (!haveCreds) {
  describe("RLS isolation", () => {
    it.skip("requires RLS_TEST_SUPABASE_* env vars (see file header)", () => {});
  });
}
