"use client";

import { useState, useEffect, useCallback } from "react";
import { Mail, Send, Shield, AlertTriangle, Lock, CheckCircle2, XCircle, Clock, Plus, FilePlus, Eye, MousePointerClick } from "lucide-react";
import Image from "next/image";
import { useAuth } from "@clerk/nextjs";
import CreateEmailCampaignModal from "@/components/CreateEmailCampaignModal";
import CustomEmailTemplateModal from "@/components/CustomEmailTemplateModal";
import EmailTemplateViewModal from "@/components/EmailTemplateViewModal";
import NetworkBackground from "@/components/NetworkBackground";
import { useTranslation } from "@/hooks/useTranslation";
import { ApiClient } from "@/lib/api";
interface EmailTemplateContent {
  sentBy?: string;
  sentTo?: string;
  subject: string;
  bodyContent: string;
}

interface PhishingTemplate {
  _id?: string;
  id?: string;
  title: string;
  description: string;
  image: string;
  category: string;
  emailTemplate: EmailTemplateContent;
}

interface EmailRecord {
  _id: string;
  sentBy: string;
  sentTo: string;
  subject: string;
  status: "sent" | "failed";
  createdAt: string;
  openedAt?: string;
  clickedAt?: string;
  credentialsEnteredAt?: string;
  error?: string;
}

const INITIAL_VISIBLE_TEMPLATES = 6;

