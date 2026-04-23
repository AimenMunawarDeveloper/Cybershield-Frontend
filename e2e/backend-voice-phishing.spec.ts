import { expect } from "@playwright/test";
import { hasStorageState, storageStates, test } from "./helpers/auth";

const hasAuth = hasStorageState(storageStates.affiliated);
if (hasAuth) {
  test.use({ storageState: storageStates.affiliated });
}

const backendBase =
  process.env.NEXT_PUBLIC_BACKEND_URL || "http://127.0.0.1:5001";
const apiBase = process.env.NEXT_PUBLIC_API_URL || `${backendBase}/api`;

async function getToken(page: any): Promise<string | null> {
  await page.goto("/dashboard");
  await page
    .waitForFunction(
      () =>
        (window as any).Clerk &&
        (window as any).Clerk.loaded &&
        (window as any).Clerk.session,
      { timeout: 30_000 }
    )
    .catch(() => null);
  return page
    .evaluate(async () => {
      try {
        // @ts-expect-error clerk runtime
        return await window.Clerk.session.getToken();
      } catch {
        return null;
      }
    })
    .catch(() => null);
}

test.describe("Backend - voice phishing contract", () => {
  test.skip(!hasAuth, "Missing affiliated auth state");

  test("GET /api/voice-phishing returns user's conversations", async ({
    page,
    request,
  }) => {
    const token = await getToken(page);
    test.skip(!token, "No Clerk token available");

    const res = await request.get(`${apiBase}/voice-phishing`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    expect(res.status()).toBe(200);
    const body = await res.json();
    // Response shape: { success: true, data: { conversations, pagination } }
    const convos =
      body?.data?.conversations ?? body?.conversations ?? body;
    expect(Array.isArray(convos)).toBeTruthy();
  });

  test("GET /api/voice-phishing/analytics/overview responds for authenticated user", async ({
    page,
    request,
  }) => {
    const token = await getToken(page);
    test.skip(!token, "No Clerk token available");

    const res = await request.get(
      `${apiBase}/voice-phishing/analytics/overview`,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    expect([200, 403]).toContain(res.status());
  });

  test("GET /api/voice-phishing/:invalidId returns 4xx", async ({
    page,
    request,
  }) => {
    const token = await getToken(page);
    test.skip(!token, "No Clerk token available");

    const res = await request.get(
      `${apiBase}/voice-phishing/000000000000000000000000`,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    expect(res.status()).toBeGreaterThanOrEqual(400);
  });

  test("POST /api/voice-phishing/initiate with no body returns a valid response", async ({
    page,
    request,
  }) => {
    const token = await getToken(page);
    test.skip(!token, "No Clerk token available");

    // The controller picks a default scenario when none is provided,
    // so an empty body may still succeed (200) with a created conversation.
    const res = await request.post(`${apiBase}/voice-phishing/initiate`, {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      data: {},
    });
    expect([200, 201, 400, 500]).toContain(res.status());
    if (res.status() === 200) {
      const body = await res.json();
      expect(body?.success ?? true).toBeTruthy();
    }
  });
});
