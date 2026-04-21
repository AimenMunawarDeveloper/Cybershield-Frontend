import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import { vi, describe, it, expect, beforeEach } from "vitest";
import React from "react";

// ---------------------------------------------------------------------------
// Mocks — destructured from vi.hoisted for auto-hoisting
// ---------------------------------------------------------------------------

const {
  mockGetUserProfile,
  mockGetOrganizations,
  mockCreateOrganization,
  mockInviteClientAdmin,
  mockSyncUsersFromClerk,
} = vi.hoisted(() => ({
  mockGetUserProfile: vi.fn(),
  mockGetOrganizations: vi.fn(),
  mockCreateOrganization: vi.fn(),
  mockInviteClientAdmin: vi.fn(),
  mockSyncUsersFromClerk: vi.fn(),
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
    getOrganizations: mockGetOrganizations,
    createOrganization: mockCreateOrganization,
    inviteClientAdmin: mockInviteClientAdmin,
    syncUsersFromClerk: mockSyncUsersFromClerk,
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

import SystemAdminPanel from "@/app/dashboard/organizations-management/page";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function setupSystemAdmin(orgs: any[] = []) {
  mockGetUserProfile.mockResolvedValue({
    _id: "sa1",
    role: "system_admin",
  });
  mockGetOrganizations.mockResolvedValue({ organizations: orgs });
}

const sampleOrgs = [
  {
    _id: "org-1",
    name: "University of Tech",
    description: "A leading tech university",
    clientAdminIds: ["ca1"],
    totalUsers: 120,
    activeUsers: 95,
    invitedUsers: 25,
    createdAt: "2026-01-10T00:00:00Z",
  },
  {
    _id: "org-2",
    name: "Science Academy",
    description: "",
    clientAdminIds: [],
    totalUsers: 50,
    activeUsers: 30,
    invitedUsers: 20,
    createdAt: "2026-02-15T00:00:00Z",
  },
];

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("SystemAdminPanel", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockClerk.user = { id: "user-1" } as any;
    mockClerk.isLoaded = true;
  });

  it("shows access denied for client_admin users", async () => {
    mockGetUserProfile.mockResolvedValue({
      _id: "ca1",
      role: "client_admin",
      orgId: "org-1",
    });
    mockGetOrganizations.mockResolvedValue({ organizations: [] });

    render(<SystemAdminPanel />);

    await waitFor(() => {
      expect(screen.getByText("Access Denied")).toBeInTheDocument();
    });
    expect(
      screen.getByText(
        "This page is only accessible to System Administrators."
      )
    ).toBeInTheDocument();
  });

  it("shows access denied for affiliated users", async () => {
    mockGetUserProfile.mockResolvedValue({
      _id: "u1",
      role: "affiliated",
      orgId: "org-1",
    });
    mockGetOrganizations.mockResolvedValue({ organizations: [] });

    render(<SystemAdminPanel />);

    await waitFor(() => {
      expect(screen.getByText("Access Denied")).toBeInTheDocument();
    });
  });

  it('renders "Organizations Management" heading for system_admin', async () => {
    setupSystemAdmin(sampleOrgs);

    render(<SystemAdminPanel />);

    await waitFor(() => {
      expect(
        screen.getByText("Organizations Management")
      ).toBeInTheDocument();
    });
  });

  it('shows "Create New Organization" form with name and description fields', async () => {
    setupSystemAdmin(sampleOrgs);

    render(<SystemAdminPanel />);

    await waitFor(() => {
      expect(
        screen.getByText("Create New Organization")
      ).toBeInTheDocument();
    });

    expect(screen.getByPlaceholderText("University Name")).toBeInTheDocument();
    expect(
      screen.getByPlaceholderText("Brief description of the organization")
    ).toBeInTheDocument();
  });

  it('shows "Invite Client Administrator" form with email and org dropdown', async () => {
    setupSystemAdmin(sampleOrgs);

    render(<SystemAdminPanel />);

    await waitFor(() => {
      expect(
        screen.getByText("Invite Client Administrator")
      ).toBeInTheDocument();
    });

    expect(
      screen.getByPlaceholderText("admin@university.edu")
    ).toBeInTheDocument();
    expect(screen.getByText("Select organization")).toBeInTheDocument();
  });

  it("displays organizations table with org data", async () => {
    setupSystemAdmin(sampleOrgs);

    render(<SystemAdminPanel />);

    await waitFor(() => {
      expect(screen.getByText("University of Tech")).toBeInTheDocument();
    });

    expect(screen.getByText("Science Academy")).toBeInTheDocument();
    expect(screen.getByText("120")).toBeInTheDocument();
    expect(screen.getByText("95")).toBeInTheDocument();
    expect(screen.getByText("25")).toBeInTheDocument();
    expect(screen.getByText("50")).toBeInTheDocument();
    expect(screen.getByText("30")).toBeInTheDocument();
    expect(screen.getByText("20")).toBeInTheDocument();
  });

  it("shows empty state when no organizations", async () => {
    setupSystemAdmin([]);

    render(<SystemAdminPanel />);

    await waitFor(() => {
      expect(screen.getByText("No organizations found")).toBeInTheDocument();
    });

    expect(
      screen.getByText(
        "Create an organization by using the form above to get started."
      )
    ).toBeInTheDocument();
  });

  it("shows success message after creating an organization", async () => {
    setupSystemAdmin([]);
    mockCreateOrganization.mockResolvedValue({
      message: "Created",
      organization: { _id: "new-org", name: "New Uni" },
    });
    mockGetOrganizations
      .mockResolvedValueOnce({ organizations: [] })
      .mockResolvedValue({ organizations: [] });

    render(<SystemAdminPanel />);

    await waitFor(() => {
      expect(
        screen.getByText("Create New Organization")
      ).toBeInTheDocument();
    });

    const nameInput = screen.getByPlaceholderText("University Name");
    fireEvent.change(nameInput, { target: { value: "New Uni" } });

    const descInput = screen.getByPlaceholderText(
      "Brief description of the organization"
    );
    fireEvent.change(descInput, { target: { value: "A new university" } });

    const createButton = screen.getByText("Create Organization");
    fireEvent.click(createButton);

    await waitFor(() => {
      expect(
        screen.getByText("Organization created successfully!")
      ).toBeInTheDocument();
    });
  });

  it("shows error on duplicate organization name", async () => {
    setupSystemAdmin(sampleOrgs);
    mockCreateOrganization.mockRejectedValue(
      new Error("Organization already exists")
    );

    render(<SystemAdminPanel />);

    await waitFor(() => {
      expect(
        screen.getByText("Create New Organization")
      ).toBeInTheDocument();
    });

    const nameInput = screen.getByPlaceholderText("University Name");
    fireEvent.change(nameInput, { target: { value: "University of Tech" } });

    const createButton = screen.getByText("Create Organization");
    fireEvent.click(createButton);

    await waitFor(() => {
      expect(
        screen.getByText("Failed to create organization")
      ).toBeInTheDocument();
    });
  });

  it("shows success after inviting a client admin", async () => {
    setupSystemAdmin(sampleOrgs);
    mockInviteClientAdmin.mockResolvedValue({
      ok: true,
      message: "Invited",
    });

    render(<SystemAdminPanel />);

    await waitFor(() => {
      expect(screen.getByText("University of Tech")).toBeInTheDocument();
    });

    const emailInput = screen.getByPlaceholderText("admin@university.edu");
    fireEvent.change(emailInput, { target: { value: "newadmin@uni.edu" } });

    const orgDropdown = screen.getByText("Select organization");
    fireEvent.click(orgDropdown);

    await waitFor(() => {
      expect(screen.getAllByText("University of Tech").length).toBeGreaterThanOrEqual(2);
    });

    const dropdownOptions = screen
      .getAllByText("University of Tech")
      .find((el) => el.closest(".dropdown-container button[type='button']"));
    if (dropdownOptions) {
      fireEvent.click(dropdownOptions);
    }

    const sendButton = screen.getByText("Send Invitation");
    fireEvent.click(sendButton);

    await waitFor(() => {
      expect(
        screen.getByText("Invitation sent successfully!")
      ).toBeInTheDocument();
    });
  });

  it("shows error on invite admin failure", async () => {
    setupSystemAdmin(sampleOrgs);
    mockInviteClientAdmin.mockRejectedValue(new Error("Email already in use"));

    render(<SystemAdminPanel />);

    await waitFor(() => {
      expect(screen.getByText("University of Tech")).toBeInTheDocument();
    });

    const emailInput = screen.getByPlaceholderText("admin@university.edu");
    fireEvent.change(emailInput, { target: { value: "dup@uni.edu" } });

    const orgDropdown = screen.getByText("Select organization");
    fireEvent.click(orgDropdown);

    await waitFor(() => {
      expect(screen.getAllByText("University of Tech").length).toBeGreaterThanOrEqual(2);
    });

    const dropdownOptions = screen
      .getAllByText("University of Tech")
      .find((el) => el.closest(".dropdown-container button[type='button']"));
    if (dropdownOptions) {
      fireEvent.click(dropdownOptions);
    }

    const sendButton = screen.getByText("Send Invitation");
    fireEvent.click(sendButton);

    await waitFor(() => {
      expect(
        screen.getByText("Failed to send invitation")
      ).toBeInTheDocument();
    });
  });

  it("disables invite button when no organizations exist", async () => {
    setupSystemAdmin([]);

    render(<SystemAdminPanel />);

    await waitFor(() => {
      expect(screen.getByText("No organizations found")).toBeInTheDocument();
    });

    const sendButton = screen.getByText("Send Invitation");
    expect(sendButton).toBeDisabled();

    expect(
      screen.getByText("No organizations available. Create one first.")
    ).toBeInTheDocument();
  });

  it("refresh button re-fetches organizations", async () => {
    setupSystemAdmin(sampleOrgs);

    render(<SystemAdminPanel />);

    await waitFor(() => {
      expect(screen.getByText("University of Tech")).toBeInTheDocument();
    });

    const initialCallCount = mockGetOrganizations.mock.calls.length;

    const refreshButton = screen.getByText("Refresh");
    fireEvent.click(refreshButton);

    await waitFor(() => {
      expect(mockGetOrganizations.mock.calls.length).toBeGreaterThan(
        initialCallCount
      );
    });
  });
});
