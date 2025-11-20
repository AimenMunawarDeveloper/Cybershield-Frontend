"use client";

import { useState } from "react";
import {
  Mail,
  Plus,
  Play,
  Pause,
  BarChart3,
  Users,
  Clock,
  AlertTriangle,
} from "lucide-react";
import CreateEmailCampaignModal from "@/components/CreateEmailCampaignModal";

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
    email: string;
    status: string;
  }>;
  stats: {
    totalSent: number;
    totalDelivered: number;
    totalOpened: number;
    totalClicked: number;
    totalReported: number;
    totalFailed: number;
  };
  createdAt: string;
  scheduleDate?: string;
  subject?: string;
  sentBy?: string;
  sentTo?: string;
}

export default function EmailPhishingPage() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);

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

  const handleCreateCampaign = (campaignData: any) => {
    console.log("handleCreateCampaign called with:", campaignData);

    // Validate required fields
    if (
      !campaignData.subject ||
      !campaignData.bodyContent ||
      !campaignData.sentBy ||
      !campaignData.sentTo
    ) {
      setError("Please fill in all required fields.");
      return;
    }

    // Create new campaign object
    const newCampaign: Campaign = {
      _id: `campaign_${Date.now()}`,
      name: campaignData.subject || "New Email Campaign",
      description: `Email campaign from ${campaignData.sentBy} to ${campaignData.sentTo}`,
      status: "draft",
      subject: campaignData.subject,
      sentBy: campaignData.sentBy,
      sentTo: campaignData.sentTo,
      targetUsers: [
        {
          userId: `user_${Date.now()}`,
          name: campaignData.sentTo.split("@")[0],
          email: campaignData.sentTo,
          status: "pending",
        },
      ],
      stats: {
        totalSent: 0,
        totalDelivered: 0,
        totalOpened: 0,
        totalClicked: 0,
        totalReported: 0,
        totalFailed: 0,
      },
      createdAt: new Date().toISOString(),
    };

    // Add to campaigns list
    setCampaigns((prev) => [newCampaign, ...prev]);
    setShowCreateModal(false);
    setError(null);
  };

  const handleStartCampaign = (campaignId: string) => {
    setCampaigns((prev) =>
      prev.map((campaign) =>
        campaign._id === campaignId
          ? {
              ...campaign,
              status: "running" as const,
              stats: {
                ...campaign.stats,
                totalSent: campaign.targetUsers.length,
                totalDelivered: campaign.targetUsers.length,
              },
            }
          : campaign
      )
    );
    setError(null);
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
                <Mail className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white">
                  Email Phishing Campaigns
                </h1>
                <p className="text-[var(--medium-grey)] text-sm">
                  Create and manage email phishing awareness campaigns
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

        {/* Error Message */}
        {error && (
          <div className="relative z-10 p-4 bg-red-900 bg-opacity-20 border border-red-500 rounded-lg text-red-300 text-sm">
            {error}
          </div>
        )}

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
                <Mail className="w-5 h-5 text-white" />
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
                Manage your email phishing awareness campaigns
              </p>
            </div>

            {campaigns.length === 0 ? (
              <div className="text-center py-12">
                <Mail className="w-16 h-16 text-[var(--medium-grey)] mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-white mb-2">
                  No campaigns yet
                </h3>
                <p className="text-sm text-[var(--medium-grey)]">
                  Email phishing campaigns will appear here once they are
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
                        <p className="text-[var(--medium-grey)]">Opened</p>
                        <p className="text-white font-semibold">
                          {campaign.stats.totalOpened}
                        </p>
                      </div>
                      <div>
                        <p className="text-[var(--medium-grey)]">Clicked</p>
                        <p className="text-white font-semibold">
                          {campaign.stats.totalClicked}
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
      <CreateEmailCampaignModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSubmit={handleCreateCampaign}
      />
    </>
  );
}