export default function EmailPhishingPage() {
  const { getToken } = useAuth();
  const { t, tAsync, preTranslate, language } = useTranslation();
  const [showModal, setShowModal] = useState(false);
  const [showTemplateModal, setShowTemplateModal] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<PhishingTemplate | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [initialEmailData, setInitialEmailData] = useState<Partial<EmailTemplateContent> | null>(null);
  const [templates, setTemplates] = useState<PhishingTemplate[]>([]);
  const [loadingTemplates, setLoadingTemplates] = useState(true);
  const [emails, setEmails] = useState<EmailRecord[]>([]);
  const [loadingEmails, setLoadingEmails] = useState(true);
  const [translationReady, setTranslationReady] = useState(false);
  const [hasAccess, setHasAccess] = useState<boolean | null>(null);
  const [accessError, setAccessError] = useState<string | null>(null);
  const [visibleTemplates, setVisibleTemplates] = useState(INITIAL_VISIBLE_TEMPLATES);
  const [showCustomTemplateModal, setShowCustomTemplateModal] = useState(false);
  const [savingCustomTemplate, setSavingCustomTemplate] = useState(false);

  const verifyAccess = async () => {
    try {
      const apiClient = new ApiClient(getToken);
      const profile = await apiClient.getUserProfile();
      const allowed =
        profile.role === "system_admin" || profile.role === "client_admin";
      setHasAccess(allowed);
      if (!allowed) {
        setAccessError(
          t("Access restricted to system and client administrators.")
        );
      }
    } catch (err) {
      console.error("Failed to verify access:", err);
      setAccessError(t("Failed to verify permissions. Please try again."));
      setHasAccess(false);
    }
  };

  useEffect(() => {
    verifyAccess();
  }, [getToken, t]);

  // Fetch templates from MongoDB
  const fetchTemplates = useCallback(async () => {
    try {
      setLoadingTemplates(true);
      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:5001";
      
      const response = await fetch(`${backendUrl}/api/email-templates`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });

      const result = await response.json();

      if (response.ok && result.success) {
        console.log("✅ Templates fetched successfully:", result.data.templates?.length || 0);
        const templatesData = result.data.templates || [];
        
        // Pre-translate dynamic template data
        if (language === "ur") {
          const dynamicStrings = templatesData.flatMap((template: PhishingTemplate) => [
            template.title,
            template.description,
            template.category,
            template.emailTemplate.subject,
            template.emailTemplate.bodyContent,
          ]).filter(Boolean);
          
          await preTranslate(dynamicStrings);
        }
        
        setTemplates(templatesData);
      } else {
        console.error("❌ Failed to fetch templates:", result.message);
      }
    } catch (error) {
      console.error("Error fetching templates:", error);
    } finally {
      setLoadingTemplates(false);
    }
  }, [language, preTranslate]);

  // Fetch emails from database
  const fetchEmails = useCallback(async () => {
    try {
      setLoadingEmails(true);
      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:5001";
      
      const response = await fetch(`${backendUrl}/api/email-campaigns?limit=5`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });

      const result = await response.json();

      if (response.ok && result.success) {
        setEmails(result.data.emails || []);
      }
    } catch (error) {
      console.error("Error fetching emails:", error);
    } finally {
      setLoadingEmails(false);
    }
  }, []);

  // Format date to local time
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false
    });
  };

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
        "Email Phishing",
        "Awareness Training",
        "Protect your organization by training users to identify and respond to phishing emails. Use our realistic templates to simulate real-world phishing scenarios and build cybersecurity awareness.",
        "Realistic Scenarios",
        "Security Training",
        "Safe Testing",
        "Send Email",
        
        // How it works section
        "How Email Phishing Simulation Works",
        "Our email phishing simulation sends realistic phishing emails directly to your employees' inboxes to test their security awareness and response.",
        "Select a phishing template (banking alert, password reset, delivery notice) or create your own custom email.",
        "Enter target employee email addresses. The system sends professional looking phishing emails with embedded tracking.",
        "When users click links or submit credentials, the system captures their interaction for analysis.",
        "Review detailed reports showing who clicked, who submitted data, and who reported the email to identify training needs.",
        
        // Templates section
        "Phishing Email Templates",
        "Choose from our collection of realistic phishing templates designed to test and improve your team's security awareness.",
        "View",
        "Use",
        
        // Campaign management section
        "Email Phishing Campaigns",
        "Create and manage phishing awareness campaigns",
        "New Campaign",
        
        // Email history section
        "Recent Emails",
        "Manage your email phishing awareness campaigns",
        "Sent",
        "Failed",
        "To",
        "From",
        
        // Loading/error states
        "Loading templates...",
        "No templates available. Please seed the database first.",
        "Loading emails...",
        "No emails yet",
        "Email phishing campaigns will appear here once they are created",
        "Email sent successfully to",
        "Failed to send email",
        "Failed to send email. Please check your backend connection.",
        "Bulk email sent!",
        "successful",
        "failed",
        "out of",
        "recipients.",
        "Loading...",
        "Access Restricted",
        "This page is available to system and client administrators only.",
        "See More",
        "Showing",
        "of",
        "templates",
        "more",
        "Show Less",
        "Custom Template",
        "Custom template saved successfully.",
        "Failed to save template.",
        "Failed to save template. Please try again.",
      ];

      await preTranslate(staticStrings);
      setTranslationReady(true);
    };

    preTranslatePageContent();
  }, [language, preTranslate]);

  useEffect(() => {
    if (hasAccess) {
      fetchTemplates();
      fetchEmails();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasAccess]);

  const handleSendEmail = async (emailData: {
    sentBy: string;
    sentTo: string;
    subject: string;
    bodyContent: string;
  }) => {
    setIsLoading(true);
    setMessage(null);

    try {
      const token = await getToken();
      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:5001";
      
      const headers: HeadersInit = {
        "Content-Type": "application/json",
      };
      
      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
      }
      
      const response = await fetch(`${backendUrl}/api/email-campaigns/send`, {
        method: "POST",
        headers,
        body: JSON.stringify({
          sentBy: emailData.sentBy,
          sentTo: emailData.sentTo,
          subject: emailData.subject,
          bodyContent: emailData.bodyContent,
        }),
      });

      const result = await response.json();

      if (response.ok && result.success) {
        const recipientCount = result.data?.total || 1;
        const successCount = result.data?.successful || 1;
        const failCount = result.data?.failed || 0;
        
        if (recipientCount > 1) {
          setMessage({ 
            type: "success", 
            text: t(`Bulk email sent! ${successCount} successful, ${failCount} failed out of ${recipientCount} recipients.`)
          });
        } else {
          setMessage({ type: "success", text: t(`Email sent successfully to ${emailData.sentTo}!`) });
        }
        setShowModal(false);
        // Refresh email list after sending
        fetchEmails();
      } else {
        setMessage({ type: "error", text: result.message || t("Failed to send email") });
      }
    } catch (error) {
      console.error("Error sending email:", error);
      setMessage({ 
        type: "error", 
        text: t("Failed to send email. Please check your backend connection.") 
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleTemplateClick = (template: PhishingTemplate) => {
    setSelectedTemplate(template);
    setShowTemplateModal(true);
  };

  const handleUseTemplate = async (template: PhishingTemplate, e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent triggering the view modal
    
    // Wait for translations to complete before opening modal
    const [translatedSubject, translatedBody] = await Promise.all([
      tAsync(template.emailTemplate.subject),
      tAsync(template.emailTemplate.bodyContent)
    ]);
    
    setInitialEmailData({
      subject: translatedSubject,
      bodyContent: translatedBody,
    });
    setShowModal(true);
  };

  const handleSaveCustomEmailTemplate = async (data: {
    title?: string;
    subject: string;
    bodyContent: string;
    linkUrl?: string;
  }) => {
    setSavingCustomTemplate(true);
    setMessage(null);
    try {
      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:5001";
      const response = await fetch(`${backendUrl}/api/email-templates/custom`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const result = await response.json();
      if (response.ok && result.success) {
        setMessage({ type: "success", text: t("Custom template saved successfully.") });
        setShowCustomTemplateModal(false);
        fetchTemplates();
      } else {
        setMessage({ type: "error", text: result.message || t("Failed to save template.") });
      }
    } catch (err) {
      console.error("Error saving custom template:", err);
      setMessage({ type: "error", text: t("Failed to save template. Please try again.") });
    } finally {
      setSavingCustomTemplate(false);
    }
  };


  if (hasAccess === null) {
    return (
      <div className="flex flex-1 items-center justify-center min-h-screen">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-[var(--neon-blue)] mx-auto"></div>
          <p className="text-[var(--dashboard-text-secondary)] dark:text-[var(--light-blue)] text-lg">{t("Loading...")}</p>
        </div>
      </div>
    );
  }

  if (hasAccess === false) {
    return (
      <div className="flex flex-1 items-center justify-center min-h-screen px-4 text-center">
        <div>
          <h1 className="text-2xl font-semibold text-[var(--dashboard-text-primary)] dark:text-white">
            {t("Access Restricted")}
          </h1>
          <p className="mt-2 text-sm text-[var(--dashboard-text-secondary)] dark:text-gray-300">
            {accessError ||
              t("This page is available to system and client administrators only.")}
          </p>
        </div>
      </div>
    );
  }

  // Show loading state while translating or fetching data
  if (!translationReady || loadingTemplates) {
    return (
      <div className="flex flex-1 items-center justify-center min-h-screen">
        <div className="text-center space-y-4">
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
      <div className="flex flex-1 flex-col gap-6 p-6 pt-4 relative">
        <NetworkBackground />
        {/* Blurred background element */}
        <div className="blurred-background"></div>

        {/* Hero Section */}
        <div className="relative py-12 px-4 sm:px-6 lg:px-8 overflow-hidden mb-8">
          <div className="blurred-background"></div>
          
          <div className="max-w-7xl mx-auto relative z-10">
            <div className="text-center space-y-4">
              <div className="flex justify-center mb-4">
              <div className="w-16 h-16 bg-[var(--neon-blue)] rounded-2xl flex items-center justify-center shadow-lg shadow-[var(--neon-blue)]/30">
                  <Mail className="w-8 h-8 text-white" />
                </div>
              </div>
              
              <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-[var(--dashboard-text-primary)] dark:text-white leading-tight">
                {t("Email Phishing")}
                <span className="block text-[var(--neon-blue)] mt-1">{t("Awareness Training")}</span>
              </h1>
              
              <p className="text-base md:text-lg text-[var(--dashboard-text-secondary)] dark:text-[var(--light-blue)] max-w-3xl mx-auto leading-relaxed">
                {t("Protect your organization by training users to identify and respond to phishing emails. Use our realistic templates to simulate real-world phishing scenarios and build cybersecurity awareness.")}
              </p>
              
              <div className="flex flex-wrap justify-center gap-3 mt-6">
                <div className="flex items-center gap-2 px-3 py-1.5 bg-gray-100 dark:bg-[var(--navy-blue-lighter)] rounded-lg border border-gray-300 dark:border-[var(--neon-blue)] dark:border-opacity-30 backdrop-blur-sm">
                  <Shield className="w-4 h-4 text-[var(--neon-blue)]" />
                  <span className="text-[var(--dashboard-text-primary)] dark:text-white text-xs">{t("Realistic Scenarios")}</span>
                </div>
                <div className="flex items-center gap-2 px-3 py-1.5 bg-gray-100 dark:bg-[var(--navy-blue-lighter)] rounded-lg border border-gray-300 dark:border-[var(--neon-blue)] dark:border-opacity-30 backdrop-blur-sm">
                  <AlertTriangle className="w-4 h-4 text-[var(--neon-blue)]" />
                  <span className="text-[var(--dashboard-text-primary)] dark:text-white text-xs">{t("Security Training")}</span>
                </div>
                <div className="flex items-center gap-2 px-3 py-1.5 bg-gray-100 dark:bg-[var(--navy-blue-lighter)] rounded-lg border border-gray-300 dark:border-[var(--neon-blue)] dark:border-opacity-30 backdrop-blur-sm">
                  <Lock className="w-4 h-4 text-[var(--neon-blue)]" />
                  <span className="text-[var(--dashboard-text-primary)] dark:text-white text-xs">{t("Safe Testing")}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Phishing Templates Section */}
        <div className="bg-[var(--navy-blue-light)]/95 backdrop-blur-sm rounded-3xl mt-8 ml-4 mr-4 mb-8">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
            <div className="mb-8">
              <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
                <h2 className="text-3xl font-bold text-[var(--dashboard-text-primary)] dark:text-white underline decoration-[var(--neon-blue)]">
                  {t("Phishing Email Templates")}
                </h2>
                <button
                  type="button"
                  onClick={() => setShowCustomTemplateModal(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-[var(--neon-blue)] text-white rounded-lg hover:opacity-90 transition-opacity"
                >
                  <FilePlus className="w-4 h-4" />
                  {t("Custom Template")}
                </button>
              </div>
              <p className="text-base text-[var(--dashboard-text-secondary)] dark:text-[var(--medium-grey)] max-w-2xl">
                {t("Choose from our collection of realistic phishing templates designed to test and improve your team's security awareness.")}
              </p>
            </div>

            {/* Template Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-8">
              {loadingTemplates ? (
                <div className="col-span-full text-center py-12">
                  <div className="text-[var(--dashboard-text-secondary)] dark:text-[var(--medium-grey)]">{t("Loading templates...")}</div>
                </div>
              ) : templates.length === 0 ? (
                <div className="col-span-full text-center py-12">
                  <Mail className="w-16 h-16 text-[var(--dashboard-text-secondary)] dark:text-[var(--medium-grey)] mx-auto mb-4" />
                  <p className="text-[var(--dashboard-text-secondary)] dark:text-[var(--medium-grey)]">{t("No templates available. Please seed the database first.")}</p>
                </div>
              ) : (
                templates.slice(0, visibleTemplates).map((template) => (
                  <div
                    key={template._id || template.id}
                  className="group relative bg-gradient-to-br from-[var(--navy-blue-lighter)] to-[var(--navy-blue)] rounded-2xl shadow-xl overflow-hidden border border-[var(--neon-blue)]/20 hover:border-[var(--neon-blue)]/60 transition-all duration-300 hover:scale-[1.03] hover:shadow-2xl hover:shadow-[var(--neon-blue)]/20 flex flex-col"
                >
                  {/* Image with enhanced styling */}
                  <div className="relative h-48 overflow-hidden">
                    <img
                      src={template.image}
                      alt={template.title}
                      className="w-full h-full object-cover transform transition-transform duration-700 group-hover:scale-110"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.src = "https://images.unsplash.com/photo-1563013544-824ae1b704d3?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80";
                      }}
                    />
                    {/* Enhanced gradient overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-[var(--navy-blue)] via-black/40 to-transparent"></div>
                    
                    {/* Category Badge with glow */}
                    <div className="absolute top-4 left-4">
                      <span className="px-3 py-1.5 bg-[var(--neon-blue)] text-white text-xs font-semibold rounded-full shadow-lg shadow-[var(--neon-blue)]/50 backdrop-blur-sm">
                        {t(template.category)}
                      </span>
                    </div>

                    {/* Icon overlay */}
                    <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                      <div className="w-10 h-10 bg-[var(--neon-blue)]/90 backdrop-blur-sm rounded-full flex items-center justify-center shadow-lg">
                        <Mail className="w-5 h-5 text-white" />
                      </div>
                    </div>
                  </div>

                  {/* Content */}
                  <div className="p-6 flex flex-col flex-1">
                    <div className="flex items-start gap-3 mb-3">
                      <div className="w-10 h-10 bg-[var(--neon-blue)]/20 rounded-lg flex items-center justify-center group-hover:bg-[var(--neon-blue)]/30 transition-colors">
                        <Mail className="w-5 h-5 text-[var(--neon-blue)]" />
                      </div>
                      <div className="flex-1">
                        <h3 className="text-xl font-bold text-[var(--dashboard-text-primary)] dark:text-white mb-1 group-hover:text-[var(--neon-blue)] transition-colors">
                          {t(template.title)}
                        </h3>
                      </div>
                    </div>
                    
                    <p className="text-[var(--dashboard-text-secondary)] dark:text-[var(--medium-grey)] text-sm leading-relaxed mb-6 flex-1">
                      {t(template.description)}
                    </p>

                    {/* Action Buttons */}
                    <div className="w-full mt-auto flex gap-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleTemplateClick(template);
                        }}
                        className="flex-1 px-4 py-3 bg-gradient-to-r from-[var(--neon-blue)] to-[var(--medium-blue)] text-white rounded-xl hover:from-[var(--medium-blue)] hover:to-[var(--neon-blue)] transition-all duration-300 text-sm font-semibold shadow-lg shadow-[var(--neon-blue)]/30 hover:shadow-[var(--neon-blue)]/50 transform hover:scale-[1.02] flex items-center justify-center gap-2"
                      >
                        <span>{t("View")}</span>
                        <Send className="w-4 h-4" />
                      </button>
                      <button
                        onClick={(e) => handleUseTemplate(template, e)}
                        className="flex-1 px-4 py-3 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-xl hover:from-green-600 hover:to-green-500 transition-all duration-300 text-sm font-semibold shadow-lg shadow-green-500/30 hover:shadow-green-500/50 transform hover:scale-[1.02] flex items-center justify-center gap-2"
                      >
                        <span>{t("Use")}</span>
                        <Mail className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Animated glow effect on hover */}
                  <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-[var(--neon-blue)]/0 via-[var(--neon-blue)]/10 to-[var(--neon-blue)]/0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"></div>
                </div>
                ))
              )}
            </div>

            {/* See More Button */}
            {templates.length > INITIAL_VISIBLE_TEMPLATES && (
              <div className="text-center">
                <p className="text-[var(--dashboard-text-secondary)] dark:text-[var(--medium-grey)] text-sm mb-4">
                  {t("Showing")} {Math.min(visibleTemplates, templates.length)} {t("of")} {templates.length} {t("templates")}
                </p>
                {visibleTemplates < templates.length ? (
                  <button
                    onClick={() => setVisibleTemplates(templates.length)}
                    className="px-8 py-3 bg-[var(--neon-blue)] text-white rounded-lg font-medium hover:bg-[var(--medium-blue)] transition-colors"
                  >
                    {t("See More")} ({templates.length - visibleTemplates} {t("more")})
                  </button>
                ) : (
                  <button
                    onClick={() => setVisibleTemplates(INITIAL_VISIBLE_TEMPLATES)}
                    className="px-8 py-3 bg-gray-200 dark:bg-[var(--navy-blue-lighter)] text-[var(--dashboard-text-primary)] dark:text-white rounded-lg font-medium hover:bg-gray-300 dark:hover:bg-[var(--navy-blue)] transition-colors border border-gray-300 dark:border-[var(--neon-blue)]/30"
                  >
                    {t("Show Less")}
                  </button>
                )}
              </div>
            )}

          </div>
        </div>

        {/* Page Header */}
        <div className="relative z-10 flex flex-1 flex-col gap-6 p-6 pt-4">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-[var(--neon-blue)] rounded-lg flex items-center justify-center">
                <Mail className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-[var(--dashboard-text-primary)] dark:text-white">
                  {t("Email Phishing Campaigns")}
                </h1>
                <p className="text-[var(--dashboard-text-secondary)] dark:text-[var(--medium-grey)] text-sm">
                  {t("Create and manage phishing awareness campaigns")}
                </p>
              </div>
            </div>
            <button
              onClick={() => setShowModal(true)}
              disabled={isLoading}
              className="flex items-center gap-2 px-4 py-2 bg-[var(--neon-blue)] text-white rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50"
            >
              <Plus className="w-4 h-4" />
              {t("New Campaign")}
            </button>
          </div>

          {/* Message */}
          {message && (
            <div className="relative z-10">
              <div
                className={`p-4 rounded-lg text-sm ${
                  message.type === "success"
                    ? "bg-green-900 bg-opacity-20 border border-green-500 text-green-300"
                    : "bg-red-900 bg-opacity-20 border border-red-500 text-red-300"
                }`}
              >
                {message.text}
                <button
                  onClick={() => setMessage(null)}
                  className="ml-2 hover:opacity-70"
                >
                  ×
                </button>
              </div>
            </div>
          )}

          {/* Email History */}
          <div className="relative z-10">
            <div className="dashboard-card rounded-lg p-6">
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-[var(--dashboard-text-primary)] dark:text-white mb-2">
                  {t("Recent Emails")}
                </h3>
                <p className="text-sm text-[var(--dashboard-text-secondary)] dark:text-[var(--medium-grey)]">
                  {t("Manage your email phishing awareness campaigns")}
                </p>
              </div>

              {loadingEmails ? (
                <div className="text-center py-8">
                  <div className="text-[var(--dashboard-text-secondary)] dark:text-[var(--medium-grey)]">{t("Loading emails...")}</div>
                </div>
              ) : emails.length === 0 ? (
                <div className="text-center py-12">
                  <Mail className="w-16 h-16 text-[var(--dashboard-text-secondary)] dark:text-[var(--medium-grey)] mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-[var(--dashboard-text-primary)] dark:text-white mb-2">
                    {t("No emails yet")}
                  </h3>
                  <p className="text-sm text-[var(--dashboard-text-secondary)] dark:text-[var(--medium-grey)]">
                    {t("Email phishing campaigns will appear here once they are created")}
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {emails.map((email) => (
                    <div
                      key={email._id}
                      className="bg-gray-50 dark:bg-[var(--navy-blue-lighter)] rounded-lg p-4"
                    >
                      <div className="flex items-start gap-3">
                        {email.status === "sent" ? (
                          <CheckCircle2 className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                        ) : (
                          <XCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                        )}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2 mb-2 flex-wrap">
                            <p className="text-[var(--dashboard-text-primary)] dark:text-white font-semibold truncate">
                              {t(email.subject)}
                            </p>
                            <div className="flex items-center gap-2 flex-shrink-0">
                              {email.openedAt && (
                                <span className="text-xs px-2 py-1 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 border border-blue-300 dark:border-blue-500/30 flex items-center gap-1">
                                  <Eye className="w-3 h-3" />
                                  {t("Opened")}
                                </span>
                              )}
                              {email.clickedAt && (
                                <span className="text-xs px-2 py-1 rounded-full bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400 border border-purple-300 dark:border-purple-500/30 flex items-center gap-1">
                                  <MousePointerClick className="w-3 h-3" />
                                  {t("Clicked")}
                                </span>
                              )}
                              {email.credentialsEnteredAt && (
                                <span className="text-xs px-2 py-1 rounded-full bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 border border-amber-300 dark:border-amber-500/30 flex items-center gap-1">
                                  {t("Credentials entered")}
                                </span>
                              )}
                              <span
                                className={`text-xs px-2 py-1 rounded-full ${
                                  email.status === "sent"
                                    ? "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 border border-green-300 dark:border-green-500/30"
                                    : "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 border border-red-300 dark:border-red-500/30"
                                }`}
                              >
                                {email.status === "sent" ? t("Sent") : t("Failed")}
                              </span>
                            </div>
                          </div>
                          <div className="space-y-1">
                            <p className="text-sm text-[var(--dashboard-text-secondary)] dark:text-[var(--medium-grey)] truncate">
                              <span className="text-[var(--dashboard-text-primary)] dark:text-white">{t("To")}:</span> {email.sentTo}
                            </p>
                            <p className="text-xs text-[var(--dashboard-text-secondary)] dark:text-[var(--medium-grey)] truncate">
                              <span className="text-[var(--dashboard-text-primary)] dark:text-white">{t("From")}:</span> {email.sentBy}
                            </p>
                            <div className="flex items-center gap-1 text-xs text-[var(--dashboard-text-secondary)] dark:text-[var(--medium-grey)] mt-2">
                              <Clock className="w-3 h-3" />
                              <span>{formatDate(email.createdAt)}</span>
                            </div>
                            {email.openedAt && (
                              <div className="flex items-center gap-1 text-xs text-blue-700 dark:text-blue-400 mt-1">
                                <Eye className="w-3 h-3" />
                                <span>{t("First opened at")} {formatDate(email.openedAt)}</span>
                              </div>
                            )}
                            {email.clickedAt && (
                              <div className="flex items-center gap-1 text-xs text-purple-700 dark:text-purple-400 mt-1">
                                <MousePointerClick className="w-3 h-3" />
                                <span>{t("First clicked at")} {formatDate(email.clickedAt)}</span>
                              </div>
                            )}
                            {email.credentialsEnteredAt && (
                              <div className="flex items-center gap-1 text-xs text-amber-700 dark:text-amber-400 mt-1">
                                <span>{t("Credentials entered at")} {formatDate(email.credentialsEnteredAt)}</span>
                              </div>
                            )}
                          </div>
                          {email.error && (
                            <p className="text-xs text-red-700 dark:text-red-400 mt-2">
                              {email.error}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Email Template View Modal */}
      {selectedTemplate && (
        <EmailTemplateViewModal
          isOpen={showTemplateModal}
          onClose={() => {
            setShowTemplateModal(false);
            setSelectedTemplate(null);
          }}
          templateTitle={selectedTemplate.title}
          emailTemplate={selectedTemplate.emailTemplate}
        />
      )}

      {/* Email Modal */}
      <CreateEmailCampaignModal
        isOpen={showModal}
        onClose={() => {
          if (!isLoading) {
            setShowModal(false);
            setMessage(null);
            setInitialEmailData(null);
          }
        }}
        onSubmit={handleSendEmail}
        isLoading={isLoading}
        initialData={initialEmailData || undefined}
      />

      <CustomEmailTemplateModal
        isOpen={showCustomTemplateModal}
        onClose={() => setShowCustomTemplateModal(false)}
        onSubmit={handleSaveCustomEmailTemplate}
        isLoading={savingCustomTemplate}
      />
    </>
  );
}