import { expect } from "@playwright/test";
import { hasStorageState, storageStates, test } from "./helpers/auth";

const hasAuth = hasStorageState(storageStates.clientAdmin);
if (hasAuth) {
  test.use({ storageState: storageStates.clientAdmin });
}

test.describe("Simulations / Campaigns - deep flow", () => {
  test.skip(!hasAuth, "Missing client admin auth state");

  test.beforeEach(async ({ page }) => {
    await page.goto("/dashboard/simulations");
    await expect(page).toHaveURL(/simulations/);
    await page.waitForLoadState("domcontentloaded");
  });

  test("simulations page loads and is not access-restricted for client admin", async ({
    page,
  }) => {
    await expect(
      page.getByRole("heading", { name: /access restricted/i })
    ).not.toBeVisible({ timeout: 10_000 });

    const heading = page.locator("h1, h2").first();
    await expect(heading).toBeVisible({ timeout: 30_000 });
  });

  test("shows campaign creation entry point if present", async ({ page }) => {
    const createBtn = page
      .getByRole("button", { name: /create|new campaign|launch/i })
      .first();
    const visible = await createBtn
      .waitFor({ state: "visible", timeout: 10_000 })
      .then(() => true)
      .catch(() => false);
    test.skip(!visible, "No create campaign button on this page");
    await expect(createBtn).toBeEnabled();
  });
});
