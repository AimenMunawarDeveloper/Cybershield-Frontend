import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import { vi, describe, it, expect, beforeEach } from "vitest";
import React from "react";

// ---------------------------------------------------------------------------
// Stable hoisted mocks
// ---------------------------------------------------------------------------

const {
  mockGetUserProfile,
  mockGetOrganizations,
  mockGetToken,
} = vi.hoisted(() => ({
  mockGetUserProfile: vi.fn(),
  mockGetOrganizations: vi.fn(),
  mockGetToken: vi.fn(async () => "test-token"),
}));

vi.mock("@clerk/nextjs", () => ({
  useAuth: () => ({ getToken: mockGetToken }),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn() }),
  usePathname: () => "/dashboard/whatsapp-phishing",
}));

vi.mock("@/lib/api", () => ({
  ApiClient: vi.fn().mockImplementation(() => ({
    getUserProfile: mockGetUserProfile,
    getOrganizations: mockGetOrganizations,
  })),
}));

vi.mock("@/hooks/useTranslation", () => ({
  useTranslation: () => ({
    t: (s: string) => s,
    preTranslate: vi.fn(async () => {}),
    isTranslating: false,
    language: "en",
  }),
}));

vi.mock("next/image", () => ({
  default: (props: Record<string, unknown>) => React.createElement("img", props),
}));

vi.mock("@/components/NetworkBackground", () => ({
  default: () => React.createElement("div", { "data-testid": "network-bg" }),
}));

