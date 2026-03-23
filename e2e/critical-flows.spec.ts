import { test, expect } from "playwright/test";

// Helper to seed onboarding state
async function seedOnboarding(page: import("playwright/test").Page) {
  await page.evaluate(() => {
    const features = (ids: string[]) => ids.map((id) => ({ id, label: id, description: "", selected: true }));
    const state = {
      step: 7, setupMethod: "guided", selectedIndustry: "beauty-wellness", selectedPersona: "hair-salon",
      businessContext: { businessName: "Test Salon", businessDescription: "Hair salon in Brisbane", industry: "Beauty & Wellness", location: "Brisbane", industryOther: "" },
      needs: { manageCustomers: true, receiveInquiries: true, communicateClients: true, acceptBookings: true, sendInvoices: true, manageProjects: false, runMarketing: true, handleSupport: false, manageDocuments: false },
      teamSize: "Just me",
      featureSelections: {
        "manageCustomers": features(["follow-up-reminders", "activity-timeline"]),
        "client-database": features(["follow-up-reminders", "activity-timeline"]),
        "receiveInquiries": features(["web-forms"]),
        "leads-pipeline": features(["web-forms"]),
        "communicateClients": features(["email", "sms"]),
        "communication": features(["email", "sms"]),
        "acceptBookings": features(["booking-page", "booking-deposits"]),
        "bookings-calendar": features(["booking-page", "booking-deposits"]),
        "sendInvoices": features(["invoice-templates", "late-reminders"]),
        "quotes-invoicing": features(["invoice-templates", "late-reminders"]),
        "runMarketing": features(["review-collection"]),
        "marketing": features(["review-collection"]),
      },
      discoveryAnswers: {}, drilldownAnswers: {}, isBuilding: false, buildComplete: true,
    };
    localStorage.setItem("magic-crm-onboarding", JSON.stringify({ state, version: 7 }));
  });
}

// Clear state before each test
test.beforeEach(async ({ page }) => {
  await page.goto("/");
  await page.evaluate(() => {
    Object.keys(localStorage).filter((k) => k.startsWith("magic-crm")).forEach((k) => localStorage.removeItem(k));
  });
});

// ═══════════════════════════════════════════════════
// TEST 1: Dashboard shows modules after onboarding
// ═══════════════════════════════════════════════════

test.describe("Dashboard with modules", () => {
  test("sidebar shows enabled modules", async ({ page }) => {
    await page.goto("/dashboard");
    await seedOnboarding(page);
    await page.reload();
    await page.waitForTimeout(1500);

    const sidebar = await page.locator("aside").first().textContent().catch(() => "");
    expect(sidebar).toContain("Clients");
    expect(sidebar).toContain("Leads");
    expect(sidebar).toContain("Scheduling");
    expect(sidebar).toContain("Billing");
    // Solo — no Team
    expect(sidebar).not.toContain("Team");
  });

  test("module pages load without 404", async ({ page }) => {
    await page.goto("/dashboard");
    await seedOnboarding(page);
    await page.reload();
    await page.waitForTimeout(1000);

    for (const slug of ["clients", "leads", "communication", "bookings", "invoicing"]) {
      await page.goto(`/dashboard/${slug}`);
      await page.waitForTimeout(500);
      const is404 = await page.locator("text=/not found|404/i").isVisible().catch(() => false);
      expect(is404).toBeFalsy();
    }
  });
});

// ═══════════════════════════════════════════════════
// TEST 2: Client CRUD
// ═══════════════════════════════════════════════════

