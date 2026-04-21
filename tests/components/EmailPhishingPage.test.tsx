import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import { vi, describe, it, expect, beforeEach } from "vitest";
import React from "react";

// ---------------------------------------------------------------------------
// Stable hoisted mocks
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
  usePathname: () => "/dashboard/email-phishing",
}));

vi.mock("@/lib/api", () => ({
  ApiClient: vi.fn().mockImplementation(() => ({
    getUserProfile: mockGetUserProfile,
  })),
}));

vi.mock("@/hooks/useTranslation", () => ({
  useTranslation: () => ({
    t: (s: string) => s,
    tAsync: vi.fn(async (s: string) => s),
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

vi.mock("@/components/CreateEmailCampaignModal", () => ({
  default: ({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) =>
    isOpen
      ? React.createElement("div", { "data-testid": "send-email-modal" },
          React.createElement("button", { onClick: onClose }, "Close")
        )
      : null,
}));

vi.mock("@/components/CustomEmailTemplateModal", () => ({
  default: ({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) =>
    isOpen
      ? React.createElement("div", { "data-testid": "custom-email-template-modal" },
          React.createElement("button", { onClick: onClose }, "Close")
        )
      : null,
}));

vi.mock("@/components/EmailTemplateViewModal", () => ({
  default: ({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) =>
    isOpen
      ? React.createElement("div", { "data-testid": "email-template-view-modal" },
          React.createElement("button", { onClick: onClose }, "Close")
        )
      : null,
}));

import EmailPhishingPage from "@/app/dashboard/email-phishing/page";

// ---------------------------------------------------------------------------
// Sample data
// ---------------------------------------------------------------------------

const sampleTemplates = [
  {
    _id: "t1",
    title: "Banking Alert",
    description: "Fake banking security alert",
    image: "https://img.com/bank.jpg",
    category: "Banking",
    emailTemplate: { subject: "Account Alert", bodyContent: "Your account is compromised.", linkUrl: "https://phish.com" },
  },
  {
    _id: "t2",
    title: "Password Reset",
    description: "Fake password reset request",
    image: "https://img.com/pass.jpg",
    category: "Security",
    emailTemplate: { subject: "Reset Password", bodyContent: "Click to reset your password.", linkUrl: "" },
  },
];

const sampleEmails = [
  {
    _id: "em1",
    sentBy: "admin@company.com",
    sentTo: "victim1@test.com",
    subject: "Account Alert",
    status: "sent",
    createdAt: "2026-04-20T10:00:00Z",
    openedAt: "2026-04-20T11:00:00Z",
    clickedAt: "2026-04-20T11:30:00Z",
    credentialsEnteredAt: "2026-04-20T12:00:00Z",
  },
  {
    _id: "em2",
    sentBy: "admin@company.com",
    sentTo: "victim2@test.com",
    subject: "Password Reset",
    status: "sent",
    createdAt: "2026-04-19T08:00:00Z",
    openedAt: null,
    clickedAt: null,
    credentialsEnteredAt: null,
  },
  {
    _id: "em3",
    sentBy: "admin@company.com",
    sentTo: "victim3@test.com",
    subject: "Failed Email",
    status: "failed",
    createdAt: "2026-04-18T09:00:00Z",
    error: "Inbox full",
  },
];

// ---------------------------------------------------------------------------
// Helper: mock fetch
// ---------------------------------------------------------------------------

function setupFetchMock(opts: { templates?: unknown[]; emails?: unknown[] } = {}) {
  const templatesData = opts.templates ?? sampleTemplates;
  const emailsData = opts.emails ?? sampleEmails;

  (global.fetch as ReturnType<typeof vi.fn>).mockImplementation(async (url: string, init?: RequestInit) => {
    if (typeof url === "string" && url.includes("/email-templates")) {
      return {
        ok: true,
        json: async () => ({ success: true, data: { templates: templatesData, count: templatesData.length } }),
      };
    }
    if (typeof url === "string" && url.includes("/email-campaigns/send")) {
      return {
        ok: true,
        json: async () => ({ success: true, message: "Email sent", data: { total: 1, successful: 1, failed: 0 } }),
      };
    }
    if (typeof url === "string" && url.includes("/email-campaigns")) {
      return {
        ok: true,
        json: async () => ({ success: true, data: { emails: emailsData, pagination: { current: 1, pages: 1, total: emailsData.length } } }),
      };
    }
    return { ok: true, json: async () => ({}) };
  });
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("EmailPhishingPage", () => {
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
    global.fetch = vi.fn() as ReturnType<typeof vi.fn>;
    setupFetchMock();
  });

  // -----------------------------------------------------------------------
  // Hero & Layout
  // -----------------------------------------------------------------------

  it("renders hero section with title", async () => {
    const { container } = render(<EmailPhishingPage />);

    await waitFor(() => {
      expect(container.innerHTML).toContain("Email Phishing");
    });

    expect(container.innerHTML).toContain("Awareness Training");
  });

  it("shows feature badges", async () => {
    const { container } = render(<EmailPhishingPage />);

    await waitFor(() => {
      expect(container.innerHTML).toContain("Realistic Scenarios");
    });

    expect(container.innerHTML).toContain("Security Training");
    expect(container.innerHTML).toContain("Safe Testing");
  });

  // -----------------------------------------------------------------------
  // Templates
  // -----------------------------------------------------------------------

  it("renders phishing email templates", async () => {
    const { container } = render(<EmailPhishingPage />);

    await waitFor(() => {
      expect(container.innerHTML).toContain("Phishing Email Templates");
    });

    expect(container.innerHTML).toContain("Banking Alert");
    expect(container.innerHTML).toContain("Password Reset");
  });

  it("shows template category badges", async () => {
    const { container } = render(<EmailPhishingPage />);

    await waitFor(() => {
      expect(container.innerHTML).toContain("Banking");
      expect(container.innerHTML).toContain("Security");
    });
  });

  it("shows View and Use buttons on templates", async () => {
    render(<EmailPhishingPage />);

    await waitFor(() => {
      const viewButtons = screen.getAllByText("View");
      expect(viewButtons.length).toBeGreaterThanOrEqual(2);
    });

    const useButtons = screen.getAllByText("Use");
    expect(useButtons.length).toBeGreaterThanOrEqual(2);
  });

  it("shows empty state when no templates", async () => {
    setupFetchMock({ templates: [] });

    const { container } = render(<EmailPhishingPage />);

    await waitFor(() => {
      expect(container.innerHTML).toContain("No templates available");
    });
  });

  it("opens template view modal on View click", async () => {
    render(<EmailPhishingPage />);

    await waitFor(() => {
      expect(screen.getAllByText("View").length).toBeGreaterThanOrEqual(1);
    });

    fireEvent.click(screen.getAllByText("View")[0]);

    await waitFor(() => {
      expect(screen.getByTestId("email-template-view-modal")).toBeInTheDocument();
    });
  });

  it("Custom Template button opens custom template modal", async () => {
    render(<EmailPhishingPage />);

    await waitFor(() => {
      expect(screen.getByText("Custom Template")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText("Custom Template"));

    await waitFor(() => {
      expect(screen.getByTestId("custom-email-template-modal")).toBeInTheDocument();
    });
  });

  // -----------------------------------------------------------------------
  // Email List / Past Campaigns
  // -----------------------------------------------------------------------

  it("renders email list with sent and failed emails", async () => {
    const { container } = render(<EmailPhishingPage />);

    await waitFor(() => {
      expect(container.innerHTML).toContain("Account Alert");
    });

    expect(container.innerHTML).toContain("Password Reset");
    expect(container.innerHTML).toContain("Failed Email");
  });

  it("shows tracking indicators (Opened, Clicked, Credentials entered)", async () => {
    const { container } = render(<EmailPhishingPage />);

    await waitFor(() => {
      expect(container.innerHTML).toContain("Opened");
      expect(container.innerHTML).toContain("Clicked");
      expect(container.innerHTML).toContain("Credentials entered");
    });
  });

  it("shows tracking timestamps (First opened at, First clicked at, Credentials entered at)", async () => {
    const { container } = render(<EmailPhishingPage />);

    await waitFor(() => {
      expect(container.innerHTML).toContain("First opened at");
      expect(container.innerHTML).toContain("First clicked at");
      expect(container.innerHTML).toContain("Credentials entered at");
    });
  });

  it("shows Sent and Failed status badges", async () => {
    const { container } = render(<EmailPhishingPage />);

    await waitFor(() => {
      expect(container.innerHTML).toContain("Sent");
      expect(container.innerHTML).toContain("Failed");
    });
  });

  it("shows To and From fields per email", async () => {
    const { container } = render(<EmailPhishingPage />);

    await waitFor(() => {
      expect(container.innerHTML).toContain("victim1@test.com");
      expect(container.innerHTML).toContain("admin@company.com");
    });
  });

  it("shows Recent Emails section header", async () => {
    const { container } = render(<EmailPhishingPage />);

    await waitFor(() => {
      expect(container.innerHTML).toContain("Recent Emails");
      expect(container.innerHTML).toContain("Manage your email phishing awareness campaigns");
    });
  });

  it("shows empty state when no emails exist", async () => {
    setupFetchMock({ emails: [] });

    render(<EmailPhishingPage />);

    await waitFor(() => {
      expect(screen.getByText("No emails yet")).toBeInTheDocument();
    });

    expect(screen.getByText("Email phishing campaigns will appear here once they are created")).toBeInTheDocument();
  });

  it("shows error message for failed emails", async () => {
    const { container } = render(<EmailPhishingPage />);

    await waitFor(() => {
      expect(container.innerHTML).toContain("Inbox full");
    });
  });

  // -----------------------------------------------------------------------
  // Campaign Creation
  // -----------------------------------------------------------------------

  it("shows New Campaign button", async () => {
    render(<EmailPhishingPage />);

    await waitFor(() => {
      expect(screen.getByText("New Campaign")).toBeInTheDocument();
    });
  });

  it("opens send email modal on New Campaign click", async () => {
    render(<EmailPhishingPage />);

    await waitFor(() => {
      expect(screen.getByText("New Campaign")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText("New Campaign"));

    await waitFor(() => {
      expect(screen.getByTestId("send-email-modal")).toBeInTheDocument();
    });
  });

  it("shows page header with campaign management title", async () => {
    const { container } = render(<EmailPhishingPage />);

    await waitFor(() => {
      expect(container.innerHTML).toContain("Email Phishing Campaigns");
      expect(container.innerHTML).toContain("Create and manage phishing awareness campaigns");
    });
  });

  // -----------------------------------------------------------------------
  // Access Control — pages not visible to regular users
  // -----------------------------------------------------------------------

  it("shows Access Restricted for non-admin users (affiliated)", async () => {
    mockGetUserProfile.mockResolvedValue({
      _id: "u2",
      email: "user@test.com",
      displayName: "Regular User",
      role: "affiliated",
    });

    render(<EmailPhishingPage />);

    await waitFor(() => {
      expect(screen.getByText("Access Restricted")).toBeInTheDocument();
    });
  });

  it("shows Access Restricted for non-affiliated users", async () => {
    mockGetUserProfile.mockResolvedValue({
      _id: "u3",
      email: "nonaffil@test.com",
      displayName: "Non-Affiliated",
      role: "non_affiliated",
    });

    render(<EmailPhishingPage />);

    await waitFor(() => {
      expect(screen.getByText("Access Restricted")).toBeInTheDocument();
    });
  });

  it("allows client_admin access", async () => {
    const { container } = render(<EmailPhishingPage />);

    await waitFor(() => {
      expect(container.innerHTML).toContain("Email Phishing Campaigns");
    });
  });

  it("allows system_admin access", async () => {
    mockGetUserProfile.mockResolvedValue({
      _id: "sa1",
      email: "sysadmin@test.com",
      displayName: "Sys Admin",
      role: "system_admin",
    });

    const { container } = render(<EmailPhishingPage />);

    await waitFor(() => {
      expect(container.innerHTML).toContain("Email Phishing Campaigns");
    });
  });

  // -----------------------------------------------------------------------
  // Loading & Error
  // -----------------------------------------------------------------------

  it("shows loading state while verifying access", () => {
    mockGetUserProfile.mockImplementation(() => new Promise(() => {}));
    const { container } = render(<EmailPhishingPage />);

    expect(container.innerHTML).toContain("Loading...");
  });

  it("shows access error when profile fetch fails", async () => {
    mockGetUserProfile.mockRejectedValue(new Error("Network error"));

    render(<EmailPhishingPage />);

    await waitFor(() => {
      expect(screen.getByText("Access Restricted")).toBeInTheDocument();
    });
  });
});
