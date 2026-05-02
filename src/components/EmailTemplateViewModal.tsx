"use client";

import { X, Mail, Inbox, Send, Trash2, AlertCircle, Folder, Star, Archive, ChevronDown, User } from "lucide-react";
import { useTranslation } from "@/hooks/useTranslation";

interface EmailTemplateData {
  sentBy?: string;
  sentTo?: string;
  subject: string;
  bodyContent: string;
}

interface EmailTemplateViewModalProps {
  isOpen: boolean;
  onClose: () => void;
  templateTitle: string;
  emailTemplate: EmailTemplateData;
}

export default function EmailTemplateViewModal({
  isOpen,
  onClose,
  templateTitle,
  emailTemplate,
}: EmailTemplateViewModalProps) {
  const { t } = useTranslation();
  
  if (!isOpen) return null;

  const sidebarItems = [
    { icon: Inbox, label: t("Inbox"), active: true },
    { icon: Star, label: t("Starred"), active: false },
    { icon: Send, label: t("Sent"), active: false },
    { icon: Archive, label: t("Archive"), active: false },
    { icon: Trash2, label: t("Trash"), active: false },
    { icon: AlertCircle, label: t("Spam"), active: false },
    { icon: Folder, label: t("Drafts"), active: false },
  ];

  // Parse email to extract display name and email address
  const parseEmail = (emailString?: string) => {
    if (!emailString) return null;
    
    // Check if email is in format "Display Name <email@domain.com>"
    const match = emailString.match(/^(.+?)\s*<(.+?)>$/);
    if (match) {
      return {
        displayName: match[1].trim(),
        email: match[2].trim()
      };
    }
    
    // If it's just an email address
    return {
      displayName: null,
      email: emailString.trim()
    };
  };

  const fromData = parseEmail(emailTemplate.sentBy);
  const toData = parseEmail(emailTemplate.sentTo);

  return (
    <div 
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 p-0 sm:items-center sm:p-4"
      onClick={onClose}
    >
      <div 
        className="flex h-[min(92dvh,100dvh)] max-h-[100dvh] w-full max-w-6xl min-h-0 flex-col overflow-hidden rounded-t-2xl bg-white shadow-2xl sm:h-[min(90vh,100dvh)] sm:rounded-xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Bar */}
        <div className="flex shrink-0 items-center justify-between gap-2 border-b border-gray-200 bg-gray-50 px-3 py-3 sm:px-4">
          <div className="flex min-w-0 flex-1 items-center gap-2 sm:gap-3">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[var(--neon-blue)]">
              <Mail className="h-4 w-4 text-white" />
            </div>
            <div className="min-w-0">
              <h2 className="truncate text-base font-semibold text-gray-900 sm:text-lg">
                {t("Email Preview")}
              </h2>
              <p className="truncate text-xs text-gray-500 sm:text-sm" title={templateTitle}>
                {t(templateTitle)}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="shrink-0 rounded-lg p-2 transition-colors hover:bg-gray-200 min-h-[44px] min-w-[44px] flex items-center justify-center sm:min-h-0 sm:min-w-0"
            aria-label={t("Close")}
          >
            <X className="h-5 w-5 text-gray-600" />
          </button>
        </div>

        <div className="flex min-h-0 flex-1 flex-col overflow-hidden md:flex-row">
          {/* Sidebar — decorative inbox chrome; hidden on small screens to maximize reading width */}
          <div className="hidden w-56 shrink-0 flex-col border-r border-gray-200 bg-gray-50 md:flex">
            {/* Compose Button */}
            <div className="p-3 border-b border-gray-200">
              <button className="w-full px-4 py-2 bg-[var(--neon-blue)] text-white rounded-lg hover:bg-[var(--medium-blue)] transition-colors text-sm font-medium flex items-center justify-center gap-2">
                <Send className="w-4 h-4" />
                {t("Compose")}
              </button>
            </div>

            {/* Navigation Items */}
            <div className="flex-1 overflow-y-auto p-2">
              <nav className="space-y-1">
                {sidebarItems.map((item, index) => {
                  const Icon = item.icon;
                  return (
                    <button
                      key={index}
                      className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                        item.active
                          ? "bg-[var(--neon-blue)]/10 text-[var(--neon-blue)]"
                          : "text-gray-700 hover:bg-gray-100"
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                      <span>{item.label}</span>
                    </button>
                  );
                })}
              </nav>
            </div>
          </div>

          {/* Email Content Area */}
          <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden bg-white">
            {/* Email Header Bar */}
            <div className="flex shrink-0 items-center justify-between gap-1 border-b border-gray-200 bg-gray-50 px-2 py-2 sm:px-4 sm:py-3">
              <div className="flex min-w-0 flex-1 items-center gap-0.5 overflow-x-auto sm:gap-2 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                <button type="button" className="shrink-0 rounded p-2 hover:bg-gray-200 sm:p-1.5">
                  <svg className="h-5 w-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
                <button type="button" className="shrink-0 rounded p-2 hover:bg-gray-200 sm:p-1.5">
                  <svg className="h-5 w-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                  </svg>
                </button>
                <button type="button" className="shrink-0 rounded p-2 hover:bg-gray-200 sm:p-1.5">
                  <svg className="h-5 w-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                  </svg>
                </button>
              </div>
              <div className="flex shrink-0 items-center gap-0.5 sm:gap-2">
                <button type="button" className="rounded p-2 hover:bg-gray-200 sm:p-1.5">
                  <svg className="h-5 w-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                  </svg>
                </button>
                <button type="button" className="rounded p-2 hover:bg-gray-200 sm:p-1.5">
                  <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Email Content */}
            <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
              {/* Subject Line */}
              <div className="border-b border-gray-200 px-3 py-3 sm:px-6 sm:py-4">
                <h1 className="break-words text-lg font-medium text-gray-900 sm:text-xl">
                  {t(emailTemplate.subject)}
                </h1>
              </div>

              {/* From and To - Email Client Style */}
              <div className="border-b border-gray-200 px-3 py-3 sm:px-6">
                {/* From Email */}
                <div className="flex items-start gap-2 sm:gap-3">
                  {/* Circular Profile Picture */}
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gray-100 sm:h-10 sm:w-10">
                    <User className="h-4 w-4 text-gray-500 sm:h-5 sm:w-5" />
                  </div>
                  
                  {/* From Email Content */}
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-baseline gap-x-1.5 gap-y-0.5 text-sm">
                      {emailTemplate.sentBy ? (
                        fromData ? (
                          fromData.displayName ? (
                            <>
                              <span className="break-words font-semibold text-gray-900">
                                {fromData.displayName}
                              </span>
                              <span className="break-all text-gray-500 sm:break-normal">&lt;{fromData.email}&gt;</span>
                            </>
                          ) : (
                            <span className="break-all text-gray-900 sm:break-normal">{fromData.email}</span>
                          )
                        ) : (
                          <span className="break-all text-gray-900 sm:break-normal">{emailTemplate.sentBy}</span>
                        )
                      ) : (
                        <>
                          <span className="font-semibold text-gray-900">CyberShield</span>
                          <span className="break-all text-gray-500 sm:break-normal">&lt;noreply@accounts.dev&gt;</span>
                        </>
                      )}
                    </div>
                    
                    {/* To separator */}
                    <div className="mt-1 flex items-center gap-1.5">
                      <span className="text-sm text-gray-500">{t("to me")}</span>
                      <button type="button" className="rounded p-1 transition-colors hover:bg-gray-100 min-h-[32px] min-w-[32px] flex items-center justify-center sm:min-h-0 sm:min-w-0 sm:p-0.5">
                        <ChevronDown className="h-3.5 w-3.5 text-gray-500" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Email Body */}
              <div className="px-3 py-4 pb-[max(1rem,env(safe-area-inset-bottom,0px))] sm:px-6 sm:py-6">
                <div className="prose prose-sm max-w-none">
                  <div className="break-words whitespace-pre-wrap text-sm leading-relaxed text-gray-800 [overflow-wrap:anywhere]">
                    {t(emailTemplate.bodyContent)}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
