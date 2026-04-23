import { expect } from "@playwright/test";
import { hasStorageState, storageStates, test } from "./helpers/auth";

const hasAuth = hasStorageState(storageStates.clientAdmin);
if (hasAuth) {
  test.use({ storageState: storageStates.clientAdmin });
}

test.describe("Reports - deep flow", () => {
  test.skip(!hasAuth, "Missing client admin auth state");

  test.beforeEach(async ({ page }) => {
    await page.goto("/dashboard/reports");
    await expect(
      page.getByRole("heading", { name: /my reports/i })
    ).toBeVisible();
  });

  test("shows either empty state OR existing reports list", async ({ page }) => {
    const empty = page.getByRole("heading", { name: /no reports yet/i });
    const list = page.getByRole("button", { name: /^view$/i }).first();
    const either = await Promise.race([
      empty.waitFor({ state: "visible", timeout: 10_000 }).then(() => "empty"),
      list.waitFor({ state: "visible", timeout: 10_000 }).then(() => "list"),
    ]).catch(() => null);

    expect(["empty", "list"]).toContain(either);
  });

  test("Back to Dashboard returns to /dashboard", async ({ page }) => {
    await page.getByRole("button", { name: /back to dashboard/i }).click();
    await expect(page).toHaveURL(/\/dashboard$/);
  });

  test("opens and closes report details modal when list is non-empty", async ({ page }) => {
    const viewButtons = page.getByRole("button", { name: /^view$/i });
    const count = await viewButtons.count();
    test.skip(count === 0, "No reports available");

    await viewButtons.first().click();
    await expect(
      page.getByRole("heading", { name: /report details/i })
    ).toBeVisible();
    await page.getByRole("button", { name: /^close$/i }).click();
    await expect(
      page.getByRole("heading", { name: /report details/i })
    ).not.toBeVisible();
  });
});
