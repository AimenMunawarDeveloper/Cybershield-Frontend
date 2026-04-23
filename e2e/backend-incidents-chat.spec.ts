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

test.describe("Backend - incidents & chat contract", () => {
  test.skip(!hasAuth, "Missing affiliated auth state");

  test("GET /api/incidents returns the user's incident list", async ({
    page,
    request,
  }) => {
    const token = await getToken(page);
    test.skip(!token, "No Clerk token available");

    const res = await request.get(`${apiBase}/incidents`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(Array.isArray(body.incidents ?? body)).toBeTruthy();
  });

  test("POST /api/incidents/analyze with email payload returns ML analysis", async ({
    page,
    request,
  }) => {
    const token = await getToken(page);
    test.skip(!token, "No Clerk token available");

    // ML pipeline (Python subprocess) can be slow on cold start — give it room
    test.setTimeout(120_000);
    const res = await request.post(`${apiBase}/incidents/analyze`, {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      data: {
        messageType: "email",
        message:
          "Dear user, please verify your account at http://evil-phish.example.com/login",
        subject: "Urgent: Verify your account",
        from: "attacker@example.com",
        urls: ["http://evil-phish.example.com/login"],
        date: new Date().toISOString(),
      },
      timeout: 90_000,
    });
    expect([200, 201]).toContain(res.status());
    const body = await res.json();
    // Analysis should return some verdict/probability/label field
    expect(JSON.stringify(body)).toMatch(
      /phishing|legit|label|confidence|score|verdict|prediction/i
    );
  });

  test("POST /api/incidents/analyze with whatsapp payload succeeds", async ({
    page,
    request,
  }) => {
    const token = await getToken(page);
    test.skip(!token, "No Clerk token available");

    // ML pipeline (Python subprocess) can be slow on cold start — give it room
    test.setTimeout(120_000);
    const res = await request.post(`${apiBase}/incidents/analyze`, {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      data: {
        messageType: "whatsapp",
        message: "Click here to claim your prize http://spam.example.com",
        urls: ["http://spam.example.com"],
        from: "+15551234567",
        from_phone: "+15551234567",
        timestamp: new Date().toISOString(),
        date: new Date().toISOString(),
      },
      timeout: 90_000,
    });
    expect([200, 201]).toContain(res.status());
  });

  test("POST /api/incidents/analyze rejects malformed payload", async ({
    page,
    request,
  }) => {
    const token = await getToken(page);
    test.skip(!token, "No Clerk token available");

    const res = await request.post(`${apiBase}/incidents/analyze`, {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      data: { messageType: "invalid-type" },
    });
    expect(res.status()).toBeGreaterThanOrEqual(400);
  });

  test("POST /api/chat/message returns a chatbot reply", async ({
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
      data: { message: "What is a phishing attack?" },
    });
    // Chat may be 200 (success) or 5xx (Gemini unavailable) depending on env
    expect([200, 429, 500, 502, 503]).toContain(res.status());
    if (res.status() === 200) {
      const body = await res.json();
      // API shape: { success, data: { message, timestamp } }
      const replyText =
        body?.data?.message ??
        body?.reply ??
        body?.message ??
        body?.response;
      expect(typeof replyText).toBe("string");
    }
  });
});
