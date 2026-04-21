import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import { vi, describe, it, expect, beforeEach } from "vitest";
import React from "react";

// ---------------------------------------------------------------------------
// Mocks — destructured from vi.hoisted for auto-hoisting
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

const mockClerk = vi.hoisted(() => ({
  user: { id: "user-1" } as any,
  isLoaded: true,
}));

vi.mock("@clerk/nextjs", () => ({
  useUser: () => ({ user: mockClerk.user, isLoaded: mockClerk.isLoaded }),
  useAuth: () => ({ getToken: vi.fn(async () => "token") }),
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
  default: () => null,
}));

vi.mock("next/link", () => ({
  default: ({ children, href }: any) =>
    React.createElement("a", { href }, children),
}));

import ClientAdminPanel from "@/app/dashboard/organization-management/page";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function setupClientAdmin() {
  mockGetUserProfile.mockResolvedValue({
    _id: "u1",
    role: "client_admin",
    orgId: "org-1",
  });
  mockGetOrgUsers.mockResolvedValue({ users: [] });
  mockGetInviteStatus.mockResolvedValue({ users: [] });
}

function setupClientAdminWithUsers() {
  mockGetUserProfile.mockResolvedValue({
    _id: "u1",
    role: "client_admin",
    orgId: "org-1",
  });
  mockGetOrgUsers.mockResolvedValue({
    users: [
      {
        _id: "user-a",
        email: "alice@uni.edu",
        displayName: "Alice Johnson",
        role: "affiliated",
        status: "active",
        groups: ["CS101"],
        createdAt: "2026-01-15T00:00:00Z",
      },
      {
        _id: "user-b",
        email: "bob@uni.edu",
        displayName: "Bob Smith",
        role: "affiliated",
        status: "invited",
        groups: [],
        createdAt: "2026-02-20T00:00:00Z",
      },
    ],
  });
  mockGetInviteStatus.mockResolvedValue({
    users: [
      {
        _id: "inv-1",
        email: "pending@uni.edu",
        displayName: "Pending User",
        role: "affiliated",
        status: "invited",
        groups: [],
        createdAt: "2026-03-01T00:00:00Z",
      },
    ],
  });
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("ClientAdminPanel", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockClerk.user = { id: "user-1" } as any;
    mockClerk.isLoaded = true;
  });

  it("shows loading spinner when not loaded", () => {
    mockClerk.isLoaded = false;
    mockGetUserProfile.mockResolvedValue({
      _id: "u1",
      role: "client_admin",
      orgId: "org-1",
    });

    render(<ClientAdminPanel />);
    expect(screen.getByText("Loading...")).toBeInTheDocument();
  });

  it("shows access denied for affiliated users", async () => {
    mockGetUserProfile.mockResolvedValue({
      _id: "u1",
      role: "affiliated",
      orgId: "org-1",
    });

    render(<ClientAdminPanel />);

    await waitFor(() => {
      expect(screen.getByText("Access Denied")).toBeInTheDocument();
    });
    expect(
      screen.getByText(
        "This page is only accessible to Client Administrators."
      )
    ).toBeInTheDocument();
  });

  it("shows access denied for system_admin users", async () => {
    mockGetUserProfile.mockResolvedValue({
      _id: "u1",
      role: "system_admin",
    });

    render(<ClientAdminPanel />);

    await waitFor(() => {
      expect(screen.getByText("Access Denied")).toBeInTheDocument();
    });
  });

  it("shows access denied when not signed in", async () => {
    mockClerk.user = null;

    render(<ClientAdminPanel />);

    await waitFor(() => {
      expect(screen.getByText("Access Denied")).toBeInTheDocument();
    });
    expect(
      screen.getByText("Please sign in to access this page.")
    ).toBeInTheDocument();
  });

  it('renders "Organization Management" heading for client_admin', async () => {
    setupClientAdmin();
    render(<ClientAdminPanel />);

    await waitFor(() => {
      expect(screen.getByText("Organization Management")).toBeInTheDocument();
    });
  });

  it('renders "Invite Single User" form', async () => {
    setupClientAdmin();
    render(<ClientAdminPanel />);

    await waitFor(() => {
      expect(screen.getByText("Invite Single User")).toBeInTheDocument();
    });
    expect(screen.getByText("Send Invitation")).toBeInTheDocument();
  });

  it('renders "Bulk Invite Users" form', async () => {
    setupClientAdmin();
    render(<ClientAdminPanel />);

    await waitFor(() => {
      expect(screen.getByText("Bulk Invite Users")).toBeInTheDocument();
    });
  });

  it('shows "All Users" tab with user count', async () => {
    setupClientAdminWithUsers();
    render(<ClientAdminPanel />);

    await waitFor(() => {
      expect(screen.getByText("Alice Johnson")).toBeInTheDocument();
    });

    expect(screen.getByText("All Users")).toBeInTheDocument();
    const allUsersButton = screen.getByText("All Users").closest("button")!;
    expect(allUsersButton.textContent).toContain("2");
  });

  it('shows "Pending Invites" tab', async () => {
    setupClientAdminWithUsers();
    render(<ClientAdminPanel />);

    await waitFor(() => {
      expect(screen.getByText("Pending Invites")).toBeInTheDocument();
    });
  });

  it("displays users table with user data", async () => {
    setupClientAdminWithUsers();
    render(<ClientAdminPanel />);

    await waitFor(() => {
      expect(screen.getByText("Alice Johnson")).toBeInTheDocument();
    });

    expect(screen.getByText("alice@uni.edu")).toBeInTheDocument();
    expect(screen.getByText("Bob Smith")).toBeInTheDocument();
    expect(screen.getByText("bob@uni.edu")).toBeInTheDocument();
    expect(screen.getByText("active")).toBeInTheDocument();
  });

  it('shows "No users found" when users list is empty', async () => {
    setupClientAdmin();
    render(<ClientAdminPanel />);

    await waitFor(() => {
      expect(screen.getByText("No users found")).toBeInTheDocument();
    });
  });

  it("shows success message after successful single invite", async () => {
    setupClientAdmin();
    mockInviteSingleUser.mockResolvedValue({
      message: "Invited",
      userId: "new-u",
      inviteId: "inv-1",
    });

    render(<ClientAdminPanel />);

    await waitFor(() => {
      expect(screen.getByText("Send Invitation")).toBeInTheDocument();
    });

    const emailInput = screen.getByPlaceholderText("student@university.edu");
    fireEvent.change(emailInput, { target: { value: "new@uni.edu" } });

    const submitButton = screen.getByText("Send Invitation");
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(
        screen.getByText("Invitation sent successfully!")
      ).toBeInTheDocument();
    });
  });

  it("shows error on single invite failure", async () => {
    setupClientAdmin();
    mockInviteSingleUser.mockRejectedValue(new Error("User already exists"));

    render(<ClientAdminPanel />);

    await waitFor(() => {
      expect(screen.getByText("Send Invitation")).toBeInTheDocument();
    });

    const emailInput = screen.getByPlaceholderText("student@university.edu");
    fireEvent.change(emailInput, { target: { value: "dup@uni.edu" } });

    const submitButton = screen.getByText("Send Invitation");
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(
        screen.getByText("Failed to send invitation")
      ).toBeInTheDocument();
    });
  });

  it("shows success with successful/failed counts for bulk invite", async () => {
    setupClientAdmin();
    mockBulkInviteUsers.mockResolvedValue({ successful: 3, failed: 1 });

    render(<ClientAdminPanel />);

    await waitFor(() => {
      expect(screen.getByText("Bulk Invite Users")).toBeInTheDocument();
    });

    const textarea = screen.getByPlaceholderText(
      /student1@university\.edu/
    );
    fireEvent.change(textarea, {
      target: { value: "a@uni.edu\nb@uni.edu\nc@uni.edu\nd@uni.edu" },
    });

    const bulkButton = screen.getByText(/Send Bulk Invitations/);
    fireEvent.click(bulkButton);

    await waitFor(() => {
      expect(
        screen.getByText("Bulk invitation completed!")
      ).toBeInTheDocument();
    });

    expect(screen.getByText(/Successful/)).toBeInTheDocument();
    expect(screen.getByText(/3/)).toBeInTheDocument();
    expect(screen.getByText(/Failed/)).toBeInTheDocument();
  });

  it("shows error when no emails provided for bulk invite", async () => {
    setupClientAdmin();

    render(<ClientAdminPanel />);

    await waitFor(() => {
      expect(screen.getByText("Bulk Invite Users")).toBeInTheDocument();
    });

    const bulkButton = screen.getByText(/Send Bulk Invitations/);
    fireEvent.click(bulkButton);

    await waitFor(() => {
      expect(
        screen.getByText("Please enter at least one email address.")
      ).toBeInTheDocument();
    });
  });

  it("shows loading state while fetching users", async () => {
    mockGetUserProfile.mockResolvedValue({
      _id: "u1",
      role: "client_admin",
      orgId: "org-1",
    });
    mockGetOrgUsers.mockImplementation(
      () => new Promise(() => {})
    );
    mockGetInviteStatus.mockResolvedValue({ users: [] });

    render(<ClientAdminPanel />);

    await waitFor(() => {
      expect(screen.getByText("Organization Management")).toBeInTheDocument();
    });

    expect(screen.getByText(/Loading users/)).toBeInTheDocument();
  });
});
