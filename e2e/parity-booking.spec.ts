/**
 * Side-by-side parity: dashboard preview vs /book/<slug>.
 *
 * Backed by the real "Parity Test Studio" workspace seeded via
 *   node --env-file=.env.local scripts/seed-parity-test.mjs
 *
 * Both URLs render the same <PublicBookingFlow> component against the same
 * Supabase data. Any divergence in price, deposit, duration, or cart math
 * is a regression that affects real customers.
 *
 * Each `case` row drives one parametric assertion across both surfaces.
 */
import { test, expect, type Page } from "playwright/test";

const SLUG = "parity-test";
const TEST_EMAIL = "parity-test@magic.local";
const TEST_PASSWORD = "parity-test-password-2026";

interface Case {
  /** Display label for test reporter. */
  label: string;
  /** Service name as it appears on the card (substring match). */
  serviceName: string;
  /** Expected base price shown on the card (cart line price BEFORE addons/dynamic). */
  expectedCardPrice: number;
  /** Expected duration shown on the card, in minutes. */
  expectedCardDuration: number;
  /** When the card displays a struck-through original alongside discounted. */
  expectedStruckThrough?: number;
  /** Optional badge text the card must show (e.g. "+3 guests", "20% off"). */
  expectedBadges?: string[];
  /** Cart-level deposit "Due today" expected when this service is the only line. */
  expectedDueToday?: number;
}

const CASES: Case[] = [
  {
    label: "1. fixed-price service",
    serviceName: "Classic Cut",
    expectedCardPrice: 60,
    expectedCardDuration: 45,
  },
  {
    label: "2a. promo (fixed promoPrice)",
    serviceName: "Spring Special",
    expectedCardPrice: 65,
    expectedCardDuration: 60,
    expectedStruckThrough: 90,
    expectedBadges: ["Today's offer"],
  },
  {
    label: "2b. promo (promoPercent)",
    serviceName: "Twenty Off Tuesday Trim",
    expectedCardPrice: 40, // 50 * (1 - 20%)
    expectedCardDuration: 30,
    expectedStruckThrough: 50,
    expectedBadges: ["20% off"],
  },
  {
    label: "3. tiered service",
    serviceName: "Cut & Blow Dry (Tiered)",
    expectedCardPrice: 65, // From-price = cheapest tier (Junior)
    expectedCardDuration: 60,
  },
  {
    label: "4. variant service",
    serviceName: "Balayage (Variants)",
    expectedCardPrice: 320, // From-price = cheapest variant
    expectedCardDuration: 120, // Card shows shortest variant duration
  },
  {
    label: "5. add-on service",
    serviceName: "Full Colour (Add-ons)",
    expectedCardPrice: 180,
    expectedCardDuration: 120,
  },
  {
    label: "6. group-booking service",
    serviceName: "Bridal Hair (Group)",
    expectedCardPrice: 220,
    expectedCardDuration: 90,
    expectedBadges: ["+3 guests"],
  },
  {
    label: "7. location-restricted service",
    serviceName: "Bondi-only Beach Wave",
    expectedCardPrice: 150,
    expectedCardDuration: 75,
  },
  {
    label: "8. deposit-required service",
    serviceName: "Premium Lash Lift",
    expectedCardPrice: 200,
    expectedCardDuration: 60,
    expectedDueToday: 100, // 50% of 200
  },
  {
    label: "9. dynamic-pricing service",
    serviceName: "Express Style (Dynamic Pricing)",
    expectedCardPrice: 80,
    expectedCardDuration: 30,
  },
  {
    label: "10. card-on-file service",
    serviceName: "Bridal Trial (Card on file)",
    expectedCardPrice: 250,
    expectedCardDuration: 90,
  },
];

/* ─── Format helpers (mirror ../src/components/modules/bookings/public/helpers.ts) ── */

/** Mirror of formatDuration. Matches the rendered card text. */
function formatDuration(minutes: number): string {
  if (minutes < 60) return `${minutes} min`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
}

/* ─── Public booking helpers ─────────────────────────────────────── */

/** Find a service card on the public menu by name substring. */
async function publicCard(page: Page, serviceName: string) {
  // ServiceCard.tsx renders the title in a paragraph inside a <button>.
  return page.locator("button", { hasText: serviceName }).first();
}

/** Read the price text shown on a public service card. Returns the
 *  discounted price first when a strikethrough is present, else the only
 *  price displayed. */