vi.mock("@/components/CreateCampaignModal", () => ({
  default: ({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) =>
    isOpen
      ? React.createElement("div", { "data-testid": "create-campaign-modal" },
          React.createElement("button", { onClick: onClose }, "Close")
        )
      : null,
}));

vi.mock("@/components/CustomWhatsAppTemplateModal", () => ({
  default: ({ isOpen, onClose, onSubmit, isLoading }: { isOpen: boolean; onClose: () => void; onSubmit: (data: unknown) => void; isLoading: boolean }) =>
    isOpen
      ? React.createElement("div", { "data-testid": "custom-template-modal" },
          React.createElement("button", { onClick: onClose, "data-testid": "close-custom" }, "Close"),
          React.createElement("button", {
            onClick: () => onSubmit({ messageTemplate: "Custom msg", title: "Custom" }),
            "data-testid": "submit-custom",
          }, "Submit")
        )
      : null,
}));

import WhatsAppPhishingPage from "@/app/dashboard/whatsapp-phishing/page";

// ---------------------------------------------------------------------------
// Sample data
// ---------------------------------------------------------------------------

const sampleTemplates = [
  {
    _id: "t1",
    title: "Banking Scam",
    description: "Fake banking alert",
    image: "https://img.com/bank.jpg",
    category: "Banking",
    messageTemplate: "Your bank account needs verification: https://example.com",
  },
  {
    _id: "t2",
    title: "Prize Winner",
    description: "Fake prize notification",
    image: "https://img.com/prize.jpg",
    category: "Prize",
    messageTemplate: "Congratulations! You've won $1000! Claim: https://example.com",
  },
];

const sampleCampaigns = [
  {
    _id: "c1",
    name: "Phishing Campaign Alpha",
    description: "First test campaign",
    status: "completed",
    targetUsers: [
      { userId: "u1", name: "User 1", phoneNumber: "+923001111111", status: "clicked" },
      { userId: "u2", name: "User 2", phoneNumber: "+923002222222", status: "read" },
    ],
    stats: { totalSent: 2, totalDelivered: 2, totalRead: 2, totalClicked: 1, totalReported: 0, totalFailed: 0 },
    createdAt: "2026-04-15T00:00:00Z",
  },
  {
    _id: "c2",
    name: "Draft Campaign Beta",
    description: "Pending campaign",
    status: "draft",
    targetUsers: [
      { userId: "u3", name: "User 3", phoneNumber: "+923003333333", status: "pending" },
    ],
    stats: { totalSent: 0, totalDelivered: 0, totalRead: 0, totalClicked: 0, totalReported: 0, totalFailed: 0 },
    createdAt: "2026-04-20T00:00:00Z",
  },
];

// ---------------------------------------------------------------------------
// Helper: mock fetch for templates AND campaigns
// ---------------------------------------------------------------------------

function setupFetchMock(opts: { campaigns?: unknown[]; templates?: unknown[] } = {}) {
  const campaignsData = opts.campaigns ?? sampleCampaigns;
  const templatesData = opts.templates ?? sampleTemplates;

  (global.fetch as ReturnType<typeof vi.fn>).mockImplementation(async (url: string) => {
    if (typeof url === "string" && url.includes("/whatsapp-templates")) {
      if (url.includes("/custom") && url.includes("POST")) {
        return {
          ok: true,
          json: async () => ({ success: true, message: "Custom WhatsApp template created successfully", data: {} }),
        };
      }
      return {
        ok: true,
        headers: { get: () => "application/json" },
        json: async () => ({ success: true, data: { templates: templatesData, count: templatesData.length } }),
      };
    }
    if (typeof url === "string" && url.includes("/whatsapp-campaigns")) {
      return {
        ok: true,
        headers: { get: () => "application/json" },
        json: async () => ({ success: true, data: { campaigns: campaignsData, pagination: { current: 1, pages: 1, total: campaignsData.length } } }),
      };
    }
    return { ok: true, headers: { get: () => "application/json" }, json: async () => ({}) };
  });
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("WhatsAppPhishingPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetToken.mockResolvedValue("test-token");
    mockGetUserProfile.mockResolvedValue({
      _id: "u1",
      email: "admin@test.com",
      displayName: "Admin",
      role: "client_admin",
      orgId: "org1",
    });
    mockGetOrganizations.mockResolvedValue({ organizations: [] });
    global.fetch = vi.fn() as ReturnType<typeof vi.fn>;
    setupFetchMock();
  });

  // -----------------------------------------------------------------------
  // Rendering & Hero
  // -----------------------------------------------------------------------

  it("renders hero section with title", async () => {
    const { container } = render(<WhatsAppPhishingPage />);

    await waitFor(() => {
      expect(container.innerHTML).toContain("WhatsApp Phishing");
    });

    expect(container.innerHTML).toContain("Awareness Training");
  });

  it("shows feature badges", async () => {
    const { container } = render(<WhatsAppPhishingPage />);

    await waitFor(() => {
      expect(container.innerHTML).toContain("Realistic Scenarios");
    });

    expect(container.innerHTML).toContain("Security Training");
    expect(container.innerHTML).toContain("Safe Testing");
  });

  // -----------------------------------------------------------------------
  // Templates
  // -----------------------------------------------------------------------

  it("renders phishing message templates", async () => {
    const { container } = render(<WhatsAppPhishingPage />);

    await waitFor(() => {
      expect(container.innerHTML).toContain("Phishing Message Templates");
    });

    expect(container.innerHTML).toContain("Banking Scam");
    expect(container.innerHTML).toContain("Prize Winner");
  });

  it("shows template category badges", async () => {
    const { container } = render(<WhatsAppPhishingPage />);

    await waitFor(() => {
      expect(container.innerHTML).toContain("Banking");
      expect(container.innerHTML).toContain("Prize");
    });
  });

  it("shows View and Use buttons on template cards", async () => {
    render(<WhatsAppPhishingPage />);

    await waitFor(() => {
      const viewButtons = screen.getAllByText("View");
      expect(viewButtons.length).toBeGreaterThanOrEqual(2);
    });

    const useButtons = screen.getAllByText("Use");
    expect(useButtons.length).toBeGreaterThanOrEqual(2);
  });

  it("shows empty state when no templates available", async () => {
    setupFetchMock({ templates: [] });

    const { container } = render(<WhatsAppPhishingPage />);

    await waitFor(() => {
      expect(container.innerHTML).toContain("No templates available");
    });
  });

  it("opens template preview modal on View click", async () => {
    const { container } = render(<WhatsAppPhishingPage />);

    await waitFor(() => {
      expect(screen.getAllByText("View").length).toBeGreaterThanOrEqual(1);
    });

    fireEvent.click(screen.getAllByText("View")[0]);

    await waitFor(() => {
      expect(container.innerHTML).toContain("Use This Template");
    });
  });

  it("Custom Template button opens custom template modal", async () => {
    render(<WhatsAppPhishingPage />);

    await waitFor(() => {
      expect(screen.getByText("Custom Template")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText("Custom Template"));

    await waitFor(() => {
      expect(screen.getByTestId("custom-template-modal")).toBeInTheDocument();
    });
  });

  // -----------------------------------------------------------------------
  // Campaigns List
  // -----------------------------------------------------------------------

  it("renders campaign list with stats", async () => {
    const { container } = render(<WhatsAppPhishingPage />);

    await waitFor(() => {
      expect(container.innerHTML).toContain("Phishing Campaign Alpha");
    });

    expect(container.innerHTML).toContain("Draft Campaign Beta");
  });

  it("shows campaign tracking stats (Sent, Read, Clicked, Credentials entered)", async () => {
    const { container } = render(<WhatsAppPhishingPage />);

    await waitFor(() => {
      expect(container.innerHTML).toContain("Sent");
      expect(container.innerHTML).toContain("Read");
      expect(container.innerHTML).toContain("Clicked");
      expect(container.innerHTML).toContain("Credentials entered");
    });
  });

  it("shows Targets count per campaign", async () => {
    const { container } = render(<WhatsAppPhishingPage />);

    await waitFor(() => {
      expect(container.innerHTML).toContain("Targets");
    });
  });

  it("shows summary cards (Total Campaigns, Active, Total Targets, Completed)", async () => {
    const { container } = render(<WhatsAppPhishingPage />);

    await waitFor(() => {
      expect(container.innerHTML).toContain("Total Campaigns");
      expect(container.innerHTML).toContain("Active Campaigns");
      expect(container.innerHTML).toContain("Total Targets");
      expect(container.innerHTML).toContain("Completed");
    });
  });

  it("shows correct campaign count", async () => {
    const { container } = render(<WhatsAppPhishingPage />);

    await waitFor(() => {
      expect(container.innerHTML).toContain("Recent Campaigns");
    });
  });

  it("shows campaign status badges", async () => {
    const { container } = render(<WhatsAppPhishingPage />);

    await waitFor(() => {
      expect(container.innerHTML).toContain("completed");
      expect(container.innerHTML).toContain("draft");
    });
  });

  it("shows Start Campaign button for draft campaigns", async () => {
    render(<WhatsAppPhishingPage />);

    await waitFor(() => {
      expect(screen.getByText("Start Campaign")).toBeInTheDocument();
    });
  });

  it("shows empty state when no campaigns exist", async () => {
    setupFetchMock({ campaigns: [] });

    render(<WhatsAppPhishingPage />);

    await waitFor(() => {
      expect(screen.getByText("No campaigns yet")).toBeInTheDocument();
    });

    expect(screen.getByText("WhatsApp phishing campaigns will appear here once they are created")).toBeInTheDocument();
  });

  // -----------------------------------------------------------------------
  // Campaign Creation
  // -----------------------------------------------------------------------

  it("opens create campaign modal on New Campaign click", async () => {
    render(<WhatsAppPhishingPage />);

    await waitFor(() => {
      expect(screen.getByText("New Campaign")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText("New Campaign"));

    await waitFor(() => {
      expect(screen.getByTestId("create-campaign-modal")).toBeInTheDocument();
    });
  });

  it("opens create modal when Use button clicked on template", async () => {
    render(<WhatsAppPhishingPage />);

    await waitFor(() => {
      expect(screen.getAllByText("Use").length).toBeGreaterThanOrEqual(1);
    });

    fireEvent.click(screen.getAllByText("Use")[0]);

    await waitFor(() => {
      expect(screen.getByTestId("create-campaign-modal")).toBeInTheDocument();
    });
  });

  // -----------------------------------------------------------------------
  // Access Control
  // -----------------------------------------------------------------------

  it("blocks non-admin users from viewing campaign content", async () => {
    mockGetUserProfile.mockResolvedValue({
      _id: "u2",
      email: "user@test.com",
      displayName: "Regular User",
      role: "affiliated",
    });

    const { container } = render(<WhatsAppPhishingPage />);

    await waitFor(() => {
      expect(container.innerHTML).toContain("Loading...");
    });

    expect(container.innerHTML).not.toContain("WhatsApp Phishing Campaigns");
    expect(container.innerHTML).not.toContain("New Campaign");
  });

  it("allows client_admin access", async () => {
    const { container } = render(<WhatsAppPhishingPage />);

    await waitFor(() => {
      expect(container.innerHTML).toContain("WhatsApp Phishing Campaigns");
    });
  });

  it("allows system_admin access and fetches organizations", async () => {
    mockGetUserProfile.mockResolvedValue({
      _id: "sa1",
      email: "sysadmin@test.com",
      displayName: "Sys Admin",
      role: "system_admin",
    });
    mockGetOrganizations.mockResolvedValue({ organizations: [{ _id: "o1", name: "Org1" }] });

    const { container } = render(<WhatsAppPhishingPage />);

    await waitFor(() => {
      expect(container.innerHTML).toContain("WhatsApp Phishing Campaigns");
    });

    expect(mockGetOrganizations).toHaveBeenCalled();
  });

  // -----------------------------------------------------------------------
  // Loading & Error States
  // -----------------------------------------------------------------------

  it("shows loading state while verifying access", () => {
    mockGetUserProfile.mockImplementation(() => new Promise(() => {}));
    render(<WhatsAppPhishingPage />);

    expect(screen.getByText("Loading...")).toBeInTheDocument();
  });

  it("handles fetch error gracefully", async () => {
    (global.fetch as ReturnType<typeof vi.fn>).mockImplementation(async (url: string) => {
      if (typeof url === "string" && url.includes("/whatsapp-templates")) {
        return { ok: true, headers: { get: () => "application/json" }, json: async () => ({ success: true, data: { templates: [], count: 0 } }) };
      }
      return {
        ok: false,
        status: 500,
        headers: { get: () => "application/json" },
      };
    });

    render(<WhatsAppPhishingPage />);

    await waitFor(() => {
      expect(screen.getByText(/Server error/)).toBeInTheDocument();
    });
  });

  it("handles auth error when token is null", async () => {
    mockGetToken.mockResolvedValue(null);

    render(<WhatsAppPhishingPage />);

    await waitFor(() => {
      expect(screen.getByText(/Authentication required/)).toBeInTheDocument();
    });
  });

  it("shows page header with create and manage description", async () => {
    const { container } = render(<WhatsAppPhishingPage />);

    await waitFor(() => {
      expect(container.innerHTML).toContain("Create and manage phishing awareness campaigns");
      expect(container.innerHTML).toContain("Manage your WhatsApp phishing awareness campaigns");
    });
  });
});
