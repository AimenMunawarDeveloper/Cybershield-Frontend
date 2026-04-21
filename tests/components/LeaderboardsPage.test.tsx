import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import { vi, describe, it, expect, beforeEach } from "vitest";
import React from "react";

const {
  mockPush,
  mockGetToken,
  mockGetUserProfile,
  mockGetGlobalLeaderboard,
  mockGetOrganizationLeaderboard,
} = vi.hoisted(() => ({
  mockPush: vi.fn(),
  mockGetToken: vi.fn().mockImplementation(async () => "test-token"),
  mockGetUserProfile: vi.fn(),
  mockGetGlobalLeaderboard: vi.fn(),
  mockGetOrganizationLeaderboard: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush }),
}));

vi.mock("@clerk/nextjs", () => ({
  useAuth: () => ({ getToken: mockGetToken }),
  useUser: () => ({ user: { id: "user1" }, isLoaded: true }),
}));

vi.mock("@/lib/api", () => ({
  ApiClient: vi.fn().mockImplementation(() => ({
    getUserProfile: mockGetUserProfile,
    getGlobalLeaderboard: mockGetGlobalLeaderboard,
    getOrganizationLeaderboard: mockGetOrganizationLeaderboard,
  })),
}));

vi.mock("@/hooks/useTranslation", () => ({
  useTranslation: () => ({
    t: (s: string) => s,
  }),
}));

vi.mock("@/components/NetworkBackground", () => ({
  default: () => React.createElement("div", { "data-testid": "network-bg" }),
}));

import LeaderboardsPage from "@/app/dashboard/leaderboards/page";

