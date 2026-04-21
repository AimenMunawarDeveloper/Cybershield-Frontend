import { render, screen, waitFor } from "@testing-library/react";
import { vi, describe, it, expect, beforeEach } from "vitest";
import React from "react";

// ---------------------------------------------------------------------------
// Mocks — destructured from vi.hoisted for auto-hoisting
// ---------------------------------------------------------------------------

const {
  mockGetUserProfile,
  mockGetCourses,
  mockGetCampaigns,
  mockGetWhatsAppCampaigns,
} = vi.hoisted(() => ({
  mockGetUserProfile: vi.fn(),
  mockGetCourses: vi.fn(),
  mockGetCampaigns: vi.fn(),
  mockGetWhatsAppCampaigns: vi.fn(),
}));

vi.mock("@clerk/nextjs", () => ({
  useUser: () => ({ user: { id: "user-1" }, isLoaded: true }),
  useAuth: () => ({ getToken: vi.fn(async () => "token-123") }),
}));

vi.mock("next/navigation", () => ({
  usePathname: () => "/dashboard",
}));

vi.mock("next/image", () => ({
  default: (props: Record<string, unknown>) =>
    React.createElement("img", { ...props, src: props.src as string }),
}));

vi.mock("@/hooks/useTranslation", () => ({
  useTranslation: () => ({ t: (s: string) => s }),
}));

vi.mock("@/lib/api", () => ({
  ApiClient: vi.fn().mockImplementation(() => ({
    getUserProfile: mockGetUserProfile,
    getCourses: mockGetCourses,
    getCampaigns: mockGetCampaigns,
    getWhatsAppCampaigns: mockGetWhatsAppCampaigns,
  })),
}));

vi.mock("@/components/ui/sidebar", () => ({
  Sidebar: ({ children, ...props }: React.PropsWithChildren<Record<string, unknown>>) =>
    React.createElement("div", { "data-testid": "sidebar" }, children),
  SidebarContent: ({ children }: React.PropsWithChildren) =>
    React.createElement("div", { "data-testid": "sidebar-content" }, children),
  SidebarGroup: ({ children }: React.PropsWithChildren) =>
    React.createElement("div", null, children),
  SidebarGroupContent: ({ children }: React.PropsWithChildren) =>
    React.createElement("div", null, children),
  SidebarGroupLabel: ({ children }: React.PropsWithChildren) =>
    React.createElement("div", null, children),
  SidebarHeader: ({ children }: React.PropsWithChildren) =>
    React.createElement("div", null, children),
  SidebarMenu: ({ children }: React.PropsWithChildren) =>
    React.createElement("ul", null, children),
  SidebarMenuButton: ({ children, ...rest }: React.PropsWithChildren<Record<string, unknown>>) =>
    React.createElement("div", null, children),
  SidebarMenuItem: ({ children }: React.PropsWithChildren) =>
    React.createElement("li", null, children),
  SidebarMenuBadge: ({ children }: React.PropsWithChildren) =>
    React.createElement("span", { "data-testid": "badge" }, children),
}));

