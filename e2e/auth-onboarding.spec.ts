import { test, expect } from "playwright/test";

async function completeOnboardingSignup(
  page: import("playwright/test").Page,
  email: string,
  password: string,
  businessName: string,
) {
  await page.goto("/onboarding");

  await page.getByRole("button", { name: /hair stylist/i }).click();
  await page.getByRole("button", { name: /^Next$/ }).click();

  await page.getByRole("button", { name: /just me/i }).click();
  await page.getByRole("button", { name: /fixed studio or salon/i }).click();
  await page.getByRole("button", { name: /^Next$/ }).click();

  for (let i = 0; i < 4; i += 1) {
    await page.getByRole("button", { name: /skip for now/i }).click();
  }

  await expect(page.getByRole("heading", { name: /your workspace is ready/i })).toBeVisible();
  await page.getByRole("button", { name: /^Next$/ }).click();

  await page.getByPlaceholder("you@example.com").fill(email);
  await page.getByPlaceholder("Password").fill(password);
  await page.getByPlaceholder("Business name").fill(businessName);

  await page.getByRole("button", { name: /launch dashboard/i }).click();
}

test("user can complete onboarding signup and sign back in", async ({ browser }) => {
  test.setTimeout(120000);

  const email = `codex-onboarding-${Date.now()}@example.com`;
  const password = "Passw0rd123";
  const businessName = "Codex Test Studio";

  const signupContext = await browser.newContext();
  await signupContext.addCookies([
    {
      name: "magic-e2e-signup",
      value: "1",
      url: "http://localhost:3000",
    },
  ]);
  const signupPage = await signupContext.newPage();

  await completeOnboardingSignup(signupPage, email, password, businessName);

  await signupPage.waitForURL("**/dashboard", { timeout: 30000 });
  await expect(signupPage.getByText("Workspace not found")).toHaveCount(0);

  await signupContext.close();

  const loginContext = await browser.newContext();
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
