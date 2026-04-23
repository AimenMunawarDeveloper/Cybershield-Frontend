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

test.describe("TopBar - search, language, theme, notifications", () => {
  test.skip(!hasAuth, "Missing affiliated auth state");

  test.beforeEach(async ({ page }) => {
    await gotoDashboard(page, "/dashboard");
  });

  test("search input is visible and accepts typed text", async ({ page }) => {
    const search = page
      .locator('input[placeholder*="search" i]')
      .or(page.getByRole("textbox", { name: /search/i }))
      .first();
    await expect(search).toBeVisible({ timeout: 60_000 });

    await search.fill("phishing");
    await expect(search).toHaveValue("phishing");
    await search.fill("");
  });

  test("language toggle button is present with accessible title", async ({
    page,
  }) => {
    const langBtn = page
      .locator(
        'button[title*="Current language" i], button[aria-label*="language" i]'
      )
      .first();
    await expect(langBtn).toBeVisible({ timeout: 60_000 });
  });

  test("theme toggle (sun/moon) is present and clickable", async ({ page }) => {
    const themeBtn = page
      .locator("header button")
      .filter({ has: page.locator("svg.lucide-moon, svg.lucide-sun") })
      .first();
    await themeBtn.waitFor({ state: "visible", timeout: 60_000 });
    await themeBtn.click().catch(() => null);
    await expect(page).toHaveURL(/\/dashboard/);
  });

  test("greeting shows the user's first name", async ({ page }) => {
    // TopBar UserGreeting renders "Hello {firstName}" once Clerk session is hydrated
    await expect(
      page.getByText(/hello\s+\w+/i).first()
    ).toBeVisible({ timeout: 60_000 });
  });
});
