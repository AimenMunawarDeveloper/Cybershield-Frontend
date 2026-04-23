import { expect } from "@playwright/test";
import { hasStorageState, storageStates, test } from "./helpers/auth";

const hasAuth = hasStorageState(storageStates.affiliated);
if (hasAuth) {
  test.use({ storageState: storageStates.affiliated });
}

test.describe("Incident reporting - deep flows", () => {
  test.skip(!hasAuth, "Missing affiliated auth state");

  test.beforeEach(async ({ page }) => {
    await page.goto("/dashboard/incident-reporting");
    await expect(
      page.getByRole("heading", { name: /incident reporting/i })
    ).toBeVisible();
  });

  test("switches between Email and WhatsApp tabs", async ({ page }) => {
    const emailTab = page.getByRole("button", { name: /^email$/i });
    const whatsappTab = page.getByRole("button", { name: /^whatsapp$/i });

    await expect(emailTab).toBeVisible();
    await expect(whatsappTab).toBeVisible();

    await whatsappTab.click();
    await expect(page.getByText(/report a whatsapp incident/i)).toBeVisible();

    await emailTab.click();
    await expect(page.getByText(/report an email incident/i)).toBeVisible();
  });

  test("email form blocks submission via native required + custom validation", async ({
    page,
  }) => {
    const submit = page.getByRole("button", { name: /submit report/i });
    await submit.click();
    await expect(page).toHaveURL(/incident-reporting/);
    await expect(page.getByRole("button", { name: /submit report/i })).toBeVisible();
  });

  test("submits a phishing-looking email incident and sees the result toast", async ({
    page,
  }) => {
    await page.locator('textarea[placeholder*="email body" i]').first().fill(
      "URGENT: Your account has been compromised. Click http://phishy.example.com/verify to reset your password immediately or you will lose access forever."
    );
    await page.locator('input[placeholder*="subject" i]').first().fill(
      "URGENT: Account Compromised - Action Required"
    );
    await page.locator('input[placeholder*="sender email" i]').first().fill(
      "attacker@phishy.example.com"
    );

    await page.getByRole("button", { name: /submit report/i }).click();

    await expect(
      page.getByRole("heading", { name: /report submitted/i })
    ).toBeVisible({ timeout: 30_000 });
    await expect(
      page.getByText(/you['’]ve successfully reported the incident/i)
    ).toBeVisible();
    await expect(
      page.getByText(/phishing detected|not phishing/i).first()
    ).toBeVisible();
  });

  test("submits a WhatsApp incident", async ({ page }) => {
    await page.getByRole("button", { name: /^whatsapp$/i }).click();
    await page.locator('textarea[placeholder*="whatsapp" i]').first().fill(
      "Hello, you have won a prize! Visit http://scam.example.com to claim now."
    );

    await page.getByRole("button", { name: /submit report/i }).click();

    await expect(
      page.getByRole("heading", { name: /report submitted/i })
    ).toBeVisible({ timeout: 30_000 });
  });

  test("Clear Form resets email fields", async ({ page }) => {
    const message = page.locator('textarea[placeholder*="email body" i]').first();
    const subject = page.locator('input[placeholder*="subject" i]').first();
    const sender = page.locator('input[placeholder*="sender email" i]').first();

    await message.fill("some suspicious content");
    await subject.fill("Suspicious subject");
    await sender.fill("suspect@example.com");

    await page.getByRole("button", { name: /clear form/i }).click();

    await expect(message).toHaveValue("");
    await expect(subject).toHaveValue("");
    await expect(sender).toHaveValue("");
  });

  test("toggles between Report and View Reports views", async ({ page }) => {
    await page.getByRole("button", { name: /view reports/i }).click();
    await expect(
      page.getByRole("heading", { name: /incident reports/i })
    ).toBeVisible();

    await page.getByRole("button", { name: /^report$/i }).click();
    await expect(
      page.getByText(/report an email incident/i)
    ).toBeVisible();
  });
});
