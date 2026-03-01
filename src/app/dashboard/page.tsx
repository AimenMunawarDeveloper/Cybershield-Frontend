"use client";

import { useUser, useAuth } from "@clerk/nextjs";
import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { ApiClient } from "@/lib/api";
import ProgressRadialChart from "@/components/ProgressRadialChart";
import AreaChart from "@/components/AreaChart";
import BarChartCard from "@/components/BarChartCard";
import DataTable from "@/components/DataTable";
import ActivityFeed from "@/components/ActivityFeed";
import FloatingChat from "@/components/FloatingChat";
import UserLearningScoresSection from "@/components/UserLearningScoresSection";
import RemedialAssignmentsCard from "@/components/RemedialAssignmentsCard";
import LearningScoreDistribution from "@/components/LearningScoreDistribution";
import LearningScoreBreakdown from "@/components/LearningScoreBreakdown";
import VoicePhishingOverview from "@/components/VoicePhishingOverview";
import CampaignPerformance from "@/components/CampaignPerformance";
import { useTranslation } from "@/hooks/useTranslation";
import { generateAnalyticsReport } from "@/utils/reportGenerator";
import { Download } from "lucide-react";

interface RemedialAssignmentItem {
  _id: string;
  user: string;
  course: { _id: string; courseTitle: string; description?: string };
  reason: string;
  assignedAt: string;
  dueAt?: string;
}

interface UserProfile {
  _id: string;
  email: string;
  displayName: string;
  role: "system_admin" | "client_admin" | "affiliated" | "non_affiliated";
  orgId?: string;
  orgName?: string;
  phoneNumber?: string | null;
  learningScore?: number;
  learningScores?: { email: number; whatsapp: number; lms: number; voice?: number };
  remedialAssignments?: RemedialAssignmentItem[];
}

interface OrgSummary {
  userCount: number;
  activeCount: number;
  avgLearningScore: number; // cumulative 0–100
  avgTrainingCompletion: number; // 0-100 percentage
}

interface CampaignData {
  _id: string;
  name: string;
  status: string;
  startDate?: string;
  endDate?: string;
  managedByParentCampaign?: boolean;
}

