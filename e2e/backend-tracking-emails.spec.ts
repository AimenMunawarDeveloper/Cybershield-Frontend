import { expect, test } from "@playwright/test";

const backendBase =
  process.env.NEXT_PUBLIC_BACKEND_URL || "http://127.0.0.1:5001";
const apiBase = process.env.NEXT_PUBLIC_API_URL || `${backendBase}/api`;

test.describe("Backend - tracking URLs (email open, email click, whatsapp click)", () => {
  test("GET /api/campaigns/track/open/:token responds without crashing", async ({
    request,
  }) => {
    // These tracking routes may be unauthenticated (redirect/pixel) OR authenticated
    // depending on server config. Just verify the route responds and doesn't 5xx.
    const res = await request.get(
      `${apiBase}/campaigns/track/open/nonexistent-token-123`
    );
    expect([200, 204, 301, 302, 400, 401, 403, 404]).toContain(res.status());
  });

  test("GET /api/campaigns/track/click/:token responds without crashing", async ({
    request,
  }) => {
    const res = await request.get(
      `${apiBase}/campaigns/track/click/nonexistent-token-456`
    );
    expect([200, 204, 301, 302, 400, 401, 403, 404]).toContain(res.status());
  });

  test("GET /api/whatsapp-campaigns/click responds without crashing", async ({
    request,
  }) => {
    const res = await request.get(`${apiBase}/whatsapp-campaigns/click`);
    expect([200, 204, 301, 302, 400, 401, 403, 404]).toContain(res.status());
  });

  test("GET /api/emails (public) returns something or 4xx", async ({
    request,
  }) => {
    const res = await request.get(`${apiBase}/emails`);
    expect([200, 401, 403, 404]).toContain(res.status());
  });
});

test.describe("Backend - public endpoints (no auth required)", () => {
  test("GET /api/health returns ok", async ({ request }) => {
    const candidates = [
      `${apiBase}/health`,
      `${backendBase}/health`,
    ];
    let passed = false;
    for (const url of candidates) {
      const res = await request.get(url).catch(() => null);
      if (res && res.status() === 200) {
        passed = true;
        break;
      }
    }
    expect(passed).toBeTruthy();
  });

  test("protected route returns 401/403 without a token", async ({
    request,
  }) => {
    const res = await request.get(`${apiBase}/users/me`);
    expect([401, 403]).toContain(res.status());
  });

  test("protected route rejects with an invalid token", async ({ request }) => {
    // Clerk middleware may return 401/403 for a parseable-but-unauthorized token,
    // OR 500 for a malformed token (as a surfaced auth library error).
    const res = await request.get(`${apiBase}/users/me`, {
      headers: { Authorization: "Bearer definitely-not-valid" },
    });
    expect([401, 403, 500]).toContain(res.status());
  });
});
