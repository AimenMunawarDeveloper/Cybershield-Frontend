"use client";

import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer } from "recharts";
import {
  Users,
  Shield,
  Target,
  Award,
  BookOpen,
  TrendingUp,
  UserCheck,
} from "lucide-react";
import { useTranslation } from "@/hooks/useTranslation";

interface BarChartCardProps {
  userRole?: "system_admin" | "client_admin" | "affiliated" | "non_affiliated";
}

const getRoleBasedData = (role: string, t: any) => {
  switch (role) {
    case "system_admin":
      return {
        chartData: [
          { name: "Week 1", value: 420 },
          { name: "Week 2", value: 380 },
          { name: "Week 3", value: 510 },
          { name: "Week 4", value: 460 },
          { name: "Week 5", value: 580 },
          { name: "Week 6", value: 520 },
          { name: "Week 7", value: 640 },
          { name: "Week 8", value: 590 },
        ],
        title: t("Platform Activity"),
        subtitle: t("Total user engagement across all organizations"),
        metrics: [
          {
            icon: Users,
            label: t("Total Users"),
            value: "8,430",
            color: "var(--neon-blue)",
          },
          {
            icon: Shield,
            label: t("Active Campaigns"),
            value: "47",
            color: "var(--neon-blue)",
          },
          {
            icon: Target,
            label: t("Phishing Tests"),
            value: "1,247",
            color: "var(--neon-blue)",
          },
          {
            icon: Award,
            label: "Certificates",
            value: "2,340",
            color: "var(--neon-blue)",
          },
        ],
      };
    case "client_admin":
      return {
        chartData: [
          { name: "Week 1", value: 85 },
          { name: "Week 2", value: 92 },
          { name: "Week 3", value: 78 },
          { name: "Week 4", value: 96 },
          { name: "Week 5", value: 88 },
          { name: "Week 6", value: 94 },
          { name: "Week 7", value: 87 },
          { name: "Week 8", value: 91 },
        ],
        title: t("Organization Activity"),
        subtitle: t("Your institution's user engagement"),
        metrics: [
          {
            icon: Users,
            label: t("Org Users"),
            value: "342",
            color: "var(--neon-blue)",
          },
          {
            icon: UserCheck,
            label: t("Active Users"),
            value: "285",
            color: "var(--neon-blue)",
          },
          {
            icon: Shield,
            label: t("Campaigns"),
            value: "5",
            color: "var(--neon-blue)",
          },
          {
            icon: Award,
            label: "Certificates",
            value: "156",
            color: "var(--neon-blue)",
          },
        ],
      };
    case "affiliated":
      return {
        chartData: [
          { name: "Week 1", value: 2 },
          { name: "Week 2", value: 4 },
          { name: "Week 3", value: 3 },
          { name: "Week 4", value: 5 },
          { name: "Week 5", value: 4 },
          { name: "Week 6", value: 6 },
          { name: "Week 7", value: 5 },
          { name: "Week 8", value: 7 },
        ],
        title: t("Your Learning Progress"),
        subtitle: t("Courses completed each week"),
        metrics: [
          {
            icon: BookOpen,
            label: t("Courses"),
            value: "8/15",
            color: "var(--neon-blue)",
          },
          {
            icon: Award,
            label: t("Badges"),
            value: "8",
            color: "var(--neon-blue)",
          },
          {
            icon: Shield,
            label: t("Tests Passed"),
            value: "12/15",
            color: "var(--neon-blue)",
          },
          {
            icon: TrendingUp,
            label: t("Streak"),
            value: "7 days",
            color: "var(--neon-blue)",
          },
        ],
      };
    case "non_affiliated":
      return {
        chartData: [
          { name: "Week 1", value: 1 },
          { name: "Week 2", value: 2 },
          { name: "Week 3", value: 1 },
          { name: "Week 4", value: 3 },
          { name: "Week 5", value: 2 },
          { name: "Week 6", value: 4 },
          { name: "Week 7", value: 3 },
          { name: "Week 8", value: 5 },
        ],
        title: "Your Learning Progress",
        subtitle: "Courses completed each week",
        metrics: [
          {
            icon: BookOpen,
            label: "Courses",
            value: "3/10",
            color: "var(--neon-blue)",
          },
          {
            icon: Award,
            label: "Badges",
            value: "4",
            color: "var(--neon-blue)",
          },
          {
            icon: Shield,
            label: "Tests Passed",
            value: "8/12",
            color: "var(--neon-blue)",
          },
          {
            icon: TrendingUp,
            label: "Streak",
            value: "3 days",
            color: "var(--neon-blue)",
          },
        ],
      };
    default:
      return {
        chartData: [
          { name: "Week 1", value: 1 },
          { name: "Week 2", value: 2 },
          { name: "Week 3", value: 1 },
          { name: "Week 4", value: 3 },
          { name: "Week 5", value: 2 },
          { name: "Week 6", value: 4 },
          { name: "Week 7", value: 3 },
          { name: "Week 8", value: 5 },
        ],
        title: "Your Learning Progress",
        subtitle: "Courses completed each week",
        metrics: [
          {
            icon: BookOpen,
            label: "Courses",
            value: "3/10",
            color: "var(--neon-blue)",
          },
          {
            icon: Award,
            label: "Badges",
            value: "4",
            color: "var(--neon-blue)",
          },
          {
            icon: Shield,
            label: "Tests Passed",
            value: "8/12",
            color: "var(--neon-blue)",
          },
          {
            icon: TrendingUp,
            label: "Streak",
            value: "3 days",
            color: "var(--neon-blue)",
          },
        ],
      };
  }
};

