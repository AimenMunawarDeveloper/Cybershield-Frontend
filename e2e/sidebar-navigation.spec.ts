import { expect } from "@playwright/test";
import { hasStorageState, storageStates, test } from "./helpers/auth";

test.describe("Sidebar navigation - affiliated", () => {
  const hasAuth = hasStorageState(storageStates.affiliated);
  test.skip(!hasAuth, "Missing affiliated auth state");

  test.use({ storageState: hasAuth ? storageStates.affiliated : undefined });

  test("navigates through all affiliated-visible sidebar links", async ({
    page,
  }) => {
    await page.goto("/dashboard");
    await expect(page).toHaveURL(/\/dashboard/);

    const links: Array<{ label: RegExp; url: RegExp }> = [
      { label: /training modules/i, url: /training-modules/ },
      { label: /voice phishing/i, url: /voice-phishing/ },
      { label: /certificates/i, url: /certificates/ },
      { label: /leaderboards/i, url: /leaderboards/ },
      { label: /incident reporting/i, url: /incident-reporting/ },
    ];

    for (const link of links) {
      await page.goto("/dashboard");
      const item = page.getByRole("link", { name: link.label }).first();
      await item.waitFor({ state: "visible", timeout: 20_000 });
      await item.click();
      await expect(page).toHaveURL(link.url);
    }
  });

  test("admin-only links are not visible to affiliated user", async ({
    page,
  }) => {
    await page.goto("/dashboard");
    await page.waitForLoadState("networkidle");

    const hiddenLabels = [
      /^campaigns(\s+\d+)?$/i,
      /whatsapp phishing/i,
      /email phishing/i,
      /^reports$/i,
    ];

    for (const label of hiddenLabels) {
      const count = await page
        .getByRole("link", { name: label })
        .count();
      expect(count).toBe(0);
    }
  });
});

test.describe("Sidebar navigation - client admin", () => {
  const hasAuth = hasStorageState(storageStates.clientAdmin);
  test.skip(!hasAuth, "Missing client admin auth state");

  test.use({ storageState: hasAuth ? storageStates.clientAdmin : undefined });

  async function waitForAdminSidebar(page: any) {
    await page.goto("/dashboard");
    await page.waitForLoadState("domcontentloaded");
    // Ensure Clerk is loaded client-side before the sidebar fetches the profile
    await page
      .waitForFunction(
        () => {
          const clerk = (window as unknown as { Clerk?: { loaded?: boolean } })
            .Clerk;
          return Boolean(clerk && clerk.loaded);
        },
        { timeout: 60_000 }
      )
      .catch(() => null);
    // Wait for any one admin-only link to actually appear. The sidebar reveals
    // admin links only after /api/users/me resolves with an admin role.
    await page
      .getByRole("link", { name: /email phishing/i })
      .first()
      .waitFor({ state: "visible", timeout: 60_000 });
  }

  test("client admin sees admin-only sidebar links", async ({ page }) => {
    await waitForAdminSidebar(page);

    const adminLabels = [
      // Campaigns link has a badge count in its accessible name (e.g. "Campaigns 0")
      /^campaigns(\s+\d+)?$/i,
      /whatsapp phishing/i,
      /email phishing/i,
      /^reports$/i,
    ];

    for (const label of adminLabels) {
      const first = page.getByRole("link", { name: label }).first();
      await expect(first).toBeVisible({ timeout: 20_000 });
    }
  });

  test("navigates through client-admin-specific sidebar links", async ({
    page,
  }) => {
    const links: Array<{ label: RegExp; url: RegExp }> = [
      { label: /email phishing/i, url: /email-phishing/ },
      { label: /whatsapp phishing/i, url: /whatsapp-phishing/ },
      { label: /^campaigns(\s+\d+)?$/i, url: /simulations/ },
      { label: /^reports$/i, url: /\/dashboard\/reports/ },
    ];

    for (const link of links) {
      await waitForAdminSidebar(page);
      const item = page.getByRole("link", { name: link.label }).first();
      await item.waitFor({ state: "visible", timeout: 20_000 });
      await item.click();
      await expect(page).toHaveURL(link.url);
    }
  });
});

test.describe("Sidebar navigation - system admin", () => {
  const hasAuth = hasStorageState(storageStates.systemAdmin);
  test.skip(!hasAuth, "Missing system admin auth state");

  test.use({ storageState: hasAuth ? storageStates.systemAdmin : undefined });

  test("system admin can access organizations management", async ({ page }) => {
    await page.goto("/dashboard");
    await page.waitForLoadState("networkidle");

    const orgsLink = page
      .getByRole("link", { name: /organizations management/i })
      .first();
    const visible = await orgsLink.isVisible().catch(() => false);
    if (!visible) {
      await page.goto("/dashboard/organizations-management");
    } else {
      await orgsLink.click();
    }
    await expect(page).toHaveURL(/organizations-management/);
    await expect(
      page.getByRole("heading", { name: /organizations management/i })
    ).toBeVisible();
  });
});
