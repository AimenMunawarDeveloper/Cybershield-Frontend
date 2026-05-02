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
          const data = await apiClient.getGlobalLeaderboard();
          
          const users = (data.leaderboard || []).map((entry: any) => ({
            position: entry.position,
            name: entry.name,
            email: entry.email,
            learningScore: entry.learningScore || 0,
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
    if (isLoaded && user && profile) {
      // Only show org leaderboard for users with orgId (affiliated, client_admin)
      // System admins and non-affiliated users don't have org leaderboards
      if (!profile.orgId) {
        setOrgLeaderboard([]);
        return;
      }

      // Only fetch org leaderboard for affiliated users and client admins
      if (profile.role !== "affiliated" && profile.role !== "client_admin") {
        setOrgLeaderboard([]);
        return;
      }

      const fetchOrgLeaderboard = async () => {
        try {
          const apiClient = new ApiClient(getToken);
          const data = await apiClient.getOrganizationLeaderboard();
          
          const users = (data.leaderboard || [])
            .filter((u: any) => u.role !== "system_admin") // Exclude system_admin
            .map((entry: any) => ({
              position: entry.position,
              name: entry.name,
              email: entry.email,
              learningScore: entry.learningScore || 0,
            }));
          
          setOrgLeaderboard(users);
        } catch (error) {
          console.error("Error fetching organization leaderboard:", error);
          console.error("Error details:", error instanceof Error ? error.message : String(error));
          setOrgLeaderboard([]);
        }
      };
      fetchOrgLeaderboard();
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
      <div className="relative flex min-h-screen min-w-0 items-center justify-center overflow-x-hidden bg-gradient-to-br from-[var(--navy-blue)] via-[var(--navy-blue-light)] to-[var(--navy-blue)]">
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
    <div className="relative min-h-screen min-w-0 overflow-x-hidden bg-gradient-to-br from-[var(--navy-blue)] via-[var(--navy-blue-light)] to-[var(--navy-blue)]">
      <NetworkBackground />
      {/* Hero Section */}
      <div className="relative overflow-hidden px-3 py-8 sm:px-6 sm:py-12 lg:px-8">
        <div className="blurred-background" />
        <div className="relative z-10 mx-auto max-w-7xl min-w-0">
          <div className="space-y-4 text-center">
            <div className="mb-4 flex justify-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[var(--neon-blue)] shadow-lg shadow-[var(--neon-blue)]/30">
                <Medal className="h-8 w-8 text-white" />
              </div>
            </div>
            <h1 className="text-2xl font-bold leading-tight text-[var(--dashboard-text-primary)] dark:text-white sm:text-3xl md:text-4xl lg:text-5xl">
              {t("Leaderboards")}
              <span className="mt-1 block text-[var(--neon-blue)]">
                {t("Top performers by learning score")}
              </span>
            </h1>
            <p className="mx-auto max-w-2xl text-base text-[var(--dashboard-text-secondary)] dark:text-[var(--light-blue)] md:text-lg">
              {t("See how you rank globally or within your organization.")}
            </p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="mx-2 mt-6 min-h-screen rounded-t-3xl bg-[var(--dashboard-card-bg)] backdrop-blur-sm dark:bg-[var(--navy-blue-light)]/95 sm:mx-4 lg:mx-6">
        <div className="mx-auto max-w-4xl min-w-0 px-3 py-8 sm:px-6 sm:py-12 lg:px-8">
          {/* Top 3 Podium */}
          {topThree.length > 0 && (
            <div className="mb-14">
              <h2 className="mb-6 text-center text-lg font-semibold text-[var(--dashboard-text-primary)] dark:text-[var(--light-blue)] sm:mb-8">
                {t("Top 3")}
              </h2>
              <div className="mx-auto grid max-w-2xl grid-cols-3 items-end gap-1 px-0 sm:gap-4 sm:px-2">
                {podiumOrder.filter(Boolean).map((entry) => (
                <div
                  key={`podium-${activeTab}-${entry.position}`}
                  className="flex flex-col items-center"
                >
                  {/* Avatar + medal */}
                  <div className="relative mb-2 sm:mb-3">
                    <div className="flex h-16 w-16 items-center justify-center rounded-full border-2 border-gray-400 bg-gray-200 text-lg font-bold text-[var(--neon-blue)] shadow-lg shadow-[var(--neon-blue)]/20 dark:border-[var(--neon-blue)]/50 dark:bg-[var(--navy-blue)] sm:h-24 sm:w-24 sm:text-2xl">
                      {getInitials(entry.name)}
                    </div>
                    <div
                      className={`absolute -right-0.5 -top-0.5 flex h-7 w-7 items-center justify-center rounded-full border-2 shadow-lg sm:-right-1 sm:-top-1 sm:h-8 sm:w-8 ${getTrophyStyle(
                        entry.position
                      )}`}
                      title={entry.position === 1 ? "1st" : entry.position === 2 ? "2nd" : "3rd"}
                    >
                      <Trophy className="w-4 h-4" />
                    </div>
                  </div>
                  <p className="w-full max-w-[min(30vw,7.5rem)] truncate px-0.5 text-center text-[10px] font-bold text-[var(--dashboard-text-primary)] dark:text-white sm:max-w-[120px] sm:text-sm md:text-base">
                    {entry.name}
                  </p>
                  <p className="mt-0.5 w-full max-w-[min(30vw,7.5rem)] truncate px-0.5 text-center text-[9px] text-[var(--dashboard-text-secondary)] dark:text-[var(--medium-grey)] sm:max-w-[120px] sm:text-xs">
                    {entry.email}
                  </p>
                  <div className="mt-1 flex items-center gap-1 sm:mt-2 sm:gap-1.5">
                    <Award className="h-3.5 w-3.5 shrink-0 text-[var(--neon-blue)] sm:h-4 sm:w-4" />
                    <span className="text-xs font-semibold tabular-nums text-[var(--dashboard-text-primary)] dark:text-white sm:text-sm">
                      {entry.learningScore}
                    </span>
                  </div>
                  {/* Podium block */}
                  <div
                    className={`mt-2 flex w-full items-center justify-center rounded-t-lg border border-gray-300 text-lg font-bold text-[var(--dashboard-text-secondary)] dark:border-[var(--neon-blue)]/30 dark:text-[var(--light-blue)]/60 sm:mt-4 sm:text-2xl md:text-3xl
                      ${entry.position === 1 ? "h-16 bg-gray-200 dark:bg-[var(--navy-blue)]/90 sm:h-24" : ""}
                      ${entry.position === 2 ? "h-12 bg-gray-200 dark:bg-[var(--navy-blue)]/80 sm:h-16" : ""}
                      ${entry.position === 3 ? "h-9 bg-gray-200 dark:bg-[var(--navy-blue)]/70 sm:h-12" : ""}`}
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

          {/* Tabs: Global | Organization (only show org tab if user has access) */}
          <div className="mb-8 flex justify-center sm:mb-10">
            <div className="flex w-full max-w-md gap-1 rounded-xl border border-gray-300 bg-gray-200 p-1 dark:border-[var(--neon-blue)]/20 dark:bg-[var(--navy-blue)] sm:gap-2 sm:p-1.5">
            <button
              type="button"
              onClick={() => setActiveTab("global")}
              className={`flex min-h-[44px] min-w-0 flex-1 items-center justify-center gap-1.5 rounded-lg py-2.5 text-sm font-semibold transition-all duration-200 sm:gap-2 sm:py-3 ${
                activeTab === "global"
                  ? "bg-[var(--neon-blue)] text-white shadow-lg shadow-[var(--neon-blue)]/30"
                  : "text-[var(--dashboard-text-primary)] dark:text-[var(--light-blue)] hover:bg-gray-300 dark:hover:bg-white/5"
              }`}
            >
              <Globe className="h-4 w-4 shrink-0 sm:h-5 sm:w-5" />
              <span className="truncate">{t("Global")}</span>
            </button>
            {/* Only show organization tab for affiliated users and client admins */}
            {(profile?.role === "affiliated" || profile?.role === "client_admin") && profile?.orgId && (
            <button
              type="button"
              onClick={() => setActiveTab("organization")}
              className={`flex min-h-[44px] min-w-0 flex-1 items-center justify-center gap-1.5 rounded-lg py-2.5 text-sm font-semibold transition-all duration-200 sm:gap-2 sm:py-3 ${
                activeTab === "organization"
                  ? "bg-[var(--neon-blue)] text-white shadow-lg shadow-[var(--neon-blue)]/30"
                  : "text-[var(--dashboard-text-primary)] dark:text-[var(--light-blue)] hover:bg-gray-300 dark:hover:bg-white/5"
              }`}
            >
              <Building2 className="h-4 w-4 shrink-0 sm:h-5 sm:w-5" />
              <span className="truncate">{t("Organization")}</span>
            </button>
            )}
            </div>
          </div>

          <div className="min-w-0 overflow-x-auto rounded-xl [-ms-overflow-style:none] [scrollbar-width:thin] sm:overflow-x-visible">
          {/* Table header */}
          <div className="grid min-w-[280px] grid-cols-[3rem_1fr_4.5rem] gap-2 px-2 py-3 text-xs font-medium text-[var(--dashboard-text-secondary)] dark:text-[var(--medium-grey)] sm:min-w-0 sm:grid-cols-[auto_1fr_auto] sm:gap-4 sm:px-4 sm:text-sm rounded-t-xl border border-gray-300 border-b-0 bg-gray-100 dark:border-[var(--neon-blue)]/20 dark:bg-[var(--navy-blue)]/80">
            <span className="w-full text-center sm:w-14">{t("Rank")}</span>
            <span className="min-w-0">{t("Participant")}</span>
            <span className="w-full text-right sm:w-24">{t("Score")}</span>
          </div>

          {/* Leaderboard list */}
          {entries.length > 0 ? (
            <ul className="min-w-[280px] overflow-hidden rounded-b-xl border border-gray-300 border-t-0 bg-white dark:border-[var(--neon-blue)]/20 dark:bg-[var(--navy-blue)]/40 sm:min-w-0">
              {entries.map((entry, index) => (
              <li
                key={`${activeTab}-${entry.position}-${entry.email}`}
                className={`grid grid-cols-[3rem_1fr_4.5rem] items-center gap-2 border-b border-gray-200 px-2 py-3 last:border-b-0 dark:border-[var(--neon-blue)]/10 sm:grid-cols-[auto_1fr_auto] sm:gap-4 sm:px-4 sm:py-4 ${
                  index % 2 === 0 ? "bg-gray-50 dark:bg-[var(--navy-blue)]/30" : "bg-white dark:bg-[var(--navy-blue)]/20"
                } transition-colors hover:bg-gray-100 dark:hover:bg-[var(--neon-blue)]/10`}
              >
                <div className="flex w-full justify-center sm:w-14">
                  <span
                    className={`inline-flex h-9 w-9 items-center justify-center rounded-full border text-xs font-bold sm:h-10 sm:w-10 sm:text-sm ${getPositionStyle(
                      entry.position
                    )}`}
                  >
                    {getOrdinal(entry.position)}
                  </span>
                </div>
                <div className="min-w-0">
                  <p className="truncate font-bold text-[var(--dashboard-text-primary)] dark:text-white">{entry.name}</p>
                  <p className="mt-0.5 truncate text-xs text-[var(--dashboard-text-secondary)] dark:text-[var(--medium-grey)]">
                    {entry.email}
                  </p>
                </div>
                <div className="flex w-full items-center justify-end gap-1 sm:w-24 sm:gap-1.5">
                  <Award className="h-3.5 w-3.5 shrink-0 text-[var(--neon-blue)] sm:h-4 sm:w-4" />
                  <span className="text-sm font-semibold tabular-nums text-[var(--dashboard-text-primary)] dark:text-white">
                    {entry.learningScore}
                  </span>
                </div>
              </li>
              ))}
            </ul>
          ) : (
            <div className="rounded-b-xl border border-gray-300 dark:border-[var(--neon-blue)]/20 border-t-0 bg-white dark:bg-[var(--navy-blue)]/40 p-6 text-center sm:p-8">
              <p className="text-[var(--dashboard-text-secondary)] dark:text-[var(--medium-grey)]">
                {activeTab === "global"
                  ? t("No users found for global leaderboard.")
                  : t("No users found in your organization.")}
              </p>
            </div>
          )}
          </div>

          <p className="mt-6 px-1 text-center text-sm text-[var(--dashboard-text-secondary)] dark:text-[var(--medium-grey)]">
            {activeTab === "global"
              ? t("Global leaderboard shows top performers across all organizations.")
              : t("Organization leaderboard shows top performers within your organization.")}
          </p>
        </div>
      </div>
    </div>
  );
}
