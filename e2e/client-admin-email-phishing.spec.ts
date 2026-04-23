import { expect } from "@playwright/test";
import { hasStorageState, storageStates, test } from "./helpers/auth";

const hasAuth = hasStorageState(storageStates.clientAdmin);
if (hasAuth) {
  test.use({ storageState: storageStates.clientAdmin });
}

test.describe("Email phishing - deep flow", () => {
  test.skip(!hasAuth, "Missing client admin auth state");

  test.beforeEach(async ({ page }) => {
    await page.goto("/dashboard/email-phishing");
    await expect(page).toHaveURL(/email-phishing/);
  });

  test("renders hero and templates section", async ({ page }) => {
    await expect(
      page.getByRole("heading", { name: /email phishing/i }).first()
    ).toBeVisible({ timeout: 30_000 });
    await expect(
      page.getByRole("heading", { name: /phishing email templates/i })
    ).toBeVisible();
  });

  test("shows 'Custom Template' button for admins", async ({ page }) => {
    await expect(
      page.getByRole("button", { name: /custom template/i })
    ).toBeVisible();
  });

  test("either renders templates or 'No templates available' notice", async ({ page }) => {
    const empty = page.getByText(/no templates available|loading templates/i);
    const useBtn = page.getByRole("button", { name: /^use$/i }).first();
    const either = await Promise.race([
      empty.first().waitFor({ state: "visible", timeout: 15_000 }).then(() => "empty"),
      useBtn.waitFor({ state: "visible", timeout: 15_000 }).then(() => "list"),
    ]).catch(() => null);

    expect(["empty", "list"]).toContain(either);
  });
});
