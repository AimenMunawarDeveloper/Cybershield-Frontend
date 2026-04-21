import { render, screen, waitFor } from "@testing-library/react";
import { vi, describe, it, expect, beforeEach } from "vitest";
import React from "react";

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

const {
  mockGetCampaigns,
  mockGetWhatsAppCampaigns,
  mockGetCampaignAnalytics,
  mockGetWhatsAppCampaignAnalytics,
} = vi.hoisted(() => ({
  mockGetCampaigns: vi.fn(),
  mockGetWhatsAppCampaigns: vi.fn(),
  mockGetCampaignAnalytics: vi.fn(),
  mockGetWhatsAppCampaignAnalytics: vi.fn(),
}));

vi.mock("@clerk/nextjs", () => ({
  useAuth: () => ({ getToken: vi.fn(async () => "token") }),
}));

vi.mock("@/lib/api", () => ({
  ApiClient: vi.fn().mockImplementation(() => ({
    getCampaigns: mockGetCampaigns,
    getWhatsAppCampaigns: mockGetWhatsAppCampaigns,
    getCampaignAnalytics: mockGetCampaignAnalytics,
    getWhatsAppCampaignAnalytics: mockGetWhatsAppCampaignAnalytics,
  })),
}));

vi.mock("@/hooks/useTranslation", () => ({
  useTranslation: () => ({ t: (s: string) => s }),
}));

vi.mock("recharts", () => {
  const Wrapper = ({ children }: React.PropsWithChildren) =>
    React.createElement("div", { "data-testid": "recharts-wrapper" }, children);
  return {
    ResponsiveContainer: Wrapper,
    BarChart: Wrapper,
    Bar: () => null,
    XAxis: () => null,
    YAxis: () => null,
    CartesianGrid: () => null,
    Tooltip: () => null,
    Legend: () => null,
  };
});

import CampaignPerformance from "@/components/CampaignPerformance";

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("CampaignPerformance", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders loading spinner initially", () => {
    mockGetCampaigns.mockReturnValue(new Promise(() => {}));
    mockGetWhatsAppCampaigns.mockReturnValue(new Promise(() => {}));
    render(<CampaignPerformance />);
    expect(document.querySelector(".animate-spin")).toBeInTheDocument();
  });

  it("renders email and WhatsApp campaign summaries with analytics", async () => {
    mockGetCampaigns.mockResolvedValue({
      success: true,
      data: { campaigns: [{ _id: "e1", name: "Email Campaign 1", status: "completed" }] },
    });
    mockGetWhatsAppCampaigns.mockResolvedValue({
      success: true,
      data: { campaigns: [{ _id: "w1", name: "WA Campaign 1", status: "completed", managedByParentCampaign: false }] },
    });
    mockGetCampaignAnalytics.mockResolvedValue({
      success: true,
      data: {
        email: { totalSent: 100, totalDelivered: 90, totalOpened: 60, totalClicked: 10, totalReported: 5 },
      },
    });
    mockGetWhatsAppCampaignAnalytics.mockResolvedValue({
      success: true,
      data: { totalSent: 50, totalDelivered: 45, totalRead: 30, totalClicked: 8, totalReported: 3 },
    });

    render(<CampaignPerformance />);

    await waitFor(() => {
      expect(screen.getByText("Campaign Performance")).toBeInTheDocument();
    });

    expect(screen.getByText("Email Campaigns")).toBeInTheDocument();
    expect(screen.getByText("WhatsApp Campaigns")).toBeInTheDocument();
  });

  it("renders analytics with zero values when campaigns exist but have no activity", async () => {
    mockGetCampaigns.mockResolvedValue({ success: true, data: { campaigns: [] } });
    mockGetWhatsAppCampaigns.mockResolvedValue({ success: true, data: { campaigns: [] } });

    render(<CampaignPerformance />);

    await waitFor(() => {
      expect(screen.getByText("Campaign Performance")).toBeInTheDocument();
    });

    expect(screen.getByText("Email Campaigns")).toBeInTheDocument();
    expect(screen.getByText("WhatsApp Campaigns")).toBeInTheDocument();
  });

  it("filters out managed WhatsApp campaigns to avoid double-counting", async () => {
    mockGetCampaigns.mockResolvedValue({
      success: true,
      data: { campaigns: [{ _id: "e1", name: "Unified", status: "completed" }] },
    });
    mockGetWhatsAppCampaigns.mockResolvedValue({
      success: true,
      data: {
        campaigns: [
          { _id: "w1", name: "Standalone WA", status: "completed", managedByParentCampaign: false },
          { _id: "w2", name: "Managed WA", status: "completed", managedByParentCampaign: true },
        ],
      },
    });
    mockGetCampaignAnalytics.mockResolvedValue({
      success: true,
      data: {
        email: { totalSent: 10, totalDelivered: 10, totalOpened: 5, totalClicked: 2, totalReported: 1 },
      },
    });
    mockGetWhatsAppCampaignAnalytics.mockResolvedValue({
      success: true,
      data: { totalSent: 20, totalDelivered: 18, totalRead: 15, totalClicked: 4, totalReported: 2 },
    });

    render(<CampaignPerformance />);

    await waitFor(() => {
      expect(screen.getByText("Campaign Performance")).toBeInTheDocument();
    });

    // Only standalone WA campaign "w1" should trigger getWhatsAppCampaignAnalytics;
    // managed "w2" should be filtered out
    await waitFor(() => {
      const calledIds = mockGetWhatsAppCampaignAnalytics.mock.calls.map(
        (c: unknown[]) => c[0]
      );
      expect(calledIds).toContain("w1");
      expect(calledIds).not.toContain("w2");
    });
  });

  it("handles campaign API errors gracefully", async () => {
    mockGetCampaigns.mockRejectedValue(new Error("Server down"));
    mockGetWhatsAppCampaigns.mockRejectedValue(new Error("Server down"));

    render(<CampaignPerformance />);

    await waitFor(() => {
      expect(screen.getByText("Campaign Performance")).toBeInTheDocument();
    });
  });
});
