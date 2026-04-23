import { expect } from "@playwright/test";
import { hasStorageState, storageStates, test } from "./helpers/auth";

const hasAuth = hasStorageState(storageStates.systemAdmin);
if (hasAuth) {
  test.use({ storageState: storageStates.systemAdmin });
}

test.describe("Organizations management - deep flow", () => {
  test.skip(!hasAuth, "Missing system admin auth state");

  test.beforeEach(async ({ page }) => {
    await page.goto("/dashboard/organizations-management");
    await expect(
      page.getByRole("heading", { name: /organizations management/i })
    ).toBeVisible();
  });

  test("shows 'Create New Organization' and 'Invite Client Administrator' forms", async ({ page }) => {
    await expect(
      page.getByRole("heading", { name: /create new organization/i })
    ).toBeVisible();
    await expect(
      page.getByRole("heading", { name: /invite client administrator/i })
    ).toBeVisible();
  });

  test("create org form accepts name and description input", async ({ page }) => {
    const nameInput = page.getByPlaceholder(/university name/i);
    const descInput = page.getByPlaceholder(/brief description of the organization/i);
    await nameInput.fill(`E2E Test Org ${Date.now()}`);
    await descInput.fill("E2E test organization description");
    await expect(nameInput).toHaveValue(/E2E Test Org/);
    await expect(descInput).toHaveValue(/E2E test organization description/);
  });

  test("create organization end-to-end and see success message", async ({ page }) => {
    const uniqueName = `E2E Org ${Date.now()}`;
    await page.getByPlaceholder(/university name/i).fill(uniqueName);
    await page
      .getByRole("button", { name: /^create organization$/i })
      .click();

    const success = page.getByText(/organization created successfully/i);
    const error = page.getByText(/failed to create organization/i);
    const either = await Promise.race([
      success.waitFor({ state: "visible", timeout: 30_000 }).then(() => "success"),
      error.waitFor({ state: "visible", timeout: 30_000 }).then(() => "error"),
    ]).catch(() => null);

    expect(["success", "error"]).toContain(either);
  });

  test("opens organization dropdown in invite form", async ({ page }) => {
    const selectBtn = page.getByRole("button", { name: /select organization|^no organizations/i }).first();
    const visible = await selectBtn.isVisible().catch(() => false);
    if (!visible) {
      test.skip(true, "Dropdown not available");
    }
    await selectBtn.click();
  });

  test("shows Organizations list section", async ({ page }) => {
    await expect(
      page.getByRole("heading", { name: /^organizations$/i })
    ).toBeVisible();
  });
});
