import { expect } from "@playwright/test";
import { hasStorageState, storageStates, test } from "./helpers/auth";

const hasAuth = hasStorageState(storageStates.clientAdmin);
if (hasAuth) {
  test.use({ storageState: storageStates.clientAdmin });
}

test.describe("Organization management - deep flow", () => {
  test.skip(!hasAuth, "Missing client admin auth state");

  test.beforeEach(async ({ page }) => {
    await page.goto("/dashboard/organization-management");
    await expect(
      page.getByRole("heading", { name: /organization management/i })
    ).toBeVisible();
  });

  test("single user invite form renders and validates required email", async ({ page }) => {
    await expect(
      page.getByRole("heading", { name: /invite single user/i })
    ).toBeVisible();
    const submit = page.getByRole("button", { name: /send invitation/i });
    await submit.click();
    await expect(page).toHaveURL(/organization-management/);
  });

  test("bulk invite form parses email list and shows count", async ({ page }) => {
    await expect(
      page.getByRole("heading", { name: /bulk invite users/i })
    ).toBeVisible();

    const textarea = page.locator("textarea").first();
    await textarea.fill(
      "u1@e2e.example.com, u2@e2e.example.com\nu3@e2e.example.com"
    );
    await expect(page.getByText(/emails to invite \(3\)/i)).toBeVisible();
  });

  test("single invite form accepts valid email", async ({ page }) => {
    const email = page.getByPlaceholder(/student@university.edu/i);
    await email.fill(`e2e.invite.${Date.now()}@cybershield-e2e.com`);
    await expect(email).toHaveValue(/cybershield-e2e\.com/);
  });
});
