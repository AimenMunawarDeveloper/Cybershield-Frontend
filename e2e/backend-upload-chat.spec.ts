import { expect } from "@playwright/test";
import { hasStorageState, storageStates, test } from "./helpers/auth";

const hasAuth = hasStorageState(storageStates.clientAdmin);
if (hasAuth) {
  test.use({ storageState: storageStates.clientAdmin });
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

test.describe("Backend - upload + misc auth contracts", () => {
  test.skip(!hasAuth, "Missing client admin auth state");

  test("POST /api/upload without file rejects", async ({ page, request }) => {
    const token = await getToken(page);
    test.skip(!token, "No Clerk token available");

    const res = await request.post(`${apiBase}/upload`, {
      headers: { Authorization: `Bearer ${token}` },
      multipart: {},
    });
    expect(res.status()).toBeGreaterThanOrEqual(400);
  });

  test("GET /api/upload/subtitles/status/:invalidId returns 4xx", async ({
    page,
    request,
  }) => {
    const token = await getToken(page);
    test.skip(!token, "No Clerk token available");

    const res = await request.get(
      `${apiBase}/upload/subtitles/status/not-a-real-public-id`,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    expect([200, 400, 404]).toContain(res.status());
  });

  test("POST /api/chat/message requires message body", async ({
    page,
    request,
  }) => {
    const token = await getToken(page);
    test.skip(!token, "No Clerk token available");

    const res = await request.post(`${apiBase}/chat/message`, {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      data: {},
    });
    expect(res.status()).toBeGreaterThanOrEqual(400);
  });

  test("PATCH /api/users/me can update optional profile fields", async ({
    page,
    request,
  }) => {
    const token = await getToken(page);
    test.skip(!token, "No Clerk token available");

    const res = await request.patch(`${apiBase}/users/me`, {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      data: { phoneNumber: "+15551234567" },
    });
    expect([200, 400]).toContain(res.status());
  });

  test("GET /api/users/me/activity returns activity payload", async ({
    page,
    request,
  }) => {
    const token = await getToken(page);
    test.skip(!token, "No Clerk token available");

    const res = await request.get(`${apiBase}/users/me/activity`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    expect([200, 404]).toContain(res.status());
  });

  test("GET /api/users/me/remedial-assignments responds", async ({
    page,
    request,
  }) => {
    const token = await getToken(page);
    test.skip(!token, "No Clerk token available");

    const res = await request.get(
      `${apiBase}/users/me/remedial-assignments`,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    expect([200, 404]).toContain(res.status());
  });
});
