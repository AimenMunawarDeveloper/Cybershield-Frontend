import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import Arc from "@/components/Arc";
import AreaChart from "@/components/AreaChart";
import BarChartCard from "@/components/BarChartCard";
import DataTable from "@/components/DataTable";
import ActivityFeed from "@/components/ActivityFeed";
import FloatingChat from "@/components/FloatingChat";

export default async function DashboardPage() {
  const user = await currentUser();

  if (!user) {
    redirect("/sign-in");
  }
  return (
    <>
      <div className="flex flex-1 flex-col gap-6 p-6 pt-4 relative">
        {/* Blurred background element */}
        <div className="blurred-background"></div>

        {/* Top Row Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 relative z-10">
          {/* Today's Money Card */}
          <div className="dashboard-card rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div className="text-left">
                <p className="text-xs text-[var(--medium-grey)]">Today Money</p>
                <p className="text-lg font-bold text-white">$53,000</p>
                <p className="text-xs text-[var(--success-green)]">+55%</p>
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
                    d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1"
                  />
                </svg>
              </div>
            </div>
          </div>

          {/* Today's Users Card */}
          <div className="dashboard-card rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div className="text-left">
                <p className="text-xs text-[var(--medium-grey)]">Today Users</p>
                <p className="text-lg font-bold text-white">2,300</p>
                <p className="text-xs text-[var(--success-green)]">+5%</p>
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
                    d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9v-9m0-9v9"
                  />
                </svg>
              </div>
            </div>
          </div>

          {/* New Clients Card */}
          <div className="dashboard-card rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div className="text-left">
                <p className="text-xs text-[var(--medium-grey)]">New Clients</p>
                <p className="text-lg font-bold text-white">+3,052</p>
                <p className="text-xs text-[var(--crimson-red)]">-14%</p>
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
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
              </div>
            </div>
          </div>

          {/* Total Sales Card */}
          <div className="dashboard-card rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div className="text-left">
                <p className="text-xs text-[var(--medium-grey)]">Total Sales</p>
                <p className="text-lg font-bold text-white">$173,000</p>
                <p className="text-xs text-[var(--success-green)]">+8%</p>
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
                    d="M3 3h2l.4 2M7 13h10l4-8H5.4m0 0L7 13m0 0l-2.5 5M7 13l2.5 5m6-5v6a2 2 0 01-2 2H9a2 2 0 01-2-2v-6m8 0V9a2 2 0 00-2-2H9a2 2 0 00-2 2v4.01"
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
                  Welcome back,
                </p>
                <h2 className="text-2xl font-bold text-white mb-2">
                  Mark Johnson
                </h2>
                <p className="text-sm text-[var(--medium-grey)] mb-1">
                  Glad to see you again!
                </p>
                <p className="text-sm text-[var(--medium-grey)] mb-6">
                  Ask me anything.
                </p>
                <div className="flex items-center text-[var(--medium-grey)] cursor-pointer">
                  <span className="text-sm">Tap to record</span>
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

          {/* Satisfaction Rate Component */}
          <div className="lg:col-span-1">
            <div className="dashboard-card rounded-lg p-6">
              <div className="mb-4">
                <h3 className="text-lg font-semibold text-white">
                  Satisfaction Rate
                </h3>
                <p className="text-xs text-[var(--medium-grey)]">
                  From all projects
                </p>
              </div>
              <div className="flex flex-col items-center mb-6">
                {/* Semi-circular arc with emoji at geometric center */}
                <div className="relative w-48 h-32">
                  <Arc value={95} />

                  {/* Emoji at geometric center of the arc */}
                  <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                    <div className="w-12 h-12 bg-[var(--neon-blue)] rounded-full flex items-center justify-center border-2 border-white">
                      <svg
                        className="w-6 h-6 text-white"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                      </svg>
                    </div>
                  </div>
                </div>
              </div>
              {/* Darker background box for percentage */}
              <div className="bg-[var(--navy-blue)] rounded-lg p-4">
                <div className="text-center">
                  <p className="text-3xl font-bold text-white">95%</p>
                  <p className="text-xs text-[var(--medium-grey)]">
                    Based on likes
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Referral Tracking Component */}
          <div className="lg:col-span-1">
            <div className="dashboard-card rounded-lg p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-white">
                  Referral Tracking
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
                      d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z"
                    />
                  </svg>
                </button>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {/* Left Side - Stats Cards */}
                <div className="space-y-3">
                  {/* Invited Card */}
                  <div className="bg-[var(--navy-blue-lighter)] rounded-lg p-4">
                    <p className="text-xs text-[var(--medium-grey)] mb-1">
                      Invited
                    </p>
                    <p className="text-lg font-bold text-white">145 people</p>
                  </div>

                  {/* Bonus Card */}
                  <div className="bg-[var(--navy-blue-lighter)] rounded-lg p-4">
                    <p className="text-xs text-[var(--medium-grey)] mb-1">
                      Bonus
                    </p>
                    <p className="text-lg font-bold text-white">1,465</p>
                  </div>
                </div>

                {/* Right Side - Safety Score */}
                <div className="flex items-center justify-center">
                  <div className="relative w-32 h-32">
                    <Arc value={93} />

                    {/* Center content */}
                    <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-center">
                      <p className="text-xs text-[var(--medium-grey)] mb-1">
                        Safety
                      </p>
                      <p className="text-lg font-bold text-white">9.3</p>
                      <p className="text-xs text-[var(--medium-grey)]">
                        Total Score
                      </p>
                    </div>
                  </div>
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
                Sales overview
              </h3>
              <p className="text-xs text-[var(--success-green)]">
                (+5) more in 2021
              </p>
            </div>
            <AreaChart />
          </div>
        </div>
        {/* Bar Chart Card Section */}
        <div className="mt-8 relative z-10">
          <BarChartCard />
        </div>

        {/* Data Table and Activity Feed Section */}
        <div className="mt-8 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <DataTable />
            <ActivityFeed />
          </div>
        </div>
      </div>

      {/* Floating Chat */}
      <FloatingChat />
    </>
  );
}