export default function DashboardPage() {
  const { user, isLoaded } = useUser();
  const { getToken } = useAuth();
  const router = useRouter();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [phoneInput, setPhoneInput] = useState("");
  const [savingPhone, setSavingPhone] = useState(false);
  const { t, preTranslate, language } = useTranslation();
  const [translationReady, setTranslationReady] = useState(false);
  const [orgSummary, setOrgSummary] = useState<OrgSummary | null>(null);
  const [activeCampaignsCount, setActiveCampaignsCount] = useState<number>(0);
  const [loadingCampaigns, setLoadingCampaigns] = useState(false);
  const [trainingCompletion, setTrainingCompletion] = useState<number | null>(null);
  const [securityAwareness, setSecurityAwareness] = useState<{
    avgBadges: number;
    avgCertificates: number;
    usersAtRisk: number; // Percentage of users with learning score < 50
  } | null>(null);
  const [loadingSecurityAwareness, setLoadingSecurityAwareness] = useState(false);
  const [generatingReport, setGeneratingReport] = useState(false);
  
  // Tab state for dashboard sections (client admin and system admin only)
  type DashboardTab = "all" | "learning-scores" | "learning-analytics" | "voice-phishing" | "campaign-performance";
  const [activeTab, setActiveTab] = useState<DashboardTab>("all");

  const fetchUserProfile = useCallback(async () => {
    try {
      const apiClient = new ApiClient(getToken);
      const profileData = await apiClient.getUserProfile();
      console.log("Profile data received:", profileData);
      
      // Pre-translate dynamic profile data
      if (language === "ur") {
        const dynamicStrings = [
          profileData.displayName,
          profileData.orgName,
          profileData.role,
        ].filter(Boolean);
        
        await preTranslate(dynamicStrings);
      }
      
      setProfile(profileData);
    } catch (err) {
      console.error("Failed to fetch user profile:", err);
    } finally {
      setLoading(false);
    }
  }, [getToken, language, preTranslate]);

  // Fetch org summary for client_admin and system_admin
  // Client admin: their organization's users (affiliated)
  // System admin: all non-affiliated users
  useEffect(() => {
    if (!profile || (profile.role !== "client_admin" && profile.role !== "system_admin")) {
      setOrgSummary(null);
      setTrainingCompletion(null);
      return;
    }
    
    // Client admin needs orgId
    if (profile.role === "client_admin" && !profile.orgId) {
      setOrgSummary(null);
      setTrainingCompletion(null);
      return;
    }
    
    const apiClient = new ApiClient(getToken);
    
    // Fetch users based on role
    const fetchUsers = profile.role === "system_admin"
      ? apiClient.getAllUsers(1, 500).then((data: { users?: any[] }) => {
          // Filter for non-affiliated users only
          const nonAffiliatedUsers = (data.users || []).filter(
            (u: any) => u.role === "non_affiliated"
          );
          return { users: nonAffiliatedUsers, pagination: { total: nonAffiliatedUsers.length } };
        })
      : apiClient.getOrgUsers(profile.orgId!, 1, 500);
    
    fetchUsers
      .then(async (data: { 
        users?: { 
          _id?: string;
          role?: string;
          status?: string; 
          learningScore?: number;
          learningScores?: {
            lms?: number;
          };
          badges?: string[];
        }[]; 
        pagination?: { total: number } 
      }) => {
        const allUsers = data.users || [];
        // Exclude client_admin and system_admin from all calculations
        const users = allUsers.filter(
          (u) => u.role !== "client_admin" && u.role !== "system_admin"
        );
        const total = users.length;
        const activeCount = users.filter((u) => u.status === "active").length;
        
        // Include all users in average calculation (treat null/undefined as 0)
        const sumScore = users.reduce((a, u) => {
          const score = typeof u.learningScore === "number" ? u.learningScore : 0;
          return a + score;
        }, 0);
        const avgLearningScore = users.length > 0 ? sumScore / users.length : 0;
        
        // Calculate average training completion from LMS scores
        const usersWithLms = users.filter((u) => typeof u.learningScores?.lms === "number");
        const sumLms = usersWithLms.reduce((a, u) => a + (u.learningScores?.lms ?? 0), 0);
        const avgLms = usersWithLms.length > 0 ? sumLms / usersWithLms.length : 0;
        // Convert from 0-1 scale to 0-100 percentage
        const avgTrainingCompletion = Math.round(avgLms * 100);
        
        // Calculate average badges
        const totalBadges = users.reduce((sum, u) => {
          const badgeCount = Array.isArray(u.badges) ? u.badges.length : 0;
          return sum + badgeCount;
        }, 0);
        const avgBadges = users.length > 0 ? Math.round((totalBadges / users.length) * 10) / 10 : 0;
        
        // Calculate average certificates
        // Note: This requires fetching certificates for all users
        // For now, we'll fetch from a backend endpoint if available, otherwise use 0
        let totalCertificates = 0;
        let avgCertificates = 0;
        
        try {
          // Try to fetch certificate count from backend
          const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5001/api";
          const token = await getToken();
          
          if (profile.role === "client_admin" && token && profile.orgId) {
            // Client admin: fetch for their organization
            const response = await fetch(`${API_BASE_URL}/orgs/${profile.orgId}/certificates/count`, {
              headers: {
                Authorization: `Bearer ${token}`,
              },
            });
            if (response.ok) {
              const data = await response.json();
              totalCertificates = data.totalCertificates || 0;
              avgCertificates = users.length > 0 ? Math.round((totalCertificates / users.length) * 10) / 10 : 0;
            }
          } else if (profile.role === "system_admin" && token) {
            // System admin: fetch certificate count for non-affiliated users
            const response = await fetch(`${API_BASE_URL}/certificates/count/non-affiliated`, {
              headers: {
                Authorization: `Bearer ${token}`,
              },
            });
            if (response.ok) {
              const data = await response.json();
              totalCertificates = data.totalCertificates || 0;
              avgCertificates = users.length > 0 ? Math.round((totalCertificates / users.length) * 10) / 10 : 0;
            }
          }
        } catch (error) {
          console.error("Failed to fetch certificate count:", error);
          // If endpoint doesn't exist, calculate based on users who completed courses
          // Estimate: users with LMS score > 0.8 likely have certificates
          const usersWithHighLms = users.filter((u) => (u.learningScores?.lms || 0) > 0.8).length;
          avgCertificates = users.length > 0 ? Math.round((usersWithHighLms / users.length) * 10) / 10 : 0;
        }
        
        setOrgSummary({
          userCount: total,
          activeCount,
          avgLearningScore: Math.round(avgLearningScore * 10) / 10,
          avgTrainingCompletion,
        });
        setTrainingCompletion(avgTrainingCompletion);
        
        // Calculate users at risk (learning score < 50)
        const usersAtRisk = users.filter((u) => {
          const score = typeof u.learningScore === "number" ? u.learningScore : 0;
          return score < 50;
        }).length;
        const usersAtRiskPercentage = users.length > 0 
          ? Math.round((usersAtRisk / users.length) * 100)
          : 0;
        
        // Store avg badges, avg certificates, and users at risk for Security Awareness card
        setSecurityAwareness((prev) => ({
          avgBadges,
          avgCertificates,
          usersAtRisk: usersAtRiskPercentage,
        }));
      })
      .catch(() => {
        setOrgSummary(null);
        setTrainingCompletion(null);
      });
  }, [profile?.role, profile?.orgId, getToken]);

  // Fetch active campaigns count for client_admin and system_admin
  useEffect(() => {
    if (!profile || (profile.role !== "client_admin" && profile.role !== "system_admin")) {
      setActiveCampaignsCount(0);
      return;
    }
    
    setLoadingCampaigns(true);
    const apiClient = new ApiClient(getToken);
    
    Promise.all([
      apiClient.getCampaigns(1, 1000).catch(() => ({ success: false, data: { campaigns: [] } })),
      apiClient.getWhatsAppCampaigns(1, 1000).catch(() => ({ success: false, data: { campaigns: [] } })),
    ])
      .then(([emailCampaigns, whatsappCampaigns]) => {
        const email = emailCampaigns.success && emailCampaigns.data?.campaigns ? emailCampaigns.data.campaigns : [];
        const whatsapp = whatsappCampaigns.success && whatsappCampaigns.data?.campaigns ? whatsappCampaigns.data.campaigns : [];
        
        // Filter out WhatsApp campaigns that are managed by a parent Campaign (to avoid double-counting)
        // Only include standalone WhatsApp campaigns (managedByParentCampaign !== true)
        const standaloneWhatsapp = whatsapp.filter(
          (c: CampaignData) => !c.managedByParentCampaign
        );
        
        const allCampaigns = [...email, ...standaloneWhatsapp];
        
        // Count ALL campaigns regardless of status (draft, scheduled, running, paused, completed, cancelled)
        // This gives the total number of campaigns created
        const total = allCampaigns.length;
        
        setActiveCampaignsCount(total);
      })
      .catch(() => setActiveCampaignsCount(0))
      .finally(() => setLoadingCampaigns(false));
  }, [profile?.role, getToken]);

  // Users at risk is calculated in the org summary fetch above

  // Pre-translate static strings
  useEffect(() => {
    const preTranslatePageContent = async () => {
      if (language === "en") {
        setTranslationReady(true);
        return;
      }

      setTranslationReady(false);

      const staticStrings = [
        // Metrics
        "Total Organizations",
        "Total Users",
        "Active Campaigns",
        "Avg Learning Score",
        "Training Completion",
        "Your Progress",
        "Average across users",
        "Overall completion rate",
        "Courses completed",
        "Security Awareness",
        "Total Tests",
        "Tests Passed",
        "Avg Badges",
        "Your Badges",
        
        // Welcome messages
        "Welcome back, Admin",
        "Monitor platform-wide security awareness",
        "Glad to see you again!",
        "Track organization-wide user security performance",
        "Keep learning!",
        "Complete courses and improve your security awareness",
        "Track your organization performance",
        "Build your security awareness skills",
        
        // Section titles
        "User Activity Overview",
        "Your Learning Progress",
        
        // Growth indicators
        "(+15%) increase this month",
        "(+3) courses this month",
        
        // Loading/error states
        "Loading...",
        // Remedial
        "Assigned to you",
        "Go to Training",
        "Complete by the deadline to improve your security awareness.",
        "Assigned",
        "more",
        "Overdue",
        "Due today",
        "1 day left",
        "days left",
        "Due by",
        
        // Client Admin Dashboard
        "Learning Score Distribution",
        "Distribution of users across score ranges",
        "users",
        "No data available",
        "Learning Score Breakdown by Category",
        "Average scores across different training categories",
        "Score",
        "Email",
        "WhatsApp",
        "LMS",
        "Voice",
        "Voice Phishing Overview",
        "Analytics for voice phishing simulations",
        "Total Conversations",
        "Completed",
        "completion rate",
        "Average Score",
        "Fell for Phishing",
        "of phishing attempts",
        "Scenario Type Distribution",
        "Resistance Levels",
        "High",
        "Medium",
        "Low",
        "No voice phishing data available",
        "Campaign Performance",
        "Email and WhatsApp phishing campaign analytics",
        "Email Campaigns",
        "WhatsApp Campaigns",
        "Total Sent",
        "Delivered",
        "Opened",
        "Read",
        "Clicked",
        "Reported",
        "No email campaign data available",
        "No WhatsApp campaign data available",
        "Performance Comparison",
        "Delivery Rate",
        "Click Rate",
        "Report Rate",
      ];

      await preTranslate(staticStrings);
      setTranslationReady(true);
    };

    preTranslatePageContent();
  }, [language, preTranslate]);

  useEffect(() => {
    if (isLoaded && !user) {
      router.push("/sign-in");
    }
    if (isLoaded && user) {
      fetchUserProfile();
    }
  }, [isLoaded, user, router, fetchUserProfile]);

  const getRoleBasedMetrics = () => {
    console.log("getRoleBasedMetrics called with profile:", profile);
    if (!profile) {
      console.log("No profile available, returning null");
      return null;
    }

    console.log("Profile role:", profile.role);
    switch (profile.role) {
      case "system_admin":
        return {
          metric1: {
            label: t("Non-Affiliated Users"),
            value: orgSummary != null ? String(orgSummary.userCount) : "—",
            change: "+8%",
            icon: "users",
          },
          metric2: {
            label: t("Active Users"),
            value: orgSummary != null ? String(orgSummary.activeCount) : "—",
            change: "+3%",
            icon: "user-check",
          },
          metric3: {
            label: t("Total Campaigns"),
            value: loadingCampaigns ? "—" : String(activeCampaignsCount),
            change: loadingCampaigns ? "" : "",
            icon: "shield",
          },
          metric4: {
            label: t("Avg Learning Score"),
            value: orgSummary != null ? `${orgSummary.avgLearningScore.toFixed(1)}/100` : "—",
            change: "0–100",
            icon: "chart",
          },
        };
      case "client_admin":
        return {
          metric1: {
            label: t("Organization Users"),
            value: orgSummary != null ? String(orgSummary.userCount) : "—",
            change: "+8%",
            icon: "users",
          },
          metric2: {
            label: t("Active Users"),
            value: orgSummary != null ? String(orgSummary.activeCount) : "—",
            change: "+3%",
            icon: "user-check",
          },
          metric3: {
            label: t("Total Campaigns"),
            value: loadingCampaigns ? "—" : String(activeCampaignsCount),
            change: loadingCampaigns ? "" : "",
            icon: "shield",
          },
          metric4: {
            label: t("Avg Learning Score"),
            value: orgSummary != null ? `${orgSummary.avgLearningScore.toFixed(1)}/100` : "—",
            change: "0–100",
            icon: "chart",
          },
        };
      case "affiliated":
        return {
          metric1: {
            label: t("Courses Completed"),
            value: "8/15",
            change: "+2",
            icon: "book",
          },
          metric2: {
            label: t("Learning scores (Email / WhatsApp / Voice)"),
            value: (profile.learningScores ? [profile.learningScores.email, profile.learningScores.whatsapp, profile.learningScores.voice ?? 0] : [0, 0, 0]).map((s) => (typeof s === "number" ? s.toFixed(2) : "0.00")).join(" / "),
            change: "E / W / V",
            icon: "shield-check",
          },
          metric3: {
            label: t("Learning score (LMS)"),
            value: typeof profile.learningScores?.lms === "number" ? profile.learningScores.lms.toFixed(2) : "0.00",
            change: "0–1",
            icon: "book",
          },
          metric4: {
            label: t("Certificates"),
            value: "5",
            change: "+1",
            icon: "award",
          },
        };
      case "non_affiliated":
        return {
          metric1: {
            label: t("Courses Completed"),
            value: "3/10",
            change: "+1",
            icon: "book",
          },
          metric2: {
            label: t("Learning scores (Email / WhatsApp / Voice)"),
            value: (profile.learningScores ? [profile.learningScores.email, profile.learningScores.whatsapp, profile.learningScores.voice ?? 0] : [0, 0, 0]).map((s) => (typeof s === "number" ? s.toFixed(2) : "0.00")).join(" / "),
            change: "E / W / V",
            icon: "shield-check",
          },
          metric3: {
            label: t("Learning score (LMS)"),
            value: typeof profile.learningScores?.lms === "number" ? profile.learningScores.lms.toFixed(2) : "0.00",
            change: "0–1",
            icon: "book",
          },
          metric4: {
            label: t("Certificates"),
            value: "2",
            change: "+1",
            icon: "award",
          },
        };
      default:
        return null;
    }
  };

  const getWelcomeMessage = () => {
    if (!profile) return { greeting: t("Welcome back"), name: t("User") };

    const firstName = t(profile.displayName?.split(" ")[0] || "User");

    switch (profile.role) {
      case "system_admin":
        return {
          greeting: t("Welcome back, Admin"),
          name: firstName,
          subtitle: t("Monitor platform-wide security awareness"),
          action: t("Review system analytics"),
        };
      case "client_admin":
        return {
          greeting: `${t("Welcome back")}, ${t(profile.orgName || "Organization")} ${t("Admin")}`,
          name: firstName,
          subtitle: t("Manage your institution's cybersecurity training"),
          action: t("Review organization reports"),
        };
      case "affiliated":
        return {
          greeting: t("Welcome back"),
          name: firstName,
          subtitle: t("Continue your cybersecurity awareness journey"),
          action: t("Resume your training"),
        };
      case "non_affiliated":
        return {
          greeting: t("Welcome back"),
          name: firstName,
          subtitle: t("Continue building your cyber resilience"),
          action: t("Explore available courses"),
        };
    }
  };

  if (!isLoaded || loading || !translationReady) {
    return (
      <div className="flex flex-1 items-center justify-center min-h-screen">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-[var(--neon-blue)] mx-auto"></div>
          <p className="text-[var(--light-blue)] text-lg">
            {language === "ur" ? "لوڈ ہو رہا ہے..." : "Loading..."}
          </p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  const metrics = getRoleBasedMetrics();
  const welcomeMsg = getWelcomeMessage();
  const showPhonePrompt =
    profile && (profile.role === "affiliated" || profile.role === "non_affiliated") &&
    !profile.phoneNumber;

  const handleSavePhone = async () => {
    if (!phoneInput.trim() || savingPhone) return;
    setSavingPhone(true);
    try {
      const apiClient = new ApiClient(getToken);
      await apiClient.updateProfile({ phoneNumber: phoneInput.trim() });
      await fetchUserProfile();
      setPhoneInput("");
    } catch (e) {
      console.error("Failed to update phone:", e);
    } finally {
      setSavingPhone(false);
    }
  };

  return (
    <>
      <div className="flex flex-1 flex-col gap-6 p-6 pt-4 relative">
        {/* Blurred background element - shows in both dark and light mode */}
        <div className="blurred-background"></div>

        {/* Add phone number prompt for affiliated/non_affiliated (needed for WhatsApp simulations) */}
        {showPhonePrompt && (
          <div className="dashboard-card rounded-lg p-4 relative z-10 border border-amber-500/30 bg-amber-500/5">
            <p className="text-sm text-[var(--dashboard-text-primary)] mb-2">
              {t("Add your phone number to receive WhatsApp phishing simulations and track your learning scores.")}
            </p>
            <div className="flex flex-wrap items-center gap-2">
              <input
                type="tel"
                value={phoneInput}
                onChange={(e) => setPhoneInput(e.target.value)}
                placeholder="+923001234567"
                className="px-3 py-2 rounded-lg border border-[var(--sidebar-border)] bg-[var(--navy-blue-lighter)] text-[var(--dashboard-text-primary)] text-sm w-48"
              />
              <button
                type="button"
                onClick={handleSavePhone}
                disabled={savingPhone || !phoneInput.trim()}
                className="px-4 py-2 bg-[var(--neon-blue)] text-white rounded-lg text-sm font-medium disabled:opacity-50"
              >
                {savingPhone ? t("Saving...") : t("Save")}
              </button>
            </div>
          </div>
        )}

        {/* View Selector Dropdown for Client Admin and System Admin - At the top */}
        {((profile?.role === "client_admin" && profile.orgId) || profile?.role === "system_admin") && (
          <div className="relative z-10">
            <div className="dashboard-card rounded-lg p-4 border border-[var(--sidebar-border)]">
              <div className="flex items-center justify-between flex-wrap gap-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 bg-[var(--neon-blue)]/15 rounded-lg flex items-center justify-center">
                    <svg
                      className="w-4 h-4 text-[var(--neon-blue)]"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"
                      />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-[var(--dashboard-text-primary)]">
                      {t("Dashboard View")}
                    </h3>
                    <p className="text-xs text-[var(--dashboard-text-secondary)]">
                      {t("Select which analytics to display")}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <label className="text-xs text-[var(--dashboard-text-secondary)] hidden sm:block whitespace-nowrap">
                    {t("View")}:
                  </label>
                  <div className="relative">
                    <select
                      value={activeTab}
                      onChange={(e) => setActiveTab(e.target.value as DashboardTab)}
                      className="appearance-none bg-[var(--navy-blue-lighter)] border border-[var(--sidebar-border)] rounded-lg px-3.5 py-2 pr-9 text-sm text-[var(--dashboard-text-primary)] focus:border-[var(--neon-blue)] focus:outline-none focus:ring-1 focus:ring-[var(--neon-blue)]/20 cursor-pointer transition-all min-w-[180px] hover:border-[var(--neon-blue)]/40"
                    >
                      <option value="all">{t("All Sections")}</option>
                      <option value="learning-scores">{t("Learning Scores")}</option>
                      <option value="learning-analytics">{t("Learning Analytics")}</option>
                      <option value="voice-phishing">{t("Voice Phishing")}</option>
                      <option value="campaign-performance">{t("Campaign Performance")}</option>
                    </select>
                    <div className="absolute inset-y-0 right-0 flex items-center pr-2.5 pointer-events-none">
                      <svg
                        className="w-4 h-4 text-[var(--dashboard-text-secondary)]"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M19 9l-7 7-7-7"
                        />
                      </svg>
                    </div>
                  </div>
                  <button
                    onClick={async () => {
                      if (!profile) return;
                      try {
                        setGeneratingReport(true);
                        await generateAnalyticsReport(getToken, profile);
                      } catch (error) {
                        console.error("Failed to generate report:", error);
                        alert(t("Failed to generate report. Please try again."));
                      } finally {
                        setGeneratingReport(false);
                      }
                    }}
                    disabled={generatingReport || !profile}
                    className="flex items-center gap-2 px-4 py-2 bg-[var(--neon-blue)] text-white rounded-lg text-sm font-medium hover:bg-[var(--medium-blue)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Download className="w-4 h-4" />
                    {generatingReport ? t("Generating...") : t("Download Report")}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Top Row Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 relative z-10">
          {/* Metric 1 Card */}
          <div className="dashboard-card rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div className="text-left">
                <p className="text-xs text-[var(--dashboard-text-secondary)]">
                  {metrics?.metric1.label}
                </p>
                <p className="text-lg font-bold text-[var(--dashboard-text-primary)]">
                  {metrics?.metric1.value}
                </p>
                <p
                  className={`text-xs ${
                    metrics?.metric1.change.startsWith("+") ||
                    metrics?.metric1.change.startsWith("-0")
                      ? "text-[var(--success-green)]"
                      : "text-[var(--crimson-red)]"
                  }`}
                >
                  {metrics?.metric1.change}
                </p>
              </div>
              <div className="w-10 h-10 bg-[var(--neon-blue)] rounded-lg flex items-center justify-center">
                <svg
                  className="w-5 h-5 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                  />
                </svg>
              </div>
            </div>
          </div>

          {/* Metric 2 Card */}
          <div className="dashboard-card rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div className="text-left">
                <p className="text-xs text-[var(--dashboard-text-secondary)]">
                  {metrics?.metric2.label}
                </p>
                <p className="text-lg font-bold text-[var(--dashboard-text-primary)]">
                  {metrics?.metric2.value}
                </p>
                <p
                  className={`text-xs ${
                    metrics?.metric2.change.startsWith("+")
                      ? "text-[var(--success-green)]"
                      : "text-[var(--crimson-red)]"
                  }`}
                >
                  {metrics?.metric2.change}
                </p>
              </div>
              <div className="w-10 h-10 bg-[var(--neon-blue)] rounded-lg flex items-center justify-center">
                <svg
                  className="w-5 h-5 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                  />
                </svg>
              </div>
            </div>
          </div>

          {/* Metric 3 Card */}
          <div className="dashboard-card rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div className="text-left">
                <p className="text-xs text-[var(--dashboard-text-secondary)]">
                  {metrics?.metric3.label}
                </p>
                <p className="text-lg font-bold text-[var(--dashboard-text-primary)]">
                  {metrics?.metric3.value}
                </p>
                <p
                  className={`text-xs ${
                    metrics?.metric3.change.startsWith("+") ||
                    metrics?.metric3.change.startsWith("-")
                      ? "text-[var(--success-green)]"
                      : "text-[var(--crimson-red)]"
                  }`}
                >
                  {metrics?.metric3.change}
                </p>
              </div>
              <div className="w-10 h-10 bg-[var(--neon-blue)] rounded-lg flex items-center justify-center">
                <svg
                  className="w-5 h-5 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                  />
                </svg>
              </div>
            </div>
          </div>

          {/* Metric 4 Card */}
          <div className="dashboard-card rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div className="text-left">
                <p className="text-xs text-[var(--dashboard-text-secondary)]">
                  {metrics?.metric4.label}
                </p>
                <p className="text-lg font-bold text-[var(--dashboard-text-primary)]">
                  {metrics?.metric4.value}
                </p>
                <p
                  className={`text-xs ${
                    metrics?.metric4.change.startsWith("-") &&
                    !metrics?.metric4.change.includes("/")
                      ? "text-[var(--success-green)]"
                      : metrics?.metric4.change.startsWith("+")
                      ? "text-[var(--success-green)]"
                      : "text-[var(--crimson-red)]"
                  }`}
                >
                  {metrics?.metric4.change}
                </p>
              </div>
              <div className="w-10 h-10 bg-[var(--neon-blue)] rounded-lg flex items-center justify-center">
                <svg
                  className="w-5 h-5 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                  />
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-8 relative z-10">
          {/* Welcome Component */}
          <div className="lg:col-span-1">
            <div className="dashboard-card rounded-lg p-8 relative overflow-hidden">
              <div className="relative z-10">
                <p className="text-sm text-[var(--dashboard-text-secondary)] mb-1">
                  {welcomeMsg?.greeting}
                </p>
                <h2 className="text-2xl font-bold text-[var(--dashboard-text-primary)] mb-2">
                  {welcomeMsg?.name}
                </h2>
                <p className="text-sm text-[var(--dashboard-text-secondary)] mb-1">
                  {t("Glad to see you again!")}
                </p>
                <p className="text-sm text-[var(--dashboard-text-secondary)] mb-6">
                  {welcomeMsg?.subtitle}
                </p>
                <div className="flex items-center text-[var(--neon-blue)] cursor-pointer hover:opacity-80 transition-colors">
                  <span className="text-sm">{welcomeMsg?.action}</span>
                  <svg
                    className="w-4 h-4 ml-1"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 5l7 7-7 7"
                    />
                  </svg>
                </div>
              </div>
            </div>
          </div>

          {/* Training Completion Rate Component */}
          <div className="lg:col-span-1">
            <div className="dashboard-card rounded-lg p-6">
              <div className="mb-4">
                <h3 className="text-lg font-semibold text-[var(--dashboard-text-primary)]">
                  {profile?.role === "system_admin" ||
                  profile?.role === "client_admin"
                    ? t("Training Completion")
                    : t("Your Progress")}
                </h3>
                <p className="text-xs text-[var(--dashboard-text-secondary)]">
                  {profile?.role === "system_admin" ||
                  profile?.role === "client_admin"
                    ? t("Average across users")
                    : t("Overall completion rate")}
                </p>
              </div>
              <div className="flex flex-col items-center mb-6">
                {/* Progress Radial Chart */}
                <ProgressRadialChart
                  value={
                    profile?.role === "client_admin" || profile?.role === "system_admin"
                      ? trainingCompletion ?? 0
                      : profile?.role === "affiliated"
                      ? 73
                      : profile?.role === "non_affiliated"
                      ? 45
                      : 85
                  }
                  size={160}
                  showIcon={true}
                />
              </div>
              {/* Darker background box for percentage */}
              <div className="bg-[var(--navy-blue)] rounded-lg p-4 transition-colors">
                <div className="text-center">
                  <p className="text-3xl font-bold text-[var(--dashboard-text-primary)]">
                    {profile?.role === "client_admin" || profile?.role === "system_admin"
                      ? trainingCompletion !== null
                        ? `${trainingCompletion}%`
                        : "—"
                      : profile?.role === "affiliated"
                      ? "73%"
                      : profile?.role === "non_affiliated"
                      ? "45%"
                      : "85%"}
                  </p>
                  <p className="text-xs text-[var(--dashboard-text-secondary)]">
                    {t("Courses completed")}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Security Awareness Component */}
          <div className="lg:col-span-1">
            <div className="dashboard-card rounded-lg p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-[var(--dashboard-text-primary)]">
                  {t("Security Awareness")}
                </h3>
                <button className="w-8 h-8 bg-[var(--navy-blue-lighter)] rounded-lg flex items-center justify-center transition-colors">
                  <svg
                    className="w-4 h-4 text-[var(--dashboard-text-primary)]"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                </button>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {/* Left Side - Stats Cards */}
                <div className="space-y-3">
                  {/* Average Certificates Card */}
                  <div className="bg-[var(--navy-blue-lighter)] rounded-lg p-4 transition-colors">
                    <p className="text-xs text-[var(--dashboard-text-secondary)] mb-1">
                      {profile?.role === "system_admin" ||
                      profile?.role === "client_admin"
                        ? t("Avg Certificates")
                        : t("Tests Passed")}
                    </p>
                    <p className="text-lg font-bold text-[var(--dashboard-text-primary)]">
                      {profile?.role === "client_admin" || profile?.role === "system_admin"
                        ? securityAwareness?.avgCertificates !== undefined
                          ? securityAwareness.avgCertificates.toFixed(1)
                          : "0.0"
                        : profile?.role === "affiliated"
                        ? "12/15"
                        : "8/10"}
                    </p>
                  </div>

                  {/* Badges Card */}
                  <div className="bg-[var(--navy-blue-lighter)] rounded-lg p-4 transition-colors">
                    <p className="text-xs text-[var(--dashboard-text-secondary)] mb-1">
                      {profile?.role === "system_admin" ||
                      profile?.role === "client_admin"
                        ? t("Avg Badges")
                        : t("Your Badges")}
                    </p>
                    <p className="text-lg font-bold text-[var(--dashboard-text-primary)]">
                      {profile?.role === "client_admin" || profile?.role === "system_admin"
                        ? securityAwareness?.avgBadges !== undefined
                          ? securityAwareness.avgBadges.toFixed(1)
                          : "0.0"
                        : profile?.role === "affiliated"
                        ? "8"
                        : profile?.role === "non_affiliated"
                        ? "4"
                        : "6.4"}
                    </p>
                  </div>
                </div>

                {/* Right Side - Users at Risk */}
                <div className="flex items-center justify-center">
                  <ProgressRadialChart
                    value={
                      profile?.role === "client_admin" || profile?.role === "system_admin"
                        ? securityAwareness?.usersAtRisk || 0
                        : profile?.role === "affiliated"
                        ? 18
                        : profile?.role === "non_affiliated"
                        ? 35
                        : 22
                    }
                    size={128}
                    showIcon={false}
                    showScore={true}
                    scoreValue={
                      profile?.role === "client_admin" || profile?.role === "system_admin"
                        ? securityAwareness?.usersAtRisk || 0
                        : profile?.role === "affiliated"
                        ? 18
                        : profile?.role === "non_affiliated"
                        ? 35
                        : 22
                    }
                    label={t("Users at Risk")}
                    sublabel={t("Score < 50")}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Remedial / Assigned courses (below progress radial; learners only) */}
        {(profile?.role === "affiliated" || profile?.role === "non_affiliated") &&
          Array.isArray(profile?.remedialAssignments) &&
          profile.remedialAssignments.length > 0 && (
            <div className="mt-8 relative z-10">
              <RemedialAssignmentsCard
                assignments={profile.remedialAssignments}
                t={t}
                variant="dashboard"
                showViewAll
                maxDisplay={5}
              />
            </div>
          )}


        {/* Learning scores (admins only) */}
        {((profile?.role === "client_admin" && profile.orgId) || profile?.role === "system_admin") && 
         (activeTab === "all" || activeTab === "learning-scores") && (
          <UserLearningScoresSection getToken={getToken} profile={profile} />
        )}

        {/* Client Admin and System Admin Specific Analytics Sections */}
        {((profile?.role === "client_admin" && profile.orgId) || profile?.role === "system_admin") && (
          <>
            {/* Learning Analytics Section */}
            {(activeTab === "all" || activeTab === "learning-analytics") && (
              <div className="mt-8 relative z-10">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div className="dashboard-card rounded-lg p-6">
                    <LearningScoreDistribution 
                      orgId={profile?.role === "client_admin" ? profile.orgId : undefined}
                      userRole={profile?.role as "system_admin" | "client_admin"}
                    />
                  </div>
                  <div className="dashboard-card rounded-lg p-6">
                    <LearningScoreBreakdown 
                      orgId={profile?.role === "client_admin" ? profile.orgId : undefined}
                      userRole={profile?.role as "system_admin" | "client_admin"}
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Voice Phishing Overview Section */}
            {(activeTab === "all" || activeTab === "voice-phishing") && (
              <div className="mt-8 relative z-10">
                <div className="dashboard-card rounded-lg p-6">
                  <VoicePhishingOverview />
                </div>
              </div>
            )}

            {/* Campaign Performance Section */}
            {(activeTab === "all" || activeTab === "campaign-performance") && (
              <div className="mt-8 relative z-10">
                <div className="dashboard-card rounded-lg p-6">
                  <CampaignPerformance />
                </div>
              </div>
            )}
          </>
        )}

        {/* Area Chart Section - Hidden for client_admin and system_admin */}
        {profile?.role !== "client_admin" && profile?.role !== "system_admin" && (
          <div className="mt-8 relative z-10">
            <div className="dashboard-card rounded-lg p-6">
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-[var(--dashboard-text-primary)]">
                  {t("Your Learning Progress")}
                </h3>
                <p className="text-xs text-[var(--success-green)]">
                  {t("(+3) courses this month")}
                </p>
              </div>
              <AreaChart userRole={profile?.role} />
            </div>
          </div>
        )}
        {/* Bar Chart Card Section - Hidden for client_admin and system_admin */}
        {profile?.role !== "client_admin" && profile?.role !== "system_admin" && (
          <div className="mt-8 relative z-10">
            <BarChartCard userRole={profile?.role} />
          </div>
        )}

        {/* Data Table and Activity Feed Section - Hidden for client_admin and system_admin */}
        {profile?.role !== "client_admin" && profile?.role !== "system_admin" && (
          <div className="mt-8 relative z-10">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <DataTable userRole={profile?.role} />
              <ActivityFeed userRole={profile?.role} />
            </div>
          </div>
        )}
      </div>
      {/* Floating Chat */}
      <FloatingChat />
    </>
  );
}
