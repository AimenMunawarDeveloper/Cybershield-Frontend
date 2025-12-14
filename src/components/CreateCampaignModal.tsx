"use client";

import { useState } from "react";
import { X, Users, MessageSquare, Calendar, Link, Plus, Globe } from "lucide-react";

interface CreateCampaignModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (campaignData: CampaignData) => void;
}

interface CampaignData {
  name: string;
  description: string;
  messageTemplate: string;
  landingPageUrl: string;
  targetUserIds: string[];
  scheduleDate?: string;
  language?: string;
}

interface User {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string;
}

const phishingTemplates = [
  {
    id: "banking",
    name: "Banking Verification",
    template: `Your UBL account will be blocked within 24 hours due to incomplete verification.
Click the link below to verify now:
🔗 ubl-verification-pk.com/login

Helpline: +92-301-1234567`,
  },
  {
    id: "lottery",
    name: "Lottery Prize",
    template: `You have won Rs. 50,000 through the Jazz Daily Lucky Draw.
Please send your CNIC number and JazzCash number to claim your prize!
📞 Contact: 0345-9876543`,
  },
  {
    id: "job",
    name: "Job Interview",
    template: `You have been shortlisted for a job interview.
Please pay Rs. 2000 for form verification to confirm your slot.
Send via Easypaisa: 0333-7654321
Form link: nestle-careerpk.com`,
  },
  {
    id: "delivery",
    name: "Package Delivery",
    template: `Your parcel is held due to incorrect address.
Please click below to update details and pay Rs. 150 handling charges.
🔗 tcs-tracking-pk.net`,
  },
];

