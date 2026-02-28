"use client";

import { useState, useEffect } from "react";
import {
  X,
  Users,
  Mail,
  MessageSquare,
  BarChart3,
  Clock,
  CheckCircle2,
  XCircle,
  Eye,
  MousePointerClick,
  AlertTriangle,
  Calendar,
  Send,
  TrendingUp,
} from "lucide-react";
import { useAuth } from "@clerk/nextjs";
import { useTranslation } from "@/hooks/useTranslation";

interface CampaignTarget {
  userId?: string;
  name: string;
  email?: string;
  phoneNumber?: string;
  emailStatus: string;
  whatsappStatus: string;
  emailSentAt?: string;
  emailOpenedAt?: string;
  emailClickedAt?: string;
  emailReportedAt?: string;
  whatsappSentAt?: string;
  whatsappReportedAt?: string;
}

interface Campaign {
  _id: string;
  name: string;
  description: string;
  status: string;
  whatsappConfig: {
    enabled: boolean;
    messageTemplate?: string;
    landingPageUrl?: string;
  };
  emailConfig: {
    enabled: boolean;
    subject?: string;
    bodyContent?: string;
    senderEmail?: string;
    landingPageUrl?: string;
  };
  targetUsers: CampaignTarget[];
  stats: {
    totalEmailTargets: number;
    totalEmailSent: number;
    totalEmailDelivered: number;
    totalEmailOpened: number;
    totalEmailClicked: number;
    totalEmailFailed: number;
    totalWhatsappTargets: number;
    totalWhatsappSent: number;
    totalWhatsappDelivered: number;
    totalWhatsappRead: number;
    totalWhatsappClicked: number;
    totalWhatsappFailed: number;
  };
  createdAt: string;
  scheduleDate?: string;
  startDate?: string;
  endDate?: string;
}

interface CampaignDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  campaign: Campaign;
  onRefresh: () => void;
}

interface Analytics {
  totalTargets: number;
  status: string;
  startDate?: string;
  endDate?: string;
  email: {
    enabled: boolean;
    totalTargets: number;
    totalSent: number;
    totalDelivered: number;
    totalOpened: number;
    totalClicked: number;
    totalReported: number;
    totalFailed: number;
    deliveryRate: string;
    openRate: string;
    clickRate: string;
    reportRate: string;
  };
  whatsapp: {
    enabled: boolean;
    totalTargets: number;
    totalSent: number;
    totalDelivered: number;
    totalRead: number;
    totalClicked: number;
    totalReported: number;
    totalFailed: number;
    deliveryRate: string;
    readRate: string;
    clickRate: string;
    reportRate: string;
  };
}

