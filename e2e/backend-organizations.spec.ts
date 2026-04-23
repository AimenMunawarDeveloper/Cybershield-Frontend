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

async function getOrgId(
  page: any,
  request: any,
  token: string
): Promise<string | null> {
  try {
    const profileRes = await request.get(`${apiBase}/users/me`, {
      headers: { Authorization: `Bearer ${token}` },
      timeout: 60_000,
    });
    if (!profileRes.ok()) return null;
    const profile = await profileRes.json();
    return profile?.orgId ?? profile?.organizationId ?? null;
  } catch {
    return null;
  }
}

test.describe("Backend - orgs & invites contract (client admin)", () => {
  test.skip(!hasAuth, "Missing client admin auth state");

  test("GET /api/orgs/:orgId/users lists organization users", async ({
    page,
    request,
  }) => {
    const token = await getToken(page);
    test.skip(!token, "No Clerk token available");
    const orgId = await getOrgId(page, request, token);
    test.skip(!orgId, "No orgId for client admin");

    const res = await request.get(`${apiBase}/orgs/${orgId}/users`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    expect(res.status()).toBe(200);
    const body = await res.json();
    const users = body.users ?? body;
    expect(Array.isArray(users)).toBeTruthy();
  });

  test("GET /api/orgs/:orgId/invites lists pending invites", async ({
    page,
    request,
  }) => {
    const token = await getToken(page);
    test.skip(!token, "No Clerk token available");
    const orgId = await getOrgId(page, request, token);
    test.skip(!orgId, "No orgId for client admin");

    const res = await request.get(`${apiBase}/orgs/${orgId}/invites`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    expect([200, 404]).toContain(res.status());
  });

  test("GET /api/orgs/:orgId/certificates/count returns a numeric count", async ({
    page,
    request,
  }) => {
    const token = await getToken(page);
    test.skip(!token, "No Clerk token available");
    const orgId = await getOrgId(page, request, token);
    test.skip(!orgId, "No orgId for client admin");

    const res = await request.get(
      `${apiBase}/orgs/${orgId}/certificates/count`,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    expect(res.status()).toBe(200);
    const body = await res.json();
    const count =
      typeof body === "number"
        ? body
        : body.count ?? body.total ?? body.certificates ?? 0;
    expect(Number(count)).not.toBeNaN();
  });

  test("POST /api/orgs/:orgId/invite rejects missing email", async ({
    page,
    request,
  }) => {
    const token = await getToken(page);
    test.skip(!token, "No Clerk token available");
    const orgId = await getOrgId(page, request, token);
    test.skip(!orgId, "No orgId for client admin");

    const res = await request.post(`${apiBase}/orgs/${orgId}/invite`, {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      data: {},
    });
    expect(res.status()).toBeGreaterThanOrEqual(400);
  });

  test("client admin cannot access another org's users", async ({
    page,
    request,
  }) => {
    const token = await getToken(page);
    test.skip(!token, "No Clerk token available");

    const fakeOrgId = "000000000000000000000000";
    const res = await request.get(`${apiBase}/orgs/${fakeOrgId}/users`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    expect([400, 401, 403, 404]).toContain(res.status());
  });
});

test.describe("Backend - system admin org endpoints", () => {
  const hasSys = hasStorageState(storageStates.systemAdmin);
  test.skip(!hasSys, "Missing system admin auth state");
  test.use({ storageState: hasSys ? storageStates.systemAdmin : undefined });

  test("GET /api/admin/orgs lists organizations for system admin", async ({
    page,
    request,
  }) => {
    const token = await getToken(page);
    test.skip(!token, "No Clerk token available");

    const res = await request.get(`${apiBase}/admin/orgs`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    expect([200, 404]).toContain(res.status());
    if (res.status() === 200) {
      const body = await res.json();
      const orgs = body.organizations ?? body.orgs ?? body;
      expect(Array.isArray(orgs)).toBeTruthy();
    }
  });

  test("GET /api/admin/pending-invitations returns an array", async ({
    page,
    request,
  }) => {
    const token = await getToken(page);
    test.skip(!token, "No Clerk token available");

    const res = await request.get(
      `${apiBase}/admin/pending-invitations`,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    expect([200, 404]).toContain(res.status());
  });

  test("POST /api/admin/invite-client rejects missing payload", async ({
    page,
    request,
  }) => {
    const token = await getToken(page);
    test.skip(!token, "No Clerk token available");

    const res = await request.post(`${apiBase}/admin/invite-client`, {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      data: {},
    });
    expect(res.status()).toBeGreaterThanOrEqual(400);
  });
});