export default function CreateCampaignModal({
  isOpen,
  onClose,
  onSubmit,
}: CreateCampaignModalProps) {
  const [formData, setFormData] = useState<CampaignData>({
    name: "",
    description: "",
    messageTemplate: "",
    landingPageUrl: "",
    targetUserIds: [],
    scheduleDate: "",
    language: "en",
  });
  const [selectedTemplate, setSelectedTemplate] = useState<string>("");
  const [manualUsers, setManualUsers] = useState<User[]>([]);
  const [newUserName, setNewUserName] = useState("");
  const [newUserPhone, setNewUserPhone] = useState("");
  const [showAddUserForm, setShowAddUserForm] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    console.log("Modal form submitted!");
    console.log("Form data:", formData);
    console.log("Manual users:", manualUsers);

    // Check if form is valid
    if (
      !formData.name ||
      !formData.messageTemplate ||
      !formData.landingPageUrl
    ) {
      console.log("Form validation failed - missing required fields");
      alert(
        "Please fill in all required fields including selecting a template."
      );
      return;
    }

    if (manualUsers.length === 0) {
      console.log("Form validation failed - no users added");
      alert("Please add at least one target user.");
      return;
    }

    // Include manual users in form data
    const campaignData = {
      ...formData,
      targetUserIds: manualUsers.map((user) => user._id),
      manualUsers: manualUsers, // Include manual users data
    };

    console.log("Campaign data to submit:", campaignData);

    onSubmit(campaignData);
    onClose();
    // Reset form
    setFormData({
      name: "",
      description: "",
      messageTemplate: "",
      landingPageUrl: "",
      targetUserIds: [],
      scheduleDate: "",
      language: "en",
    });
    setSelectedTemplate("");
    setManualUsers([]);
    setNewUserName("");
    setNewUserPhone("");
    setShowAddUserForm(false);
  };

  const handleAddUser = () => {
    if (newUserName.trim() && newUserPhone.trim()) {
      const newUser: User = {
        _id: `manual_${Date.now()}`, // Generate temporary ID
        firstName: newUserName.split(" ")[0] || newUserName,
        lastName: newUserName.split(" ").slice(1).join(" ") || "",
        email: "",
        phoneNumber: newUserPhone,
      };

      setManualUsers((prev) => [...prev, newUser]);
      setNewUserName("");
      setNewUserPhone("");
      setShowAddUserForm(false);
    }
  };

  const handleRemoveUser = (userId: string) => {
    setManualUsers((prev) => prev.filter((user) => user._id !== userId));
  };

  const handleTemplateSelect = (templateId: string) => {
    const template = phishingTemplates.find((t) => t.id === templateId);
    if (template) {
      setSelectedTemplate(templateId);
      setFormData((prev) => ({
        ...prev,
        messageTemplate: template.template,
        name: template.name + " Campaign",
        description: `Security awareness campaign using ${template.name.toLowerCase()} phishing simulation`,
      }));
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-[var(--navy-blue-light)] rounded-lg p-6 w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-white">Create New Campaign</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-[var(--navy-blue-lighter)] rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-white" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-white mb-3">
              <MessageSquare className="w-4 h-4 inline mr-2" />
              Choose Phishing Template{" "}
              {!selectedTemplate && <span className="text-red-400">*</span>}
            </label>
            {!selectedTemplate && (
              <div className="mb-3 p-2 bg-red-900 bg-opacity-20 border border-red-500 rounded text-red-300 text-sm">
                Please select a phishing template to continue.
              </div>
            )}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {phishingTemplates.map((template) => (
                <button
                  key={template.id}
                  type="button"
                  onClick={() => handleTemplateSelect(template.id)}
                  className={`p-3 rounded-lg border text-left transition-colors ${
                    selectedTemplate === template.id
                      ? "border-[var(--neon-blue)] bg-[var(--neon-blue)] bg-opacity-20"
                      : "border-[var(--medium-grey)] hover:border-[var(--neon-blue)]"
                  }`}
                >
                  <div className="text-sm font-medium text-white mb-1">
                    {template.name}
                  </div>
                  <div className="text-xs text-[var(--medium-grey)] line-clamp-2">
                    {template.template.split("\n")[0]}...
                  </div>
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-white mb-2">
              Campaign Name
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, name: e.target.value }))
              }
              className="w-full px-3 py-2 bg-[var(--navy-blue-lighter)] border border-[var(--medium-grey)] rounded-lg text-white placeholder-[var(--medium-grey)] focus:border-[var(--neon-blue)] focus:outline-none"
              placeholder="Enter campaign name"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-white mb-2">
              Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  description: e.target.value,
                }))
              }
              className="w-full px-3 py-2 bg-[var(--navy-blue-lighter)] border border-[var(--medium-grey)] rounded-lg text-white placeholder-[var(--medium-grey)] focus:border-[var(--neon-blue)] focus:outline-none"
              placeholder="Describe the campaign purpose"
              rows={3}
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-white mb-2">
              Message Template
            </label>
            <textarea
              value={formData.messageTemplate}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  messageTemplate: e.target.value,
                }))
              }
              className="w-full px-3 py-2 bg-[var(--navy-blue-lighter)] border border-[var(--medium-grey)] rounded-lg text-white placeholder-[var(--medium-grey)] focus:border-[var(--neon-blue)] focus:outline-none"
              placeholder="Enter the phishing simulation message"
              rows={6}
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-white mb-2">
              <Link className="w-4 h-4 inline mr-2" />
              Landing Page URL
            </label>
            <input
              type="url"
              value={formData.landingPageUrl}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  landingPageUrl: e.target.value,
                }))
              }
              className="w-full px-3 py-2 bg-[var(--navy-blue-lighter)] border border-[var(--medium-grey)] rounded-lg text-white placeholder-[var(--medium-grey)] focus:border-[var(--neon-blue)] focus:outline-none"
              placeholder="https://your-domain.com/verify"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-white mb-3">
              <Users className="w-4 h-4 inline mr-2" />
              Target Users ({manualUsers.length} selected)
            </label>
            <div className="mb-4">
              <button
                type="button"
                onClick={() => setShowAddUserForm(!showAddUserForm)}
                className="flex items-center gap-2 px-3 py-2 bg-[var(--neon-blue)] text-white rounded-lg hover:bg-[var(--neon-blue-dark)] transition-colors text-sm"
              >
                <Plus className="w-4 h-4" />
                Add User
              </button>
            </div>
            {showAddUserForm && (
              <div className="mb-4 p-4 bg-[var(--navy-blue-lighter)] rounded-lg border border-[var(--medium-grey)]">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
                  <div>
                    <label className="block text-xs text-[var(--medium-grey)] mb-1">
                      Full Name
                    </label>
                    <input
                      type="text"
                      value={newUserName}
                      onChange={(e) => setNewUserName(e.target.value)}
                      className="w-full px-3 py-2 bg-[var(--navy-blue)] border border-[var(--medium-grey)] rounded-lg text-white placeholder-[var(--medium-grey)] focus:border-[var(--neon-blue)] focus:outline-none text-sm"
                      placeholder="Enter full name"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-[var(--medium-grey)] mb-1">
                      Phone Number
                    </label>
                    <input
                      type="tel"
                      value={newUserPhone}
                      onChange={(e) => setNewUserPhone(e.target.value)}
                      className="w-full px-3 py-2 bg-[var(--navy-blue)] border border-[var(--medium-grey)] rounded-lg text-white placeholder-[var(--medium-grey)] focus:border-[var(--neon-blue)] focus:outline-none text-sm"
                      placeholder="+923001234567"
                    />
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={handleAddUser}
                    className="px-3 py-1 bg-[var(--neon-blue)] text-white rounded-lg hover:bg-[var(--neon-blue-dark)] transition-colors text-sm"
                  >
                    Add
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowAddUserForm(false);
                      setNewUserName("");
                      setNewUserPhone("");
                    }}
                    className="px-3 py-1 text-[var(--medium-grey)] hover:text-white transition-colors text-sm"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
            {manualUsers.length === 0 ? (
              <div className="text-center py-8 bg-[var(--navy-blue-lighter)] rounded-lg border border-[var(--medium-grey)]">
                <Users className="w-12 h-12 text-[var(--medium-grey)] mx-auto mb-2" />
                <div className="text-[var(--medium-grey)] text-sm">
                  No users added yet. Click &quot;Add User&quot; to get started.
                </div>
              </div>
            ) : (
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {manualUsers.map((user) => (
                  <div
                    key={user._id}
                    className="flex items-center justify-between p-3 bg-[var(--navy-blue-lighter)] rounded-lg border border-[var(--medium-grey)]"
                  >
                    <div>
                      <div className="text-sm font-medium text-white">
                        {user.firstName} {user.lastName}
                      </div>
                      <div className="text-xs text-[var(--medium-grey)]">
                        {user.phoneNumber}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemoveUser(user._id)}
                      className="p-1 text-[var(--crimson-red)] hover:text-red-300 transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-white mb-2">
              <Calendar className="w-4 h-4 inline mr-2" />
              Schedule Date (Optional)
            </label>
            <input
              type="datetime-local"
              value={formData.scheduleDate}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  scheduleDate: e.target.value,
                }))
              }
              className="w-full px-3 py-2 bg-[var(--navy-blue-lighter)] border border-[var(--medium-grey)] rounded-lg text-white placeholder-[var(--medium-grey)] focus:border-[var(--neon-blue)] focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-white mb-2">
              <Globe className="w-4 h-4 inline mr-2" />
              Language
            </label>
            <select
              value={formData.language || "en"}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  language: e.target.value,
                }))
              }
              className="w-full px-3 py-2 bg-[var(--navy-blue-lighter)] border border-[var(--medium-grey)] rounded-lg text-white focus:border-[var(--neon-blue)] focus:outline-none"
            >
              <option value="en">English</option>
              <option value="ur">Urdu</option>
            </select>
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
              onClick={() => console.log("Create Campaign button clicked!")}
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
