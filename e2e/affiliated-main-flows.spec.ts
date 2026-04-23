import { expect } from "@playwright/test";
import { hasStorageState, storageStates, test } from "./helpers/auth";

const hasAuth = hasStorageState(storageStates.affiliated);
if (hasAuth) {
  test.use({ storageState: storageStates.affiliated });
}

test.describe("Affiliated main flows", () => {
  test.skip(!hasAuth, "Missing affiliated auth state");

  test("dashboard loads with welcome and metric cards", async ({ page }) => {
    await page.goto("/dashboard");
    await expect(page).toHaveURL(/\/dashboard/);
    await expect(
      page.getByText(/overall learning score/i)
    ).toBeVisible({ timeout: 30_000 });
    await expect(
      page.getByText(/welcome back|glad to see you again/i).first()
    ).toBeVisible({ timeout: 30_000 });
  });

  test("training modules page loads with course catalog", async ({ page }) => {
    await page.goto("/dashboard/training-modules");
    await expect(page).toHaveURL(/training-modules/);
    await expect(
      page.getByRole("heading", { name: /explore our course catalog/i })
    ).toBeVisible();
  });

  test("simulations page loads", async ({ page }) => {
    await page.goto("/dashboard/simulations");
    await expect(page).toHaveURL(/simulations/);
  });

  test("incident reporting page renders tabs and form", async ({ page }) => {
    await page.goto("/dashboard/incident-reporting");
    await expect(page).toHaveURL(/incident-reporting/);
    await expect(
      page.getByRole("heading", { name: /incident reporting/i })
    ).toBeVisible();
    await expect(page.getByRole("button", { name: /^email$/i })).toBeVisible();
    await expect(page.getByRole("button", { name: /^whatsapp$/i })).toBeVisible();
  });

  test("voice phishing page loads", async ({ page }) => {
    await page.goto("/dashboard/voice-phishing");
    await expect(page).toHaveURL(/voice-phishing/);
  });

  test("certificates page renders header", async ({ page }) => {
    await page.goto("/dashboard/certificates");
    await expect(page).toHaveURL(/certificates/);
    await expect(
      page.getByRole("heading", { name: /my certificates/i })
    ).toBeVisible();
  });

  test("leaderboards page renders tabs", async ({ page }) => {
    await page.goto("/dashboard/leaderboards");
    await expect(page).toHaveURL(/leaderboards/);
    await expect(
      page.getByRole("heading", { name: /leaderboards/i })
    ).toBeVisible();
    await expect(page.getByRole("button", { name: /^global$/i })).toBeVisible();
  });
});
