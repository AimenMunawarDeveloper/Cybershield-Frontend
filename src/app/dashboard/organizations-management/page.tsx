"use client";

import { useUser, useAuth } from "@clerk/nextjs";
import { useEffect, useState } from "react";
import { ApiClient } from "@/lib/api";
import Link from "next/link";

interface Organization {
  _id: string;
  name: string;
  description?: string;
  clientAdminIds: string[];
  totalUsers: number;
  activeUsers: number;
  invitedUsers: number;
  createdAt: string;
}

export default function SystemAdminPanel() {
  const { user, isLoaded } = useUser();
  const { getToken } = useAuth();
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [syncing, setSyncing] = useState(false);
  const [syncResult, setSyncResult] = useState<{
    error?: string;
    results?: {
      processed?: number;
      created?: number;
      updated?: number;
      errors?: string[];
    };
  } | null>(null);

  // Create Organization Form
  const [createOrgForm, setCreateOrgForm] = useState({
    name: "",
    description: "",
    submitting: false,
    success: false,
    error: "",
  });

  // Invite Client Admin Form
  const [inviteForm, setInviteForm] = useState({
    email: "",
    orgId: "",
    submitting: false,
    success: false,
    error: "",
  });

  useEffect(() => {
    if (isLoaded && user) {
      fetchOrganizations();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoaded, user]);

  const fetchOrganizations = async () => {
    try {
      setLoading(true);
      const apiClient = new ApiClient(getToken);
      const data = await apiClient.getOrganizations();
      setOrganizations(data.organizations);
      setError(null);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to fetch organizations"
      );
    } finally {
      setLoading(false);
    }
  };

  const handleCreateOrganization = async (e: React.FormEvent) => {
    e.preventDefault();

    setCreateOrgForm((prev) => ({
      ...prev,
      submitting: true,
      error: "",
      success: false,
    }));

    try {
      const apiClient = new ApiClient(getToken);
      await apiClient.createOrganization(
        createOrgForm.name,
        createOrgForm.description
      );
      setCreateOrgForm({
        name: "",
        description: "",
        submitting: false,
        success: true,
        error: "",
      });

      // Refresh organizations list
      fetchOrganizations();
    } catch (err) {
      setCreateOrgForm((prev) => ({
        ...prev,
        submitting: false,
        error:
          err instanceof Error ? err.message : "Failed to create organization",
      }));
    }
  };

  const handleInviteClientAdmin = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!inviteForm.orgId) {
      setInviteForm((prev) => ({
        ...prev,
        error: "Please select an organization",
      }));
      return;
    }

    setInviteForm((prev) => ({
      ...prev,
      submitting: true,
      error: "",
      success: false,
    }));

    try {
      const apiClient = new ApiClient(getToken);
      const selectedOrg = organizations.find(
        (org) => org._id === inviteForm.orgId
      );
      await apiClient.inviteClientAdmin(
        inviteForm.email,
        selectedOrg?.name || ""
      );
      setInviteForm({
        email: "",
        orgId: "",
        submitting: false,
        success: true,
        error: "",
      });

      // Refresh organizations list
      fetchOrganizations();
    } catch (err) {
      setInviteForm((prev) => ({
        ...prev,
        submitting: false,
        error:
          err instanceof Error ? err.message : "Failed to invite client admin",
      }));
    }
  };

  const handleSyncUsers = async () => {
    try {
      setSyncing(true);
      const apiClient = new ApiClient(getToken);
      const result = await apiClient.syncUsersFromClerk();
      setSyncResult(result);
    } catch (err) {
      setSyncResult({
        error: err instanceof Error ? err.message : "Sync failed",
      });
    } finally {
      setSyncing(false);
    }
  };

  if (!isLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        Loading...
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-white mb-4">Access Denied</h1>
          <p className="text-[var(--medium-grey)] mb-4">
            Please sign in to access this page.
          </p>
          <Link
            href="/dashboard"
            className="text-[var(--neon-blue)] hover:text-white transition-colors"
          >
            ← Back to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col gap-6 p-6 pt-4 relative">
      {/* Blurred background element */}
      <div className="blurred-background"></div>

      <div className="max-w-7xl mx-auto w-full relative z-10">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white">
            Organizations Management
          </h1>
          <p className="text-[var(--medium-grey)] mt-2">
            Manage organizations and invite client administrators
          </p>
        </div>

        {/* Create Organization Form */}
        <div className="dashboard-card rounded-lg mb-8 p-6">
          <h2 className="text-xl font-semibold mb-4 text-white">
            Create New Organization
          </h2>

          <form onSubmit={handleCreateOrganization} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-white mb-2">
                  Organization Name *
                </label>
                <input
                  type="text"
                  required
                  value={createOrgForm.name}
                  onChange={(e) =>
                    setCreateOrgForm((prev) => ({
                      ...prev,
                      name: e.target.value,
                    }))
                  }
                  className="w-full px-3 py-2 bg-[var(--navy-blue-lighter)] border border-[var(--border)] rounded-md focus:outline-none focus:ring-2 focus:ring-[var(--neon-blue)] text-white placeholder-[var(--medium-grey)]"
                  placeholder="University Name"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-white mb-2">
                  Description (Optional)
                </label>
                <input
                  type="text"
                  value={createOrgForm.description}
                  onChange={(e) =>
                    setCreateOrgForm((prev) => ({
                      ...prev,
                      description: e.target.value,
                    }))
                  }
                  className="w-full px-3 py-2 bg-[var(--navy-blue-lighter)] border border-[var(--border)] rounded-md focus:outline-none focus:ring-2 focus:ring-[var(--neon-blue)] text-white placeholder-[var(--medium-grey)]"
                  placeholder="Brief description of the organization"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={createOrgForm.submitting}
              className="bg-[var(--neon-blue)] text-white px-4 py-2 rounded-lg hover:opacity-90 disabled:opacity-50 transition-all"
            >
              {createOrgForm.submitting
                ? "Creating Organization..."
                : "Create Organization"}
            </button>
          </form>

          {createOrgForm.success && (
            <div className="mt-4 bg-[var(--success-green)]/20 border border-[var(--success-green)] rounded-md p-4">
              <div className="text-[var(--success-green)]">
                ✅ Organization created successfully!
              </div>
            </div>
          )}

          {createOrgForm.error && (
            <div className="mt-4 bg-[var(--crimson-red)]/20 border border-[var(--crimson-red)] rounded-md p-4">
              <div className="text-[var(--crimson-red)]">
                ❌ <strong>Error:</strong> {createOrgForm.error}
              </div>
            </div>
          )}
        </div>

        {/* Invite Client Admin Form */}
        <div className="dashboard-card rounded-lg mb-8 p-6">
          <h2 className="text-xl font-semibold mb-4 text-white">
            Invite Client Administrator
          </h2>

          <form onSubmit={handleInviteClientAdmin} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-white mb-2">
                  Email Address
                </label>
                <input
                  type="email"
                  required
                  value={inviteForm.email}
                  onChange={(e) =>
                    setInviteForm((prev) => ({
                      ...prev,
                      email: e.target.value,
                    }))
                  }
                  className="w-full px-3 py-2 bg-[var(--navy-blue-lighter)] border border-[var(--border)] rounded-md focus:outline-none focus:ring-2 focus:ring-[var(--neon-blue)] text-white placeholder-[var(--medium-grey)]"
                  placeholder="admin@university.edu"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-white mb-2">
                  Organization
                </label>
                <select
                  required
                  value={inviteForm.orgId}
                  onChange={(e) =>
                    setInviteForm((prev) => ({
                      ...prev,
                      orgId: e.target.value,
                    }))
                  }
                  className="w-full px-3 py-2 bg-[var(--navy-blue-lighter)] border border-[var(--border)] rounded-md focus:outline-none focus:ring-2 focus:ring-[var(--neon-blue)] text-white"
                >
                  <option value="">Select an organization</option>
                  {organizations.map((org) => (
                    <option key={org._id} value={org._id}>
                      {org.name}
                    </option>
                  ))}
                </select>
                {organizations.length === 0 && (
                  <p className="mt-1 text-sm text-[var(--medium-grey)]">
                    No organizations available. Create one first.
                  </p>
                )}
              </div>
            </div>

            <button
              type="submit"
              disabled={inviteForm.submitting || organizations.length === 0}
              className="bg-[var(--neon-blue)] text-white px-4 py-2 rounded-lg hover:opacity-90 disabled:opacity-50 transition-all"
            >
              {inviteForm.submitting
                ? "Sending Invitation..."
                : "Send Invitation"}
            </button>
          </form>

          {inviteForm.success && (
            <div className="mt-4 bg-[var(--success-green)]/20 border border-[var(--success-green)] rounded-md p-4">
              <div className="text-[var(--success-green)]">
                ✅ Invitation sent successfully! The client admin will receive
                an email invitation.
              </div>
            </div>
          )}

          {inviteForm.error && (
            <div className="mt-4 bg-[var(--crimson-red)]/20 border border-[var(--crimson-red)] rounded-md p-4">
              <div className="text-[var(--crimson-red)]">
                ❌ <strong>Error:</strong> {inviteForm.error}
              </div>
            </div>
          )}
        </div>

        {/* User Sync Section */}
        <div className="dashboard-card rounded-lg mb-8 p-6">
          <h2 className="text-xl font-semibold mb-4 text-white">
            User Synchronization
          </h2>
          <p className="text-[var(--medium-grey)] mb-4">
            Manually sync users from Clerk to ensure all accounts are properly
            linked.
          </p>

          <button
            onClick={handleSyncUsers}
            disabled={syncing}
            className="bg-[var(--neon-blue)] text-white px-4 py-2 rounded-lg hover:opacity-90 disabled:opacity-50 transition-all"
          >
            {syncing ? "Syncing..." : "Sync Users from Clerk"}
          </button>

          {syncResult && (
            <div className="mt-4 bg-[var(--navy-blue-lighter)] border border-[var(--border)] rounded-md p-4">
              <h3 className="font-medium mb-2 text-white">Sync Results:</h3>
              {syncResult.error ? (
                <div className="text-[var(--crimson-red)]">
                  Error: {syncResult.error}
                </div>
              ) : (
                <div className="space-y-1 text-sm text-[var(--medium-grey)]">
                  <div>
                    Processed: {syncResult.results?.processed || 0} users
                  </div>
                  <div>
                    Created: {syncResult.results?.created || 0} new users
                  </div>
                  <div>
                    Updated: {syncResult.results?.updated || 0} existing users
                  </div>
                  <div>Errors: {syncResult.results?.errors?.length || 0}</div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Organizations List */}
        <div className="dashboard-card rounded-lg p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold text-white">Organizations</h2>
            <button
              onClick={fetchOrganizations}
              className="text-[var(--neon-blue)] hover:text-white transition-colors"
            >
              Refresh
            </button>
          </div>

          {loading && (
            <div className="text-center py-8">
              <div className="text-[var(--medium-grey)]">
                Loading organizations...
              </div>
            </div>
          )}

          {error && (
            <div className="bg-[var(--crimson-red)]/20 border border-[var(--crimson-red)] rounded-md p-4 mb-4">
              <div className="text-[var(--crimson-red)]">
                <strong>Error:</strong> {error}
              </div>
            </div>
          )}

          {!loading && !error && (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-[var(--border)]">
                <thead className="bg-[var(--navy-blue-lighter)]">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-[var(--medium-grey)] uppercase tracking-wider">
                      Organization
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-[var(--medium-grey)] uppercase tracking-wider">
                      Description
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-[var(--medium-grey)] uppercase tracking-wider">
                      Total Users
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-[var(--medium-grey)] uppercase tracking-wider">
                      Active Users
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-[var(--medium-grey)] uppercase tracking-wider">
                      Invited Users
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-[var(--medium-grey)] uppercase tracking-wider">
                      Created
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border)]">
                  {organizations.map((org) => (
                    <tr
                      key={org._id}
                      className="hover:bg-[var(--navy-blue-lighter)]/50 transition-colors"
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-white">
                          {org.name}
                        </div>
                        <div className="text-sm text-[var(--medium-grey)]">
                          {org.clientAdminIds.length} admin(s)
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-white max-w-xs truncate">
                          {org.description || "No description"}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-white">
                        {org.totalUsers}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-[var(--success-green)]/20 text-[var(--success-green)]">
                          {org.activeUsers}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-yellow-500/20 text-yellow-400">
                          {org.invitedUsers}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-[var(--medium-grey)]">
                        {new Date(org.createdAt).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {organizations.length === 0 && (
                <div className="text-center py-8 text-[var(--medium-grey)]">
                  No organizations found. Create one by inviting a client admin.
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
