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
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import { useTranslation } from "@/hooks/useTranslation";

interface LearningScoreDistributionProps {
  orgId?: string;
  userRole?: "system_admin" | "client_admin";
}

interface User {
  role?: string;
  learningScore?: number;
  displayName?: string;
  email?: string;
}

const COLORS = [
  "var(--neon-blue)",
  "var(--electric-blue)",
  "var(--success-green)",
  "#fbbf24",
  "#ef4444",
];

export default function LearningScoreDistribution({
  orgId,
  userRole,
}: LearningScoreDistributionProps) {
  const { getToken } = useAuth();
  const { t } = useTranslation();
  const [loading, setLoading] = useState(true);
  const [distribution, setDistribution] = useState({
    "0-20": 0,
    "21-40": 0,
    "41-60": 0,
    "61-80": 0,
    "81-100": 0,
  });
  const [usersByRange, setUsersByRange] = useState<{
    "0-20": User[];
    "21-40": User[];
    "41-60": User[];
    "61-80": User[];
    "81-100": User[];
  }>({
    "0-20": [],
    "21-40": [],
    "41-60": [],
    "61-80": [],
    "81-100": [],
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

        const dist = {
          "0-20": 0,
          "21-40": 0,
          "41-60": 0,
          "61-80": 0,
          "81-100": 0,
        };

        const usersByRange: {
          "0-20": User[];
          "21-40": User[];
          "41-60": User[];
          "61-80": User[];
          "81-100": User[];
        } = {
          "0-20": [],
          "21-40": [],
          "41-60": [],
          "61-80": [],
          "81-100": [],
        };

        users.forEach((user) => {
          const score = user.learningScore ?? 0;
          if (score >= 0 && score <= 20) {
            dist["0-20"]++;
            usersByRange["0-20"].push(user);
          } else if (score > 20 && score <= 40) {
            dist["21-40"]++;
            usersByRange["21-40"].push(user);
          } else if (score > 40 && score <= 60) {
            dist["41-60"]++;
            usersByRange["41-60"].push(user);
          } else if (score > 60 && score <= 80) {
            dist["61-80"]++;
            usersByRange["61-80"].push(user);
          } else if (score > 80 && score <= 100) {
            dist["81-100"]++;
            usersByRange["81-100"].push(user);
          }
        });

        setDistribution(dist);
        setUsersByRange(usersByRange);
      } catch (error) {
        console.error("Failed to fetch learning score distribution:", error);
      } finally {
        setLoading(false);
      }
    };

    if ((userRole === "system_admin") || (userRole === "client_admin" && orgId)) {
      fetchData();
    }
  }, [orgId, userRole, getToken]);

  const barData = [
    { name: "0-20", value: distribution["0-20"], label: "0-20", users: usersByRange["0-20"] },
    { name: "21-40", value: distribution["21-40"], label: "21-40", users: usersByRange["21-40"] },
    { name: "41-60", value: distribution["41-60"], label: "41-60", users: usersByRange["41-60"] },
    { name: "61-80", value: distribution["61-80"], label: "61-80", users: usersByRange["61-80"] },
    { name: "81-100", value: distribution["81-100"], label: "81-100", users: usersByRange["81-100"] },
  ];

  const pieData = [
    { name: "0-20", value: distribution["0-20"], users: usersByRange["0-20"] },
    { name: "21-40", value: distribution["21-40"], users: usersByRange["21-40"] },
    { name: "41-60", value: distribution["41-60"], users: usersByRange["41-60"] },
    { name: "61-80", value: distribution["61-80"], users: usersByRange["61-80"] },
    { name: "81-100", value: distribution["81-100"], users: usersByRange["81-100"] },
  ].filter((item) => item.value > 0);

  // Custom tooltip for bar chart
  const CustomBarTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      const users = data.users || [];
      return (
        <div className="bg-[var(--navy-blue)] border border-[var(--neon-blue)] rounded-lg p-3 shadow-lg">
          <p className="text-[var(--dashboard-text-primary)] font-semibold mb-2">{data.name}: {data.value} {t("users")}</p>
          {users.length > 0 && (
            <div className="space-y-1 max-h-48 overflow-y-auto">
              {users.map((user: User, idx: number) => (
                <p key={idx} className="text-xs text-[var(--dashboard-text-secondary)]">
                  {user.displayName || user.email || "—"}: {user.learningScore?.toFixed(1) || "0.0"}
                </p>
              ))}
            </div>
          )}
        </div>
      );
    }
    return null;
  };

  // Custom tooltip for pie chart
  const CustomPieTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      const users = data.users || [];
      const percent = ((data.value / total) * 100).toFixed(0);
      return (
        <div className="bg-[var(--navy-blue)] border border-[var(--neon-blue)] rounded-lg p-3 shadow-lg">
          <p className="text-[var(--dashboard-text-primary)] font-semibold mb-2">{data.name}: {data.value} {t("users")} ({percent}%)</p>
          {users.length > 0 && (
            <div className="space-y-1 max-h-48 overflow-y-auto">
              {users.map((user: User, idx: number) => (
                <p key={idx} className="text-xs text-[var(--dashboard-text-secondary)]">
                  {user.displayName || user.email || "—"}: {user.learningScore?.toFixed(1) || "0.0"}
                </p>
              ))}
            </div>
          )}
        </div>
      );
    }
    return null;
  };

  const total = Object.values(distribution).reduce((a, b) => a + b, 0);

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
          {t("Learning Score Distribution")}
        </h3>
        <p className="text-sm text-[var(--dashboard-text-secondary)]">
          {t("Distribution of users across score ranges")} ({total} {t("users")})
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-8">
        {/* Bar Chart */}
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={barData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
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
              />
              <Tooltip content={<CustomBarTooltip />} />
              <Bar dataKey="value" fill="var(--neon-blue)" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Pie Chart */}
        {pieData.length > 0 ? (
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip content={<CustomPieTooltip />} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="flex items-center justify-center h-80 text-[var(--dashboard-text-secondary)]">
            {t("No data available")}
          </div>
        )}
      </div>
    </div>
  );
}
