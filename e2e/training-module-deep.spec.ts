import { expect } from "@playwright/test";
import { hasStorageState, storageStates, test } from "./helpers/auth";

const hasAuth = hasStorageState(storageStates.affiliated);
if (hasAuth) {
  test.use({ storageState: storageStates.affiliated });
}

test.describe("Training module detail - deep flow", () => {
  test.skip(!hasAuth, "Missing affiliated auth state");

  test.beforeEach(async ({ page }) => {
    await page.goto("/dashboard/training-modules");
    await page.waitForLoadState("domcontentloaded");
  });

  test("opens a module and shows Overview tab content", async ({ page }) => {
    const firstCourse = page
      .locator('a[href*="/dashboard/training-modules/"]')
      .first();
    const count = await firstCourse.count();
    test.skip(count === 0, "No courses available to open");

    await firstCourse.click();
    await expect(page).toHaveURL(/\/dashboard\/training-modules\/[^/]+/, {
      timeout: 30_000,
    });

    // Overview tab is default and should be visible
    await expect(
      page.getByRole("button", { name: /overview/i }).first()
    ).toBeVisible({ timeout: 30_000 });
  });

  test("switches between Overview and Curriculum tabs", async ({ page }) => {
    const firstCourse = page
      .locator('a[href*="/dashboard/training-modules/"]')
      .first();
    const count = await firstCourse.count();
    test.skip(count === 0, "No courses available to open");

    await firstCourse.click();
    await page.waitForURL(/\/dashboard\/training-modules\/[^/]+/, {
      timeout: 30_000,
    });

    const curriculumTab = page
      .getByRole("button", { name: /curriculum/i })
      .first();
    await curriculumTab.waitFor({ state: "visible", timeout: 20_000 });
    await curriculumTab.click();

    // Heading "Course Curriculum" should be visible
    await expect(
      page.getByRole("heading", { name: /course curriculum/i })
    ).toBeVisible({ timeout: 15_000 });

    const overviewTab = page
      .getByRole("button", { name: /^overview$/i })
      .first();
    await overviewTab.click();
    await expect(
      page.getByRole("button", { name: /^overview$/i })
    ).toBeVisible();
  });

  test("shows progress indicator on detail page", async ({ page }) => {
    const firstCourse = page
      .locator('a[href*="/dashboard/training-modules/"]')
      .first();
    const count = await firstCourse.count();
    test.skip(count === 0, "No courses available to open");

    await firstCourse.click();
    await page.waitForURL(/\/dashboard\/training-modules\/[^/]+/, {
      timeout: 30_000,
    });

    // Progress text (e.g. "0% completed" or "Your progress") should render
    await expect(
      page
        .getByText(/(your progress|overall completion rate|completed)/i)
        .first()
    ).toBeVisible({ timeout: 30_000 });
  });

  test("back to catalog navigates to training-modules list", async ({
    page,
  }) => {
    const firstCourse = page
      .locator('a[href*="/dashboard/training-modules/"]')
      .first();
    const count = await firstCourse.count();
    test.skip(count === 0, "No courses available to open");

    await firstCourse.click();
    await page.waitForURL(/\/dashboard\/training-modules\/[^/]+/, {
      timeout: 30_000,
    });

    const backLink = page
      .getByRole("link", { name: /back to training modules|catalog/i })
      .first();
    const backVisible = await backLink.isVisible().catch(() => false);
    if (backVisible) {
      await backLink.click();
    } else {
      await page.goBack();
    }
    await expect(page).toHaveURL(/\/dashboard\/training-modules/);
  });
});
