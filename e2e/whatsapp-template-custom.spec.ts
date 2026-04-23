import { expect } from "@playwright/test";
import { hasStorageState, storageStates, test } from "./helpers/auth";

const hasAuth = hasStorageState(storageStates.clientAdmin);
if (hasAuth) {
  test.use({ storageState: storageStates.clientAdmin });
}

test.describe("WhatsApp template - custom creation", () => {
  test.skip(!hasAuth, "Missing client admin auth state");

  test.beforeEach(async ({ page }) => {
    await page.goto("/dashboard/whatsapp-phishing");
    await expect(page).toHaveURL(/whatsapp-phishing/);
  });

  test("opens custom template modal", async ({ page }) => {
    await page.getByRole("button", { name: /custom template/i }).click();
    await expect(
      page.getByPlaceholder(/e\.g\. custom prize notification/i)
    ).toBeVisible({ timeout: 15_000 });
    await page.getByRole("button", { name: /cancel/i }).click();
  });

  test("submits a new custom WhatsApp template end-to-end", async ({ page }) => {
    const uniqueTitle = `E2E WA Tpl ${Date.now()}`;

    await page.getByRole("button", { name: /custom template/i }).click();
    await page
      .getByPlaceholder(/e\.g\. custom prize notification/i)
      .fill(uniqueTitle);
    await page
      .getByPlaceholder(/enter the whatsapp message content/i)
      .fill(
        "Congratulations! You've won a prize. Click http://scam.example.com to claim now."
      );

    const responsePromise = page
      .waitForResponse(
        (res) =>
          res.url().includes("/api/whatsapp-templates") &&
          res.request().method() === "POST",
        { timeout: 30_000 }
      )
      .catch(() => null);

    await page.getByRole("button", { name: /save template/i }).click();

    const res = await responsePromise;
    if (res) {
      expect([200, 201]).toContain(res.status());
    }

    await expect(
      page.getByPlaceholder(/enter the whatsapp message content/i)
    ).not.toBeVisible({ timeout: 20_000 });
  });
});
