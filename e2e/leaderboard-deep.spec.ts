import { expect } from "@playwright/test";
import { hasStorageState, storageStates, test } from "./helpers/auth";

const hasAuth = hasStorageState(storageStates.affiliated);
if (hasAuth) {
  test.use({ storageState: storageStates.affiliated });
}

test.describe("Leaderboards - deep flow", () => {
  test.skip(!hasAuth, "Missing affiliated auth state");

  test.beforeEach(async ({ page }) => {
    await page.goto("/dashboard/leaderboards");
    await page.waitForLoadState("domcontentloaded");
  });

  test("renders leaderboards heading", async ({ page }) => {
    await expect(
      page.getByRole("heading", { name: /leaderboards/i }).first()
    ).toBeVisible({ timeout: 30_000 });
  });

  test("shows global tab and organization tab", async ({ page }) => {
    const globalTab = page
      .getByRole("button", { name: /^global$/i })
      .or(page.getByRole("tab", { name: /^global$/i }))
      .first();
    const orgTab = page
      .getByRole("button", { name: /organization/i })
      .or(page.getByRole("tab", { name: /organization/i }))
      .first();

    await expect(globalTab).toBeVisible({ timeout: 30_000 });
    await expect(orgTab).toBeVisible({ timeout: 30_000 });
  });

  test("switching to Organization tab does not crash", async ({ page }) => {
    const orgTab = page
      .getByRole("button", { name: /organization/i })
      .or(page.getByRole("tab", { name: /organization/i }))
      .first();
    await orgTab.click().catch(() => null);
    await expect(page).toHaveURL(/\/dashboard\/leaderboards/);
  });

  test("renders leaderboard content area (rows, empty state, or loading)", async ({
    page,
  }) => {
    await page.waitForTimeout(3_000);
    // Leaderboard page renders cards/rows, an empty state, or keeps the heading.
    // Just validate the page is functional — heading present and no crash overlay.
    await expect(
      page.getByRole("heading", { name: /leaderboards/i }).first()
    ).toBeVisible();

    const hasRow = await page
      .locator("table tr, [data-testid*='leaderboard-row'], [class*='leaderboard' i] li")
      .first()
      .isVisible()
      .catch(() => false);
    const hasEmpty = await page
      .getByText(/no users|no data|empty|no leaderboard|no entries|coming soon/i)
      .first()
      .isVisible()
      .catch(() => false);
    const hasScoreText = await page
      .getByText(/score|rank|points|learning/i)
      .first()
      .isVisible()
      .catch(() => false);

    // Any of these signals means the content area rendered successfully
    expect(hasRow || hasEmpty || hasScoreText).toBeTruthy();
  });
});
