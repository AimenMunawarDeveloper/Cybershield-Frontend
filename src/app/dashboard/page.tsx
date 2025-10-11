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

interface UserProfile {
  _id: string;
  email: string;
  displayName: string;
  role: "system_admin" | "client_admin" | "affiliated" | "non_affiliated";
  orgId?: string;
  orgName?: string;
  points?: number;
  riskScore?: number;
}

export default function DashboardPage() {
  const { user, isLoaded } = useUser();
  const { getToken } = useAuth();
  const router = useRouter();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchUserProfile = useCallback(async () => {
    try {
      const apiClient = new ApiClient(getToken);
      const profileData = await apiClient.getUserProfile();
      console.log("Profile data received:", profileData);
      setProfile(profileData);
    } catch (err) {
      console.error("Failed to fetch user profile:", err);
    } finally {
      setLoading(false);
    }
  }, [getToken]);

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
            label: "Total Organizations",
            value: "24",
            change: "+12%",
            icon: "building",
          },
          metric2: {
            label: "Total Users",
            value: "8,430",
            change: "+18%",
            icon: "users",
          },
          metric3: {
            label: "Active Campaigns",
            value: "47",
            change: "+5%",
            icon: "shield",
          },
          metric4: {
            label: "Avg Risk Score",
            value: "6.8/10",
            change: "-0.5",
            icon: "chart",
          },
        };
      case "client_admin":
        return {
          metric1: {
            label: "Organization Users",
            value: "342",
            change: "+8%",
            icon: "users",
          },
          metric2: {
            label: "Active Users",
            value: "285",
            change: "+3%",
            icon: "user-check",
          },
          metric3: {
            label: "Active Campaigns",
            value: "5",
            change: "+2",
            icon: "shield",
          },
          metric4: {
            label: "Avg Risk Score",
            value: "7.2/10",
            change: "-0.3",
            icon: "chart",
          },
        };
      case "affiliated":
        return {
          metric1: {
            label: "Courses Completed",
            value: "8/15",
            change: "+2",
            icon: "book",
          },
          metric2: {
            label: "Your Points",
            value: profile.points?.toString() || "450",
            change: "+35",
            icon: "star",
          },
          metric3: {
            label: "Risk Score",
            value: `${profile.riskScore || "3.5"}/10`,
            change: "-0.8",
            icon: "shield-check",
          },
          metric4: {
            label: "Certificates",
            value: "5",
            change: "+1",
            icon: "award",
          },
        };
      case "non_affiliated":
        return {
          metric1: {
            label: "Courses Completed",
            value: "3/10",
            change: "+1",
            icon: "book",
          },
          metric2: {
            label: "Your Points",
            value: profile.points?.toString() || "180",
            change: "+20",
            icon: "star",
          },
          metric3: {
            label: "Risk Score",
            value: `${profile.riskScore || "5.2"}/10`,
            change: "-0.5",
            icon: "shield-check",
          },
          metric4: {
            label: "Certificates",
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
    if (!profile) return { greeting: "Welcome back", name: "User" };

    const firstName = profile.displayName?.split(" ")[0] || "User";

    switch (profile.role) {
      case "system_admin":
        return {
          greeting: "Welcome back, Admin",
          name: firstName,
          subtitle: "Monitor platform-wide security awareness",
          action: "Review system analytics",
        };
      case "client_admin":
        return {
          greeting: `Welcome back, ${profile.orgName || "Organization"} Admin`,
          name: firstName,
          subtitle: "Manage your institution's cybersecurity training",
          action: "Review organization reports",
        };
      case "affiliated":
        return {
          greeting: "Welcome back",
          name: firstName,
          subtitle: "Continue your cybersecurity awareness journey",
          action: "Resume your training",
        };
      case "non_affiliated":
        return {
          greeting: "Welcome back",
          name: firstName,
          subtitle: "Continue building your cyber resilience",
          action: "Explore available courses",
        };
    }
  };

  if (!isLoaded || loading) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <div className="text-white">Loading...</div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  const metrics = getRoleBasedMetrics();
  const welcomeMsg = getWelcomeMessage();

  console.log("Metrics:", metrics);
  console.log("Welcome message:", welcomeMsg);

  return (
    <>
      <div className="flex flex-1 flex-col gap-6 p-6 pt-4 relative">
        {/* Blurred background element */}
        <div className="blurred-background"></div>

        {/* Top Row Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 relative z-10">
          {/* Metric 1 Card */}
          <div className="dashboard-card rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div className="text-left">
                <p className="text-xs text-[var(--medium-grey)]">
                  {metrics?.metric1.label}
                </p>
                <p className="text-lg font-bold text-white">
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
                <p className="text-xs text-[var(--medium-grey)]">
                  {metrics?.metric2.label}
                </p>
                <p className="text-lg font-bold text-white">
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
                <p className="text-xs text-[var(--medium-grey)]">
                  {metrics?.metric3.label}
                </p>
                <p className="text-lg font-bold text-white">
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
                <p className="text-xs text-[var(--medium-grey)]">
                  {metrics?.metric4.label}
                </p>
                <p className="text-lg font-bold text-white">
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
                <p className="text-sm text-[var(--medium-grey)] mb-1">
                  {welcomeMsg?.greeting}
                </p>
                <h2 className="text-2xl font-bold text-white mb-2">
                  {welcomeMsg?.name}
                </h2>
                <p className="text-sm text-[var(--medium-grey)] mb-1">
                  Glad to see you again!
                </p>
                <p className="text-sm text-[var(--medium-grey)] mb-6">
                  {welcomeMsg?.subtitle}
                </p>
                <div className="flex items-center text-[var(--neon-blue)] cursor-pointer hover:text-white transition-colors">
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
                <h3 className="text-lg font-semibold text-white">
                  {profile?.role === "system_admin" ||
                  profile?.role === "client_admin"
                    ? "Training Completion"
                    : "Your Progress"}
                </h3>
                <p className="text-xs text-[var(--medium-grey)]">
                  {profile?.role === "system_admin" ||
                  profile?.role === "client_admin"
                    ? "Average across users"
                    : "Overall completion rate"}
                </p>
              </div>
              <div className="flex flex-col items-center mb-6">
                {/* Progress Radial Chart */}
                <ProgressRadialChart
                  value={
                    profile?.role === "affiliated"
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
              <div className="bg-[var(--navy-blue)] rounded-lg p-4">
                <div className="text-center">
                  <p className="text-3xl font-bold text-white">
                    {profile?.role === "affiliated"
                      ? "73%"
                      : profile?.role === "non_affiliated"
                      ? "45%"
                      : "85%"}
                  </p>
                  <p className="text-xs text-[var(--medium-grey)]">
                    Courses completed
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Security Awareness Component */}
          <div className="lg:col-span-1">
            <div className="dashboard-card rounded-lg p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-white">
                  Security Awareness
                </h3>
                <button className="w-8 h-8 bg-[var(--navy-blue-lighter)] rounded-lg flex items-center justify-center">
                  <svg
                    className="w-4 h-4 text-white"
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
                  {/* Phishing Tests Card */}
                  <div className="bg-[var(--navy-blue-lighter)] rounded-lg p-4">
                    <p className="text-xs text-[var(--medium-grey)] mb-1">
                      {profile?.role === "system_admin" ||
                      profile?.role === "client_admin"
                        ? "Total Tests"
                        : "Tests Passed"}
                    </p>
                    <p className="text-lg font-bold text-white">
                      {profile?.role === "system_admin"
                        ? "1,247"
                        : profile?.role === "client_admin"
                        ? "89"
                        : "12/15"}
                    </p>
                  </div>

                  {/* Badges Card */}
                  <div className="bg-[var(--navy-blue-lighter)] rounded-lg p-4">
                    <p className="text-xs text-[var(--medium-grey)] mb-1">
                      {profile?.role === "system_admin" ||
                      profile?.role === "client_admin"
                        ? "Avg Badges"
                        : "Your Badges"}
                    </p>
                    <p className="text-lg font-bold text-white">
                      {profile?.role === "affiliated"
                        ? "8"
                        : profile?.role === "non_affiliated"
                        ? "4"
                        : "6.4"}
                    </p>
                  </div>
                </div>

                {/* Right Side - Awareness Score */}
                <div className="flex items-center justify-center">
                  <ProgressRadialChart
                    value={
                      profile?.role === "affiliated"
                        ? 82
                        : profile?.role === "non_affiliated"
                        ? 65
                        : 78
                    }
                    size={128}
                    showIcon={false}
                    showScore={true}
                    scoreValue={
                      profile?.role === "affiliated"
                        ? 8.2
                        : profile?.role === "non_affiliated"
                        ? 6.5
                        : 7.8
                    }
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Area Chart Section */}
        <div className="mt-8 relative z-10">
          <div className="dashboard-card rounded-lg p-6">
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-white">
                {profile?.role === "system_admin" ||
                profile?.role === "client_admin"
                  ? "User Activity Overview"
                  : "Your Learning Progress"}
              </h3>
              <p className="text-xs text-[var(--success-green)]">
                {profile?.role === "system_admin" ||
                profile?.role === "client_admin"
                  ? "(+15%) increase this month"
                  : "(+3) courses this month"}
              </p>
            </div>
            <AreaChart userRole={profile?.role} />
          </div>
        </div>
        {/* Bar Chart Card Section */}
        <div className="mt-8 relative z-10">
          <BarChartCard userRole={profile?.role} />
        </div>

        {/* Data Table and Activity Feed Section */}
        <div className="mt-8 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <DataTable userRole={profile?.role} />
            <ActivityFeed userRole={profile?.role} />
          </div>
        </div>
      </div>
      {/* Floating Chat */}
      <FloatingChat />
    </>
  );
}
