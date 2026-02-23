"use client";

import { useState } from "react";
import { X, MessageSquare, Link } from "lucide-react";
import { useTranslation } from "@/hooks/useTranslation";

interface CustomWhatsAppTemplateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: { title?: string; messageTemplate: string; landingPageUrl?: string }) => Promise<void>;
  isLoading?: boolean;
}

export default function CustomWhatsAppTemplateModal({
  isOpen,
  onClose,
  onSubmit,
  isLoading = false,
}: CustomWhatsAppTemplateModalProps) {
  const { t } = useTranslation();
  const [title, setTitle] = useState("");
  const [messageTemplate, setMessageTemplate] = useState("");
  const [landingPageUrl, setLandingPageUrl] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isLoading) return;
    if (!messageTemplate.trim()) {
      return;
    }
    await onSubmit({
      title: title.trim() || undefined,
      messageTemplate: messageTemplate.trim(),
      landingPageUrl: landingPageUrl.trim() || undefined,
    });
    setTitle("");
    setMessageTemplate("");
    setLandingPageUrl("");
  };

  const handleClose = () => {
    if (!isLoading) {
      setTitle("");
      setMessageTemplate("");
      setLandingPageUrl("");
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-[var(--navy-blue-light)] rounded-lg p-6 w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto border border-[var(--neon-blue)]/20">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-white">{t("Custom Template")}</h2>
          <button
            onClick={handleClose}
            disabled={isLoading}
            className="p-2 hover:bg-[var(--navy-blue-lighter)] rounded-lg transition-colors disabled:opacity-50"
          >
            <X className="w-5 h-5 text-white" />
          </button>
        </div>

        <p className="text-sm text-[var(--medium-grey)] mb-4">
          {t("Create a custom WhatsApp phishing template. Add a landing page URL (optional) and the message body. The template will be saved to the list above.")}
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-white mb-2">
              {t("Template name")} <span className="text-[var(--medium-grey)]">({t("optional")})</span>
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3 py-2 bg-[var(--navy-blue-lighter)] border border-[var(--medium-grey)] rounded-lg text-white placeholder-[var(--medium-grey)] focus:border-[var(--neon-blue)] focus:outline-none"
              placeholder={t("e.g. Custom Prize Notification")}
              disabled={isLoading}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-white mb-2">
              <Link className="w-4 h-4 inline mr-2" />
              {t("Landing page URL")} <span className="text-[var(--medium-grey)]">({t("optional")})</span>
            </label>
            <input
              type="url"
              value={landingPageUrl}
              onChange={(e) => setLandingPageUrl(e.target.value)}
              className="w-full px-3 py-2 bg-[var(--navy-blue-lighter)] border border-[var(--medium-grey)] rounded-lg text-white placeholder-[var(--medium-grey)] focus:border-[var(--neon-blue)] focus:outline-none"
              placeholder="https://example.com/phishing-page"
              disabled={isLoading}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-white mb-2">
              <MessageSquare className="w-4 h-4 inline mr-2" />
              {t("Message body")} <span className="text-red-400">*</span>
            </label>
            <textarea
              value={messageTemplate}
              onChange={(e) => setMessageTemplate(e.target.value)}
              className="w-full px-3 py-2 bg-[var(--navy-blue-lighter)] border border-[var(--medium-grey)] rounded-lg text-white placeholder-[var(--medium-grey)] focus:border-[var(--neon-blue)] focus:outline-none"
              placeholder={t("Enter the WhatsApp message content")}
              rows={6}
              required
              disabled={isLoading}
            />
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={handleClose}
              disabled={isLoading}
              className="px-4 py-2 text-[var(--medium-grey)] hover:text-white transition-colors disabled:opacity-50"
            >
              {t("Cancel")}
            </button>
            <button
              type="submit"
              disabled={isLoading || !messageTemplate.trim()}
              className="px-6 py-2 bg-[var(--neon-blue)] text-white rounded-lg hover:bg-[var(--neon-blue-dark)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {isLoading ? (
                <>
                  <span className="animate-spin">⏳</span>
                  {t("Saving...")}
                </>
              ) : (
                t("Save Template")
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
