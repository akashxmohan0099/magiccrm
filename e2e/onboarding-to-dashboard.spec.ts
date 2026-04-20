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
  await enableDemoMode(page);
});

test.describe("Dashboard demo mode", () => {
  test("dashboard loads seeded data and bookings view", async ({ page }) => {
    await page.goto("/dashboard");
    await page.waitForTimeout(1500);

    await expect(page.locator("body")).not.toContainText("Workspace not found");

    await page.goto("/dashboard/bookings");
    await page.waitForTimeout(1000);
    await expect(page.locator("body")).toContainText("All confirmed and upcoming appointments.");
    await expect(page.getByRole("button", { name: /new booking/i })).toBeVisible();
  });

  test("legacy aliases resolve to current modules", async ({ page }) => {
    for (const slug of ["leads", "communication", "invoicing"]) {
      const response = await page.goto(`/dashboard/${slug}`);
      expect(response?.status()).not.toBe(404);
      await expect(page.locator("body")).not.toContainText(/not found/i);
    }
  });
});
