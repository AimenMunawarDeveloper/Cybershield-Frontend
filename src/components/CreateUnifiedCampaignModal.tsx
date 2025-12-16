"use client";

import { useState, useEffect } from "react";
import { X, Users, Plus, Trash2, Mail, MessageSquare, Calendar, Zap } from "lucide-react";
import { useAuth } from "@clerk/nextjs";
import { useTranslation } from "@/hooks/useTranslation";

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

export default function CreateUnifiedCampaignModal({
  isOpen,
  onClose,
  onSuccess,
}: CreateUnifiedCampaignModalProps) {
  const { t } = useTranslation();
  const { getToken } = useAuth();
  
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
  
  // Target users
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
  const [emailSubject, setEmailSubject] = useState("");
  const [emailBody, setEmailBody] = useState("");
  const [emailSender, setEmailSender] = useState("");
  const [emailLandingPage, setEmailLandingPage] = useState("");
  
  // Reset form
  const resetForm = () => {
    setStep(1);
    setName("");
    setDescription("");
    setScheduleDate("");
    setWhatsappEnabled(false);
    setEmailEnabled(false);
    setManualUsers([]);
    setWhatsappMessage("");
    setWhatsappLandingPage("");
    setEmailSubject("");
    setEmailBody("");
    setEmailSender("");
    setEmailLandingPage("");
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
    
    if (manualUsers.length === 0) {
      setError(t("Please add at least one target user"));
      return;
    }
    
    if (whatsappEnabled && (!whatsappMessage || !whatsappLandingPage)) {
      setError(t("Please fill in WhatsApp configuration"));
      return;
    }
    
    if (emailEnabled && (!emailSubject || !emailBody || !emailSender)) {
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
          senderEmail: emailSender,
          landingPageUrl: emailLandingPage,
        } : { enabled: false },
        manualUsers: manualUsers.map(user => ({
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email || "",
          phoneNumber: user.phoneNumber || "",
        })),
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
      if (manualUsers.length === 0) {
        setError(t("Please add at least one target user"));
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
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-white">
                  {t("Target Users")} ({manualUsers.length})
                </h3>
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
                  
                  <input
                    type="email"
                    value={emailSender}
                    onChange={(e) => setEmailSender(e.target.value)}
                    className="w-full px-4 py-3 bg-[var(--navy-blue-light)] border border-[var(--medium-grey)]/30 rounded-lg text-white focus:outline-none focus:border-[var(--neon-blue)]"
                    placeholder={t("Sender Email")}
                    required={emailEnabled}
                  />
                  
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
