"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@clerk/nextjs";
import { ApiClient } from "@/lib/api";
import {
  PieChart,
  Pie,
  Cell,
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
import { Phone, AlertTriangle, CheckCircle, TrendingUp } from "lucide-react";

interface VoicePhishingAnalytics {
  totalConversations: number;
  completedConversations: number;
  averageScore: number;
  phishingScenarios: { total: number; fellForPhishing: number };
  normalScenarios: { total: number };
  resistanceLevels: { high: number; medium: number; low: number };
}

const COLORS = ["var(--neon-blue)", "var(--electric-blue)", "#fbbf24"];

export default function VoicePhishingOverview() {
  const { getToken } = useAuth();
  const { t } = useTranslation();
  const [loading, setLoading] = useState(true);
  const [analytics, setAnalytics] = useState<VoicePhishingAnalytics | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const apiClient = new ApiClient(getToken);
        const response = await apiClient.getVoicePhishingAnalytics();
        if (response.success) {
          setAnalytics(response.data);
        }
      } catch (error) {
        console.error("Failed to fetch voice phishing analytics:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [getToken]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-80">
        <div className="w-10 h-10 border-4 border-[var(--neon-blue)] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!analytics) {
    return (
      <div className="flex items-center justify-center h-80 text-[var(--dashboard-text-secondary)]">
        {t("No voice phishing data available")}
      </div>
    );
  }

  const scenarioData = [
    {
      name: t("Phishing"),
      value: analytics.phishingScenarios.total,
      color: "var(--neon-blue)",
    },
    {
      name: t("Normal"),
      value: analytics.normalScenarios.total,
      color: "var(--electric-blue)",
    },
  ];

  const resistanceData = [
    { name: t("High"), value: analytics.resistanceLevels.high },
    { name: t("Medium"), value: analytics.resistanceLevels.medium },
    { name: t("Low"), value: analytics.resistanceLevels.low },
  ];

  const phishingSuccessRate =
    analytics.phishingScenarios.total > 0
      ? ((analytics.phishingScenarios.fellForPhishing / analytics.phishingScenarios.total) * 100).toFixed(1)
      : "0";

  const completionRate =
    analytics.totalConversations > 0
      ? ((analytics.completedConversations / analytics.totalConversations) * 100).toFixed(1)
      : "0";

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-[var(--dashboard-text-primary)] mb-2">
          {t("Voice Phishing Overview")}
        </h3>
        <p className="text-sm text-[var(--dashboard-text-secondary)]">
          {t("Analytics for voice phishing simulations")}
        </p>
      </div>

      {/* Key Metrics Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-[var(--navy-blue-lighter)] rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <Phone className="w-4 h-4 text-[var(--neon-blue)]" />
            <p className="text-xs text-[var(--dashboard-text-secondary)]">
              {t("Total Conversations")}
            </p>
          </div>
          <p className="text-2xl font-bold text-[var(--dashboard-text-primary)]">
            {analytics.totalConversations}
          </p>
        </div>

        <div className="bg-[var(--navy-blue-lighter)] rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <CheckCircle className="w-4 h-4 text-[var(--success-green)]" />
            <p className="text-xs text-[var(--dashboard-text-secondary)]">
              {t("Completed")}
            </p>
          </div>
          <p className="text-2xl font-bold text-[var(--dashboard-text-primary)]">
            {analytics.completedConversations}
          </p>
          <p className="text-xs text-[var(--dashboard-text-secondary)] mt-1">
            {completionRate}% {t("completion rate")}
          </p>
        </div>

        <div className="bg-[var(--navy-blue-lighter)] rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="w-4 h-4 text-[var(--neon-blue)]" />
            <p className="text-xs text-[var(--dashboard-text-secondary)]">
              {t("Average Score")}
            </p>
          </div>
          <p className="text-2xl font-bold text-[var(--dashboard-text-primary)]">
            {analytics.averageScore.toFixed(1)}
          </p>
          <p className="text-xs text-[var(--dashboard-text-secondary)] mt-1">
            / 100
          </p>
        </div>

        <div className="bg-[var(--navy-blue-lighter)] rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle className="w-4 h-4 text-[#fbbf24]" />
            <p className="text-xs text-[var(--dashboard-text-secondary)]">
              {t("Fell for Phishing")}
            </p>
          </div>
          <p className="text-2xl font-bold text-[var(--dashboard-text-primary)]">
            {analytics.phishingScenarios.fellForPhishing}
          </p>
          <p className="text-xs text-[var(--dashboard-text-secondary)] mt-1">
            {phishingSuccessRate}% {t("of phishing attempts")}
          </p>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pb-10">
        {/* Scenario Type Distribution */}
        <div className="h-80">
          <h4 className="text-sm font-semibold text-[var(--dashboard-text-primary)] mb-4">
            {t("Scenario Type Distribution")}
          </h4>
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={scenarioData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name}: ${((percent || 0) * 100).toFixed(0)}%`}
                outerRadius={100}
                fill="#8884d8"
                dataKey="value"
              >
                {scenarioData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  backgroundColor: "var(--navy-blue)",
                  border: "1px solid var(--neon-blue)",
                  borderRadius: "8px",
                  color: "var(--dashboard-text-primary)",
                }}
                itemStyle={{
                  color: "var(--dashboard-text-primary)",
                }}
                labelStyle={{
                  color: "var(--dashboard-text-primary)",
                }}
              />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Resistance Levels */}
        <div className="h-80">
          <h4 className="text-sm font-semibold text-[var(--dashboard-text-primary)] mb-4">
            {t("Resistance Levels")}
          </h4>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={resistanceData}
              margin={{ top: 20, right: 30, left: 20, bottom: 30 }}
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
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "var(--navy-blue)",
                  border: "1px solid var(--neon-blue)",
                  borderRadius: "8px",
                  color: "var(--dashboard-text-primary)",
                }}
                itemStyle={{
                  color: "var(--dashboard-text-primary)",
                }}
                labelStyle={{
                  color: "var(--dashboard-text-primary)",
                }}
              />
              <Bar dataKey="value" fill="var(--neon-blue)" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
