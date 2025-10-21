"use client";

import { useUser, useAuth } from "@clerk/nextjs";
import { useEffect, useState } from "react";
import { ApiClient } from "@/lib/api";
import Link from "next/link";
import NetworkBackground from "@/components/NetworkBackground";

interface User {
  _id: string;
  email: string;
  displayName: string;
  role: string;
  status: "invited" | "active" | "suspended";
  groups: string[];
  points?: number;
  riskScore?: number;
  createdAt: string;
}

interface UserProfile {
  _id: string;
  orgId?: string;
  role: string;
}

interface BulkInviteResult {
  successful: number;
  failed: number;
}

export default function ClientAdminPanel() {
  const { user, isLoaded } = useUser();
  const { getToken } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [invites, setInvites] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"users" | "invites">("users");

  // Single invite form
  const [inviteForm, setInviteForm] = useState({
    email: "",
    submitting: false,
    success: false,
    error: "",
  });

  // Bulk invite form
  const [bulkInviteForm, setBulkInviteForm] = useState({
    users: "",
    submitting: false,
    success: false,
    error: "",
    result: null as BulkInviteResult | null,
  });

  // Email list for bulk invite
  const [emailList, setEmailList] = useState<string[]>([]);

  useEffect(() => {
    if (isLoaded && user) {
      fetchProfile();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoaded, user]);

  useEffect(() => {
    if (profile?.orgId) {
      fetchUsers();
      fetchInvites();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile]);

  const fetchProfile = async () => {
    try {
      const apiClient = new ApiClient(getToken);
      const profileData = await apiClient.getUserProfile();
      setProfile(profileData);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch profile");
    }
  };

  const fetchUsers = async () => {
    if (!profile?.orgId) return;

    try {
      setLoading(true);
      const apiClient = new ApiClient(getToken);
      const data = await apiClient.getOrgUsers(profile.orgId);
      setUsers(data.users);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch users");
    } finally {
      setLoading(false);
    }
  };

  const fetchInvites = async () => {
    if (!profile?.orgId) return;

    try {
      const apiClient = new ApiClient(getToken);
      const data = await apiClient.getInviteStatus(profile.orgId);
      setInvites(data.users);
    } catch (err) {
      console.error("Failed to fetch invites:", err);
    }
  };

  const handleSingleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile?.orgId) return;

    setInviteForm((prev) => ({
      ...prev,
      submitting: true,
      error: "",
      success: false,
    }));

    try {
      const apiClient = new ApiClient(getToken);
      await apiClient.inviteSingleUser(
        profile.orgId,
        inviteForm.email,
        undefined, // displayName will be set from Clerk data
        undefined // group functionality will be added later
      );

      setInviteForm({
        email: "",
        submitting: false,
        success: true,
        error: "",
      });

      // Refresh data
      fetchUsers();
      fetchInvites();
    } catch (err) {
      setInviteForm((prev) => ({
        ...prev,
        submitting: false,
        error: err instanceof Error ? err.message : "Failed to send invitation",
      }));
    }
  };

  // Parse emails from textarea and update email list
  const parseEmails = (text: string) => {
    // Split by both newlines and commas
    const allEmails = text
      .split(/[\n,]/)
      .map((email) => email.trim())
      .filter((email) => email && email.includes("@"));
    setEmailList(allEmails);
  };

  // Remove email from list
  const removeEmail = (emailToRemove: string) => {
    const updatedEmails = emailList.filter((email) => email !== emailToRemove);
    setEmailList(updatedEmails);
    
    // Update textarea content by removing the specific email from both newlines and commas
    const currentText = bulkInviteForm.users;
    const parts = currentText.split(/[\n,]/);
    const updatedParts = parts.filter((part) => part.trim() !== emailToRemove);
    const updatedText = updatedParts.join("\n");
    
    setBulkInviteForm((prev) => ({
      ...prev,
      users: updatedText,
    }));
  };

  const handleBulkInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile?.orgId) return;

    // Check if there are no emails
    if (emailList.length === 0) {
      setBulkInviteForm((prev) => ({
        ...prev,
        error: "Please enter at least one email address.",
      }));
      return;
    }

    setBulkInviteForm((prev) => ({
      ...prev,
      submitting: true,
      error: "",
      success: false,
      result: null,
    }));

    try {
      // Use emailList instead of parsing textarea
      const users = emailList.map((email) => ({ email }));

      const apiClient = new ApiClient(getToken);
      const result = await apiClient.bulkInviteUsers(profile.orgId, users);

      setBulkInviteForm((prev) => ({
        ...prev,
        submitting: false,
        success: true,
        result,
        users: "",
      }));

      // Clear email list
      setEmailList([]);

      // Refresh data
      fetchUsers();
      fetchInvites();
    } catch (err) {
      setBulkInviteForm((prev) => ({
        ...prev,
        submitting: false,
        error:
          err instanceof Error
            ? err.message
            : "Failed to send bulk invitations",
      }));
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

  if (profile && profile.role !== "client_admin") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-white mb-4">Access Denied</h1>
          <p className="text-[var(--medium-grey)] mb-4">
            This page is only accessible to Client Administrators.
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
      
      <NetworkBackground />
      
      {/* Blurred background element */}
      <div className="blurred-background"></div>

      <div className="max-w-7xl mx-auto w-full relative z-10">
        {/* Header */}
        <div className="mb-10">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-gradient-to-br from-[var(--neon-blue)] to-[var(--electric-blue)] rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <div>
              <h1 className="text-4xl font-bold text-white">
            Organization Management
          </h1>
              <p className="text-[var(--medium-grey)] text-lg">
            Manage users and send invitations for your organization
          </p>
            </div>
          </div>
        </div>

        {/* Single User Invite */}
        <div className="dashboard-card rounded-xl mb-8 p-8 shadow-2xl border border-[var(--neon-blue)]/20 hover:border-[var(--neon-blue)]/40 transition-all duration-500 hover:shadow-[0_0_30px_rgba(81,176,236,0.3)] group">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-8 h-8 bg-gradient-to-br from-[var(--neon-blue)] to-[var(--electric-blue)] rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform duration-300 shadow-lg">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-white group-hover:text-[var(--neon-blue)] transition-colors duration-300">
              Invite Single User
            </h2>
          </div>

          <form onSubmit={handleSingleInvite} className="space-y-6">
            <div>
              <label className="block text-sm font-semibold text-white mb-3">
                Email Address *
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
                    setInviteForm((prev) => ({ ...prev, email: e.target.value }))
                  }
                  className="w-full pl-10 pr-4 py-3 bg-[var(--navy-blue-lighter)] border border-[var(--border)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--neon-blue)] focus:border-transparent text-white placeholder-[var(--medium-grey)] transition-all duration-300 hover:border-[var(--neon-blue)]/50 focus:shadow-[0_0_20px_rgba(81,176,236,0.3)]"
                  placeholder="student@university.edu"
                />
              </div>
            </div>

            <div className="bg-gradient-to-r from-[var(--electric-blue)]/10 to-[var(--neon-blue)]/10 p-4 rounded-lg border border-[var(--electric-blue)]/20">
              <div className="flex items-start gap-3">
                <svg className="w-5 h-5 text-[var(--electric-blue)] mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div>
                  <p className="text-sm text-[var(--medium-grey)]">
                    <span className="font-semibold text-white">Note:</span> The display name will be automatically set
                    from the user&apos;s Clerk profile when they sign up.
                  </p>
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={inviteForm.submitting}
              className="w-full bg-gradient-to-r from-[var(--neon-blue)] to-[var(--electric-blue)] text-white px-6 py-3 rounded-lg hover:from-[var(--electric-blue)] hover:to-[var(--neon-blue)] disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 font-semibold flex items-center justify-center gap-2 hover:scale-105 hover:shadow-[0_0_25px_rgba(81,176,236,0.5)] active:scale-95"
            >
              {inviteForm.submitting ? (
                <>
                  <svg className="w-5 h-5 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  Sending...
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
            <div className="mt-6 bg-gradient-to-r from-[var(--success-green)]/20 to-[var(--success-green)]/10 border border-[var(--success-green)]/30 rounded-lg p-4">
              <div className="flex items-center gap-3">
                <svg className="w-6 h-6 text-[var(--success-green)] flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div>
                  <p className="text-[var(--success-green)] font-semibold">
                    Invitation sent successfully!
                  </p>
                  <p className="text-[var(--success-green)]/80 text-sm">
                    The user will receive an email invitation to join your organization.
                  </p>
                </div>
              </div>
            </div>
          )}

          {inviteForm.error && (
            <div className="mt-6 bg-gradient-to-r from-[var(--crimson-red)]/20 to-[var(--crimson-red)]/10 border border-[var(--crimson-red)]/30 rounded-lg p-4">
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

        {/* Bulk Invite */}
        <div className="dashboard-card rounded-xl mb-8 p-8 shadow-2xl border border-[var(--electric-blue)]/20 hover:border-[var(--electric-blue)]/40 transition-all duration-500 hover:shadow-[0_0_30px_rgba(79,195,247,0.3)] group">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-8 h-8 bg-gradient-to-br from-[var(--electric-blue)] to-[var(--neon-blue)] rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform duration-300 shadow-lg">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <div>
              <h2 className="text-2xl font-bold text-white group-hover:text-[var(--electric-blue)] transition-colors duration-300">
                Bulk Invite Users
              </h2>
              <p className="text-[var(--medium-grey)] text-sm">
                Send invitations to multiple users at once
              </p>
            </div>
          </div>

          <form onSubmit={handleBulkInvite} className="space-y-6">
            <div>
              <label className="block text-sm font-semibold text-white mb-3">
                Email Addresses
              </label>
              <div className="relative">
                <div className="absolute top-3 left-3 flex items-center pointer-events-none">
                  <svg className="w-5 h-5 text-[var(--medium-grey)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <textarea
                  value={bulkInviteForm.users}
                  onChange={(e) => {
                    setBulkInviteForm((prev) => ({
                      ...prev,
                      users: e.target.value,
                    }));
                    parseEmails(e.target.value);
                  }}
                  className="w-full pl-10 pr-4 py-3 bg-[var(--navy-blue-lighter)] border border-[var(--border)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--electric-blue)] focus:border-transparent text-white placeholder-[var(--medium-grey)] transition-all duration-300 hover:border-[var(--electric-blue)]/50 focus:shadow-[0_0_20px_rgba(79,195,247,0.3)] resize-none"
                  rows={4}
                  placeholder={`student1@university.edu, student2@university.edu
student3@university.edu
student4@university.edu, student5@university.edu`}
                />
              </div>
              <p className="text-xs text-[var(--medium-grey)] mt-2">
                Enter email addresses separated by commas or new lines. Display names will be set automatically from Clerk profiles.
              </p>
            </div>

            {/* Email List Display */}
            {emailList.length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <svg className="w-4 h-4 text-[var(--electric-blue)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span className="text-sm font-semibold text-white">
                    Emails to invite ({emailList.length})
                  </span>
                </div>
                <div className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 ${emailList.length > 6 ? 'max-h-32 overflow-y-auto' : ''}`}>
                  {emailList.map((email, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between bg-[var(--electric-blue)]/10 border border-[var(--electric-blue)]/30 rounded-lg px-3 py-2"
                    >
                      <span className="text-sm text-white truncate flex-1 mr-2">
                        {email}
                      </span>
                      <button
                        type="button"
                        onClick={() => removeEmail(email)}
                        className="flex-shrink-0 w-5 h-5 bg-[var(--crimson-red)]/20 hover:bg-[var(--crimson-red)]/30 rounded-full flex items-center justify-center transition-all duration-300 hover:scale-110 hover:shadow-[0_0_10px_rgba(215,38,56,0.4)] active:scale-95"
                        title="Remove email"
                      >
                        <svg className="w-3 h-3 text-[var(--crimson-red)] hover:text-white transition-colors duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={bulkInviteForm.submitting}
              className="w-full bg-gradient-to-r from-[var(--electric-blue)] to-[var(--neon-blue)] text-white px-6 py-3 rounded-lg hover:from-[var(--neon-blue)] hover:to-[var(--electric-blue)] disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 font-semibold flex items-center justify-center gap-2 hover:scale-105 hover:shadow-[0_0_30px_rgba(79,195,247,0.8)] active:scale-95"
            >
              {bulkInviteForm.submitting ? (
                <>
                  <svg className="w-5 h-5 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  Sending Invitations...
                </>
              ) : (
                <>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                  </svg>
                  Send Bulk Invitations {emailList.length > 0 && `(${emailList.length})`}
                </>
              )}
            </button>
          </form>

          {bulkInviteForm.success && bulkInviteForm.result && (
            <div className="mt-6 bg-gradient-to-r from-[var(--success-green)]/20 to-[var(--success-green)]/10 border border-[var(--success-green)]/30 rounded-lg p-4 hover:shadow-[0_0_20px_rgba(76,175,80,0.2)] transition-all duration-300">
              <div className="flex items-start gap-3">
                <svg className="w-6 h-6 text-[var(--success-green)] flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div className="flex-1">
                  <p className="text-[var(--success-green)] font-semibold mb-2">
                    Bulk invitation completed!
                  </p>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-[var(--success-green)] rounded-full animate-pulse"></div>
                      <span className="text-[var(--success-green)]/80">
                        Successful: {bulkInviteForm.result.successful}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-[var(--crimson-red)] rounded-full animate-pulse"></div>
                      <span className="text-[var(--crimson-red)]/80">
                        Failed: {bulkInviteForm.result.failed}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {bulkInviteForm.error && (
            <div className="mt-6 bg-gradient-to-r from-[var(--crimson-red)]/20 to-[var(--crimson-red)]/10 border border-[var(--crimson-red)]/30 rounded-lg p-4 hover:shadow-[0_0_20px_rgba(215,38,56,0.2)] transition-all duration-300">
              <div className="flex items-center gap-3">
                <svg className="w-6 h-6 text-[var(--crimson-red)] flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div>
                  <p className="text-[var(--crimson-red)] font-semibold">
                    Failed to send bulk invitations
                  </p>
                  <p className="text-[var(--crimson-red)]/80 text-sm">
                    {bulkInviteForm.error}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Users and Invites Tabs */}
        <div className="dashboard-card rounded-xl shadow-2xl border border-[var(--border)]/20 hover:border-[var(--neon-blue)]/30 transition-all duration-500 hover:shadow-[0_0_30px_rgba(81,176,236,0.2)]">
          <div className="border-b border-[var(--border)]">
            <nav className="-mb-px flex">
              <button
                onClick={() => setActiveTab("users")}
                className={`py-4 px-6 border-b-2 font-semibold text-sm transition-all duration-200 flex items-center gap-2 ${
                  activeTab === "users"
                    ? "border-[var(--neon-blue)] text-[var(--neon-blue)] bg-[var(--neon-blue)]/5"
                    : "border-transparent text-[var(--medium-grey)] hover:text-white hover:border-[var(--border)] hover:bg-[var(--navy-blue-lighter)]/30"
                }`}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                </svg>
                All Users
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                  activeTab === "users"
                    ? "bg-[var(--neon-blue)]/20 text-[var(--neon-blue)]"
                    : "bg-[var(--medium-grey)]/20 text-[var(--medium-grey)]"
                }`}>
                  {users.length}
                </span>
              </button>
              <button
                onClick={() => setActiveTab("invites")}
                className={`py-4 px-6 border-b-2 font-semibold text-sm transition-all duration-200 flex items-center gap-2 ${
                  activeTab === "invites"
                    ? "border-[var(--neon-blue)] text-[var(--neon-blue)] bg-[var(--neon-blue)]/5"
                    : "border-transparent text-[var(--medium-grey)] hover:text-white hover:border-[var(--border)] hover:bg-[var(--navy-blue-lighter)]/30"
                }`}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Pending Invites
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                  activeTab === "invites"
                    ? "bg-[var(--neon-blue)]/20 text-[var(--neon-blue)]"
                    : "bg-[var(--medium-grey)]/20 text-[var(--medium-grey)]"
                }`}>
                  {invites.filter((u) => u.status === "invited").length}
                </span>
              </button>
            </nav>
          </div>

          <div className="p-8">
            {loading && (
              <div className="text-center py-12">
                <div className="inline-flex items-center gap-3 text-[var(--medium-grey)]">
                  <svg className="w-6 h-6 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  <span className="text-lg">Loading users...</span>
                </div>
              </div>
            )}

            {error && (
              <div className="bg-gradient-to-r from-[var(--crimson-red)]/20 to-[var(--crimson-red)]/10 border border-[var(--crimson-red)]/30 rounded-lg p-4 mb-6">
                <div className="flex items-center gap-3">
                  <svg className="w-6 h-6 text-[var(--crimson-red)] flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <div>
                    <p className="text-[var(--crimson-red)] font-semibold">Error loading data</p>
                    <p className="text-[var(--crimson-red)]/80 text-sm">{error}</p>
                  </div>
                </div>
              </div>
            )}

            {!loading && !error && (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-[var(--border)]">
                  <thead className="bg-gradient-to-r from-[var(--navy-blue-lighter)] to-[var(--navy-blue-lighter)]/80">
                    <tr>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-[var(--medium-grey)] uppercase tracking-wider">
                        <div className="flex items-center gap-2">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                          </svg>
                          User
                        </div>
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-[var(--medium-grey)] uppercase tracking-wider">
                        <div className="flex items-center gap-2">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                        Status
                        </div>
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-[var(--medium-grey)] uppercase tracking-wider">
                        <div className="flex items-center gap-2">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                          </svg>
                        Groups
                        </div>
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-[var(--medium-grey)] uppercase tracking-wider">
                        <div className="flex items-center gap-2">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                          </svg>
                        Points
                        </div>
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-[var(--medium-grey)] uppercase tracking-wider">
                        <div className="flex items-center gap-2">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                        Created
                        </div>
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--border)]">
                    {(activeTab === "users" ? users : invites).map((user) => (
                      <tr
                        key={user._id}
                        className="hover:bg-gradient-to-r hover:from-[var(--navy-blue-lighter)]/30 hover:to-[var(--navy-blue-lighter)]/10 transition-all duration-200"
                      >
                        <td className="px-6 py-5 whitespace-nowrap">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-gradient-to-br from-[var(--neon-blue)] to-[var(--electric-blue)] rounded-full flex items-center justify-center">
                              <span className="text-white font-semibold text-sm">
                                {user.displayName.charAt(0).toUpperCase()}
                              </span>
                            </div>
                            <div>
                              <div className="text-sm font-semibold text-white">
                            {user.displayName}
                          </div>
                          <div className="text-sm text-[var(--medium-grey)]">
                            {user.email}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-5 whitespace-nowrap">
                          <span
                            className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                              user.status === "active"
                                ? "bg-[var(--success-green)]/20 text-[var(--success-green)] border border-[var(--success-green)]/30"
                                : user.status === "invited"
                                ? "bg-yellow-500/20 text-yellow-400 border border-yellow-500/30"
                                : "bg-[var(--crimson-red)]/20 text-[var(--crimson-red)] border border-[var(--crimson-red)]/30"
                            }`}
                          >
                            {user.status}
                          </span>
                        </td>
                        <td className="px-6 py-5 whitespace-nowrap text-sm text-white">
                          {user.groups.length > 0 ? (
                            <div className="flex flex-wrap gap-1">
                              {user.groups.map((group, index) => (
                                <span
                                  key={index}
                                  className="px-2 py-1 bg-[var(--neon-blue)]/20 text-[var(--neon-blue)] text-xs rounded-md border border-[var(--neon-blue)]/30"
                                >
                                  {group}
                                </span>
                              ))}
                            </div>
                          ) : (
                            <span className="text-[var(--medium-grey)]">-</span>
                          )}
                        </td>
                        <td className="px-6 py-5 whitespace-nowrap text-sm text-white font-semibold">
                          {user.points || 0}
                        </td>
                        <td className="px-6 py-5 whitespace-nowrap text-sm text-[var(--medium-grey)]">
                          {new Date(user.createdAt).toLocaleDateString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                {(activeTab === "users" ? users : invites).length === 0 && (
                  <div className="text-center py-12">
                    <div className="flex flex-col items-center gap-4">
                      <div className="w-16 h-16 bg-[var(--navy-blue-lighter)] rounded-full flex items-center justify-center">
                        <svg className="w-8 h-8 text-[var(--medium-grey)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                        </svg>
                      </div>
                      <div>
                        <p className="text-lg font-semibold text-white mb-1">
                          {activeTab === "users" ? "No users found" : "No pending invites"}
                        </p>
                        <p className="text-[var(--medium-grey)]">
                    {activeTab === "users"
                            ? "Start by inviting users to your organization." 
                            : "All invitations have been accepted or there are no pending invites."}
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
    </div>
  );
}
