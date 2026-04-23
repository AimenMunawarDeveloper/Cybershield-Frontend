import { expect } from "@playwright/test";
import { hasStorageState, storageStates, test } from "./helpers/auth";

test.describe("Dashboard - affiliated analytics cards", () => {
  const hasAuth = hasStorageState(storageStates.affiliated);
  test.skip(!hasAuth, "Missing affiliated auth state");
  test.use({ storageState: hasAuth ? storageStates.affiliated : undefined });

  test.beforeEach(async ({ page }) => {
    await page.goto("/dashboard");
    await page.waitForLoadState("domcontentloaded");
    await expect(
      page.getByText(/overall learning score/i)
    ).toBeVisible({ timeout: 30_000 });
  });

  test("shows overall learning score and category scores", async ({
    page,
  }) => {
    await expect(
      page.getByText(/overall learning score/i)
    ).toBeVisible();
    await expect(
      page.getByRole("heading", { name: /category scores/i })
    ).toBeVisible({ timeout: 20_000 });
  });

  test("shows recent activity or equivalent engagement section", async ({
    page,
  }) => {
    const activity = page
      .getByRole("heading", {
        name: /recent activity|activity|engagement|timeline/i,
      })
      .first();
    const visible = await activity.isVisible({ timeout: 20_000 }).catch(() => false);
    // Section is optional; accept welcome card as a fallback
    const welcome = await page
      .getByText(/welcome|glad to see you again/i)
      .first()
      .isVisible({ timeout: 10_000 })
      .catch(() => false);
    expect(visible || welcome).toBeTruthy();
  });
});

test.describe("Dashboard - client admin analytics & metrics", () => {
  const hasAdmin = hasStorageState(storageStates.clientAdmin);
  test.skip(!hasAdmin, "Missing client admin auth state");
  test.use({ storageState: hasAdmin ? storageStates.clientAdmin : undefined });

  test("renders client-admin dashboard with org metrics", async ({ page }) => {
    await page.goto("/dashboard");
    await page.waitForLoadState("domcontentloaded");

    // Admin dashboard has metric cards like Organization Users, Active Users, Total Campaigns, Avg Learning Score
    const anyMetric = page
      .getByText(/organization users|active users|total campaigns|avg learning score/i)
      .first();
    await expect(anyMetric).toBeVisible({ timeout: 45_000 });
  });

  test("shows dashboard view selector for admin", async ({ page }) => {
    await page.goto("/dashboard");
    await page.waitForLoadState("domcontentloaded");

    const select = page
      .getByRole("combobox")
      .or(page.locator('select, [role="combobox"]'))
      .first();
    await expect(select).toBeVisible({ timeout: 30_000 });
  });

  test("has a 'Download Report' button on admin dashboard", async ({
    page,
  }) => {
    await page.goto("/dashboard");
    await page.waitForLoadState("domcontentloaded");
    const dl = page
      .getByRole("button", { name: /download report/i })
      .first();
    await expect(dl).toBeVisible({ timeout: 30_000 });
  });
});

test.describe("Dashboard - system admin", () => {
  const hasSys = hasStorageState(storageStates.systemAdmin);
  test.skip(!hasSys, "Missing system admin auth state");
  test.use({ storageState: hasSys ? storageStates.systemAdmin : undefined });

  test("system admin lands on /dashboard without redirect", async ({
    page,
  }) => {
    await page.goto("/dashboard");
    await page.waitForLoadState("domcontentloaded");
    await expect(page).toHaveURL(/\/dashboard/);
  });
});
