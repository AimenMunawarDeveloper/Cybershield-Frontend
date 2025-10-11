"use client";

import {
  Check,
  MoreVertical,
  Shield,
  Users,
  Target,
  Award,
} from "lucide-react";

interface DataTableProps {
  userRole?: "system_admin" | "client_admin" | "affiliated" | "non_affiliated";
}

const getRoleBasedData = (role: string) => {
  switch (role) {
    case "system_admin":
      return {
        title: "Organizations",
        subtitle: "24 organizations managed",
        data: [
          {
            id: 1,
            item: {
              icon: "NUST",
              name: "National University of Sciences & Technology",
              iconColor: "bg-blue-500",
            },
            members: [
              { name: "A", color: "bg-blue-500" },
              { name: "B", color: "bg-green-500" },
              { name: "C", color: "bg-yellow-500" },
              { name: "D", color: "bg-red-500" },
            ],
            metric: "2,847 users",
            completion: 85,
          },
          {
            id: 2,
            item: {
              icon: "UET",
              name: "University of Engineering & Technology",
              iconColor: "bg-purple-500",
            },
            members: [
              { name: "E", color: "bg-indigo-500" },
              { name: "F", color: "bg-pink-500" },
              { name: "G", color: "bg-teal-500" },
            ],
            metric: "1,923 users",
            completion: 72,
          },
        ],
      };
    case "client_admin":
      return {
        title: "User Groups",
        subtitle: "5 groups in your organization",
        data: [
          {
            id: 1,
            item: {
              icon: "CS",
              name: "Computer Science Department",
              iconColor: "bg-blue-500",
            },
            members: [
              { name: "A", color: "bg-blue-500" },
              { name: "B", color: "bg-green-500" },
              { name: "C", color: "bg-yellow-500" },
              { name: "D", color: "bg-red-500" },
            ],
            metric: "142 students",
            completion: 78,
          },
          {
            id: 2,
            item: {
              icon: "EE",
              name: "Electrical Engineering",
              iconColor: "bg-purple-500",
            },
            members: [
              { name: "E", color: "bg-indigo-500" },
              { name: "F", color: "bg-pink-500" },
            ],
            metric: "98 students",
            completion: 65,
          },
        ],
      };
    case "affiliated":
      return {
        title: "Your Courses",
        subtitle: "8 courses completed",
        data: [
          {
            id: 1,
            item: {
              icon: "🛡️",
              name: "Email Phishing Awareness",
              iconColor: "bg-green-500",
            },
            members: [
              { name: "✓", color: "bg-green-500" },
              { name: "✓", color: "bg-green-500" },
              { name: "✓", color: "bg-green-500" },
            ],
            metric: "100% score",
            completion: 100,
          },
          {
            id: 2,
            item: {
              icon: "📱",
              name: "WhatsApp Security",
              iconColor: "bg-blue-500",
            },
            members: [
              { name: "✓", color: "bg-green-500" },
              { name: "✓", color: "bg-green-500" },
            ],
            metric: "95% score",
            completion: 95,
          },
        ],
      };
    case "non_affiliated":
      return {
        title: "Available Courses",
        subtitle: "3 courses completed",
        data: [
          {
            id: 1,
            item: {
              icon: "🛡️",
              name: "Basic Cybersecurity Fundamentals",
              iconColor: "bg-green-500",
            },
            members: [
              { name: "✓", color: "bg-green-500" },
              { name: "✓", color: "bg-green-500" },
            ],
            metric: "92% score",
            completion: 92,
          },
          {
            id: 2,
            item: {
              icon: "📧",
              name: "Email Security Basics",
              iconColor: "bg-blue-500",
            },
            members: [{ name: "✓", color: "bg-green-500" }],
            metric: "85% score",
            completion: 85,
          },
        ],
      };
    default:
      return {
        title: "Available Courses",
        subtitle: "3 courses completed",
        data: [
          {
            id: 1,
            item: {
              icon: "🛡️",
              name: "Basic Cybersecurity Fundamentals",
              iconColor: "bg-green-500",
            },
            members: [
              { name: "✓", color: "bg-green-500" },
              { name: "✓", color: "bg-green-500" },
            ],
            metric: "92% score",
            completion: 92,
          },
          {
            id: 2,
            item: {
              icon: "📧",
              name: "Email Security Basics",
              iconColor: "bg-blue-500",
            },
            members: [{ name: "✓", color: "bg-green-500" }],
            metric: "85% score",
            completion: 85,
          },
        ],
      };
  }
};