export default function CampaignDetailModal({
  isOpen,
  onClose,
  campaign,
  onRefresh,
}: CampaignDetailModalProps) {
  const { t } = useTranslation();
  const { getToken } = useAuth();
  const [activeTab, setActiveTab] = useState<"overview" | "targets" | "analytics">("overview");
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [loadingAnalytics, setLoadingAnalytics] = useState(false);

  useEffect(() => {
    if (isOpen && activeTab === "analytics") {
      fetchAnalytics();
    }
  }, [isOpen, activeTab]);

  const fetchAnalytics = async () => {
    try {
      setLoadingAnalytics(true);
      const token = await getToken();
      if (!token) return;

      const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5001/api";
      const response = await fetch(`${API_BASE_URL}/campaigns/${campaign._id}/analytics`, {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();
      if (response.ok && data.success) {
        setAnalytics(data.data);
      }
    } catch (error) {
      console.error("Error fetching analytics:", error);
    } finally {
      setLoadingAnalytics(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "sent":
        return "text-green-400";
      case "delivered":
        return "text-green-400";
      case "opened":
      case "read":
        return "text-blue-400";
      case "clicked":
        return "text-purple-400";
      case "failed":
        return "text-red-400";
      case "pending":
        return "text-yellow-400";
      case "reported":
        return "text-amber-400";
      case "not_applicable":
        return "text-gray-400";
      default:
        return "text-[var(--medium-grey)]";
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-[var(--dashboard-card-bg)] dark:bg-[var(--navy-blue-light)] rounded-2xl p-6 w-full max-w-6xl max-h-[90vh] overflow-y-auto border border-[var(--dashboard-card-border)] dark:border-transparent">
        {/* Header */}
        <div className="flex items-start justify-between mb-6">
          <div className="flex-1">
            <h2 className="text-2xl font-bold text-[var(--dashboard-text-primary)] dark:text-white mb-2">{campaign.name}</h2>
            <p className="text-[var(--dashboard-text-secondary)] dark:text-[var(--medium-grey)]">{campaign.description}</p>
            
            <div className="flex gap-3 mt-4">
              {campaign.emailConfig.enabled && (
                <div className="flex items-center gap-1 px-3 py-1 bg-blue-500/20 text-blue-400 rounded-lg text-xs border border-blue-500/30">
                  <Mail className="w-3 h-3" />
                  {t("Email")}
                </div>
              )}
              {campaign.whatsappConfig.enabled && (
                <div className="flex items-center gap-1 px-3 py-1 bg-green-500/20 text-green-400 rounded-lg text-xs border border-green-500/30">
                  <MessageSquare className="w-3 h-3" />
                  {t("WhatsApp")}
                </div>
              )}
              <div className="px-3 py-1 bg-[var(--neon-blue)]/20 text-[var(--neon-blue)] rounded-lg text-xs border border-[var(--neon-blue)]/30">
                {t(campaign.status.charAt(0).toUpperCase() + campaign.status.slice(1))}
              </div>
            </div>
          </div>
          
          <button
            onClick={onClose}
            className="text-[var(--dashboard-text-secondary)] dark:text-[var(--medium-grey)] hover:text-[var(--dashboard-text-primary)] dark:hover:text-white transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6 border-b border-gray-200 dark:border-[var(--medium-grey)]/20">
          <button
            onClick={() => setActiveTab("overview")}
            className={`px-4 py-2 font-medium transition-colors ${
              activeTab === "overview"
                ? "text-[var(--neon-blue)] border-b-2 border-[var(--neon-blue)]"
                : "text-[var(--dashboard-text-secondary)] dark:text-[var(--medium-grey)] hover:text-[var(--dashboard-text-primary)] dark:hover:text-white"
            }`}
          >
            {t("Overview")}
          </button>
          <button
            onClick={() => setActiveTab("targets")}
            className={`px-4 py-2 font-medium transition-colors ${
              activeTab === "targets"
                ? "text-[var(--neon-blue)] border-b-2 border-[var(--neon-blue)]"
                : "text-[var(--dashboard-text-secondary)] dark:text-[var(--medium-grey)] hover:text-[var(--dashboard-text-primary)] dark:hover:text-white"
            }`}
          >
            {t("Target Users")} ({campaign.targetUsers.length})
          </button>
          <button
            onClick={() => setActiveTab("analytics")}
            className={`px-4 py-2 font-medium transition-colors ${
              activeTab === "analytics"
                ? "text-[var(--neon-blue)] border-b-2 border-[var(--neon-blue)]"
                : "text-[var(--dashboard-text-secondary)] dark:text-[var(--medium-grey)] hover:text-[var(--dashboard-text-primary)] dark:hover:text-white"
            }`}
          >
            {t("Analytics")}
          </button>
        </div>

        {/* Content */}
        {activeTab === "overview" && (
          <div className="space-y-6">
            {/* Dates */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {campaign.scheduleDate && (
                <div className="bg-gray-50 dark:bg-[var(--navy-blue)] rounded-lg p-4 border border-gray-200 dark:border-transparent">
                  <div className="flex items-center gap-2 mb-2">
                    <Calendar className="w-4 h-4 text-[var(--neon-blue)]" />
                    <span className="text-sm text-[var(--dashboard-text-secondary)] dark:text-[var(--medium-grey)]">{t("Scheduled")}</span>
                  </div>
                  <p className="text-[var(--dashboard-text-primary)] dark:text-white">{formatDate(campaign.scheduleDate)}</p>
                </div>
              )}
              {campaign.startDate && (
                <div className="bg-gray-50 dark:bg-[var(--navy-blue)] rounded-lg p-4 border border-gray-200 dark:border-transparent">
                  <div className="flex items-center gap-2 mb-2">
                    <Clock className="w-4 h-4 text-green-400" />
                    <span className="text-sm text-[var(--dashboard-text-secondary)] dark:text-[var(--medium-grey)]">{t("Started")}</span>
                  </div>
                  <p className="text-[var(--dashboard-text-primary)] dark:text-white">{formatDate(campaign.startDate)}</p>
                </div>
              )}
              {campaign.endDate && (
                <div className="bg-gray-50 dark:bg-[var(--navy-blue)] rounded-lg p-4 border border-gray-200 dark:border-transparent">
                  <div className="flex items-center gap-2 mb-2">
                    <CheckCircle2 className="w-4 h-4 text-purple-400" />
                    <span className="text-sm text-[var(--dashboard-text-secondary)] dark:text-[var(--medium-grey)]">{t("Completed")}</span>
                  </div>
                  <p className="text-[var(--dashboard-text-primary)] dark:text-white">{formatDate(campaign.endDate)}</p>
                </div>
              )}
            </div>

            {/* Email Config */}
            {campaign.emailConfig.enabled && (
              <div className="bg-gray-50 dark:bg-[var(--navy-blue)] rounded-lg p-4 border border-blue-500/30">
                <div className="flex items-center gap-2 mb-4">
                  <Mail className="w-5 h-5 text-blue-400" />
                  <h3 className="text-lg font-semibold text-[var(--dashboard-text-primary)] dark:text-white">{t("Email Configuration")}</h3>
                </div>
                <div className="space-y-3">
                  {campaign.emailConfig.senderEmail && (
                    <div>
                      <span className="text-sm text-[var(--dashboard-text-secondary)] dark:text-[var(--medium-grey)]">{t("Sender")}:</span>
                      <p className="text-[var(--dashboard-text-primary)] dark:text-white">{campaign.emailConfig.senderEmail}</p>
                    </div>
                  )}
                  {campaign.emailConfig.subject && (
                    <div>
                      <span className="text-sm text-[var(--dashboard-text-secondary)] dark:text-[var(--medium-grey)]">{t("Subject")}:</span>
                      <p className="text-[var(--dashboard-text-primary)] dark:text-white">{campaign.emailConfig.subject}</p>
                    </div>
                  )}
                  {campaign.emailConfig.bodyContent && (
                    <div>
                      <span className="text-sm text-[var(--dashboard-text-secondary)] dark:text-[var(--medium-grey)]">{t("Body")}:</span>
                      <p className="text-[var(--dashboard-text-primary)] dark:text-white text-sm line-clamp-3">{campaign.emailConfig.bodyContent}</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* WhatsApp Config */}
            {campaign.whatsappConfig.enabled && (
              <div className="bg-gray-50 dark:bg-[var(--navy-blue)] rounded-lg p-4 border border-green-500/30">
                <div className="flex items-center gap-2 mb-4">
                  <MessageSquare className="w-5 h-5 text-green-400" />
                  <h3 className="text-lg font-semibold text-[var(--dashboard-text-primary)] dark:text-white">{t("WhatsApp Configuration")}</h3>
                </div>
                <div className="space-y-3">
                  {campaign.whatsappConfig.messageTemplate && (
                    <div>
                      <span className="text-sm text-[var(--dashboard-text-secondary)] dark:text-[var(--medium-grey)]">{t("Message")}:</span>
                      <p className="text-[var(--dashboard-text-primary)] dark:text-white text-sm whitespace-pre-wrap">{campaign.whatsappConfig.messageTemplate}</p>
                    </div>
                  )}
                  {campaign.whatsappConfig.landingPageUrl && (
                    <div>
                      <span className="text-sm text-[var(--dashboard-text-secondary)] dark:text-[var(--medium-grey)]">{t("Landing Page")}:</span>
                      <p className="text-[var(--dashboard-text-primary)] dark:text-white text-sm">{campaign.whatsappConfig.landingPageUrl}</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === "targets" && (
          <div className="space-y-3">
            {campaign.targetUsers.map((target, index) => (
              <div
                key={index}
                className="bg-gray-50 dark:bg-[var(--navy-blue)] rounded-lg p-4 border border-gray-200 dark:border-[var(--medium-grey)]/20"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <p className="text-[var(--dashboard-text-primary)] dark:text-white font-medium mb-2">{target.name}</p>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Email Status */}
                      {campaign.emailConfig.enabled && (
                        <div className="flex items-start gap-3">
                          <Mail className="w-4 h-4 text-blue-400 mt-1" />
                          <div>
                            <p className="text-sm text-[var(--dashboard-text-secondary)] dark:text-[var(--medium-grey)]">
                              {target.email || t("No email")}
                            </p>
                            <p className={`text-sm font-medium ${getStatusColor(target.emailStatus)}`}>
                              {t(target.emailStatus.replace("_", " ").charAt(0).toUpperCase() + target.emailStatus.slice(1).replace("_", " "))}
                            </p>
                            {target.emailSentAt && (
                              <p className="text-xs text-[var(--dashboard-text-secondary)] dark:text-[var(--medium-grey)] mt-1">
                                {t("Sent")}: {formatDate(target.emailSentAt)}
                              </p>
                            )}
                            {target.emailOpenedAt && (
                              <p className="text-xs text-blue-400 mt-1">
                                {t("First opened at")}: {formatDate(target.emailOpenedAt)}
                              </p>
                            )}
                            {target.emailClickedAt && (
                              <p className="text-xs text-purple-400 mt-1">
                                {t("First clicked at")}: {formatDate(target.emailClickedAt)}
                              </p>
                            )}
                            {target.emailReportedAt && (
                              <p className="text-xs text-amber-400 mt-1">
                                {t("Credentials entered at")}: {formatDate(target.emailReportedAt)}
                              </p>
                            )}
                          </div>
                        </div>
                      )}
                      
                      {/* WhatsApp Status */}
                      {campaign.whatsappConfig.enabled && (
                        <div className="flex items-start gap-3">
                          <MessageSquare className="w-4 h-4 text-green-400 mt-1" />
                          <div>
                            <p className="text-sm text-[var(--dashboard-text-secondary)] dark:text-[var(--medium-grey)]">
                              {target.phoneNumber || t("No phone")}
                            </p>
                            <p className={`text-sm font-medium ${getStatusColor(target.whatsappStatus)}`}>
                              {t(target.whatsappStatus.replace("_", " ").charAt(0).toUpperCase() + target.whatsappStatus.slice(1).replace("_", " "))}
                            </p>
                            {target.whatsappSentAt && (
                              <p className="text-xs text-[var(--dashboard-text-secondary)] dark:text-[var(--medium-grey)] mt-1">
                                {t("Sent")}: {formatDate(target.whatsappSentAt)}
                              </p>
                            )}
                            {target.whatsappReportedAt && (
                              <p className="text-xs text-amber-400 mt-1">
                                {t("Credentials entered at")}: {formatDate(target.whatsappReportedAt)}
                              </p>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {activeTab === "analytics" && (
          <div className="space-y-6">
            {loadingAnalytics ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[var(--neon-blue)] mx-auto mb-4"></div>
                <p className="text-[var(--dashboard-text-secondary)] dark:text-[var(--medium-grey)]">{t("Loading analytics...")}</p>
              </div>
            ) : analytics ? (
              <>
                {/* Email Analytics */}
                {analytics.email.enabled && (
                  <div className="bg-gray-50 dark:bg-[var(--navy-blue)] rounded-lg p-6 border border-blue-500/30">
                    <div className="flex items-center gap-2 mb-6">
                      <Mail className="w-5 h-5 text-blue-400" />
                      <h3 className="text-lg font-semibold text-[var(--dashboard-text-primary)] dark:text-white">{t("Email Analytics")}</h3>
                    </div>
                    
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                      <div className="bg-white dark:bg-[var(--navy-blue-light)] rounded-lg p-4 border border-gray-200 dark:border-transparent">
                        <div className="flex items-center gap-2 mb-2">
                          <Send className="w-4 h-4 text-blue-400" />
                          <span className="text-xs text-[var(--dashboard-text-secondary)] dark:text-[var(--medium-grey)]">{t("Sent")}</span>
                        </div>
                        <p className="text-2xl font-bold text-[var(--dashboard-text-primary)] dark:text-white">{analytics.email.totalSent}</p>
                      </div>
                      
                      <div className="bg-white dark:bg-[var(--navy-blue-light)] rounded-lg p-4 border border-gray-200 dark:border-transparent">
                        <div className="flex items-center gap-2 mb-2">
                          <CheckCircle2 className="w-4 h-4 text-green-400" />
                          <span className="text-xs text-[var(--dashboard-text-secondary)] dark:text-[var(--medium-grey)]">{t("Delivered")}</span>
                        </div>
                        <p className="text-2xl font-bold text-[var(--dashboard-text-primary)] dark:text-white">{analytics.email.totalDelivered}</p>
                      </div>
                      
                      <div className="bg-white dark:bg-[var(--navy-blue-light)] rounded-lg p-4 border border-gray-200 dark:border-transparent">
                        <div className="flex items-center gap-2 mb-2">
                          <Eye className="w-4 h-4 text-purple-400" />
                          <span className="text-xs text-[var(--dashboard-text-secondary)] dark:text-[var(--medium-grey)]">{t("Opened")}</span>
                        </div>
                        <p className="text-2xl font-bold text-[var(--dashboard-text-primary)] dark:text-white">{analytics.email.totalOpened}</p>
                      </div>
                      
                      <div className="bg-white dark:bg-[var(--navy-blue-light)] rounded-lg p-4 border border-gray-200 dark:border-transparent">
                        <div className="flex items-center gap-2 mb-2">
                          <MousePointerClick className="w-4 h-4 text-yellow-400" />
                          <span className="text-xs text-[var(--dashboard-text-secondary)] dark:text-[var(--medium-grey)]">{t("Clicked")}</span>
                        </div>
                        <p className="text-2xl font-bold text-[var(--dashboard-text-primary)] dark:text-white">{analytics.email.totalClicked}</p>
                      </div>
                      
                      <div className="bg-white dark:bg-[var(--navy-blue-light)] rounded-lg p-4 border border-gray-200 dark:border-transparent">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-xs text-[var(--dashboard-text-secondary)] dark:text-[var(--medium-grey)]">{t("Credentials entered")}</span>
                        </div>
                        <p className="text-2xl font-bold text-[var(--dashboard-text-primary)] dark:text-white">{analytics.email.totalReported}</p>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div>
                        <span className="text-sm text-[var(--dashboard-text-secondary)] dark:text-[var(--medium-grey)]">{t("Delivery Rate")}</span>
                        <p className="text-xl font-bold text-[var(--dashboard-text-primary)] dark:text-white">{analytics.email.deliveryRate}%</p>
                      </div>
                      <div>
                        <span className="text-sm text-[var(--dashboard-text-secondary)] dark:text-[var(--medium-grey)]">{t("Open Rate")}</span>
                        <p className="text-xl font-bold text-[var(--dashboard-text-primary)] dark:text-white">{analytics.email.openRate}%</p>
                      </div>
                      <div>
                        <span className="text-sm text-[var(--dashboard-text-secondary)] dark:text-[var(--medium-grey)]">{t("Click Rate")}</span>
                        <p className="text-xl font-bold text-[var(--dashboard-text-primary)] dark:text-white">{analytics.email.clickRate}%</p>
                      </div>
                      <div>
                        <span className="text-sm text-[var(--dashboard-text-secondary)] dark:text-[var(--medium-grey)]">{t("Failed")}</span>
                        <p className="text-xl font-bold text-red-400">{analytics.email.totalFailed}</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* WhatsApp Analytics */}
                {analytics.whatsapp.enabled && (
                  <div className="bg-gray-50 dark:bg-[var(--navy-blue)] rounded-lg p-6 border border-green-500/30">
                    <div className="flex items-center gap-2 mb-6">
                      <MessageSquare className="w-5 h-5 text-green-400" />
                      <h3 className="text-lg font-semibold text-[var(--dashboard-text-primary)] dark:text-white">{t("WhatsApp Analytics")}</h3>
                    </div>
                    
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                      <div className="bg-white dark:bg-[var(--navy-blue-light)] rounded-lg p-4 border border-gray-200 dark:border-transparent">
                        <div className="flex items-center gap-2 mb-2">
                          <Send className="w-4 h-4 text-green-400" />
                          <span className="text-xs text-[var(--dashboard-text-secondary)] dark:text-[var(--medium-grey)]">{t("Sent")}</span>
                        </div>
                        <p className="text-2xl font-bold text-[var(--dashboard-text-primary)] dark:text-white">{analytics.whatsapp.totalSent}</p>
                      </div>
                      
                      <div className="bg-white dark:bg-[var(--navy-blue-light)] rounded-lg p-4 border border-gray-200 dark:border-transparent">
                        <div className="flex items-center gap-2 mb-2">
                          <CheckCircle2 className="w-4 h-4 text-green-400" />
                          <span className="text-xs text-[var(--dashboard-text-secondary)] dark:text-[var(--medium-grey)]">{t("Delivered")}</span>
                        </div>
                        <p className="text-2xl font-bold text-[var(--dashboard-text-primary)] dark:text-white">{analytics.whatsapp.totalDelivered}</p>
                      </div>
                      
                      <div className="bg-white dark:bg-[var(--navy-blue-light)] rounded-lg p-4 border border-gray-200 dark:border-transparent">
                        <div className="flex items-center gap-2 mb-2">
                          <Eye className="w-4 h-4 text-purple-400" />
                          <span className="text-xs text-[var(--dashboard-text-secondary)] dark:text-[var(--medium-grey)]">{t("Read")}</span>
                        </div>
                        <p className="text-2xl font-bold text-[var(--dashboard-text-primary)] dark:text-white">{analytics.whatsapp.totalRead}</p>
                      </div>
                      
                      <div className="bg-white dark:bg-[var(--navy-blue-light)] rounded-lg p-4 border border-gray-200 dark:border-transparent">
                        <div className="flex items-center gap-2 mb-2">
                          <MousePointerClick className="w-4 h-4 text-yellow-400" />
                          <span className="text-xs text-[var(--dashboard-text-secondary)] dark:text-[var(--medium-grey)]">{t("Clicked")}</span>
                        </div>
                        <p className="text-2xl font-bold text-[var(--dashboard-text-primary)] dark:text-white">{analytics.whatsapp.totalClicked}</p>
                      </div>
                      
                      <div className="bg-white dark:bg-[var(--navy-blue-light)] rounded-lg p-4 border border-gray-200 dark:border-transparent">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-xs text-[var(--dashboard-text-secondary)] dark:text-[var(--medium-grey)]">{t("Credentials entered")}</span>
                        </div>
                        <p className="text-2xl font-bold text-[var(--dashboard-text-primary)] dark:text-white">{analytics.whatsapp.totalReported ?? 0}</p>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div>
                        <span className="text-sm text-[var(--dashboard-text-secondary)] dark:text-[var(--medium-grey)]">{t("Delivery Rate")}</span>
                        <p className="text-xl font-bold text-[var(--dashboard-text-primary)] dark:text-white">{analytics.whatsapp.deliveryRate}%</p>
                      </div>
                      <div>
                        <span className="text-sm text-[var(--dashboard-text-secondary)] dark:text-[var(--medium-grey)]">{t("Read Rate")}</span>
                        <p className="text-xl font-bold text-[var(--dashboard-text-primary)] dark:text-white">{analytics.whatsapp.readRate}%</p>
                      </div>
                      <div>
                        <span className="text-sm text-[var(--dashboard-text-secondary)] dark:text-[var(--medium-grey)]">{t("Click Rate")}</span>
                        <p className="text-xl font-bold text-[var(--dashboard-text-primary)] dark:text-white">{analytics.whatsapp.clickRate}%</p>
                      </div>
                      <div>
                        <span className="text-sm text-[var(--dashboard-text-secondary)] dark:text-[var(--medium-grey)]">{t("Report rate")}</span>
                        <p className="text-xl font-bold text-amber-400">{analytics.whatsapp.reportRate ?? 0}%</p>
                      </div>
                      <div>
                        <span className="text-sm text-[var(--dashboard-text-secondary)] dark:text-[var(--medium-grey)]">{t("Failed")}</span>
                        <p className="text-xl font-bold text-red-400">{analytics.whatsapp.totalFailed}</p>
                      </div>
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className="text-center py-12">
                <TrendingUp className="w-16 h-16 text-[var(--dashboard-text-secondary)] dark:text-[var(--medium-grey)] mx-auto mb-4" />
                <p className="text-[var(--dashboard-text-secondary)] dark:text-[var(--medium-grey)]">{t("No analytics available")}</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
