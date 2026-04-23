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

test.describe("Theme & Language toggles", () => {
  test.skip(!hasAuth, "Missing affiliated auth state");

  test("theme toggle button flips html data-theme / class", async ({ page }) => {
    await gotoDashboard(page, "/dashboard");

    const initialTheme = await page.evaluate(() => ({
      html: document.documentElement.className,
      dataTheme: document.documentElement.getAttribute("data-theme"),
    }));

    const toggleButton = page
      .locator("button")
      .filter({ has: page.locator("svg.lucide-moon, svg.lucide-sun") })
      .first();
    await toggleButton.waitFor({ state: "visible", timeout: 60_000 });
    await toggleButton.click();

    await page.waitForTimeout(500);

    const nextTheme = await page.evaluate(() => ({
      html: document.documentElement.className,
      dataTheme: document.documentElement.getAttribute("data-theme"),
    }));

    expect(JSON.stringify(initialTheme)).not.toEqual(JSON.stringify(nextTheme));
  });

  test("language toggle opens menu and switches to Urdu", async ({ page }) => {
    await gotoDashboard(page, "/dashboard");

    const langButton = page
      .locator(
        'button[title*="Current language" i], button[aria-label*="language" i]'
      )
      .first();
    await langButton.waitFor({ state: "visible", timeout: 60_000 });
    await langButton.click();

    const urduOption = page.getByRole("button", { name: /اردو/ }).first();
    await urduOption.waitFor({ state: "visible", timeout: 10_000 });
    await urduOption.click();

    await expect
      .poll(
        async () =>
          await page.evaluate(() => localStorage.getItem("app-language")),
        { timeout: 10_000 }
      )
      .toBe("ur");

    await page.reload();
    await page.waitForLoadState("domcontentloaded");

    const langButton2 = page
      .locator(
        'button[title*="Current language" i], button[aria-label*="language" i]'
      )
      .first();
    await langButton2.waitFor({ state: "visible", timeout: 60_000 });
    await langButton2.click();
    const englishOption = page
      .getByRole("button", { name: /English/i })
      .first();
    await englishOption.waitFor({ state: "visible", timeout: 10_000 });
    await englishOption.click();

    await expect
      .poll(
        async () =>
          await page.evaluate(() => localStorage.getItem("app-language")),
        { timeout: 10_000 }
      )
      .toBe("en");
  });
});
