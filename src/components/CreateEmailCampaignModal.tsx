"use client";

import { useState, useEffect } from "react";
import { X, Mail, FileText } from "lucide-react";
import { useTranslation } from "@/hooks/useTranslation";
import { useUser, useAuth } from "@clerk/nextjs";
import { ApiClient } from "@/lib/api";
import UserSelector from "@/components/UserSelector";

interface CreateEmailCampaignModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (emailData: EmailCampaignData) => Promise<void>;
  isLoading?: boolean;
  initialData?: Partial<EmailCampaignData>;
}

interface EmailCampaignData {
  sentBy: string;
  sentTo: string;
  subject: string;
  bodyContent: string;
}

interface User {
  _id: string;
  email: string;
  displayName: string;
  role?: string;
}

interface UserProfile {
  _id: string;
  orgId?: string;
  role: string;
}

export default function CreateEmailCampaignModal({
  isOpen,
  onClose,
  onSubmit,
  isLoading = false,
  initialData,
}: CreateEmailCampaignModalProps) {
  const { t } = useTranslation();
  const { user, isLoaded } = useUser();
  const { getToken } = useAuth();
  const HARDCODED_SENDER_EMAIL = "cybershieldlearningportal@gmail.com";
  
  // User profile for RBAC
  const [profile, setProfile] = useState<UserProfile | null>(null);
  
  const [formData, setFormData] = useState<EmailCampaignData>({
    sentBy: HARDCODED_SENDER_EMAIL,
    sentTo: "",
    subject: "",
    bodyContent: "",
  });
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [selectedUsers, setSelectedUsers] = useState<User[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);


  // Fetch user profile for RBAC
  useEffect(() => {
    if (isLoaded && user && isOpen) {
      const fetchProfile = async () => {
        try {
          const apiClient = new ApiClient(getToken);
          const profileData = await apiClient.getUserProfile();
          setProfile(profileData);
        } catch (error) {
          console.error("Error fetching profile:", error);
        }
      };
      fetchProfile();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoaded, user, isOpen]);

  // Fetch users from database based on role
  useEffect(() => {
    if (isLoaded && user && isOpen && profile) {
      const fetchUsers = async () => {
        try {
          setLoadingUsers(true);
          const apiClient = new ApiClient(getToken);
          
          if (profile.role === "client_admin" && profile.orgId) {
            // For client admins: fetch users from their organization
            const data = await apiClient.getOrgUsers(profile.orgId, 1, 1000);
            setAllUsers(data.users || []);
          } else if (profile.role === "system_admin") {
            // For system admins: fetch all users and filter for non_affiliated only
            const data = await apiClient.getAllUsers(1, 1000);
            const nonAffiliatedUsers = (data.users || []).filter(
              (user: User) => user.role === "non_affiliated"
            );
            setAllUsers(nonAffiliatedUsers);
          } else {
            // Fallback: empty array for other roles
            setAllUsers([]);
          }
        } catch (error) {
          console.error("Error fetching users:", error);
          setAllUsers([]);
        } finally {
          setLoadingUsers(false);
        }
      };
      fetchUsers();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoaded, user, isOpen, profile]);

  // Sync selected users with textarea (only from dropdown selection)
  useEffect(() => {
    const emailString = selectedUsers.map((u) => u.email).join(",");
    setFormData((prev) => ({
      ...prev,
      sentTo: emailString,
    }));
  }, [selectedUsers]);

  useEffect(() => {
    if (isOpen && initialData) {
      setFormData((prev) => ({
        sentBy: HARDCODED_SENDER_EMAIL, // Always use hardcoded email
        sentTo: initialData.sentTo || prev.sentTo,
        subject: initialData.subject || prev.subject,
        bodyContent: initialData.bodyContent || prev.bodyContent,
      }));
    } else if (!isOpen) {
      setFormData({
        sentBy: HARDCODED_SENDER_EMAIL, // Always use hardcoded email
        sentTo: "",
        subject: "",
        bodyContent: "",
      });
      setSelectedUsers([]);
      setProfile(null);
      setAllUsers([]);
    }
  }, [isOpen, initialData]);

  // Match users when allUsers is loaded and initialData has sentTo
  useEffect(() => {
    if (isOpen && initialData?.sentTo && allUsers.length > 0) {
      const emails = initialData.sentTo.split(",").map((e) => e.trim()).filter(Boolean);
      const matchedUsers = allUsers.filter((user) => emails.includes(user.email));
      if (matchedUsers.length > 0) {
        setSelectedUsers(matchedUsers);
      }
    }
  }, [isOpen, initialData?.sentTo, allUsers]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (isLoading) return;

    if (!formData.sentBy || !formData.sentTo || !formData.subject || !formData.bodyContent) {
      alert(t("Please fill in all required fields."));
      return;
    }

    await onSubmit(formData);
    
    
    setFormData({
      sentBy: HARDCODED_SENDER_EMAIL, // Always use hardcoded email
      sentTo: "",
      subject: "",
      bodyContent: "",
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-[var(--dashboard-card-bg)] dark:bg-[var(--navy-blue-light)] rounded-lg p-6 w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto border border-[var(--dashboard-card-border)] dark:border-transparent">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-[var(--dashboard-text-primary)] dark:text-white">{t("Send Email")}</h2>
          <button
            onClick={onClose}
            disabled={isLoading}
            className="p-2 hover:bg-gray-100 dark:hover:bg-[var(--navy-blue-lighter)] rounded-lg transition-colors disabled:opacity-50"
          >
            <X className="w-5 h-5 text-[var(--dashboard-text-primary)] dark:text-white" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-[var(--dashboard-text-primary)] dark:text-white mb-2">
              <Mail className="w-4 h-4 inline mr-2 text-[var(--dashboard-text-primary)] dark:text-white" />
              {t("Sent By")} <span className="text-red-400">*</span>
            </label>
            <input
              type="email"
              value={formData.sentBy}
              readOnly
              className="w-full px-3 py-2 bg-gray-100 dark:bg-[var(--navy-blue-lighter)] border border-gray-300 dark:border-[var(--medium-grey)] rounded-lg text-[var(--dashboard-text-primary)] dark:text-white placeholder-[var(--dashboard-text-secondary)] dark:placeholder-[var(--medium-grey)] focus:border-[var(--neon-blue)] focus:outline-none opacity-75 cursor-not-allowed"
              required
              disabled={isLoading}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-[var(--dashboard-text-primary)] dark:text-white mb-2">
              <Mail className="w-4 h-4 inline mr-2 text-[var(--dashboard-text-primary)] dark:text-white" />
              {t("Sent To")} <span className="text-red-400">*</span>
            </label>
            
            {/* User Selector Dropdown */}
            <div className="mb-3">
              <UserSelector
                selectedUsers={selectedUsers}
                onUsersChange={setSelectedUsers}
                allUsers={allUsers}
                isLoading={loadingUsers}
                disabled={isLoading}
              />
            </div>

            {/* Read-only Email Display */}
            <textarea
              value={formData.sentTo}
              readOnly
              className="w-full px-3 py-2 bg-gray-100 dark:bg-[var(--navy-blue-lighter)] border border-gray-300 dark:border-[var(--medium-grey)] rounded-lg text-[var(--dashboard-text-primary)] dark:text-white placeholder-[var(--dashboard-text-secondary)] dark:placeholder-[var(--medium-grey)] opacity-75 cursor-not-allowed"
              placeholder={selectedUsers.length === 0 ? t("No users selected. Select users from dropdown above.") : ""}
              rows={3}
              required
              disabled={isLoading}
            />
            <p className="text-xs text-[var(--dashboard-text-secondary)] dark:text-[var(--medium-grey)] mt-1">
              💡 {t("Select users from the dropdown above. Selected emails will appear here as comma-separated values.")}
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-[var(--dashboard-text-primary)] dark:text-white mb-2">
              <FileText className="w-4 h-4 inline mr-2 text-[var(--dashboard-text-primary)] dark:text-white" />
              {t("Subject")} <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              value={formData.subject}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, subject: e.target.value }))
              }
              className="w-full px-3 py-2 bg-white dark:bg-[var(--navy-blue-lighter)] border border-gray-300 dark:border-[var(--medium-grey)] rounded-lg text-[var(--dashboard-text-primary)] dark:text-white placeholder-[var(--dashboard-text-secondary)] dark:placeholder-[var(--medium-grey)] focus:border-[var(--neon-blue)] focus:outline-none"
              placeholder={t("Enter email subject")}
              required
              disabled={isLoading}
            />
          </div>

    
          <div>
            <label className="block text-sm font-medium text-[var(--dashboard-text-primary)] dark:text-white mb-2">
              <FileText className="w-4 h-4 inline mr-2 text-[var(--dashboard-text-primary)] dark:text-white" />
              {t("Body")} <span className="text-red-400">*</span>
            </label>
            <textarea
              value={formData.bodyContent}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  bodyContent: e.target.value,
                }))
              }
              className="w-full px-3 py-2 bg-white dark:bg-[var(--navy-blue-lighter)] border border-gray-300 dark:border-[var(--medium-grey)] rounded-lg text-[var(--dashboard-text-primary)] dark:text-white placeholder-[var(--dashboard-text-secondary)] dark:placeholder-[var(--medium-grey)] focus:border-[var(--neon-blue)] focus:outline-none"
              placeholder={t("Enter email body content")}
              rows={8}
              required
              disabled={isLoading}
            />
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              disabled={isLoading}
              className="px-4 py-2 text-[var(--dashboard-text-secondary)] dark:text-[var(--medium-grey)] hover:text-[var(--dashboard-text-primary)] dark:hover:text-white transition-colors disabled:opacity-50"
            >
              {t("Cancel")}
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="px-6 py-2 bg-[var(--neon-blue)] text-white rounded-lg hover:bg-[var(--medium-blue)] dark:hover:bg-[var(--neon-blue)]/80 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {isLoading ? (
                <>
                  <span className="animate-spin">⏳</span>
                  {t("Sending...")}
                </>
              ) : (
                t("Send Email")
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
