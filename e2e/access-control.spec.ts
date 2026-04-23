import { expect } from "@playwright/test";
import { hasStorageState, storageStates, test } from "./helpers/auth";

test.describe("Unauthenticated access protection", () => {
  test("protected dashboard route redirects to sign-in when unauthenticated", async ({
    browser,
  }) => {
    const ctx = await browser.newContext();
    const page = await ctx.newPage();
    await page.goto("/dashboard");
    await expect(page).toHaveURL(/sign-in/, { timeout: 30_000 });
    await ctx.close();
  });

  test("certificates page redirects to sign-in when unauthenticated", async ({
    browser,
  }) => {
    const ctx = await browser.newContext();
    const page = await ctx.newPage();
    await page.goto("/dashboard/certificates");
    await expect(page).toHaveURL(/sign-in/, { timeout: 30_000 });
    await ctx.close();
  });

  test("incident reporting page redirects to sign-in when unauthenticated", async ({
    browser,
  }) => {
    const ctx = await browser.newContext();
    const page = await ctx.newPage();
    await page.goto("/dashboard/incident-reporting");
    await expect(page).toHaveURL(/sign-in/, { timeout: 30_000 });
    await ctx.close();
  });
});

test.describe("Role-based access control - affiliated user (UI gated pages)", () => {
  const hasAuth = hasStorageState(storageStates.affiliated);
  test.skip(!hasAuth, "Missing affiliated auth state");
  test.use({ storageState: hasAuth ? storageStates.affiliated : undefined });

  test("affiliated user visiting email-phishing sees Access Restricted", async ({
    page,
  }) => {
    await page.goto("/dashboard/email-phishing");
    await page.waitForLoadState("domcontentloaded");
    await expect(
      page.getByRole("heading", { name: /access restricted/i })
    ).toBeVisible({ timeout: 60_000 });
  });

  test("affiliated user visiting whatsapp-phishing sees Access Restricted", async ({
    page,
  }) => {
    await page.goto("/dashboard/whatsapp-phishing");
    await page.waitForLoadState("domcontentloaded");
    // verifyAccess waits for Clerk + a profile API round trip, which can be slow
    await expect(
      page.getByRole("heading", { name: /access restricted/i })
    ).toBeVisible({ timeout: 60_000 });
  });

  test("affiliated user visiting simulations sees Access Restricted", async ({
    page,
  }) => {
    await page.goto("/dashboard/simulations");
    await page.waitForLoadState("domcontentloaded");
    await expect(
      page.getByRole("heading", { name: /access restricted/i })
    ).toBeVisible({ timeout: 60_000 });
  });
});

test.describe("Role-based access control - client admin (UI gated pages)", () => {
  const hasAuth = hasStorageState(storageStates.clientAdmin);
  test.skip(!hasAuth, "Missing client admin auth state");
  test.use({ storageState: hasAuth ? storageStates.clientAdmin : undefined });

  test("client admin can access organization-management", async ({ page }) => {
    await page.goto("/dashboard/organization-management");
    await expect(
      page.getByRole("heading", { name: /organization management/i })
    ).toBeVisible({ timeout: 30_000 });
  });

  test("client admin can access email-phishing (not restricted)", async ({
    page,
  }) => {
    await page.goto("/dashboard/email-phishing");
    await expect(
      page.getByRole("heading", { name: /access restricted/i })
    ).not.toBeVisible({ timeout: 10_000 });
    await expect(
      page.getByRole("heading", { name: /email phishing/i }).first()
    ).toBeVisible({ timeout: 30_000 });
  });

  test("client admin can access whatsapp-phishing (not restricted)", async ({
    page,
  }) => {
    await page.goto("/dashboard/whatsapp-phishing");
    await expect(
      page.getByRole("heading", { name: /access restricted/i })
    ).not.toBeVisible({ timeout: 10_000 });
  });
});
