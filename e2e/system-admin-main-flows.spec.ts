import { expect } from "@playwright/test";
import { hasStorageState, storageStates, test } from "./helpers/auth";

const hasAuth = hasStorageState(storageStates.systemAdmin);
if (hasAuth) {
  test.use({ storageState: storageStates.systemAdmin });
}

test.describe("System admin main flows", () => {
  test.skip(!hasAuth, "Missing system admin auth state");

  test("dashboard loads with system admin view selector", async ({ page }) => {
    await page.goto("/dashboard");
    await expect(page).toHaveURL(/\/dashboard/);
  });

  test("organizations management page renders create + invite forms", async ({ page }) => {
    await page.goto("/dashboard/organizations-management");
    await expect(page).toHaveURL(/organizations-management/);
    await expect(
      page.getByRole("heading", { name: /invite client administrator/i })
    ).toBeVisible();
  });

  test("leaderboards page renders for system admin (global only)", async ({ page }) => {
    await page.goto("/dashboard/leaderboards");
    await expect(page).toHaveURL(/leaderboards/);
    await expect(page.getByRole("button", { name: /^global$/i })).toBeVisible();
  });

  test("training modules page loads for system admin", async ({ page }) => {
    await page.goto("/dashboard/training-modules");
    await expect(page).toHaveURL(/training-modules/);
  });

  test("reports page renders for system admin", async ({ page }) => {
    await page.goto("/dashboard/reports");
    await expect(page).toHaveURL(/reports/);
  });
});
