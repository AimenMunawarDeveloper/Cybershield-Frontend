"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Zap,
  Plus,
  Play,
  Pause,
  BarChart3,
  Users,
  Clock,
  AlertTriangle,
  Shield,
  CheckCircle2,
  XCircle,
  Calendar,
  Mail,
  MessageSquare,
  Eye,
  Ban,
  Trash2,
} from "lucide-react";
import { useAuth } from "@clerk/nextjs";
import CreateUnifiedCampaignModal from "@/components/CreateUnifiedCampaignModal";
import CampaignDetailModal from "@/components/CampaignDetailModal";
import NetworkBackground from "@/components/NetworkBackground";
import { useTranslation } from "@/hooks/useTranslation";

interface CampaignTarget {
  userId?: string;
  name: string;
  email?: string;
  phoneNumber?: string;
  emailStatus: string;
  whatsappStatus: string;
}

interface Campaign {
  _id: string;
  name: string;
  description: string;
  status: "draft" | "scheduled" | "running" | "completed" | "paused" | "cancelled";
  whatsappConfig: {
    enabled: boolean;
  };
  emailConfig: {
    enabled: boolean;
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

export default function SimulationsPage() {
  const { t, preTranslate, language } = useTranslation();
  const { getToken } = useAuth();
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedCampaign, setSelectedCampaign] = useState<Campaign | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [translationReady, setTranslationReady] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const fetchCampaigns = useCallback(async () => {
    try {
      setError(null);
      const token = await getToken();
      if (!token) {
        setError(t("Authentication required. Please log in again."));
        setCampaigns([]);
        setLoading(false);
        return;
      }

      const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5001/api";
      const response = await fetch(`${API_BASE_URL}/campaigns`, {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        if (response.status === 401) {
          setError(t("Session expired. Please log in again."));
        } else if (response.status === 404) {
          setError(t("API endpoint not found. Please check server configuration."));
        } else if (response.status >= 500) {
          setError(t("Server error. Please try again later."));
        } else {
          setError(t(`Request failed with status: ${response.status}`));
        }
        setCampaigns([]);
        setLoading(false);
        return;
      }

      const data = await response.json();
      if (data.success && data.data.campaigns) {
        setCampaigns(data.data.campaigns);
      } else {
        setCampaigns([]);
      }
    } catch (err) {
      console.error("Error fetching campaigns:", err);
      setError(t("Failed to load campaigns. Please check your connection."));
      setCampaigns([]);
    } finally {
      setLoading(false);
    }
  }, [getToken, t]);

  // Pre-translate static strings
  useEffect(() => {
    const preTranslatePageContent = async () => {
      if (language === "en") {
        setTranslationReady(true);
        return;
      }

      setTranslationReady(false);

      const staticStrings = [
        "Campaign Simulations",
        "Unified Multi-Channel Security Training",
        "Create and manage comprehensive phishing campaigns across WhatsApp and Email channels simultaneously.",
        "Multi-Channel",
        "Unified Analytics",
        "Smart Scheduling",
        "Create Campaign",
        "All Campaigns",
        "Draft",
        "Scheduled",
        "Running",
        "Completed",
        "Paused",
        "Cancelled",
        "Email",
        "WhatsApp",
        "Both Channels",
        "Targets",
        "Sent",
        "Scheduled",
        "View Details",
        "Start",
        "Pause",
        "Resume",
        "Cancel",
        "Delete",
        "No campaigns yet",
        "Create your first unified campaign to get started",
        "Loading campaigns...",
        "Authentication required. Please log in again.",
        "Failed to load campaigns. Please check your connection.",
        "Campaign started successfully",
        "Campaign paused successfully",
        "Campaign resumed successfully",
        "Campaign cancelled successfully",
        "Campaign deleted successfully",
        "Failed to perform action",
      ];

      await preTranslate(staticStrings);
      setTranslationReady(true);
    };

    preTranslatePageContent();
  }, [language, preTranslate]);

  useEffect(() => {
    fetchCampaigns();
  }, [fetchCampaigns]);

  const handleCampaignAction = async (campaignId: string, action: "start" | "pause" | "resume" | "cancel" | "delete") => {
    try {
      setActionLoading(campaignId);
      const token = await getToken();
      if (!token) {
        setError(t("Authentication required"));
        return;
      }

      const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5001/api";
      let endpoint = `${API_BASE_URL}/campaigns/${campaignId}`;
      let method = "POST";

      if (action === "delete") {
        method = "DELETE";
      } else {
        endpoint += `/${action}`;
      }

      const response = await fetch(endpoint, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setError(null);
        // Show success message
        const messages = {
          start: t("Campaign started successfully"),
          pause: t("Campaign paused successfully"),
          resume: t("Campaign resumed successfully"),
          cancel: t("Campaign cancelled successfully"),
          delete: t("Campaign deleted successfully"),
        };
        
        // Refresh campaigns list
        await fetchCampaigns();
        
        // Close detail modal if open
        if (showDetailModal) {
          setShowDetailModal(false);
          setSelectedCampaign(null);
        }
      } else {
        setError(data.message || t("Failed to perform action"));
      }
    } catch (err) {
      console.error("Error performing action:", err);
      setError(t("Failed to perform action"));
    } finally {
      setActionLoading(null);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "draft":
        return "bg-gray-500/20 text-gray-400 border-gray-500/30";
      case "scheduled":
        return "bg-blue-500/20 text-blue-400 border-blue-500/30";
      case "running":
        return "bg-green-500/20 text-green-400 border-green-500/30";
      case "completed":
        return "bg-[var(--electric-blue)]/20 text-[var(--electric-blue)] border-[var(--electric-blue)]/30";
      case "paused":
        return "bg-yellow-500/20 text-yellow-400 border-yellow-500/30";
      case "cancelled":
        return "bg-red-500/20 text-red-400 border-red-500/30";
      default:
        return "bg-gray-500/20 text-gray-400 border-gray-500/30";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "running":
        return <Play className="w-4 h-4" />;
      case "completed":
        return <CheckCircle2 className="w-4 h-4" />;
      case "paused":
        return <Pause className="w-4 h-4" />;
      case "cancelled":
        return <XCircle className="w-4 h-4" />;
      case "scheduled":
        return <Clock className="w-4 h-4" />;
      default:
        return <AlertTriangle className="w-4 h-4" />;
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

  // Show loading state
  if (!translationReady || loading) {
    return (
      <div className="flex flex-1 items-center justify-center min-h-screen">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-[var(--neon-blue)] mx-auto"></div>
          <p className="text-[var(--light-blue)] text-lg">
            {language === "ur" ? "لوڈ ہو رہا ہے..." : "Loading..."}
          </p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="min-h-screen bg-gradient-to-br from-[var(--navy-blue)] via-[var(--navy-blue-light)] to-[var(--navy-blue)] relative">
        <NetworkBackground />
        {/* Hero Section */}
        <div className="relative py-12 px-4 sm:px-6 lg:px-8 overflow-hidden">
          <div className="blurred-background"></div>
          
          <div className="max-w-7xl mx-auto relative z-10">
            <div className="text-center space-y-4">
              <div className="flex justify-center mb-4">
                <div className="w-16 h-16 bg-[var(--neon-blue)] rounded-2xl flex items-center justify-center shadow-lg shadow-[var(--neon-blue)]/30">
                  <Zap className="w-8 h-8 text-white" />
                </div>
              </div>
              
              <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white leading-tight">
                {t("Campaign Simulations")}
                <span className="block text-[var(--neon-blue)] mt-1">
                  {t("Unified Multi-Channel Security Training")}
                </span>
              </h1>
              
              <p className="text-base md:text-lg text-[var(--light-blue)] max-w-3xl mx-auto leading-relaxed">
                {t("Create and manage comprehensive phishing campaigns across WhatsApp and Email channels simultaneously.")}
              </p>
              
              <div className="flex flex-wrap justify-center gap-3 mt-6">
                <div className="flex items-center gap-2 px-3 py-1.5 bg-[var(--navy-blue-lighter)] rounded-lg border border-[var(--neon-blue)] border-opacity-30 backdrop-blur-sm">
                  <MessageSquare className="w-4 h-4 text-[var(--neon-blue)]" />
                  <span className="text-white text-xs">{t("Multi-Channel")}</span>
                </div>
                <div className="flex items-center gap-2 px-3 py-1.5 bg-[var(--navy-blue-lighter)] rounded-lg border border-[var(--neon-blue)] border-opacity-30 backdrop-blur-sm">
                  <BarChart3 className="w-4 h-4 text-[var(--neon-blue)]" />
                  <span className="text-white text-xs">{t("Unified Analytics")}</span>
                </div>
                <div className="flex items-center gap-2 px-3 py-1.5 bg-[var(--navy-blue-lighter)] rounded-lg border border-[var(--neon-blue)] border-opacity-30 backdrop-blur-sm">
                  <Calendar className="w-4 h-4 text-[var(--neon-blue)]" />
                  <span className="text-white text-xs">{t("Smart Scheduling")}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content Section */}
        <div className="bg-[var(--navy-blue-light)]/95 backdrop-blur-sm rounded-t-3xl mt-8 min-h-screen ml-4 mr-4">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
            {/* Header with Create Button */}
            <div className="flex items-center justify-between mb-8">
              <div>
                <h2 className="text-2xl font-bold text-white">{t("All Campaigns")}</h2>
                <p className="text-[var(--medium-grey)] mt-1">
                  {t("Manage your multi-channel phishing simulations")}
                </p>
              </div>
              <button
                onClick={() => setShowCreateModal(true)}
                className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-[var(--neon-blue)] to-black text-white rounded-xl hover:from-black hover:to-[var(--neon-blue)] transition-all duration-300 shadow-lg shadow-[var(--neon-blue)]/30 hover:shadow-[var(--neon-blue)]/50 transform hover:scale-[1.02]"
              >
                <Plus className="w-5 h-5" />
                {t("Create Campaign")}
              </button>
            </div>

            {/* Error Message */}
            {error && (
              <div className="mb-6 p-4 bg-red-900/20 border border-red-500 rounded-lg text-red-300 flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* Campaigns Grid */}
            {campaigns.length === 0 ? (
              <div className="text-center py-16">
                <div className="w-20 h-20 bg-[var(--neon-blue)]/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Zap className="w-10 h-10 text-[var(--neon-blue)]" />
                </div>
                <h3 className="text-xl font-semibold text-white mb-2">
                  {t("No campaigns yet")}
                </h3>
                <p className="text-[var(--medium-grey)] mb-6">
                  {t("Create your first unified campaign to get started")}
                </p>
                <button
                  onClick={() => setShowCreateModal(true)}
                  className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-[var(--neon-blue)] to-black text-white rounded-xl hover:from-black hover:to-[var(--neon-blue)] transition-all duration-300 shadow-lg shadow-[var(--neon-blue)]/30 hover:shadow-[var(--neon-blue)]/50 transform hover:scale-[1.02]"
                >
                  <Plus className="w-5 h-5" />
                  {t("Create Campaign")}
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {campaigns.map((campaign) => (
                  <div
                    key={campaign._id}
                    className="group relative bg-gradient-to-br from-[var(--navy-blue-lighter)] to-[var(--navy-blue)] rounded-2xl shadow-xl overflow-hidden border border-[var(--neon-blue)]/20 hover:border-[var(--neon-blue)]/60 transition-all duration-300 hover:scale-[1.03] hover:shadow-2xl hover:shadow-[var(--neon-blue)]/20 flex flex-col"
                  >
                    {/* Campaign Header */}
                    <div className="p-6 flex flex-col flex-1">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex-1">
                          <h3 className="text-xl font-bold text-white mb-1 group-hover:text-[var(--neon-blue)] transition-colors">
                            {campaign.name}
                          </h3>
                          <p className="text-sm text-[var(--medium-grey)] line-clamp-2">
                            {campaign.description}
                          </p>
                        </div>
                        <div className={`px-3 py-1 rounded-full text-xs font-semibold border flex items-center gap-1 ${getStatusColor(campaign.status)}`}>
                          {getStatusIcon(campaign.status)}
                          {t(campaign.status.charAt(0).toUpperCase() + campaign.status.slice(1))}
                        </div>
                      </div>

                      {/* Channel Badges */}
                      <div className="flex gap-2 mb-4">
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
                        {campaign.emailConfig.enabled && campaign.whatsappConfig.enabled && (
                          <div className="flex items-center gap-1 px-3 py-1 bg-[var(--electric-blue)]/20 text-[var(--electric-blue)] rounded-lg text-xs border border-[var(--electric-blue)]/30">
                            <Zap className="w-3 h-3" />
                            {t("Both Channels")}
                          </div>
                        )}
                      </div>

                      {/* Stats */}
                      <div className="grid grid-cols-2 gap-4 mb-4">
                        <div className="bg-[var(--navy-blue)] rounded-lg p-3">
                          <div className="flex items-center gap-2 mb-1">
                            <Users className="w-4 h-4 text-[var(--neon-blue)]" />
                            <span className="text-xs text-[var(--medium-grey)]">{t("Targets")}</span>
                          </div>
                          <p className="text-xl font-bold text-white">
                            {campaign.targetUsers.length}
                          </p>
                        </div>
                        <div className="bg-[var(--navy-blue)] rounded-lg p-3">
                          <div className="flex items-center gap-2 mb-1">
                            <CheckCircle2 className="w-4 h-4 text-green-400" />
                            <span className="text-xs text-[var(--medium-grey)]">{t("Sent")}</span>
                          </div>
                          <p className="text-xl font-bold text-white">
                            {(campaign.stats.totalEmailSent || 0) + (campaign.stats.totalWhatsappSent || 0)}
                          </p>
                        </div>
                      </div>

                      {/* Dates */}
                      {campaign.scheduleDate && (
                        <div className="flex items-center gap-2 text-xs text-[var(--medium-grey)] mb-4">
                          <Clock className="w-3 h-3" />
                          <span>{t("Scheduled")}: {formatDate(campaign.scheduleDate)}</span>
                        </div>
                      )}

                      {/* Action Buttons */}
                      <div className="w-full mt-auto flex gap-2 flex-wrap">
                        <button
                          onClick={() => {
                            setSelectedCampaign(campaign);
                            setShowDetailModal(true);
                          }}
                          className="flex-1 px-4 py-3 bg-gradient-to-r from-[var(--neon-blue)] to-[var(--medium-blue)] text-white rounded-xl hover:from-[var(--medium-blue)] hover:to-[var(--neon-blue)] transition-all duration-300 text-sm font-semibold shadow-lg shadow-[var(--neon-blue)]/30 hover:shadow-[var(--neon-blue)]/50 transform hover:scale-[1.02] flex items-center justify-center gap-2"
                        >
                          <Eye className="w-4 h-4" />
                          {t("View Details")}
                        </button>

                        {campaign.status === "draft" || campaign.status === "scheduled" ? (
                          <>
                            <button
                              onClick={() => handleCampaignAction(campaign._id, "start")}
                              disabled={actionLoading === campaign._id}
                              className="px-4 py-3 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-xl hover:from-green-600 hover:to-green-500 transition-all duration-300 text-sm font-semibold shadow-lg shadow-green-500/30 hover:shadow-green-500/50 transform hover:scale-[1.02] flex items-center justify-center gap-2 disabled:opacity-50"
                            >
                              <Play className="w-4 h-4" />
                              {t("Start")}
                            </button>
                            <button
                              onClick={() => handleCampaignAction(campaign._id, "delete")}
                              disabled={actionLoading === campaign._id}
                              className="px-4 py-3 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-xl hover:from-red-600 hover:to-red-500 transition-all duration-300 text-sm font-semibold shadow-lg shadow-red-500/30 hover:shadow-red-500/50 transform hover:scale-[1.02] flex items-center justify-center gap-2 disabled:opacity-50"
                            >
                              <Trash2 className="w-4 h-4" />
                              {t("Delete")}
                            </button>
                          </>
                        ) : campaign.status === "running" ? (
                          <>
                            <button
                              onClick={() => handleCampaignAction(campaign._id, "pause")}
                              disabled={actionLoading === campaign._id}
                              className="px-4 py-3 bg-gradient-to-r from-yellow-500 to-yellow-600 text-white rounded-xl hover:from-yellow-600 hover:to-yellow-500 transition-all duration-300 text-sm font-semibold shadow-lg shadow-yellow-500/30 hover:shadow-yellow-500/50 transform hover:scale-[1.02] flex items-center justify-center gap-2 disabled:opacity-50"
                            >
                              <Pause className="w-4 h-4" />
                              {t("Pause")}
                            </button>
                            <button
                              onClick={() => handleCampaignAction(campaign._id, "cancel")}
                              disabled={actionLoading === campaign._id}
                              className="px-4 py-3 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-xl hover:from-red-600 hover:to-red-500 transition-all duration-300 text-sm font-semibold shadow-lg shadow-red-500/30 hover:shadow-red-500/50 transform hover:scale-[1.02] flex items-center justify-center gap-2 disabled:opacity-50"
                            >
                              <Ban className="w-4 h-4" />
                              {t("Cancel")}
                            </button>
                          </>
                        ) : campaign.status === "paused" ? (
                          <>
                            <button
                              onClick={() => handleCampaignAction(campaign._id, "resume")}
                              disabled={actionLoading === campaign._id}
                              className="px-4 py-3 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-xl hover:from-green-600 hover:to-green-500 transition-all duration-300 text-sm font-semibold shadow-lg shadow-green-500/30 hover:shadow-green-500/50 transform hover:scale-[1.02] flex items-center justify-center gap-2 disabled:opacity-50"
                            >
                              <Play className="w-4 h-4" />
                              {t("Resume")}
                            </button>
                            <button
                              onClick={() => handleCampaignAction(campaign._id, "cancel")}
                              disabled={actionLoading === campaign._id}
                              className="px-4 py-3 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-xl hover:from-red-600 hover:to-red-500 transition-all duration-300 text-sm font-semibold shadow-lg shadow-red-500/30 hover:shadow-red-500/50 transform hover:scale-[1.02] flex items-center justify-center gap-2 disabled:opacity-50"
                            >
                              <Ban className="w-4 h-4" />
                              {t("Cancel")}
                            </button>
                          </>
                        ) : null}
                      </div>
                    </div>

                    {/* Animated glow effect on hover */}
                    <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-[var(--neon-blue)]/0 via-[var(--neon-blue)]/10 to-[var(--neon-blue)]/0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"></div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Create Campaign Modal */}
      <CreateUnifiedCampaignModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSuccess={() => {
          setShowCreateModal(false);
          fetchCampaigns();
        }}
      />

      {/* Campaign Detail Modal */}
      {selectedCampaign && (
        <CampaignDetailModal
          isOpen={showDetailModal}
          onClose={() => {
            setShowDetailModal(false);
            setSelectedCampaign(null);
          }}
          campaign={selectedCampaign}
          onRefresh={fetchCampaigns}
        />
      )}
    </>
  );
}
