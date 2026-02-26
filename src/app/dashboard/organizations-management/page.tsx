"use client";

import { useUser, useAuth } from "@clerk/nextjs";
import { useEffect, useState } from "react";
import { ApiClient } from "@/lib/api";
import Link from "next/link";
import NetworkBackground from "@/components/NetworkBackground";
import { useTranslation } from "@/hooks/useTranslation";

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
  const { t, preTranslate, language } = useTranslation();
  const { user, isLoaded } = useUser();
  const { getToken } = useAuth();
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [syncing, setSyncing] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [translationReady, setTranslationReady] = useState(false);
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

  // Pre-translate static strings
  useEffect(() => {
    const preTranslatePageContent = async () => {
      if (language === "en") {
        setTranslationReady(true);
        return;
      }

      setTranslationReady(false);

      const staticStrings = [
        "Organizations Management",
        "Manage all organizations in the system",
        "Create Organization",
        "Organization Name",
        "Enter organization name",
        "Description",
        "Enter description (optional)",
        "Cancel",
        "Invite Client Admin",
        "Email Address",
        "Enter email address",
        "Select Organization",
        "Select...",
        "Send Invite",
        "Actions",
        "Sync Users from Clerk",
        "Organizations",
        "Total Users",
        "Active Users",
        "Client Admins",
        "Actions",
        "Invite Admin",
        "Loading organizations...",
        "No organizations found",
        "Create an organization to get started.",
        "Create your first organization",
        "Failed to fetch organizations",
        "Organization created successfully",
        "Failed to create organization",
        "Invitation sent successfully",
        "Failed to send invitation",
        "Syncing users from Clerk...",
        "User sync completed",
        "User sync failed",
      ];

      await preTranslate(staticStrings);
      setTranslationReady(true);
    };

    preTranslatePageContent();
  }, [language, preTranslate]);

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
      
      // Pre-translate dynamic organization data
      if (language === "ur") {
        const dynamicStrings = data.organizations.flatMap((org: Organization) => [
          org.name,
          org.description || "",
        ]).filter(Boolean);
        
        await preTranslate(dynamicStrings);
      }
      
      setOrganizations(data.organizations);
      setError(null);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : t("Failed to fetch organizations")
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
          err instanceof Error ? err.message : t("Failed to create organization"),
      }));
    }
  };

  const handleInviteClientAdmin = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!inviteForm.orgId) {
      setInviteForm((prev) => ({
        ...prev,
        error: t("Please select an organization"),
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
          err instanceof Error ? err.message : t("Failed to invite client admin"),
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
        error: err instanceof Error ? err.message : t("Sync failed"),
      });
    } finally {
      setSyncing(false);
    }
  };

  if (!isLoaded || !translationReady) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-primary mx-auto"></div>
          <p className="text-foreground text-lg">
            {language === "ur" ? "لوڈ ہو رہا ہے..." : "Loading..."}
          </p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-foreground mb-4">{t("Access Denied")}</h1>
          <p className="text-muted-foreground mb-4">
            {t("Please sign in to access this page.")}
          </p>
          <Link
            href="/dashboard"
            className="text-primary hover:text-foreground transition-colors"
          >
            {t("← Back to Dashboard")}
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
            <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6 text-primary-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            </div>
            <div>
              <h1 className="text-4xl font-bold text-foreground">
                {t("Organizations Management")}
              </h1>
              <p className="text-muted-foreground text-lg">
                {t("Manage organizations and invite client administrators")}
              </p>
            </div>
          </div>
        </div>

        {/* Create Organization Form */}
        <div className="dashboard-card rounded-xl mb-8 p-8 shadow-2xl border border-primary/20 hover:border-primary/40 transition-all duration-500 hover:shadow-lg group">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform duration-300 shadow-lg">
              <svg className="w-5 h-5 text-primary-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-foreground group-hover:text-primary transition-colors duration-300">
              {t("Create New Organization")}
            </h2>
          </div>

          <form onSubmit={handleCreateOrganization} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-semibold text-foreground mb-3">
                  {t("Organization Name")} *
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <svg className="w-5 h-5 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
                    className="w-full pl-10 pr-4 py-3 bg-input border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-foreground placeholder:text-muted-foreground transition-all duration-300 hover:border-primary/50"
                    placeholder={t("University Name")}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-foreground mb-3">
                  {t("Description (Optional)")}
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <svg className="w-5 h-5 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
                    className="w-full pl-10 pr-4 py-3 bg-input border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-foreground placeholder:text-muted-foreground transition-all duration-300 hover:border-primary/50"
                    placeholder={t("Brief description of the organization")}
                  />
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={createOrgForm.submitting}
              className="w-full bg-primary text-primary-foreground px-6 py-3 rounded-lg hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 font-semibold flex items-center justify-center gap-2 hover:scale-105 active:scale-95"
            >
              {createOrgForm.submitting ? (
                <>
                  <svg className="w-5 h-5 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  {t("Creating Organization...")}
                </>
              ) : (
                <>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                  {t("Create Organization")}
                </>
              )}
            </button>
          </form>

          {createOrgForm.success && (
            <div className="mt-6 bg-gradient-to-r from-success-green/20 to-success-green/10 border border-success-green/30 rounded-lg p-4 transition-all duration-300">
              <div className="flex items-center gap-3">
                <svg className="w-6 h-6 text-success-green flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div>
                  <p className="text-success-green font-semibold">
                    {t("Organization created successfully!")}
                  </p>
                  <p className="text-success-green/80 text-sm">
                    {t("The organization has been added to the system and is ready for use.")}
                  </p>
                </div>
              </div>
            </div>
          )}

          {createOrgForm.error && (
            <div className="mt-6 bg-gradient-to-r from-crimson-red/20 to-crimson-red/10 border border-crimson-red/30 rounded-lg p-4 transition-all duration-300">
              <div className="flex items-center gap-3">
                <svg className="w-6 h-6 text-crimson-red flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div>
                  <p className="text-crimson-red font-semibold">
                    {t("Failed to create organization")}
                  </p>
                  <p className="text-crimson-red/80 text-sm">
                    {createOrgForm.error}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Invite Client Admin Form */}
        <div className="dashboard-card rounded-xl mb-8 p-8 shadow-2xl border border-primary/20 hover:border-primary/40 transition-all duration-500 hover:shadow-lg group">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform duration-300 shadow-lg">
              <svg className="w-5 h-5 text-primary-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-foreground group-hover:text-primary transition-colors duration-300">
              {t("Invite Client Administrator")}
            </h2>
          </div>

          <form onSubmit={handleInviteClientAdmin} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-semibold text-foreground mb-3">
                  {t("Email Address")}
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <svg className="w-5 h-5 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
                    className="w-full pl-10 pr-4 py-3 bg-input border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-foreground placeholder:text-muted-foreground transition-all duration-300 hover:border-primary/50"
                    placeholder={t("admin@university.edu")}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-foreground mb-3">
                  {t("Organization")}
                </label>
                <div className="relative dropdown-container">
                  {dropdownOpen && (
                    <div className="absolute z-50 w-full bottom-full mb-2 bg-card border-2 border-border rounded-xl shadow-2xl overflow-hidden">
                      <div className="py-2">
                        {organizations.map((org) => (
                          <button
                            key={org._id}
                            type="button"
                            onClick={() => {
                              setInviteForm((prev) => ({ ...prev, orgId: org._id }));
                              setDropdownOpen(false);
                            }}
                            className="w-full px-4 py-3 text-right text-foreground hover:bg-muted transition-all duration-200 flex items-center justify-between"
                          >
                            <span>{t(org.name)}</span>
                            <svg className="w-4 h-4 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
                    className="w-full px-4 py-4 bg-input border-2 border-border rounded-xl text-foreground 
              focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary
              transition-all duration-300 cursor-pointer font-medium hover:border-primary/60 flex items-center justify-between"
                  >
                    <span className="text-left">
                      {inviteForm.orgId 
                        ? t(organizations.find(org => org._id === inviteForm.orgId)?.name || "")
                        : t("Select organization")
                      }
                    </span>
                    <div className="flex items-center gap-2">
                      <svg className="w-4 h-4 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                      </svg>
                      <svg className={`w-4 h-4 text-primary transition-transform duration-300 ${dropdownOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                  </button>
                </div>
                {organizations.length === 0 && (
                  <p className="mt-2 text-sm text-muted-foreground flex items-center gap-2">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    {t("No organizations available. Create one first.")}
                  </p>
                )}
              </div>
            </div>

            <button
              type="submit"
              disabled={inviteForm.submitting || organizations.length === 0}
              className="w-full bg-primary text-primary-foreground px-6 py-3 rounded-lg hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 font-semibold flex items-center justify-center gap-2 hover:scale-105 active:scale-95"
            >
              {inviteForm.submitting ? (
                <>
                  <svg className="w-5 h-5 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  {t("Sending Invitation...")}
                </>
              ) : (
                <>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                  </svg>
                  {t("Send Invitation")}
                </>
              )}
            </button>
          </form>

          {inviteForm.success && (
            <div className="mt-6 bg-gradient-to-r from-success-green/20 to-success-green/10 border border-success-green/30 rounded-lg p-4 transition-all duration-300">
              <div className="flex items-center gap-3">
                <svg className="w-6 h-6 text-success-green flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div>
                  <p className="text-success-green font-semibold">
                    {t("Invitation sent successfully!")}
                  </p>
                  <p className="text-success-green/80 text-sm">
                    {t("The client admin will receive an email invitation to join the organization.")}
                  </p>
                </div>
              </div>
            </div>
          )}

          {inviteForm.error && (
            <div className="mt-6 bg-gradient-to-r from-crimson-red/20 to-crimson-red/10 border border-crimson-red/30 rounded-lg p-4 transition-all duration-300">
              <div className="flex items-center gap-3">
                <svg className="w-6 h-6 text-crimson-red flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div>
                  <p className="text-crimson-red font-semibold">
                    {t("Failed to send invitation")}
                  </p>
                  <p className="text-crimson-red/80 text-sm">
                    {inviteForm.error}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        

        {/* Organizations List */}
        <div className="dashboard-card rounded-xl p-8 shadow-2xl border border-border/20 hover:border-primary/30 transition-all duration-500 hover:shadow-lg">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center shadow-lg">
                <svg className="w-6 h-6 text-primary-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              </div>
              <div>
                <h2 className="text-3xl font-bold text-foreground">{t("Organizations")}</h2>
                <p className="text-muted-foreground text-lg">
                  {t("Manage and view all organizations")} ({organizations.length})
                </p>
              </div>
            </div>
            <button
              onClick={fetchOrganizations}
              disabled={loading}
              className="px-6 py-3 bg-primary text-primary-foreground rounded-xl hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 flex items-center gap-3 font-semibold hover:scale-105 active:scale-95"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              {t("Refresh")}
            </button>
          </div>

          {loading && (
            <div className="flex items-center justify-center py-16">
              <div className="flex flex-col items-center gap-6">
                <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
                <div className="text-center">
                  <p className="text-xl font-semibold text-foreground mb-2">{t("Loading organizations...")}</p>
                  <p className="text-muted-foreground">{t("Please wait while we fetch the data")}</p>
                </div>
              </div>
            </div>
          )}

          {error && (
            <div className="bg-gradient-to-r from-crimson-red/20 to-crimson-red/10 border-2 border-crimson-red/30 rounded-xl p-6 mb-8">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-crimson-red/20 rounded-full flex items-center justify-center">
                  <svg className="w-6 h-6 text-crimson-red" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-xl font-bold text-crimson-red mb-2">{t("Error Loading Organizations")}</h3>
                  <p className="text-crimson-red/80">{error}</p>
                </div>
              </div>
            </div>
          )}

          {!loading && !error && (
            <div className="rounded-xl border border-border/20 overflow-hidden">
              <table className="w-full divide-y divide-border/30">
                <thead className="bg-muted">
                  <tr>
                    <th className="px-4 py-4 text-left text-xs font-bold text-foreground uppercase tracking-wider w-1/4">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 bg-primary/20 rounded-lg flex items-center justify-center">
                          <svg className="w-3 h-3 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                          </svg>
                        </div>
                        {t("Organization")}
                      </div>
                    </th>
                    <th className="px-4 py-4 text-left text-xs font-bold text-foreground uppercase tracking-wider w-1/4">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 bg-primary/20 rounded-lg flex items-center justify-center">
                          <svg className="w-3 h-3 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                        </div>
                        {t("Description")}
                      </div>
                    </th>
                    <th className="px-4 py-4 text-left text-xs font-bold text-foreground uppercase tracking-wider w-1/6">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 bg-primary/20 rounded-lg flex items-center justify-center">
                          <svg className="w-3 h-3 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                          </svg>
                        </div>
                        {t("Total")}
                      </div>
                    </th>
                    <th className="px-4 py-4 text-left text-xs font-bold text-foreground uppercase tracking-wider w-1/6">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 bg-primary/20 rounded-lg flex items-center justify-center">
                          <svg className="w-3 h-3 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                        </div>
                        {t("Active")}
                      </div>
                    </th>
                    <th className="px-4 py-4 text-left text-xs font-bold text-foreground uppercase tracking-wider w-1/6">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 bg-primary/20 rounded-lg flex items-center justify-center">
                          <svg className="w-3 h-3 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                        </div>
                        {t("Invited")}
                      </div>
                    </th>
                    <th className="px-4 py-4 text-left text-xs font-bold text-foreground uppercase tracking-wider w-1/6">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 bg-primary/20 rounded-lg flex items-center justify-center">
                          <svg className="w-3 h-3 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                        </div>
                        {t("Created")}
                      </div>
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/30 bg-muted/20">
                  {organizations.map((org, index) => (
                    <tr
                      key={org._id}
                      className="hover:bg-muted/40 transition-all duration-300 group"
                    >
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
                            <span className="text-primary-foreground font-bold text-sm">
                              {org.name.charAt(0).toUpperCase()}
                            </span>
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="text-sm font-bold text-foreground group-hover:text-primary transition-colors duration-300 truncate">
                              {t(org.name)}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {org.clientAdminIds.length} {t("admin(s)")}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <div className="text-xs text-foreground max-w-xs">
                          {org.description ? (
                            <div className="bg-muted/30 rounded-lg p-2 border border-border/30">
                              <p className="text-foreground text-xs truncate">{t(org.description)}</p>
                            </div>
                          ) : (
                            <span className="text-muted-foreground italic text-xs">
                              {t("No description")}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-4 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <div className="w-5 h-5 bg-primary/20 rounded flex items-center justify-center">
                            <svg className="w-3 h-3 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                            </svg>
                          </div>
                          <span className="text-sm font-bold text-foreground">{org.totalUsers}</span>
                        </div>
                      </td>
                      <td className="px-4 py-4 text-center">
                        <span className="px-2 py-1 inline-flex text-xs font-bold rounded-lg bg-gradient-to-r from-success-green/20 to-success-green/10 text-success-green border border-success-green/30">
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
                          <div className="w-5 h-5 bg-primary/20 rounded flex items-center justify-center">
                            <svg className="w-3 h-3 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                          </div>
                          <span className="text-xs font-semibold text-muted-foreground">
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
                    <div className="w-20 h-20 bg-muted rounded-2xl flex items-center justify-center shadow-2xl">
                      <svg className="w-10 h-10 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-foreground mb-3">{t("No organizations found")}</p>
                      <p className="text-muted-foreground text-lg">
                        {t("Create an organization by using the form above to get started.")}
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
