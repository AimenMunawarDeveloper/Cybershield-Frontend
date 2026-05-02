"use client";

import { useState, useEffect, useRef } from "react";
import { AlertTriangle, Shield, FileText, Send, CheckCircle2, XCircle, Mail, MessageSquare, X, Link, Plus, Trash2, Info, Table2 } from "lucide-react";
import { useAuth } from "@clerk/nextjs";
import NetworkBackground from "@/components/NetworkBackground";
import { useTranslation } from "@/hooks/useTranslation";
import IncidentGraph from "./graph";

type MessageType = "email" | "whatsapp";

interface EmailIncidentReport {
  messageType: "email";
  message: string;
  text?: string;
  subject: string;
  from: string;
  urls: string[];
  date: string;
}

interface WhatsAppIncidentReport {
  messageType: "whatsapp";
  message: string;
  urls: string[];
  /** Optional. When received (ISO or datetime-local). Matches training `timestamp`. */
  date?: string;
  /** Optional. Sender phone or name. Matches training `from` / `from_phone`. */
  from?: string;
  /** Optional. Sender phone number (same as `from` for WhatsApp). Backend expects this. */
  from_phone?: string;
  /** Optional. Timestamp (same as `date` for WhatsApp). Backend expects this. */
  timestamp?: string;
}

type IncidentReport = EmailIncidentReport | WhatsAppIncidentReport;

// Helper function to format date for datetime-local input
const getCurrentDateTimeLocal = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  return `${year}-${month}-${day}T${hours}:${minutes}`;
};

// Extract URLs from text
const extractUrls = (text: string): string[] => {
  const urlRegex = /(https?:\/\/[^\s]+|www\.[^\s]+)/gi;
  const matches = text.match(urlRegex) || [];
  return [...new Set(matches.map(url => url.trim()))];
};

// Validate email format
const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

// Validate URL format
const isValidUrl = (url: string): boolean => {
  if (!url.trim()) return true; // Empty is valid (optional field)
  try {
    new URL(url.startsWith('http') ? url : `https://${url}`);
    return true;
  } catch {
    return false;
  }
};

// Email Form Component
interface EmailFormProps {
  formData: Omit<EmailIncidentReport, "messageType">;
  setFormData: React.Dispatch<React.SetStateAction<Omit<EmailIncidentReport, "messageType">>>;
  isLoading: boolean;
  t: (key: string) => string;
  errors?: Record<string, string>;
}

