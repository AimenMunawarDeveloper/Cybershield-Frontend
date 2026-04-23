import { expect } from "@playwright/test";
import { hasStorageState, storageStates, test } from "./helpers/auth";

const hasAuth = hasStorageState(storageStates.affiliated);
if (hasAuth) {
  test.use({ storageState: storageStates.affiliated });
}

test.describe("Certificates page - deep flow", () => {
  test.skip(!hasAuth, "Missing affiliated auth state");

  test.beforeEach(async ({ page }) => {
    await page.goto("/dashboard/certificates");
    await page.waitForLoadState("domcontentloaded");
  });

  test("renders certificates heading", async ({ page }) => {
    await expect(
      page.getByRole("heading", { name: /certificates/i }).first()
    ).toBeVisible({ timeout: 30_000 });
  });

  test("shows certificate count or empty state", async ({ page }) => {
    await page.waitForTimeout(2_000);
    const card = page
      .locator('[class*="certificate" i], [data-testid*="certificate" i]')
      .first();
    const empty = page
      .getByText(/no certificates|you haven't earned|keep learning/i)
      .first();
    const hasCard = await card.isVisible().catch(() => false);
    const hasEmpty = await empty.isVisible().catch(() => false);
    expect(hasCard || hasEmpty).toBeTruthy();
  });

  test("clicking a certificate opens a preview modal if cards exist", async ({
    page,
  }) => {
    await page.waitForTimeout(2_000);
    const viewBtn = page
      .getByRole("button", { name: /view certificate|preview/i })
      .first();
    const visible = await viewBtn.isVisible().catch(() => false);
    test.skip(!visible, "No certificate cards to preview");

    await viewBtn.click();
    const modalContent = page
      .getByRole("dialog")
      .or(page.locator('[role="dialog"], [class*="modal" i]'))
      .first();
    await expect(modalContent).toBeVisible({ timeout: 10_000 });

    // Close modal via Escape
    await page.keyboard.press("Escape").catch(() => null);
  });
});
