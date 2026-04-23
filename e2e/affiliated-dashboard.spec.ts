import { expect } from "@playwright/test";
import { hasStorageState, storageStates, test } from "./helpers/auth";

const hasAuth = hasStorageState(storageStates.affiliated);
if (hasAuth) {
  test.use({ storageState: storageStates.affiliated });
}

test.describe("Affiliated dashboard - deep flow", () => {
  test.skip(!hasAuth, "Missing affiliated auth state");

  test.beforeEach(async ({ page }) => {
    await page.goto("/dashboard");
    await expect(page).toHaveURL(/\/dashboard/);
    await expect(
      page.getByText(/overall learning score/i)
    ).toBeVisible({ timeout: 30_000 });
  });

  test("shows welcome message and resume-training link", async ({ page }) => {
    await expect(
      page.getByText(/welcome back|glad to see you again/i).first()
    ).toBeVisible({ timeout: 30_000 });
    await expect(
      page.getByText(/resume your training|glad to see you again/i).first()
    ).toBeVisible();
  });

  test("shows the four metric cards with labels", async ({ page }) => {
    await expect(page.getByText(/overall learning score/i)).toBeVisible();
    await expect(page.getByText(/courses completed/i).first()).toBeVisible();
    await expect(page.getByText(/certificates earned/i)).toBeVisible();
    await expect(page.getByText(/badges earned/i)).toBeVisible();
  });

  test("shows the dashboard view selector", async ({ page }) => {
    await expect(page.getByText(/dashboard view/i)).toBeVisible();
    const selector = page.locator("select").first();
    await expect(selector).toBeVisible();
    await selector.selectOption("badges-certificates");
    await selector.selectOption("all");
  });

  test("has category scores section for affiliated user", async ({ page }) => {
    await expect(
      page.getByRole("heading", { name: /category scores/i })
    ).toBeVisible({ timeout: 30_000 });
    await expect(page.getByText(/email security/i).first()).toBeVisible();
    await expect(page.getByText(/whatsapp security/i).first()).toBeVisible();
    await expect(page.getByText(/voice phishing/i).first()).toBeVisible();
  });
});
