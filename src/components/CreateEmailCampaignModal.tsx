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
  
  const [formData, setFormData] = useState<EmailCampaignData>({
    sentBy: HARDCODED_SENDER_EMAIL,
    sentTo: "",
    subject: "",
    bodyContent: "",
  });
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [selectedUsers, setSelectedUsers] = useState<User[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);


  // Fetch all users from database
  useEffect(() => {
    if (isLoaded && user && isOpen) {
      const fetchUsers = async () => {
        try {
          setLoadingUsers(true);
          const apiClient = new ApiClient(getToken);
          const data = await apiClient.getAllUsers(1, 1000); // Fetch up to 1000 users
          setAllUsers(data.users || []);
        } catch (error) {
          console.error("Error fetching users:", error);
        } finally {
          setLoadingUsers(false);
        }
      };
      fetchUsers();
    }
  }, [isLoaded, user, isOpen, getToken]);

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
      
      // If initialData has sentTo, try to match with users
      if (initialData.sentTo && allUsers.length > 0) {
        const emails = initialData.sentTo.split(",").map((e) => e.trim()).filter(Boolean);
        const matchedUsers = allUsers.filter((user) => emails.includes(user.email));
        if (matchedUsers.length > 0) {
          setSelectedUsers(matchedUsers);
        }
      }
    } else if (!isOpen) {
      setFormData({
        sentBy: HARDCODED_SENDER_EMAIL, // Always use hardcoded email
        sentTo: "",
        subject: "",
        bodyContent: "",
      });
      setSelectedUsers([]);
    }
  }, [isOpen, initialData, allUsers]);

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
      <div className="bg-[var(--navy-blue-light)] rounded-lg p-6 w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-white">{t("Send Email")}</h2>
          <button
            onClick={onClose}
            disabled={isLoading}
            className="p-2 hover:bg-[var(--navy-blue-lighter)] rounded-lg transition-colors disabled:opacity-50"
          >
            <X className="w-5 h-5 text-white" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-white mb-2">
              <Mail className="w-4 h-4 inline mr-2" />
              {t("Sent By")} <span className="text-red-400">*</span>
            </label>
            <input
              type="email"
              value={formData.sentBy}
              readOnly
              className="w-full px-3 py-2 bg-[var(--navy-blue-lighter)] border border-[var(--medium-grey)] rounded-lg text-white placeholder-[var(--medium-grey)] focus:border-[var(--neon-blue)] focus:outline-none opacity-75 cursor-not-allowed"
              required
              disabled={isLoading}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-white mb-2">
              <Mail className="w-4 h-4 inline mr-2" />
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
              className="w-full px-3 py-2 bg-[var(--navy-blue-lighter)] border border-[var(--medium-grey)] rounded-lg text-white placeholder-[var(--medium-grey)] opacity-75 cursor-not-allowed"
              placeholder={selectedUsers.length === 0 ? t("No users selected. Select users from dropdown above.") : ""}
              rows={3}
              required
              disabled={isLoading}
            />
            <p className="text-xs text-[var(--medium-grey)] mt-1">
              💡 {t("Select users from the dropdown above. Selected emails will appear here as comma-separated values.")}
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-white mb-2">
              <FileText className="w-4 h-4 inline mr-2" />
              {t("Subject")} <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              value={formData.subject}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, subject: e.target.value }))
              }
              className="w-full px-3 py-2 bg-[var(--navy-blue-lighter)] border border-[var(--medium-grey)] rounded-lg text-white placeholder-[var(--medium-grey)] focus:border-[var(--neon-blue)] focus:outline-none"
              placeholder={t("Enter email subject")}
              required
              disabled={isLoading}
            />
          </div>

    
          <div>
            <label className="block text-sm font-medium text-white mb-2">
              <FileText className="w-4 h-4 inline mr-2" />
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
              className="w-full px-3 py-2 bg-[var(--navy-blue-lighter)] border border-[var(--medium-grey)] rounded-lg text-white placeholder-[var(--medium-grey)] focus:border-[var(--neon-blue)] focus:outline-none"
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
              className="px-4 py-2 text-[var(--medium-grey)] hover:text-white transition-colors disabled:opacity-50"
            >
              {t("Cancel")}
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="px-6 py-2 bg-[var(--neon-blue)] text-white rounded-lg hover:bg-[var(--neon-blue-dark)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
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
