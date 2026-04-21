import { vi, describe, it, expect, beforeEach } from "vitest";

const mockGetToken = vi.fn(async () => "test-token");

vi.mock("@clerk/nextjs", () => ({
  useAuth: () => ({ getToken: mockGetToken }),
}));

import { ApiClient } from "@/lib/api";

describe("ApiClient — Organization Management Methods", () => {
  let client: InstanceType<typeof ApiClient>;

  beforeEach(() => {
    vi.clearAllMocks();
    client = new ApiClient(mockGetToken);
    global.fetch = vi.fn();
  });

  // -----------------------------------------------------------------------
  // Client Admin endpoints
  // -----------------------------------------------------------------------

  describe("inviteSingleUser", () => {
    it("sends POST to correct endpoint with email", async () => {
      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
        ok: true,
        json: async () => ({ message: "Invitation sent", userId: "u1", inviteId: "inv1" }),
      });

      const result = await client.inviteSingleUser("org1", "test@test.com");
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining("/orgs/org1/invite"),
        expect.objectContaining({
          method: "POST",
          body: JSON.stringify({ email: "test@test.com", displayName: undefined, group: undefined }),
        })
      );
      expect(result.message).toBe("Invitation sent");
    });

    it("includes displayName and group when provided", async () => {
      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
        ok: true,
        json: async () => ({ message: "Sent" }),
      });

      await client.inviteSingleUser("org1", "test@test.com", "John", "Engineering");
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining("/orgs/org1/invite"),
        expect.objectContaining({
          body: JSON.stringify({ email: "test@test.com", displayName: "John", group: "Engineering" }),
        })
      );
    });

    it("throws on error response", async () => {
      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
        ok: false,
        json: async () => ({ error: "User already exists" }),
      });

      await expect(client.inviteSingleUser("org1", "dup@test.com")).rejects.toThrow("User already exists");
    });
  });

  describe("bulkInviteUsers", () => {
    it("sends POST with users array", async () => {
      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
        ok: true,
        json: async () => ({ successful: 2, failed: 0 }),
      });

      const users = [{ email: "a@t.com" }, { email: "b@t.com" }];
      const result = await client.bulkInviteUsers("org1", users);

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining("/orgs/org1/bulk-invite"),
        expect.objectContaining({
          method: "POST",
          body: JSON.stringify({ users }),
        })
      );
      expect(result.successful).toBe(2);
    });

    it("throws on error response", async () => {
      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
        ok: false,
        json: async () => ({ error: "No users data provided" }),
      });

      await expect(client.bulkInviteUsers("org1", [])).rejects.toThrow("No users data provided");
    });
  });

  describe("getOrgUsers", () => {
    it("sends GET with pagination params", async () => {
      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
        ok: true,
        json: async () => ({ users: [], pagination: { current: 1, pages: 1, total: 0 } }),
      });

      await client.getOrgUsers("org1", 2, 25);
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringMatching(/\/orgs\/org1\/users\?page=2&limit=25/),
        expect.objectContaining({ method: "GET" })
      );
    });

    it("includes role and status filters", async () => {
      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
        ok: true,
        json: async () => ({ users: [] }),
      });

      await client.getOrgUsers("org1", 1, 50, "affiliated", "active");
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringMatching(/role=affiliated.*status=active|status=active.*role=affiliated/),
        expect.anything()
      );
    });
  });

  describe("getInviteStatus", () => {
    it("sends GET to invites endpoint", async () => {
      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
        ok: true,
        json: async () => ({ users: [], pagination: {} }),
      });

      await client.getInviteStatus("org1");
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining("/orgs/org1/invites"),
        expect.objectContaining({ method: "GET" })
      );
    });

    it("passes status filter when provided", async () => {
      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
        ok: true,
        json: async () => ({ users: [] }),
      });

      await client.getInviteStatus("org1", 1, 50, "invited");
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining("status=invited"),
        expect.anything()
      );
    });
  });

  // -----------------------------------------------------------------------
  // System Admin endpoints
  // -----------------------------------------------------------------------

  describe("createOrganization", () => {
    it("sends POST to create-org endpoint", async () => {
      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
        ok: true,
        json: async () => ({
          message: "Organization created successfully",
          organization: { _id: "org1", name: "NewOrg" },
        }),
      });

      const result = await client.createOrganization("NewOrg", "A description");
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining("/admins/create-org"),
        expect.objectContaining({
          method: "POST",
          body: JSON.stringify({ name: "NewOrg", description: "A description" }),
        })
      );
      expect(result.organization.name).toBe("NewOrg");
    });

    it("throws when name already exists", async () => {
      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
        ok: false,
        json: async () => ({ error: "Organization with this name already exists" }),
      });

      await expect(client.createOrganization("DupOrg")).rejects.toThrow(
        "Organization with this name already exists"
      );
    });
  });

  describe("inviteClientAdmin", () => {
    it("sends POST with email and orgName", async () => {
      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
        ok: true,
        json: async () => ({ ok: true, message: "Invitation sent successfully" }),
      });

      const result = await client.inviteClientAdmin("admin@test.com", "SomeOrg");
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining("/admins/invite-client"),
        expect.objectContaining({
          method: "POST",
          body: JSON.stringify({ email: "admin@test.com", orgName: "SomeOrg" }),
        })
      );
      expect(result.ok).toBe(true);
    });

    it("throws when user already exists", async () => {
      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
        ok: false,
        json: async () => ({ error: "User with this email already exists in the system" }),
      });

      await expect(client.inviteClientAdmin("dup@test.com", "Org")).rejects.toThrow(
        "User with this email already exists"
      );
    });
  });

  describe("getOrganizations", () => {
    it("sends GET to admins/orgs endpoint", async () => {
      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
        ok: true,
        json: async () => ({
          organizations: [
            { _id: "o1", name: "Org1", totalUsers: 5, activeUsers: 3, invitedUsers: 2 },
          ],
        }),
      });

      const result = await client.getOrganizations();
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining("/admins/orgs"),
        expect.objectContaining({ method: "GET" })
      );
      expect(result.organizations).toHaveLength(1);
    });
  });
});
