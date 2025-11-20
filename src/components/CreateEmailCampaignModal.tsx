"use client";

import { useState } from "react";
import { X, Mail, FileText, ChevronDown } from "lucide-react";

interface CreateEmailCampaignModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (campaignData: EmailCampaignData) => void;
}

interface EmailCampaignData {
  sentBy: string;
  sentTo: string;
  subject: string;
  bodyContent: string;
  template?: string;
}

export default function CreateEmailCampaignModal({
  isOpen,
  onClose,
  onSubmit,
}: CreateEmailCampaignModalProps) {
  const [formData, setFormData] = useState<EmailCampaignData>({
    sentBy: "",
    sentTo: "",
    subject: "",
    bodyContent: "",
    template: "",
  });

  const templates = [
    { id: "1", name: "Template 1" },
    { id: "2", name: "Template 2" },
    { id: "3", name: "Template 3" },
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    console.log("Email campaign form submitted!");
    console.log("Form data:", formData);

    // Check if form is valid
    if (
      !formData.sentBy ||
      !formData.sentTo ||
      !formData.subject ||
      !formData.bodyContent
    ) {
      alert("Please fill in all required fields.");
      return;
    }

    onSubmit(formData);
    onClose();
    // Reset form
    setFormData({
      sentBy: "",
      sentTo: "",
      subject: "",
      bodyContent: "",
      template: "",
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-[var(--navy-blue-light)] rounded-lg p-6 w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-white">Create New Email Campaign</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-[var(--navy-blue-lighter)] rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-white" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Template Selection */}
          <div>
            <label className="block text-sm font-medium text-white mb-2">
              <FileText className="w-4 h-4 inline mr-2" />
              Choose Template
            </label>
            <div className="relative">
              <select
                value={formData.template}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, template: e.target.value }))
                }
                className="w-full px-3 py-2 bg-[var(--navy-blue-lighter)] border border-[var(--medium-grey)] rounded-lg text-white focus:border-[var(--neon-blue)] focus:outline-none appearance-none pr-10"
              >
                <option value="" className="bg-[var(--navy-blue-lighter)]">
                  Select a template
                </option>
                {templates.map((template) => (
                  <option
                    key={template.id}
                    value={template.id}
                    className="bg-[var(--navy-blue-lighter)]"
                  >
                    {template.name}
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-[var(--medium-grey)] pointer-events-none" />
            </div>
          </div>

          {/* Sent By */}
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
            />
          </div>

          {/* Sent To */}
          <div>
            <label className="block text-sm font-medium text-white mb-2">
              <Mail className="w-4 h-4 inline mr-2" />
              Sent To <span className="text-red-400">*</span>
            </label>
            <input
              type="email"
              value={formData.sentTo}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, sentTo: e.target.value }))
              }
              className="w-full px-3 py-2 bg-[var(--navy-blue-lighter)] border border-[var(--medium-grey)] rounded-lg text-white placeholder-[var(--medium-grey)] focus:border-[var(--neon-blue)] focus:outline-none"
              placeholder="recipient@example.com"
              required
            />
          </div>

          {/* Subject */}
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
            />
          </div>

          {/* Body Content */}
          <div>
            <label className="block text-sm font-medium text-white mb-2">
              <FileText className="w-4 h-4 inline mr-2" />
              Body Content <span className="text-red-400">*</span>
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
            />
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-[var(--medium-grey)] hover:text-white transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-2 bg-[var(--neon-blue)] text-white rounded-lg hover:bg-[var(--neon-blue-dark)] transition-colors"
            >
              Create Campaign
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

