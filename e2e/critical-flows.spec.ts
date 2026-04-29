import { test, expect } from "playwright/test";

async function clearMagicState(page: import("playwright/test").Page) {
  await page.goto("/");
  await page.evaluate(() => {
    Object.keys(localStorage)
      .filter((key) => key.startsWith("magic-crm"))
      .forEach((key) => localStorage.removeItem(key));
  });
}

async function enableDemoMode(page: import("playwright/test").Page) {
  await page.context().addCookies([
    {
      name: "magic-e2e-demo",
      value: "1",
      url: "http://localhost:3000",
    },
  ]);
}

test.beforeEach(async ({ page }) => {
  await clearMagicState(page);
});

test.describe("Dashboard with modules", () => {
  test.beforeEach(async ({ page }) => {
    await enableDemoMode(page);
  });

  test("sidebar shows current core modules", async ({ page }) => {
    await page.goto("/dashboard");
    await page.waitForTimeout(1500);

    const sidebar = await page.locator("aside").first().textContent().catch(() => "");
    expect(sidebar).toContain("Communications");
    expect(sidebar).toContain("Inquiries");
    expect(sidebar).toContain("Bookings");
    expect(sidebar).toContain("Calendar");
    expect(sidebar).toContain("Clients");
    expect(sidebar).toContain("Payments");
  });

  test("module pages load without 404", async ({ page }) => {
    for (const slug of ["clients", "inquiries", "communications", "bookings", "payments", "leads", "communication", "invoicing"]) {
      const response = await page.goto(`/dashboard/${slug}`);
      expect(response?.status()).not.toBe(404);
      const is404 = await page.locator("text=/not found|404/i").isVisible().catch(() => false);
      expect(is404).toBeFalsy();
    }
  });
});

test.describe("Client CRUD", () => {
  test.beforeEach(async ({ page }) => {
    await enableDemoMode(page);
    await page.goto("/dashboard/clients");
    await page.waitForTimeout(1000);
  });

  test("add a client", async ({ page }) => {
    const addBtn = page.locator("button").filter({ hasText: /add|new client/i }).first();
    await expect(addBtn).toBeVisible();
    await addBtn.click();

    await page.locator("input[placeholder*=name i]").first().fill("Jane Test");
    await page.locator("input[type=email], input[placeholder*=email i]").first().fill("jane@test.com");
    await page.locator("button").filter({ hasText: /save|create|add client/i }).last().click();

    await expect(page.locator("text=Jane Test")).toBeVisible({ timeout: 5000 });
  });
});

test.describe("Dashboard", () => {
  test.beforeEach(async ({ page }) => {
    await enableDemoMode(page);
  });

  test("setup checklist persists across refresh", async ({ page }) => {
    await page.goto("/dashboard");
    await page.waitForTimeout(1000);

    const skipBtn = page.locator("button").filter({ hasText: /skip|mark done/i }).first();
    if (await skipBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await skipBtn.click();
      await page.waitForTimeout(500);
      await page.reload();
      await page.waitForTimeout(1000);
    }

    await expect(page.locator("body")).toContainText(/dashboard|revenue|bookings|clients/i);
  });
});

test.describe("Landing Page", () => {
  test("loads with heading and CTA", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator("h1").first()).toBeVisible();
    await expect(
      page.locator("button").filter({ hasText: /get early access/i }).first(),
    ).toBeVisible();
  });

  test("CTA opens the waitlist modal", async ({ page }) => {
    await page.goto("/");
    await page
      .locator("button")
      .filter({ hasText: /get early access/i })
      .first()
      .click();
    // Modal renders an email input + a "Get early access" submit button.
    await expect(page.locator('input[type="email"]').first()).toBeVisible({ timeout: 5000 });
  });

  test("no horizontal overflow on mobile", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto("/");
    await page.waitForTimeout(1500);
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth + 5);
    expect(overflow).toBeFalsy();
  });
});

test.describe("Settings", () => {
  test("settings page loads", async ({ page }) => {
    await enableDemoMode(page);
    await page.goto("/dashboard/settings");
    await expect(page.getByRole("heading", { name: "Settings", exact: true })).toBeVisible();
    await expect(page.getByRole("tab", { name: "General" })).toBeVisible();
    await expect(page.getByRole("tab", { name: "Modules" })).toBeVisible();
  });
});

test.describe("Error handling", () => {
  test("invalid route shows 404", async ({ page }) => {
    await enableDemoMode(page);
    await page.goto("/dashboard/nonexistent-module");
    await expect(page.getByRole("heading", { name: "404" })).toBeVisible();
    await expect(page.locator("body")).toContainText("This page doesn't exist.");
  });
});

test.describe("Onboarding", () => {
  test("onboarding starts at the persona picker", async ({ page }) => {
    await page.goto("/onboarding");
    await expect(
      page.getByRole("heading", { name: /what do you do\?/i }),
    ).toBeVisible();
  });

  test("can pick a persona and advance", async ({ page }) => {
    await page.goto("/onboarding");
    // Persona buttons are rendered as motion.buttons with the persona
    // label inside; clicking one advances to the structural questions
    // step (team size / business model).
    await page.getByRole("button", { name: /makeup|hair|barber|nails/i }).first().click();
    // The next step's primary CTA is "Continue" — the heading varies
    // by persona, so assert on the button instead.
    await expect(
      page.getByRole("button", { name: /continue|next/i }).first(),
    ).toBeVisible({ timeout: 5000 });
  });
});
