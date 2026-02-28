"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@clerk/nextjs";
import { useUser } from "@clerk/nextjs";
import { Medal, Globe, Building2, Award, Trophy, Loader2 } from "lucide-react";
import NetworkBackground from "@/components/NetworkBackground";
import { useTranslation } from "@/hooks/useTranslation";
import { ApiClient } from "@/lib/api";

type LeaderboardType = "global" | "organization";

interface LeaderboardEntry {
  position: number;
  name: string;
  email: string;
  learningScore: number;
}

interface UserProfile {
  _id: string;
  orgId?: string;
  role: string;
}

function getOrdinal(n: number): string {
  const s = ["th", "st", "nd", "rd"];
  const v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
}

export default function LeaderboardsPage() {
  const { t } = useTranslation();
  const { getToken } = useAuth();
  const { user, isLoaded } = useUser();
  const [activeTab, setActiveTab] = useState<LeaderboardType>("global");
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [globalLeaderboard, setGlobalLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [orgLeaderboard, setOrgLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch user profile
  useEffect(() => {
    if (isLoaded && user) {
      const fetchProfile = async () => {
        try {
          const apiClient = new ApiClient(getToken);
          const profileData = await apiClient.getUserProfile();
          setProfile(profileData);
        } catch (error) {
          console.error("Error fetching profile:", error);
        }
      };
      fetchProfile();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoaded, user]);

  // Fetch global leaderboard (only non_affiliated users sorted by learningScore)
  useEffect(() => {
    if (isLoaded && user) {
      const fetchGlobalLeaderboard = async () => {
        try {
          setLoading(true);
          const apiClient = new ApiClient(getToken);
          const data = await apiClient.getAllUsers(1, 1000);
          
          // Filter to only show non_affiliated users and sort by learningScore descending
          const users = (data.users || [])
            .filter((u: any) => u.role === "non_affiliated")
            .map((u: any) => ({
              position: 0, // Will be set after sorting
              name: u.displayName || u.email,
              email: u.email,
              learningScore: u.learningScore || 0,
            }))
            .sort((a: LeaderboardEntry, b: LeaderboardEntry) => b.learningScore - a.learningScore)
            .map((entry: LeaderboardEntry, index: number) => ({
              ...entry,
              position: index + 1,
            }));
          
          setGlobalLeaderboard(users);
        } catch (error) {
          console.error("Error fetching global leaderboard:", error);
          setGlobalLeaderboard([]);
        } finally {
          setLoading(false);
        }
      };
      fetchGlobalLeaderboard();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoaded, user]);

  // Fetch organization leaderboard
  useEffect(() => {
    if (isLoaded && user && profile && profile.orgId) {
      const fetchOrgLeaderboard = async () => {
        try {
          const apiClient = new ApiClient(getToken);
          // Ensure orgId is a string
          const orgIdString = typeof profile.orgId === 'string' ? profile.orgId : String(profile.orgId);
          const data = await apiClient.getOrgUsers(orgIdString, 1, 1000);
          
          console.log("Org users data:", data); // Debug log
          console.log("Total users fetched:", data.users?.length || 0); // Debug log
          
          // Filter out only system_admin (they don't belong to specific orgs)
          // Show all users in the organization: affiliated users and client_admin (they belong to the org)
          const allUsers = data.users || [];
          const orgUsers = allUsers.filter((u: any) => u.role !== "system_admin");
          
          console.log("Org users (excluding system_admin):", orgUsers.length); // Debug log
          console.log("User roles in org:", allUsers.map((u: any) => ({ email: u.email, role: u.role }))); // Debug log
          
          const users = orgUsers
            .map((u: any) => ({
              position: 0, // Will be set after sorting
              name: u.displayName || u.email,
              email: u.email,
              learningScore: u.learningScore || 0,
            }))
            .sort((a: LeaderboardEntry, b: LeaderboardEntry) => b.learningScore - a.learningScore)
            .map((entry: LeaderboardEntry, index: number) => ({
              ...entry,
              position: index + 1,
            }));
          
          console.log("Filtered org leaderboard users:", users); // Debug log
          setOrgLeaderboard(users);
        } catch (error) {
          console.error("Error fetching organization leaderboard:", error);
          console.error("Error details:", error instanceof Error ? error.message : String(error));
          setOrgLeaderboard([]);
        }
      };
      fetchOrgLeaderboard();
    } else if (profile && !profile.orgId) {
      // User doesn't have an organization
      console.log("User has no orgId, setting org leaderboard to empty");
      setOrgLeaderboard([]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoaded, user, profile]);

  const entries = activeTab === "global" ? globalLeaderboard : orgLeaderboard;
  const topThree = entries.slice(0, 3);
  // Podium order: 2nd (left), 1st (center), 3rd (right)
  const podiumOrder = [topThree[1], topThree[0], topThree[2]];

  const getPositionStyle = (position: number) => {
    if (position === 1) return "bg-amber-500/20 text-amber-600 dark:text-amber-400 border-amber-500/40";
    if (position === 2) return "bg-slate-400/20 text-slate-600 dark:text-slate-300 border-slate-400/40";
    if (position === 3) return "bg-amber-700/20 text-amber-700 dark:text-amber-600 border-amber-700/40";
    return "bg-gray-200 dark:bg-[var(--navy-blue)] text-[var(--dashboard-text-primary)] dark:text-[var(--light-blue)] border-gray-300 dark:border-[var(--neon-blue)]/30";
  };

  const getTrophyStyle = (position: number) => {
    if (position === 1) return "bg-amber-400 text-amber-900 border-amber-300 shadow-amber-400/40";
    if (position === 2) return "bg-slate-300 text-slate-800 border-slate-200 shadow-slate-400/40";
    if (position === 3) return "bg-amber-600 text-amber-100 border-amber-500 shadow-amber-700/40";
    return "";
  };

  const getInitials = (name: string) =>
    name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .slice(0, 2)
      .toUpperCase();

  if (loading || !isLoaded) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[var(--navy-blue)] via-[var(--navy-blue-light)] to-[var(--navy-blue)] relative flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-[var(--neon-blue)] mx-auto mb-4" />
          <p className="text-[var(--dashboard-text-secondary)] dark:text-[var(--light-blue)]">
            {t("Loading leaderboard...")}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[var(--navy-blue)] via-[var(--navy-blue-light)] to-[var(--navy-blue)] relative">
      <NetworkBackground />
      {/* Hero Section */}
      <div className="relative py-12 px-4 sm:px-6 lg:px-8 overflow-hidden">
        <div className="blurred-background" />
        <div className="max-w-7xl mx-auto relative z-10">
          <div className="text-center space-y-4">
            <div className="flex justify-center mb-4">
              <div className="w-16 h-16 bg-[var(--neon-blue)] rounded-2xl flex items-center justify-center shadow-lg shadow-[var(--neon-blue)]/30">
                <Medal className="w-8 h-8 text-white" />
              </div>
            </div>
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-[var(--dashboard-text-primary)] dark:text-white leading-tight">
              {t("Leaderboards")}
              <span className="block text-[var(--neon-blue)] mt-1">
                {t("Top performers by learning score")}
              </span>
            </h1>
            <p className="text-base md:text-lg text-[var(--dashboard-text-secondary)] dark:text-[var(--light-blue)] max-w-2xl mx-auto">
              {t("See how you rank globally or within your organization.")}
            </p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="bg-[var(--dashboard-card-bg)] dark:bg-[var(--navy-blue-light)]/95 backdrop-blur-sm rounded-t-3xl mt-8 min-h-screen ml-4 mr-4">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          {/* Top 3 Podium */}
          {topThree.length > 0 && (
            <div className="mb-14">
              <h2 className="text-center text-lg font-semibold text-[var(--dashboard-text-primary)] dark:text-[var(--light-blue)] mb-8">
                {t("Top 3")}
              </h2>
              <div className="grid grid-cols-3 gap-4 items-end max-w-2xl mx-auto">
                {podiumOrder.filter(Boolean).map((entry) => (
                <div
                  key={`podium-${activeTab}-${entry.position}`}
                  className="flex flex-col items-center"
                >
                  {/* Avatar + medal */}
                  <div className="relative mb-3">
                    <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-gray-200 dark:bg-[var(--navy-blue)] border-2 border-gray-400 dark:border-[var(--neon-blue)]/50 flex items-center justify-center text-xl sm:text-2xl font-bold text-[var(--neon-blue)] shadow-lg shadow-[var(--neon-blue)]/20">
                      {getInitials(entry.name)}
                    </div>
                    <div
                      className={`absolute -top-1 -right-1 w-8 h-8 rounded-full border-2 flex items-center justify-center shadow-lg ${getTrophyStyle(
                        entry.position
                      )}`}
                      title={entry.position === 1 ? "1st" : entry.position === 2 ? "2nd" : "3rd"}
                    >
                      <Trophy className="w-4 h-4" />
                    </div>
                  </div>
                  <p className="font-bold text-[var(--dashboard-text-primary)] dark:text-white text-center text-sm sm:text-base truncate w-full max-w-[120px]">
                    {entry.name}
                  </p>
                  <p className="text-xs text-[var(--dashboard-text-secondary)] dark:text-[var(--medium-grey)] text-center truncate w-full max-w-[120px] mt-0.5">
                    {entry.email}
                  </p>
                  <div className="flex items-center gap-1.5 mt-2">
                    <Award className="w-4 h-4 text-[var(--neon-blue)] flex-shrink-0" />
                    <span className="font-semibold text-[var(--dashboard-text-primary)] dark:text-white text-sm tabular-nums">
                      {entry.learningScore}
                    </span>
                  </div>
                  {/* Podium block */}
                  <div
                    className={`w-full mt-4 rounded-t-lg border border-gray-300 dark:border-[var(--neon-blue)]/30 flex items-center justify-center font-bold text-[var(--dashboard-text-secondary)] dark:text-[var(--light-blue)]/60 text-2xl sm:text-3xl
                      ${entry.position === 1 ? "h-20 sm:h-24 bg-gray-200 dark:bg-[var(--navy-blue)]/90" : ""}
                      ${entry.position === 2 ? "h-14 sm:h-16 bg-gray-200 dark:bg-[var(--navy-blue)]/80" : ""}
                      ${entry.position === 3 ? "h-10 sm:h-12 bg-gray-200 dark:bg-[var(--navy-blue)]/70" : ""}`}
                  >
                    {entry.position}
                  </div>
                </div>
                ))}
              </div>
            </div>
          )}

          {topThree.length === 0 && (
            <div className="mb-14 text-center">
              <p className="text-[var(--dashboard-text-secondary)] dark:text-[var(--medium-grey)]">
                {activeTab === "global"
                  ? t("No users found for global leaderboard.")
                  : t("No users found in your organization.")}
              </p>
            </div>
          )}

          {/* Tabs: Global | Organization */}
          <div className="flex justify-center mb-10">
            <div className="inline-flex gap-6 p-1.5 bg-gray-200 dark:bg-[var(--navy-blue)] rounded-xl border border-gray-300 dark:border-[var(--neon-blue)]/20">
            <button
              type="button"
              onClick={() => setActiveTab("global")}
              className={`w-40 flex items-center justify-center gap-2 py-3 rounded-lg font-semibold transition-all duration-200 ${
                activeTab === "global"
                  ? "bg-[var(--neon-blue)] text-white shadow-lg shadow-[var(--neon-blue)]/30"
                  : "text-[var(--dashboard-text-primary)] dark:text-[var(--light-blue)] hover:bg-gray-300 dark:hover:bg-white/5"
              }`}
            >
              <Globe className="w-5 h-5" />
              {t("Global")}
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("organization")}
              className={`w-40 flex items-center justify-center gap-2 py-3 rounded-lg font-semibold transition-all duration-200 ${
                activeTab === "organization"
                  ? "bg-[var(--neon-blue)] text-white shadow-lg shadow-[var(--neon-blue)]/30"
                  : "text-[var(--dashboard-text-primary)] dark:text-[var(--light-blue)] hover:bg-gray-300 dark:hover:bg-white/5"
              }`}
            >
              <Building2 className="w-5 h-5" />
              {t("Organization")}
            </button>
            </div>
          </div>

          {/* Table header */}
          <div className="grid grid-cols-[auto_1fr_auto] gap-4 px-4 py-3 rounded-t-xl bg-gray-100 dark:bg-[var(--navy-blue)]/80 border border-gray-300 dark:border-[var(--neon-blue)]/20 border-b-0 text-[var(--dashboard-text-secondary)] dark:text-[var(--medium-grey)] text-sm font-medium">
            <span className="w-14 text-center">{t("Rank")}</span>
            <span>{t("Participant")}</span>
            <span className="w-24 text-right">{t("Score")}</span>
          </div>

          {/* Leaderboard list */}
          {entries.length > 0 ? (
            <ul className="rounded-b-xl border border-gray-300 dark:border-[var(--neon-blue)]/20 border-t-0 overflow-hidden bg-white dark:bg-[var(--navy-blue)]/40">
              {entries.map((entry, index) => (
              <li
                key={`${activeTab}-${entry.position}-${entry.email}`}
                className={`grid grid-cols-[auto_1fr_auto] gap-4 items-center px-4 py-4 border-b border-gray-200 dark:border-[var(--neon-blue)]/10 last:border-b-0 ${
                  index % 2 === 0 ? "bg-gray-50 dark:bg-[var(--navy-blue)]/30" : "bg-white dark:bg-[var(--navy-blue)]/20"
                } hover:bg-gray-100 dark:hover:bg-[var(--neon-blue)]/10 transition-colors`}
              >
                <div className="flex justify-center w-14">
                  <span
                    className={`inline-flex items-center justify-center w-10 h-10 rounded-full border font-bold text-sm ${getPositionStyle(
                      entry.position
                    )}`}
                  >
                    {getOrdinal(entry.position)}
                  </span>
                </div>
                <div className="min-w-0">
                  <p className="font-bold text-[var(--dashboard-text-primary)] dark:text-white truncate">{entry.name}</p>
                  <p className="text-xs text-[var(--dashboard-text-secondary)] dark:text-[var(--medium-grey)] truncate mt-0.5">
                    {entry.email}
                  </p>
                </div>
                <div className="flex items-center justify-end gap-1.5 w-24">
                  <Award className="w-4 h-4 text-[var(--neon-blue)] flex-shrink-0" />
                  <span className="font-semibold text-[var(--dashboard-text-primary)] dark:text-white tabular-nums">
                    {entry.learningScore}
                  </span>
                </div>
              </li>
              ))}
            </ul>
          ) : (
            <div className="rounded-b-xl border border-gray-300 dark:border-[var(--neon-blue)]/20 border-t-0 bg-white dark:bg-[var(--navy-blue)]/40 p-8 text-center">
              <p className="text-[var(--dashboard-text-secondary)] dark:text-[var(--medium-grey)]">
                {activeTab === "global"
                  ? t("No users found for global leaderboard.")
                  : t("No users found in your organization.")}
              </p>
            </div>
          )}

          <p className="mt-6 text-center text-sm text-[var(--dashboard-text-secondary)] dark:text-[var(--medium-grey)]">
            {activeTab === "global"
              ? t("Global leaderboard shows top performers across all organizations.")
              : t("Organization leaderboard shows top performers within your organization.")}
          </p>
        </div>
      </div>
    </div>
  );
}
