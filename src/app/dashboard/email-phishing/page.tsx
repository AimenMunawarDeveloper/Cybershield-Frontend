"use client";

import { useState, useEffect } from "react";
import { Mail, Send, Shield, AlertTriangle, Lock, Globe, CheckCircle2, XCircle, Clock } from "lucide-react";
import CreateEmailCampaignModal from "@/components/CreateEmailCampaignModal";
import EmailTemplateViewModal from "@/components/EmailTemplateViewModal";

interface EmailTemplateContent {
  sentBy?: string;
  sentTo?: string;
  subject: string;
  bodyContent: string;
}

interface PhishingTemplate {
  id: string;
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
  error?: string;
}

export default function EmailPhishingPage() {
  const [showModal, setShowModal] = useState(false);
  const [showTemplateModal, setShowTemplateModal] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<PhishingTemplate | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [initialEmailData, setInitialEmailData] = useState<Partial<EmailTemplateContent> | null>(null);
  const [emails, setEmails] = useState<EmailRecord[]>([]);
  const [loadingEmails, setLoadingEmails] = useState(true);

  // Fetch emails from database
  const fetchEmails = async () => {
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
  };

  useEffect(() => {
    fetchEmails();
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

  const handleSendEmail = async (emailData: {
    sentBy: string;
    sentTo: string;
    subject: string;
    bodyContent: string;
  }) => {
    setIsLoading(true);
    setMessage(null);

    try {
      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:5001";
      
      const response = await fetch(`${backendUrl}/api/email-campaigns/send`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
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
            text: `Bulk email sent! ${successCount} successful, ${failCount} failed out of ${recipientCount} recipients.` 
          });
        } else {
          setMessage({ type: "success", text: `Email sent successfully to ${emailData.sentTo}!` });
        }
        setShowModal(false);
        // Refresh email list after sending
        fetchEmails();
      } else {
        setMessage({ type: "error", text: result.message || "Failed to send email" });
      }
    } catch (error) {
      console.error("Error sending email:", error);
      setMessage({ 
        type: "error", 
        text: "Failed to send email. Please check your backend connection." 
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleTemplateClick = (template: PhishingTemplate) => {
    setSelectedTemplate(template);
    setShowTemplateModal(true);
  };

  const handleUseTemplate = (template: PhishingTemplate, e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent triggering the view modal
    setInitialEmailData({
      subject: template.emailTemplate.subject,
      bodyContent: template.emailTemplate.bodyContent,
    });
    setShowModal(true);
  };

  const phishingTemplates: PhishingTemplate[] = [
    {
      id: "1",
      title: "Banking Verification",
      description: "Simulate banking security alerts and account verification requests to test user awareness of financial phishing attempts.",
      image: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
      category: "Financial",
      emailTemplate: {
        subject: "URGENT: Account Verification Required - Action Needed Within 24 Hours",
        bodyContent: `Dear Valued Customer,

Your account requires immediate verification due to suspicious activity detected on your account.

To prevent your account from being temporarily suspended, please verify your account details by clicking the link below:

🔗 https://ubl-verification-pk.com/verify-account

This is a time-sensitive matter. Failure to verify within 24 hours will result in your account being blocked for security purposes.

Important Security Notice:
- Never share your password or PIN with anyone
- Our security team will NEVER ask for your full password
- Always check the sender's email address

For assistance, please contact our helpline: +92-301-1234567

Thank you for your immediate attention to this matter.

UBL Security Team
United Bank Limited`
      }
    },
    {
      id: "2",
      title: "Account Security Alert",
      description: "Test how users respond to urgent security notifications and password reset requests from seemingly legitimate sources.",
      image: "https://images.unsplash.com/photo-1563013544-824ae1b704d3?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
      category: "Security",
      emailTemplate: {
        subject: "Security Alert: Unusual Login Activity Detected",
        bodyContent: `Hello,

We detected a new sign-in to your account from an unrecognized device.

Location: Moscow, Russia
Device: Windows PC
Time: Today at 2:34 AM

If this was you, no action is needed. However, if you don't recognize this activity:

[SECURE YOUR ACCOUNT NOW] → Reset Password

This link will expire in 24 hours for security reasons.

If you didn't make this change, please secure your account immediately by clicking the link above and changing your password.

Need help? Contact support immediately.

Stay secure,
Account Security Team`
      }
    },
    {
      id: "3",
      title: "Package Delivery",
      description: "Simulate shipping notifications and delivery updates to assess user vigilance against delivery-related phishing scams.",
      image: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
      category: "Delivery",
      emailTemplate: {
        subject: "Package Delivery Update - Action Required",
        bodyContent: `Dear Customer,

Your package (Tracking #: TCS-789456123) is currently being held at our distribution center due to an incorrect or incomplete address.

To ensure timely delivery, please update your delivery information by clicking the link below:

📦 Update Delivery Address

You will need to:
1. Verify your contact information
2. Confirm your delivery address
3. Pay a handling fee of Rs. 150 (refundable upon successful delivery)

IMPORTANT: Please complete this process within 48 hours to avoid package return to sender.

If you have any questions, please contact our customer service team.

Thank you for your cooperation.

TCS Courier Services
www.tcs-tracking-pk.net`
      }
    },
    {
      id: "4",
      title: "Job Opportunity",
      description: "Create realistic job offer emails to evaluate how well users can identify employment-related phishing attempts.",
      image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
      category: "Employment",
      emailTemplate: {
        subject: "Congratulations! You've Been Shortlisted for Interview",
        bodyContent: `Dear Candidate,

We are pleased to inform you that after reviewing your application, you have been shortlisted for the position of Senior Marketing Manager at Nestlé Pakistan.

Interview Details:
📅 Date: [To be scheduled after confirmation]
⏰ Time: 10:00 AM - 12:00 PM
📍 Location: Nestlé Headquarters, Lahore

To confirm your interview slot, please complete the following steps:

1. Pay a non-refundable application processing fee of Rs. 2,000
   - Via Easypaisa: 0333-7654321
   - Please mention "Interview Fee - [Your Name]" in the transaction

2. Fill out the interview form at: nestle-careerpk.com/interview-form

3. Send your payment confirmation receipt to this email address

This fee covers administrative costs and is standard procedure for all shortlisted candidates.

Please note: Your interview slot will only be confirmed upon receipt of payment and form submission.

We look forward to meeting you!

Best regards,
Nestlé HR Recruitment Team
Nestlé Pakistan Limited`
      }
    },
  ];

  return (
    <>
      <div className="min-h-screen bg-gradient-to-br from-[var(--navy-blue)] via-[var(--navy-blue-light)] to-[var(--navy-blue)]">
        {/* Hero Section */}
        <div className="relative py-12 px-4 sm:px-6 lg:px-8 overflow-hidden">
          <div className="blurred-background"></div>
          
          <div className="max-w-7xl mx-auto relative z-10">
            <div className="text-center space-y-4">
              <div className="flex justify-center mb-4">
                <div className="w-16 h-16 bg-[var(--neon-blue)] rounded-2xl flex items-center justify-center shadow-lg shadow-[var(--neon-blue)]/30">
                  <Mail className="w-8 h-8 text-white" />
                </div>
              </div>
              
              <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white leading-tight">
                Email Phishing
                <span className="block text-[var(--neon-blue)] mt-1">Awareness Training</span>
              </h1>
              
              <p className="text-base md:text-lg text-[var(--light-blue)] max-w-3xl mx-auto leading-relaxed">
                Protect your organization by training users to identify and respond to phishing emails. 
                Use our realistic templates to simulate real-world phishing scenarios and build cybersecurity awareness.
              </p>
              
              <div className="flex flex-wrap justify-center gap-3 mt-6">
                <div className="flex items-center gap-2 px-3 py-1.5 bg-[var(--navy-blue-lighter)] rounded-lg border border-[var(--neon-blue)] border-opacity-30 backdrop-blur-sm">
                  <Shield className="w-4 h-4 text-[var(--neon-blue)]" />
                  <span className="text-white text-xs">Realistic Scenarios</span>
                </div>
                <div className="flex items-center gap-2 px-3 py-1.5 bg-[var(--navy-blue-lighter)] rounded-lg border border-[var(--neon-blue)] border-opacity-30 backdrop-blur-sm">
                  <AlertTriangle className="w-4 h-4 text-[var(--neon-blue)]" />
                  <span className="text-white text-xs">Security Training</span>
                </div>
                <div className="flex items-center gap-2 px-3 py-1.5 bg-[var(--navy-blue-lighter)] rounded-lg border border-[var(--neon-blue)] border-opacity-30 backdrop-blur-sm">
                  <Lock className="w-4 h-4 text-[var(--neon-blue)]" />
                  <span className="text-white text-xs">Safe Testing</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Phishing Templates Section */}
        <div className="bg-[var(--navy-blue-light)]/95 backdrop-blur-sm rounded-t-3xl mt-8 min-h-screen ml-4 mr-4">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
                Phishing Email Templates
              </h2>
              <p className="text-lg text-[var(--medium-grey)] max-w-2xl mx-auto">
                Choose from our collection of realistic phishing templates designed to test and improve your team's security awareness.
              </p>
            </div>

            {/* Template Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
              {phishingTemplates.map((template) => (
                <div
                  key={template.id}
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
                        {template.category}
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
                        <h3 className="text-xl font-bold text-white mb-1 group-hover:text-[var(--neon-blue)] transition-colors">
                          {template.title}
                        </h3>
                      </div>
                    </div>
                    
                    <p className="text-[var(--medium-grey)] text-sm leading-relaxed mb-6 flex-1">
                      {template.description}
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
                        <span>View</span>
                        <Send className="w-4 h-4" />
                      </button>
                      <button
                        onClick={(e) => handleUseTemplate(template, e)}
                        className="flex-1 px-4 py-3 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-xl hover:from-green-600 hover:to-green-500 transition-all duration-300 text-sm font-semibold shadow-lg shadow-green-500/30 hover:shadow-green-500/50 transform hover:scale-[1.02] flex items-center justify-center gap-2"
                      >
                        <span>Use</span>
                        <Mail className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Animated glow effect on hover */}
                  <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-[var(--neon-blue)]/0 via-[var(--neon-blue)]/10 to-[var(--neon-blue)]/0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"></div>
                </div>
              ))}
            </div>

            {/* Send Email Section */}
            <div className="mt-12">
              <div className="flex flex-col gap-6">
                {/* Page Header */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-[var(--neon-blue)] rounded-lg flex items-center justify-center">
                      <Send className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold text-white">Send Test Email</h2>
                      <p className="text-[var(--medium-grey)] text-sm">
                        Send test emails for phishing awareness
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setShowModal(true)}
                    disabled={isLoading}
                    className="flex items-center gap-2 px-4 py-2 bg-[var(--neon-blue)] text-white rounded-lg hover:bg-[var(--neon-blue-dark)] transition-colors disabled:opacity-50"
                  >
                    <Send className="w-4 h-4" />
                    Send Email
                  </button>
                </div>

                {/* Message */}
                {message && (
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
                )}

                {/* Email History */}
                <div className="bg-[var(--navy-blue-lighter)] rounded-lg p-6 border border-[var(--medium-grey)] border-opacity-20">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-white">
                      Email History
                    </h3>
                    <button
                      onClick={fetchEmails}
                      disabled={loadingEmails}
                      className="text-sm text-[var(--neon-blue)] hover:text-[var(--neon-blue-dark)] transition-colors disabled:opacity-50"
                    >
                      {loadingEmails ? "Refreshing..." : "Refresh"}
                    </button>
                  </div>

                  {loadingEmails ? (
                    <div className="text-center py-8">
                      <div className="text-[var(--medium-grey)]">Loading emails...</div>
                    </div>
                  ) : emails.length === 0 ? (
                    <div className="text-center py-8">
                      <Mail className="w-16 h-16 text-[var(--medium-grey)] mx-auto mb-4" />
                      <p className="text-sm text-[var(--medium-grey)]">
                        No emails sent yet. Send your first email above!
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {emails.map((email) => (
                        <div
                          key={email._id}
                          className="bg-[var(--navy-blue)] rounded-lg p-4 border border-[var(--medium-grey)] border-opacity-20 hover:border-[var(--neon-blue)] transition-colors"
                        >
                          <div className="flex items-start gap-3">
                            {email.status === "sent" ? (
                              <CheckCircle2 className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                            ) : (
                              <XCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                            )}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-start justify-between gap-2 mb-2">
                                <p className="text-white font-semibold truncate">
                                  {email.subject}
                                </p>
                                <span
                                  className={`text-xs px-2 py-1 rounded-full flex-shrink-0 ${
                                    email.status === "sent"
                                      ? "bg-green-900/30 text-green-400 border border-green-500/30"
                                      : "bg-red-900/30 text-red-400 border border-red-500/30"
                                  }`}
                                >
                                  {email.status === "sent" ? "Sent" : "Failed"}
                                </span>
                              </div>
                              <div className="space-y-1">
                                <p className="text-sm text-[var(--medium-grey)] truncate">
                                  <span className="text-white">To:</span> {email.sentTo}
                                </p>
                                <p className="text-xs text-[var(--medium-grey)] truncate">
                                  <span className="text-white">From:</span> {email.sentBy}
                                </p>
                                <div className="flex items-center gap-1 text-xs text-[var(--medium-grey)] mt-2">
                                  <Clock className="w-3 h-3" />
                                  <span>{formatDate(email.createdAt)}</span>
                                </div>
                              </div>
                              {email.error && (
                                <p className="text-xs text-red-400 mt-2">
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
    </>
  );
}
