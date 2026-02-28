"use client";

import { useState } from "react";
import { X, Mail, FileText, Link } from "lucide-react";
import { useTranslation } from "@/hooks/useTranslation";

interface CustomEmailTemplateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: { title?: string; subject: string; bodyContent: string; linkUrl?: string }) => Promise<void>;
  isLoading?: boolean;
}

export default function CustomEmailTemplateModal({
  isOpen,
  onClose,
  onSubmit,
  isLoading = false,
}: CustomEmailTemplateModalProps) {
  const { t } = useTranslation();
  const [title, setTitle] = useState("");
  const [subject, setSubject] = useState("");
  const [bodyContent, setBodyContent] = useState("");
  const [linkUrl, setLinkUrl] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isLoading) return;
    if (!subject.trim() || !bodyContent.trim()) {
      return;
    }
    await onSubmit({
      title: title.trim() || undefined,
      subject: subject.trim(),
      bodyContent: bodyContent.trim(),
      linkUrl: linkUrl.trim() || undefined,
    });
    setTitle("");
    setSubject("");
    setBodyContent("");
    setLinkUrl("");
  };

  const handleClose = () => {
    if (!isLoading) {
      setTitle("");
      setSubject("");
      setBodyContent("");
      setLinkUrl("");
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-[var(--dashboard-card-bg)] dark:bg-[var(--navy-blue-light)] rounded-lg p-6 w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto border border-[var(--dashboard-card-border)] dark:border-[var(--neon-blue)]/20">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-[var(--dashboard-text-primary)] dark:text-white">{t("Custom Template")}</h2>
          <button
            onClick={handleClose}
            disabled={isLoading}
            className="p-2 hover:bg-gray-100 dark:hover:bg-[var(--navy-blue-lighter)] rounded-lg transition-colors disabled:opacity-50"
          >
            <X className="w-5 h-5 text-[var(--dashboard-text-primary)] dark:text-white" />
          </button>
        </div>

        <p className="text-sm text-[var(--dashboard-text-secondary)] dark:text-[var(--medium-grey)] mb-4">
          {t("Create a custom email phishing template. Add a URL (optional) and the email subject and body. The template will be saved to the list above.")}
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-[var(--dashboard-text-primary)] dark:text-white mb-2">
              {t("Template name")} <span className="text-[var(--dashboard-text-secondary)] dark:text-[var(--medium-grey)]">({t("optional")})</span>
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3 py-2 bg-white dark:bg-[var(--navy-blue-lighter)] border border-gray-300 dark:border-[var(--medium-grey)] rounded-lg text-[var(--dashboard-text-primary)] dark:text-white placeholder-[var(--dashboard-text-secondary)] dark:placeholder-[var(--medium-grey)] focus:border-[var(--neon-blue)] focus:outline-none"
              placeholder={t("e.g. Custom Banking Alert")}
              disabled={isLoading}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-[var(--dashboard-text-primary)] dark:text-white mb-2">
              <Link className="w-4 h-4 inline mr-2 text-[var(--dashboard-text-primary)] dark:text-white" />
              {t("URL")} <span className="text-[var(--dashboard-text-secondary)] dark:text-[var(--medium-grey)]">({t("optional")})</span>
            </label>
            <input
              type="url"
              value={linkUrl}
              onChange={(e) => setLinkUrl(e.target.value)}
              className="w-full px-3 py-2 bg-white dark:bg-[var(--navy-blue-lighter)] border border-gray-300 dark:border-[var(--medium-grey)] rounded-lg text-[var(--dashboard-text-primary)] dark:text-white placeholder-[var(--dashboard-text-secondary)] dark:placeholder-[var(--medium-grey)] focus:border-[var(--neon-blue)] focus:outline-none"
              placeholder="https://example.com/phishing-page"
              disabled={isLoading}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-[var(--dashboard-text-primary)] dark:text-white mb-2">
              <Mail className="w-4 h-4 inline mr-2 text-[var(--dashboard-text-primary)] dark:text-white" />
              {t("Subject")} <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
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
              value={bodyContent}
              onChange={(e) => setBodyContent(e.target.value)}
              className="w-full px-3 py-2 bg-white dark:bg-[var(--navy-blue-lighter)] border border-gray-300 dark:border-[var(--medium-grey)] rounded-lg text-[var(--dashboard-text-primary)] dark:text-white placeholder-[var(--dashboard-text-secondary)] dark:placeholder-[var(--medium-grey)] focus:border-[var(--neon-blue)] focus:outline-none"
              placeholder={t("Enter email body content")}
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
              className="px-4 py-2 text-[var(--dashboard-text-secondary)] dark:text-[var(--medium-grey)] hover:text-[var(--dashboard-text-primary)] dark:hover:text-white transition-colors disabled:opacity-50"
            >
              {t("Cancel")}
            </button>
            <button
              type="submit"
              disabled={isLoading || !subject.trim() || !bodyContent.trim()}
              className="px-6 py-2 bg-[var(--neon-blue)] text-white rounded-lg hover:bg-[var(--medium-blue)] dark:hover:bg-[var(--neon-blue)]/80 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
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
