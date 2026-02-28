"use client";

import { useState, useEffect, useMemo } from "react";
import { useAuth } from "@clerk/nextjs";
import { useTranslation } from "@/hooks/useTranslation";
import {
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
} from "recharts";
import {
  AlertTriangle,
  CheckCircle2,
  TrendingUp,
  Activity,
  Mail,
  MessageSquare,
} from "lucide-react";

interface Incident {
  _id: string;
  messageType: "email" | "whatsapp";
  message: string;
  text?: string;
  subject?: string;
  from?: string;
  from_phone?: string;
  urls: string[];
  date?: string;
  timestamp: string;
  createdAt: string;
  is_phishing?: boolean;
  phishing_probability?: number;
  legitimate_probability?: number;
  confidence?: number;
  persuasion_cues?: string[];
  userId?: {
    _id: string;
    displayName?: string;
    email?: string;
  };
}

interface IncidentGraphProps {
  className?: string;
}


export default function IncidentGraph({ className = "" }: IncidentGraphProps) {
  const { getToken } = useAuth();
  const { t, language } = useTranslation();
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [timeRange, setTimeRange] = useState<"7d" | "30d" | "90d" | "all">("30d");

  useEffect(() => {
    fetchAllIncidents();
  }, [timeRange]);

  const fetchAllIncidents = async () => {
    try {
      setLoading(true);
      setError(null);
      const token = await getToken();
      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:5001";

      // Fetch all incidents (no pagination for graphs)
      const params = new URLSearchParams({
        page: "1",
        limit: "1000", // Get enough data for graphs
      });

      const res = await fetch(`${backendUrl}/api/incidents?${params}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) {
        throw new Error("Failed to fetch incidents");
      }

      const data = await res.json();
      if (data.success) {
        setIncidents(data.incidents || []);
      } else {
        throw new Error(data.error || "Failed to fetch incidents");
      }
    } catch (err) {
      console.error("Error fetching incidents:", err);
      setError(err instanceof Error ? err.message : "Failed to load incidents");
    } finally {
      setLoading(false);
    }
  };

  // Filter incidents by time range
  const filteredIncidents = useMemo(() => {
    if (timeRange === "all") return incidents;

    const now = new Date();
    const daysAgo = timeRange === "7d" ? 7 : timeRange === "30d" ? 30 : 90;
    const cutoffDate = new Date(now.getTime() - daysAgo * 24 * 60 * 60 * 1000);

    return incidents.filter((incident) => {
      const incidentDate = new Date(incident.createdAt || incident.timestamp);
      return incidentDate >= cutoffDate;
    });
  }, [incidents, timeRange]);

  // Prepare data for time series chart (incidents over time)
  const timeSeriesData = useMemo(() => {
    const dataMap = new Map<string, { date: string; dateObj: Date; phishing: number; safe: number; total: number }>();

    filteredIncidents.forEach((incident) => {
      const date = new Date(incident.createdAt || incident.timestamp);
      const dateKey = date.toLocaleDateString(language === "ur" ? "ur-PK" : "en-US", {
        month: "short",
        day: "numeric",
      });

      if (!dataMap.has(dateKey)) {
        dataMap.set(dateKey, { date: dateKey, dateObj: date, phishing: 0, safe: 0, total: 0 });
      }

      const entry = dataMap.get(dateKey)!;
      entry.total++;
      if (incident.is_phishing) {
        entry.phishing++;
      } else {
        entry.safe++;
      }
    });

    return Array.from(dataMap.values())
      .sort((a, b) => a.dateObj.getTime() - b.dateObj.getTime())
      .map(({ dateObj, ...rest }) => rest); // Remove dateObj before returning
  }, [filteredIncidents, language]);

  // Prepare data for donut chart - 4 segments: Email Safe, Email Phishing, WhatsApp Safe, WhatsApp Phishing
  const donutChartData = useMemo(() => {
    const emailPhishing = filteredIncidents.filter(
      (i) => i.messageType === "email" && i.is_phishing === true
    ).length;
    const emailSafe = filteredIncidents.filter(
      (i) => i.messageType === "email" && i.is_phishing === false
    ).length;
    const whatsappPhishing = filteredIncidents.filter(
      (i) => i.messageType === "whatsapp" && i.is_phishing === true
    ).length;
    const whatsappSafe = filteredIncidents.filter(
      (i) => i.messageType === "whatsapp" && i.is_phishing === false
    ).length;
    
    return [
      {
        name: `${t("Email")} ${t("Safe")}`,
        value: emailSafe,
        color: "#60a5fa",
        gradient: ["#60a5fa", "#3b82f6"],
      },
      {
        name: `${t("Email")} ${t("Phishing")}`,
        value: emailPhishing,
        color: "#1e40af",
        gradient: ["#1e40af", "#1e3a8a"],
      },
      {
        name: `${t("WhatsApp")} ${t("Safe")}`,
        value: whatsappSafe,
        color: "#fbbf24",
        gradient: ["#fbbf24", "#f59e0b"],
      },
      {
        name: `${t("WhatsApp")} ${t("Phishing")}`,
        value: whatsappPhishing,
        color: "#d97706",
        gradient: ["#d97706", "#b45309"],
      },
    ];
  }, [filteredIncidents, t]);

  // Prepare data for phishing by type
  const phishingByType = useMemo(() => {
    const emailPhishing = filteredIncidents.filter(
      (i) => i.messageType === "email" && i.is_phishing === true
    ).length;
    const emailSafe = filteredIncidents.filter(
      (i) => i.messageType === "email" && i.is_phishing === false
    ).length;
    const whatsappPhishing = filteredIncidents.filter(
      (i) => i.messageType === "whatsapp" && i.is_phishing === true
    ).length;
    const whatsappSafe = filteredIncidents.filter(
      (i) => i.messageType === "whatsapp" && i.is_phishing === false
    ).length;

    return [
      {
        type: t("Email"),
        phishing: emailPhishing,
        safe: emailSafe,
        total: emailPhishing + emailSafe,
      },
      {
        type: t("WhatsApp"),
        phishing: whatsappPhishing,
        safe: whatsappSafe,
        total: whatsappPhishing + whatsappSafe,
      },
    ];
  }, [filteredIncidents, t]);


  // Calculate statistics
  const stats = useMemo(() => {
    const total = filteredIncidents.length;
    const phishing = filteredIncidents.filter((i) => i.is_phishing === true).length;
    const safe = filteredIncidents.filter((i) => i.is_phishing === false).length;
    const avgProbability =
      filteredIncidents.length > 0
        ? filteredIncidents.reduce((sum, i) => sum + (i.phishing_probability || 0), 0) /
          filteredIncidents.length
        : 0;

    return {
      total,
      phishing,
      safe,
      avgProbability,
      phishingRate: total > 0 ? (phishing / total) * 100 : 0,
    };
  }, [filteredIncidents]);

  if (loading) {
    return (
      <div className={`flex items-center justify-center p-12 ${className}`}>
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[var(--neon-blue)] mx-auto"></div>
          <p className="text-[var(--dashboard-text-secondary)] dark:text-[var(--light-blue)]">{t("Loading incidents...")}</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`bg-red-900/20 border border-red-500/50 rounded-lg p-4 text-red-300 flex items-center gap-2 ${className}`}>
        <AlertTriangle className="w-5 h-5" />
        <span>{error}</span>
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header with Time Range */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-[var(--dashboard-text-primary)] dark:text-white mb-1">{t("Incident Reports")}</h2>
          <p className="text-[var(--dashboard-text-secondary)] dark:text-[var(--medium-grey)] text-sm">{t("Visual analytics of your reported incidents")}</p>
        </div>

        {/* Time Range Selector */}
        <div className="flex gap-2 bg-gray-200 dark:bg-[var(--navy-blue-lighter)]/50 backdrop-blur-md p-2 rounded-xl border border-gray-300 dark:border-[var(--medium-grey)]/20">
          {(["7d", "30d", "90d", "all"] as const).map((range) => (
            <button
              key={range}
              onClick={() => setTimeRange(range)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-300 ${
                timeRange === range
                  ? "bg-gradient-to-r from-[#51b0ec] via-[#4fc3f7] to-[#51b0ec] text-white shadow-[0_0_20px_rgba(81,176,236,0.4)]"
                  : "text-[var(--dashboard-text-primary)] dark:text-[var(--medium-grey)] hover:text-[var(--dashboard-text-primary)] dark:hover:text-white hover:bg-gray-300 dark:hover:bg-[var(--navy-blue)]/50"
              }`}
            >
              {range === "all" ? t("All Time") : range === "7d" ? t("7 Days") : range === "30d" ? t("30 Days") : t("90 Days")}
            </button>
          ))}
        </div>
      </div>

      {/* Statistics Cards - Compact */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-white dark:bg-[var(--navy-blue-lighter)]/50 backdrop-blur-md rounded-lg p-4 border border-gray-300 dark:border-[var(--medium-grey)]/20">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[var(--dashboard-text-secondary)] dark:text-[var(--medium-grey)] text-xs">{t("Total Incidents")}</span>
            <Activity className="w-4 h-4 text-[var(--neon-blue)]" />
          </div>
          <div className="text-2xl font-bold text-[var(--dashboard-text-primary)] dark:text-white">{stats.total}</div>
        </div>

        <div className="bg-white dark:bg-[var(--navy-blue-lighter)]/50 backdrop-blur-md rounded-lg p-4 border border-gray-300 dark:border-[var(--medium-grey)]/20">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[var(--dashboard-text-secondary)] dark:text-[var(--medium-grey)] text-xs">{t("Phishing Detected")}</span>
            <AlertTriangle className="w-4 h-4 text-red-400" />
          </div>
          <div className="text-2xl font-bold text-red-400">{stats.phishing}</div>
          <div className="text-xs text-[var(--dashboard-text-secondary)] dark:text-[var(--medium-grey)] mt-0.5">
            {stats.phishingRate.toFixed(1)}%
          </div>
        </div>

        <div className="bg-white dark:bg-[var(--navy-blue-lighter)]/50 backdrop-blur-md rounded-lg p-4 border border-gray-300 dark:border-[var(--medium-grey)]/20">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[var(--dashboard-text-secondary)] dark:text-[var(--medium-grey)] text-xs">{t("Safe Messages")}</span>
            <CheckCircle2 className="w-4 h-4 text-green-400" />
          </div>
          <div className="text-2xl font-bold text-green-400">{stats.safe}</div>
        </div>

        <div className="bg-white dark:bg-[var(--navy-blue-lighter)]/50 backdrop-blur-md rounded-lg p-4 border border-gray-300 dark:border-[var(--medium-grey)]/20">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[var(--dashboard-text-secondary)] dark:text-[var(--medium-grey)] text-xs">{t("Avg Probability")}</span>
            <TrendingUp className="w-4 h-4 text-[var(--neon-blue)]" />
          </div>
          <div className="text-2xl font-bold text-[var(--dashboard-text-primary)] dark:text-white">{(stats.avgProbability * 100).toFixed(1)}%</div>
        </div>
      </div>

      {/* Main Chart - Full Width */}
      <div className="bg-white dark:bg-[var(--navy-blue-lighter)]/50 backdrop-blur-md rounded-xl p-6 border border-gray-300 dark:border-[var(--medium-grey)]/20">
        <h3 className="text-lg font-semibold text-[var(--dashboard-text-primary)] dark:text-white mb-4">{t("Incidents Over Time")}</h3>
        <div className="w-full h-80">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={timeSeriesData}
              margin={{
                top: 20,
                right: 30,
                left: 20,
                bottom: 5,
              }}
            >
              <defs>
                <linearGradient id="incidentPhishingGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop
                    offset="5%"
                    stopColor="var(--neon-blue)"
                    stopOpacity={0.8}
                  />
                  <stop
                    offset="95%"
                    stopColor="var(--neon-blue)"
                    stopOpacity={0.1}
                  />
                </linearGradient>
                <linearGradient id="incidentSafeGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop
                    offset="5%"
                    stopColor="var(--electric-blue)"
                    stopOpacity={0.6}
                  />
                  <stop
                    offset="95%"
                    stopColor="var(--electric-blue)"
                    stopOpacity={0.05}
                  />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--chart-grid-stroke)" />
              <XAxis
                dataKey="date"
                axisLine={false}
                tickLine={false}
                tick={{ fill: "var(--dashboard-text-secondary)", fontSize: 12 }}
              />
              <YAxis
                axisLine={false}
                tickLine={false}
                tick={{ fill: "var(--dashboard-text-secondary)", fontSize: 12 }}
              />
              <Area
                type="monotone"
                dataKey="phishing"
                stroke="var(--neon-blue)"
                strokeWidth={2}
                fill="url(#incidentPhishingGradient)"
              />
              <Area
                type="monotone"
                dataKey="safe"
                stroke="var(--electric-blue)"
                strokeWidth={2}
                fill="url(#incidentSafeGradient)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Secondary Charts - 50/50 split: Type Breakdown Cards and Donut Chart */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Type Breakdown Cards - Email and WhatsApp */}
        <div className="bg-white dark:bg-[var(--navy-blue-lighter)]/50 backdrop-blur-md rounded-xl p-4 border border-gray-300 dark:border-[var(--medium-grey)]/20">
          <h3 className="text-sm font-semibold text-[var(--dashboard-text-primary)] dark:text-white mb-4">{t("Incidents by Type")}</h3>
          <div className="space-y-3">
            {/* Email Card */}
            <div className="bg-gray-50 dark:bg-[var(--navy-blue)]/30 rounded-lg p-4 border border-gray-300 dark:border-[var(--medium-grey)]/20 hover:bg-gray-100 dark:hover:bg-[var(--navy-blue)]/40 transition-colors">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="w-10 h-10 bg-gradient-to-br from-[#51b0ec] to-[#4fc3f7] rounded-lg flex items-center justify-center">
                    <Mail className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <p className="text-xs text-[var(--dashboard-text-secondary)] dark:text-[var(--medium-grey)]">{t("Email")}</p>
                    <p className="text-xl font-bold text-[var(--dashboard-text-primary)] dark:text-white">
                      {phishingByType.find((d) => d.type === t("Email"))?.total || 0}
                    </p>
                  </div>
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-[#ef4444]"></div>
                    <span className="text-xs text-[var(--dashboard-text-secondary)] dark:text-[var(--medium-grey)]">{t("Phishing")}</span>
                  </div>
                  <span className="text-sm font-semibold text-[var(--dashboard-text-primary)] dark:text-white">
                    {phishingByType.find((d) => d.type === t("Email"))?.phishing || 0}
                  </span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-[var(--navy-blue-lighter)]/50 rounded-full h-2 overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-[#ef4444] to-[#dc2626] rounded-full transition-all duration-500"
                    style={{
                      width: `${
                        (phishingByType.find((d) => d.type === t("Email"))?.phishing || 0) /
                        Math.max(
                          (phishingByType.find((d) => d.type === t("Email"))?.total || 1),
                          1
                        ) *
                        100
                      }%`,
                    }}
                  ></div>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-[#10b981]"></div>
                    <span className="text-xs text-[var(--dashboard-text-secondary)] dark:text-[var(--medium-grey)]">{t("Safe")}</span>
                  </div>
                  <span className="text-sm font-semibold text-[var(--dashboard-text-primary)] dark:text-white">
                    {phishingByType.find((d) => d.type === t("Email"))?.safe || 0}
                  </span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-[var(--navy-blue-lighter)]/50 rounded-full h-2 overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-[#10b981] to-[#059669] rounded-full transition-all duration-500"
                    style={{
                      width: `${
                        (phishingByType.find((d) => d.type === t("Email"))?.safe || 0) /
                        Math.max(
                          (phishingByType.find((d) => d.type === t("Email"))?.total || 1),
                          1
                        ) *
                        100
                      }%`,
                    }}
                  ></div>
                </div>
              </div>
            </div>

            {/* WhatsApp Card */}
            <div className="bg-gray-50 dark:bg-[var(--navy-blue)]/30 rounded-lg p-4 border border-gray-300 dark:border-[var(--medium-grey)]/20 hover:bg-gray-100 dark:hover:bg-[var(--navy-blue)]/40 transition-colors">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="w-10 h-10 bg-gradient-to-br from-[#25d366] to-[#128c7e] rounded-lg flex items-center justify-center">
                    <MessageSquare className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <p className="text-xs text-[var(--dashboard-text-secondary)] dark:text-[var(--medium-grey)]">{t("WhatsApp")}</p>
                    <p className="text-xl font-bold text-[var(--dashboard-text-primary)] dark:text-white">
                      {phishingByType.find((d) => d.type === t("WhatsApp"))?.total || 0}
                    </p>
                  </div>
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-[#ef4444]"></div>
                    <span className="text-xs text-[var(--dashboard-text-secondary)] dark:text-[var(--medium-grey)]">{t("Phishing")}</span>
                  </div>
                  <span className="text-sm font-semibold text-[var(--dashboard-text-primary)] dark:text-white">
                    {phishingByType.find((d) => d.type === t("WhatsApp"))?.phishing || 0}
                  </span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-[var(--navy-blue-lighter)]/50 rounded-full h-2 overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-[#ef4444] to-[#dc2626] rounded-full transition-all duration-500"
                    style={{
                      width: `${
                        (phishingByType.find((d) => d.type === t("WhatsApp"))?.phishing || 0) /
                        Math.max(
                          (phishingByType.find((d) => d.type === t("WhatsApp"))?.total || 1),
                          1
                        ) *
                        100
                      }%`,
                    }}
                  ></div>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-[#10b981]"></div>
                    <span className="text-xs text-[var(--dashboard-text-secondary)] dark:text-[var(--medium-grey)]">{t("Safe")}</span>
                  </div>
                  <span className="text-sm font-semibold text-[var(--dashboard-text-primary)] dark:text-white">
                    {phishingByType.find((d) => d.type === t("WhatsApp"))?.safe || 0}
                  </span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-[var(--navy-blue-lighter)]/50 rounded-full h-2 overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-[#10b981] to-[#059669] rounded-full transition-all duration-500"
                    style={{
                      width: `${
                        (phishingByType.find((d) => d.type === t("WhatsApp"))?.safe || 0) /
                        Math.max(
                          (phishingByType.find((d) => d.type === t("WhatsApp"))?.total || 1),
                          1
                        ) *
                        100
                      }%`,
                    }}
                  ></div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Donut Chart - Email Safe, Email Phishing, WhatsApp Safe, WhatsApp Phishing */}
        <div className="bg-white dark:bg-[var(--navy-blue-lighter)]/50 backdrop-blur-md rounded-xl p-6 border border-gray-300 dark:border-[var(--medium-grey)]/20">
          <h3 className="text-lg font-semibold text-[var(--dashboard-text-primary)] dark:text-white mb-4">{t("Incidents Breakdown")}</h3>
          <div className="flex items-center justify-center h-[260px] relative w-full">
            <div className="relative mx-auto" style={{ width: 220, height: 220 }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <defs>
                    <linearGradient id="emailSafeGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#60a5fa" stopOpacity={1} />
                      <stop offset="100%" stopColor="#3b82f6" stopOpacity={1} />
                    </linearGradient>
                    <linearGradient id="emailPhishingGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#1e40af" stopOpacity={1} />
                      <stop offset="100%" stopColor="#1e3a8a" stopOpacity={1} />
                    </linearGradient>
                    <linearGradient id="whatsappSafeGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#fbbf24" stopOpacity={1} />
                      <stop offset="100%" stopColor="#f59e0b" stopOpacity={1} />
                    </linearGradient>
                    <linearGradient id="whatsappPhishingGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#d97706" stopOpacity={1} />
                      <stop offset="100%" stopColor="#b45309" stopOpacity={1} />
                    </linearGradient>
                  </defs>
                  <Pie
                    data={donutChartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={85}
                    paddingAngle={2}
                    dataKey="value"
                    startAngle={90}
                    endAngle={-270}
                  >
                    {donutChartData.map((entry, index) => {
                      let gradientId = "";
                      if (entry.name.includes(t("Email")) && entry.name.includes(t("Safe"))) {
                        gradientId = "emailSafeGradient";
                      } else if (entry.name.includes(t("Email")) && entry.name.includes(t("Phishing"))) {
                        gradientId = "emailPhishingGradient";
                      } else if (entry.name.includes(t("WhatsApp")) && entry.name.includes(t("Safe"))) {
                        gradientId = "whatsappSafeGradient";
                      } else {
                        gradientId = "whatsappPhishingGradient";
                      }
                      return (
                        <Cell
                          key={`cell-donut-${index}`}
                          fill={`url(#${gradientId})`}
                        />
                      );
                    })}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              {/* Center content */}
              <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-center">
                <p className="text-xs text-[var(--dashboard-text-secondary)] dark:text-[var(--medium-grey)] mb-1">{t("Total")}</p>
                <p className="text-xl font-bold text-[var(--dashboard-text-primary)] dark:text-white">
                  {filteredIncidents.length}
                </p>
              </div>
            </div>
          </div>
          
          {/* Legend at the bottom */}
          <div className="mt-6 pt-4 border-t border-gray-300 dark:border-[var(--medium-grey)]/20">
            <div className="flex flex-wrap justify-center gap-6">
              {donutChartData.map((entry, index) => {
                const total = donutChartData.reduce((sum, item) => sum + item.value, 0);
                const percentage = total > 0 ? ((entry.value / total) * 100).toFixed(0) : 0;
                
                return (
                  <div key={index} className="flex flex-col items-center gap-1">
                    <div className="flex items-center gap-2">
                      <div
                        className="w-3 h-3 rounded-full flex-shrink-0"
                        style={{ backgroundColor: entry.gradient[0] }}
                      ></div>
                      <p className="text-xs text-[var(--dashboard-text-secondary)] dark:text-[var(--medium-grey)] whitespace-nowrap">
                        {entry.name}
                      </p>
                    </div>
                    <p className="text-sm font-bold text-[var(--dashboard-text-primary)] dark:text-white">{percentage}%</p>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {filteredIncidents.length === 0 && (
        <div className="bg-white dark:bg-[var(--navy-blue-lighter)]/50 backdrop-blur-md rounded-xl p-12 border border-gray-300 dark:border-[var(--medium-grey)]/20 text-center">
          <p className="text-[var(--dashboard-text-secondary)] dark:text-[var(--medium-grey)]">{t("No incidents found for the selected time range")}</p>
        </div>
      )}
    </div>
  );
}
