import { expect } from "@playwright/test";
import { hasStorageState, storageStates, test } from "./helpers/auth";

const hasAuth = hasStorageState(storageStates.affiliated);
if (hasAuth) {
  test.use({ storageState: storageStates.affiliated });
}

test.describe("Voice phishing page", () => {
  test.skip(!hasAuth, "Missing affiliated auth state");

  test("loads voice phishing simulation heading", async ({ page }) => {
    await page.goto("/dashboard/voice-phishing");
    await expect(page).toHaveURL(/voice-phishing/);
    await expect(
      page.getByRole("heading", { name: /voice phishing simulation/i })
    ).toBeVisible({ timeout: 30_000 });
  });

  test("page is not gated by access restriction for affiliated user", async ({ page }) => {
    await page.goto("/dashboard/voice-phishing");
    await expect(
      page.getByRole("heading", { name: /access restricted/i })
    ).not.toBeVisible();
  });
});
