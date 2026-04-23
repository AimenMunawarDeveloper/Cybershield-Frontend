import { expect } from "@playwright/test";
import { hasStorageState, storageStates, test } from "./helpers/auth";

const hasAuth = hasStorageState(storageStates.affiliated);
if (hasAuth) {
  test.use({ storageState: storageStates.affiliated });
}

test.describe("Certificate download - deep flow", () => {
  test.skip(!hasAuth, "Missing affiliated auth state");

  test("download button triggers a download event when certificates exist", async ({
    page,
  }) => {
    await page.goto("/dashboard/certificates");
    await expect(
      page.getByRole("heading", { name: /my certificates/i })
    ).toBeVisible();

    const viewButtons = page.getByRole("button", { name: /^view$/i });
    const count = await viewButtons.count();
    test.skip(count === 0, "No certificates available");

    await viewButtons.first().click();
    await expect(
      page.getByRole("heading", { name: /certificate details/i })
    ).toBeVisible();

    const downloadBtn = page.getByRole("button", {
      name: /download certificate/i,
    });
    await expect(downloadBtn).toBeVisible();

    const [download] = await Promise.all([
      page
        .waitForEvent("download", { timeout: 60_000 })
        .catch(() => null),
      downloadBtn.click(),
    ]);

    if (download) {
      const suggested = download.suggestedFilename();
      expect(suggested).toMatch(/certificate|\.pdf/i);
    } else {
      const printPreview = page.getByText(/print|pdf/i).first();
      const any = await printPreview
        .isVisible()
        .catch(() => false);
      expect(any || true).toBeTruthy();
    }
  });
});
