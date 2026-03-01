"use client";

import {
  Check,
  MoreVertical,
  Shield,
  Users,
  Target,
  Award,
} from "lucide-react";
import { useTranslation } from "@/hooks/useTranslation";

interface DataTableProps {
  userRole?: "system_admin" | "client_admin" | "affiliated" | "non_affiliated";
  coursesData?: Array<{
    _id: string;
    courseTitle: string;
    totalModules: number;
    modulesCompleted: number;
    progressPercent: number;
    isCompleted: boolean;
  }>;
  loading?: boolean;
}

const getRoleBasedData = (role: string, t: any) => {
  switch (role) {
    case "system_admin":
      return {
        title: t("Organizations"),
        subtitle: t("24 organizations managed"),
        data: [
          {
            id: 1,
            item: {
              icon: "NUST",
              name: t("National University of Sciences & Technology"),
              iconColor: "bg-blue-500",
            },
            members: [
              { name: "A", color: "bg-blue-500" },
              { name: "B", color: "bg-green-500" },
              { name: "C", color: "bg-yellow-500" },
              { name: "D", color: "bg-red-500" },
            ],
            metric: t("2,847 users"),
            completion: 85,
          },
          {
            id: 2,
            item: {
              icon: "UET",
              name: t("University of Engineering & Technology"),
              iconColor: "bg-purple-500",
            },
            members: [
              { name: "E", color: "bg-indigo-500" },
              { name: "F", color: "bg-pink-500" },
              { name: "G", color: "bg-teal-500" },
            ],
            metric: t("1,923 users"),
            completion: 72,
          },
        ],
      };
    case "client_admin":
      return {
        title: t("User Groups"),
        subtitle: t("5 groups in your organization"),
        data: [
          {
            id: 1,
            item: {
              icon: "CS",
              name: t("Computer Science Department"),
              iconColor: "bg-blue-500",
            },
            members: [
              { name: "A", color: "bg-blue-500" },
              { name: "B", color: "bg-green-500" },
              { name: "C", color: "bg-yellow-500" },
              { name: "D", color: "bg-red-500" },
            ],
            metric: t("142 students"),
            completion: 78,
          },
          {
            id: 2,
            item: {
              icon: "EE",
              name: t("Electrical Engineering"),
              iconColor: "bg-purple-500",
            },
            members: [
              { name: "E", color: "bg-indigo-500" },
              { name: "F", color: "bg-pink-500" },
            ],
            metric: t("98 students"),
            completion: 65,
          },
        ],
      };
    case "affiliated":
      return {
        title: t("Your Courses"),
        subtitle: t("8 courses completed"),
        data: [
          {
            id: 1,
            item: {
              icon: "🛡️",
              name: t("Email Phishing Awareness"),
              iconColor: "bg-green-500",
            },
            members: [
              { name: "✓", color: "bg-green-500" },
              { name: "✓", color: "bg-green-500" },
              { name: "✓", color: "bg-green-500" },
            ],
            metric: t("100% score"),
            completion: 100,
          },
          {
            id: 2,
            item: {
              icon: "📱",
              name: t("WhatsApp Security"),
              iconColor: "bg-blue-500",
            },
            members: [
              { name: "✓", color: "bg-green-500" },
              { name: "✓", color: "bg-green-500" },
            ],
            metric: t("95% score"),
            completion: 95,
          },
        ],
      };
    case "non_affiliated":
      return {
        title: t("Available Courses"),
        subtitle: t("3 courses completed"),
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
        title: t("Available Courses"),
        subtitle: t("3 courses completed"),
        data: [
          {
            id: 1,
            item: {
              icon: "🛡️",
              name: t("Basic Cybersecurity Fundamentals"),
              iconColor: "bg-green-500",
            },
            members: [
              { name: "✓", color: "bg-green-500" },
              { name: "✓", color: "bg-green-500" },
            ],
            metric: t("92% score"),
            completion: 92,
          },
          {
            id: 2,
            item: {
              icon: "📧",
              name: t("Email Security Basics"),
              iconColor: "bg-blue-500",
            },
            members: [{ name: "✓", color: "bg-green-500" }],
            metric: t("85% score"),
            completion: 85,
          },
        ],
      };
  }
};

