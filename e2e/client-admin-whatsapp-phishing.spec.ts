import { expect } from "@playwright/test";
import { hasStorageState, storageStates, test } from "./helpers/auth";

const hasAuth = hasStorageState(storageStates.clientAdmin);
if (hasAuth) {
  test.use({ storageState: storageStates.clientAdmin });
}

test.describe("WhatsApp phishing - deep flow", () => {
  test.skip(!hasAuth, "Missing client admin auth state");

  test.beforeEach(async ({ page }) => {
    await page.goto("/dashboard/whatsapp-phishing");
    await expect(page).toHaveURL(/whatsapp-phishing/);
  });

  test("renders WhatsApp Phishing heading", async ({ page }) => {
    await expect(
      page.getByRole("heading", { name: /whatsapp phishing/i }).first()
    ).toBeVisible({ timeout: 30_000 });
  });

  test("is not access-restricted for client admin", async ({ page }) => {
    await expect(
      page.getByRole("heading", { name: /access restricted/i })
    ).not.toBeVisible();
  });
});
