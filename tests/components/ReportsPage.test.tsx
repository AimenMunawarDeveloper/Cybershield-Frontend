import { render, screen, waitFor } from "@testing-library/react";
import { vi, describe, it, expect, beforeEach } from "vitest";
import React from "react";

// ---------------------------------------------------------------------------
// Mocks — destructured from vi.hoisted for auto-hoisting
// ---------------------------------------------------------------------------

const {
  mockPush,
  mockGetUserProfile,
  mockGetUserReports,
  mockDownloadReport,
} = vi.hoisted(() => ({
  mockPush: vi.fn(),
  mockGetUserProfile: vi.fn(),
  mockGetUserReports: vi.fn(),
  mockDownloadReport: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush }),
}));

vi.mock("@clerk/nextjs", () => ({
  useAuth: () => ({ getToken: vi.fn(async () => "token") }),
}));

vi.mock("@/lib/api", () => ({
  ApiClient: vi.fn().mockImplementation(() => ({
    getUserProfile: mockGetUserProfile,
    getUserReports: mockGetUserReports,
    downloadReport: mockDownloadReport,
  })),
}));

vi.mock("@/contexts/LanguageContext", () => ({
  useLanguage: () => ({ language: "en" }),
}));

vi.mock("@/hooks/useTranslation", () => ({
  useTranslation: () => ({
    t: (s: string) => s,
    preTranslate: vi.fn(async () => {}),
  }),
}));

