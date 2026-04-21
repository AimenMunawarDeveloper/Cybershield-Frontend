import { vi, describe, it, expect, beforeEach } from "vitest";

const mockGetToken = vi.fn(async () => "test-token");

vi.mock("@clerk/nextjs", () => ({
  useAuth: () => ({ getToken: mockGetToken }),
}));

import { ApiClient } from "@/lib/api";

describe("ApiClient — Campaign Methods", () => {
  let client: InstanceType<typeof ApiClient>;

  beforeEach(() => {
    vi.clearAllMocks();
    client = new ApiClient(mockGetToken);
    global.fetch = vi.fn();
  });

  describe("getCampaigns", () => {
    it("sends GET to /campaigns with default pagination", async () => {
      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
        ok: true,
        json: async () => ({
          success: true,
          data: { campaigns: [], pagination: { current: 1, pages: 1, total: 0 } },
        }),
      });

      const result = await client.getCampaigns();
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining("/campaigns?"),
        expect.objectContaining({ method: "GET" })
      );
      expect(result.success).toBe(true);
      expect(result.data.campaigns).toEqual([]);
    });

    it("passes page and limit", async () => {
      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
        ok: true,
        json: async () => ({ success: true, data: { campaigns: [] } }),
      });

      await client.getCampaigns(2, 20);
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringMatching(/page=2.*limit=20/),
        expect.anything()
      );
    });
  });

  describe("getWhatsAppCampaigns", () => {
    it("sends GET to /whatsapp-campaigns", async () => {
      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
        ok: true,
        json: async () => ({
          success: true,
          data: { campaigns: [{ _id: "w1", name: "WA Camp", status: "draft" }] },
        }),
      });

      const result = await client.getWhatsAppCampaigns();
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining("/whatsapp-campaigns"),
        expect.objectContaining({ method: "GET" })
      );
      expect(result.data.campaigns).toHaveLength(1);
    });
  });

  describe("getCampaignAnalytics", () => {
    it("sends GET to /campaigns/:id/analytics", async () => {
      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
        ok: true,
        json: async () => ({
          success: true,
          data: {
            email: { totalSent: 50, totalOpened: 30 },
            whatsapp: { totalSent: 40, totalRead: 20 },
          },
        }),
      });

      const result = await client.getCampaignAnalytics("camp-1");
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining("/campaigns/camp-1/analytics"),
        expect.objectContaining({ method: "GET" })
      );
      expect(result.data.email.totalSent).toBe(50);
    });
  });

  describe("getWhatsAppCampaignAnalytics", () => {
    it("sends GET to /whatsapp-campaigns/:id/analytics", async () => {
      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
        ok: true,
        json: async () => ({
          success: true,
          data: { totalSent: 30, totalDelivered: 28, totalClicked: 5 },
        }),
      });

      const result = await client.getWhatsAppCampaignAnalytics("wa-1");
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining("/whatsapp-campaigns/wa-1/analytics"),
        expect.objectContaining({ method: "GET" })
      );
      expect(result.data.totalSent).toBe(30);
    });
  });
});
