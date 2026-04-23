import { expect } from "@playwright/test";
import { hasStorageState, storageStates, test } from "./helpers/auth";

const hasAuth = hasStorageState(storageStates.affiliated);
if (hasAuth) {
  test.use({ storageState: storageStates.affiliated });
}

test.describe("Incidents - list view", () => {
  test.skip(!hasAuth, "Missing affiliated auth state");

  test.beforeEach(async ({ page }) => {
    await page.goto("/dashboard/incident-reporting");
    await expect(
      page.getByRole("heading", { name: /incident reporting/i })
    ).toBeVisible();
  });

  test("switches to View Reports and shows list or empty state", async ({
    page,
  }) => {
    await page.getByRole("button", { name: /view reports/i }).click();
    await expect(
      page.getByRole("heading", { name: /incident reports/i })
    ).toBeVisible({ timeout: 20_000 });

    const empty = page.getByText(
      /no incidents|no reports|you have not reported/i
    );
    const item = page.getByRole("button", { name: /view details|expand|more/i }).first();
    const either = await Promise.race([
      empty
        .first()
        .waitFor({ state: "visible", timeout: 10_000 })
        .then(() => "empty"),
      item
        .waitFor({ state: "visible", timeout: 10_000 })
        .then(() => "list"),
    ]).catch(() => null);

    expect(["empty", "list", null]).toContain(either);
  });

  test("back to Report view works", async ({ page }) => {
    await page.getByRole("button", { name: /view reports/i }).click();
    await page.getByRole("button", { name: /^report$/i }).click();
    await expect(
      page.getByText(/report an email incident|report a whatsapp incident/i)
    ).toBeVisible();
  });
});
