import { test, expect, type BrowserContext } from "playwright/test";

async function stubOnboardingDependencies(context: BrowserContext) {
  await context.route("**/api/onboarding/ai-questions", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        categories: [
          {
            title: "A few more about your workflow",
            subtitle: "A couple of quick checks",
            questions: [
              { question: "Do clients often rebook with you?", module: "automations" },
              { question: "Do you track product sales too?", module: "products" },
            ],
          },
          {
            title: "Things you might find useful",
            subtitle: "Optional but relevant",
            questions: [
              { question: "Do you want revenue reporting?", module: "reporting" },
              { question: "Do clients need a self-service portal?", module: "client-portal" },
            ],
          },
        ],
      }),
    });
  });

  await context.route("**/api/onboarding/configure", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ questions: [] }),
    });
  });

  await context.route("https://nominatim.openstreetmap.org/**", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: "[]",
    });
  });
}

test("user can complete onboarding signup and sign back in", async ({ browser }) => {
  test.setTimeout(120000);

  const email = `codex-onboarding-${Date.now()}@example.com`;
  const password = "Passw0rd!123";

  const signupContext = await browser.newContext();
  await stubOnboardingDependencies(signupContext);
  const signupPage = await signupContext.newPage();

  await signupPage.goto("/onboarding");
  await signupPage.getByRole("button", { name: /Get started/i }).click();
  await signupPage.getByRole("button", { name: /Beauty & Wellness/i }).click();
  await signupPage.getByRole("button", { name: /Hair Salon \/ Hairstylist/i }).click();
  await signupPage.getByRole("button", { name: /^Continue$/ }).click();

  await signupPage.getByPlaceholder("e.g. Glow Studio").fill("Codex Test Studio");
  await signupPage.getByPlaceholder("e.g. Mobile lash technician in Brisbane").fill("Boutique hair studio in Brisbane");
  await signupPage.getByPlaceholder("Start typing your address...").fill("Brisbane QLD 4000");
  await signupPage.getByRole("button", { name: /^Continue$/ }).click();

  await signupPage.getByPlaceholder("you@example.com").fill(email);
  await signupPage.getByPlaceholder("At least 6 characters").fill(password);
  await signupPage.getByPlaceholder("Re-enter your password").fill(password);
  await signupPage.locator("label").filter({ hasText: "I agree to the" }).click();
  await signupPage.getByRole("button", { name: /^Continue$/ }).click();

  await expect(signupPage.getByText("How do clients reach you?")).toBeVisible({ timeout: 30000 });

  for (let i = 0; i < 3; i += 1) {
    await signupPage.getByRole("button", { name: /^Next$/ }).click();
  }
  await signupPage.getByRole("button", { name: "See my workspace" }).click();

  await expect(signupPage.getByText("A few more about your workflow")).toBeVisible({ timeout: 10000 });
  await signupPage.getByRole("button", { name: "Skip" }).click();

  await expect(signupPage.getByText("Let's fine-tune your workspace")).toBeVisible({ timeout: 10000 });
  await signupPage.getByRole("button", { name: "Skip — use defaults" }).click();

  await expect(signupPage.getByText("Codex Test Studio is ready")).toBeVisible({ timeout: 10000 });
  await signupPage.getByRole("button", { name: "Launch my workspace" }).click();

  await signupPage.waitForURL("**/dashboard", { timeout: 30000 });
  await expect(signupPage.getByText("Workspace not found")).toHaveCount(0);

  await signupContext.close();

  const loginContext = await browser.newContext();
  await stubOnboardingDependencies(loginContext);
  const loginPage = await loginContext.newPage();

  await loginPage.goto("/login");
  await loginPage.getByPlaceholder("sarah@business.com").fill(email);
  await loginPage.getByPlaceholder("Enter your password").fill(password);
  await loginPage.getByRole("button", { name: "Sign In" }).click();

  await loginPage.waitForURL("**/dashboard", { timeout: 30000 });
  await expect(loginPage.getByText("Workspace not found")).toHaveCount(0);

  await loginContext.close();
});

test("login page surfaces callback failures", async ({ page }) => {
  await page.goto("/login?error=auth_callback_failed");
  await expect(page.getByText("We couldn't complete sign-in. Please try again from the login page.")).toBeVisible();
});
