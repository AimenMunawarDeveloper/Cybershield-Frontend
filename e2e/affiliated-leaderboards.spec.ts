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
    await expect(
      page.getByRole("heading", { name: /leaderboards/i })
    ).toBeVisible();
  });

  test("shows Global tab by default with Rank / Participant / Score header", async ({
    page,
  }) => {
    const globalTab = page.getByRole("button", { name: /^global$/i });
    await expect(globalTab).toBeVisible();
    await expect(page.getByText(/^rank$/i).first()).toBeVisible();
    await expect(page.getByText(/^participant$/i).first()).toBeVisible();
    await expect(page.getByText(/^score$/i).first()).toBeVisible();
  });

  test("switches to Organization tab when available for affiliated users", async ({
    page,
  }) => {
    const orgTab = page.getByRole("button", { name: /^organization$/i });
    const visible = await orgTab.isVisible().catch(() => false);
    test.skip(!visible, "User has no organization context");

    await orgTab.click();
    await expect(
      page.getByText(/organization leaderboard shows top performers/i)
    ).toBeVisible();
  });

  test("Global leaderboard shows explanatory footer", async ({ page }) => {
    await page.getByRole("button", { name: /^global$/i }).click();
    await expect(
      page.getByText(/global leaderboard shows top performers/i)
    ).toBeVisible();
  });
});