describe("LeaderboardsPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetToken.mockImplementation(async () => "test-token");
  });

  it("shows loading state initially", async () => {
    mockGetUserProfile.mockImplementation(() => new Promise(() => {}));
    mockGetGlobalLeaderboard.mockImplementation(() => new Promise(() => {}));

    render(<LeaderboardsPage />);

    expect(screen.getByText("Loading leaderboard...")).toBeInTheDocument();
  });

  it("renders the Leaderboards title and subtitle", async () => {
    mockGetUserProfile.mockResolvedValue({ role: "non_affiliated", orgId: null });
    mockGetGlobalLeaderboard.mockResolvedValue({ success: true, leaderboard: [], total: 0 });

    render(<LeaderboardsPage />);

    await waitFor(() => {
      expect(screen.getByText("Leaderboards")).toBeInTheDocument();
    });

    expect(screen.getByText("Top performers by learning score")).toBeInTheDocument();
    expect(screen.getByText("See how you rank globally or within your organization.")).toBeInTheDocument();
  });

  it("shows global leaderboard with sorted entries", async () => {
    mockGetUserProfile.mockResolvedValue({ role: "non_affiliated", orgId: null });
    mockGetGlobalLeaderboard.mockResolvedValue({
      success: true,
      leaderboard: [
        { position: 1, name: "Alice", email: "alice@test.com", learningScore: 95 },
        { position: 2, name: "Bob", email: "bob@test.com", learningScore: 85 },
        { position: 3, name: "Charlie", email: "charlie@test.com", learningScore: 75 },
        { position: 4, name: "Diana", email: "diana@test.com", learningScore: 65 },
      ],
      total: 4,
    });

    render(<LeaderboardsPage />);

    await waitFor(() => {
      expect(screen.getAllByText("Alice").length).toBeGreaterThanOrEqual(1);
    });

    expect(screen.getAllByText("Bob").length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText("Charlie").length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText("Diana").length).toBeGreaterThanOrEqual(1);
  });

  it("shows top 3 podium section", async () => {
    mockGetUserProfile.mockResolvedValue({ role: "non_affiliated", orgId: null });
    mockGetGlobalLeaderboard.mockResolvedValue({
      success: true,
      leaderboard: [
        { position: 1, name: "First Place", email: "first@test.com", learningScore: 100 },
        { position: 2, name: "Second Place", email: "second@test.com", learningScore: 90 },
        { position: 3, name: "Third Place", email: "third@test.com", learningScore: 80 },
      ],
      total: 3,
    });

    render(<LeaderboardsPage />);

    await waitFor(() => {
      expect(screen.getByText("Top 3")).toBeInTheDocument();
    });

    expect(screen.getAllByText("First Place").length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText("Second Place").length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText("Third Place").length).toBeGreaterThanOrEqual(1);
  });

  it("displays learning scores for each entry", async () => {
    mockGetUserProfile.mockResolvedValue({ role: "non_affiliated", orgId: null });
    mockGetGlobalLeaderboard.mockResolvedValue({
      success: true,
      leaderboard: [
        { position: 1, name: "User1", email: "u1@t.com", learningScore: 88 },
      ],
      total: 1,
    });

    render(<LeaderboardsPage />);

    await waitFor(() => {
      expect(screen.getAllByText("88").length).toBeGreaterThanOrEqual(1);
    });
  });

  it("shows empty state when no global entries", async () => {
    mockGetUserProfile.mockResolvedValue({ role: "non_affiliated", orgId: null });
    mockGetGlobalLeaderboard.mockResolvedValue({ success: true, leaderboard: [], total: 0 });

    render(<LeaderboardsPage />);

    await waitFor(() => {
      expect(screen.getByText("Leaderboards")).toBeInTheDocument();
    });

    await waitFor(() => {
      expect(screen.queryByText("Top 3")).not.toBeInTheDocument();
    });
  });

  it("shows Global tab for non-affiliated users", async () => {
    mockGetUserProfile.mockResolvedValue({ role: "non_affiliated", orgId: null });
    mockGetGlobalLeaderboard.mockResolvedValue({ success: true, leaderboard: [], total: 0 });

    render(<LeaderboardsPage />);

    await waitFor(() => {
      expect(screen.getByText("Global")).toBeInTheDocument();
    });
  });

  it("shows Organization tab for affiliated users", async () => {
    mockGetUserProfile.mockResolvedValue({ role: "affiliated", orgId: "org1" });
    mockGetGlobalLeaderboard.mockResolvedValue({ success: true, leaderboard: [], total: 0 });
    mockGetOrganizationLeaderboard.mockResolvedValue({ success: true, leaderboard: [], total: 0 });

    render(<LeaderboardsPage />);

    await waitFor(() => {
      expect(screen.getByText("Global")).toBeInTheDocument();
    });

    expect(screen.getByText("Organization")).toBeInTheDocument();
  });

  it("shows Organization tab for client_admin", async () => {
    mockGetUserProfile.mockResolvedValue({ role: "client_admin", orgId: "org1" });
    mockGetGlobalLeaderboard.mockResolvedValue({ success: true, leaderboard: [], total: 0 });
    mockGetOrganizationLeaderboard.mockResolvedValue({ success: true, leaderboard: [], total: 0 });

    render(<LeaderboardsPage />);

    await waitFor(() => {
      expect(screen.getByText("Organization")).toBeInTheDocument();
    });
  });

  it("does NOT show Organization tab for non-affiliated users", async () => {
    mockGetUserProfile.mockResolvedValue({ role: "non_affiliated", orgId: null });
    mockGetGlobalLeaderboard.mockResolvedValue({ success: true, leaderboard: [], total: 0 });

    render(<LeaderboardsPage />);

    await waitFor(() => {
      expect(screen.getByText("Global")).toBeInTheDocument();
    });

    expect(screen.queryByText("Organization")).not.toBeInTheDocument();
  });

  it("does NOT show Organization tab for system_admin", async () => {
    mockGetUserProfile.mockResolvedValue({ role: "system_admin", orgId: null });
    mockGetGlobalLeaderboard.mockResolvedValue({ success: true, leaderboard: [], total: 0 });

    render(<LeaderboardsPage />);

    await waitFor(() => {
      expect(screen.getByText("Global")).toBeInTheDocument();
    });

    expect(screen.queryByText("Organization")).not.toBeInTheDocument();
  });

  it("switches between Global and Organization tabs", async () => {
    mockGetUserProfile.mockResolvedValue({ role: "client_admin", orgId: "org1" });
    mockGetGlobalLeaderboard.mockResolvedValue({
      success: true,
      leaderboard: [{ position: 1, name: "Global User", email: "g@t.com", learningScore: 90 }],
      total: 1,
    });
    mockGetOrganizationLeaderboard.mockResolvedValue({
      success: true,
      leaderboard: [{ position: 1, name: "Org User", email: "o@t.com", learningScore: 80, role: "affiliated" }],
      total: 1,
    });

    render(<LeaderboardsPage />);

    await waitFor(() => {
      expect(screen.getAllByText("Global User").length).toBeGreaterThanOrEqual(1);
    });

    fireEvent.click(screen.getByText("Organization"));

    await waitFor(() => {
      expect(screen.getAllByText("Org User").length).toBeGreaterThanOrEqual(1);
    });
  });

  it("shows emails in leaderboard entries", async () => {
    mockGetUserProfile.mockResolvedValue({ role: "non_affiliated", orgId: null });
    mockGetGlobalLeaderboard.mockResolvedValue({
      success: true,
      leaderboard: [
        { position: 1, name: "Test User", email: "test@example.com", learningScore: 75 },
      ],
      total: 1,
    });

    render(<LeaderboardsPage />);

    await waitFor(() => {
      expect(screen.getAllByText("test@example.com").length).toBeGreaterThanOrEqual(1);
    });
  });

  it("shows initials for users in podium", async () => {
    mockGetUserProfile.mockResolvedValue({ role: "non_affiliated", orgId: null });
    mockGetGlobalLeaderboard.mockResolvedValue({
      success: true,
      leaderboard: [
        { position: 1, name: "Alice Brown", email: "ab@t.com", learningScore: 100 },
        { position: 2, name: "Charlie Davis", email: "cd@t.com", learningScore: 90 },
        { position: 3, name: "Eve Fox", email: "ef@t.com", learningScore: 80 },
      ],
      total: 3,
    });

    render(<LeaderboardsPage />);

    await waitFor(() => {
      expect(screen.getByText("AB")).toBeInTheDocument();
      expect(screen.getByText("CD")).toBeInTheDocument();
      expect(screen.getByText("EF")).toBeInTheDocument();
    });
  });

  it("handles API error for global leaderboard gracefully", async () => {
    mockGetUserProfile.mockResolvedValue({ role: "non_affiliated", orgId: null });
    mockGetGlobalLeaderboard.mockRejectedValue(new Error("Network error"));

    render(<LeaderboardsPage />);

    await waitFor(() => {
      expect(screen.getByText("Leaderboards")).toBeInTheDocument();
    });
  });

  it("handles API error for org leaderboard gracefully", async () => {
    mockGetUserProfile.mockResolvedValue({ role: "affiliated", orgId: "org1" });
    mockGetGlobalLeaderboard.mockResolvedValue({ success: true, leaderboard: [], total: 0 });
    mockGetOrganizationLeaderboard.mockRejectedValue(new Error("Org error"));

    render(<LeaderboardsPage />);

    await waitFor(() => {
      expect(screen.getByText("Leaderboards")).toBeInTheDocument();
    });
  });
});
