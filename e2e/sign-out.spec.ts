import { expect } from "@playwright/test";
import { hasStorageState, storageStates, test } from "./helpers/auth";

const hasAuth = hasStorageState(storageStates.affiliated);
if (hasAuth) {
  test.use({ storageState: storageStates.affiliated });
}

test.describe("Sign-out flow", () => {
  test.skip(!hasAuth, "Missing affiliated auth state");

  test("user can sign out and is redirected to sign-in", async ({ page }) => {
    await page.goto("/dashboard");
    await expect(page).toHaveURL(/\/dashboard/);

    const userButtonTrigger = page
      .locator(
        'button.cl-userButtonTrigger, [class*="cl-userButtonTrigger"], button[aria-label="Open user button"]'
      )
      .first();
    await userButtonTrigger.waitFor({ state: "visible", timeout: 30_000 });
    await userButtonTrigger.click();

    const signOutItem = page
      .locator(
        '.cl-userButtonPopoverActionButton__signOut, [class*="cl-userButtonPopoverActionButton__signOut"], button:has-text("Sign out")'
      )
      .first();
    await signOutItem.waitFor({ state: "visible", timeout: 15_000 });
    await signOutItem.click();

    await expect(page).toHaveURL(/sign-in|\/$/, { timeout: 30_000 });
  });
});
