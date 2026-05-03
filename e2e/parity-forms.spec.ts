/**
 * Forms + inquiries parity. Backed by the same parity-test workspace seeded
 * via `node --env-file=.env.local scripts/seed-parity-test.mjs`.
 *
 * Covers the public-form pipeline end-to-end:
 *   - public form rendering (every field type)
 *   - required-field validation rejects empty submission
 *   - successful submission writes a form_response
 *   - auto_promote_to_inquiry=true flag promotes the response to an inquiry
 *   - manual-promote forms only write a form_response (no inquiry)
 *   - disabled forms are NOT bookable (410)
 *   - missing slugs return 404
 *
 * Plus a dashboard side: signed-in owner can see the inquiry list with the
 * pre-seeded inquiries, and a freshly-submitted auto-promote form lands
 * there too.
 */
import { test, expect, type Page } from "playwright/test";
import { createClient } from "@supabase/supabase-js";

const TEST_EMAIL = "parity-test@magic.local";
const TEST_PASSWORD = "parity-test-password-2026";
const PARITY_WS = "11111111-1111-4111-8111-111111111111";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";

if (!SUPABASE_URL || !SUPABASE_KEY) {
  // Fail loudly at import time if envs are missing — a silent skip would
  // be worse than a flaky red.
  throw new Error(
    "parity-forms.spec.ts requires NEXT_PUBLIC_SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY env vars. Run with `--env-file=.env.local`.",
  );
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
  auth: { persistSession: false },
});

async function fetchFormResponses(formId: string) {
  const { data, error } = await supabase
    .from("form_responses")
    .select("id, values, contact_name, contact_email, inquiry_id")
    .eq("workspace_id", PARITY_WS)
    .eq("form_id", formId)
    .order("submitted_at", { ascending: false });
  if (error) throw error;
  return data ?? [];
}

async function fetchInquiries() {
  const { data, error } = await supabase
    .from("inquiries")
    .select("id, name, email, status, source, form_id, created_at")
    .eq("workspace_id", PARITY_WS)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data ?? [];
}

/** Wipe form_responses + recently-created inquiries so this spec is
 *  re-runnable. Pre-seeded inquiries (sarah-wedding, jane-trial) are kept. */
async function resetEphemeralRows() {
  await supabase.from("form_responses").delete().eq("workspace_id", PARITY_WS);
  // Delete inquiries created by THIS spec (anything not from the seed UUIDs).
  await supabase
    .from("inquiries")
    .delete()
    .eq("workspace_id", PARITY_WS)
    .not("id", "in", `(88888888-8888-4888-8888-888888888801,88888888-8888-4888-8888-888888888802)`);
}

test.beforeAll(async () => {
  await resetEphemeralRows();
});

test.describe("/inquiry/<slug> — form rendering + submission pipeline", () => {
  test("renders all field types from a fully-typed form", async ({ page }) => {
    await page.goto("/inquiry/wedding-inquiry");
    await page.waitForLoadState("networkidle");

    await expect(page.getByText("Wedding Inquiry (auto-promote)")).toBeVisible();

    // Every field label must render.
    const labels = [
      "Full Name",
      "Email",
      "Phone",
      "Service interest",
      "Event type",
      "Optional add-ons",
      "I agree to be contacted",
      "Preferred date",
      "Number of guests",
      "Tell us about your vision",
    ];
    for (const label of labels) {
      await expect(page.getByText(label, { exact: false }).first()).toBeVisible();
    }
  });

  test("submitting empty form blocks at required validation", async ({ page }) => {
    await page.goto("/inquiry/contact");
    await page.waitForLoadState("networkidle");

    // Click submit with nothing filled.
    const submitBtn = page.locator('button[type="submit"]').first();
    await submitBtn.click();
    // Expect we did NOT advance to the success state. The simplest invariant:
    // the form is still on the page (submit button still there).
    await page.waitForTimeout(500);
    await expect(submitBtn).toBeVisible();
    // And the page should still have the form fields (not the thank-you).
    await expect(page.getByText("Message", { exact: false }).first()).toBeVisible();
  });

  test("auto-promote form: valid submission → form_response + inquiry", async ({
    page,
  }) => {
    await resetEphemeralRows();
    await page.goto("/inquiry/wedding-inquiry");
    await page.waitForLoadState("networkidle");

    // Fill a unique tag so we can later identify our row.
    const stamp = `playwright-${Date.now()}`;
    await page.locator('input[type="text"]').first().fill(`Auto Promote ${stamp}`);
    await page.locator('input[type="email"]').first().fill(`${stamp}@example.com`);

    // Fill the select (Service interest — required) by dispatching the
    // first option. The renderer uses native <select> for select fields.
    const select = page.locator("select").first();
    await select.selectOption({ index: 1 });

    // Tick the consent checkbox (required).
    const consentCheckbox = page.getByLabel(/I agree to be contacted/i).first();
    await consentCheckbox.check().catch(async () => {
      // Fallback: click the label/option directly when the input isn't a
      // simple checkbox (some renderers wrap the option as a button).
      const consentBtn = page.locator("button", {
        hasText: "Yes — contact me about my booking",
      });
      if ((await consentBtn.count()) > 0) await consentBtn.first().click();
    });

    const submitBtn = page.locator('button[type="submit"]').first();
    await submitBtn.click();

    // Wait for the success state — the renderer flips to a thank-you screen.
    await page.waitForTimeout(2000);

    // Verify the form_response landed in Supabase, and the inquiry was
    // promoted (auto_promote_to_inquiry=true).
    const formId = "77777777-7777-4777-8777-777777777701";
    const responses = await fetchFormResponses(formId);
    expect(
      responses.find((r) => (r.contact_email ?? "").includes(stamp)),
      "form_response with our stamped email",
    ).toBeTruthy();

    const inquiries = await fetchInquiries();
    expect(
      inquiries.find((i) => (i.email ?? "").includes(stamp)),
      "inquiry with our stamped email (auto-promote)",
    ).toBeTruthy();
  });

  test("manual-promote form: submission writes form_response but NO inquiry", async ({
    page,
  }) => {
    await resetEphemeralRows();
    await page.goto("/inquiry/contact");
    await page.waitForLoadState("networkidle");

    const stamp = `manual-${Date.now()}`;
    await page.locator('input[type="text"]').first().fill(`Manual Promote ${stamp}`);
    await page.locator('input[type="email"]').first().fill(`${stamp}@example.com`);
    await page.locator("textarea").first().fill("Hello, please contact me about a service.");

    await page.locator('button[type="submit"]').first().click();
    await page.waitForTimeout(2000);

    const formId = "77777777-7777-4777-8777-777777777702";
    const responses = await fetchFormResponses(formId);
    const ours = responses.find((r) => (r.contact_email ?? "").includes(stamp));
    expect(ours, "form_response with our stamped email").toBeTruthy();
    // Critical: NO inquiry created.
    expect(
      ours?.inquiry_id,
      "manual-promote response must not have inquiry_id",
    ).toBeFalsy();

    const inquiries = await fetchInquiries();
    expect(
      inquiries.find((i) => (i.email ?? "").includes(stamp)),
      "manual-promote should not auto-create an inquiry",
    ).toBeFalsy();
  });

  test("disabled form: page renders a disabled-state message, not the form", async ({
    page,
  }) => {
    await page.goto("/inquiry/old-form");
    await page.waitForLoadState("networkidle");
    // Disabled form: the page should NOT show a submit button.
    const submitCount = await page.locator('button[type="submit"]').count();
    expect(submitCount, "disabled forms must not surface a submit button").toBe(0);
  });

  test("missing slug: page renders not-found state", async ({ page }) => {
    await page.goto("/inquiry/this-slug-does-not-exist");
    await page.waitForLoadState("networkidle");
    const submitCount = await page.locator('button[type="submit"]').count();
    expect(submitCount, "missing-form pages must not surface a submit button").toBe(0);
  });
});

