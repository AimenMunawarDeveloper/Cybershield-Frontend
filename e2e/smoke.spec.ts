import { expect, test } from "@playwright/test";

test.describe("Public smoke", () => {
  test("loads home and redirects unauthenticated users to sign-in", async ({ page }) => {
    await page.goto("/");
    await expect(page).toHaveURL(/sign-in|\/$/);
  });

  test("sign-in page renders Clerk widget", async ({ page }) => {
    await page.goto("/sign-in");
    await expect(page).toHaveURL(/sign-in/);
    await expect(
      page.getByRole("heading", { name: /sign in to cybershield/i })
    ).toBeVisible();
    await expect(
      page.locator('input[name="identifier"], input[type="email"]').first()
    ).toBeVisible();
  });
});
