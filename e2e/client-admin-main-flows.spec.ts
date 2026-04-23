import { expect } from "@playwright/test";
import { hasStorageState, storageStates, test } from "./helpers/auth";

const hasAuth = hasStorageState(storageStates.clientAdmin);
if (hasAuth) {
  test.use({ storageState: storageStates.clientAdmin });
}

test.describe("Client admin main flows", () => {
  test.skip(!hasAuth, "Missing client admin auth state");

  test("dashboard loads", async ({ page }) => {
    await page.goto("/dashboard");
    await expect(page).toHaveURL(/\/dashboard/);
  });

  test("organization management page loads with invite forms", async ({ page }) => {
    await page.goto("/dashboard/organization-management");
    await expect(page).toHaveURL(/organization-management/);
    await expect(
      page.getByRole("heading", { name: /organization management/i })
    ).toBeVisible();
    await expect(
      page.getByRole("heading", { name: /invite single user/i })
    ).toBeVisible();
  });

  test("reports page renders heading", async ({ page }) => {
    await page.goto("/dashboard/reports");
    await expect(page).toHaveURL(/reports/);
    await expect(
      page.getByRole("heading", { name: /my reports/i })
    ).toBeVisible();
  });

  test("email phishing page renders templates section", async ({ page }) => {
    await page.goto("/dashboard/email-phishing");
    await expect(page).toHaveURL(/email-phishing/);
    await expect(
      page.getByRole("heading", { name: /email phishing/i }).first()
    ).toBeVisible();
  });

  test("whatsapp phishing page loads", async ({ page }) => {
    await page.goto("/dashboard/whatsapp-phishing");
    await expect(page).toHaveURL(/whatsapp-phishing/);
  });

  test("simulations page loads for client admin", async ({ page }) => {
    await page.goto("/dashboard/simulations");
    await expect(page).toHaveURL(/simulations/);
  });

  test("leaderboards shows organization tab for client admin", async ({ page }) => {
    await page.goto("/dashboard/leaderboards");
    await expect(page).toHaveURL(/leaderboards/);
    await expect(page.getByRole("button", { name: /^global$/i })).toBeVisible();
  });
});
