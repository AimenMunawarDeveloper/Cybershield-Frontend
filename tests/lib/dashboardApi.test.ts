import { ApiClient } from "@/lib/api";
import { vi, describe, it, expect, beforeEach, afterEach } from "vitest";

// ---------------------------------------------------------------------------
// Dashboard API Client — comprehensive tests for all dashboard-related
// API calls and role-gated behaviour
// ---------------------------------------------------------------------------

describe("ApiClient — Dashboard API Methods", () => {
  const getToken = vi.fn(async () => "token-123");

  beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn());
    getToken.mockClear();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  // -----------------------------------------------------------------------
  // getUserProfile
  // -----------------------------------------------------------------------
  describe("getUserProfile", () => {
    it("calls /users/me with auth header", async () => {
      (fetch as any).mockResolvedValue({
        ok: true,
        text: async () =>
          JSON.stringify({
            _id: "u1",
            role: "affiliated",
            learningScores: { email: 0.5, whatsapp: 0.5, lms: 0.5 },
            badges: [],
          }),
      });

      const api = new ApiClient(getToken);
      const result = await api.getUserProfile();

      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining("/users/me"),
        expect.objectContaining({
          headers: expect.objectContaining({ Authorization: "Bearer token-123" }),
        })
      );
      expect(result.role).toBe("affiliated");
      expect(result.learningScores).toBeDefined();
    });

    it("throws on non-OK response", async () => {
      (fetch as any).mockResolvedValue({
        ok: false,
        text: async () => JSON.stringify({ error: "Unauthorized" }),
      });

      const api = new ApiClient(getToken);
      await expect(api.getUserProfile()).rejects.toThrow("Unauthorized");
    });
  });

  // -----------------------------------------------------------------------
  // getAllUsers (system admin dashboard)
  // -----------------------------------------------------------------------
  describe("getAllUsers", () => {
    it("calls /users/all with pagination params", async () => {
      (fetch as any).mockResolvedValue({
        ok: true,
        json: async () => ({
          users: [{ _id: "u1", role: "non_affiliated", learningScores: {} }],
          pagination: { current: 1, pages: 1, total: 1 },
        }),
      });

      const api = new ApiClient(getToken);
      const result = await api.getAllUsers(1, 50);

      expect(fetch).toHaveBeenCalledWith(
        expect.stringMatching(/\/users\/all\?.*page=1.*limit=50/),
        expect.anything()
      );
      expect(result.users).toHaveLength(1);
    });
  });

  // -----------------------------------------------------------------------
  // getOrgUsers (client admin dashboard)
  // -----------------------------------------------------------------------
  describe("getOrgUsers", () => {
    it("calls /orgs/:orgId/users with auth", async () => {
      (fetch as any).mockResolvedValue({
        ok: true,
        json: async () => ({
          users: [{ _id: "u1", learningScores: { email: 0.7 } }],
          pagination: { current: 1, pages: 1, total: 1 },
        }),
      });

      const api = new ApiClient(getToken);
      const result = await api.getOrgUsers("org-123");

      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining("/orgs/org-123/users"),
        expect.anything()
      );
      expect(result.users[0].learningScores.email).toBe(0.7);
    });

    it("throws on forbidden response", async () => {
      (fetch as any).mockResolvedValue({
        ok: false,
        json: async () => ({ error: "Access denied to this organization" }),
      });

      const api = new ApiClient(getToken);
      await expect(api.getOrgUsers("foreign-org")).rejects.toThrow("Access denied");
    });
  });

  // -----------------------------------------------------------------------
  // Reports
  // -----------------------------------------------------------------------
  describe("getUserReports", () => {
    it("calls /reports with auth header", async () => {
      (fetch as any).mockResolvedValue({
        ok: true,
        json: async () => ({
          success: true,
          reports: [{ _id: "r1", reportName: "Weekly Report" }],
        }),
      });

      const api = new ApiClient(getToken);
      const result = await api.getUserReports();

      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining("/reports"),
        expect.objectContaining({
          headers: expect.objectContaining({ Authorization: "Bearer token-123" }),
        })
      );
      expect(result.reports).toHaveLength(1);
    });
  });

  describe("downloadReport", () => {
    it("calls /reports/:id/download and returns a blob", async () => {
      const mockBlob = new Blob(["pdf-content"], { type: "application/pdf" });
      (fetch as any).mockResolvedValue({
        ok: true,
        blob: async () => mockBlob,
      });

      const api = new ApiClient(getToken);
      const result = await api.downloadReport("report-1");

      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining("/reports/report-1/download"),
        expect.anything()
      );
      expect(result).toBeInstanceOf(Blob);
    });
  });

  describe("saveReport", () => {
    it("sends FormData with PDF blob and metadata", async () => {
      (fetch as any).mockResolvedValue({
        ok: true,
        json: async () => ({ success: true, report: { _id: "r1" } }),
      });

      const api = new ApiClient(getToken);
      const blob = new Blob(["pdf"], { type: "application/pdf" });
      await api.saveReport({
        reportName: "Analytics Report",
        reportDate: "2026-04-20",
        fileName: "analytics.pdf",
        pdfBlob: blob,
        reportData: { score: 95 },
      });

      const [, reqInit] = (fetch as any).mock.calls[0];
      expect(reqInit.method).toBe("POST");
      expect(reqInit.headers["Content-Type"]).toBeUndefined();
      expect(reqInit.body).toBeInstanceOf(FormData);
    });
  });

  // -----------------------------------------------------------------------
  // Courses & Certificates (training completion stats)
  // -----------------------------------------------------------------------
  describe("getCourses", () => {
    it("calls /courses with auth", async () => {
      (fetch as any).mockResolvedValue({
        ok: true,
        json: async () => ({ success: true, courses: [{ _id: "c1" }] }),
      });

      const api = new ApiClient(getToken);
      const result = await api.getCourses();

      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining("/courses"),
        expect.anything()
      );
      expect(result.courses).toHaveLength(1);
    });
  });

  // -----------------------------------------------------------------------
  // Leaderboard
  // -----------------------------------------------------------------------
  describe("leaderboard endpoints", () => {
    it("getGlobalLeaderboard calls /leaderboard/global", async () => {
      (fetch as any).mockResolvedValue({
        ok: true,
        json: async () => ({
          success: true,
          leaderboard: [{ _id: "u1", name: "Top User", learningScore: 90 }],
        }),
      });

      const api = new ApiClient(getToken);
      const result = await api.getGlobalLeaderboard();

      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining("/leaderboard/global"),
        expect.anything()
      );
      expect(result.leaderboard).toHaveLength(1);
    });

    it("getOrganizationLeaderboard calls /leaderboard/organization", async () => {
      (fetch as any).mockResolvedValue({
        ok: true,
        json: async () => ({
          success: true,
          leaderboard: [{ _id: "u2", name: "Org User", learningScore: 75 }],
        }),
      });

      const api = new ApiClient(getToken);
      const result = await api.getOrganizationLeaderboard();

      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining("/leaderboard/organization"),
        expect.anything()
      );
      expect(result.leaderboard).toHaveLength(1);
    });
  });

  // -----------------------------------------------------------------------
  // Voice Phishing Analytics
  // -----------------------------------------------------------------------
  describe("getVoicePhishingAnalytics", () => {
    it("calls /voice-phishing/analytics/overview", async () => {
      (fetch as any).mockResolvedValue({
        ok: true,
        json: async () => ({
          success: true,
          data: {
            totalConversations: 100,
            completedConversations: 80,
            averageScore: 72.5,
          },
        }),
      });

      const api = new ApiClient(getToken);
      const result = await api.getVoicePhishingAnalytics();

      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining("/voice-phishing/analytics/overview"),
        expect.anything()
      );
      expect(result.success).toBe(true);
      expect(result.data.totalConversations).toBe(100);
    });
  });

  // -----------------------------------------------------------------------
  // Campaign Analytics
  // -----------------------------------------------------------------------
  describe("getCampaignAnalytics", () => {
    it("calls /campaigns/:id/analytics", async () => {
      (fetch as any).mockResolvedValue({
        ok: true,
        json: async () => ({
          success: true,
          data: {
            email: { totalSent: 100, totalDelivered: 90, totalOpened: 50, totalClicked: 10, totalReported: 5 },
          },
        }),
      });

      const api = new ApiClient(getToken);
      const result = await api.getCampaignAnalytics("campaign-1");

      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining("/campaigns/campaign-1/analytics"),
        expect.anything()
      );
      expect(result.data.email.totalSent).toBe(100);
    });
  });

  describe("getWhatsAppCampaignAnalytics", () => {
    it("calls /whatsapp-campaigns/:id/analytics", async () => {
      (fetch as any).mockResolvedValue({
        ok: true,
        json: async () => ({
          success: true,
          data: { totalSent: 50, totalDelivered: 45, totalRead: 30, totalClicked: 8, totalReported: 3 },
        }),
      });

      const api = new ApiClient(getToken);
      const result = await api.getWhatsAppCampaignAnalytics("wa-campaign-1");

      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining("/whatsapp-campaigns/wa-campaign-1/analytics"),
        expect.anything()
      );
      expect(result.data.totalSent).toBe(50);
    });
  });

  // -----------------------------------------------------------------------
  // getCampaigns / getWhatsAppCampaigns (campaign counts)
  // -----------------------------------------------------------------------
  describe("getCampaigns", () => {
    it("returns paginated campaign list", async () => {
      (fetch as any).mockResolvedValue({
        ok: true,
        json: async () => ({
          success: true,
          data: {
            campaigns: [
              { _id: "c1", name: "Camp 1", status: "completed" },
              { _id: "c2", name: "Camp 2", status: "active" },
            ],
          },
        }),
      });

      const api = new ApiClient(getToken);
      const result = await api.getCampaigns(1, 100);

      expect(result.data.campaigns).toHaveLength(2);
    });
  });

  describe("getWhatsAppCampaigns", () => {
    it("returns whatsapp campaign list", async () => {
      (fetch as any).mockResolvedValue({
        ok: true,
        json: async () => ({
          success: true,
          data: {
            campaigns: [
              { _id: "w1", name: "WA 1", managedByParentCampaign: false },
              { _id: "w2", name: "WA 2", managedByParentCampaign: true },
            ],
          },
        }),
      });

      const api = new ApiClient(getToken);
      const result = await api.getWhatsAppCampaigns(1, 100);

      expect(result.data.campaigns).toHaveLength(2);
    });
  });
});
