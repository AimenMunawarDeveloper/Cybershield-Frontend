import { render, screen, waitFor } from "@testing-library/react";
import { vi, describe, it, expect, beforeEach } from "vitest";
import React from "react";

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

const mockGetVoicePhishingAnalytics = vi.fn();

vi.mock("@clerk/nextjs", () => ({
  useAuth: () => ({ getToken: vi.fn(async () => "token") }),
}));

vi.mock("@/lib/api", () => ({
  ApiClient: vi.fn().mockImplementation(() => ({
    getVoicePhishingAnalytics: mockGetVoicePhishingAnalytics,
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
    PieChart: Wrapper,
    Pie: () => null,
    Cell: () => null,
    BarChart: Wrapper,
    Bar: () => null,
    XAxis: () => null,
    YAxis: () => null,
    CartesianGrid: () => null,
    Tooltip: () => null,
    Legend: () => null,
  };
});

import VoicePhishingOverview from "@/components/VoicePhishingOverview";

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("VoicePhishingOverview", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders loading spinner initially", () => {
    mockGetVoicePhishingAnalytics.mockReturnValue(new Promise(() => {}));
    render(<VoicePhishingOverview />);
    expect(document.querySelector(".animate-spin")).toBeInTheDocument();
  });

  it("renders 'no data' message when analytics returns null", async () => {
    mockGetVoicePhishingAnalytics.mockResolvedValue({ success: false });
    render(<VoicePhishingOverview />);

    await waitFor(() => {
      expect(screen.getByText("No voice phishing data available")).toBeInTheDocument();
    });
  });

  it("renders analytics data correctly", async () => {
    mockGetVoicePhishingAnalytics.mockResolvedValue({
      success: true,
      data: {
        totalConversations: 50,
        completedConversations: 40,
        averageScore: 72.5,
        phishingScenarios: { total: 30, fellForPhishing: 5 },
        normalScenarios: { total: 20 },
        resistanceLevels: { high: 20, medium: 15, low: 5 },
      },
    });

    render(<VoicePhishingOverview />);

    await waitFor(() => {
      expect(screen.getByText("Voice Phishing Overview")).toBeInTheDocument();
    });

    expect(screen.getByText("50")).toBeInTheDocument();
    expect(screen.getByText("40")).toBeInTheDocument();
    expect(screen.getByText("72.5")).toBeInTheDocument();
    expect(screen.getByText("5")).toBeInTheDocument();
    expect(screen.getByText("Total Conversations")).toBeInTheDocument();
    expect(screen.getByText("Completed")).toBeInTheDocument();
    expect(screen.getByText("Average Score")).toBeInTheDocument();
    expect(screen.getByText("Fell for Phishing")).toBeInTheDocument();
  });

  it("calculates phishing success rate correctly", async () => {
    mockGetVoicePhishingAnalytics.mockResolvedValue({
      success: true,
      data: {
        totalConversations: 100,
        completedConversations: 80,
        averageScore: 65.0,
        phishingScenarios: { total: 50, fellForPhishing: 10 },
        normalScenarios: { total: 50 },
        resistanceLevels: { high: 30, medium: 20, low: 10 },
      },
    });

    render(<VoicePhishingOverview />);

    await waitFor(() => {
      expect(screen.getByText("Voice Phishing Overview")).toBeInTheDocument();
    });

    // 10/50 = 20.0%
    expect(screen.getByText(/20\.0/)).toBeInTheDocument();
  });

  it("handles API error gracefully", async () => {
    mockGetVoicePhishingAnalytics.mockRejectedValue(new Error("Network error"));
    render(<VoicePhishingOverview />);

    await waitFor(() => {
      expect(screen.getByText("No voice phishing data available")).toBeInTheDocument();
    });
  });
});