async function publicCardPrice(card: ReturnType<Page["locator"]>): Promise<{
  price: number | null;
  struckThrough: number | null;
}> {
  const text = (await card.textContent()) ?? "";
  // formatPrice → "A$120.00" (en-AU locale). Capture every $-prefixed amount.
  const matches = [...text.matchAll(/A?\$([\d,]+(?:\.\d+)?)/g)].map((m) =>
    Number(m[1].replace(/,/g, "")),
  );
  if (matches.length === 0) return { price: null, struckThrough: null };
  if (matches.length === 1) return { price: matches[0], struckThrough: null };
  // ServiceCard renders strikethrough first, discounted second.
  return { price: matches[1], struckThrough: matches[0] };
}

/** Add the named service to the cart on /book/<slug>. */
async function publicAddToCart(page: Page, serviceName: string) {
  const card = await publicCard(page, serviceName);
  await card.click();
}

/** Read the deposit amount from the public cart pane. CartPane labels it
 *  "Pay today" (paired with "At appointment"). The container is a flex row;
 *  we walk up to the row, then read the $-amount. */
async function publicDueToday(page: Page): Promise<number | null> {
  const label = page.getByText("Pay today", { exact: true }).first();
  if (!(await label.isVisible().catch(() => false))) return null;
  // Pay today label sits next to its amount. Look at the immediate container.
  const container = label.locator("xpath=..");
  const text = (await container.textContent()) ?? "";
  const m = text.match(/A?\$([\d,]+(?:\.\d+)?)/);
  return m ? Number(m[1].replace(/,/g, "")) : null;
}

/* ─── Dashboard preview helpers ──────────────────────────────────── */

async function signIn(page: Page) {
  await page.goto("/login");
  await page.locator('input[type="email"]').fill(TEST_EMAIL);
  await page.locator('input[type="password"]').fill(TEST_PASSWORD);
  await page.locator('button[type="submit"]').click();
  await page.waitForURL(/\/dashboard/, { timeout: 15000 });
  // Wait for the first useSupabaseSync to populate the settings store so
  // subsequent navigations don't race with hydration.
  await waitForWorkspaceData(page, 20000);
}

/**
 * Wait until useSupabaseSync has loaded the parity-test workspace into
 * Zustand. The Zustand `magic-crm-settings` localStorage is the canonical
 * signal — its `state.settings.businessName` flips to the real workspace
 * name once the sync completes.
 */
async function waitForWorkspaceData(page: Page, timeoutMs = 15000) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    const ready = await page.evaluate(() => {
      const settings = localStorage.getItem("magic-crm-settings");
      if (!settings) return false;
      try {
        const parsed = JSON.parse(settings);
        return parsed?.state?.settings?.businessName === "Parity Test Studio";
      } catch {
        return false;
      }
    });
    if (ready) return;
    await page.waitForTimeout(500);
  }
  throw new Error("workspace data did not load within timeout");
}

async function openPreview(page: Page) {
  await page.goto("/dashboard/services");
  await waitForWorkspaceData(page);
  const previewBtn = page.getByRole("button", { name: /^preview$/i }).first();
  await previewBtn.scrollIntoViewIfNeeded();
  await previewBtn.click();
  // The slideover renders a SlideOver with title "Booking page preview".
  // Wait for that, then for at least one service card from the seed to
  // appear inside it — that's the moment <PublicBookingFlow> has hydrated
  // its data and is ready to be probed.
  await page.getByText("Booking page preview").waitFor({ state: "visible", timeout: 10000 });
  const dialog = page.locator('[role="dialog"]', {
    has: page.getByText("Booking page preview"),
  });
  await dialog.locator("button", { hasText: "Classic Cut" }).first().waitFor({
    state: "visible",
    timeout: 10000,
  });
}

/** Within the preview slideover, locate a service card by name. The
 *  SlideOver is a portal — `[role=dialog]` reliably selects it across the
 *  document. We additionally anchor on the preview's title text so we
 *  never match a stray dialog (e.g. an unrelated slideover). */
async function previewCard(page: Page, serviceName: string) {
  const dialog = page.locator('[role="dialog"]', {
    has: page.getByText("Booking page preview"),
  });
  return dialog.locator("button", { hasText: serviceName }).first();
}

/* ─── Public-side spec — every case ──────────────────────────────── */

