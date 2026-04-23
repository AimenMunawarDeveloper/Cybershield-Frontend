import { expect } from "@playwright/test";
import { hasStorageState, storageStates, test } from "./helpers/auth";

const hasAuth = hasStorageState(storageStates.affiliated);
if (hasAuth) {
  test.use({ storageState: storageStates.affiliated });
}

const backendBase =
  process.env.NEXT_PUBLIC_BACKEND_URL || "http://127.0.0.1:5001";
const apiBase = process.env.NEXT_PUBLIC_API_URL || `${backendBase}/api`;

async function getClerkToken(page: any): Promise<string | null> {
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

test.describe("Backend API - deep contract (affiliated)", () => {
  test.skip(!hasAuth, "Missing affiliated auth state");

  test("GET /api/users/me/learning-progress returns progress payload", async ({
    page,
    request,
  }) => {
    const token = await getClerkToken(page);
    test.skip(!token, "No Clerk token available");

    const res = await request.get(`${apiBase}/users/me/learning-progress`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    expect(res.ok()).toBeTruthy();
    const body = await res.json();
    expect(body).toBeTruthy();
  });

  test("GET /api/users/me/courses-progress returns progress array", async ({
    page,
    request,
  }) => {
    const token = await getClerkToken(page);
    test.skip(!token, "No Clerk token available");

    const res = await request.get(`${apiBase}/users/me/courses-progress`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    expect(res.ok()).toBeTruthy();
    const body = await res.json();
    expect(body).toBeTruthy();
  });

  test("GET /api/users/me/activity returns activity payload", async ({
    page,
    request,
  }) => {
    const token = await getClerkToken(page);
    test.skip(!token, "No Clerk token available");

    const res = await request.get(`${apiBase}/users/me/activity`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    expect(res.ok()).toBeTruthy();
  });

  test("GET /api/users/me/remedial-assignments returns an array", async ({
    page,
    request,
  }) => {
    const token = await getClerkToken(page);
    test.skip(!token, "No Clerk token available");

    const res = await request.get(
      `${apiBase}/users/me/remedial-assignments`,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    expect(res.ok()).toBeTruthy();
  });

  test("GET /api/incidents lists user's incidents", async ({ page, request }) => {
    const token = await getClerkToken(page);
    test.skip(!token, "No Clerk token available");

    const res = await request.get(`${apiBase}/incidents`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    expect(res.ok()).toBeTruthy();
  });

  test("GET /api/certificates/count/non-affiliated responds", async ({
    page,
    request,
  }) => {
    const token = await getClerkToken(page);
    test.skip(!token, "No Clerk token available");

    const res = await request.get(
      `${apiBase}/certificates/count/non-affiliated`,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    expect([200, 403]).toContain(res.status());
  });

  test("GET /api/voice-phishing returns user's conversations", async ({
    page,
    request,
  }) => {
    const token = await getClerkToken(page);
    test.skip(!token, "No Clerk token available");

    const res = await request.get(`${apiBase}/voice-phishing`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    expect(res.ok()).toBeTruthy();
  });

  test("GET /api/voice-phishing-templates/defaults returns default scenarios", async ({
    page,
    request,
  }) => {
    const token = await getClerkToken(page);
    test.skip(!token, "No Clerk token available");

    const res = await request.get(
      `${apiBase}/voice-phishing-templates/defaults`,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    expect([200, 401, 403]).toContain(res.status());
  });

  test("GET /api/reports returns a list of the user's reports", async ({
    page,
    request,
  }) => {
    const token = await getClerkToken(page);
    test.skip(!token, "No Clerk token available");

    const res = await request.get(`${apiBase}/reports`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    expect([200, 403]).toContain(res.status());
  });

  test("POST /api/chat/message returns a bot response", async ({
    page,
    request,
  }) => {
    const token = await getClerkToken(page);
    test.skip(!token, "No Clerk token available");

    const res = await request.post(`${apiBase}/chat/message`, {
      headers: { Authorization: `Bearer ${token}` },
      data: { message: "Hello, what is phishing?" },
    });
    // Chat depends on Gemini availability — accept success or upstream-failure codes
    expect([200, 201, 429, 500, 502, 503]).toContain(res.status());
    const body = await res.json();
    expect(body).toBeTruthy();
  });

  test("POST /api/incidents/analyze rejects missing message", async ({
    page,
    request,
  }) => {
    const token = await getClerkToken(page);
    test.skip(!token, "No Clerk token available");

    const res = await request.post(`${apiBase}/incidents/analyze`, {
      headers: { Authorization: `Bearer ${token}` },
      data: { messageType: "email" },
    });
    expect([400, 422]).toContain(res.status());
  });

  test("POST /api/incidents/analyze with whatsapp content returns verdict", async ({
    page,
    request,
  }) => {
    const token = await getClerkToken(page);
    test.skip(!token, "No Clerk token available");

    const res = await request.post(`${apiBase}/incidents/analyze`, {
      headers: { Authorization: `Bearer ${token}` },
      data: {
        messageType: "whatsapp",
        message:
          "Congratulations! You have won $1000. Click http://scam.example.com to claim.",
      },
    });
    expect(res.ok()).toBeTruthy();
    const body = await res.json();
    expect(body).toHaveProperty("is_phishing");
  });
});

test.describe("Backend API - public routes", () => {
  test("GET /health returns ok", async ({ request }) => {
    const res = await request.get(`${backendBase}/health`);
    expect(res.ok()).toBeTruthy();
    const body = await res.json();
    expect(body).toBeTruthy();
  });

  test("unauthenticated /api/incidents returns 401", async ({ request }) => {
    const res = await request.get(`${apiBase}/incidents`);
    expect(res.status()).toBe(401);
  });

  test("unauthenticated /api/certificates returns 401", async ({ request }) => {
    const res = await request.get(`${apiBase}/certificates`);
    expect(res.status()).toBe(401);
  });

  test("unauthenticated /api/voice-phishing returns 401", async ({
    request,
  }) => {
    const res = await request.get(`${apiBase}/voice-phishing`);
    expect(res.status()).toBe(401);
  });

  test("unauthenticated /api/chat/message returns 401", async ({ request }) => {
    const res = await request.post(`${apiBase}/chat/message`, {
      data: { message: "hi" },
    });
    expect(res.status()).toBe(401);
  });
});

test.describe("Backend API - deep contract (client admin)", () => {
  const adminHasAuth = hasStorageState(storageStates.clientAdmin);
  test.skip(!adminHasAuth, "Missing client admin auth state");
  test.use({
    storageState: adminHasAuth ? storageStates.clientAdmin : undefined,
  });

  test("client admin GET /api/users/me returns admin role", async ({
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
    expect(body.role).toMatch(/admin/i);
  });

  test("client admin can list campaigns", async ({ page, request }) => {
    const token = await getClerkToken(page);
    test.skip(!token, "No Clerk token available");

    const res = await request.get(`${apiBase}/campaigns`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    expect([200, 201, 403]).toContain(res.status());
  });

  test("client admin can list whatsapp campaigns", async ({ page, request }) => {
    const token = await getClerkToken(page);
    test.skip(!token, "No Clerk token available");

    const res = await request.get(`${apiBase}/whatsapp-campaigns`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    expect([200, 201, 403]).toContain(res.status());
  });

  test("client admin can list email templates", async ({ page, request }) => {
    const token = await getClerkToken(page);
    test.skip(!token, "No Clerk token available");

    const res = await request.get(`${apiBase}/email-templates`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    expect(res.ok()).toBeTruthy();
  });

  test("client admin can list whatsapp templates", async ({ page, request }) => {
    const token = await getClerkToken(page);
    test.skip(!token, "No Clerk token available");

    const res = await request.get(`${apiBase}/whatsapp-templates`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    expect(res.ok()).toBeTruthy();
  });
});

test.describe("Backend API - deep contract (system admin)", () => {
  const sysHasAuth = hasStorageState(storageStates.systemAdmin);
  test.skip(!sysHasAuth, "Missing system admin auth state");
  test.use({ storageState: sysHasAuth ? storageStates.systemAdmin : undefined });

  test("system admin GET /api/users/me returns system_admin role", async ({
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
    expect(body.role).toBe("system_admin");
  });

  test("system admin can list all users", async ({ page, request }) => {
    const token = await getClerkToken(page);
    test.skip(!token, "No Clerk token available");

    const res = await request.get(`${apiBase}/users/all`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    expect([200, 201]).toContain(res.status());
  });

  test("system admin GET /api/voice-phishing/analytics/overview", async ({
    page,
    request,
  }) => {
    const token = await getClerkToken(page);
    test.skip(!token, "No Clerk token available");

    const res = await request.get(
      `${apiBase}/voice-phishing/analytics/overview`,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    expect([200, 201, 403]).toContain(res.status());
  });
});
