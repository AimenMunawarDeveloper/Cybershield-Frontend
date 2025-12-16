"use client";

import { useState, useEffect, useCallback } from "react";
import {
  MessageSquare,
  Plus,
  Play,
  BarChart3,
  Users,
  Clock,
  AlertTriangle,
  FileText,
  Shield,
  TrendingUp,
  CheckCircle2,
  Send,
  Lock,
} from "lucide-react";
import { useAuth } from "@clerk/nextjs";
import Image from "next/image";
import CreateCampaignModal from "@/components/CreateCampaignModal";
import NetworkBackground from "@/components/NetworkBackground";
import { useTranslation } from "@/hooks/useTranslation";

interface Campaign {
  _id: string;
  name: string;
  description: string;
  status:
    | "draft"
    | "scheduled"
    | "running"
    | "completed"
    | "paused"
    | "cancelled";
  targetUsers: Array<{
    userId: string;
    name: string;
    phoneNumber: string;
    status: string;
  }>;
  stats: {
    totalSent: number;
    totalDelivered: number;
    totalRead: number;
    totalClicked: number;
    totalReported: number;
    totalFailed: number;
  };
  createdAt: string;
  scheduleDate?: string;
}

export default function WhatsAppPhishingPage() {
  const { t, preTranslate, isTranslating, language } = useTranslation();
  const { getToken } = useAuth();
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [templates, setTemplates] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [templatesLoading, setTemplatesLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedTemplatePreview, setSelectedTemplatePreview] = useState<{title: string; content: string} | null>(null);
  const [translationReady, setTranslationReady] = useState(false);

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

      const API_BASE_URL =
        process.env.NEXT_PUBLIC_API_URL || "http://localhost:5001/api";
      const response = await fetch(`${API_BASE_URL}/whatsapp-campaigns`, {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      // Check if response is ok
      if (!response.ok) {
        if (response.status === 401) {
          setError(t("Session expired. Please log in again."));
          localStorage.removeItem("token");
        } else if (response.status === 404) {
          setError(
            t("API endpoint not found. Please check server configuration.")
          );
        } else if (response.status >= 500) {
          setError(t("Server error. Please try again later."));
        } else {
          setError(t(`Request failed with status: ${response.status}`));
        }
        setCampaigns([]);
        setLoading(false);
        return;
      }

      // Check if response is JSON
      const contentType = response.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        setError(
          t("Server returned invalid response format. Please check server logs.")
        );
        setCampaigns([]);
        setLoading(false);
        return;
      }

      const data = await response.json();

      if (data.success && data.data && data.data.campaigns) {
        const campaignsData = data.data.campaigns;
        
        // Pre-translate dynamic campaign data
        if (language === "ur") {
          const dynamicStrings = campaignsData.flatMap((campaign: Campaign) => [
            campaign.name,
            campaign.description,
            campaign.status,
          ]).filter(Boolean);
          
          await preTranslate(dynamicStrings);
        }
        
        setCampaigns(campaignsData);
        setError(null);
      } else {
        setError(t("Invalid response format from server."));
        setCampaigns([]);
      }
    } catch (error) {
      console.error("Failed to fetch campaigns:", error);

      // Handle specific error types
      if (error instanceof SyntaxError) {
        setError(
          t("Server returned invalid JSON. Please check server configuration.")
        );
      } else if (
        error instanceof TypeError &&
        error.message.includes("fetch")
      ) {
        setError(
          t("Unable to connect to server. Please check if the backend is running.")
        );
      } else {
        setError(t("An unexpected error occurred while fetching campaigns."));
      }

      setCampaigns([]);
    } finally {
      setLoading(false);
    }
  }, [getToken]);

  // Pre-translate static strings when language changes
  useEffect(() => {
    const preTranslatePageContent = async () => {
      if (language === "en") {
        setTranslationReady(true);
        return;
      }

      setTranslationReady(false);

      // Collect all static strings on the page
      const staticStrings = [
        // Hero section
        "WhatsApp Phishing Simulation",
        "Create and manage realistic WhatsApp phishing campaigns to test your organization's security awareness.",
        "Realistic Scenarios",
        "Security Training",
        "Safe Testing",
        "New Campaign",
        
        // Features section
        "Phishing Simulation Features",
        "Multi-Vector Phishing Campaigns",
        "Test your users with realistic WhatsApp phishing scenarios including fake prize notifications, verification requests, and urgent messages.",
        "Campaign Management",
        "Track campaign performance, user interactions, and generate detailed reports to measure security awareness improvements.",
        "Why us?",
        "Best platform in the world for Security Awareness Training",
        
        // Templates section
        "Phishing Message Templates",
        "Banking Verification",
        "Simulate banking security alerts and account verification requests to test user awareness of financial phishing attempts.",
        "Financial",
        "Lottery Prize",
        "Test how users respond to prize-winning notifications and lottery scams that request personal information.",
        "Prize",
        "Job Interview",
        "Create realistic job offer messages to evaluate how well users can identify employment-related phishing attempts.",
        "Employment",
        "Package Delivery",
        "Simulate shipping notifications and delivery updates to assess user vigilance against delivery-related phishing scams.",
        "Delivery",
        "View",
        "Use",
        "Use This Template",
        
        // Campaign status
        "Start Now",
        "Start Campaign",
        "Targets",
        "Sent",
        "Delivered",
        "Read",
        "draft",
        "scheduled",
        "running",
        "completed",
        "paused",
        "cancelled",
        
        // Error/loading messages
        "Authentication required. Please log in again.",
        "Session expired. Please log in again.",
        "API endpoint not found. Please check server configuration.",
        "Server error. Please try again later.",
        "Server returned invalid response format. Please check server logs.",
        "Invalid response format from server.",
        "Server returned invalid JSON. Please check server configuration.",
        "Network error. Please check your internet connection.",
        "Loading campaigns...",
        "No campaigns yet",
        "Create your first WhatsApp phishing campaign to get started.",
      ];

      await preTranslate(staticStrings);
      setTranslationReady(true);
    };

    preTranslatePageContent();
  }, [language, preTranslate]);

  const fetchTemplates = useCallback(async () => {
    try {
      setTemplatesLoading(true);
      const token = await getToken();
      if (!token) {
        setTemplates([]);
        setTemplatesLoading(false);
        return;
      }

      const API_BASE_URL =
        process.env.NEXT_PUBLIC_API_URL || "http://localhost:5001/api";
      const response = await fetch(`${API_BASE_URL}/whatsapp-templates`, {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        console.error("Failed to fetch templates:", response.status);
        setTemplates([]);
        setTemplatesLoading(false);
        return;
      }

      const data = await response.json();

      if (data.success && data.data && data.data.templates) {
        const templatesData = data.data.templates;
        
        // Pre-translate template data if needed
        if (language === "ur") {
          const dynamicStrings = templatesData.flatMap((template: any) => [
            template.title,
            template.description,
            template.category,
            template.messageTemplate,
          ]).filter(Boolean);
          
          await preTranslate(dynamicStrings);
        }
        
        setTemplates(templatesData);
      } else {
        setTemplates([]);
      }
    } catch (error) {
      console.error("Failed to fetch templates:", error);
      setTemplates([]);
    } finally {
      setTemplatesLoading(false);
    }
  }, [getToken, language, preTranslate]);

  useEffect(() => {
    fetchCampaigns();
    fetchTemplates();
  }, [fetchCampaigns, fetchTemplates]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "text-green-400";
      case "running":
        return "text-blue-400";
      case "scheduled":
        return "text-yellow-400";
      case "draft":
        return "text-gray-400";
      case "cancelled":
        return "text-red-400";
      default:
        return "text-gray-400";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "running":
        return <Play className="w-4 h-4" />;
      case "scheduled":
        return <Clock className="w-4 h-4" />;
      case "completed":
        return <BarChart3 className="w-4 h-4" />;
      default:
        return <AlertTriangle className="w-4 h-4" />;
    }
  };

  const handleCreateCampaign = async (campaignData: {
    name: string;
    description: string;
    messageTemplate: string;
    landingPageUrl: string;
    targetUserIds: string[];
    manualUsers?: Array<{
      _id: string;
      firstName: string;
      lastName: string;
      phoneNumber: string;
    }>;
    scheduleDate?: string;
  }) => {
    console.log("handleCreateCampaign called with:", campaignData);

    try {
      const token = await getToken();
      if (!token) {
        console.log("No token found");
        setError(t("Authentication required. Please log in again."));
        return;
      }

      console.log("Token found, validating fields...");

      // Validate required fields
      if (
        !campaignData.name ||
        !campaignData.messageTemplate ||
        !campaignData.landingPageUrl
      ) {
        console.log("Missing required fields:", {
          name: !!campaignData.name,
          messageTemplate: !!campaignData.messageTemplate,
          landingPageUrl: !!campaignData.landingPageUrl,
        });
        setError(t("Please fill in all required fields."));
        return;
      }

      if (!campaignData.manualUsers || campaignData.manualUsers.length === 0) {
        console.log("No manual users found:", campaignData.manualUsers);
        setError(t("Please add at least one target user."));
        return;
      }

      console.log("All validations passed, proceeding with API call...");

      const API_BASE_URL =
        process.env.NEXT_PUBLIC_API_URL || "http://localhost:5001/api";

      console.log("Creating campaign with data:", campaignData);
      console.log("API URL:", `${API_BASE_URL}/whatsapp-campaigns`);

      const response = await fetch(`${API_BASE_URL}/whatsapp-campaigns`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          ...campaignData,
        }),
      });

      const responseData = await response.json();
      console.log("Campaign creation response:", responseData);

      if (response.ok && responseData.success) {
        // Refresh campaigns list
        await fetchCampaigns();
        setShowCreateModal(false);
        setError(null);
      } else {
        setError(
          responseData.message || t("Failed to create campaign. Please try again.")
        );
      }
    } catch (error) {
      console.error("Failed to create campaign:", error);
      setError(t("Failed to create campaign. Please try again."));
    }
  };

  const handleStartCampaign = async (campaignId: string) => {
    try {
      const token = await getToken();
      if (!token) {
        setError(t("Authentication required. Please log in again."));
        return;
      }

      const API_BASE_URL =
        process.env.NEXT_PUBLIC_API_URL || "http://localhost:5001/api";

      const response = await fetch(
        `${API_BASE_URL}/whatsapp-campaigns/${campaignId}/start`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const responseData = await response.json();

      if (response.ok && responseData.success) {
        // Refresh campaigns list
        await fetchCampaigns();
        setError(null);
      } else {
        setError(
          responseData.message || t("Failed to start campaign. Please try again.")
        );
      }
    } catch (error) {
      console.error("Failed to start campaign:", error);
      setError(t("Failed to start campaign. Please try again."));
    }
  };

  // Show loading state while translating or fetching data
  if (!translationReady || loading || templatesLoading) {
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
      <div className="flex flex-1 flex-col gap-6 p-6 pt-4 relative">
        <NetworkBackground />
        {/* Blurred background element */}
        <div className="blurred-background"></div>

        {/* Hero Section */}
        <div className="relative py-12 px-4 sm:px-6 lg:px-8 overflow-hidden mb-8">
          <div className="blurred-background"></div>
          
          <div className="max-w-7xl mx-auto relative z-10">
            <div className="text-center space-y-4">
              <div className="flex justify-center mb-4">
                <div className="w-16 h-16 bg-[var(--neon-blue)] rounded-2xl flex items-center justify-center shadow-lg shadow-[var(--neon-blue)]/30">
                  <MessageSquare className="w-8 h-8 text-white" />
              </div>
            </div>

              <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white leading-tight">
                {t("WhatsApp Phishing")}
                <span className="block text-[var(--neon-blue)] mt-1">{t("Awareness Training")}</span>
                </h1>
              
              <p className="text-base md:text-lg text-[var(--light-blue)] max-w-3xl mx-auto leading-relaxed">
                {t("Protect your organization by training users to identify and respond to phishing messages. Use our realistic templates to simulate real-world phishing scenarios and build cybersecurity awareness.")}
              </p>
              
              <div className="flex flex-wrap justify-center gap-3 mt-6">
                <div className="flex items-center gap-2 px-3 py-1.5 bg-[var(--navy-blue-lighter)] rounded-lg border border-[var(--neon-blue)] border-opacity-30 backdrop-blur-sm">
                  <Shield className="w-4 h-4 text-[var(--neon-blue)]" />
                  <span className="text-white text-xs">{t("Realistic Scenarios")}</span>
              </div>
                <div className="flex items-center gap-2 px-3 py-1.5 bg-[var(--navy-blue-lighter)] rounded-lg border border-[var(--neon-blue)] border-opacity-30 backdrop-blur-sm">
                  <AlertTriangle className="w-4 h-4 text-[var(--neon-blue)]" />
                  <span className="text-white text-xs">{t("Security Training")}</span>
                </div>
                <div className="flex items-center gap-2 px-3 py-1.5 bg-[var(--navy-blue-lighter)] rounded-lg border border-[var(--neon-blue)] border-opacity-30 backdrop-blur-sm">
                  <Lock className="w-4 h-4 text-[var(--neon-blue)]" />
                  <span className="text-white text-xs">{t("Safe Testing")}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Phishing Simulation Features */}
        <div className="relative z-10 mb-8">
          <h2 className="text-3xl font-bold text-white text-center mb-8 underline decoration-[var(--neon-blue)]">
            {t("Phishing Simulation Features")}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Template Library */}
            <div
              className="dashboard-card rounded-lg p-6"
              style={{ backgroundColor: "var(--navy-blue-light)" }}
            >
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 bg-[var(--neon-blue)] rounded-lg flex items-center justify-center">
                  <FileText className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-xl font-semibold text-white">
                  {t("Template Library")}
                </h3>
              </div>
              <p className="text-[var(--medium-grey)] text-sm">
                {t("Template library with AI-generated variants for realistic phishing messages and landing pages.")}
              </p>
            </div>
            <div
              className="dashboard-card rounded-lg p-6"
              style={{ backgroundColor: "var(--navy-blue-light)" }}
            >
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 bg-[var(--neon-blue)] rounded-lg flex items-center justify-center">
                  <BarChart3 className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-xl font-semibold text-white">
                  {t("Telemetry Capture")}
                </h3>
              </div>
              <p className="text-[var(--medium-grey)] text-sm">
                {t("Track deliveries, clicks, submissions, call outcomes, and time-to-respond for comprehensive campaign analytics.")}
              </p>
            </div>

            {/* Campaign Scheduling */}
            <div
              className="dashboard-card rounded-lg p-6"
              style={{ backgroundColor: "var(--navy-blue-light)" }}
            >
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 bg-[var(--neon-blue)] rounded-lg flex items-center justify-center">
                  <Clock className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-xl font-semibold text-white">
                  {t("Campaign Scheduling")}
                </h3>
              </div>
              <p className="text-[var(--medium-grey)] text-sm">
                {t("Schedule campaigns according to date and time. Monitor all activities including deliveries, openings, clicks, and data-entry attempts.")}
              </p>
            </div>
          </div>
        </div>

        {/* Multi-Vector Phishing Campaigns */}
        <div className="relative z-10 mb-8">
          <h2 className="text-3xl font-bold text-white text-center mb-8">
            {t("Multi-Vector Phishing Campaigns")}
          </h2>
          <div className="dashboard-card rounded-lg p-6 md:p-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
              <div className="relative h-64 md:h-80 rounded-lg overflow-hidden">
                <Image
                  src="/Images/2.jpg"
                  alt="Multi-Vector Phishing"
                  fill
                  className="object-cover rounded-lg"
                />
              </div>
              <div className="space-y-4">
                <p className="text-white">
                  {t("CyberShield supports multi-vector campaigns including email, WhatsApp/smishing, and browser-based voice/vishing to create comprehensive security awareness training.")}
                </p>
                <ul className="space-y-3 text-white">
                  <li className="flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 text-[var(--neon-blue)] mt-1 flex-shrink-0" />
                    <span>
                      {t("Campaigns are scoped by organizations or groups, ensuring targeted delivery to registered users only.")}
                    </span>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 text-[var(--neon-blue)] mt-1 flex-shrink-0" />
                    <span>
                      {t("Analytics provide per-campaign summaries including submission attempts, time-to-click, and time-to-report metrics.")}
                    </span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* Campaign Management */}
        <div className="relative z-10 mb-8">
          <h2 className="text-3xl font-bold text-white text-center mb-8">
            {t("Campaign Management")}
          </h2>
          <div className="dashboard-card rounded-lg p-6 md:p-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-4 text-white">
                <p>
                  {t("Create and schedule WhatsApp phishing campaigns for targeted groups within your organization. Campaigns track all activities including deliveries, openings, clicks, data-entry attempts, and outcomes.")}
                </p>
                <p>
                  {t("The system limits targets to registered users of authorized organizations/groups only and provides comprehensive analytics for campaign evaluation.")}
                </p>
              </div>
              <div className="space-y-3">
                {[
                  t("Template library with AI-generated variants"),
                  t("Campaign scheduling by date and time"),
                  t("Telemetry capture and analytics"),
                  t("Organization and group scoping"),
                  t("Exportable campaign reports"),
                  t("Landing page creation for information capture"),
                ].map((service, index) => (
                  <div
                    key={index}
                    className="flex items-center gap-3 text-white"
                  >
                    <div className="w-2 h-2 rounded-full bg-[var(--neon-blue)]"></div>
                    <span>{service}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Why Us Section */}
        <div className="relative z-10 mb-8">
          <div className="flex justify-center mb-8">
            <div className="bg-gradient-to-r from-[var(--neon-blue)] to-[var(--electric-blue)] px-8 py-3 rounded-full">
              <h2 className="text-2xl font-bold text-[var(--navy-blue)]">
                {t("Why us?")}
              </h2>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Template Library */}
            <div className="dashboard-card rounded-lg p-6">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-[var(--neon-blue)] rounded-lg flex items-center justify-center flex-shrink-0">
                  <FileText className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-white mb-2">
                    {t("Template Library")}
                  </h3>
                  <p className="text-sm text-[var(--medium-grey)]">
                    {t("AI-generated variants for realistic phishing messages and landing pages")}
                  </p>
                </div>
              </div>
            </div>

            {/* Telemetry Capture */}
            <div className="dashboard-card rounded-lg p-6">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-[var(--electric-blue)] rounded-lg flex items-center justify-center flex-shrink-0">
                  <BarChart3 className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-white mb-2">
                    {t("Telemetry Capture")}
                  </h3>
                  <p className="text-sm text-[var(--medium-grey)]">
                    {t("Track deliveries, clicks, submissions, and time-to-respond metrics")}
                  </p>
                </div>
              </div>
            </div>

            {/* Campaign Analytics */}
            <div className="dashboard-card rounded-lg p-6">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-[var(--success-green)] rounded-lg flex items-center justify-center flex-shrink-0">
                  <TrendingUp className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-white mb-2">
                    {t("Campaign Analytics")}
                  </h3>
                  <p className="text-sm text-[var(--medium-grey)]">
                    {t("Per-campaign summaries with submission attempts and time-to-report data")}
                  </p>
                </div>
              </div>
            </div>

            {/* Organization Scoping */}
            <div className="dashboard-card rounded-lg p-6">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-[var(--purple-blue)] rounded-lg flex items-center justify-center flex-shrink-0">
                  <Shield className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-white mb-2">
                    {t("Organization Scoping")}
                  </h3>
                  <p className="text-sm text-[var(--medium-grey)]">
                    {t("Campaigns scoped by organizations or groups for targeted delivery")}
                  </p>
                </div>
              </div>
            </div>

            {/* Scheduled Campaigns */}
            <div className="dashboard-card rounded-lg p-6">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-[var(--medium-blue)] rounded-lg flex items-center justify-center flex-shrink-0">
                  <Clock className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-white mb-2">
                    {t("Scheduled Campaigns")}
                  </h3>
                  <p className="text-sm text-[var(--medium-grey)]">
                    {t("Schedule campaigns by date and time with automated execution")}
                  </p>
                </div>
              </div>
            </div>

            {/* Exportable Reports */}
            <div className="dashboard-card rounded-lg p-6">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-[var(--neon-blue)] rounded-lg flex items-center justify-center flex-shrink-0">
                  <FileText className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-white mb-2">
                    {t("Exportable Reports")}
                  </h3>
                  <p className="text-sm text-[var(--medium-grey)]">
                    {t("Export campaign data in CSV/PDF formats for audits and reviews")}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Phishing Templates Section */}
        <div className="bg-[var(--navy-blue-light)]/95 backdrop-blur-sm rounded-t-3xl mt-8 min-h-screen ml-4 mr-4 mb-8">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
                {t("Phishing Message Templates")}
              </h2>
              <p className="text-lg text-[var(--medium-grey)] max-w-2xl mx-auto">
                {t("Choose from our collection of realistic phishing templates designed to test and improve your team's security awareness.")}
              </p>
            </div>

            {/* Template Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
              {templates.length === 0 ? (
                <div className="col-span-full text-center py-12">
                  <p className="text-[var(--medium-grey)]">
                    {t("No templates available. Please seed the database first.")}
                  </p>
                </div>
              ) : (
                templates.map((template) => (
                <div
                  key={template._id || template.id}
                  className="group relative bg-gradient-to-br from-[var(--navy-blue-lighter)] to-[var(--navy-blue)] rounded-2xl shadow-xl overflow-hidden border border-[var(--neon-blue)]/20 hover:border-[var(--neon-blue)]/60 transition-all duration-300 hover:scale-[1.03] hover:shadow-2xl hover:shadow-[var(--neon-blue)]/20 flex flex-col"
                >
                  {/* Image with enhanced styling */}
                  <div className="relative h-48 overflow-hidden">
                    <img
                      src={template.image}
                      alt={t(template.title)}
                      className="w-full h-full object-cover transform transition-transform duration-700 group-hover:scale-110"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.src = "https://images.unsplash.com/photo-1563013544-824ae1b704d3?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80";
                      }}
                    />
                    {/* Enhanced gradient overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-[var(--navy-blue)] via-black/40 to-transparent"></div>
                    
                    {/* Category Badge with glow */}
                    <div className="absolute top-4 left-4">
                      <span className="px-3 py-1.5 bg-[var(--neon-blue)] text-white text-xs font-semibold rounded-full shadow-lg shadow-[var(--neon-blue)]/50 backdrop-blur-sm">
                        {t(template.category)}
                      </span>
                    </div>

                    {/* Icon overlay */}
                    <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                      <div className="w-10 h-10 bg-[var(--neon-blue)]/90 backdrop-blur-sm rounded-full flex items-center justify-center shadow-lg">
                        <MessageSquare className="w-5 h-5 text-white" />
                      </div>
                    </div>
                  </div>

                  {/* Content */}
                  <div className="p-6 flex flex-col flex-1">
                    <div className="flex items-start gap-3 mb-3">
                      <div className="w-10 h-10 bg-[var(--neon-blue)]/20 rounded-lg flex items-center justify-center group-hover:bg-[var(--neon-blue)]/30 transition-colors">
                        <MessageSquare className="w-5 h-5 text-[var(--neon-blue)]" />
                      </div>
                      <div className="flex-1">
                        <h3 className="text-xl font-bold text-white mb-1 group-hover:text-[var(--neon-blue)] transition-colors">
                          {t(template.title)}
                        </h3>
                      </div>
                    </div>
                    
                    <p className="text-[var(--medium-grey)] text-sm leading-relaxed mb-6 flex-1">
                      {t(template.description)}
                    </p>

                    {/* Action Buttons */}
                    <div className="w-full mt-auto flex gap-2">
                      <button
                        onClick={() => setSelectedTemplatePreview({ title: template.title, content: template.messageTemplate })}
                        className="flex-1 px-4 py-3 bg-gradient-to-r from-[var(--neon-blue)] to-[var(--medium-blue)] text-white rounded-xl hover:from-[var(--medium-blue)] hover:to-[var(--neon-blue)] transition-all duration-300 text-sm font-semibold shadow-lg shadow-[var(--neon-blue)]/30 hover:shadow-[var(--neon-blue)]/50 transform hover:scale-[1.02] flex items-center justify-center gap-2"
                      >
                        <span>{t("View")}</span>
                        <Send className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => {
                          // Store the selected template for the modal
                          setSelectedTemplatePreview({ title: template.title, content: template.messageTemplate });
                          setShowCreateModal(true);
                        }}
                        className="flex-1 px-4 py-3 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-xl hover:from-green-600 hover:to-green-500 transition-all duration-300 text-sm font-semibold shadow-lg shadow-green-500/30 hover:shadow-green-500/50 transform hover:scale-[1.02] flex items-center justify-center gap-2"
                      >
                        <span>{t("Use")}</span>
                        <MessageSquare className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Animated glow effect on hover */}
                  <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-[var(--neon-blue)]/0 via-[var(--neon-blue)]/10 to-[var(--neon-blue)]/0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"></div>
                </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Page Header */}
        <div className="relative z-10">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-[var(--neon-blue)] rounded-lg flex items-center justify-center">
                <MessageSquare className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white">
                  {t("WhatsApp Phishing Campaigns")}
                </h1>
                <p className="text-[var(--medium-grey)] text-sm">
                  {t("Create and manage phishing awareness campaigns")}
                </p>
              </div>
            </div>
            <button
              onClick={() => setShowCreateModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-[var(--neon-blue)] text-white rounded-lg hover:opacity-90 transition-opacity"
            >
              <Plus className="w-4 h-4" />
              {t("New Campaign")}
            </button>
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <div className="relative z-10">
            <div className="bg-[var(--crimson-red)]/20 border border-[var(--crimson-red)] rounded-lg p-4 text-white">
              <p className="text-sm">{error}</p>
            </div>
          </div>
        )}

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 relative z-10">
          <div className="dashboard-card rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div className="text-left">
                <p className="text-xs text-[var(--medium-grey)]">
                  {t("Total Campaigns")}
                </p>
                <p className="text-lg font-bold text-white">
                  {campaigns.length}
                </p>
              </div>
              <div className="w-10 h-10 bg-[var(--neon-blue)] rounded-lg flex items-center justify-center">
                <MessageSquare className="w-5 h-5 text-white" />
              </div>
            </div>
          </div>

          <div className="dashboard-card rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div className="text-left">
                <p className="text-xs text-[var(--medium-grey)]">
                  {t("Active Campaigns")}
                </p>
                <p className="text-lg font-bold text-white">
                  {campaigns.filter((c) => c.status === "running").length}
                </p>
              </div>
              <div className="w-10 h-10 bg-[var(--neon-blue)] rounded-lg flex items-center justify-center">
                <Play className="w-5 h-5 text-white" />
              </div>
            </div>
          </div>

          <div className="dashboard-card rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div className="text-left">
                <p className="text-xs text-[var(--medium-grey)]">
                  {t("Total Targets")}
                </p>
                <p className="text-lg font-bold text-white">
                  {campaigns.reduce((sum, c) => sum + c.targetUsers.length, 0)}
                </p>
              </div>
              <div className="w-10 h-10 bg-[var(--neon-blue)] rounded-lg flex items-center justify-center">
                <Users className="w-5 h-5 text-white" />
              </div>
            </div>
          </div>

          <div className="dashboard-card rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div className="text-left">
                <p className="text-xs text-[var(--medium-grey)]">{t("Completed")}</p>
                <p className="text-lg font-bold text-white">
                  {campaigns.filter((c) => c.status === "completed").length}
                </p>
              </div>
              <div className="w-10 h-10 bg-[var(--neon-blue)] rounded-lg flex items-center justify-center">
                <BarChart3 className="w-5 h-5 text-white" />
              </div>
            </div>
          </div>
        </div>

        {/* Campaigns List */}
        <div className="relative z-10">
          <div className="dashboard-card rounded-lg p-6">
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-white mb-2">
                {t("Recent Campaigns")}
              </h3>
              <p className="text-sm text-[var(--medium-grey)]">
                {t("Manage your WhatsApp phishing awareness campaigns")}
              </p>
            </div>

            {loading ? (
              <div className="text-center py-8">
                <div className="text-[var(--medium-grey)]">
                  {t("Loading campaigns...")}
                </div>
              </div>
            ) : campaigns.length === 0 ? (
              <div className="text-center py-12">
                <MessageSquare className="w-16 h-16 text-[var(--medium-grey)] mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-white mb-2">
                  {t("No campaigns yet")}
                </h3>
                <p className="text-sm text-[var(--medium-grey)]">
                  {t("WhatsApp phishing campaigns will appear here once they are created")}
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {campaigns.map((campaign) => (
                  <div
                    key={campaign._id}
                    className="bg-[var(--navy-blue-lighter)] rounded-lg p-4"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-[var(--neon-blue)] rounded-full flex items-center justify-center">
                          {getStatusIcon(campaign.status)}
                        </div>
                        <div>
                          <h4 className="text-sm font-semibold text-white">
                            {t(campaign.name)}
                          </h4>
                          <p className="text-xs text-[var(--medium-grey)]">
                            {t(campaign.description)}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span
                          className={`text-xs px-2 py-1 rounded-full ${getStatusColor(
                            campaign.status
                          )}`}
                        >
                          {t(campaign.status)}
                        </span>
                        <button className="p-1 text-[var(--medium-grey)] hover:text-white transition-colors">
                          <svg
                            className="w-4 h-4"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z"
                            />
                          </svg>
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs mb-3">
                      <div>
                        <p className="text-[var(--medium-grey)]">{t("Targets")}</p>
                        <p className="text-white font-semibold">
                          {campaign.targetUsers.length}
                        </p>
                      </div>
                      <div>
                        <p className="text-[var(--medium-grey)]">{t("Sent")}</p>
                        <p className="text-white font-semibold">
                          {campaign.stats.totalSent}
                        </p>
                      </div>
                      <div>
                        <p className="text-[var(--medium-grey)]">{t("Delivered")}</p>
                        <p className="text-white font-semibold">
                          {campaign.stats.totalDelivered}
                        </p>
                      </div>
                      <div>
                        <p className="text-[var(--medium-grey)]">{t("Read")}</p>
                        <p className="text-white font-semibold">
                          {campaign.stats.totalRead}
                        </p>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex justify-end gap-2">
                      {campaign.status === "scheduled" && (
                        <button
                          onClick={() => handleStartCampaign(campaign._id)}
                          className="flex items-center gap-2 px-3 py-1 bg-[var(--neon-blue)] text-white rounded-lg hover:bg-[var(--neon-blue-dark)] transition-colors text-sm"
                        >
                          <Play className="w-3 h-3" />
                          {t("Start Now")}
                        </button>
                      )}
                      {campaign.status === "draft" && (
                        <button
                          onClick={() => handleStartCampaign(campaign._id)}
                          className="flex items-center gap-2 px-3 py-1 bg-[var(--neon-blue)] text-white rounded-lg hover:bg-[var(--neon-blue-dark)] transition-colors text-sm"
                        >
                          <Play className="w-3 h-3" />
                          {t("Start Campaign")}
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Template Preview Modal */}
      {selectedTemplatePreview && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[var(--navy-blue)] rounded-2xl p-6 max-w-2xl w-full border border-[var(--neon-blue)]/30">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-white">{t(selectedTemplatePreview.title)}</h3>
              <button
                onClick={() => setSelectedTemplatePreview(null)}
                className="text-[var(--medium-grey)] hover:text-white transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="bg-[var(--navy-blue-lighter)] rounded-lg p-4 mb-4">
              <p className="text-white whitespace-pre-wrap font-mono text-sm">{t(selectedTemplatePreview.content)}</p>
            </div>
            <button
              onClick={() => {
                setSelectedTemplatePreview(null);
                setShowCreateModal(true);
              }}
              className="w-full px-4 py-3 bg-[var(--neon-blue)] text-white rounded-lg hover:bg-[var(--neon-blue-dark)] transition-colors font-semibold"
            >
              {t("Use This Template")}
            </button>
          </div>
        </div>
      )}

      {/* Create Campaign Modal */}
      <CreateCampaignModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSubmit={handleCreateCampaign}
      />
    </>
  );
}