test.describe("/book/<slug> — every parity case renders correctly", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(`/book/${SLUG}`);
    await page.waitForLoadState("networkidle");
  });

  for (const c of CASES) {
    test(c.label, async ({ page }) => {
      const card = await publicCard(page, c.serviceName);
      await expect(card).toBeVisible();

      const { price, struckThrough } = await publicCardPrice(card);
      expect(
        price,
        `card price for "${c.serviceName}"`,
      ).toBe(c.expectedCardPrice);

      if (c.expectedStruckThrough != null) {
        expect(
          struckThrough,
          `struck-through original for "${c.serviceName}"`,
        ).toBe(c.expectedStruckThrough);
      } else {
        expect(struckThrough).toBeNull();
      }

      const cardText = (await card.textContent()) ?? "";
      expect(cardText).toContain(formatDuration(c.expectedCardDuration));

      for (const badge of c.expectedBadges ?? []) {
        expect(cardText.toLowerCase()).toContain(badge.toLowerCase());
      }
    });
  }
});

test.describe("/book/<slug> — cart math", () => {
  test("8. deposit service: Due today = 50% of 200", async ({ page }) => {
    await page.goto(`/book/${SLUG}`);
    await page.waitForLoadState("networkidle");
    await publicAddToCart(page, "Premium Lash Lift");
    // The cart pane on desktop or mobile bar both render Due today.
    await page.waitForTimeout(500);
    const dueToday = await publicDueToday(page);
    expect(dueToday, "Due today on a 50% deposit / $200 service").toBe(100);
  });
});

/* ─── Preview vs public — value parity ───────────────────────────── */

/**
 * Capture each case's price + duration + struckThrough from a rendered surface.
 * Returns a stable JSON-able shape that's directly comparable between the
 * two surfaces.
 */
interface CaptureRow {
  label: string;
  serviceName: string;
  price: number | null;
  struckThrough: number | null;
  durationLabel: string | null;
  found: boolean;
}

async function captureCases(
  page: Page,
  resolveCard: (name: string) => Promise<ReturnType<Page["locator"]>>,
): Promise<CaptureRow[]> {
  const out: CaptureRow[] = [];
  for (const c of CASES) {
    const card = await resolveCard(c.serviceName);
    const found = (await card.count()) > 0;
    if (!found) {
      out.push({
        label: c.label,
        serviceName: c.serviceName,
        price: null,
        struckThrough: null,
        durationLabel: null,
        found: false,
      });
      continue;
    }
    const { price, struckThrough } = await publicCardPrice(card);
    const text = (await card.textContent()) ?? "";
    const dur = text.match(/(\d+h\s*\d+m|\d+h|\d+\s*min)/);
    out.push({
      label: c.label,
      serviceName: c.serviceName,
      price,
      struckThrough,
      durationLabel: dur ? dur[0].replace(/\s+/g, " ").trim() : null,
      found: true,
    });
  }
  return out;
}

test.describe("dashboard preview vs /book/<slug> — same numbers", () => {
  test("every card price + duration matches between preview and public", async ({
    page,
  }) => {
    // Capture public side first (unauthenticated, fast, no risk of being
    // disturbed). Then sign in, open the preview, capture the same fields.
    // Compare in JS — no two-tab coordination, so HMR re-renders in either
    // surface can't void the other's captured state.
    await page.goto(`/book/${SLUG}`);
    await page.waitForLoadState("networkidle");
    const publicRows = await captureCases(page, async (name) =>
      publicCard(page, name),
    );

    // Move to the dashboard. Closes the public page implicitly.
    await signIn(page);
    await openPreview(page);
    const previewRows = await captureCases(page, async (name) =>
      previewCard(page, name),
    );

    const mismatches: string[] = [];
    for (let i = 0; i < CASES.length; i += 1) {
      const c = CASES[i];
      const pub = publicRows[i];
      const prev = previewRows[i];
      if (!pub.found) {
        mismatches.push(`${c.label}: missing on public side`);
        continue;
      }
      if (!prev.found) {
        mismatches.push(`${c.label}: missing on preview side`);
        continue;
      }
      if (pub.price !== prev.price) {
        mismatches.push(
          `${c.label}: card price diverges — public=${pub.price}, preview=${prev.price}`,
        );
      }
      if (pub.struckThrough !== prev.struckThrough) {
        mismatches.push(
          `${c.label}: struck-through diverges — public=${pub.struckThrough}, preview=${prev.struckThrough}`,
        );
      }
      if (pub.durationLabel !== prev.durationLabel) {
        mismatches.push(
          `${c.label}: duration text diverges — public="${pub.durationLabel}", preview="${prev.durationLabel}"`,
        );
      }
    }

    if (mismatches.length > 0) {
      throw new Error(
        `Preview vs public divergences (${mismatches.length}):\n  - ${mismatches.join("\n  - ")}`,
      );
    }
  });
});