const EmailForm: React.FC<EmailFormProps> = ({
  formData,
  setFormData,
  isLoading,
  t,
  errors = {},
}) => {
  const messageRef = useRef<HTMLTextAreaElement>(null);

  // Auto-extract URLs from message
  useEffect(() => {
    if (formData.message) {
      const extractedUrls = extractUrls(formData.message);
      if (extractedUrls.length > 0 && formData.urls.length === 1 && !formData.urls[0]) {
        setFormData(prev => ({ ...prev, urls: extractedUrls }));
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formData.message]);

  const handleAddUrl = () => {
    setFormData(prev => ({ ...prev, urls: [...prev.urls, ""] }));
  };

  const handleRemoveUrl = (index: number) => {
    setFormData(prev => ({ ...prev, urls: prev.urls.filter((_, i) => i !== index) }));
  };

  const handleUrlChange = (index: number, value: string) => {
    setFormData(prev => ({
      ...prev,
      urls: prev.urls.map((url, i) => (i === index ? value : url))
    }));
  };
  return (
    <div className="relative rounded-2xl border-2 border-gray-300 bg-[var(--dashboard-card-bg)] p-4 shadow-[0_0_40px_rgba(81,176,236,0.3)] backdrop-blur-sm dark:border-[#51b0ec] dark:bg-gradient-to-br dark:from-[var(--navy-blue-lighter)] dark:via-[var(--navy-blue)] dark:to-[var(--navy-blue-lighter)] sm:p-8">
      <div className="pointer-events-none absolute inset-0 rounded-2xl bg-gradient-to-br from-[#51b0ec]/10 via-transparent to-[#4fc3f7]/10"></div>
      <div className="relative z-10 min-w-0">
        <h3 className="mb-6 flex flex-wrap items-center gap-2 text-base font-semibold text-[var(--dashboard-text-primary)] dark:text-white sm:text-lg">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-[#51b0ec] to-[#4fc3f7] flex items-center justify-center shadow-[0_0_20px_rgba(81,176,236,0.6)]">
            <Mail className="w-5 h-5 text-white drop-shadow-[0_0_8px_rgba(255,255,255,0.8)]" />
          </div>
          <span className="bg-gradient-to-r from-[#51b0ec] to-[#4fc3f7] bg-clip-text text-transparent">
            {t("Report an Email Incident")}
          </span>
        </h3>

        {/* Message */}
        <div className="mb-6">
          <label className="block text-sm font-semibold text-[var(--dashboard-text-primary)] dark:text-white mb-3 flex items-center gap-2">
            <FileText className="w-5 h-5 text-[#51b0ec] drop-shadow-[0_0_8px_rgba(81,176,236,0.6)]" />
            {t("Message")} <span className="text-red-400">*</span>
          </label>
          <textarea
            ref={messageRef}
            value={formData.message}
            onChange={(e) => setFormData((prev) => ({ ...prev, message: e.target.value }))}
            className={`w-full px-4 py-3 bg-white dark:bg-[var(--navy-blue)]/80 border-2 rounded-xl text-[var(--dashboard-text-primary)] dark:text-white placeholder-[var(--dashboard-text-secondary)] dark:placeholder-[var(--medium-grey)] focus:outline-none focus:ring-4 focus:ring-[#51b0ec]/20 focus:shadow-[0_0_20px_rgba(81,176,236,0.3)] transition-all duration-300 ${
              errors.message 
                ? "border-red-500/50 focus:border-red-500" 
                : "border-gray-300 dark:border-[#51b0ec]/30 focus:border-[#51b0ec]"
            }`}
            placeholder={t("Enter the full email body")}
            rows={6}
            required
            disabled={isLoading}
          />
          <div className="flex justify-between items-center mt-2">
            <span className="text-xs text-[var(--dashboard-text-secondary)] dark:text-[var(--medium-grey)]">
              {formData.message.length} {t("characters")}
            </span>
            {errors.message && (
              <span className="text-xs text-red-400 flex items-center gap-1">
                <AlertTriangle className="w-3 h-3" />
                {errors.message}
              </span>
            )}
          </div>
        </div>

        {/* Text (Optional) */}
        <div className="mb-6">
          <label className="block text-sm font-semibold text-[var(--dashboard-text-primary)] dark:text-white mb-3 flex items-center gap-2">
            <FileText className="w-5 h-5 text-[#51b0ec] drop-shadow-[0_0_8px_rgba(81,176,236,0.6)]" />
            {t("Text (Optional)")}
          </label>
          <textarea
            value={formData.text}
            onChange={(e) => setFormData((prev) => ({ ...prev, text: e.target.value }))}
            className="w-full px-4 py-3 bg-white dark:bg-[var(--navy-blue)]/80 border-2 border-gray-300 dark:border-[#51b0ec]/30 rounded-xl text-[var(--dashboard-text-primary)] dark:text-white placeholder-[var(--dashboard-text-secondary)] dark:placeholder-[var(--medium-grey)] focus:border-[#51b0ec] focus:outline-none focus:ring-4 focus:ring-[#51b0ec]/20 focus:shadow-[0_0_20px_rgba(81,176,236,0.3)] transition-all duration-300"
            placeholder={t("Same as message, optional")}
            rows={4}
            disabled={isLoading}
          />
        </div>

        {/* Subject and From Row */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          {/* Subject */}
          <div>
            <label className="block text-sm font-semibold text-[var(--dashboard-text-primary)] dark:text-white mb-3 flex items-center gap-2">
              <FileText className="w-5 h-5 text-[#51b0ec] drop-shadow-[0_0_8px_rgba(81,176,236,0.6)]" />
              {t("Subject")} <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              value={formData.subject}
              onChange={(e) => setFormData((prev) => ({ ...prev, subject: e.target.value }))}
              className={`w-full px-4 py-3 bg-white dark:bg-[var(--navy-blue)]/80 border-2 rounded-xl text-[var(--dashboard-text-primary)] dark:text-white placeholder-[var(--dashboard-text-secondary)] dark:placeholder-[var(--medium-grey)] focus:outline-none focus:ring-4 focus:ring-[#51b0ec]/20 focus:shadow-[0_0_20px_rgba(81,176,236,0.3)] transition-all duration-300 ${
                errors.subject 
                  ? "border-red-500/50 focus:border-red-500" 
                  : "border-gray-300 dark:border-[#51b0ec]/30 focus:border-[#51b0ec]"
              }`}
              placeholder={t("Enter email subject")}
              required
              disabled={isLoading}
            />
            {errors.subject && (
              <span className="text-xs text-red-400 flex items-center gap-1 mt-1">
                <AlertTriangle className="w-3 h-3" />
                {errors.subject}
              </span>
            )}
          </div>

          {/* From */}
          <div>
            <label className="block text-sm font-semibold text-[var(--dashboard-text-primary)] dark:text-white mb-3 flex items-center gap-2">
              <Mail className="w-5 h-5 text-[#51b0ec] drop-shadow-[0_0_8px_rgba(81,176,236,0.6)]" />
              {t("From")} <span className="text-red-400">*</span>
            </label>
            <input
              type="email"
              value={formData.from}
              onChange={(e) => setFormData((prev) => ({ ...prev, from: e.target.value }))}
              className={`w-full px-4 py-3 bg-white dark:bg-[var(--navy-blue)]/80 border-2 rounded-xl text-[var(--dashboard-text-primary)] dark:text-white placeholder-[var(--dashboard-text-secondary)] dark:placeholder-[var(--medium-grey)] focus:outline-none focus:ring-4 focus:ring-[#51b0ec]/20 focus:shadow-[0_0_20px_rgba(81,176,236,0.3)] transition-all duration-300 ${
                errors.from 
                  ? "border-red-500/50 focus:border-red-500" 
                  : formData.from && !isValidEmail(formData.from)
                  ? "border-yellow-500/50 focus:border-yellow-500"
                  : "border-gray-300 dark:border-[#51b0ec]/30 focus:border-[#51b0ec]"
              }`}
              placeholder={t("Enter sender email address")}
              required
              disabled={isLoading}
            />
            {errors.from && (
              <span className="text-xs text-red-400 flex items-center gap-1 mt-1">
                <AlertTriangle className="w-3 h-3" />
                {errors.from}
              </span>
            )}
            {formData.from && !isValidEmail(formData.from) && !errors.from && (
              <span className="text-xs text-yellow-400 flex items-center gap-1 mt-1">
                <Info className="w-3 h-3" />
                {t("Please enter a valid email address")}
              </span>
            )}
          </div>
        </div>

        {/* URLs (Optional) */}
        <div className="mb-6">
          <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <label className="flex items-center gap-2 text-sm font-semibold text-[var(--dashboard-text-primary)] dark:text-white">
              <Link className="h-5 w-5 shrink-0 text-[#51b0ec] drop-shadow-[0_0_8px_rgba(81,176,236,0.6)]" />
              {t("URLs")} {formData.urls.length > 0 && <span className="text-xs text-[var(--dashboard-text-secondary)] dark:text-[var(--medium-grey)]">({formData.urls.length})</span>}
            </label>
            <button
              type="button"
              onClick={handleAddUrl}
              className="flex w-full shrink-0 items-center justify-center gap-1 rounded-lg border border-[#51b0ec]/30 bg-[var(--navy-blue)]/50 px-3 py-2 text-xs font-semibold text-[#51b0ec] transition-all duration-300 hover:border-[#51b0ec] hover:bg-[#51b0ec]/20 hover:text-white disabled:opacity-50 sm:w-auto sm:py-1.5"
              disabled={isLoading}
            >
              <Plus className="w-4 h-4" />
              {t("Add URL")}
            </button>
          </div>
          <div className="space-y-3">
            {formData.urls.map((url, index) => (
              <div key={index} className="flex min-w-0 gap-2">
                <input
                  type="url"
                  value={url}
                  onChange={(e) => handleUrlChange(index, e.target.value)}
                  className={`min-w-0 flex-1 rounded-xl border-2 bg-white px-3 py-3 text-[var(--dashboard-text-primary)] placeholder-[var(--dashboard-text-secondary)] transition-all duration-300 focus:shadow-[0_0_20px_rgba(81,176,236,0.3)] focus:outline-none focus:ring-4 focus:ring-[#51b0ec]/20 dark:bg-[var(--navy-blue)]/80 dark:text-white dark:placeholder-[var(--medium-grey)] sm:px-4 ${
                    url && !isValidUrl(url)
                      ? "border-yellow-500/50 focus:border-yellow-500"
                      : "border-gray-300 dark:border-[#51b0ec]/30 focus:border-[#51b0ec]"
                  }`}
                  placeholder={t("Enter URL (optional)")}
                  disabled={isLoading}
                />
                {formData.urls.length > 1 && (
                  <button
                    type="button"
                    onClick={() => handleRemoveUrl(index)}
                    className="px-3 py-3 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-xl border border-red-500/30 hover:border-red-500/50 transition-all duration-300"
                    disabled={isLoading}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            ))}
            {formData.urls.some(url => url && !isValidUrl(url)) && (
              <span className="text-xs text-yellow-400 flex items-center gap-1">
                <Info className="w-3 h-3" />
                {t("Please enter valid URLs (e.g., https://example.com)")}
              </span>
            )}
          </div>
        </div>

        {/* Date */}
        <div className="mb-6">
          <label className="block text-sm font-semibold text-[var(--dashboard-text-primary)] dark:text-white mb-3 flex items-center gap-2">
            <FileText className="w-5 h-5 text-[#51b0ec] drop-shadow-[0_0_8px_rgba(81,176,236,0.6)]" />
            {t("Date")} <span className="text-red-400">*</span>
          </label>
          <input
            type="datetime-local"
            value={formData.date}
            onChange={(e) => setFormData((prev) => ({ ...prev, date: e.target.value }))}
            className="w-full px-4 py-3 bg-white dark:bg-[var(--navy-blue)]/80 border-2 border-gray-300 dark:border-[#51b0ec]/30 rounded-xl text-[var(--dashboard-text-primary)] dark:text-white placeholder-[var(--dashboard-text-secondary)] dark:placeholder-[var(--medium-grey)] focus:border-[#51b0ec] focus:outline-none focus:ring-4 focus:ring-[#51b0ec]/20 focus:shadow-[0_0_20px_rgba(81,176,236,0.3)] transition-all duration-300"
            required
            disabled={isLoading}
          />
        </div>
      </div>
    </div>
  );
};

// WhatsApp Form Component
interface WhatsappFormProps {
  formData: Omit<WhatsAppIncidentReport, "messageType">;
  setFormData: React.Dispatch<React.SetStateAction<Omit<WhatsAppIncidentReport, "messageType">>>;
  isLoading: boolean;
  t: (key: string) => string;
  errors?: Record<string, string>;
}

const WhatsappForm: React.FC<WhatsappFormProps> = ({
  formData,
  setFormData,
  isLoading,
  t,
  errors = {},
}) => {
  // Auto-extract URLs from message
  useEffect(() => {
    if (formData.message) {
      const extractedUrls = extractUrls(formData.message);
      if (extractedUrls.length > 0 && formData.urls.length === 1 && !formData.urls[0]) {
        setFormData(prev => ({ ...prev, urls: extractedUrls }));
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formData.message]);

  const handleAddUrl = () => {
    setFormData(prev => ({ ...prev, urls: [...prev.urls, ""] }));
  };

  const handleRemoveUrl = (index: number) => {
    setFormData(prev => ({ ...prev, urls: prev.urls.filter((_, i) => i !== index) }));
  };

  const handleUrlChange = (index: number, value: string) => {
    setFormData(prev => ({
      ...prev,
      urls: prev.urls.map((url, i) => (i === index ? value : url))
    }));
  };
  return (
    <div className="relative rounded-2xl border-2 border-gray-300 bg-[var(--dashboard-card-bg)] p-4 shadow-[0_0_40px_rgba(37,211,102,0.3)] backdrop-blur-sm dark:border-[#25d366] dark:bg-gradient-to-br dark:from-[var(--navy-blue-lighter)] dark:via-[var(--navy-blue)] dark:to-[var(--navy-blue-lighter)] sm:p-8">
      <div className="pointer-events-none absolute inset-0 rounded-2xl bg-gradient-to-br from-[#25d366]/10 via-transparent to-[#128c7e]/10"></div>
      <div className="relative z-10 min-w-0">
        <h3 className="mb-6 flex flex-wrap items-center gap-2 text-base font-semibold text-[var(--dashboard-text-primary)] dark:text-white sm:text-lg">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-[#25d366] to-[#128c7e] flex items-center justify-center shadow-[0_0_20px_rgba(37,211,102,0.6)]">
            <MessageSquare className="w-5 h-5 text-white drop-shadow-[0_0_8px_rgba(255,255,255,0.8)]" />
          </div>
          <span className="text-[var(--dashboard-text-primary)] dark:text-white">
            {t("Report a WhatsApp Incident")}
          </span>
        </h3>

        {/* Message */}
        <div className="mb-6">
          <label className="block text-sm font-semibold text-[var(--dashboard-text-primary)] dark:text-white mb-3 flex items-center gap-2">
            <FileText className="w-5 h-5 text-[#25d366]" />
            {t("Message")} <span className="text-red-400">*</span>
          </label>
          <textarea
            value={formData.message}
            onChange={(e) => setFormData((prev) => ({ ...prev, message: e.target.value }))}
            className={`w-full px-4 py-3 bg-white dark:bg-[var(--navy-blue)]/80 border-2 rounded-xl text-[var(--dashboard-text-primary)] dark:text-white placeholder-[var(--dashboard-text-secondary)] dark:placeholder-[var(--medium-grey)] focus:outline-none focus:ring-2 focus:ring-[#25d366]/30 transition-all duration-300 ${
              errors.message 
                ? "border-red-500/50 focus:border-red-500" 
                : "border-gray-300 dark:border-[var(--medium-grey)]/30 focus:border-[#25d366]"
            }`}
            placeholder={t("Enter the WhatsApp message content")}
            rows={8}
            required
            disabled={isLoading}
          />
          <div className="flex justify-between items-center mt-2">
            <span className="text-xs text-[var(--dashboard-text-secondary)] dark:text-[var(--medium-grey)]">
              {formData.message.length} {t("characters")}
            </span>
            {errors.message && (
              <span className="text-xs text-red-400 flex items-center gap-1">
                <AlertTriangle className="w-3 h-3" />
                {errors.message}
              </span>
            )}
          </div>
        </div>

        {/* URLs (Optional) */}
        <div className="mb-6">
          <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <label className="flex items-center gap-2 text-sm font-semibold text-[var(--dashboard-text-primary)] dark:text-white">
              <Link className="h-5 w-5 shrink-0 text-[#25d366]" />
              {t("URLs")} {formData.urls.length > 0 && <span className="text-xs text-[var(--dashboard-text-secondary)] dark:text-[var(--medium-grey)]">({formData.urls.length})</span>}
            </label>
            <button
              type="button"
              onClick={handleAddUrl}
              className="flex w-full shrink-0 items-center justify-center gap-1 rounded-lg border border-[#25d366]/30 bg-[var(--navy-blue)]/50 px-3 py-2 text-xs font-semibold text-[#25d366] transition-all duration-300 hover:border-[#25d366] hover:bg-[#25d366]/20 hover:text-white disabled:opacity-50 sm:w-auto sm:py-1.5"
              disabled={isLoading}
            >
              <Plus className="w-4 h-4" />
              {t("Add URL")}
            </button>
          </div>
          <div className="space-y-3">
            {formData.urls.map((url, index) => (
              <div key={index} className="flex min-w-0 gap-2">
                <input
                  type="url"
                  value={url}
                  onChange={(e) => handleUrlChange(index, e.target.value)}
                  className={`min-w-0 flex-1 rounded-xl border-2 bg-white px-3 py-3 text-[var(--dashboard-text-primary)] placeholder-[var(--dashboard-text-secondary)] transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-[#25d366]/30 dark:bg-[var(--navy-blue)]/80 dark:text-white dark:placeholder-[var(--medium-grey)] sm:px-4 ${
                    url && !isValidUrl(url)
                      ? "border-yellow-500/50 focus:border-yellow-500"
                      : "border-gray-300 dark:border-[var(--medium-grey)]/30 focus:border-[#25d366]"
                  }`}
                  placeholder={t("Enter URL (optional)")}
                  disabled={isLoading}
                />
                {formData.urls.length > 1 && (
                  <button
                    type="button"
                    onClick={() => handleRemoveUrl(index)}
                    className="px-3 py-3 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-xl border border-red-500/30 hover:border-red-500/50 transition-all duration-300"
                    disabled={isLoading}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            ))}
            {formData.urls.some(url => url && !isValidUrl(url)) && (
              <span className="text-xs text-yellow-400 flex items-center gap-1">
                <Info className="w-3 h-3" />
                {t("Please enter valid URLs (e.g., https://example.com)")}
              </span>
            )}
          </div>
        </div>

        {/* Sender (Optional) — matches training from / from_phone */}
        <div className="mb-6">
          <label className="block text-sm font-semibold text-[var(--dashboard-text-primary)] dark:text-white mb-3 flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-[#25d366]" />
            {t("Sender (phone or name)")}
          </label>
          <input
            type="text"
            value={formData.from || ""}
            onChange={(e) => setFormData((prev) => ({ ...prev, from: e.target.value }))}
            className="w-full px-4 py-3 bg-white dark:bg-[var(--navy-blue)]/80 border-2 border-gray-300 dark:border-[var(--medium-grey)]/30 rounded-xl text-[var(--dashboard-text-primary)] dark:text-white placeholder-[var(--dashboard-text-secondary)] dark:placeholder-[var(--medium-grey)] focus:border-[#25d366] focus:outline-none focus:ring-2 focus:ring-[#25d366]/30 transition-all duration-300"
            placeholder={t("e.g. +92123456789 or contact name")}
            disabled={isLoading}
          />
        </div>

        {/* Date received (Optional) — matches training timestamp */}
        <div className="mb-6">
          <label className="block text-sm font-semibold text-[var(--dashboard-text-primary)] dark:text-white mb-3 flex items-center gap-2">
            <FileText className="w-5 h-5 text-[#25d366]" />
            {t("Date received")}
          </label>
          <input
            type="datetime-local"
            value={formData.date || ""}
            onChange={(e) => setFormData((prev) => ({ ...prev, date: e.target.value }))}
            className="w-full px-4 py-3 bg-white dark:bg-[var(--navy-blue)]/80 border-2 border-gray-300 dark:border-[var(--medium-grey)]/30 rounded-xl text-[var(--dashboard-text-primary)] dark:text-white placeholder-[var(--dashboard-text-secondary)] dark:placeholder-[var(--medium-grey)] focus:border-[#25d366] focus:outline-none focus:ring-2 focus:ring-[#25d366]/30 transition-all duration-300"
            disabled={isLoading}
          />
        </div>
      </div>
    </div>
  );
};

export default function IncidentReportingPage() {
  const { getToken } = useAuth();
  const { t, preTranslate, language } = useTranslation();
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [translationReady, setTranslationReady] = useState(false);
  const [activeTab, setActiveTab] = useState<MessageType>("email");
  const [showSuccessToast, setShowSuccessToast] = useState(false);
  const [viewMode, setViewMode] = useState<"form" | "table">("form");

  const [emailFormData, setEmailFormData] = useState<Omit<EmailIncidentReport, "messageType">>({
    message: "",
    text: "",
    subject: "",
    from: "",
    urls: [""],
    date: getCurrentDateTimeLocal(),
  });
  const [whatsappFormData, setWhatsappFormData] = useState<Omit<WhatsAppIncidentReport, "messageType">>({
    message: "",
    urls: [""],
    from: "",
    date: "",
  });
  const [lastAnalysis, setLastAnalysis] = useState<{
    is_phishing: boolean;
    phishing_probability: number;
    confidence?: number;
  } | null>(null);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

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
        "Incident Reporting",
        "Report security incidents and suspicious activities to help protect your organization.",
        "Secure Reporting",
        "Quick Response",
        "Confidential",
        
        // Tabs
        "Email",
        "WhatsApp",
        
        // Email form fields
        "Report an Email Incident",
        "Message",
        "Enter the full email body",
        "Text (Optional)",
        "Same as message, optional",
        "Subject",
        "Enter email subject",
        "From",
        "Enter sender email address",
        "URL",
        "Enter URL (optional)",
        "Date",
        "Select incident date",
        
        // WhatsApp form fields
        "Report a WhatsApp Incident",
        "Message",
        "Enter the WhatsApp message content",
        "URL",
        "Enter URL (optional)",
        "Sender (phone or name)",
        "e.g. +92123456789 or contact name",
        "Date received",
        
        // Common
        "Fill out the form below to report a security incident. All fields marked with * are required.",
        "Submit Report",
        "Clear Form",
        "Submitting...",
        
        // Success/Error messages
        "Incident reported successfully!",
        "Failed to submit incident report",
        "Please fill in all required fields.",
        "Congratulations!",
        "Report submitted",
        "You've successfully reported the incident!",
        "This was part of a phishing campaign to test your security awareness.",
        "Got it!",

        // ML result
        "Phishing detected",
        "Not phishing",
        "Phishing probability",
        "Confidence",
        "Result from ML pipeline",
        "Also check browser console for log",
        "characters",
        "Add URL",
        "URLs",
        "Please enter a valid email address",
        "Please enter valid URLs (e.g., https://example.com)",
        "Please fix the errors in the form.",
        "Incident Reports",
        "Visual analytics of your reported incidents",
        "View Reports",
        "Loading incidents...",
        "Total Incidents",
        "Phishing Detected",
        "Safe Messages",
        "Avg Probability",
        "of total",
        "Incidents Over Time",
        "Phishing vs Safe",
        "Incidents by Type",
        "Email vs WhatsApp",
        "Recent Incidents",
        "No incidents found for the selected time range",
        "7 Days",
        "30 Days",
        "90 Days",
        "All Time",
      ];

      await preTranslate(staticStrings);
      setTranslationReady(true);
    };

    preTranslatePageContent();
  }, [language, preTranslate]);


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage(null);
    setFormErrors({});

    let reportData: IncidentReport;
    const errors: Record<string, string> = {};

    if (activeTab === "email") {
      // Validate email fields
      if (!emailFormData.message?.trim()) {
        errors.message = t("Message is required");
      }
      if (!emailFormData.subject?.trim()) {
        errors.subject = t("Subject is required");
      }
      if (!emailFormData.from?.trim()) {
        errors.from = t("Sender email is required");
      } else if (!isValidEmail(emailFormData.from)) {
        errors.from = t("Please enter a valid email address");
      }
      
      // Validate URLs
      emailFormData.urls.forEach((url, index) => {
        if (url && !isValidUrl(url)) {
          errors[`url_${index}`] = t("Invalid URL format");
        }
      });

      if (Object.keys(errors).length > 0) {
        setFormErrors(errors);
        setMessage({ 
          type: "error", 
          text: t("Please fix the errors in the form.") 
        });
        setIsLoading(false);
        return;
      }

      // Convert datetime-local to ISO string for API
      const dateISO = new Date(emailFormData.date).toISOString();
      
      reportData = {
        messageType: "email",
        message: emailFormData.message,
        text: emailFormData.text || emailFormData.message,
        subject: emailFormData.subject,
        from: emailFormData.from,
        urls: emailFormData.urls.filter(url => url.trim() !== ""),
        date: dateISO,
      };
    } else {
      // Validate WhatsApp fields
      if (!whatsappFormData.message?.trim()) {
        errors.message = t("Message is required");
      }
      
      // Validate URLs
      whatsappFormData.urls.forEach((url, index) => {
        if (url && !isValidUrl(url)) {
          errors[`url_${index}`] = t("Invalid URL format");
        }
      });

      if (Object.keys(errors).length > 0) {
        setFormErrors(errors);
        setMessage({ 
          type: "error", 
          text: t("Please fix the errors in the form.") 
        });
        setIsLoading(false);
        return;
      }

      const waUrls = whatsappFormData.urls.filter(url => url.trim() !== "");
      const waDate = whatsappFormData.date
        ? new Date(whatsappFormData.date).toISOString()
        : undefined;
      reportData = {
        messageType: "whatsapp",
        message: whatsappFormData.message,
        urls: waUrls,
        ...(whatsappFormData.from && { from: whatsappFormData.from, from_phone: whatsappFormData.from }),
        ...(waDate && { date: waDate, timestamp: waDate }),
      };
    }

    try {
      const token = await getToken();
      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:5001";

      const headers: HeadersInit = {
        "Content-Type": "application/json",
      };

      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
      }

      const res = await fetch(`${backendUrl}/api/incidents/analyze`, {
        method: "POST",
        headers,
        body: JSON.stringify(reportData),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(data.error || `Request failed: ${res.status}`);
      }

      if (data.success && data.is_phishing != null) {
        setLastAnalysis({
          is_phishing: data.is_phishing === true,
          phishing_probability: data.phishing_probability ?? 0,
          confidence: data.confidence ?? undefined,
        });
      } else {
        setLastAnalysis(null);
      }

      setShowSuccessToast(true);
      setTimeout(() => setShowSuccessToast(false), 5000);

      if (activeTab === "email") {
        setEmailFormData({
          message: "",
          text: "",
          subject: "",
          from: "",
          urls: [""],
          date: getCurrentDateTimeLocal(),
        });
      } else {
        setWhatsappFormData({
          message: "",
          urls: [""],
          from: "",
          date: "",
        });
      }
    } catch (error) {
      console.error("Error submitting incident report:", error);
      setMessage({
        type: "error",
        text: t("Failed to submit incident report. Please try again."),
      });
      setLastAnalysis(null);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClear = () => {
    if (activeTab === "email") {
      setEmailFormData({
        message: "",
        text: "",
        subject: "",
        from: "",
        urls: [""],
        date: getCurrentDateTimeLocal(),
      });
    } else {
      setWhatsappFormData({
        message: "",
        urls: [""],
        from: "",
        date: "",
      });
    }
    setMessage(null);
    setLastAnalysis(null);
    setFormErrors({});
  };


  // Show loading state while translating
  if (!translationReady) {
    return (
      <div className="flex min-h-screen min-w-0 flex-1 items-center justify-center overflow-x-hidden px-4">
        <div className="space-y-4 text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-[var(--neon-blue)] mx-auto"></div>
          <p className="text-[var(--dashboard-text-secondary)] dark:text-[var(--light-blue)] text-lg">
            {language === "ur" ? "لوڈ ہو رہا ہے..." : "Loading..."}
          </p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="relative min-h-screen min-w-0 overflow-x-hidden bg-gradient-to-br from-[var(--navy-blue)] via-[var(--navy-blue-light)] to-[var(--navy-blue)]">
        <NetworkBackground />
        
        {/* Hero Section */}
        <div className="relative overflow-hidden px-3 py-8 sm:px-6 sm:py-12 lg:px-8">
          <div className="blurred-background"></div>
          
          <div className="relative z-10 mx-auto max-w-7xl min-w-0">
            <div className="space-y-4 text-center">
              <div className="mb-4 flex justify-center">
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[var(--neon-blue)] shadow-lg shadow-[var(--neon-blue)]/30">
                  <AlertTriangle className="h-8 w-8 text-white" />
                </div>
              </div>
              
              <h1 className="text-2xl font-bold leading-tight text-[var(--dashboard-text-primary)] dark:text-white sm:text-3xl md:text-4xl lg:text-5xl">
                {t("Incident Reporting")}
              </h1>
              
              <p className="mx-auto max-w-3xl text-base leading-relaxed text-[var(--dashboard-text-secondary)] dark:text-[var(--light-blue)] md:text-lg">
                {t("Report security incidents and suspicious activities to help protect your organization.")}
              </p>
              
              <div className="flex flex-wrap justify-center gap-3 mt-6">
                <div className="flex items-center gap-2 px-3 py-1.5 bg-gray-100 dark:bg-[var(--navy-blue-lighter)] rounded-lg border border-gray-300 dark:border-[var(--neon-blue)] dark:border-opacity-30 backdrop-blur-sm">
                  <Shield className="w-4 h-4 text-[var(--neon-blue)]" />
                  <span className="text-[var(--dashboard-text-primary)] dark:text-white text-xs">{t("Secure Reporting")}</span>
                </div>
                <div className="flex items-center gap-2 px-3 py-1.5 bg-gray-100 dark:bg-[var(--navy-blue-lighter)] rounded-lg border border-gray-300 dark:border-[var(--neon-blue)] dark:border-opacity-30 backdrop-blur-sm">
                  <AlertTriangle className="w-4 h-4 text-[var(--neon-blue)]" />
                  <span className="text-[var(--dashboard-text-primary)] dark:text-white text-xs">{t("Quick Response")}</span>
                </div>
                <div className="flex items-center gap-2 px-3 py-1.5 bg-gray-100 dark:bg-[var(--navy-blue-lighter)] rounded-lg border border-gray-300 dark:border-[var(--neon-blue)] dark:border-opacity-30 backdrop-blur-sm">
                  <FileText className="w-4 h-4 text-[var(--neon-blue)]" />
                  <span className="text-[var(--dashboard-text-primary)] dark:text-white text-xs">{t("Confidential")}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Form Section */}
        <div className="mx-2 mt-6 min-h-screen rounded-t-3xl bg-[var(--dashboard-card-bg)] backdrop-blur-sm dark:bg-[var(--navy-blue-light)]/95 sm:mx-4 lg:mx-6">
          <div className="mx-auto max-w-4xl min-w-0 px-3 py-8 sm:px-6 sm:py-12 lg:px-8">
            <div className="mb-8 text-center">
              <h2 className="mb-3 text-xl font-bold text-[var(--dashboard-text-primary)] dark:text-white sm:mb-4 sm:text-2xl md:text-3xl lg:text-4xl">
                {viewMode === "form" ? t("Report an Incident") : t("Incident Reports")}
              </h2>
              <p className="mx-auto max-w-2xl text-sm text-[var(--dashboard-text-secondary)] dark:text-[var(--medium-grey)] sm:text-base md:text-lg">
                {viewMode === "form" 
                  ? t("Fill out the form below to report a security incident. All fields marked with * are required.")
                  : t("View and manage all reported incidents")
                }
              </p>
            </div>

            {/* View Mode Toggle */}
            <div className="mb-8 flex justify-center px-1">
              <div className="flex w-full max-w-md flex-col gap-2 rounded-xl border border-gray-300 bg-gray-200 p-2 backdrop-blur-md dark:border-[var(--medium-grey)]/20 dark:bg-[var(--navy-blue-lighter)]/50 sm:flex-row sm:gap-3">
                <button
                  type="button"
                  onClick={() => setViewMode("form")}
                  className={`flex min-h-[44px] flex-1 items-center justify-center gap-2 rounded-lg px-4 py-3 text-sm font-semibold transition-all duration-300 sm:px-6 ${
                    viewMode === "form"
                      ? "bg-gradient-to-r from-[#51b0ec] via-[#4fc3f7] to-[#51b0ec] text-white shadow-[0_0_20px_rgba(81,176,236,0.4)]"
                      : "text-[var(--dashboard-text-primary)] dark:text-[var(--medium-grey)] hover:text-[var(--dashboard-text-primary)] dark:hover:text-white hover:bg-gray-300 dark:hover:bg-[var(--navy-blue)]/50"
                  }`}
                >
                  <FileText className="h-5 w-5 shrink-0" />
                  {t("Report")}
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode("table")}
                  className={`flex min-h-[44px] flex-1 items-center justify-center gap-2 rounded-lg px-4 py-3 text-sm font-semibold transition-all duration-300 sm:px-6 ${
                    viewMode === "table"
                      ? "bg-gradient-to-r from-[#51b0ec] via-[#4fc3f7] to-[#51b0ec] text-white shadow-[0_0_20px_rgba(81,176,236,0.4)]"
                      : "text-[var(--dashboard-text-primary)] dark:text-[var(--medium-grey)] hover:text-[var(--dashboard-text-primary)] dark:hover:text-white hover:bg-gray-300 dark:hover:bg-[var(--navy-blue)]/50"
                  }`}
                >
                  <Table2 className="h-5 w-5 shrink-0" />
                  {t("View Reports")}
                </button>
              </div>
            </div>

            {/* Graph View */}
            {viewMode === "table" && (
              <IncidentGraph className="mb-8" />
            )}

            {/* Form View */}
            {viewMode === "form" && (
              <>

            {/* Tabs with Neon Effects */}
            <div className="mb-8 flex flex-col gap-2 rounded-xl border border-gray-300 bg-gray-200 p-2 shadow-2xl backdrop-blur-md dark:border-[var(--medium-grey)] dark:border-opacity-20 dark:bg-[var(--navy-blue-lighter)]/50 sm:flex-row sm:gap-3">
              <button
                type="button"
                onClick={() => setActiveTab("email")}
                className={`group relative flex min-h-[48px] flex-1 items-center justify-center gap-2 overflow-hidden rounded-xl border-2 px-3 py-3 text-sm font-semibold transition-all duration-500 sm:px-4 ${
                  activeTab === "email"
                    ? "border-[#51b0ec] bg-gradient-to-r from-[#51b0ec] via-[#4fc3f7] to-[#51b0ec] text-white shadow-[0_0_30px_rgba(81,176,236,0.6)] sm:scale-105"
                    : "border-transparent text-[var(--dashboard-text-primary)] hover:bg-gray-300 hover:text-[#51b0ec] dark:text-[var(--medium-grey)] dark:hover:bg-[var(--navy-blue)]/50"
                }`}
              >
                <div className={`absolute inset-0 bg-gradient-to-r from-[#51b0ec]/20 to-[#4fc3f7]/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 ${activeTab === "email" ? "opacity-100" : ""}`}></div>
                <Mail className={`w-5 h-5 relative z-10 transition-transform duration-300 ${activeTab === "email" ? "scale-110 drop-shadow-[0_0_10px_rgba(255,255,255,0.8)]" : ""}`} />
                <span className="relative z-10">{t("Email")}</span>
                {activeTab === "email" && (
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer"></div>
                )}
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("whatsapp")}
                className={`group relative flex min-h-[48px] flex-1 items-center justify-center gap-2 overflow-hidden rounded-xl border-2 px-3 py-3 text-sm font-semibold transition-all duration-500 sm:px-4 ${
                  activeTab === "whatsapp"
                    ? "border-[#25d366] bg-gradient-to-r from-[#25d366] via-[#128c7e] to-[#25d366] text-white shadow-[0_0_30px_rgba(37,211,102,0.6)] sm:scale-105"
                    : "border-transparent text-[var(--dashboard-text-primary)] hover:bg-gray-300 hover:text-[#25d366] dark:text-[var(--medium-grey)] dark:hover:bg-[var(--navy-blue)]/50"
                }`}
              >
                <div className={`absolute inset-0 bg-gradient-to-r from-[#25d366]/20 to-[#128c7e]/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 ${activeTab === "whatsapp" ? "opacity-100" : ""}`}></div>
                <MessageSquare className={`w-5 h-5 relative z-10 transition-transform duration-300 ${activeTab === "whatsapp" ? "scale-110 drop-shadow-[0_0_10px_rgba(255,255,255,0.8)]" : ""}`} />
                <span className="relative z-10">{t("WhatsApp")}</span>
                {activeTab === "whatsapp" && (
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer"></div>
                )}
              </button>
            </div>

            {/* Message */}
            {message && (
              <div
                className={`mb-6 rounded-lg p-4 text-sm transition-all duration-300 ${
                  message.type === "success"
                    ? "border border-green-500 bg-green-900 bg-opacity-20 text-green-300"
                    : "border border-red-500 bg-red-900 bg-opacity-20 text-red-300"
                }`}
              >
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex min-w-0 items-start gap-2">
                    {message.type === "success" ? (
                      <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0" />
                    ) : (
                      <XCircle className="mt-0.5 h-5 w-5 shrink-0" />
                    )}
                    <span className="break-words">{message.text}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setMessage(null)}
                    className="shrink-0 self-end hover:opacity-70 sm:self-center"
                  >
                    ×
                  </button>
                </div>
              </div>
            )}

            {/* Form Content with Smooth Transition */}
            <div className="relative min-h-[min(500px,70vh)]">
              <form onSubmit={handleSubmit} className="space-y-6">
                {activeTab === "email" ? (
                  <EmailForm
                    formData={emailFormData}
                    setFormData={setEmailFormData}
                    isLoading={isLoading}
                    t={t}
                    errors={formErrors}
                  />
                ) : (
                  <WhatsappForm
                    formData={whatsappFormData}
                    setFormData={setWhatsappFormData}
                    isLoading={isLoading}
                    t={t}
                    errors={formErrors}
                  />
                )}

                {/* Form Actions */}
                <div className="flex flex-col gap-3 pt-6 sm:flex-row sm:justify-end sm:gap-4">
                  <button
                    type="button"
                    onClick={handleClear}
                    disabled={isLoading}
                    className="min-h-[48px] rounded-xl border-2 border-transparent px-6 py-4 font-semibold text-[var(--dashboard-text-secondary)] transition-all duration-300 hover:border-gray-300 hover:bg-gray-200 hover:text-[var(--dashboard-text-primary)] disabled:opacity-50 dark:text-[var(--medium-grey)] dark:hover:border-[var(--medium-grey)]/30 dark:hover:bg-[var(--navy-blue-lighter)] dark:hover:text-white sm:px-8"
                  >
                    {t("Clear Form")}
                  </button>
                  <button
                    type="submit"
                    disabled={isLoading}
                    className={`flex min-h-[48px] w-full items-center justify-center gap-3 rounded-xl px-6 py-4 font-bold text-white shadow-2xl transition-all duration-300 hover:scale-[1.02] disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:scale-100 sm:w-auto sm:px-8 sm:hover:scale-105 ${
                      activeTab === "email"
                        ? "bg-gradient-to-r from-[#51b0ec] via-[#4fc3f7] to-[#51b0ec] hover:from-[#4fc3f7] hover:via-[#51b0ec] hover:to-[#4fc3f7] shadow-[#51b0ec]/50 hover:shadow-[#51b0ec]/70"
                        : "bg-gradient-to-r from-[#25d366] via-[#128c7e] to-[#25d366] hover:from-[#128c7e] hover:via-[#25d366] hover:to-[#128c7e] shadow-[#25d366]/50 hover:shadow-[#25d366]/70"
                    }`}
                  >
                    {isLoading ? (
                      <>
                        <span className="animate-spin">⏳</span>
                        {t("Submitting...")}
                      </>
                    ) : (
                      <>
                        <Send className="w-5 h-5 drop-shadow-[0_0_8px_rgba(255,255,255,0.8)]" />
                        {t("Submit Report")}
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Success Toast */}
      {showSuccessToast && (
        <div className="fixed left-3 right-3 top-[max(1rem,env(safe-area-inset-top,0px))] z-[101] animate-in fade-in duration-300 sm:left-auto sm:right-4">
          <div className="w-full max-w-md rounded-xl border-2 border-gray-300 bg-[var(--dashboard-card-bg)] p-4 shadow-[0_0_50px_rgba(81,176,236,0.5)] backdrop-blur-sm dark:border-[var(--neon-blue)] dark:bg-gradient-to-br dark:from-[var(--navy-blue-light)] dark:to-[var(--navy-blue)] sm:p-6">
            <div className="flex items-start gap-3 sm:gap-4">
              <div className="min-w-0 flex-1">
                <h3 className="text-xl font-bold text-[var(--dashboard-text-primary)] dark:text-white mb-1 bg-gradient-to-r from-[#51b0ec] to-[#4fc3f7] bg-clip-text text-transparent">
                  {t("Report submitted")}
                </h3>
                
                <p className="text-sm text-[var(--dashboard-text-secondary)] dark:text-[var(--light-blue)] mb-1">
                  {t("You've successfully reported the incident!")}
                </p>

                {lastAnalysis != null && (
                  <div className="mt-3 pt-3 border-t border-gray-300 dark:border-[var(--medium-grey)]/30">
                    <p className={`text-sm font-semibold ${lastAnalysis.is_phishing ? "text-red-400" : "text-green-400"}`}>
                      {lastAnalysis.is_phishing ? t("Phishing detected") : t("Not phishing")}
                    </p>
                    <p className="text-sm text-[var(--dashboard-text-secondary)] dark:text-[var(--light-blue)] mt-0.5">
                      {t("Phishing probability")}: <span className="font-mono font-bold text-[var(--dashboard-text-primary)] dark:text-white">{(lastAnalysis.phishing_probability * 100).toFixed(1)}%</span>
                    </p>
                  </div>
                )}
              </div>
              
              <button
                type="button"
                onClick={() => {
                  setShowSuccessToast(false);
                }}
                className="shrink-0 rounded p-2 text-[var(--dashboard-text-secondary)] transition-colors hover:text-[var(--dashboard-text-primary)] dark:text-[var(--medium-grey)] dark:hover:text-white"
                aria-label={t("Got it!")}
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
