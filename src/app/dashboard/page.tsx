import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import TopBar from "@/components/TopBar";

export default async function DashboardPage() {
  const user = await currentUser();

  if (!user) {
    redirect("/sign-in");
  }
  return (
    <div className="min-h-screen bg-grey">
      <TopBar
        userName={user.firstName || undefined}
        title="Welcome to CyberShield"
        subtitle="Your cybersecurity awareness journey starts here."
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Learning Modules Card */}
          <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
            <div className="flex items-center mb-4">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <svg
                  className="w-6 h-6 text-blue-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
                  />
                </svg>
              </div>
              <h3 className="ml-3 text-lg font-semibold text-gray-900">
                Learning Modules
              </h3>
            </div>
            <p className="text-gray-600 mb-4">
              Access cybersecurity courses, quizzes, and earn certificates.
            </p>
            <button className="w-full bg-neon-blue hover:bg-medium-blue text-white py-2 px-4 rounded-md transition-colors">
              Start Learning
            </button>
          </div>

          {/* Phishing Simulations Card */}
          <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
            <div className="flex items-center mb-4">
              <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                <svg
                  className="w-6 h-6 text-red-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z"
                  />
                </svg>
              </div>
              <h3 className="ml-3 text-lg font-semibold text-gray-900">
                Phishing Simulations
              </h3>
            </div>
            <p className="text-gray-600 mb-4">
              Practice identifying phishing attempts through realistic
              simulations.
            </p>
            <button className="w-full bg-crimson-red hover:bg-sunset-orange text-white py-2 px-4 rounded-md transition-colors">
              Take Simulation
            </button>
          </div>

          {/* Risk Analysis Card */}
          <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
            <div className="flex items-center mb-4">
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                <svg
                  className="w-6 h-6 text-green-600"
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
              <h3 className="ml-3 text-lg font-semibold text-gray-900">
                Risk Analysis
              </h3>
            </div>
            <p className="text-gray-600 mb-4">
              View your cybersecurity risk score and improvement
              recommendations.
            </p>
            <button className="w-full bg-success-green hover:bg-soft-purple text-white py-2 px-4 rounded-md transition-colors">
              View Analysis
            </button>
          </div>
        </div>

        {/* Recent Activity Section */}
        <div className="mt-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Recent Activity
          </h2>
          <div className="bg-white rounded-lg shadow-md border border-gray-200">
            <div className="p-6">
              <p className="text-gray-600 text-center py-8">
                No recent activity. Start your cybersecurity training to see
                your progress here!
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
