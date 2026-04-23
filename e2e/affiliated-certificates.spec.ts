import { expect } from "@playwright/test";
import { hasStorageState, storageStates, test } from "./helpers/auth";

const hasAuth = hasStorageState(storageStates.affiliated);
if (hasAuth) {
  test.use({ storageState: storageStates.affiliated });
}

test.describe("Certificates page - deep flow", () => {
  test.skip(!hasAuth, "Missing affiliated auth state");

  test.beforeEach(async ({ page }) => {
    await page.goto("/dashboard/certificates");
    await expect(
      page.getByRole("heading", { name: /my certificates/i })
    ).toBeVisible();
  });

  test("shows 'Back to Dashboard' link and returns to /dashboard", async ({ page }) => {
    const back = page.getByRole("button", { name: /back to dashboard/i });
    await expect(back).toBeVisible();
    await back.click();
    await expect(page).toHaveURL(/\/dashboard$/);
  });

  test("renders either empty state OR a list with counts", async ({ page }) => {
    const empty = page.getByRole("heading", { name: /no certificates yet/i });
    const list = page.getByRole("button", { name: /^view$/i }).first();
    const eitherVisible = await Promise.race([
      empty.waitFor({ state: "visible", timeout: 10_000 }).then(() => "empty"),
      list.waitFor({ state: "visible", timeout: 10_000 }).then(() => "list"),
    ]).catch(() => null);

    expect(["empty", "list"]).toContain(eitherVisible);

    if (eitherVisible === "empty") {
      await expect(
        page.getByRole("button", { name: /browse courses/i })
      ).toBeVisible();
    } else {
      await expect(page.getByText(/certificates? earned/i)).toBeVisible();
    }
  });

  test("opens and closes the certificate detail modal when list is non-empty", async ({
    page,
  }) => {
    const viewButtons = page.getByRole("button", { name: /^view$/i });
    const count = await viewButtons.count();
    test.skip(count === 0, "No certificates available for this user");

    await viewButtons.first().click();
    await expect(
      page.getByRole("heading", { name: /certificate details/i })
    ).toBeVisible();
    await expect(
      page.getByRole("button", { name: /download certificate/i })
    ).toBeVisible();

    await page.getByRole("button", { name: /^close$/i }).click();
    await expect(
      page.getByRole("heading", { name: /certificate details/i })
    ).not.toBeVisible();
  });
});
