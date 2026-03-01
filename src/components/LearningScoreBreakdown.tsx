"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@clerk/nextjs";
import { ApiClient } from "@/lib/api";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  Legend,
} from "recharts";
import { useTranslation } from "@/hooks/useTranslation";

interface LearningScoreBreakdownProps {
  orgId?: string;
  userRole?: "system_admin" | "client_admin";
}

interface User {
  role?: string;
  learningScores?: {
    email: number;
    whatsapp: number;
    lms: number;
    voice: number;
  };
}

export default function LearningScoreBreakdown({
  orgId,
  userRole,
}: LearningScoreBreakdownProps) {
  const { getToken } = useAuth();
  const { t } = useTranslation();
  const [loading, setLoading] = useState(true);
  const [averages, setAverages] = useState({
    email: 0,
    whatsapp: 0,
    lms: 0,
    voice: 0,
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const apiClient = new ApiClient(getToken);
        
        let allUsers: User[] = [];
        
        if (userRole === "system_admin") {
          // For system admin: fetch all users and filter for non_affiliated only
          const data = await apiClient.getAllUsers(1, 500);
          allUsers = (data.users || []).filter(
            (u: User) => u.role === "non_affiliated"
          );
        } else if (userRole === "client_admin" && orgId) {
          // For client admin: fetch users from their organization
          const data = await apiClient.getOrgUsers(orgId, 1, 500);
          allUsers = data.users || [];
        } else {
          setLoading(false);
          return;
        }
        
        // Exclude client_admin and system_admin from calculations
        const users = allUsers.filter(
          (u) => u.role !== "client_admin" && u.role !== "system_admin"
        );

        let emailSum = 0;
        let whatsappSum = 0;
        let lmsSum = 0;
        let voiceSum = 0;
        let emailCount = 0;
        let whatsappCount = 0;
        let lmsCount = 0;
        let voiceCount = 0;

        users.forEach((user) => {
          const scores = user.learningScores;
          if (scores) {
            if (typeof scores.email === "number") {
              emailSum += scores.email;
              emailCount++;
            }
            if (typeof scores.whatsapp === "number") {
              whatsappSum += scores.whatsapp;
              whatsappCount++;
            }
            if (typeof scores.lms === "number") {
              lmsSum += scores.lms;
              lmsCount++;
            }
            if (typeof scores.voice === "number") {
              voiceSum += scores.voice;
              voiceCount++;
            }
          }
        });

        setAverages({
          email: emailCount > 0 ? Math.round((emailSum / emailCount) * 100) / 100 : 0,
          whatsapp: whatsappCount > 0 ? Math.round((whatsappSum / whatsappCount) * 100) / 100 : 0,
          lms: lmsCount > 0 ? Math.round((lmsSum / lmsCount) * 100) / 100 : 0,
          voice: voiceCount > 0 ? Math.round((voiceSum / voiceCount) * 100) / 100 : 0,
        });
      } catch (error) {
        console.error("Failed to fetch learning score breakdown:", error);
      } finally {
        setLoading(false);
      }
    };

    if ((userRole === "system_admin") || (userRole === "client_admin" && orgId)) {
      fetchData();
    }
  }, [orgId, userRole, getToken]);

  const chartData = [
    {
      name: t("Email"),
      value: averages.email,
      percentage: `${(averages.email * 100).toFixed(1)}%`,
    },
    {
      name: t("WhatsApp"),
      value: averages.whatsapp,
      percentage: `${(averages.whatsapp * 100).toFixed(1)}%`,
    },
    {
      name: t("LMS"),
      value: averages.lms,
      percentage: `${(averages.lms * 100).toFixed(1)}%`,
    },
    {
      name: t("Voice"),
      value: averages.voice,
      percentage: `${(averages.voice * 100).toFixed(1)}%`,
    },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-80">
        <div className="w-10 h-10 border-4 border-[var(--neon-blue)] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-[var(--dashboard-text-primary)] mb-2">
          {t("Learning Score Breakdown by Category")}
        </h3>
        <p className="text-sm text-[var(--dashboard-text-secondary)]">
          {t("Average scores across different training categories")} (0-1 scale)
        </p>
      </div>

      <div className="h-80">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={chartData}
            margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="var(--chart-grid-stroke)" />
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
              domain={[0, 1]}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "var(--navy-blue)",
                border: "1px solid var(--neon-blue)",
                borderRadius: "8px",
              }}
              formatter={(value: number | undefined) => [
                `${((value ?? 0) * 100).toFixed(1)}%`,
                t("Score"),
              ]}
            />
            <Bar
              dataKey="value"
              fill="var(--neon-blue)"
              radius={[8, 8, 0, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {chartData.map((item) => (
          <div
            key={item.name}
            className="bg-[var(--navy-blue-lighter)] rounded-lg p-4"
          >
            <p className="text-xs text-[var(--dashboard-text-secondary)] mb-1">
              {item.name}
            </p>
            <p className="text-lg font-bold text-[var(--dashboard-text-primary)]">
              {item.percentage}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
