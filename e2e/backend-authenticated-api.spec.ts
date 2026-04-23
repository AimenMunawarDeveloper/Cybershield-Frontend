import { expect } from "@playwright/test";
import { hasStorageState, storageStates, test } from "./helpers/auth";

const hasAuth = hasStorageState(storageStates.affiliated);
if (hasAuth) {
  test.use({ storageState: storageStates.affiliated });
}

const backendBase = process.env.NEXT_PUBLIC_BACKEND_URL || "http://127.0.0.1:5001";
const apiBase = process.env.NEXT_PUBLIC_API_URL || `${backendBase}/api`;

async function getClerkToken(page: any): Promise<string | null> {
  await page.goto("/dashboard");
  await page.waitForFunction(
    () =>
      (window as any).Clerk &&
      (window as any).Clerk.loaded &&
      (window as any).Clerk.session,
    { timeout: 30_000 }
  ).catch(() => null);

  const token = await page
    .evaluate(async () => {
      try {
        // @ts-expect-error - Clerk added to window at runtime
        return await window.Clerk.session.getToken();
      } catch {
        return null;
      }
    })
    .catch(() => null);
  return token;
}

test.describe("Backend authenticated API contract", () => {
  test.skip(!hasAuth, "Missing affiliated auth state");

  test("GET /api/users/me returns the authenticated user profile", async ({
    page,
    request,
  }) => {
    const token = await getClerkToken(page);
    test.skip(!token, "No Clerk token available");

    const res = await request.get(`${apiBase}/users/me`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    expect(res.ok()).toBeTruthy();
    const body = await res.json();
    expect(body).toHaveProperty("email");
    expect(body).toHaveProperty("role");
  });

  test("GET /api/certificates lists the user's certificates", async ({
    page,
    request,
  }) => {
    const token = await getClerkToken(page);
    test.skip(!token, "No Clerk token available");

    const res = await request.get(`${apiBase}/certificates`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    expect(res.ok()).toBeTruthy();
    const body = await res.json();
    expect(Array.isArray(body.certificates)).toBeTruthy();
  });

  test("GET /api/leaderboard/global responds with leaderboard data", async ({
    page,
    request,
  }) => {
    const token = await getClerkToken(page);
    test.skip(!token, "No Clerk token available");

    const res = await request.get(`${apiBase}/leaderboard/global`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    expect([200, 201]).toContain(res.status());
    const body = await res.json();
    expect(body).toHaveProperty("leaderboard");
    expect(Array.isArray(body.leaderboard)).toBeTruthy();
  });

  test("POST /api/incidents/analyze returns is_phishing verdict for an email incident", async ({
    page,
    request,
  }) => {
    const token = await getClerkToken(page);
    test.skip(!token, "No Clerk token available");

    const res = await request.post(`${apiBase}/incidents/analyze`, {
      headers: { Authorization: `Bearer ${token}` },
      data: {
        messageType: "email",
        message:
          "URGENT: Click http://phishy.example.com to verify your account or it will be suspended.",
        subject: "URGENT: Account suspension",
        from: "attacker@phishy.example.com",
        urls: ["http://phishy.example.com"],
        date: new Date().toISOString(),
      },
    });
    expect(res.ok()).toBeTruthy();
    const body = await res.json();
    expect(body).toHaveProperty("success");
    expect(body).toHaveProperty("is_phishing");
  });

  test("GET /api/courses returns available courses", async ({ page, request }) => {
    const token = await getClerkToken(page);
    test.skip(!token, "No Clerk token available");

    const res = await request.get(`${apiBase}/courses?page=1&limit=10`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    expect(res.ok()).toBeTruthy();
    const body = await res.json();
    expect(body).toHaveProperty("courses");
  });

  test("unauthenticated /api/users/me returns 401", async ({ request }) => {
    const res = await request.get(`${apiBase}/users/me`);
    expect(res.status()).toBe(401);
  });
});