import { DashboardSidebar } from "@/components/DashboardSidebar";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function setupRole(role: string) {
  mockGetUserProfile.mockResolvedValue({ role });
  mockGetCourses.mockResolvedValue({ success: true, courses: [{ _id: "c1" }, { _id: "c2" }] });
  mockGetCampaigns.mockResolvedValue({ success: true, data: { campaigns: [{ _id: "e1" }] } });
  mockGetWhatsAppCampaigns.mockResolvedValue({
    success: true,
    data: { campaigns: [{ _id: "w1", managedByParentCampaign: false }] },
  });
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("DashboardSidebar", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders common nav items for all roles", async () => {
    setupRole("affiliated");
    render(<DashboardSidebar />);

    await waitFor(() => {
      expect(screen.getByText("Dashboard")).toBeInTheDocument();
      expect(screen.getByText("Training Modules")).toBeInTheDocument();
      expect(screen.getByText("Certificates")).toBeInTheDocument();
      expect(screen.getByText("Leaderboards")).toBeInTheDocument();
      expect(screen.getByText("Voice Phishing")).toBeInTheDocument();
      expect(screen.getByText("Incident Reporting")).toBeInTheDocument();
    });
  });

  it("hides Campaigns, Reports, and phishing sim links for affiliated users", async () => {
    setupRole("affiliated");
    render(<DashboardSidebar />);

    await waitFor(() => {
      expect(screen.getByText("Dashboard")).toBeInTheDocument();
    });

    expect(screen.queryByText("Campaigns")).not.toBeInTheDocument();
    expect(screen.queryByText("Reports")).not.toBeInTheDocument();
    expect(screen.queryByText("WhatsApp Phishing")).not.toBeInTheDocument();
    expect(screen.queryByText("Email Phishing")).not.toBeInTheDocument();
  });

  it("hides Campaigns, Reports, and phishing sim links for non_affiliated users", async () => {
    setupRole("non_affiliated");
    render(<DashboardSidebar />);

    await waitFor(() => {
      expect(screen.getByText("Dashboard")).toBeInTheDocument();
    });

    expect(screen.queryByText("Campaigns")).not.toBeInTheDocument();
    expect(screen.queryByText("Reports")).not.toBeInTheDocument();
    expect(screen.queryByText("WhatsApp Phishing")).not.toBeInTheDocument();
    expect(screen.queryByText("Email Phishing")).not.toBeInTheDocument();
  });

  it("shows Campaigns, phishing links, and Reports for system_admin", async () => {
    setupRole("system_admin");
    render(<DashboardSidebar />);

    await waitFor(() => {
      expect(screen.getByText("Campaigns")).toBeInTheDocument();
    });

    expect(screen.getByText("WhatsApp Phishing")).toBeInTheDocument();
    expect(screen.getByText("Email Phishing")).toBeInTheDocument();
    expect(screen.getByText("Reports")).toBeInTheDocument();
  });

  it("shows Campaigns, phishing links, and Reports for client_admin", async () => {
    setupRole("client_admin");
    render(<DashboardSidebar />);

    await waitFor(() => {
      expect(screen.getByText("Campaigns")).toBeInTheDocument();
    });

    expect(screen.getByText("WhatsApp Phishing")).toBeInTheDocument();
    expect(screen.getByText("Email Phishing")).toBeInTheDocument();
    expect(screen.getByText("Reports")).toBeInTheDocument();
  });

  it("shows Organizations link only for system_admin", async () => {
    setupRole("system_admin");
    render(<DashboardSidebar />);

    await waitFor(() => {
      expect(screen.getByText("Organizations")).toBeInTheDocument();
    });
  });

  it("shows Organization link only for client_admin", async () => {
    setupRole("client_admin");
    render(<DashboardSidebar />);

    await waitFor(() => {
      expect(screen.getByText("Organization")).toBeInTheDocument();
    });
  });

  it("does not show Organization(s) link for affiliated user", async () => {
    setupRole("affiliated");
    render(<DashboardSidebar />);

    await waitFor(() => {
      expect(screen.getByText("Dashboard")).toBeInTheDocument();
    });

    expect(screen.queryByText("Organizations")).not.toBeInTheDocument();
    expect(screen.queryByText("Organization")).not.toBeInTheDocument();
  });

  it("shows training module count badge", async () => {
    setupRole("system_admin");
    render(<DashboardSidebar />);

    await waitFor(() => {
      const badges = screen.getAllByTestId("badge");
      const texts = badges.map((b) => b.textContent);
      expect(texts).toContain("2");
    });
  });

  it("shows campaigns count badge for admins", async () => {
    setupRole("system_admin");
    render(<DashboardSidebar />);

    await waitFor(() => {
      const badges = screen.getAllByTestId("badge");
      const texts = badges.map((b) => b.textContent);
      expect(texts).toContain("2");
    });
  });
});
