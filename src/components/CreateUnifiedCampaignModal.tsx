"use client";

import { useState, useEffect } from "react";
import { X, Users, Plus, Trash2, Mail, MessageSquare, Calendar, Zap, FileText } from "lucide-react";
import { useAuth, useUser } from "@clerk/nextjs";
import { useTranslation } from "@/hooks/useTranslation";
import { ApiClient } from "@/lib/api";
import UserSelector from "@/components/UserSelector";

interface CreateUnifiedCampaignModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

interface ManualUser {
  id: string;
  firstName: string;
  lastName: string;
  email?: string;
  phoneNumber?: string;
}

interface User {
  _id: string;
  email: string;
  displayName: string;
}

export default function CreateUnifiedCampaignModal({
  isOpen,
  onClose,
  onSuccess,
}: CreateUnifiedCampaignModalProps) {
  const { t } = useTranslation();
  const { getToken } = useAuth();
  const { user, isLoaded } = useUser();
  
  // Form state
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Campaign basics
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [scheduleDate, setScheduleDate] = useState("");
  
  // Channel selection
  const [whatsappEnabled, setWhatsappEnabled] = useState(false);
  const [emailEnabled, setEmailEnabled] = useState(false);
  
  // Target users - UserSelector for Email, Manual for WhatsApp
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [selectedUsers, setSelectedUsers] = useState<User[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  
  // Manual users for WhatsApp
  const [manualUsers, setManualUsers] = useState<ManualUser[]>([]);
  const [showAddUserForm, setShowAddUserForm] = useState(false);
  const [newUserFirstName, setNewUserFirstName] = useState("");
  const [newUserLastName, setNewUserLastName] = useState("");
  const [newUserEmail, setNewUserEmail] = useState("");
  const [newUserPhone, setNewUserPhone] = useState("");
  
  // WhatsApp config
  const [whatsappMessage, setWhatsappMessage] = useState("");
  const [whatsappLandingPage, setWhatsappLandingPage] = useState("");
  
  // Email config
  const HARDCODED_SENDER_EMAIL = "hadiaali90500@gmail.com";
  const [emailSubject, setEmailSubject] = useState("");
  const [emailBody, setEmailBody] = useState("");
  const [emailLandingPage, setEmailLandingPage] = useState("");
  
  // Templates
  const [emailTemplates, setEmailTemplates] = useState<any[]>([]);
  const [whatsappTemplates, setWhatsappTemplates] = useState<any[]>([]);
  const [emailTemplatesLoading, setEmailTemplatesLoading] = useState(false);
  const [whatsappTemplatesLoading, setWhatsappTemplatesLoading] = useState(false);
  const [showEmailTemplateSelector, setShowEmailTemplateSelector] = useState(false);
  const [showWhatsappTemplateSelector, setShowWhatsappTemplateSelector] = useState(false);
  
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

  // Fetch templates
  useEffect(() => {
    if (isOpen) {
      const fetchTemplates = async () => {
        try {
          const token = await getToken();
          if (!token) return;

          const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5001/api";

          // Fetch email templates
          if (emailEnabled) {
            setEmailTemplatesLoading(true);
            try {
              const emailResponse = await fetch(`${API_BASE_URL}/email-templates`, {
                headers: {
                  "Content-Type": "application/json",
                  Authorization: `Bearer ${token}`,
                },
              });
              if (emailResponse.ok) {
                const emailData = await emailResponse.json();
                if (emailData.success && emailData.data?.templates) {
                  setEmailTemplates(emailData.data.templates);
                }
              }
            } catch (error) {
              console.error("Error fetching email templates:", error);
            } finally {
              setEmailTemplatesLoading(false);
            }
          }

          // Fetch WhatsApp templates
          if (whatsappEnabled) {
            setWhatsappTemplatesLoading(true);
            try {
              const whatsappResponse = await fetch(`${API_BASE_URL}/whatsapp-templates`, {
                headers: {
                  "Content-Type": "application/json",
                  Authorization: `Bearer ${token}`,
                },
              });
              if (whatsappResponse.ok) {
                const whatsappData = await whatsappResponse.json();
                if (whatsappData.success && whatsappData.data?.templates) {
                  setWhatsappTemplates(whatsappData.data.templates);
                }
              }
            } catch (error) {
              console.error("Error fetching WhatsApp templates:", error);
            } finally {
              setWhatsappTemplatesLoading(false);
            }
          }
        } catch (error) {
          console.error("Error fetching templates:", error);
        }
      };
      fetchTemplates();
    }
  }, [isOpen, emailEnabled, whatsappEnabled, getToken]);

  // Reset form
  const resetForm = () => {
    setStep(1);
    setName("");
    setDescription("");
    setScheduleDate("");
    setWhatsappEnabled(false);
    setEmailEnabled(false);
    setSelectedUsers([]);
    setManualUsers([]);
    setShowAddUserForm(false);
    setNewUserFirstName("");
    setNewUserLastName("");
    setNewUserEmail("");
    setNewUserPhone("");
    setWhatsappMessage("");
    setWhatsappLandingPage("");
    setEmailSubject("");
    setEmailBody("");
    setEmailLandingPage("");
    setShowEmailTemplateSelector(false);
    setShowWhatsappTemplateSelector(false);
    setError(null);
  };
  
  const handleAddUser = () => {
    if (newUserFirstName.trim()) {
      const newUser: ManualUser = {
        id: `manual_${Date.now()}`,
        firstName: newUserFirstName,
        lastName: newUserLastName,
        email: emailEnabled ? newUserEmail : undefined,
        phoneNumber: whatsappEnabled ? newUserPhone : undefined,
      };
      
      setManualUsers([...manualUsers, newUser]);
      setNewUserFirstName("");
      setNewUserLastName("");
      setNewUserEmail("");
      setNewUserPhone("");
      setShowAddUserForm(false);
    }
  };
  
  const handleRemoveUser = (id: string) => {
    setManualUsers(manualUsers.filter(user => user.id !== id));
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation
    if (!name || !description) {
      setError(t("Please fill in campaign name and description"));
      return;
    }
    
    if (!whatsappEnabled && !emailEnabled) {
      setError(t("Please enable at least one channel (WhatsApp or Email)"));
      return;
    }
    
    // Validate users based on enabled channels
    if (emailEnabled && selectedUsers.length === 0) {
      setError(t("Please select at least one user for email campaign"));
      return;
    }
    
    if (whatsappEnabled && manualUsers.length === 0) {
      setError(t("Please add at least one user for WhatsApp campaign"));
      return;
    }
    
    if (whatsappEnabled && (!whatsappMessage || !whatsappLandingPage)) {
      setError(t("Please fill in WhatsApp configuration"));
      return;
    }
    
    if (emailEnabled && (!emailSubject || !emailBody)) {
      setError(t("Please fill in Email configuration"));
      return;
    }
    
    try {
      setLoading(true);
      setError(null);
      
      const token = await getToken();
      if (!token) {
        setError(t("Authentication required"));
        return;
      }
      
      const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5001/api";
      
      const campaignData = {
        name,
        description,
        scheduleDate: scheduleDate || undefined,
        whatsappConfig: whatsappEnabled ? {
          enabled: true,
          messageTemplate: whatsappMessage,
          landingPageUrl: whatsappLandingPage,
        } : { enabled: false },
        emailConfig: emailEnabled ? {
          enabled: true,
          subject: emailSubject,
          bodyContent: emailBody,
          senderEmail: HARDCODED_SENDER_EMAIL,
          landingPageUrl: emailLandingPage,
        } : { enabled: false },
        targetUserIds: emailEnabled ? selectedUsers.map(user => user._id) : [],
        manualUsers: whatsappEnabled ? manualUsers.map(user => ({
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email || "",
          phoneNumber: user.phoneNumber || "",
        })) : [],
      };
      
      const response = await fetch(`${API_BASE_URL}/campaigns`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(campaignData),
      });
      
      const data = await response.json();
      
      if (response.ok && data.success) {
        resetForm();
        onSuccess();
      } else {
        setError(data.message || t("Failed to create campaign"));
      }
    } catch (err) {
      console.error("Error creating campaign:", err);
      setError(t("Failed to create campaign. Please try again."));
    } finally {
      setLoading(false);
    }
  };
  
  const nextStep = () => {
    if (step === 1) {
      if (!name || !description) {
        setError(t("Please fill in campaign name and description"));
        return;
      }
      if (!whatsappEnabled && !emailEnabled) {
        setError(t("Please enable at least one channel"));
        return;
      }
    }
    
    if (step === 2) {
      if (emailEnabled && selectedUsers.length === 0) {
        setError(t("Please select at least one user for email campaign"));
        return;
      }
      if (whatsappEnabled && manualUsers.length === 0) {
        setError(t("Please add at least one user for WhatsApp campaign"));
        return;
      }
    }
    
    setError(null);
    setStep(step + 1);
  };
  
  const prevStep = () => {
    setError(null);
    setStep(step - 1);
  };
  
  if (!isOpen) return null;
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-[var(--navy-blue-light)] rounded-2xl p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-[var(--neon-blue)] to-black rounded-lg flex items-center justify-center">
              <Zap className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-white">
                {t("Create Unified Campaign")}
              </h2>
              <p className="text-sm text-[var(--medium-grey)]">
                {t("Step")} {step} {t("of")} 3
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              resetForm();
              onClose();
            }}
            className="text-[var(--medium-grey)] hover:text-white transition-colors"
            disabled={loading}
          >
            <X className="w-6 h-6" />
          </button>
        </div>
        
        {/* Progress Bar */}
        <div className="flex gap-2 mb-6">
          {[1, 2, 3].map((s) => (
            <div
              key={s}
              className={`flex-1 h-2 rounded-full transition-all ${
                s <= step
                  ? "bg-gradient-to-r from-[var(--neon-blue)] to-black"
                  : "bg-[var(--navy-blue)]"
              }`}
            />
          ))}
        </div>
        
        {/* Error Message */}
        {error && (
          <div className="mb-4 p-4 bg-red-900/20 border border-red-500 rounded-lg text-red-300 text-sm">
            {error}
          </div>
        )}
        
        <form onSubmit={handleSubmit}>
          {/* Step 1: Campaign Basics */}
          {step === 1 && (
            <div className="space-y-6">
              <div>
                <label className="block text-white mb-2 font-medium">
                  {t("Campaign Name")} *
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-4 py-3 bg-[var(--navy-blue)] border border-[var(--medium-grey)] border-opacity-30 rounded-lg text-white focus:outline-none focus:border-[var(--neon-blue)] transition-colors"
                  placeholder={t("Enter campaign name")}
                  required
                />
              </div>
              
              <div>
                <label className="block text-white mb-2 font-medium">
                  {t("Description")} *
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-4 py-3 bg-[var(--navy-blue)] border border-[var(--medium-grey)] border-opacity-30 rounded-lg text-white focus:outline-none focus:border-[var(--neon-blue)] transition-colors resize-none"
                  placeholder={t("Describe the purpose of this campaign")}
                  rows={3}
                  required
                />
              </div>
              
              <div>
                <label className="block text-white mb-2 font-medium">
                  {t("Schedule Date")} ({t("Optional")})
                </label>
                <input
                  type="datetime-local"
                  value={scheduleDate}
                  onChange={(e) => setScheduleDate(e.target.value)}
                  className="w-full px-4 py-3 bg-[var(--navy-blue)] border border-[var(--medium-grey)] border-opacity-30 rounded-lg text-white focus:outline-none focus:border-[var(--neon-blue)] transition-colors"
                />
              </div>
              
              <div>
                <label className="block text-white mb-3 font-medium">
                  {t("Select Channels")} *
                </label>
                <div className="grid grid-cols-2 gap-4">
                  <button
                    type="button"
                    onClick={() => setEmailEnabled(!emailEnabled)}
                    className={`p-4 rounded-lg border-2 transition-all ${
                      emailEnabled
                        ? "border-blue-500 bg-blue-500/20"
                        : "border-[var(--medium-grey)]/30 bg-[var(--navy-blue)]"
                    }`}
                  >
                    <Mail className={`w-8 h-8 mx-auto mb-2 ${emailEnabled ? "text-blue-400" : "text-[var(--medium-grey)]"}`} />
                    <p className={`text-sm font-medium ${emailEnabled ? "text-white" : "text-[var(--medium-grey)]"}`}>
                      {t("Email")}
                    </p>
                  </button>
                  
                  <button
                    type="button"
                    onClick={() => setWhatsappEnabled(!whatsappEnabled)}
                    className={`p-4 rounded-lg border-2 transition-all ${
                      whatsappEnabled
                        ? "border-green-500 bg-green-500/20"
                        : "border-[var(--medium-grey)]/30 bg-[var(--navy-blue)]"
                    }`}
                  >
                    <MessageSquare className={`w-8 h-8 mx-auto mb-2 ${whatsappEnabled ? "text-green-400" : "text-[var(--medium-grey)]"}`} />
                    <p className={`text-sm font-medium ${whatsappEnabled ? "text-white" : "text-[var(--medium-grey)]"}`}>
                      {t("WhatsApp")}
                    </p>
                  </button>
                </div>
              </div>
            </div>
          )}
          
          {/* Step 2: Target Users */}
          {step === 2 && (
            <div className="space-y-6">
              {/* Email User Selection */}
              {emailEnabled && (
                <div className="space-y-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Mail className="w-5 h-5 text-blue-400" />
                    <h3 className="text-lg font-semibold text-white">
                      {t("Email Users")} ({selectedUsers.length} {t("selected")})
                    </h3>
                  </div>
                  
                  <div>
                    <label className="block text-white mb-2 font-medium">
                      {t("Select Users for Email")} *
                    </label>
                    <UserSelector
                      selectedUsers={selectedUsers}
                      onUsersChange={setSelectedUsers}
                      allUsers={allUsers}
                      isLoading={loadingUsers}
                      disabled={loading}
                    />
                  </div>
                  
                  {selectedUsers.length > 0 && (
                    <div className="mt-4">
                      <p className="text-sm text-[var(--medium-grey)] mb-2">
                        {t("Selected users for email campaign")}:
                      </p>
                      <div className="space-y-2 max-h-48 overflow-y-auto">
                        {selectedUsers.map((user) => (
                          <div
                            key={user._id}
                            className="flex items-center justify-between p-3 bg-[var(--navy-blue)] rounded-lg border border-[var(--medium-grey)]/20"
                          >
                            <div>
                              <p className="text-white font-medium">
                                {user.displayName || user.email}
                              </p>
                              <p className="text-sm text-[var(--medium-grey)] mt-1">
                                {user.email}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
              
              {/* WhatsApp User Selection */}
              {whatsappEnabled && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <MessageSquare className="w-5 h-5 text-green-400" />
                      <h3 className="text-lg font-semibold text-white">
                        {t("WhatsApp Users")} ({manualUsers.length})
                      </h3>
                    </div>
                    <button
                      type="button"
                      onClick={() => setShowAddUserForm(!showAddUserForm)}
                      className="flex items-center gap-2 px-4 py-2 bg-[var(--neon-blue)] text-white rounded-lg hover:bg-[var(--neon-blue-dark)] transition-colors"
                    >
                      <Plus className="w-4 h-4" />
                      {t("Add User")}
                    </button>
                  </div>
                  
                  {showAddUserForm && (
                    <div className="p-4 bg-[var(--navy-blue)] rounded-lg border border-[var(--medium-grey)]/30 space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <input
                          type="text"
                          value={newUserFirstName}
                          onChange={(e) => setNewUserFirstName(e.target.value)}
                          className="px-3 py-2 bg-[var(--navy-blue-light)] border border-[var(--medium-grey)]/30 rounded text-white focus:outline-none focus:border-[var(--neon-blue)]"
                          placeholder={t("First Name")}
                        />
                        <input
                          type="text"
                          value={newUserLastName}
                          onChange={(e) => setNewUserLastName(e.target.value)}
                          className="px-3 py-2 bg-[var(--navy-blue-light)] border border-[var(--medium-grey)]/30 rounded text-white focus:outline-none focus:border-[var(--neon-blue)]"
                          placeholder={t("Last Name")}
                        />
                      </div>
                      
                      {emailEnabled && (
                        <input
                          type="email"
                          value={newUserEmail}
                          onChange={(e) => setNewUserEmail(e.target.value)}
                          className="w-full px-3 py-2 bg-[var(--navy-blue-light)] border border-[var(--medium-grey)]/30 rounded text-white focus:outline-none focus:border-[var(--neon-blue)]"
                          placeholder={t("Email Address")}
                        />
                      )}
                      
                      {whatsappEnabled && (
                        <input
                          type="tel"
                          value={newUserPhone}
                          onChange={(e) => setNewUserPhone(e.target.value)}
                          className="w-full px-3 py-2 bg-[var(--navy-blue-light)] border border-[var(--medium-grey)]/30 rounded text-white focus:outline-none focus:border-[var(--neon-blue)]"
                          placeholder={t("Phone Number")}
                        />
                      )}
                      
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={handleAddUser}
                          className="flex-1 px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 transition-colors"
                        >
                          {t("Add")}
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setShowAddUserForm(false);
                            setNewUserFirstName("");
                            setNewUserLastName("");
                            setNewUserEmail("");
                            setNewUserPhone("");
                          }}
                          className="px-4 py-2 bg-[var(--navy-blue-light)] text-white rounded hover:bg-[var(--navy-blue)] transition-colors"
                        >
                          {t("Cancel")}
                        </button>
                      </div>
                    </div>
                  )}
                  
                  <div className="space-y-2 max-h-96 overflow-y-auto">
                    {manualUsers.map((user) => (
                      <div
                        key={user.id}
                        className="flex items-center justify-between p-3 bg-[var(--navy-blue)] rounded-lg border border-[var(--medium-grey)]/20"
                      >
                        <div>
                          <p className="text-white font-medium">
                            {user.firstName} {user.lastName}
                          </p>
                          <div className="flex gap-3 text-sm text-[var(--medium-grey)] mt-1">
                            {user.email && (
                              <span className="flex items-center gap-1">
                                <Mail className="w-3 h-3" />
                                {user.email}
                              </span>
                            )}
                            {user.phoneNumber && (
                              <span className="flex items-center gap-1">
                                <MessageSquare className="w-3 h-3" />
                                {user.phoneNumber}
                              </span>
                            )}
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleRemoveUser(user.id)}
                          className="text-red-400 hover:text-red-300 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
          
          {/* Step 3: Channel Configuration */}
          {step === 3 && (
            <div className="space-y-6">
              {emailEnabled && (
                <div className="p-4 bg-[var(--navy-blue)] rounded-lg border border-blue-500/30 space-y-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Mail className="w-5 h-5 text-blue-400" />
                    <h3 className="text-lg font-semibold text-white">
                      {t("Email Configuration")}
                    </h3>
                  </div>
                  
                  <div>
                    <label className="block text-sm text-[var(--medium-grey)] mb-2">
                      {t("Sender Email")}
                    </label>
                    <input
                      type="email"
                      value={HARDCODED_SENDER_EMAIL}
                      readOnly
                      className="w-full px-4 py-3 bg-[var(--navy-blue-light)] border border-[var(--medium-grey)]/30 rounded-lg text-white opacity-75 cursor-not-allowed"
                    />
                  </div>

                  {/* Email Template Selection */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="block text-sm text-white font-medium">
                        {t("Email Template")}
                      </label>
                      <button
                        type="button"
                        onClick={() => setShowEmailTemplateSelector(!showEmailTemplateSelector)}
                        className="flex items-center gap-2 px-3 py-1.5 bg-[var(--neon-blue)] text-white rounded-lg hover:bg-[var(--neon-blue-dark)] transition-colors text-sm"
                      >
                        <FileText className="w-4 h-4" />
                        {showEmailTemplateSelector ? t("Hide Templates") : t("Choose Template")}
                      </button>
                    </div>
                    
                    {showEmailTemplateSelector && (
                      <div className="mb-4 p-4 bg-[var(--navy-blue-light)] rounded-lg border border-[var(--medium-grey)]/30 max-h-64 overflow-y-auto">
                        {emailTemplatesLoading ? (
                          <div className="text-center py-4 text-[var(--medium-grey)]">
                            {t("Loading templates...")}
                          </div>
                        ) : emailTemplates.length === 0 ? (
                          <div className="text-center py-4 text-[var(--medium-grey)]">
                            {t("No templates available")}
                          </div>
                        ) : (
                          <div className="grid grid-cols-1 gap-2">
                            {emailTemplates.map((template) => (
                              <button
                                key={template._id || template.id}
                                type="button"
                                onClick={() => {
                                  setEmailSubject(template.emailTemplate?.subject || "");
                                  setEmailBody(template.emailTemplate?.bodyContent || "");
                                  setShowEmailTemplateSelector(false);
                                }}
                                className="p-3 text-left bg-[var(--navy-blue)] rounded-lg border border-[var(--medium-grey)]/30 hover:border-[var(--neon-blue)] transition-colors"
                              >
                                <div className="text-white font-medium text-sm mb-1">
                                  {template.title}
                                </div>
                                <div className="text-[var(--medium-grey)] text-xs line-clamp-2">
                                  {template.description}
                                </div>
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                  
                  <input
                    type="text"
                    value={emailSubject}
                    onChange={(e) => setEmailSubject(e.target.value)}
                    className="w-full px-4 py-3 bg-[var(--navy-blue-light)] border border-[var(--medium-grey)]/30 rounded-lg text-white focus:outline-none focus:border-[var(--neon-blue)]"
                    placeholder={t("Email Subject")}
                    required={emailEnabled}
                  />
                  
                  <textarea
                    value={emailBody}
                    onChange={(e) => setEmailBody(e.target.value)}
                    className="w-full px-4 py-3 bg-[var(--navy-blue-light)] border border-[var(--medium-grey)]/30 rounded-lg text-white focus:outline-none focus:border-[var(--neon-blue)] resize-none"
                    placeholder={t("Email Body")}
                    rows={4}
                    required={emailEnabled}
                  />
                  
                  <input
                    type="url"
                    value={emailLandingPage}
                    onChange={(e) => setEmailLandingPage(e.target.value)}
                    className="w-full px-4 py-3 bg-[var(--navy-blue-light)] border border-[var(--medium-grey)]/30 rounded-lg text-white focus:outline-none focus:border-[var(--neon-blue)]"
                    placeholder={t("Landing Page URL (optional)")}
                  />
                </div>
              )}
              
              {whatsappEnabled && (
                <div className="p-4 bg-[var(--navy-blue)] rounded-lg border border-green-500/30 space-y-4">
                  <div className="flex items-center gap-2 mb-2">
                    <MessageSquare className="w-5 h-5 text-green-400" />
                    <h3 className="text-lg font-semibold text-white">
                      {t("WhatsApp Configuration")}
                    </h3>
                  </div>

                  {/* WhatsApp Template Selection */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="block text-sm text-white font-medium">
                        {t("WhatsApp Template")}
                      </label>
                      <button
                        type="button"
                        onClick={() => setShowWhatsappTemplateSelector(!showWhatsappTemplateSelector)}
                        className="flex items-center gap-2 px-3 py-1.5 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors text-sm"
                      >
                        <FileText className="w-4 h-4" />
                        {showWhatsappTemplateSelector ? t("Hide Templates") : t("Choose Template")}
                      </button>
                    </div>
                    
                    {showWhatsappTemplateSelector && (
                      <div className="mb-4 p-4 bg-[var(--navy-blue-light)] rounded-lg border border-[var(--medium-grey)]/30 max-h-64 overflow-y-auto">
                        {whatsappTemplatesLoading ? (
                          <div className="text-center py-4 text-[var(--medium-grey)]">
                            {t("Loading templates...")}
                          </div>
                        ) : whatsappTemplates.length === 0 ? (
                          <div className="text-center py-4 text-[var(--medium-grey)]">
                            {t("No templates available")}
                          </div>
                        ) : (
                          <div className="grid grid-cols-1 gap-2">
                            {whatsappTemplates.map((template) => (
                              <button
                                key={template._id || template.id}
                                type="button"
                                onClick={() => {
                                  setWhatsappMessage(template.messageTemplate || "");
                                  setShowWhatsappTemplateSelector(false);
                                }}
                                className="p-3 text-left bg-[var(--navy-blue)] rounded-lg border border-[var(--medium-grey)]/30 hover:border-green-500 transition-colors"
                              >
                                <div className="text-white font-medium text-sm mb-1">
                                  {template.title}
                                </div>
                                <div className="text-[var(--medium-grey)] text-xs line-clamp-2">
                                  {template.description}
                                </div>
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                  
                  <textarea
                    value={whatsappMessage}
                    onChange={(e) => setWhatsappMessage(e.target.value)}
                    className="w-full px-4 py-3 bg-[var(--navy-blue-light)] border border-[var(--medium-grey)]/30 rounded-lg text-white focus:outline-none focus:border-[var(--neon-blue)] resize-none"
                    placeholder={t("WhatsApp Message Template")}
                    rows={4}
                    required={whatsappEnabled}
                  />
                  
                  <input
                    type="url"
                    value={whatsappLandingPage}
                    onChange={(e) => setWhatsappLandingPage(e.target.value)}
                    className="w-full px-4 py-3 bg-[var(--navy-blue-light)] border border-[var(--medium-grey)]/30 rounded-lg text-white focus:outline-none focus:border-[var(--neon-blue)]"
                    placeholder={t("Landing Page URL")}
                    required={whatsappEnabled}
                  />
                </div>
              )}
            </div>
          )}
          
          {/* Navigation Buttons */}
          <div className="flex gap-3 mt-6">
            {step > 1 && (
              <button
                type="button"
                onClick={prevStep}
                disabled={loading}
                className="px-6 py-3 bg-[var(--navy-blue)] text-white rounded-lg hover:bg-[var(--navy-blue-light)] transition-colors disabled:opacity-50"
              >
                {t("Previous")}
              </button>
            )}
            
            {step < 3 ? (
              <button
                type="button"
                onClick={nextStep}
                disabled={loading}
                className="flex-1 px-6 py-3 bg-gradient-to-r from-[var(--neon-blue)] to-black text-white rounded-lg hover:from-black hover:to-[var(--neon-blue)] transition-all disabled:opacity-50"
              >
                {t("Next")}
              </button>
            ) : (
              <button
                type="submit"
                disabled={loading}
                className="flex-1 px-6 py-3 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-lg hover:from-green-600 hover:to-green-500 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    {t("Creating...")}
                  </>
                ) : (
                  <>
                    <Zap className="w-5 h-5" />
                    {t("Create Campaign")}
                  </>
                )}
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}