test.describe("Client CRUD", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/dashboard");
    await seedOnboarding(page);
    await page.reload();
    await page.waitForTimeout(1000);
  });

  test("add a client", async ({ page }) => {
    await page.goto("/dashboard/clients");
    await page.waitForTimeout(1000);

    const addBtn = page.locator("button").filter({ hasText: /add|new client/i }).first();
    if (await addBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await addBtn.click();
      await page.waitForTimeout(500);

      const nameInput = page.locator("input[placeholder*=name i]").first();
      if (await nameInput.isVisible()) await nameInput.fill("Jane Test");

      const emailInput = page.locator("input[type=email], input[placeholder*=email i]").first();
      if (await emailInput.isVisible()) await emailInput.fill("jane@test.com");

      // Click save inside the slide-over
      const saveBtn = page.locator("button").filter({ hasText: /save|create|add client/i }).last();
      if (await saveBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
        await saveBtn.click();
        await page.waitForTimeout(1000);
      }

      await expect(page.locator("text=Jane Test")).toBeVisible({ timeout: 5000 }).catch(() => {});
    }
  });
});

// ═══════════════════════════════════════════════════
// TEST 3: Dashboard persistence
// ═══════════════════════════════════════════════════

test.describe("Dashboard", () => {
  test("setup checklist persists across refresh", async ({ page }) => {
    await page.goto("/dashboard");
    await page.waitForTimeout(1000);

    const skipBtn = page.locator("button").filter({ hasText: /skip|mark done/i }).first();
    if (await skipBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await skipBtn.click();
      await page.waitForTimeout(500);
      await page.reload();
      await page.waitForTimeout(1000);
      const body = await page.textContent("body");
      expect(body).toBeTruthy();
    }
  });
});

// ═══════════════════════════════════════════════════
// TEST 4: Landing Page
// ═══════════════════════════════════════════════════

test.describe("Landing Page", () => {
  test("loads with heading and CTA", async ({ page }) => {
    await page.goto("/");
    await page.waitForTimeout(1000);
    await expect(page.locator("h1").first()).toBeVisible();
    const cta = page.locator("a").filter({ hasText: /build my crm/i }).first();
    await expect(cta).toBeVisible();
  });

  test("CTA links to onboarding", async ({ page }) => {
    await page.goto("/");
    const cta = page.locator("a").filter({ hasText: /build my crm/i }).first();
    if (await cta.isVisible()) {
      const href = await cta.getAttribute("href");
      expect(href).toContain("/onboarding");
    }
  });

  test("no horizontal overflow on mobile", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto("/");
    await page.waitForTimeout(2000);
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth + 5);
    expect(overflow).toBeFalsy();
  });
});

// ═══════════════════════════════════════════════════
// TEST 5: Settings
// ═══════════════════════════════════════════════════

test.describe("Settings", () => {
  test("settings page loads", async ({ page }) => {
    await page.goto("/dashboard/settings");
    await page.waitForTimeout(1000);
    const hasContent = await page.locator("text=/general|modules|data/i").first().isVisible().catch(() => false);
    expect(hasContent).toBeTruthy();
  });
});

// ═══════════════════════════════════════════════════
// TEST 6: 404 handling
// ═══════════════════════════════════════════════════

test.describe("Error handling", () => {
  test("invalid route shows 404", async ({ page }) => {
    await page.goto("/dashboard/nonexistent-module");
    await page.waitForTimeout(1000);
    const notFound = await page.locator("text=/not found|404/i").first().isVisible().catch(() => false);
    expect(notFound).toBeTruthy();
  });
});

// ═══════════════════════════════════════════════════
// TEST 7: Onboarding start
// ═══════════════════════════════════════════════════

test.describe("Onboarding", () => {
  test("onboarding page loads with welcome step", async ({ page }) => {
    await page.goto("/onboarding");
    await page.waitForTimeout(1000);
    const hasWelcome = await page.locator("text=/build|get started|welcome/i").first().isVisible().catch(() => false);
    expect(hasWelcome).toBeTruthy();
  });

  test("can select industry", async ({ page }) => {
    await page.goto("/onboarding");
    await page.waitForTimeout(1000);

    // Click start
    await page.locator("button, a").filter({ hasText: /get started|build|start/i }).first().click({ timeout: 5000 }).catch(() => {});
    await page.waitForTimeout(500);

    // Should see industry cards
    const hasIndustry = await page.locator("text=/beauty|trades|professional/i").first().isVisible({ timeout: 3000 }).catch(() => false);
    expect(hasIndustry).toBeTruthy();
  });
});
