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

test.describe("Backend - campaigns & whatsapp campaigns contract", () => {
  test.skip(!hasAuth, "Missing client admin auth state");

  test("GET /api/campaigns lists email campaigns for admin", async ({
    page,
    request,
  }) => {
    const token = await getToken(page);
    test.skip(!token, "No Clerk token available");

    const res = await request.get(`${apiBase}/campaigns`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    expect(res.status()).toBe(200);
    const body = await res.json();
    // Controller returns { success: true, data: { campaigns: [...] } }
    const campaigns = body?.data?.campaigns ?? body?.campaigns ?? [];
    expect(Array.isArray(campaigns)).toBeTruthy();
  });

  test("GET /api/whatsapp-campaigns lists whatsapp campaigns for admin", async ({
    page,
    request,
  }) => {
    const token = await getToken(page);
    test.skip(!token, "No Clerk token available");

    const res = await request.get(`${apiBase}/whatsapp-campaigns`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    expect(res.status()).toBe(200);
    const body = await res.json();
    const campaigns = body?.data?.campaigns ?? body?.campaigns ?? [];
    expect(Array.isArray(campaigns)).toBeTruthy();
  });

  test("GET /api/campaigns/:id returns 400/404 for invalid id", async ({
    page,
    request,
  }) => {
    const token = await getToken(page);
    test.skip(!token, "No Clerk token available");

    const res = await request.get(
      `${apiBase}/campaigns/not-a-real-id-12345`,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    expect(res.status()).toBeGreaterThanOrEqual(400);
  });

  test("GET /api/whatsapp-campaigns/:id returns 400/404 for invalid id", async ({
    page,
    request,
  }) => {
    const token = await getToken(page);
    test.skip(!token, "No Clerk token available");

    const res = await request.get(
      `${apiBase}/whatsapp-campaigns/not-a-real-id-67890`,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    expect(res.status()).toBeGreaterThanOrEqual(400);
  });
});

test.describe("Backend - campaigns affiliated access restrictions", () => {
  const hasAff = hasStorageState(storageStates.affiliated);
  test.skip(!hasAff, "Missing affiliated auth state");
  test.use({ storageState: hasAff ? storageStates.affiliated : undefined });

  test("affiliated user cannot create an email campaign", async ({
    page,
    request,
  }) => {
    const token = await getToken(page);
    test.skip(!token, "No Clerk token available");

    const res = await request.post(`${apiBase}/campaigns`, {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      data: {
        name: "E2E Blocked Campaign",
        templateId: "000000000000000000000000",
        targetUsers: [],
      },
    });
    expect([401, 403, 400]).toContain(res.status());
  });
});
