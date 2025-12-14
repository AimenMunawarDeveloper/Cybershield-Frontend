"use client";

import { useState, useEffect } from "react";
import { X, Mail, FileText } from "lucide-react";

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

export default function CreateEmailCampaignModal({
  isOpen,
  onClose,
  onSubmit,
  isLoading = false,
  initialData,
}: CreateEmailCampaignModalProps) {
  const [formData, setFormData] = useState<EmailCampaignData>({
    sentBy: "",
    sentTo: "",
    subject: "",
    bodyContent: "",
  });


  useEffect(() => {
    if (isOpen && initialData) {
      setFormData((prev) => ({
        sentBy: initialData.sentBy || prev.sentBy,
        sentTo: initialData.sentTo || prev.sentTo,
        subject: initialData.subject || prev.subject,
        bodyContent: initialData.bodyContent || prev.bodyContent,
      }));
    } else if (!isOpen) {
 
      setFormData({
        sentBy: "",
        sentTo: "",
        subject: "",
        bodyContent: "",
      });
    }
  }, [isOpen, initialData]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (isLoading) return;

    if (!formData.sentBy || !formData.sentTo || !formData.subject || !formData.bodyContent) {
      alert("Please fill in all required fields.");
      return;
    }

    await onSubmit(formData);
    
    
    setFormData({
      sentBy: "",
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
          <h2 className="text-xl font-bold text-white">Send Email</h2>
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
              Sent By <span className="text-red-400">*</span>
            </label>
            <input
              type="email"
              value={formData.sentBy}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, sentBy: e.target.value }))
              }
              className="w-full px-3 py-2 bg-[var(--navy-blue-lighter)] border border-[var(--medium-grey)] rounded-lg text-white placeholder-[var(--medium-grey)] focus:border-[var(--neon-blue)] focus:outline-none"
              placeholder="sender@example.com"
              required
              disabled={isLoading}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-white mb-2">
              <Mail className="w-4 h-4 inline mr-2" />
              Sent To <span className="text-red-400">*</span>
            </label>
            <textarea
              value={formData.sentTo}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, sentTo: e.target.value }))
              }
              className="w-full px-3 py-2 bg-[var(--navy-blue-lighter)] border border-[var(--medium-grey)] rounded-lg text-white placeholder-[var(--medium-grey)] focus:border-[var(--neon-blue)] focus:outline-none"
              placeholder="recipient@example.com, recipient2@example.com, recipient3@example.com"
              rows={3}
              required
              disabled={isLoading}
            />
            <p className="text-xs text-[var(--medium-grey)] mt-1">
              💡 Separate multiple email addresses with commas for bulk sending
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-white mb-2">
              <FileText className="w-4 h-4 inline mr-2" />
              Subject <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              value={formData.subject}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, subject: e.target.value }))
              }
              className="w-full px-3 py-2 bg-[var(--navy-blue-lighter)] border border-[var(--medium-grey)] rounded-lg text-white placeholder-[var(--medium-grey)] focus:border-[var(--neon-blue)] focus:outline-none"
              placeholder="Enter email subject"
              required
              disabled={isLoading}
            />
          </div>

    
          <div>
            <label className="block text-sm font-medium text-white mb-2">
              <FileText className="w-4 h-4 inline mr-2" />
              Body <span className="text-red-400">*</span>
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
              placeholder="Enter email body content"
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
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="px-6 py-2 bg-[var(--neon-blue)] text-white rounded-lg hover:bg-[var(--neon-blue-dark)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {isLoading ? (
                <>
                  <span className="animate-spin">⏳</span>
                  Sending...
                </>
              ) : (
                "Send Email"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
