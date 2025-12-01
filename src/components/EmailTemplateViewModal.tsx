"use client";

import { X, Mail, Inbox, Send, Trash2, AlertCircle, Folder, Star, Archive, ChevronDown, User } from "lucide-react";

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
  if (!isOpen) return null;

  const sidebarItems = [
    { icon: Inbox, label: "Inbox", active: true },
    { icon: Star, label: "Starred", active: false },
    { icon: Send, label: "Sent", active: false },
    { icon: Archive, label: "Archive", active: false },
    { icon: Trash2, label: "Trash", active: false },
    { icon: AlertCircle, label: "Spam", active: false },
    { icon: Folder, label: "Drafts", active: false },
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
      className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div 
        className="bg-white rounded-xl shadow-2xl w-full max-w-6xl h-[90vh] overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Bar */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 bg-gray-50">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-[var(--neon-blue)] rounded-lg flex items-center justify-center">
              <Mail className="w-4 h-4 text-white" />
            </div>
            <h2 className="text-lg font-semibold text-gray-900">Email Preview</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-200 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-600" />
          </button>
        </div>

        <div className="flex flex-1 overflow-hidden">
          {/* Sidebar */}
          <div className="w-56 bg-gray-50 border-r border-gray-200 flex flex-col">
            {/* Compose Button */}
            <div className="p-3 border-b border-gray-200">
              <button className="w-full px-4 py-2 bg-[var(--neon-blue)] text-white rounded-lg hover:bg-[var(--medium-blue)] transition-colors text-sm font-medium flex items-center justify-center gap-2">
                <Send className="w-4 h-4" />
                Compose
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
          <div className="flex-1 flex flex-col overflow-hidden bg-white">
            {/* Email Header Bar */}
            <div className="px-4 py-3 border-b border-gray-200 bg-gray-50 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <button className="p-1.5 hover:bg-gray-200 rounded">
                  <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
                <button className="p-1.5 hover:bg-gray-200 rounded">
                  <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                  </svg>
                </button>
                <button className="p-1.5 hover:bg-gray-200 rounded">
                  <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                  </svg>
                </button>
              </div>
              <div className="flex items-center gap-2">
                <button className="p-1.5 hover:bg-gray-200 rounded">
                  <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                  </svg>
                </button>
                <button className="p-1.5 hover:bg-gray-200 rounded">
                  <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Email Content */}
            <div className="flex-1 overflow-y-auto">
              {/* Subject Line */}
              <div className="px-6 py-4 border-b border-gray-200">
                <h1 className="text-xl font-medium text-gray-900">
                  {emailTemplate.subject}
                </h1>
              </div>

              {/* From and To - Email Client Style */}
              <div className="px-6 py-3 border-b border-gray-200">
                {/* From Email */}
                <div className="flex items-start gap-3">
                  {/* Circular Profile Picture */}
                  <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0">
                    <User className="w-5 h-5 text-gray-500" />
                  </div>
                  
                  {/* From Email Content */}
                  <div className="flex-1">
                    <div className="flex items-baseline gap-1.5 flex-wrap text-sm">
                      {emailTemplate.sentBy ? (
                        fromData ? (
                          fromData.displayName ? (
                            <>
                              <span className="font-semibold text-gray-900">
                                {fromData.displayName}
                              </span>
                              <span className="text-gray-500">&lt;{fromData.email}&gt;</span>
                            </>
                          ) : (
                            <span className="text-gray-900">{fromData.email}</span>
                          )
                        ) : (
                          <span className="text-gray-900">{emailTemplate.sentBy}</span>
                        )
                      ) : (
                        <>
                          <span className="font-semibold text-gray-900">CyberShield</span>
                          <span className="text-gray-500">&lt;noreply@accounts.dev&gt;</span>
                        </>
                      )}
                    </div>
                    
                    {/* To separator */}
                    <div className="flex items-center gap-1.5 mt-1">
                      <span className="text-sm text-gray-500">to me</span>
                      <button className="p-0.5 hover:bg-gray-100 rounded transition-colors">
                        <ChevronDown className="w-3.5 h-3.5 text-gray-500" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Email Body */}
              <div className="px-6 py-6">
                <div className="prose prose-sm max-w-none">
                  <div className="whitespace-pre-wrap text-gray-800 leading-relaxed text-sm">
                    {emailTemplate.bodyContent}
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
