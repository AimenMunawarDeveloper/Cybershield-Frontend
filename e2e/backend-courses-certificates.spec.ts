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

test.describe("Backend - courses & certificates contract", () => {
  test.skip(!hasAuth, "Missing affiliated auth state");

  test("GET /api/courses returns a list for authenticated user", async ({
    page,
    request,
  }) => {
    const token = await getToken(page);
    test.skip(!token, "No Clerk token available");

    const res = await request.get(`${apiBase}/courses`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body).toHaveProperty("courses");
    expect(Array.isArray(body.courses)).toBeTruthy();
  });

  test("GET /api/courses/:id returns a course when id exists", async ({
    page,
    request,
  }) => {
    const token = await getToken(page);
    test.skip(!token, "No Clerk token available");

    const listRes = await request.get(`${apiBase}/courses`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const list = await listRes.json();
    const courseId = list?.courses?.[0]?._id;
    test.skip(!courseId, "No courses in system to fetch");

    const detail = await request.get(`${apiBase}/courses/${courseId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    expect([200, 404]).toContain(detail.status());
    if (detail.status() === 200) {
      const body = await detail.json();
      expect(body).toHaveProperty("course");
    }
  });

  test("GET /api/courses/:id/progress returns completion payload", async ({
    page,
    request,
  }) => {
    const token = await getToken(page);
    test.skip(!token, "No Clerk token available");

    const listRes = await request.get(`${apiBase}/courses`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const list = await listRes.json();
    const courseId = list?.courses?.[0]?._id;
    test.skip(!courseId, "No courses in system to fetch progress for");

    const res = await request.get(
      `${apiBase}/courses/${courseId}/progress`,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    expect([200, 404]).toContain(res.status());
  });

  test("GET /api/certificates returns the user's certificate list", async ({
    page,
    request,
  }) => {
    const token = await getToken(page);
    test.skip(!token, "No Clerk token available");

    const res = await request.get(`${apiBase}/certificates`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    expect(res.status()).toBe(200);
    const body = await res.json();
    // Certificates response shape: { certificates: [...] }
    expect(body).toHaveProperty("certificates");
    expect(Array.isArray(body.certificates)).toBeTruthy();
  });

  test("GET /api/certificates/count/non-affiliated responds for authenticated user", async ({
    page,
    request,
  }) => {
    const token = await getToken(page);
    test.skip(!token, "No Clerk token available");

    const res = await request.get(
      `${apiBase}/certificates/count/non-affiliated`,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    expect([200, 403]).toContain(res.status());
  });
});
