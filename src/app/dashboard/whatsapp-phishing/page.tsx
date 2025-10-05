"use client";

import { useState, useEffect } from "react";
import {
  MessageSquare,
  Plus,
  Play,
  Pause,
  BarChart3,
  Users,
  Clock,
  AlertTriangle,
} from "lucide-react";
import { useAuth } from "@clerk/nextjs";
import CreateCampaignModal from "@/components/CreateCampaignModal";

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
  const { getToken } = useAuth();
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);

  useEffect(() => {
    fetchCampaigns();
  }, []);

  const fetchCampaigns = async () => {
    try {
      setError(null);
      const token = await getToken();
      if (!token) {
        setError("Authentication required. Please log in again.");
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
          setError("Session expired. Please log in again.");
          localStorage.removeItem("token");
        } else if (response.status === 404) {
          setError(
            "API endpoint not found. Please check server configuration."
          );
        } else if (response.status >= 500) {
          setError("Server error. Please try again later.");
        } else {
          setError(`Request failed with status: ${response.status}`);
        }
        setCampaigns([]);
        setLoading(false);
        return;
      }

      // Check if response is JSON
      const contentType = response.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        setError(
          "Server returned invalid response format. Please check server logs."
        );
        setCampaigns([]);
        setLoading(false);
        return;
      }

      const data = await response.json();

      if (data.success && data.data && data.data.campaigns) {
        setCampaigns(data.data.campaigns);
        setError(null);
      } else {
        setError("Invalid response format from server.");
        setCampaigns([]);
      }
    } catch (error) {
      console.error("Failed to fetch campaigns:", error);

      // Handle specific error types
      if (error instanceof SyntaxError) {
        setError(
          "Server returned invalid JSON. Please check server configuration."
        );
      } else if (
        error instanceof TypeError &&
        error.message.includes("fetch")
      ) {
        setError(
          "Unable to connect to server. Please check if the backend is running."
        );
      } else {
        setError("An unexpected error occurred while fetching campaigns.");
      }

      setCampaigns([]);
    } finally {
      setLoading(false);
    }
  };

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

  const handleCreateCampaign = async (campaignData: any) => {
    console.log("handleCreateCampaign called with:", campaignData);

    try {
      const token = await getToken();
      if (!token) {
        console.log("No token found");
        setError("Authentication required. Please log in again.");
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
        setError("Please fill in all required fields.");
        return;
      }

      if (!campaignData.manualUsers || campaignData.manualUsers.length === 0) {
        console.log("No manual users found:", campaignData.manualUsers);
        setError("Please add at least one target user.");
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
        body: JSON.stringify(campaignData),
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
          responseData.message || "Failed to create campaign. Please try again."
        );
      }
    } catch (error) {
      console.error("Failed to create campaign:", error);
      setError("Failed to create campaign. Please try again.");
    }
  };

  const handleStartCampaign = async (campaignId: string) => {
    try {
      const token = await getToken();
      if (!token) {
        setError("Authentication required. Please log in again.");
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
          responseData.message || "Failed to start campaign. Please try again."
        );
      }
    } catch (error) {
      console.error("Failed to start campaign:", error);
      setError("Failed to start campaign. Please try again.");
    }
  };

  return (
    <>
      <div className="flex flex-1 flex-col gap-6 p-6 pt-4 relative">
        {/* Blurred background element */}
        <div className="blurred-background"></div>

        {/* Page Header */}
        <div className="relative z-10">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-[var(--neon-blue)] rounded-lg flex items-center justify-center">
                <MessageSquare className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white">
                  WhatsApp Phishing Campaigns
                </h1>
                <p className="text-[var(--medium-grey)] text-sm">
                  Create and manage phishing awareness campaigns
                </p>
              </div>
            </div>
            <button
              onClick={() => setShowCreateModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-[var(--neon-blue)] text-white rounded-lg hover:bg-[var(--neon-blue-dark)] transition-colors"
            >
              <Plus className="w-4 h-4" />
              New Campaign
            </button>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 relative z-10">
          <div className="dashboard-card rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div className="text-left">
                <p className="text-xs text-[var(--medium-grey)]">
                  Total Campaigns
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
                  Active Campaigns
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
                  Total Targets
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
                <p className="text-xs text-[var(--medium-grey)]">Completed</p>
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
                Recent Campaigns
              </h3>
              <p className="text-sm text-[var(--medium-grey)]">
                Manage your WhatsApp phishing awareness campaigns
              </p>
            </div>

            {loading ? (
              <div className="text-center py-8">
                <div className="text-[var(--medium-grey)]">
                  Loading campaigns...
                </div>
              </div>
            ) : campaigns.length === 0 ? (
              <div className="text-center py-12">
                <MessageSquare className="w-16 h-16 text-[var(--medium-grey)] mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-white mb-2">
                  No campaigns yet
                </h3>
                <p className="text-sm text-[var(--medium-grey)]">
                  WhatsApp phishing campaigns will appear here once they are
                  created
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
                            {campaign.name}
                          </h4>
                          <p className="text-xs text-[var(--medium-grey)]">
                            {campaign.description}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span
                          className={`text-xs px-2 py-1 rounded-full ${getStatusColor(
                            campaign.status
                          )}`}
                        >
                          {campaign.status}
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
                        <p className="text-[var(--medium-grey)]">Targets</p>
                        <p className="text-white font-semibold">
                          {campaign.targetUsers.length}
                        </p>
                      </div>
                      <div>
                        <p className="text-[var(--medium-grey)]">Sent</p>
                        <p className="text-white font-semibold">
                          {campaign.stats.totalSent}
                        </p>
                      </div>
                      <div>
                        <p className="text-[var(--medium-grey)]">Delivered</p>
                        <p className="text-white font-semibold">
                          {campaign.stats.totalDelivered}
                        </p>
                      </div>
                      <div>
                        <p className="text-[var(--medium-grey)]">Read</p>
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
                          Start Now
                        </button>
                      )}
                      {campaign.status === "draft" && (
                        <button
                          onClick={() => handleStartCampaign(campaign._id)}
                          className="flex items-center gap-2 px-3 py-1 bg-[var(--neon-blue)] text-white rounded-lg hover:bg-[var(--neon-blue-dark)] transition-colors text-sm"
                        >
                          <Play className="w-3 h-3" />
                          Start Campaign
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

      {/* Create Campaign Modal */}
      <CreateCampaignModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSubmit={handleCreateCampaign}
      />
    </>
  );
}
