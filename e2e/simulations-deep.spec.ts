import { expect } from "@playwright/test";
import { hasStorageState, storageStates, test } from "./helpers/auth";

const hasAuth = hasStorageState(storageStates.clientAdmin);
if (hasAuth) {
  test.use({ storageState: storageStates.clientAdmin });
}

test.describe("Simulations (Campaigns) - deep client admin flow", () => {
  test.skip(!hasAuth, "Missing client admin auth state");

  test.beforeEach(async ({ page }) => {
    await page.goto("/dashboard/simulations");
    await page.waitForLoadState("domcontentloaded");
  });

  test("renders simulations page heading for client admin", async ({
    page,
  }) => {
    await expect(
      page.getByRole("heading", { name: /campaigns|simulations/i }).first()
    ).toBeVisible({ timeout: 45_000 });
  });

  test("shows campaigns list area (either with campaigns or empty state)", async ({
    page,
  }) => {
    await page.waitForTimeout(3_000);
    const hasList = await page
      .locator('[data-testid*="campaign" i], [class*="campaign" i]')
      .first()
      .isVisible()
      .catch(() => false);
    const hasEmpty = await page
      .getByText(/no campaigns|create your first|empty/i)
      .first()
      .isVisible()
      .catch(() => false);
    expect(hasList || hasEmpty).toBeTruthy();
  });

  test("exposes a create campaign entry point", async ({ page }) => {
    await page.waitForTimeout(3_000);
    const createBtn = page
      .getByRole("button", { name: /create|new campaign|\+/i })
      .first();
    const visible = await createBtn.isVisible().catch(() => false);
    // Campaign creation action must be discoverable for admins
    expect(visible).toBeTruthy();
  });

  test("opens the create campaign modal if available", async ({ page }) => {
    await page.waitForTimeout(3_000);
    const createBtn = page
      .getByRole("button", { name: /create.*campaign|new campaign/i })
      .first();
    const visible = await createBtn.isVisible().catch(() => false);
    test.skip(!visible, "No create campaign button on page");

    await createBtn.click();
    // Modal / dialog should open with any input or heading
    const modalHeading = page
      .getByRole("heading", { name: /create|new|campaign/i })
      .first();
    const input = page.locator('input, textarea').first();
    const modalVisible = await Promise.race([
      modalHeading.isVisible({ timeout: 10_000 }).catch(() => false),
      input.isVisible({ timeout: 10_000 }).catch(() => false),
    ]);
    expect(modalVisible).toBeTruthy();

    // Close via Escape for test isolation
    await page.keyboard.press("Escape");
  });
});
