import { expect } from "@playwright/test";
import {
  gotoDashboard,
  hasStorageState,
  storageStates,
  test,
} from "./helpers/auth";

const hasAuth = hasStorageState(storageStates.affiliated);
if (hasAuth) {
  test.use({ storageState: storageStates.affiliated });
}

async function waitForCatalog(page: import("@playwright/test").Page) {
  // The catalog renders "Explore Our Course Catalog" — but with translation it
  // can take a moment. Accept any of: that heading, a course card link, or any
  // h1/h2 heading once the page settles.
  await page.waitForTimeout(2_000);
  const heading = page
    .getByRole("heading", { name: /explore our course catalog|course catalog|courses|training/i })
    .first();
  const link = page
    .locator('a[href*="/dashboard/training-modules/"]')
    .first();
  await Promise.race([
    heading.waitFor({ state: "visible", timeout: 60_000 }).catch(() => null),
    link.waitFor({ state: "visible", timeout: 60_000 }).catch(() => null),
  ]);
}

test.describe("Training module detail - deep flow", () => {
  test.skip(!hasAuth, "Missing affiliated auth state");

  test("clicking a course opens its detail page", async ({ page }) => {
    await gotoDashboard(page, "/dashboard/training-modules");
    await waitForCatalog(page);

    const firstCourseLink = page
      .locator('a[href*="/dashboard/training-modules/"]')
      .first();
    const count = await firstCourseLink.count();
    test.skip(count === 0, "No courses available in catalog");

    await firstCourseLink.click();

    await expect(page).toHaveURL(/\/dashboard\/training-modules\/[^/]+$/);
    await page.waitForLoadState("domcontentloaded");

    const heading = page.locator("h1, h2").first();
    await expect(heading).toBeVisible({ timeout: 30_000 });
  });

  test("back navigation from course detail returns to catalog", async ({
    page,
  }) => {
    await gotoDashboard(page, "/dashboard/training-modules");
    await waitForCatalog(page);

    const firstCourseLink = page
      .locator('a[href*="/dashboard/training-modules/"]')
      .first();
    const count = await firstCourseLink.count();
    test.skip(count === 0, "No courses available");

    await firstCourseLink.click();
    await expect(page).toHaveURL(/\/dashboard\/training-modules\/[^/]+$/);

    await page.goBack();
    await expect(page).toHaveURL(/\/dashboard\/training-modules$/);
  });
});
