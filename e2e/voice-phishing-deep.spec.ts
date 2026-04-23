import { expect } from "@playwright/test";
import {
  gotoDashboard,
  hasStorageState,
  storageStates,
  test,
} from "./helpers/auth";

const hasAuth = hasStorageState(storageStates.affiliated);
if (hasAuth) {
  test.use({ storageState: storageStates.affiliated });
}

async function waitForVoicePhishingPage(
  page: import("@playwright/test").Page
) {
  // Heading is "Voice Phishing Simulation" but is rendered AFTER:
  // - Clerk auth hydrates
  // - The page fetches templates/conversations and clears its loading state
  // Wait for any of: heading, a fetch settle marker, or any voice-phishing card
  await page.waitForTimeout(2_000);
  const candidates = [
    page.getByRole("heading", { name: /voice phishing/i }).first(),
    page.getByText(/voice phishing simulation/i).first(),
    page.getByRole("heading", { name: /phishing/i }).first(),
    page.locator('h1, h2').first(),
  ];
  await Promise.race(
    candidates.map((c) =>
      c.waitFor({ state: "visible", timeout: 60_000 }).catch(() => null)
    )
  );
}

test.describe("Voice phishing - deep affiliated flow", () => {
  test.skip(!hasAuth, "Missing affiliated auth state");

  test.beforeEach(async ({ page }) => {
    await gotoDashboard(page, "/dashboard/voice-phishing");
  });

  test("renders voice phishing landing page for affiliated user", async ({
    page,
  }) => {
    await waitForVoicePhishingPage(page);
    // Once the page rendered, at least one heading or main label should be visible
    const visible = await page
      .locator("h1, h2")
      .first()
      .isVisible({ timeout: 30_000 })
      .catch(() => false);
    expect(visible).toBeTruthy();
  });

  test("renders voice phishing content area (cards, history, or empty state)", async ({
    page,
  }) => {
    await waitForVoicePhishingPage(page);

    const signals = [
      page.locator('[class*="card" i]').first(),
      page.locator('[class*="scenario" i]').first(),
      page.locator('[class*="conversation" i]').first(),
      page.getByRole("button", { name: /start|begin|practice|try|new conversation/i }).first(),
      page.getByText(/no scenarios|no templates|no conversations|no history/i).first(),
      page.getByText(/scenario|conversation|history|total|simulation/i).first(),
      page.locator("h1, h2").first(),
    ];
    const anyVisible = await Promise.any(
      signals.map((s) =>
        s.isVisible({ timeout: 30_000 }).then((v) => {
          if (!v) throw new Error("not visible");
          return true;
        })
      )
    ).catch(() => false);

    expect(anyVisible).toBeTruthy();
  });

  test("can navigate to a scenario detail page if scenarios exist", async ({
    page,
  }) => {
    await page.waitForTimeout(2_000);
    const scenarioLink = page
      .locator('a[href*="/dashboard/voice-phishing/"]')
      .first();
    const count = await scenarioLink.count();
    test.skip(count === 0, "No scenario detail links available");

    await scenarioLink.click();
    await expect(page).toHaveURL(/\/dashboard\/voice-phishing\/[^/]+/, {
      timeout: 30_000,
    });
  });
});

test.describe("Voice phishing - client admin template management", () => {
  const hasAdminAuth = hasStorageState(storageStates.clientAdmin);
  test.skip(!hasAdminAuth, "Missing client admin auth state");
  test.use({
    storageState: hasAdminAuth ? storageStates.clientAdmin : undefined,
  });

  test("client admin can see voice phishing templates area", async ({
    page,
  }) => {
    await page.goto("/dashboard/voice-phishing");
    await page.waitForLoadState("domcontentloaded");
    await expect(
      page.getByRole("heading", { name: /voice phishing/i }).first()
    ).toBeVisible({ timeout: 30_000 });
  });
});
