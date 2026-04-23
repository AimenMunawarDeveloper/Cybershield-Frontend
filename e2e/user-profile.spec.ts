import { expect, type Page } from "@playwright/test";
import {
  gotoDashboard,
  hasStorageState,
  storageStates,
  test,
  waitForClerkLoaded,
} from "./helpers/auth";

const hasAuth = hasStorageState(storageStates.affiliated);
if (hasAuth) {
  test.use({ storageState: storageStates.affiliated });
}

async function waitForClerkUserButton(page: Page) {
  // Ensure Clerk is fully loaded first so the UserButton is mounted
  await waitForClerkLoaded(page, 60_000);

  // The TopBar may render the auth-skeleton until isLoaded flips. Poll until
  // the actual UserButton mounts (the avatar inside .cl-userButtonTrigger).
  const trigger = page
    .locator(
      [
        "button.cl-userButtonTrigger",
        '[class*="cl-userButtonTrigger"]',
        ".cl-userButton-root button",
        '[class*="cl-userButton-root"] button',
        'button[aria-label*="user" i]',
        'button[aria-label*="account" i]',
        'header [class*="cl-avatarBox"]',
      ].join(", ")
    )
    .first();
  await trigger.waitFor({ state: "visible", timeout: 60_000 });
  return trigger;
}

test.describe("User profile - Clerk user button", () => {
  test.skip(!hasAuth, "Missing affiliated auth state");

  test("user avatar / button is shown in the top bar", async ({ page }) => {
    await gotoDashboard(page, "/dashboard");

    const userButton = await waitForClerkUserButton(page);
    await expect(userButton).toBeVisible();
  });

  test("clicking the user button opens Clerk menu", async ({ page }) => {
    await gotoDashboard(page, "/dashboard");

    const trigger = await waitForClerkUserButton(page);
    await trigger.click();

    const popover = page
      .locator(
        '.cl-userButtonPopoverCard, [class*="cl-userButtonPopoverCard"], [class*="cl-popoverBox"]'
      )
      .first();
    await expect(popover).toBeVisible({ timeout: 15_000 });

    const signOutItem = page
      .locator(
        '.cl-userButtonPopoverActionButton__signOut, [class*="cl-userButtonPopoverActionButton__signOut"], button:has-text("Sign out")'
      )
      .first();
    await expect(signOutItem).toBeVisible({ timeout: 10_000 });

    await page.keyboard.press("Escape");
  });
});