import ReportsPage from "@/app/dashboard/reports/page";

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("ReportsPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("redirects non-admin users to /dashboard", async () => {
    mockGetUserProfile.mockResolvedValue({ role: "affiliated" });
    mockGetUserReports.mockResolvedValue({ reports: [] });
    render(<ReportsPage />);

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith("/dashboard");
    });
  });

  it("redirects non_affiliated users to /dashboard", async () => {
    mockGetUserProfile.mockResolvedValue({ role: "non_affiliated" });
    mockGetUserReports.mockResolvedValue({ reports: [] });
    render(<ReportsPage />);

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith("/dashboard");
    });
  });

  it("shows reports list for system_admin", async () => {
    mockGetUserProfile.mockResolvedValue({ role: "system_admin" });
    mockGetUserReports.mockResolvedValue({
      reports: [
        {
          _id: "r1",
          reportName: "Weekly Analytics",
          organizationName: "Org A",
          reportDate: "2026-04-20",
          fileName: "weekly.pdf",
          createdAt: "2026-04-20T10:00:00Z",
          createdBy: { _id: "u1", displayName: "Admin", email: "admin@test.com" },
        },
      ],
    });

    render(<ReportsPage />);

    await waitFor(() => {
      expect(screen.getByText("My Reports")).toBeInTheDocument();
    });

    expect(screen.getByText("Weekly Analytics")).toBeInTheDocument();
    expect(screen.getByText("Org A")).toBeInTheDocument();
  });

  it("shows reports list for client_admin", async () => {
    mockGetUserProfile.mockResolvedValue({ role: "client_admin" });
    mockGetUserReports.mockResolvedValue({
      reports: [
        {
          _id: "r2",
          reportName: "Org Report",
          reportDate: "2026-04-20",
          fileName: "org.pdf",
          createdAt: "2026-04-20T10:00:00Z",
          createdBy: { _id: "u2", displayName: "CA", email: "ca@test.com" },
        },
      ],
    });

    render(<ReportsPage />);

    await waitFor(() => {
      expect(screen.getByText("Org Report")).toBeInTheDocument();
    });
  });

  it("shows empty state when no reports exist", async () => {
    mockGetUserProfile.mockResolvedValue({ role: "system_admin" });
    mockGetUserReports.mockResolvedValue({ reports: [] });

    render(<ReportsPage />);

    await waitFor(() => {
      expect(screen.getByText("No Reports Yet")).toBeInTheDocument();
    });

    expect(screen.getByText("Generate analytics reports from the dashboard to view them here.")).toBeInTheDocument();
  });

  it("shows View and Download buttons for each report", async () => {
    mockGetUserProfile.mockResolvedValue({ role: "system_admin" });
    mockGetUserReports.mockResolvedValue({
      reports: [
        {
          _id: "r1",
          reportName: "Test Report",
          reportDate: "2026-04-20",
          fileName: "test.pdf",
          createdAt: "2026-04-20T10:00:00Z",
          createdBy: { _id: "u1", displayName: "Admin", email: "a@t.com" },
        },
      ],
    });

    render(<ReportsPage />);

    await waitFor(() => {
      expect(screen.getByText("Test Report")).toBeInTheDocument();
    });

    expect(screen.getByText("View")).toBeInTheDocument();
    expect(screen.getByText("Download")).toBeInTheDocument();
  });

  it("shows report count correctly", async () => {
    mockGetUserProfile.mockResolvedValue({ role: "system_admin" });
    mockGetUserReports.mockResolvedValue({
      reports: [
        { _id: "r1", reportName: "R1", reportDate: "2026-04-20", fileName: "r1.pdf", createdAt: "2026-04-20T10:00:00Z", createdBy: { _id: "u1", displayName: "A", email: "a@t.com" } },
        { _id: "r2", reportName: "R2", reportDate: "2026-04-21", fileName: "r2.pdf", createdAt: "2026-04-21T10:00:00Z", createdBy: { _id: "u1", displayName: "A", email: "a@t.com" } },
      ],
    });

    render(<ReportsPage />);

    await waitFor(() => {
      expect(screen.getByText("R1")).toBeInTheDocument();
      expect(screen.getByText("R2")).toBeInTheDocument();
    });

    expect(screen.getByText(/reports/)).toBeInTheDocument();
    expect(screen.getByText(/generated/)).toBeInTheDocument();
  });

  it("stays in loading state when profile fetch fails", async () => {
    mockGetUserProfile.mockRejectedValue(new Error("Network error"));

    render(<ReportsPage />);

    await waitFor(() => {
      expect(screen.getByText("Loading reports...")).toBeInTheDocument();
    });

    expect(mockPush).not.toHaveBeenCalled();
    expect(mockGetUserReports).not.toHaveBeenCalled();
  });

  it("shows Back to Dashboard button", async () => {
    mockGetUserProfile.mockResolvedValue({ role: "client_admin" });
    mockGetUserReports.mockResolvedValue({ reports: [] });

    render(<ReportsPage />);

    await waitFor(() => {
      expect(screen.getByText("Back to Dashboard")).toBeInTheDocument();
    });
  });

  it("shows Go to Dashboard button on empty state", async () => {
    mockGetUserProfile.mockResolvedValue({ role: "client_admin" });
    mockGetUserReports.mockResolvedValue({ reports: [] });

    render(<ReportsPage />);

    await waitFor(() => {
      expect(screen.getByText("Go to Dashboard")).toBeInTheDocument();
    });
  });

  it("shows organization name in report card when available", async () => {
    mockGetUserProfile.mockResolvedValue({ role: "client_admin" });
    mockGetUserReports.mockResolvedValue({
      reports: [
        {
          _id: "r1",
          reportName: "Org Report",
          organizationName: "CyberShield Corp",
          reportDate: "2026-04-20",
          fileName: "org.pdf",
          createdAt: "2026-04-20T10:00:00Z",
          createdBy: { _id: "u1", displayName: "Admin", email: "a@t.com" },
        },
      ],
    });

    render(<ReportsPage />);

    await waitFor(() => {
      expect(screen.getByText("CyberShield Corp")).toBeInTheDocument();
    });
  });

  it("shows report date in report card", async () => {
    mockGetUserProfile.mockResolvedValue({ role: "system_admin" });
    mockGetUserReports.mockResolvedValue({
      reports: [
        {
          _id: "r1",
          reportName: "Date Test",
          reportDate: "2026-04-15",
          fileName: "date.pdf",
          createdAt: "2026-04-15T10:00:00Z",
          createdBy: { _id: "u1", displayName: "Admin", email: "a@t.com" },
        },
      ],
    });

    render(<ReportsPage />);

    await waitFor(() => {
      expect(screen.getByText("Date Test")).toBeInTheDocument();
    });
  });

  it("shows user summary stats when reportData includes them", async () => {
    mockGetUserProfile.mockResolvedValue({ role: "system_admin" });
    mockGetUserReports.mockResolvedValue({
      reports: [
        {
          _id: "r1",
          reportName: "Stats Report",
          reportDate: "2026-04-20",
          fileName: "stats.pdf",
          createdAt: "2026-04-20T10:00:00Z",
          createdBy: { _id: "u1", displayName: "Admin", email: "a@t.com" },
          reportData: {
            userSummary: { totalUsers: 25, activeUsers: 20, avgLearningScore: 72 },
            campaignsCount: 5,
          },
        },
      ],
    });

    render(<ReportsPage />);

    await waitFor(() => {
      expect(screen.getByText("Stats Report")).toBeInTheDocument();
    });

    expect(screen.getByText("25 users")).toBeInTheDocument();
    expect(screen.getByText("5 campaigns")).toBeInTheDocument();
  });

  it("shows error state when reports fetch fails", async () => {
    mockGetUserProfile.mockResolvedValue({ role: "system_admin" });
    mockGetUserReports.mockRejectedValue(new Error("Server error"));

    render(<ReportsPage />);

    await waitFor(() => {
      expect(screen.getByText(/Server error/)).toBeInTheDocument();
    });
  });

  it("shows singular 'report' for single report count", async () => {
    mockGetUserProfile.mockResolvedValue({ role: "client_admin" });
    mockGetUserReports.mockResolvedValue({
      reports: [
        {
          _id: "r1",
          reportName: "Only Report",
          reportDate: "2026-04-20",
          fileName: "only.pdf",
          createdAt: "2026-04-20T10:00:00Z",
          createdBy: { _id: "u1", displayName: "Admin", email: "a@t.com" },
        },
      ],
    });

    render(<ReportsPage />);

    await waitFor(() => {
      expect(screen.getByText("Only Report")).toBeInTheDocument();
    });

    expect(screen.getByText(/1/)).toBeInTheDocument();
    expect(screen.getByText(/report/)).toBeInTheDocument();
  });

  it("shows loading state initially", async () => {
    mockGetUserProfile.mockImplementation(() => new Promise(() => {}));

    render(<ReportsPage />);

    expect(screen.getByText("Loading reports...")).toBeInTheDocument();
  });
});
