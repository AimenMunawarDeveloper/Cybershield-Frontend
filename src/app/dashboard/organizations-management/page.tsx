"use client";

import { useUser, useAuth } from "@clerk/nextjs";
import { useEffect, useState } from "react";
import { ApiClient } from "@/lib/api";
import Link from "next/link";
import NetworkBackground from "@/components/NetworkBackground";

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
  const [dropdownOpen, setDropdownOpen] = useState(false);
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

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownOpen && !(event.target as Element).closest('.dropdown-container')) {
        setDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [dropdownOpen]);

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
    <div className="flex flex-1 flex-col gap-6 p-6 pt-4 relative min-h-screen">
      {/* Network Background */}
      <NetworkBackground />

      {/* Blurred background element */}
      <div className="blurred-background"></div>

      <div className="max-w-7xl mx-auto w-full relative z-10">
        {/* Header */}
        <div className="mb-10">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-gradient-to-br from-[var(--neon-blue)] to-[var(--electric-blue)] rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            </div>
            <div>
              <h1 className="text-4xl font-bold text-white">
                Organizations Management
              </h1>
              <p className="text-[var(--medium-grey)] text-lg">
                Manage organizations and invite client administrators
              </p>
            </div>
          </div>
        </div>

        {/* Create Organization Form */}
        <div className="dashboard-card rounded-xl mb-8 p-8 shadow-2xl border border-[var(--neon-blue)]/20 hover:border-[var(--neon-blue)]/40 transition-all duration-500 hover:shadow-[0_0_30px_rgba(81,176,236,0.3)] group">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-8 h-8 bg-gradient-to-br from-[var(--neon-blue)] to-[var(--electric-blue)] rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform duration-300 shadow-lg">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-white group-hover:text-[var(--neon-blue)] transition-colors duration-300">
              Create New Organization
            </h2>
          </div>

          <form onSubmit={handleCreateOrganization} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-semibold text-white mb-3">
                  Organization Name *
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <svg className="w-5 h-5 text-[var(--medium-grey)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                    </svg>
                  </div>
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
                    className="w-full pl-10 pr-4 py-3 bg-[var(--navy-blue-lighter)] border border-[var(--border)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--neon-blue)] focus:border-transparent text-white placeholder-[var(--medium-grey)] transition-all duration-300 hover:border-[var(--neon-blue)]/50 focus:shadow-[0_0_20px_rgba(81,176,236,0.3)]"
                    placeholder="University Name"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-white mb-3">
                  Description (Optional)
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <svg className="w-5 h-5 text-[var(--medium-grey)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <input
                    type="text"
                    value={createOrgForm.description}
                    onChange={(e) =>
                      setCreateOrgForm((prev) => ({
                        ...prev,
                        description: e.target.value,
                      }))
                    }
                    className="w-full pl-10 pr-4 py-3 bg-[var(--navy-blue-lighter)] border border-[var(--border)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--neon-blue)] focus:border-transparent text-white placeholder-[var(--medium-grey)] transition-all duration-300 hover:border-[var(--neon-blue)]/50 focus:shadow-[0_0_20px_rgba(81,176,236,0.3)]"
                    placeholder="Brief description of the organization"
                  />
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={createOrgForm.submitting}
              className="w-full bg-gradient-to-r from-[var(--neon-blue)] to-[var(--electric-blue)] text-white px-6 py-3 rounded-lg hover:from-[var(--electric-blue)] hover:to-[var(--neon-blue)] disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 font-semibold flex items-center justify-center gap-2 hover:scale-105 hover:shadow-[0_0_30px_rgba(81,176,236,0.8)] active:scale-95"
            >
              {createOrgForm.submitting ? (
                <>
                  <svg className="w-5 h-5 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  Creating Organization...
                </>
              ) : (
                <>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                  Create Organization
                </>
              )}
            </button>
          </form>

          {createOrgForm.success && (
            <div className="mt-6 bg-gradient-to-r from-[var(--success-green)]/20 to-[var(--success-green)]/10 border border-[var(--success-green)]/30 rounded-lg p-4 hover:shadow-[0_0_20px_rgba(76,175,80,0.2)] transition-all duration-300">
              <div className="flex items-center gap-3">
                <svg className="w-6 h-6 text-[var(--success-green)] flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div>
                  <p className="text-[var(--success-green)] font-semibold">
                    Organization created successfully!
                  </p>
                  <p className="text-[var(--success-green)]/80 text-sm">
                    The organization has been added to the system and is ready for use.
                  </p>
                </div>
              </div>
            </div>
          )}

          {createOrgForm.error && (
            <div className="mt-6 bg-gradient-to-r from-[var(--crimson-red)]/20 to-[var(--crimson-red)]/10 border border-[var(--crimson-red)]/30 rounded-lg p-4 hover:shadow-[0_0_20px_rgba(215,38,56,0.2)] transition-all duration-300">
              <div className="flex items-center gap-3">
                <svg className="w-6 h-6 text-[var(--crimson-red)] flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div>
                  <p className="text-[var(--crimson-red)] font-semibold">
                    Failed to create organization
                  </p>
                  <p className="text-[var(--crimson-red)]/80 text-sm">
                    {createOrgForm.error}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Invite Client Admin Form */}
        <div className="dashboard-card rounded-xl mb-8 p-8 shadow-2xl border border-[var(--electric-blue)]/20 hover:border-[var(--electric-blue)]/40 transition-all duration-500 hover:shadow-[0_0_30px_rgba(79,195,247,0.3)] group">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-8 h-8 bg-gradient-to-br from-[var(--electric-blue)] to-[var(--neon-blue)] rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform duration-300 shadow-lg">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-white group-hover:text-[var(--electric-blue)] transition-colors duration-300">
              Invite Client Administrator
            </h2>
          </div>

          <form onSubmit={handleInviteClientAdmin} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-semibold text-white mb-3">
                  Email Address
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <svg className="w-5 h-5 text-[var(--medium-grey)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
                    </svg>
                  </div>
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
                    className="w-full pl-10 pr-4 py-3 bg-[var(--navy-blue-lighter)] border border-[var(--border)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--electric-blue)] focus:border-transparent text-white placeholder-[var(--medium-grey)] transition-all duration-300 hover:border-[var(--electric-blue)]/50 focus:shadow-[0_0_20px_rgba(79,195,247,0.3)]"
                    placeholder="admin@university.edu"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-white mb-3">
                  Organization
                </label>
                <div className="relative dropdown-container">
                  {dropdownOpen && (
                    <div className="absolute z-50 w-full bottom-full mb-2 bg-[var(--navy-blue)] border-2 border-[var(--border)] rounded-xl shadow-2xl overflow-hidden">
                      <div className="py-2">
                        {organizations.map((org) => (
                          <button
                            key={org._id}
                            type="button"
                            onClick={() => {
                              setInviteForm((prev) => ({ ...prev, orgId: org._id }));
                              setDropdownOpen(false);
                            }}
                            className="w-full px-4 py-3 text-right text-white hover:bg-[var(--electric-blue)] transition-all duration-200 flex items-center justify-between"
                          >
                            <span>{org.name}</span>
                            <svg className="w-4 h-4 text-[var(--medium-grey)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                            </svg>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  <button
                    type="button"
                    onClick={() => setDropdownOpen(!dropdownOpen)}
                    className="w-full px-4 py-4 bg-[var(--navy-blue)] border-2 border-[var(--border)] rounded-xl text-white 
              focus:outline-none focus:ring-2 focus:ring-[var(--electric-blue)] focus:border-[var(--electric-blue)]
              transition-all duration-300 cursor-pointer font-medium hover:border-[var(--electric-blue)]/60 hover:shadow-[0_0_20px_rgba(79,195,247,0.3)] flex items-center justify-between"
                  >
                    <span className="text-left">
                      {inviteForm.orgId 
                        ? organizations.find(org => org._id === inviteForm.orgId)?.name 
                        : "Select organization"
                      }
                    </span>
                    <div className="flex items-center gap-2">
                      <svg className="w-4 h-4 text-[var(--medium-grey)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                      </svg>
                      <svg className={`w-4 h-4 text-[var(--electric-blue)] transition-transform duration-300 ${dropdownOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                  </button>
                </div>
                {organizations.length === 0 && (
                  <p className="mt-2 text-sm text-[var(--medium-grey)] flex items-center gap-2">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    No organizations available. Create one first.
                  </p>
                )}
              </div>
            </div>

            <button
              type="submit"
              disabled={inviteForm.submitting || organizations.length === 0}
              className="w-full bg-gradient-to-r from-[var(--electric-blue)] to-[var(--neon-blue)] text-white px-6 py-3 rounded-lg hover:from-[var(--neon-blue)] hover:to-[var(--electric-blue)] disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 font-semibold flex items-center justify-center gap-2 hover:scale-105 hover:shadow-[0_0_30px_rgba(79,195,247,0.8)] active:scale-95"
            >
              {inviteForm.submitting ? (
                <>
                  <svg className="w-5 h-5 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  Sending Invitation...
                </>
              ) : (
                <>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                  </svg>
                  Send Invitation
                </>
              )}
            </button>
          </form>

          {inviteForm.success && (
            <div className="mt-6 bg-gradient-to-r from-[var(--success-green)]/20 to-[var(--success-green)]/10 border border-[var(--success-green)]/30 rounded-lg p-4 hover:shadow-[0_0_20px_rgba(76,175,80,0.2)] transition-all duration-300">
              <div className="flex items-center gap-3">
                <svg className="w-6 h-6 text-[var(--success-green)] flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div>
                  <p className="text-[var(--success-green)] font-semibold">
                    Invitation sent successfully!
                  </p>
                  <p className="text-[var(--success-green)]/80 text-sm">
                    The client admin will receive an email invitation to join the organization.
                  </p>
                </div>
              </div>
            </div>
          )}

          {inviteForm.error && (
            <div className="mt-6 bg-gradient-to-r from-[var(--crimson-red)]/20 to-[var(--crimson-red)]/10 border border-[var(--crimson-red)]/30 rounded-lg p-4 hover:shadow-[0_0_20px_rgba(215,38,56,0.2)] transition-all duration-300">
              <div className="flex items-center gap-3">
                <svg className="w-6 h-6 text-[var(--crimson-red)] flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div>
                  <p className="text-[var(--crimson-red)] font-semibold">
                    Failed to send invitation
                  </p>
                  <p className="text-[var(--crimson-red)]/80 text-sm">
                    {inviteForm.error}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        

        {/* Organizations List */}
        <div className="dashboard-card rounded-xl p-8 shadow-2xl border border-[var(--border)]/20 hover:border-[var(--neon-blue)]/30 transition-all duration-500 hover:shadow-[0_0_30px_rgba(81,176,236,0.2)]">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-gradient-to-br from-[var(--neon-blue)] to-[var(--electric-blue)] rounded-xl flex items-center justify-center shadow-lg">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              </div>
              <div>
                <h2 className="text-3xl font-bold text-white">Organizations</h2>
                <p className="text-[var(--medium-grey)] text-lg">
                  Manage and view all organizations ({organizations.length})
                </p>
              </div>
            </div>
            <button
              onClick={fetchOrganizations}
              disabled={loading}
              className="px-6 py-3 bg-gradient-to-r from-[var(--neon-blue)] to-[var(--electric-blue)] text-white rounded-xl hover:from-[var(--electric-blue)] hover:to-[var(--neon-blue)] disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 flex items-center gap-3 font-semibold hover:scale-105 hover:shadow-[0_0_20px_rgba(81,176,236,0.4)] active:scale-95"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Refresh
            </button>
          </div>

          {loading && (
            <div className="flex items-center justify-center py-16">
              <div className="flex flex-col items-center gap-6">
                <div className="w-12 h-12 border-4 border-[var(--neon-blue)] border-t-transparent rounded-full animate-spin"></div>
                <div className="text-center">
                  <p className="text-xl font-semibold text-white mb-2">Loading organizations...</p>
                  <p className="text-[var(--medium-grey)]">Please wait while we fetch the data</p>
                </div>
              </div>
            </div>
          )}

          {error && (
            <div className="bg-gradient-to-r from-[var(--crimson-red)]/20 to-[var(--crimson-red)]/10 border-2 border-[var(--crimson-red)]/30 rounded-xl p-6 mb-8">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-[var(--crimson-red)]/20 rounded-full flex items-center justify-center">
                  <svg className="w-6 h-6 text-[var(--crimson-red)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-xl font-bold text-[var(--crimson-red)] mb-2">Error Loading Organizations</h3>
                  <p className="text-[var(--crimson-red)]/80">{error}</p>
                </div>
              </div>
            </div>
          )}

          {!loading && !error && (
            <div className="rounded-xl border border-[var(--border)]/20 overflow-hidden">
              <table className="w-full divide-y divide-[var(--border)]/30">
                <thead className="bg-gradient-to-r from-[var(--navy-blue-lighter)] to-[var(--navy-blue-lighter)]/80">
                  <tr>
                    <th className="px-4 py-4 text-left text-xs font-bold text-white uppercase tracking-wider w-1/4">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 bg-gradient-to-br from-[var(--neon-blue)]/20 to-[var(--electric-blue)]/20 rounded-lg flex items-center justify-center">
                          <svg className="w-3 h-3 text-[var(--neon-blue)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                          </svg>
                        </div>
                        Organization
                      </div>
                    </th>
                    <th className="px-4 py-4 text-left text-xs font-bold text-white uppercase tracking-wider w-1/4">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 bg-gradient-to-br from-[var(--neon-blue)]/20 to-[var(--electric-blue)]/20 rounded-lg flex items-center justify-center">
                          <svg className="w-3 h-3 text-[var(--neon-blue)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                        </div>
                        Description
                      </div>
                    </th>
                    <th className="px-4 py-4 text-left text-xs font-bold text-white uppercase tracking-wider w-1/6">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 bg-gradient-to-br from-[var(--neon-blue)]/20 to-[var(--electric-blue)]/20 rounded-lg flex items-center justify-center">
                          <svg className="w-3 h-3 text-[var(--neon-blue)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                          </svg>
                        </div>
                        Total
                      </div>
                    </th>
                    <th className="px-4 py-4 text-left text-xs font-bold text-white uppercase tracking-wider w-1/6">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 bg-gradient-to-br from-[var(--neon-blue)]/20 to-[var(--electric-blue)]/20 rounded-lg flex items-center justify-center">
                          <svg className="w-3 h-3 text-[var(--neon-blue)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                        </div>
                        Active
                      </div>
                    </th>
                    <th className="px-4 py-4 text-left text-xs font-bold text-white uppercase tracking-wider w-1/6">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 bg-gradient-to-br from-[var(--neon-blue)]/20 to-[var(--electric-blue)]/20 rounded-lg flex items-center justify-center">
                          <svg className="w-3 h-3 text-[var(--neon-blue)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                        </div>
                        Invited
                      </div>
                    </th>
                    <th className="px-4 py-4 text-left text-xs font-bold text-white uppercase tracking-wider w-1/6">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 bg-gradient-to-br from-[var(--neon-blue)]/20 to-[var(--electric-blue)]/20 rounded-lg flex items-center justify-center">
                          <svg className="w-3 h-3 text-[var(--neon-blue)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                        </div>
                        Created
                      </div>
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border)]/30 bg-[var(--navy-blue)]/20">
                  {organizations.map((org, index) => (
                    <tr
                      key={org._id}
                      className="hover:bg-gradient-to-r hover:from-[var(--navy-blue-lighter)]/40 hover:to-[var(--navy-blue-lighter)]/20 transition-all duration-300 group"
                    >
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-gradient-to-br from-[var(--neon-blue)] to-[var(--electric-blue)] rounded-lg flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
                            <span className="text-white font-bold text-sm">
                              {org.name.charAt(0).toUpperCase()}
                            </span>
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="text-sm font-bold text-white group-hover:text-[var(--neon-blue)] transition-colors duration-300 truncate">
                              {org.name}
                            </div>
                            <div className="text-xs text-[var(--medium-grey)]">
                              {org.clientAdminIds.length} admin(s)
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <div className="text-xs text-white max-w-xs">
                          {org.description ? (
                            <div className="bg-[var(--navy-blue-lighter)]/30 rounded-lg p-2 border border-[var(--border)]/30">
                              <p className="text-white text-xs truncate">{org.description}</p>
                            </div>
                          ) : (
                            <span className="text-[var(--medium-grey)] italic text-xs">
                              No description
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-4 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <div className="w-5 h-5 bg-gradient-to-br from-[var(--neon-blue)]/20 to-[var(--electric-blue)]/20 rounded flex items-center justify-center">
                            <svg className="w-3 h-3 text-[var(--neon-blue)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                            </svg>
                          </div>
                          <span className="text-sm font-bold text-white">{org.totalUsers}</span>
                        </div>
                      </td>
                      <td className="px-4 py-4 text-center">
                        <span className="px-2 py-1 inline-flex text-xs font-bold rounded-lg bg-gradient-to-r from-[var(--success-green)]/20 to-[var(--success-green)]/10 text-[var(--success-green)] border border-[var(--success-green)]/30">
                          {org.activeUsers}
                        </span>
                      </td>
                      <td className="px-4 py-4 text-center">
                        <span className="px-2 py-1 inline-flex text-xs font-bold rounded-lg bg-gradient-to-r from-yellow-500/20 to-yellow-400/10 text-yellow-400 border border-yellow-500/30">
                          {org.invitedUsers}
                        </span>
                      </td>
                      <td className="px-4 py-4 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <div className="w-5 h-5 bg-gradient-to-br from-[var(--neon-blue)]/20 to-[var(--electric-blue)]/20 rounded flex items-center justify-center">
                            <svg className="w-3 h-3 text-[var(--neon-blue)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                          </div>
                          <span className="text-xs font-semibold text-[var(--medium-grey)]">
                            {new Date(org.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {organizations.length === 0 && (
                <div className="text-center py-20">
                  <div className="flex flex-col items-center gap-6">
                    <div className="w-20 h-20 bg-gradient-to-br from-[var(--navy-blue-lighter)] to-[var(--navy-blue-lighter)]/50 rounded-2xl flex items-center justify-center shadow-2xl">
                      <svg className="w-10 h-10 text-[var(--medium-grey)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-white mb-3">No organizations found</p>
                      <p className="text-[var(--medium-grey)] text-lg">
                        Create an organization by using the form above to get started.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
