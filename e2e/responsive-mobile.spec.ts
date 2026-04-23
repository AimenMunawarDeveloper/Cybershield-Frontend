import { expect } from "@playwright/test";
import { hasStorageState, storageStates, test } from "./helpers/auth";

const hasAuth = hasStorageState(storageStates.affiliated);
if (hasAuth) {
  test.use({ storageState: storageStates.affiliated });
}

test.describe("Responsive - mobile viewport smoke checks", () => {
  test.skip(!hasAuth, "Missing affiliated auth state");

  test.use({ viewport: { width: 390, height: 844 } });

  test("dashboard renders on mobile viewport", async ({ page }) => {
    await page.goto("/dashboard");
    await page.waitForLoadState("domcontentloaded");
    await expect(page).toHaveURL(/\/dashboard/);
    // Dashboard title / greeting visible
    await expect(page.getByText(/hello/i).first()).toBeVisible({
      timeout: 30_000,
    });
  });

  test("training modules list renders on mobile viewport", async ({
    page,
  }) => {
    await page.goto("/dashboard/training-modules");
    await page.waitForLoadState("domcontentloaded");
    await expect(
      page.getByRole("heading", { name: /training modules|catalog/i }).first()
    ).toBeVisible({ timeout: 30_000 });
  });

  test("certificates page renders on mobile viewport", async ({ page }) => {
    await page.goto("/dashboard/certificates");
    await page.waitForLoadState("domcontentloaded");
    await expect(
      page.getByRole("heading", { name: /certificates/i }).first()
    ).toBeVisible({ timeout: 30_000 });
  });

  test("incident reporting page renders on mobile viewport", async ({
    page,
  }) => {
    await page.goto("/dashboard/incident-reporting");
    await page.waitForLoadState("domcontentloaded");
    await expect(
      page.getByRole("heading", { name: /incident reporting/i }).first()
    ).toBeVisible({ timeout: 30_000 });
  });

  test("leaderboards page renders on mobile viewport", async ({ page }) => {
    await page.goto("/dashboard/leaderboards");
    await page.waitForLoadState("domcontentloaded");
    await expect(
      page.getByRole("heading", { name: /leaderboards/i }).first()
    ).toBeVisible({ timeout: 30_000 });
  });
});