export default function BarChartCard({
  userRole = "non_affiliated",
}: BarChartCardProps) {
  const { t } = useTranslation();
  const { chartData, title, subtitle, metrics } = getRoleBasedData(userRole, t);
  return (
    <div className="dashboard-card rounded-lg p-6 relative overflow-hidden">
      {/* Bar Chart Section */}
      <div className="h-80 mb-6">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={chartData}
            margin={{
              top: 20,
              right: 40,
              left: 20,
              bottom: 5,
            }}
          >
            <XAxis
              dataKey="name"
              axisLine={false}
              tickLine={false}
              tick={{ fill: "var(--dashboard-text-secondary)", fontSize: 12 }}
            />
            <YAxis
              axisLine={false}
              tickLine={false}
              tick={{ fill: "var(--dashboard-text-secondary)", fontSize: 12 }}
              domain={[0, Math.max(...chartData.map((d) => d.value)) + 50]}
            />
            <Bar
              dataKey="value"
              fill="var(--neon-blue)"
              radius={[8, 8, 0, 0]}
              maxBarSize={30}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Title Section */}
      <div className="mb-8">
        <h3 className="text-lg font-bold text-[var(--dashboard-text-primary)] mb-1">{title}</h3>
        <p className="text-sm">
          <span className="text-[var(--success-green)]">(+15%)</span>
          <span className="text-[var(--dashboard-text-secondary)]"> {subtitle}</span>
        </p>
      </div>

      {/* Metrics Cards Section */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
        {metrics.map((metric, index) => {
          const IconComponent = metric.icon;
          return (
            <div key={index} className="flex flex-col items-center">
              <div className="w-8 h-8 mb-2 flex items-center justify-center">
                <IconComponent className="w-6 h-6 text-[var(--dashboard-text-primary)]" />
              </div>
              <p className="text-sm text-[var(--dashboard-text-primary)] mb-1">{metric.label}</p>
              <p className="text-2xl font-bold text-[var(--dashboard-text-primary)] mb-2">
                {metric.value}
              </p>
              <div
                className="w-8 h-1 rounded-full"
                style={{ backgroundColor: metric.color }}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}
