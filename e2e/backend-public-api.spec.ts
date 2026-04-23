import { expect, test } from "@playwright/test";

const backendBase = process.env.NEXT_PUBLIC_BACKEND_URL || "http://127.0.0.1:5001";
const apiBase = process.env.NEXT_PUBLIC_API_URL || `${backendBase}/api`;

test.describe("Backend public/API availability", () => {
  test("health endpoint is up", async ({ request }) => {
    const res = await request.get(`${backendBase}/health`);
    expect(res.ok()).toBeTruthy();
  });

  test("whatsapp click endpoint handles unknown token", async ({ request }) => {
    const res = await request.get(`${apiBase}/whatsapp-campaigns/click?ct=playwright-unknown-token`);
    expect(res.status()).toBe(204);
  });

  test("email templates endpoint is reachable", async ({ request }) => {
    const res = await request.get(`${apiBase}/email-templates`);
    expect([200, 500]).toContain(res.status());
  });

  test("whatsapp templates endpoint is reachable", async ({ request }) => {
    const res = await request.get(`${apiBase}/whatsapp-templates`);
    expect([200, 500]).toContain(res.status());
  });
});