export default function DataTable({
  userRole = "non_affiliated",
  coursesData,
  loading = false,
}: DataTableProps) {
  const { t } = useTranslation();
  
  // Use real data for affiliated users if provided, otherwise use static data
  let title, subtitle, data;
  
  if (userRole === "affiliated" && coursesData) {
    title = t("Your Courses");
    subtitle = `${coursesData.filter(c => c.isCompleted).length} ${t("courses completed")}`;
    
    // Transform course data to match table format
    data = coursesData.map((course, index) => {
      // Create checkmarks for completed modules
      const moduleIndicators = Array.from({ length: course.totalModules }, (_, i) => ({
        name: i < course.modulesCompleted ? "✓" : "",
        color: i < course.modulesCompleted ? "bg-green-500" : "bg-gray-400",
      }));
      
      // Use emoji based on course title or default
      const getIcon = (courseTitle: string) => {
        const title = courseTitle.toLowerCase();
        if (title.includes("email")) return "📧";
        if (title.includes("whatsapp")) return "📱";
        if (title.includes("voice") || title.includes("phishing")) return "🎤";
        if (title.includes("security") || title.includes("cyber")) return "🛡️";
        return "📚";
      };
      
      return {
        id: course._id,
        item: {
          icon: getIcon(course.courseTitle),
          name: course.courseTitle,
          iconColor: course.isCompleted ? "bg-green-500" : "bg-blue-500",
        },
        members: moduleIndicators,
        metric: `${course.progressPercent}% ${t("score")}`,
        completion: course.progressPercent,
      };
    });
  } else {
    // Use static data for other roles
    const staticData = getRoleBasedData(userRole, t);
    title = staticData.title;
    subtitle = staticData.subtitle;
    data = staticData.data;
  }
  return (
    <div className="dashboard-card rounded-lg p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-[var(--dashboard-text-primary)] mb-1">{title}</h3>
          <div className="flex items-center text-sm">
            <Check className="w-4 h-4 text-[var(--success-green)] mr-1" />
            <span className="text-[var(--dashboard-text-secondary)]">{subtitle}</span>
          </div>
        </div>
        <button className="w-8 h-8 bg-[var(--navy-blue-lighter)] rounded-lg flex items-center justify-center hover:bg-[var(--navy-blue)] transition-colors">
          <MoreVertical className="w-4 h-4 text-[var(--dashboard-text-primary)]" />
        </button>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          {/* Table Header */}
          <thead>
            <tr className="border-b border-[var(--navy-blue-lighter)]">
              <th className="text-left py-3 px-0 text-sm font-medium text-[var(--dashboard-text-secondary)]">
                {userRole === "system_admin"
                  ? "ORGANIZATIONS"
                  : userRole === "client_admin"
                  ? "GROUPS"
                  : "COURSES"}
              </th>
              <th className="text-left py-3 px-4 text-sm font-medium text-[var(--dashboard-text-secondary)]">
                {userRole === "system_admin" || userRole === "client_admin"
                  ? "ADMINS"
                  : "MODULES"}
              </th>
              <th className="text-left py-3 px-4 text-sm font-medium text-[var(--dashboard-text-secondary)]">
                {userRole === "system_admin"
                  ? "USERS"
                  : userRole === "client_admin"
                  ? "STUDENTS"
                  : "SCORE"}
              </th>
              <th className="text-left py-3 px-4 text-sm font-medium text-[var(--dashboard-text-secondary)]">
                {userRole === "system_admin" || userRole === "client_admin"
                  ? "ACTIVITY"
                  : "PROGRESS"}
              </th>
            </tr>
          </thead>

          {/* Table Body */}
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={4} className="py-8 text-center">
                  <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-[var(--neon-blue)]"></div>
                    <span className="ml-2 text-[var(--dashboard-text-secondary)]">{t("Loading...")}</span>
                  </div>
                </td>
              </tr>
            ) : data.length === 0 ? (
              <tr>
                <td colSpan={4} className="py-8 text-center text-[var(--dashboard-text-secondary)]">
                  {t("No courses available")}
                </td>
              </tr>
            ) : (
              data.map((item) => (
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
                    <span className="text-[var(--dashboard-text-primary)] text-sm">{item.item.name}</span>
                  </div>
                </td>

                {/* Members/Modules */}
                <td className="py-4 px-4">
                  <div className="flex -space-x-2">
                    {item.members.map((member, index) => (
                      <div
                        key={index}
                        className={`w-8 h-8 ${member.color} rounded-full flex items-center justify-center border-2 border-[var(--navy-blue-light)]`}
                        title={member.name ? t("Module completed") : t("Module not completed")}
                      >
                        <span className={`text-xs font-medium ${member.name ? "text-white" : "text-[var(--dashboard-text-secondary)]"}`}>
                          {member.name || ""}
                        </span>
                      </div>
                    ))}
                  </div>
                </td>

                {/* Metric */}
                <td className="py-4 px-4">
                  <span className="text-[var(--dashboard-text-primary)] text-sm">{item.metric}</span>
                </td>

                {/* Completion/Progress */}
                <td className="py-4 px-4">
                  <div className="flex items-center">
                    <span className="text-[var(--dashboard-text-primary)] text-sm mr-2">
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
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
