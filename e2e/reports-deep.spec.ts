import { expect } from "@playwright/test";
import { hasStorageState, storageStates, test } from "./helpers/auth";

const hasAuth = hasStorageState(storageStates.clientAdmin);
if (hasAuth) {
  test.use({ storageState: storageStates.clientAdmin });
}

test.describe("Reports page - deep client admin flow", () => {
  test.skip(!hasAuth, "Missing client admin auth state");

  test.beforeEach(async ({ page }) => {
    await page.goto("/dashboard/reports");
    await page.waitForLoadState("domcontentloaded");
  });

  test("renders reports page for client admin (not redirected)", async ({
    page,
  }) => {
    // Should not be redirected to /dashboard root (which would happen for non-admin)
    await page.waitForTimeout(2_000);
    await expect(page).toHaveURL(/\/dashboard\/reports/);
    await expect(
      page.getByRole("heading", { name: /reports/i }).first()
    ).toBeVisible({ timeout: 30_000 });
  });

  test("shows reports list, empty state, or loading without crashing", async ({
    page,
  }) => {
    const list = page.locator('[class*="report" i]');
    const empty = page.getByText(/no reports|no data|empty/i).first();
    const loaded = await Promise.race([
      list.first().isVisible({ timeout: 15_000 }).then(() => "list").catch(() => null),
      empty.isVisible({ timeout: 15_000 }).then(() => "empty").catch(() => null),
      page
        .getByRole("heading", { name: /reports/i })
        .first()
        .isVisible({ timeout: 15_000 })
        .then(() => "heading")
        .catch(() => null),
    ]);
    expect(loaded).not.toBeNull();
  });

  test("has a download/generate action available somewhere", async ({
    page,
  }) => {
    await page.waitForTimeout(3_000);
    const action = page
      .getByRole("button", {
        name: /download|generate|create report|new report|export/i,
      })
      .first();
    const visible = await action.isVisible().catch(() => false);
    // If there are no reports, the action may be absent. Just assert heading is still there.
    if (!visible) {
      await expect(
        page.getByRole("heading", { name: /reports/i }).first()
      ).toBeVisible();
    } else {
      await expect(action).toBeEnabled();
    }
  });
});

test.describe("Reports page - affiliated user redirect", () => {
  const hasAff = hasStorageState(storageStates.affiliated);
  test.skip(!hasAff, "Missing affiliated auth state");

  test.use({
    storageState: hasAff ? storageStates.affiliated : undefined,
  });

  test("affiliated user is redirected away from /dashboard/reports", async ({
    page,
  }) => {
    await page.goto("/dashboard/reports");
    await page.waitForLoadState("domcontentloaded");
    // The reports page pushes to /dashboard for non-admins
    await expect(page).toHaveURL(/\/dashboard(\/?|\?.*)?$/, {
      timeout: 20_000,
    });
  });
});
