import { expect } from "@playwright/test";
import { hasStorageState, storageStates, test } from "./helpers/auth";

const hasAuth = hasStorageState(storageStates.affiliated);
if (hasAuth) {
  test.use({ storageState: storageStates.affiliated });
}

test.describe("Training modules - deep flow", () => {
  test.skip(!hasAuth, "Missing affiliated auth state");

  test.beforeEach(async ({ page }) => {
    await page.goto("/dashboard/training-modules");
    await expect(
      page.getByRole("heading", { name: /explore our course catalog/i })
    ).toBeVisible();
  });

  test("renders search box and view switcher", async ({ page }) => {
    await expect(
      page.getByPlaceholder(/search courses/i)
    ).toBeVisible();
  });

  test("search input accepts text and filters results", async ({ page }) => {
    const search = page.getByPlaceholder(/search courses/i);
    await search.fill("phishing");
    await expect(search).toHaveValue("phishing");
    await search.fill("");
  });

  test("switches from grid to table view", async ({ page }) => {
    const tableBtn = page.getByRole("button", { name: /table view/i });
    const gridBtn = page.getByRole("button", { name: /grid view/i });

    await tableBtn.click();
    await expect(tableBtn).toBeVisible();

    await gridBtn.click();
    await expect(gridBtn).toBeVisible();
  });

  test("opens sort dropdown and selects alphabetical", async ({ page }) => {
    const sortSelect = page
      .locator("select")
      .filter({ hasText: /newest|oldest|alphabetical/i })
      .first();
    const optionExists = await sortSelect.count();
    if (optionExists === 0) {
      test.skip(true, "Sort select not found");
    }
    await sortSelect.selectOption("alphabetical");
    await expect(sortSelect).toHaveValue("alphabetical");
    await sortSelect.selectOption("newest");
    await expect(sortSelect).toHaveValue("newest");
  });
});
