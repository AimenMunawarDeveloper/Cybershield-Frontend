import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import { vi, describe, it, expect, beforeEach } from "vitest";
import React from "react";

// ---------------------------------------------------------------------------
// Mocks for System Admin Organizations Management page
// ---------------------------------------------------------------------------

const {
  mockGetUserProfile,
  mockGetOrganizations,
  mockCreateOrganization,
  mockInviteClientAdmin,
} = vi.hoisted(() => ({
  mockGetUserProfile: vi.fn(),
  mockGetOrganizations: vi.fn(),
  mockCreateOrganization: vi.fn(),
  mockInviteClientAdmin: vi.fn(),
}));

vi.mock("@clerk/nextjs", () => ({
  useUser: () => ({ user: { id: "admin-1" }, isLoaded: true }),
  useAuth: () => ({ getToken: vi.fn(async () => "token") }),
}));

vi.mock("next/link", () => ({
  default: ({ children, href }: { children: React.ReactNode; href: string }) =>
    React.createElement("a", { href }, children),
}));

vi.mock("@/lib/api", () => ({
  ApiClient: vi.fn().mockImplementation(() => ({
    getUserProfile: mockGetUserProfile,
    getOrganizations: mockGetOrganizations,
    createOrganization: mockCreateOrganization,
    inviteClientAdmin: mockInviteClientAdmin,
    syncUsersFromClerk: vi.fn().mockResolvedValue({ results: {} }),
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

import SystemAdminPanel from "@/app/dashboard/organizations-management/page";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
const orgList = [
  {
    _id: "org1",
    name: "Alpha Corp",
    description: "First org",
    clientAdminIds: ["admin1"],
    totalUsers: 10,
    activeUsers: 8,
    invitedUsers: 2,
    createdAt: "2026-01-15T00:00:00Z",
  },
  {
    _id: "org2",
    name: "Beta Inc",
    description: "",
    clientAdminIds: [],
    totalUsers: 5,
    activeUsers: 5,
    invitedUsers: 0,
    createdAt: "2026-03-01T00:00:00Z",
  },
];

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("SystemAdminPanel — Organizations Management", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetUserProfile.mockResolvedValue({ _id: "admin1", role: "system_admin" });
    mockGetOrganizations.mockResolvedValue({ organizations: orgList });
  });

  it("renders page title for system admin", async () => {
    render(<SystemAdminPanel />);

    await waitFor(() => {
      expect(screen.getByText("Organizations Management")).toBeInTheDocument();
    });
  });

  it("displays organizations table", async () => {
    render(<SystemAdminPanel />);

    await waitFor(() => {
      expect(screen.getByText("Alpha Corp")).toBeInTheDocument();
    });

    expect(screen.getByText("Beta Inc")).toBeInTheDocument();
  });

  it("shows organization user counts", async () => {
    render(<SystemAdminPanel />);

    await waitFor(() => {
      expect(screen.getByText("Alpha Corp")).toBeInTheDocument();
    });

    expect(screen.getByText("10")).toBeInTheDocument();
    expect(screen.getByText("8")).toBeInTheDocument();
  });

  it("fetches profile and orgs on load", async () => {
    render(<SystemAdminPanel />);

    await waitFor(() => {
      expect(mockGetUserProfile).toHaveBeenCalled();
    });

    await waitFor(() => {
      expect(mockGetOrganizations).toHaveBeenCalled();
    });
  });

  it("shows create organization form", async () => {
    render(<SystemAdminPanel />);

    await waitFor(() => {
      expect(screen.getByText("Create New Organization")).toBeInTheDocument();
    });

    expect(screen.getByPlaceholderText("University Name")).toBeInTheDocument();
  });

  it("submits create organization form", async () => {
    mockCreateOrganization.mockResolvedValue({
      message: "Organization created successfully",
      organization: { _id: "org3", name: "New Org" },
    });

    render(<SystemAdminPanel />);

    await waitFor(() => {
      expect(screen.getByPlaceholderText("University Name")).toBeInTheDocument();
    });

    const nameInput = screen.getByPlaceholderText("University Name");
    fireEvent.change(nameInput, { target: { value: "New Org" } });

    const descInput = screen.getByPlaceholderText("Brief description of the organization");
    fireEvent.change(descInput, { target: { value: "Description" } });

    fireEvent.click(screen.getByRole("button", { name: /Create Organization/i }));

    await waitFor(() => {
      expect(mockCreateOrganization).toHaveBeenCalledWith("New Org", "Description");
    });
  });

  it("shows success message after creating organization", async () => {
    mockCreateOrganization.mockResolvedValue({
      message: "Organization created successfully",
    });

    render(<SystemAdminPanel />);

    await waitFor(() => {
      expect(screen.getByPlaceholderText("University Name")).toBeInTheDocument();
    });

    fireEvent.change(screen.getByPlaceholderText("University Name"), {
      target: { value: "Success Org" },
    });

    fireEvent.click(screen.getByRole("button", { name: /Create Organization/i }));

    await waitFor(() => {
      expect(screen.getByText("Organization created successfully!")).toBeInTheDocument();
    });
  });

  it("shows error message when create fails", async () => {
    mockCreateOrganization.mockRejectedValue(
      new Error("Organization with this name already exists")
    );

    render(<SystemAdminPanel />);

    await waitFor(() => {
      expect(screen.getByPlaceholderText("University Name")).toBeInTheDocument();
    });

    fireEvent.change(screen.getByPlaceholderText("University Name"), {
      target: { value: "Duplicate Org" },
    });

    fireEvent.click(screen.getByRole("button", { name: /Create Organization/i }));

    await waitFor(() => {
      expect(screen.getByText("Organization with this name already exists")).toBeInTheDocument();
    });
  });

  it("shows invite client admin form", async () => {
    render(<SystemAdminPanel />);

    await waitFor(() => {
      expect(screen.getByText("Invite Client Administrator")).toBeInTheDocument();
    });

    expect(screen.getByPlaceholderText("admin@university.edu")).toBeInTheDocument();
  });

  it("submits invite client admin form", async () => {
    mockInviteClientAdmin.mockResolvedValue({ ok: true, message: "Invitation sent" });

    render(<SystemAdminPanel />);

    await waitFor(() => {
      expect(screen.getByText("Alpha Corp")).toBeInTheDocument();
    });

    fireEvent.change(screen.getByPlaceholderText("admin@university.edu"), {
      target: { value: "newclient@test.com" },
    });

    // Open org dropdown and select Alpha Corp
    fireEvent.click(screen.getByText("Select organization"));

    await waitFor(() => {
      const orgOptions = screen.getAllByRole("button", { name: /Alpha Corp/ });
      fireEvent.click(orgOptions[0]);
    });

    fireEvent.click(screen.getByRole("button", { name: /Send Invitation/i }));

    await waitFor(() => {
      expect(mockInviteClientAdmin).toHaveBeenCalledWith(
        "newclient@test.com",
        "Alpha Corp"
      );
    });
  });

  it("shows success after inviting client admin", async () => {
    mockInviteClientAdmin.mockResolvedValue({ ok: true });

    render(<SystemAdminPanel />);

    await waitFor(() => {
      expect(screen.getByText("Alpha Corp")).toBeInTheDocument();
    });

    fireEvent.change(screen.getByPlaceholderText("admin@university.edu"), {
      target: { value: "ca@test.com" },
    });

    fireEvent.click(screen.getByText("Select organization"));

    await waitFor(() => {
      const orgOptions = screen.getAllByRole("button", { name: /Alpha Corp/ });
      fireEvent.click(orgOptions[0]);
    });

    fireEvent.click(screen.getByRole("button", { name: /Send Invitation/i }));

    await waitFor(() => {
      expect(screen.getByText(/Invitation sent successfully/)).toBeInTheDocument();
    });
  });

  it("shows error when invite fails", async () => {
    mockInviteClientAdmin.mockRejectedValue(new Error("User already exists"));

    render(<SystemAdminPanel />);

    await waitFor(() => {
      expect(screen.getByText("Alpha Corp")).toBeInTheDocument();
    });

    fireEvent.change(screen.getByPlaceholderText("admin@university.edu"), {
      target: { value: "existing@test.com" },
    });

    fireEvent.click(screen.getByText("Select organization"));

    await waitFor(() => {
      const orgOptions = screen.getAllByRole("button", { name: /Alpha Corp/ });
      fireEvent.click(orgOptions[0]);
    });

    fireEvent.click(screen.getByRole("button", { name: /Send Invitation/i }));

    await waitFor(() => {
      expect(screen.getByText("User already exists")).toBeInTheDocument();
    });
  });

  it("shows error when invite sent without selecting org", async () => {
    render(<SystemAdminPanel />);

    await waitFor(() => {
      expect(screen.getByText("Alpha Corp")).toBeInTheDocument();
    });

    fireEvent.change(screen.getByPlaceholderText("admin@university.edu"), {
      target: { value: "test@test.com" },
    });

    fireEvent.click(screen.getByRole("button", { name: /Send Invitation/i }));

    await waitFor(() => {
      expect(screen.getByText("Please select an organization")).toBeInTheDocument();
    });
  });

  it("shows non-admin access denied for non-system_admin", async () => {
    mockGetUserProfile.mockResolvedValue({ _id: "user1", role: "affiliated" });

    render(<SystemAdminPanel />);

    await waitFor(() => {
      expect(
        screen.getByText("This page is only accessible to System Administrators.")
      ).toBeInTheDocument();
    });
  });

  it("shows empty state when no organizations exist", async () => {
    mockGetOrganizations.mockResolvedValue({ organizations: [] });

    render(<SystemAdminPanel />);

    await waitFor(() => {
      expect(screen.getByText("No organizations found")).toBeInTheDocument();
    });
  });
});
