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
import { Mail, MessageSquare, TrendingUp, AlertCircle } from "lucide-react";

interface Campaign {
  _id: string;
  name: string;
  status: string;
  startDate?: string;
  endDate?: string;
  stats?: any;
  managedByParentCampaign?: boolean;
}

interface CampaignAnalytics {
  totalTargets: number;
  totalSent: number;
  totalDelivered: number;
  totalOpened?: number;
  totalRead?: number;
  totalClicked: number;
  totalReported: number;
  deliveryRate: string | number;
  openRate?: string | number;
  readRate?: string | number;
  clickRate: string | number;
  reportRate: string | number;
}

export default function CampaignPerformance() {
  const { getToken } = useAuth();
  const { t } = useTranslation();
  const [loading, setLoading] = useState(true);
  const [emailCampaigns, setEmailCampaigns] = useState<Campaign[]>([]);
  const [whatsappCampaigns, setWhatsappCampaigns] = useState<Campaign[]>([]);
  const [emailAnalytics, setEmailAnalytics] = useState<CampaignAnalytics | null>(null);
  const [whatsappAnalytics, setWhatsappAnalytics] = useState<CampaignAnalytics | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const apiClient = new ApiClient(getToken);

        // Fetch campaigns - use high limit to get all campaigns
        const [emailRes, whatsappRes] = await Promise.all([
          apiClient.getCampaigns(1, 1000).catch(() => ({ success: false, data: { campaigns: [] } })),
          apiClient.getWhatsAppCampaigns(1, 1000).catch(() => ({ success: false, data: { campaigns: [] } })),
        ]);

        const email = emailRes.success && emailRes.data?.campaigns ? emailRes.data.campaigns : [];
        const whatsapp = whatsappRes.success && whatsappRes.data?.campaigns ? whatsappRes.data.campaigns : [];
        
        // Filter out WhatsApp campaigns that are managed by a parent Campaign (to avoid double-counting)
        // Only include standalone WhatsApp campaigns (managedByParentCampaign !== true)
        const standaloneWhatsapp = whatsapp.filter(
          (c: Campaign) => !c.managedByParentCampaign
        );

        setEmailCampaigns(email);
        setWhatsappCampaigns(standaloneWhatsapp);

        // Calculate aggregated analytics
        let emailTotalSent = 0;
        let emailTotalDelivered = 0;
        let emailTotalOpened = 0;
        let emailTotalClicked = 0;
        let emailTotalReported = 0;

        let whatsappTotalSent = 0;
        let whatsappTotalDelivered = 0;
        let whatsappTotalRead = 0;
        let whatsappTotalClicked = 0;
        let whatsappTotalReported = 0;

        // Fetch analytics for each campaign
        // Campaign models can be email-only OR unified (email + WhatsApp)
        for (const campaign of email) {
          try {
            const analytics = await apiClient.getCampaignAnalytics(campaign._id);
            if (analytics.success && analytics.data) {
              // Email stats (from email-only or unified campaigns)
              if (analytics.data.email) {
                const emailData = analytics.data.email;
                emailTotalSent += emailData.totalSent || 0;
                emailTotalDelivered += emailData.totalDelivered || 0;
                emailTotalOpened += emailData.totalOpened || 0;
                emailTotalClicked += emailData.totalClicked || 0;
                emailTotalReported += emailData.totalReported || 0;
              }
              
              // WhatsApp stats from unified campaigns (Campaign with WhatsApp enabled)
              // Only include if WhatsApp is enabled in the campaign
              if (analytics.data.whatsapp && analytics.data.whatsapp.enabled) {
                const whatsappData = analytics.data.whatsapp;
                whatsappTotalSent += whatsappData.totalSent || 0;
                whatsappTotalDelivered += whatsappData.totalDelivered || 0;
                whatsappTotalRead += whatsappData.totalRead || 0;
                whatsappTotalClicked += whatsappData.totalClicked || 0;
                whatsappTotalReported += whatsappData.totalReported || 0;
              }
            }
          } catch (error) {
            console.error(`Failed to fetch analytics for campaign ${campaign._id}:`, error);
          }
        }

        for (const campaign of standaloneWhatsapp) {
          try {
            const analytics = await apiClient.getWhatsAppCampaignAnalytics(campaign._id);
            if (analytics.success && analytics.data) {
              whatsappTotalSent += analytics.data.totalSent || 0;
              whatsappTotalDelivered += analytics.data.totalDelivered || 0;
              whatsappTotalRead += analytics.data.totalRead || 0;
              whatsappTotalClicked += analytics.data.totalClicked || 0;
              whatsappTotalReported += analytics.data.totalReported || 0;
            }
          } catch (error) {
            console.error(`Failed to fetch analytics for campaign ${campaign._id}:`, error);
          }
        }

        // Calculate rates
        setEmailAnalytics({
          totalTargets: 0,
          totalSent: emailTotalSent,
          totalDelivered: emailTotalDelivered,
          totalOpened: emailTotalOpened,
          totalClicked: emailTotalClicked,
          totalReported: emailTotalReported,
          deliveryRate: emailTotalSent > 0 ? ((emailTotalDelivered / emailTotalSent) * 100).toFixed(1) : 0,
          openRate: emailTotalSent > 0 ? ((emailTotalOpened / emailTotalSent) * 100).toFixed(1) : 0,
          clickRate: emailTotalSent > 0 ? ((emailTotalClicked / emailTotalSent) * 100).toFixed(1) : 0,
          reportRate: emailTotalSent > 0 ? ((emailTotalReported / emailTotalSent) * 100).toFixed(1) : 0,
        });

        setWhatsappAnalytics({
          totalTargets: 0,
          totalSent: whatsappTotalSent,
          totalDelivered: whatsappTotalDelivered,
          totalRead: whatsappTotalRead,
          totalClicked: whatsappTotalClicked,
          totalReported: whatsappTotalReported,
          deliveryRate: whatsappTotalSent > 0 ? ((whatsappTotalDelivered / whatsappTotalSent) * 100).toFixed(1) : 0,
          readRate: whatsappTotalSent > 0 ? ((whatsappTotalRead / whatsappTotalSent) * 100).toFixed(1) : 0,
          clickRate: whatsappTotalSent > 0 ? ((whatsappTotalClicked / whatsappTotalSent) * 100).toFixed(1) : 0,
          reportRate: whatsappTotalSent > 0 ? ((whatsappTotalReported / whatsappTotalSent) * 100).toFixed(1) : 0,
        });
      } catch (error) {
        console.error("Failed to fetch campaign performance:", error);
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

  const comparisonData = [
    {
      name: t("Delivery Rate"),
      Email: emailAnalytics ? parseFloat(emailAnalytics.deliveryRate as string) : 0,
      WhatsApp: whatsappAnalytics ? parseFloat(whatsappAnalytics.deliveryRate as string) : 0,
    },
    {
      name: t("Click Rate"),
      Email: emailAnalytics ? parseFloat(emailAnalytics.clickRate as string) : 0,
      WhatsApp: whatsappAnalytics ? parseFloat(whatsappAnalytics.clickRate as string) : 0,
    },
    {
      name: t("Credentials Entered Rate"),
      Email: emailAnalytics ? parseFloat(emailAnalytics.reportRate as string) : 0,
      WhatsApp: whatsappAnalytics ? parseFloat(whatsappAnalytics.reportRate as string) : 0,
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-[var(--dashboard-text-primary)] mb-2">
          {t("Campaign Performance")}
        </h3>
        <p className="text-sm text-[var(--dashboard-text-secondary)]">
          {t("Email and WhatsApp phishing campaign analytics")}
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Email Campaigns */}
        <div className="bg-[var(--navy-blue-lighter)] rounded-lg p-6">
          <div className="flex items-center gap-2 mb-4">
            <Mail className="w-5 h-5 text-[var(--neon-blue)]" />
            <h4 className="text-lg font-semibold text-[var(--dashboard-text-primary)]">
              {t("Email Campaigns")}
            </h4>
          </div>
          {emailAnalytics ? (
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-sm text-[var(--dashboard-text-secondary)]">
                  {t("Total Sent")}
                </span>
                <span className="text-sm font-semibold text-[var(--dashboard-text-primary)]">
                  {emailAnalytics.totalSent}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-[var(--dashboard-text-secondary)]">
                  {t("Delivered")}
                </span>
                <span className="text-sm font-semibold text-[var(--dashboard-text-primary)]">
                  {emailAnalytics.totalDelivered} ({emailAnalytics.deliveryRate}%)
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-[var(--dashboard-text-secondary)]">
                  {t("Opened")}
                </span>
                <span className="text-sm font-semibold text-[var(--dashboard-text-primary)]">
                  {emailAnalytics.totalOpened} ({emailAnalytics.openRate}%)
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-[var(--dashboard-text-secondary)]">
                  {t("Clicked")}
                </span>
                <span className="text-sm font-semibold text-red-400">
                  {emailAnalytics.totalClicked} ({emailAnalytics.clickRate}%)
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-[var(--dashboard-text-secondary)]">
                  {t("Credentials Entered")}
                </span>
                <span className="text-sm font-semibold text-[var(--success-green)]">
                  {emailAnalytics.totalReported} ({emailAnalytics.reportRate}%)
                </span>
              </div>
            </div>
          ) : (
            <p className="text-sm text-[var(--dashboard-text-secondary)]">
              {t("No email campaign data available")}
            </p>
          )}
        </div>

        {/* WhatsApp Campaigns */}
        <div className="bg-[var(--navy-blue-lighter)] rounded-lg p-6">
          <div className="flex items-center gap-2 mb-4">
            <MessageSquare className="w-5 h-5 text-[var(--neon-blue)]" />
            <h4 className="text-lg font-semibold text-[var(--dashboard-text-primary)]">
              {t("WhatsApp Campaigns")}
            </h4>
          </div>
          {whatsappAnalytics ? (
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-sm text-[var(--dashboard-text-secondary)]">
                  {t("Total Sent")}
                </span>
                <span className="text-sm font-semibold text-[var(--dashboard-text-primary)]">
                  {whatsappAnalytics.totalSent}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-[var(--dashboard-text-secondary)]">
                  {t("Delivered")}
                </span>
                <span className="text-sm font-semibold text-[var(--dashboard-text-primary)]">
                  {whatsappAnalytics.totalDelivered} ({whatsappAnalytics.deliveryRate}%)
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-[var(--dashboard-text-secondary)]">
                  {t("Read")}
                </span>
                <span className="text-sm font-semibold text-[var(--dashboard-text-primary)]">
                  {whatsappAnalytics.totalRead} ({whatsappAnalytics.readRate}%)
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-[var(--dashboard-text-secondary)]">
                  {t("Clicked")}
                </span>
                <span className="text-sm font-semibold text-red-400">
                  {whatsappAnalytics.totalClicked} ({whatsappAnalytics.clickRate}%)
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-[var(--dashboard-text-secondary)]">
                  {t("Credentials Entered")}
                </span>
                <span className="text-sm font-semibold text-[var(--success-green)]">
                  {whatsappAnalytics.totalReported} ({whatsappAnalytics.reportRate}%)
                </span>
              </div>
            </div>
          ) : (
            <p className="text-sm text-[var(--dashboard-text-secondary)]">
              {t("No WhatsApp campaign data available")}
            </p>
          )}
        </div>
      </div>

      {/* Comparison Chart */}
      {(emailAnalytics || whatsappAnalytics) && (
        <div className="h-80 pb-10">
          <h4 className="text-sm font-semibold text-[var(--dashboard-text-primary)] mb-4">
            {t("Performance Comparison")}
          </h4>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={comparisonData}
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
                domain={[0, 100]}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "var(--navy-blue)",
                  border: "1px solid var(--neon-blue)",
                  borderRadius: "8px",
                }}
                formatter={(value: number | undefined) => [`${(value || 0).toFixed(1)}%`, ""]}
              />
              <Legend />
              <Bar dataKey="Email" fill="var(--neon-blue)" radius={[8, 8, 0, 0]} />
              <Bar dataKey="WhatsApp" fill="var(--electric-blue)" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
