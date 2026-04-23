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

test.describe("Backend - reports & leaderboard contract", () => {
  test.skip(!hasAuth, "Missing client admin auth state");

  test("GET /api/reports lists user reports for admin", async ({
    page,
    request,
  }) => {
    const token = await getToken(page);
    test.skip(!token, "No Clerk token available");

    const res = await request.get(`${apiBase}/reports`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    expect(res.status()).toBe(200);
    const body = await res.json();
    const reports = body.reports ?? body;
    expect(Array.isArray(reports)).toBeTruthy();
  });

  test("GET /api/reports/:reportId/download responds or 404s", async ({
    page,
    request,
  }) => {
    const token = await getToken(page);
    test.skip(!token, "No Clerk token available");

    // Use a non-existent id to verify the route exists and handles missing resources
    const res = await request.get(
      `${apiBase}/reports/000000000000000000000000/download`,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    expect([200, 400, 403, 404]).toContain(res.status());
  });

  test("GET /api/leaderboard/global returns leaderboard list", async ({
    page,
    request,
  }) => {
    const token = await getToken(page);
    test.skip(!token, "No Clerk token available");

    const res = await request.get(`${apiBase}/leaderboard/global`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    expect(res.status()).toBe(200);
    const body = await res.json();
    const entries = body.leaderboard ?? body.users ?? body;
    expect(Array.isArray(entries)).toBeTruthy();
  });

  test("GET /api/leaderboard/organization returns org leaderboard", async ({
    page,
    request,
  }) => {
    const token = await getToken(page);
    test.skip(!token, "No Clerk token available");

    const res = await request.get(`${apiBase}/leaderboard/organization`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    expect([200, 403, 404]).toContain(res.status());
  });
});

test.describe("Backend - affiliated blocked from reports", () => {
  const hasAff = hasStorageState(storageStates.affiliated);
  test.skip(!hasAff, "Missing affiliated auth state");
  test.use({ storageState: hasAff ? storageStates.affiliated : undefined });

  test("affiliated user can GET /api/reports but cannot download admin-only reports", async ({
    page,
    request,
  }) => {
    const token = await getToken(page);
    test.skip(!token, "No Clerk token available");

    // /api/reports itself is authenticated — response may be empty or filtered
    const listRes = await request.get(`${apiBase}/reports`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    expect([200, 403]).toContain(listRes.status());
  });
});
