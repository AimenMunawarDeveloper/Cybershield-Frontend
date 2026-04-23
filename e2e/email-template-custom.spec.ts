import { expect } from "@playwright/test";
import { hasStorageState, storageStates, test } from "./helpers/auth";

const hasAuth = hasStorageState(storageStates.clientAdmin);
if (hasAuth) {
  test.use({ storageState: storageStates.clientAdmin });
}

test.describe("Email template - custom creation", () => {
  test.skip(!hasAuth, "Missing client admin auth state");

  test.beforeEach(async ({ page }) => {
    await page.goto("/dashboard/email-phishing");
    await expect(page).toHaveURL(/email-phishing/);
  });

  test("opens custom template modal and validates required fields", async ({
    page,
  }) => {
    await page.getByRole("button", { name: /custom template/i }).click();

    await expect(
      page.getByText(/create a custom email phishing template/i)
    ).toBeVisible({ timeout: 15_000 });

    const saveBtn = page.getByRole("button", { name: /save template/i });
    await expect(saveBtn).toBeDisabled();

    await page.getByRole("button", { name: /cancel/i }).click();
  });

  test("fills subject + body enables Save Template button", async ({ page }) => {
    await page.getByRole("button", { name: /custom template/i }).click();
    await expect(
      page.getByText(/create a custom email phishing template/i)
    ).toBeVisible();

    await page.getByPlaceholder(/e\.g\. custom banking alert/i).fill(
      `E2E Template ${Date.now()}`
    );
    await page.getByPlaceholder(/enter email subject/i).fill(
      "E2E Phishing Subject"
    );
    await page.getByPlaceholder(/enter email body/i).fill(
      "E2E body content for phishing simulation"
    );

    const saveBtn = page.getByRole("button", { name: /save template/i });
    await expect(saveBtn).toBeEnabled();

    await page.getByRole("button", { name: /cancel/i }).click();
  });

  test("submits a new custom template end-to-end", async ({ page }) => {
    const uniqueTitle = `E2E Tpl ${Date.now()}`;

    await page.getByRole("button", { name: /custom template/i }).click();
    await page.getByPlaceholder(/e\.g\. custom banking alert/i).fill(uniqueTitle);
    await page.getByPlaceholder(/enter email subject/i).fill(
      "E2E Urgent: Verify your account"
    );
    await page.getByPlaceholder(/enter email body/i).fill(
      "Please verify your account at http://phishy.example.com right now."
    );

    const responsePromise = page
      .waitForResponse(
        (res) =>
          res.url().includes("/api/email-templates") &&
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
      page.getByText(/create a custom email phishing template/i)
    ).not.toBeVisible({ timeout: 20_000 });
  });
});
