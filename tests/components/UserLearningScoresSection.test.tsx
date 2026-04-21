import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { vi, describe, it, expect, beforeEach } from "vitest";
import React from "react";

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

const { mockGetOrgUsers, mockGetAllUsers, mockGetOrganizations } = vi.hoisted(() => ({
  mockGetOrgUsers: vi.fn(),
  mockGetAllUsers: vi.fn(),
  mockGetOrganizations: vi.fn(),
}));

vi.mock("@/lib/api", () => ({
  ApiClient: vi.fn().mockImplementation(() => ({
    getOrgUsers: mockGetOrgUsers,
    getAllUsers: mockGetAllUsers,
    getOrganizations: mockGetOrganizations,
  })),
}));

vi.mock("@/hooks/useTranslation", () => ({
  useTranslation: () => ({ t: (s: string) => s }),
}));

import UserLearningScoresSection from "@/components/UserLearningScoresSection";

const getToken = vi.fn(async () => "token");

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("UserLearningScoresSection", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns null for non-admin users", () => {
    const { container } = render(
      <UserLearningScoresSection
        getToken={getToken}
        profile={{ _id: "u1", role: "affiliated", orgId: "org1" }}
      />
    );
    expect(container.innerHTML).toBe("");
  });

  it("returns null for non_affiliated users", () => {
    const { container } = render(
      <UserLearningScoresSection
        getToken={getToken}
        profile={{ _id: "u1", role: "non_affiliated" }}
      />
    );
    expect(container.innerHTML).toBe("");
  });

  it("renders learning scores table for client_admin", async () => {
    mockGetOrgUsers.mockResolvedValue({
      users: [
        {
          _id: "u1",
          email: "user1@org.com",
          displayName: "Alice Johnson",
          role: "affiliated",
          learningScore: 65,
          learningScores: { email: 0.8, whatsapp: 0.6, lms: 0.7, voice: 0.5 },
        },
        {
          _id: "u2",
          email: "user2@org.com",
          displayName: "Bob Smith",
          role: "affiliated",
          learningScore: 40,
          learningScores: { email: 0.3, whatsapp: 0.4, lms: 0.5, voice: 0.2 },
        },
      ],
      pagination: { current: 1, pages: 1, total: 2 },
    });

    render(
      <UserLearningScoresSection
        getToken={getToken}
        profile={{ _id: "admin1", role: "client_admin", orgId: "org1" }}
      />
    );

    await waitFor(() => {
      expect(screen.getByText("Learning scores")).toBeInTheDocument();
    });

    expect(screen.getByText("Alice Johnson")).toBeInTheDocument();
    expect(screen.getByText("Bob Smith")).toBeInTheDocument();
    expect(screen.getByText("user1@org.com")).toBeInTheDocument();
    expect(screen.getByText("user2@org.com")).toBeInTheDocument();
  });

  it("system_admin fetches non-affiliated users via getAllUsers", async () => {
    mockGetAllUsers.mockResolvedValue({
      users: [
        {
          _id: "na1",
          email: "na@test.com",
          displayName: "NA Person",
          role: "non_affiliated",
          learningScore: 50,
          learningScores: { email: 0.5, whatsapp: 0.5, lms: 0.5, voice: 0.5 },
        },
        {
          _id: "aff1",
          email: "aff@test.com",
          displayName: "Aff Person",
          role: "affiliated",
          learningScore: 70,
          learningScores: { email: 0.7, whatsapp: 0.7, lms: 0.7, voice: 0.7 },
        },
      ],
      pagination: { current: 1, pages: 1, total: 2 },
    });

    render(
      <UserLearningScoresSection
        getToken={getToken}
        profile={{ _id: "sa1", role: "system_admin" }}
      />
    );

    await waitFor(() => {
      expect(screen.getByText("Learning scores")).toBeInTheDocument();
    });

    expect(screen.getByText("NA Person")).toBeInTheDocument();
    expect(screen.queryByText("Aff Person")).not.toBeInTheDocument();
  });

  it("excludes client_admin and system_admin from the displayed users", async () => {
    mockGetOrgUsers.mockResolvedValue({
      users: [
        { _id: "u1", email: "aff@org.com", displayName: "Regular Member", role: "affiliated", learningScore: 55, learningScores: { email: 0.5, whatsapp: 0.5, lms: 0.5, voice: 0.5 } },
        { _id: "u2", email: "ca@org.com", displayName: "Admin Account", role: "client_admin", learningScore: 90, learningScores: { email: 0.9, whatsapp: 0.9, lms: 0.9, voice: 0.9 } },
      ],
      pagination: { current: 1, pages: 1, total: 2 },
    });

    render(
      <UserLearningScoresSection
        getToken={getToken}
        profile={{ _id: "ca1", role: "client_admin", orgId: "org1" }}
      />
    );

    await waitFor(() => {
      expect(screen.getByText("Regular Member")).toBeInTheDocument();
    });

    expect(screen.queryByText("Admin Account")).not.toBeInTheDocument();
  });

  it("renders tab buttons for different score types", async () => {
    mockGetOrgUsers.mockResolvedValue({
      users: [
        { _id: "u1", email: "u@org.com", displayName: "Tab Tester", role: "affiliated", learningScore: 50, learningScores: { email: 0.5, whatsapp: 0.4, lms: 0.6, voice: 0.3 } },
      ],
      pagination: { current: 1, pages: 1, total: 1 },
    });

    render(
      <UserLearningScoresSection
        getToken={getToken}
        profile={{ _id: "ca1", role: "client_admin", orgId: "org1" }}
      />
    );

    await waitFor(() => {
      expect(screen.getByText("Learning scores")).toBeInTheDocument();
    });

    expect(screen.getByRole("button", { name: "Email" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "WhatsApp" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "LMS" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Voice" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Total" })).toBeInTheDocument();
  });

  it("clicking a tab switches the displayed score type", async () => {
    const user = userEvent.setup();

    mockGetOrgUsers.mockResolvedValue({
      users: [
        {
          _id: "u1",
          email: "u@org.com",
          displayName: "Score Person",
          role: "affiliated",
          learningScore: 50,
          learningScores: { email: 0.82, whatsapp: 0.45, lms: 0.67, voice: 0.33 },
        },
      ],
      pagination: { current: 1, pages: 1, total: 1 },
    });

    render(
      <UserLearningScoresSection
        getToken={getToken}
        profile={{ _id: "ca1", role: "client_admin", orgId: "org1" }}
      />
    );

    await waitFor(() => {
      expect(screen.getByText("Score Person")).toBeInTheDocument();
    });

    // Default tab is Email — score should be 0.82
    expect(screen.getByText("0.82")).toBeInTheDocument();

    // Switch to WhatsApp
    await user.click(screen.getByRole("button", { name: "WhatsApp" }));
    expect(screen.getByText("0.45")).toBeInTheDocument();

    // Switch to Total
    await user.click(screen.getByRole("button", { name: "Total" }));
    expect(screen.getByText("50.0")).toBeInTheDocument();
  });

  it("shows empty state when org has no users", async () => {
    mockGetOrgUsers.mockResolvedValue({
      users: [],
      pagination: { current: 1, pages: 1, total: 0 },
    });

    render(
      <UserLearningScoresSection
        getToken={getToken}
        profile={{ _id: "ca1", role: "client_admin", orgId: "org1" }}
      />
    );

    await waitFor(() => {
      expect(screen.getByText("No users in this organization")).toBeInTheDocument();
    });
  });
});