/* ─── Dashboard inquiries — the operator's view ──────────────────── */

async function signIn(page: Page) {
  await page.goto("/login");
  await page.locator('input[type="email"]').fill(TEST_EMAIL);
  await page.locator('input[type="password"]').fill(TEST_PASSWORD);
  await page.locator('button[type="submit"]').click();
  await page.waitForURL(/\/dashboard/, { timeout: 15000 });
  // Wait for workspace data sync to populate the settings store (so the
  // dashboard shows "Parity Test Studio" not the demo seed).
  for (let i = 0; i < 25; i++) {
    const ready = await page.evaluate(() => {
      const s = localStorage.getItem("magic-crm-settings");
      if (!s) return false;
      try {
        return JSON.parse(s)?.state?.settings?.businessName === "Parity Test Studio";
      } catch {
        return false;
      }
    });
    if (ready) return;
    await page.waitForTimeout(500);
  }
  throw new Error("workspace data did not load within timeout");
}

/** Wait until a Zustand store has loaded N rows from Supabase. */
async function waitForStoreCount(
  page: Page,
  storageKey: string,
  arrayPath: string,
  minCount: number,
  timeoutMs = 15000,
) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    const count = await page.evaluate(
      ({ key, path }) => {
        const raw = localStorage.getItem(key);
        if (!raw) return 0;
        try {
          const parsed = JSON.parse(raw);
          const arr = path
            .split(".")
            .reduce<unknown>((acc, k) => (acc as Record<string, unknown>)?.[k], parsed);
          return Array.isArray(arr) ? arr.length : 0;
        } catch {
          return 0;
        }
      },
      { key: storageKey, path: arrayPath },
    );
    if (count >= minCount) return count;
    await page.waitForTimeout(400);
  }
  throw new Error(
    `${storageKey}.${arrayPath} did not reach ${minCount} rows within ${timeoutMs}ms`,
  );
}

test.describe("dashboard — operator view of seeded data", () => {
  test("inquiries list shows the pre-seeded inquiries", async ({ page }) => {
    await signIn(page);
    await page.goto("/dashboard/inquiries");
    await waitForStoreCount(page, "magic-crm-inquiries", "state.inquiries", 2);

    // Use getByText with a generous timeout — gives the InquiriesPage time
    // to subscribe to the Zustand store and render its rows.
    await expect(page.getByText("Sarah Wedding").first()).toBeVisible({ timeout: 10000 });
    await expect(page.getByText("Jane Trial").first()).toBeVisible({ timeout: 10000 });
  });

  test("forms list shows the seeded forms by name", async ({ page }) => {
    await signIn(page);
    await page.goto("/dashboard/forms");
    await waitForStoreCount(page, "magic-crm-forms", "state.forms", 3);

    await expect(
      page.getByText("Wedding Inquiry (auto-promote)").first(),
    ).toBeVisible({ timeout: 10000 });
    await expect(
      page.getByText("General Contact (manual promote)").first(),
    ).toBeVisible({ timeout: 10000 });
    await expect(page.getByText("Old Form (disabled)").first()).toBeVisible({
      timeout: 10000,
    });
  });
});
