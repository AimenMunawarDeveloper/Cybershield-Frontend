import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import { vi, describe, it, expect, beforeEach } from "vitest";
import React from "react";

// ---------------------------------------------------------------------------
// Mocks for Client Admin Organization Management page
// ---------------------------------------------------------------------------

const {
  mockGetUserProfile,
  mockGetOrgUsers,
  mockGetInviteStatus,
  mockInviteSingleUser,
  mockBulkInviteUsers,
} = vi.hoisted(() => ({
  mockGetUserProfile: vi.fn(),
  mockGetOrgUsers: vi.fn(),
  mockGetInviteStatus: vi.fn(),
  mockInviteSingleUser: vi.fn(),
  mockBulkInviteUsers: vi.fn(),
}));

vi.mock("@clerk/nextjs", () => ({
  useUser: () => ({ user: { id: "user-1" }, isLoaded: true }),
  useAuth: () => ({ getToken: vi.fn(async () => "token") }),
}));

vi.mock("next/link", () => ({
  default: ({ children, href }: { children: React.ReactNode; href: string }) =>
    React.createElement("a", { href }, children),
}));

vi.mock("@/lib/api", () => ({
  ApiClient: vi.fn().mockImplementation(() => ({
    getUserProfile: mockGetUserProfile,
    getOrgUsers: mockGetOrgUsers,
    getInviteStatus: mockGetInviteStatus,
    inviteSingleUser: mockInviteSingleUser,
    bulkInviteUsers: mockBulkInviteUsers,
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

import ClientAdminPanel from "@/app/dashboard/organization-management/page";

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("ClientAdminPanel — Organization Management", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetUserProfile.mockResolvedValue({ _id: "user1", orgId: "org1", role: "client_admin" });
    mockGetOrgUsers.mockResolvedValue({
      users: [
        {
          _id: "u1",
          email: "user1@test.com",
          displayName: "User One",
          role: "affiliated",
          status: "active",
          groups: ["Engineering"],
          learningScore: 75,
          createdAt: "2026-04-20T00:00:00Z",
        },
        {
          _id: "u2",
          email: "user2@test.com",
          displayName: "User Two",
          role: "affiliated",
          status: "active",
          groups: [],
          learningScore: 50,
          createdAt: "2026-04-19T00:00:00Z",
        },
      ],
      pagination: { current: 1, pages: 1, total: 2 },
    });
    mockGetInviteStatus.mockResolvedValue({
      users: [
        {
          _id: "u3",
          email: "invited@test.com",
          displayName: "Invited User",
          status: "invited",
          groups: [],
          createdAt: "2026-04-21T00:00:00Z",
        },
      ],
      pagination: { current: 1, pages: 1, total: 1 },
    });
  });

  it("renders page title and invite form", async () => {
    render(<ClientAdminPanel />);

    await waitFor(() => {
      expect(screen.getByText("Organization Management")).toBeInTheDocument();
    });

    expect(screen.getByText("Invite Single User")).toBeInTheDocument();
  });

  it("displays users in the users tab", async () => {
    render(<ClientAdminPanel />);

    await waitFor(() => {
      expect(screen.getByText("user1@test.com")).toBeInTheDocument();
    });

    expect(screen.getByText("user2@test.com")).toBeInTheDocument();
  });

  it("fetches user profile and org data on load", async () => {
    render(<ClientAdminPanel />);

    await waitFor(() => {
      expect(mockGetUserProfile).toHaveBeenCalled();
    });

    await waitFor(() => {
      expect(mockGetOrgUsers).toHaveBeenCalledWith("org1");
      expect(mockGetInviteStatus).toHaveBeenCalledWith("org1");
    });
  });

  it("submits single invite form", async () => {
    mockInviteSingleUser.mockResolvedValue({ message: "Invitation sent" });

    render(<ClientAdminPanel />);

    await waitFor(() => {
      expect(screen.getByText("Organization Management")).toBeInTheDocument();
    });

    const emailInput = screen.getByPlaceholderText("student@university.edu");
    fireEvent.change(emailInput, { target: { value: "newinvite@test.com" } });

    const sendButton = screen.getByText("Send Invitation");
    fireEvent.click(sendButton);

    await waitFor(() => {
      expect(mockInviteSingleUser).toHaveBeenCalledWith(
        "org1",
        "newinvite@test.com",
        undefined,
        undefined
      );
    });
  });

  it("shows success message after single invite", async () => {
    mockInviteSingleUser.mockResolvedValue({ message: "Invitation sent" });

    render(<ClientAdminPanel />);

    await waitFor(() => {
      expect(screen.getByText("Organization Management")).toBeInTheDocument();
    });

    const emailInput = screen.getByPlaceholderText("student@university.edu");
    fireEvent.change(emailInput, { target: { value: "success@test.com" } });
    fireEvent.click(screen.getByText("Send Invitation"));

    await waitFor(() => {
      expect(screen.getByText("Invitation sent successfully!")).toBeInTheDocument();
    });
  });

  it("shows error message when single invite fails", async () => {
    mockInviteSingleUser.mockRejectedValue(new Error("User already exists"));

    render(<ClientAdminPanel />);

    await waitFor(() => {
      expect(screen.getByText("Organization Management")).toBeInTheDocument();
    });

    const emailInput = screen.getByPlaceholderText("student@university.edu");
    fireEvent.change(emailInput, { target: { value: "existing@test.com" } });
    fireEvent.click(screen.getByText("Send Invitation"));

    await waitFor(() => {
      expect(screen.getByText("User already exists")).toBeInTheDocument();
    });
  });

  it("has bulk invite section with textarea", async () => {
    render(<ClientAdminPanel />);

    await waitFor(() => {
      expect(screen.getByText("Bulk Invite Users")).toBeInTheDocument();
    });

    expect(screen.getByPlaceholderText(/student1@university\.edu/)).toBeInTheDocument();
  });

  it("switches between users and invites tabs", async () => {
    render(<ClientAdminPanel />);

    await waitFor(() => {
      expect(screen.getByText("user1@test.com")).toBeInTheDocument();
    });

    const invitesTab = screen.getByText("Pending Invites");
    fireEvent.click(invitesTab);

    await waitFor(() => {
      expect(screen.getByText("invited@test.com")).toBeInTheDocument();
    });
  });

  it("shows loading state initially", async () => {
    mockGetUserProfile.mockImplementation(() => new Promise(() => {}));

    render(<ClientAdminPanel />);

    await waitFor(() => {
      expect(screen.getByText(/Loading/)).toBeInTheDocument();
    });
  });
});
