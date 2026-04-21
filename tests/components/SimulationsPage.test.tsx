import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import { vi, describe, it, expect, beforeEach } from "vitest";
import React from "react";

// ---------------------------------------------------------------------------
// Stable mocks
// ---------------------------------------------------------------------------

const {
  mockGetUserProfile,
  mockGetToken,
} = vi.hoisted(() => ({
  mockGetUserProfile: vi.fn(),
  mockGetToken: vi.fn(async () => "test-token"),
}));

vi.mock("@clerk/nextjs", () => ({
  useAuth: () => ({ getToken: mockGetToken }),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn() }),
  usePathname: () => "/dashboard/simulations",
}));

vi.mock("@/lib/api", () => ({
  ApiClient: vi.fn().mockImplementation(() => ({
    getUserProfile: mockGetUserProfile,
  })),
}));

vi.mock("@/hooks/useTranslation", () => ({
  useTranslation: () => ({
    t: (s: string) => s,
    preTranslate: vi.fn(async () => {}),
    language: "en",
  }),
}));

vi.mock("@/components/NetworkBackground", () => ({
  default: () => React.createElement("div", { "data-testid": "network-bg" }),
}));

vi.mock("@/components/CreateUnifiedCampaignModal", () => ({
  default: ({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) =>
    isOpen
      ? React.createElement("div", { "data-testid": "create-modal" },
          React.createElement("button", { onClick: onClose }, "Close Modal")
        )
      : null,
}));

vi.mock("@/components/CampaignDetailModal", () => ({
  default: ({ isOpen }: { isOpen: boolean }) =>
    isOpen ? React.createElement("div", { "data-testid": "detail-modal" }) : null,
}));

import SimulationsPage from "@/app/dashboard/simulations/page";

// ---------------------------------------------------------------------------
// Sample data
// ---------------------------------------------------------------------------

const sampleCampaigns = [
  {
    _id: "c1",
    name: "Phishing Campaign 1",
    description: "Test phishing",
    status: "draft",
    whatsappConfig: { enabled: true },
    emailConfig: { enabled: true },
    targetUsers: [
      { name: "User 1", email: "u1@test.com", phoneNumber: "+1234", emailStatus: "pending", whatsappStatus: "pending" },
    ],
    stats: {
      totalEmailTargets: 1, totalEmailSent: 0, totalEmailDelivered: 0,
      totalEmailOpened: 0, totalEmailClicked: 0, totalEmailFailed: 0,
      totalWhatsappTargets: 1, totalWhatsappSent: 0, totalWhatsappDelivered: 0,
      totalWhatsappRead: 0, totalWhatsappClicked: 0, totalWhatsappFailed: 0,
    },
    createdAt: "2026-04-20T00:00:00Z",
  },
  {
    _id: "c2",
    name: "Running Campaign",
    description: "Active campaign",
    status: "running",
    whatsappConfig: { enabled: false },
    emailConfig: { enabled: true },
    targetUsers: [
      { name: "User 2", email: "u2@test.com", emailStatus: "sent", whatsappStatus: "not_applicable" },
    ],
    stats: {
      totalEmailTargets: 1, totalEmailSent: 1, totalEmailDelivered: 1,
      totalEmailOpened: 0, totalEmailClicked: 0, totalEmailFailed: 0,
      totalWhatsappTargets: 0, totalWhatsappSent: 0, totalWhatsappDelivered: 0,
      totalWhatsappRead: 0, totalWhatsappClicked: 0, totalWhatsappFailed: 0,
    },
    createdAt: "2026-04-19T00:00:00Z",
  },
];

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("SimulationsPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetToken.mockResolvedValue("test-token");
    mockGetUserProfile.mockResolvedValue({
      _id: "u1",
      email: "admin@test.com",
      displayName: "Admin",
      role: "system_admin",
    });
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        success: true,
        data: { campaigns: sampleCampaigns, pagination: { current: 1, pages: 1, total: 2 } },
      }),
    }) as ReturnType<typeof vi.fn>;
  });

  it("renders campaign list after loading", async () => {
    const { container } = render(<SimulationsPage />);

    await waitFor(() => {
      expect(container.innerHTML).toContain("All Campaigns");
    });

    expect(container.innerHTML).toContain("Phishing Campaign 1");
    expect(container.innerHTML).toContain("Running Campaign");
  });

  it("shows hero section with title and description", async () => {
    const { container } = render(<SimulationsPage />);

    await waitFor(() => {
      expect(container.innerHTML).toContain("Campaign Simulations");
    });

    expect(container.innerHTML).toContain("Unified Multi-Channel Security Training");
    expect(container.innerHTML).toContain("Create and manage comprehensive phishing campaigns");
  });

  it("shows feature badges in hero", async () => {
    const { container } = render(<SimulationsPage />);

    await waitFor(() => {
      expect(container.innerHTML).toContain("Multi-Channel");
    });

    expect(container.innerHTML).toContain("Unified Analytics");
    expect(container.innerHTML).toContain("Smart Scheduling");
  });

  it("shows Create Campaign button", async () => {
    render(<SimulationsPage />);

    await waitFor(() => {
      expect(screen.getByText("Create Campaign")).toBeInTheDocument();
    });
  });

  it("shows empty state when no campaigns", async () => {
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: true,
      json: async () => ({ success: true, data: { campaigns: [] } }),
    });

    render(<SimulationsPage />);

    await waitFor(() => {
      expect(screen.getByText("No campaigns yet")).toBeInTheDocument();
    });

    expect(screen.getByText("Create your first unified campaign to get started")).toBeInTheDocument();
  });

  it("shows access restricted for non-admin users", async () => {
    mockGetUserProfile.mockResolvedValue({
      _id: "u2",
      email: "user@test.com",
      displayName: "User",
      role: "affiliated",
    });

    render(<SimulationsPage />);

    await waitFor(() => {
      expect(screen.getByText("Access Restricted")).toBeInTheDocument();
    });
  });

  it("allows client_admin access", async () => {
    mockGetUserProfile.mockResolvedValue({
      _id: "u3",
      email: "ca@test.com",
      displayName: "Client Admin",
      role: "client_admin",
    });

    const { container } = render(<SimulationsPage />);

    await waitFor(() => {
      expect(container.innerHTML).toContain("All Campaigns");
    });
  });

  it("opens create modal when button clicked", async () => {
    render(<SimulationsPage />);

    await waitFor(() => {
      expect(screen.getByText("Create Campaign")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText("Create Campaign"));

    await waitFor(() => {
      expect(screen.getByTestId("create-modal")).toBeInTheDocument();
    });
  });

  it("shows campaign status badges", async () => {
    const { container } = render(<SimulationsPage />);

    await waitFor(() => {
      expect(container.innerHTML).toContain("Draft");
      expect(container.innerHTML).toContain("Running");
    });
  });

  it("shows channel indicators on campaign cards", async () => {
    const { container } = render(<SimulationsPage />);

    await waitFor(() => {
      expect(container.innerHTML).toContain("Email");
      expect(container.innerHTML).toContain("WhatsApp");
    });
  });

  it("shows Manage your multi-channel phishing simulations", async () => {
    const { container } = render(<SimulationsPage />);

    await waitFor(() => {
      expect(container.innerHTML).toContain("Manage your multi-channel phishing simulations");
    });
  });

  it("shows loading state initially", () => {
    mockGetUserProfile.mockImplementation(() => new Promise(() => {}));
    render(<SimulationsPage />);

    expect(screen.getByText("Loading...")).toBeInTheDocument();
  });

  it("handles fetch error gracefully", async () => {
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: false,
      status: 500,
    });

    render(<SimulationsPage />);

    await waitFor(() => {
      expect(screen.getByText(/Server error/)).toBeInTheDocument();
    });
  });

  it("handles auth error when token is null", async () => {
    mockGetToken.mockResolvedValue(null);

    render(<SimulationsPage />);

    await waitFor(() => {
      expect(screen.getByText(/Authentication required/)).toBeInTheDocument();
    });
  });

  it("shows target count per campaign card", async () => {
    const { container } = render(<SimulationsPage />);

    await waitFor(() => {
      expect(container.innerHTML).toContain("Targets");
    });
  });
});
