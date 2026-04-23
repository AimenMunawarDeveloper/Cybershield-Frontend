import fs from "node:fs";
import path from "node:path";
import { test as base, type Page } from "@playwright/test";

const AUTH_DIR = path.resolve(__dirname, "..", ".auth");

export const storageStates = {
  systemAdmin: path.join(AUTH_DIR, "system-admin.json"),
  clientAdmin: path.join(AUTH_DIR, "client-admin.json"),
  affiliated: path.join(AUTH_DIR, "affiliated.json"),
};

export function hasStorageState(filePath: string): boolean {
  return fs.existsSync(filePath);
}

export const test = base;

/**
 * Wait for Clerk to fully hydrate. Dashboard `<TopBar />` only renders the
 * SignedIn branch (search, language, theme, user button) once `useAuth().isLoaded`
 * is true, which depends on Clerk's loaded state.
 */
export async function waitForClerkLoaded(
  page: Page,
  timeout = 60_000
): Promise<void> {
  await page.waitForFunction(
    () => {
      const w = window as unknown as { Clerk?: { loaded?: boolean } };
      return Boolean(w.Clerk && w.Clerk.loaded);
    },
    { timeout }
  );
}

/**
 * Goto a dashboard URL and wait until Clerk is loaded so TopBar/Sidebar
 * have rendered their authenticated content.
 */
export async function gotoDashboard(
  page: Page,
  pathName: string,
  timeout = 60_000
): Promise<void> {
  await page.goto(pathName);
  await page.waitForLoadState("domcontentloaded");
  await waitForClerkLoaded(page, timeout).catch(() => {
    // best-effort — some tests may run with mocked auth
  });
}
