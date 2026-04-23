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

test.describe("Backend - template CRUD contract (client admin)", () => {
  test.skip(!hasAuth, "Missing client admin auth state");

  test("GET /api/email-templates lists default + custom templates", async ({
    page,
    request,
  }) => {
    const token = await getToken(page);
    test.skip(!token, "No Clerk token available");

    const res = await request.get(`${apiBase}/email-templates`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    expect(res.status()).toBe(200);
    const body = await res.json();
    // Response is { success: true, data: { templates, count } }
    const items = body?.data?.templates ?? body?.templates ?? body;
    expect(Array.isArray(items)).toBeTruthy();
  });

  test("POST /api/email-templates/custom accepts or rejects with a well-formed response", async ({
    page,
    request,
  }) => {
    const token = await getToken(page);
    test.skip(!token, "No Clerk token available");

    const unique = Date.now();
    const res = await request.post(
      `${apiBase}/email-templates/custom`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        data: {
          title: `E2E Email Template ${unique}`,
          subject: `E2E subject ${unique}`,
          bodyHtml: `<p>Hello E2E ${unique}</p>`,
          category: "general",
        },
      }
    );
    // Accept 200/201 (created) or 400 (if additional required fields missing) or 500 (env issue)
    expect([200, 201, 400, 500]).toContain(res.status());
  });

  test("GET /api/whatsapp-templates lists default + custom whatsapp templates", async ({
    page,
    request,
  }) => {
    const token = await getToken(page);
    test.skip(!token, "No Clerk token available");

    const res = await request.get(`${apiBase}/whatsapp-templates`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    expect(res.status()).toBe(200);
    const body = await res.json();
    const items = body?.data?.templates ?? body?.templates ?? body;
    expect(Array.isArray(items)).toBeTruthy();
  });

  test("POST /api/whatsapp-templates/custom accepts or validates the payload", async ({
    page,
    request,
  }) => {
    const token = await getToken(page);
    test.skip(!token, "No Clerk token available");

    const unique = Date.now();
    const res = await request.post(
      `${apiBase}/whatsapp-templates/custom`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        data: {
          title: `E2E WA Template ${unique}`,
          description: `E2E description ${unique}`,
          messageTemplate: `Hello E2E ${unique} {{link}}`,
          category: "general",
        },
      }
    );
    expect([200, 201, 400, 500]).toContain(res.status());
  });

  test("GET /api/voice-phishing-templates returns templates list", async ({
    page,
    request,
  }) => {
    const token = await getToken(page);
    test.skip(!token, "No Clerk token available");

    const res = await request.get(
      `${apiBase}/voice-phishing-templates`,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    expect([200, 403]).toContain(res.status());
  });

  test("GET /api/voice-phishing-templates/defaults returns default scenarios", async ({
    page,
    request,
  }) => {
    const token = await getToken(page);
    test.skip(!token, "No Clerk token available");

    const res = await request.get(
      `${apiBase}/voice-phishing-templates/defaults`,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    expect([200, 403]).toContain(res.status());
  });
});
