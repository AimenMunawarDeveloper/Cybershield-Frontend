import { expect } from "@playwright/test";
import { hasStorageState, storageStates, test } from "./helpers/auth";

const hasAuth = hasStorageState(storageStates.affiliated);
if (hasAuth) {
  test.use({ storageState: storageStates.affiliated });
}

test.describe("Chatbot - deep flow", () => {
  test.skip(!hasAuth, "Missing affiliated auth state");

  test.beforeEach(async ({ page }) => {
    await page.goto("/dashboard");
    await page.waitForLoadState("domcontentloaded");
  });

  test("opens the chatbot panel", async ({ page }) => {
    const launcher = page.locator('button[aria-label="Open chat"]').first();
    await launcher.waitFor({ state: "visible", timeout: 30_000 });
    await launcher.click();

    const chatInput = page
      .locator('input[placeholder*="type your message" i], input[placeholder*="message" i]')
      .first();
    await expect(chatInput).toBeVisible({ timeout: 15_000 });
  });

  test("sends a message and sees it in the transcript", async ({ page }) => {
    const launcher = page.locator('button[aria-label="Open chat"]').first();
    await launcher.waitFor({ state: "visible", timeout: 30_000 });
    await launcher.click();

    const chatInput = page
      .locator('input[placeholder*="type your message" i], input[placeholder*="message" i]')
      .first();
    await chatInput.waitFor({ state: "visible", timeout: 15_000 });
    const message = `What is a phishing attack ${Date.now()}?`;
    await chatInput.fill(message);
    await chatInput.press("Enter");

    await expect(
      page.getByText(message, { exact: false }).first()
    ).toBeVisible({ timeout: 30_000 });
  });
});