export default function DataTable({
  userRole = "non_affiliated",
}: DataTableProps) {
  const { title, subtitle, data } = getRoleBasedData(userRole);
  return (
    <div className="dashboard-card rounded-lg p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-white mb-1">{title}</h3>
          <div className="flex items-center text-sm">
            <Check className="w-4 h-4 text-[var(--success-green)] mr-1" />
            <span className="text-[var(--medium-grey)]">{subtitle}</span>
          </div>
        </div>
        <button className="w-8 h-8 bg-[var(--navy-blue-lighter)] rounded-lg flex items-center justify-center hover:bg-[var(--navy-blue)] transition-colors">
          <MoreVertical className="w-4 h-4 text-white" />
        </button>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          {/* Table Header */}
          <thead>
            <tr className="border-b border-[var(--navy-blue-lighter)]">
              <th className="text-left py-3 px-0 text-sm font-medium text-[var(--medium-grey)]">
                {userRole === "system_admin"
                  ? "ORGANIZATIONS"
                  : userRole === "client_admin"
                  ? "GROUPS"
                  : "COURSES"}
              </th>
              <th className="text-left py-3 px-4 text-sm font-medium text-[var(--medium-grey)]">
                {userRole === "system_admin" || userRole === "client_admin"
                  ? "ADMINS"
                  : "MODULES"}
              </th>
              <th className="text-left py-3 px-4 text-sm font-medium text-[var(--medium-grey)]">
                {userRole === "system_admin"
                  ? "USERS"
                  : userRole === "client_admin"
                  ? "STUDENTS"
                  : "SCORE"}
              </th>
              <th className="text-left py-3 px-4 text-sm font-medium text-[var(--medium-grey)]">
                {userRole === "system_admin" || userRole === "client_admin"
                  ? "ACTIVITY"
                  : "PROGRESS"}
              </th>
            </tr>
          </thead>

          {/* Table Body */}
          <tbody>
            {data.map((item) => (
              <tr
                key={item.id}
                className="border-b border-[var(--navy-blue-lighter)] last:border-b-0"
              >
                {/* Item */}
                <td className="py-4 px-0">
                  <div className="flex items-center">
                    <div
                      className={`w-8 h-8 ${item.item.iconColor} rounded-lg flex items-center justify-center mr-3`}
                    >
                      <span className="text-white text-xs font-bold">
                        {item.item.icon}
                      </span>
                    </div>
                    <span className="text-white text-sm">{item.item.name}</span>
                  </div>
                </td>

                {/* Members/Modules */}
                <td className="py-4 px-4">
                  <div className="flex -space-x-2">
                    {item.members.map((member, index) => (
                      <div
                        key={index}
                        className={`w-8 h-8 ${member.color} rounded-full flex items-center justify-center border-2 border-[var(--navy-blue-light)]`}
                      >
                        <span className="text-white text-xs font-medium">
                          {member.name}
                        </span>
                      </div>
                    ))}
                  </div>
                </td>

                {/* Metric */}
                <td className="py-4 px-4">
                  <span className="text-white text-sm">{item.metric}</span>
                </td>

                {/* Completion/Progress */}
                <td className="py-4 px-4">
                  <div className="flex items-center">
                    <span className="text-white text-sm mr-2">
                      {item.completion}%
                    </span>
                    <div className="w-16 h-2 bg-[var(--navy-blue-lighter)] rounded-full overflow-hidden">
                      <div
                        className="h-full bg-[var(--neon-blue)] rounded-full transition-all duration-300"
                        style={{ width: `${item.completion}%` }}
                      />
                    </div>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
