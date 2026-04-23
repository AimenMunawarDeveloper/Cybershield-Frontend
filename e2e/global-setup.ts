import { chromium, expect, FullConfig } from "@playwright/test";
import fs from "node:fs";
import path from "node:path";

type RoleConfig = {
  name: string;
  email?: string;
  password?: string;
  storageFile: string;
};

const AUTH_DIR = path.resolve(__dirname, ".auth");

async function loginAndSaveState(
  baseURL: string,
  role: RoleConfig
): Promise<"ok" | "skipped" | "failed"> {
  if (!role.email || !role.password) {
    console.log(`[e2e] Skipping login for ${role.name} (missing credentials)`);
    return "skipped";
  }

  const browser = await chromium.launch();
  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    console.log(`[e2e] Logging in ${role.name} (${role.email})...`);
    await page.goto(`${baseURL}/sign-in`, { waitUntil: "domcontentloaded", timeout: 30_000 });

    const formButton = page.locator(
      'button.cl-formButtonPrimary, button[data-localization-key="formButtonPrimary"]'
    );

    const emailInput = page
      .locator(
        'input[name="identifier"], input[type="email"], input[name="emailAddress"]'
      )
      .first();
    await emailInput.waitFor({ state: "visible", timeout: 20_000 });
    await emailInput.fill(role.email);
    await formButton.first().click();

    const passwordInput = page
      .locator('input[name="password"], input[type="password"]')
      .first();
    await passwordInput.waitFor({ state: "visible", timeout: 20_000 });
    await expect(passwordInput).toBeEnabled({ timeout: 20_000 });
    await passwordInput.fill(role.password);
    await formButton.first().click();

    await page.waitForURL(
      (url) => !url.pathname.startsWith("/sign-in") && !url.pathname.startsWith("/sign-up"),
      { timeout: 30_000 }
    );

    await context.storageState({ path: role.storageFile });
    console.log(`[e2e] Saved auth state for ${role.name} -> ${role.storageFile}`);
    return "ok";
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.warn(`[e2e] Login failed for ${role.name}: ${msg}`);
    return "failed";
  } finally {
    await context.close().catch(() => {});
    await browser.close().catch(() => {});
  }
}

export default async function globalSetup(config: FullConfig) {
  const baseURL = (config.projects[0].use.baseURL as string) || "http://127.0.0.1:3001";
  fs.mkdirSync(AUTH_DIR, { recursive: true });

  const roles: RoleConfig[] = [
    {
      name: "system-admin",
      email: process.env.E2E_SYSTEM_ADMIN_EMAIL,
      password: process.env.E2E_SYSTEM_ADMIN_PASSWORD,
      storageFile: path.join(AUTH_DIR, "system-admin.json"),
    },
    {
      name: "client-admin",
      email: process.env.E2E_CLIENT_ADMIN_EMAIL,
      password: process.env.E2E_CLIENT_ADMIN_PASSWORD,
      storageFile: path.join(AUTH_DIR, "client-admin.json"),
    },
    {
      name: "affiliated",
      email: process.env.E2E_AFFILIATED_EMAIL,
      password: process.env.E2E_AFFILIATED_PASSWORD,
      storageFile: path.join(AUTH_DIR, "affiliated.json"),
    },
  ];

  console.log(`[e2e] Global setup starting. baseURL=${baseURL}`);
  const results: Record<string, string> = {};
  for (const role of roles) {
    results[role.name] = await loginAndSaveState(baseURL, role);
  }
  console.log(`[e2e] Global setup done. Results: ${JSON.stringify(results)}`);
}
