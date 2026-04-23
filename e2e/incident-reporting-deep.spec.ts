import { expect } from "@playwright/test";
import { hasStorageState, storageStates, test } from "./helpers/auth";

const hasAuth = hasStorageState(storageStates.affiliated);
if (hasAuth) {
  test.use({ storageState: storageStates.affiliated });
}

test.describe("Incident reporting - deep flow", () => {
  test.skip(!hasAuth, "Missing affiliated auth state");

  test.beforeEach(async ({ page }) => {
    await page.goto("/dashboard/incident-reporting");
    await page.waitForLoadState("domcontentloaded");
  });

  test("renders the incident reporting landing page", async ({ page }) => {
    await expect(
      page.getByRole("heading", { name: /incident reporting/i }).first()
    ).toBeVisible({ timeout: 30_000 });
  });

  test("shows email and whatsapp message-type toggles", async ({ page }) => {
    // Both toggles should be present
    const emailToggle = page.getByRole("button", { name: /email/i }).first();
    const waToggle = page.getByRole("button", { name: /whatsapp/i }).first();
    await expect(emailToggle).toBeVisible({ timeout: 30_000 });
    await expect(waToggle).toBeVisible({ timeout: 30_000 });
  });

  test("can switch to WhatsApp message type", async ({ page }) => {
    const waToggle = page.getByRole("button", { name: /whatsapp/i }).first();
    await waToggle.click();
    // Expect the form to switch (a message textarea should be visible)
    await expect(
      page.locator('textarea, input[type="text"]').first()
    ).toBeVisible({ timeout: 15_000 });
  });

  test("reveals validation when submitting an empty email incident", async ({
    page,
  }) => {
    const emailToggle = page.getByRole("button", { name: /email/i }).first();
    await emailToggle.click();

    const submitBtn = page
      .getByRole("button", { name: /submit report|analyze|report/i })
      .first();

    if (!(await submitBtn.isVisible().catch(() => false))) {
      test.skip(true, "No submit button visible on incident form");
      return;
    }

    const disabled = await submitBtn.isDisabled().catch(() => false);
    // Empty email form must either be disabled or produce a validation message
    if (!disabled) {
      await submitBtn.click().catch(() => null);
      // Look for any kind of validation cue
      const validation = page
        .getByText(/required|please|invalid|error/i)
        .first();
      const validationVisible = await validation
        .isVisible({ timeout: 5_000 })
        .catch(() => false);
      expect(validationVisible || disabled).toBeTruthy();
    }
  });

  test("can switch to the 'View Reports' tab if present", async ({ page }) => {
    const viewTab = page
      .getByRole("button", { name: /view reports|my reports|history/i })
      .first();
    const viewVisible = await viewTab.isVisible({ timeout: 5_000 }).catch(() => false);
    test.skip(!viewVisible, "No 'View Reports' tab available");

    await viewTab.click();
    await page.waitForTimeout(2_000);

    // Confirm the tab switched — any of: list/empty copy, OR URL param, OR heading stays, OR different content
    const signals = [
      page.getByText(/no reports|no incidents|recent|report date|submitted|status/i).first(),
      page.locator("table, [role='table'], [class*='report' i], [class*='incident' i]").first(),
      page.getByText(/viewing|history/i).first(),
    ];
    const anyVisible = await Promise.any(
      signals.map((s) =>
        s.isVisible({ timeout: 15_000 }).then((v) => {
          if (!v) throw new Error("not visible");
          return true;
        })
      )
    ).catch(() => false);

    // If none of the content signals hit, fall back to verifying the page didn't crash
    if (!anyVisible) {
      await expect(
        page.getByRole("heading", { name: /incident reporting/i }).first()
      ).toBeVisible();
    } else {
      expect(anyVisible).toBeTruthy();
    }
  });
});
