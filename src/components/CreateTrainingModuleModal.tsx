"use client";

import { useState } from "react";
import {
  X,
  BookOpen,
  Upload,
  Target,
  Clock,
  Users,
  FileText,
  Video,
  Image,
  File,
  Plus,
  Trash2,
} from "lucide-react";

interface CreateTrainingModuleModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (moduleData: TrainingModuleData) => void;
}

interface TrainingModuleData {
  title: string;
  description: string;
  category: string;
  difficulty: string;
  duration: number;
  learningObjectives: string[];
  content: string;
  attachments: File[];
  targetAudience: string[];
  prerequisites: string[];
  tags: string[];
  isPublished: boolean;
}

interface TrainingCategory {
  id: string;
  name: string;
  description: string;
  icon: string;
}

const trainingCategories: TrainingCategory[] = [
  {
    id: "phishing",
    name: "Phishing Awareness",
    description: "Learn to identify and avoid phishing attacks",
    icon: "🎣",
  },
  {
    id: "password",
    name: "Password Security",
    description: "Best practices for password management",
    icon: "🔐",
  },
  {
    id: "social-engineering",
    name: "Social Engineering",
    description: "Understanding manipulation tactics",
    icon: "🎭",
  },
  {
    id: "malware",
    name: "Malware Protection",
    description: "Defending against malicious software",
    icon: "🛡️",
  },
  {
    id: "data-protection",
    name: "Data Protection",
    description: "Safeguarding sensitive information",
    icon: "📊",
  },
  {
    id: "incident-response",
    name: "Incident Response",
    description: "How to respond to security incidents",
    icon: "🚨",
  },
];

const difficultyLevels = [
  {
    value: "beginner",
    label: "Beginner",
    description: "Basic concepts and fundamentals",
  },
  {
    value: "intermediate",
    label: "Intermediate",
    description: "Some prior knowledge required",
  },
  { value: "advanced", label: "Advanced", description: "Expert-level content" },
];

const targetAudiences = [
  "All Employees",
  "IT Staff",
  "Management",
  "New Hires",
  "Contractors",
  "Remote Workers",
];

export default function CreateTrainingModuleModal({
  isOpen,
  onClose,
  onSubmit,
}: CreateTrainingModuleModalProps) {
  const [formData, setFormData] = useState<TrainingModuleData>({
    title: "",
    description: "",
    category: "",
    difficulty: "",
    duration: 30,
    learningObjectives: [""],
    content: "",
    attachments: [],
    targetAudience: [],
    prerequisites: [],
    tags: [],
    isPublished: false,
  });

  const [newObjective, setNewObjective] = useState("");
  const [newPrerequisite, setNewPrerequisite] = useState("");
  const [newTag, setNewTag] = useState("");
  const [showAddObjective, setShowAddObjective] = useState(false);
  const [showAddPrerequisite, setShowAddPrerequisite] = useState(false);
  const [showAddTag, setShowAddTag] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    console.log("Training module form submitted!");
    console.log("Form data:", formData);

    // Check if form is valid
    if (
      !formData.title ||
      !formData.description ||
      !formData.category ||
      !formData.difficulty ||
      !formData.content
    ) {
      console.log("Form validation failed - missing required fields");
      alert("Please fill in all required fields.");
      return;
    }

    if (
      formData.learningObjectives.length === 0 ||
      formData.learningObjectives[0] === ""
    ) {
      console.log("Form validation failed - no learning objectives");
      alert("Please add at least one learning objective.");
      return;
    }

    console.log("Training module data to submit:", formData);
    onSubmit(formData);
    onClose();
    resetForm();
  };

  const resetForm = () => {
    setFormData({
      title: "",
      description: "",
      category: "",
      difficulty: "",
      duration: 30,
      learningObjectives: [""],
      content: "",
      attachments: [],
      targetAudience: [],
      prerequisites: [],
      tags: [],
      isPublished: false,
    });
    setNewObjective("");
    setNewPrerequisite("");
    setNewTag("");
    setShowAddObjective(false);
    setShowAddPrerequisite(false);
    setShowAddTag(false);
  };

  const handleAddObjective = () => {
    if (newObjective.trim()) {
      setFormData((prev) => ({
        ...prev,
        learningObjectives: [
          ...prev.learningObjectives.filter((obj) => obj !== ""),
          newObjective.trim(),
        ],
      }));
      setNewObjective("");
      setShowAddObjective(false);
    }
  };

  const handleRemoveObjective = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      learningObjectives: prev.learningObjectives.filter((_, i) => i !== index),
    }));
  };

  const handleAddPrerequisite = () => {
    if (newPrerequisite.trim()) {
      setFormData((prev) => ({
        ...prev,
        prerequisites: [...prev.prerequisites, newPrerequisite.trim()],
      }));
      setNewPrerequisite("");
      setShowAddPrerequisite(false);
    }
  };

  const handleRemovePrerequisite = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      prerequisites: prev.prerequisites.filter((_, i) => i !== index),
    }));
  };

  const handleAddTag = () => {
    if (newTag.trim()) {
      setFormData((prev) => ({
        ...prev,
        tags: [...prev.tags, newTag.trim()],
      }));
      setNewTag("");
      setShowAddTag(false);
    }
  };

  const handleRemoveTag = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      tags: prev.tags.filter((_, i) => i !== index),
    }));
  };

  const handleTargetAudienceChange = (audience: string) => {
    setFormData((prev) => ({
      ...prev,
      targetAudience: prev.targetAudience.includes(audience)
        ? prev.targetAudience.filter((a) => a !== audience)
        : [...prev.targetAudience, audience],
    }));
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setFormData((prev) => ({
      ...prev,
      attachments: [...prev.attachments, ...files],
    }));
  };

  const handleRemoveAttachment = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      attachments: prev.attachments.filter((_, i) => i !== index),
    }));
  };

  const getFileIcon = (file: File) => {
    const type = file.type;
    if (type.startsWith("video/")) return <Video className="w-4 h-4" />;
    if (type.startsWith("image/")) return <Image className="w-4 h-4" />;
    if (type.includes("pdf")) return <FileText className="w-4 h-4" />;
    return <File className="w-4 h-4" />;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-[var(--navy-blue-light)] rounded-lg p-6 w-full max-w-4xl mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-white">
            Create New Training Module
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-[var(--navy-blue-lighter)] rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-white" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-white mb-2">
                Module Title <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, title: e.target.value }))
                }
                className="w-full px-3 py-2 bg-[var(--navy-blue-lighter)] border border-[var(--medium-grey)] rounded-lg text-white placeholder-[var(--medium-grey)] focus:border-[var(--neon-blue)] focus:outline-none"
                placeholder="Enter module title"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-white mb-2">
                <Clock className="w-4 h-4 inline mr-2" />
                Duration (minutes)
              </label>
              <input
                type="number"
                value={formData.duration}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    duration: parseInt(e.target.value) || 30,
                  }))
                }
                className="w-full px-3 py-2 bg-[var(--navy-blue-lighter)] border border-[var(--medium-grey)] rounded-lg text-white placeholder-[var(--medium-grey)] focus:border-[var(--neon-blue)] focus:outline-none"
                min="5"
                max="300"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-white mb-2">
              Description <span className="text-red-400">*</span>
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
              placeholder="Describe what this training module covers"
              rows={3}
              required
            />
          </div>

          {/* Category Selection */}
          <div>
            <label className="block text-sm font-medium text-white mb-3">
              <BookOpen className="w-4 h-4 inline mr-2" />
              Training Category <span className="text-red-400">*</span>
            </label>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {trainingCategories.map((category) => (
                <button
                  key={category.id}
                  type="button"
                  onClick={() =>
                    setFormData((prev) => ({ ...prev, category: category.id }))
                  }
                  className={`p-4 rounded-lg border text-left transition-colors ${
                    formData.category === category.id
                      ? "border-[var(--neon-blue)] bg-[var(--neon-blue)] bg-opacity-20"
                      : "border-[var(--medium-grey)] hover:border-[var(--neon-blue)]"
                  }`}
                >
                  <div className="text-2xl mb-2">{category.icon}</div>
                  <div className="text-sm font-medium text-white mb-1">
                    {category.name}
                  </div>
                  <div className="text-xs text-[var(--medium-grey)]">
                    {category.description}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Difficulty Level */}
          <div>
            <label className="block text-sm font-medium text-white mb-3">
              <Target className="w-4 h-4 inline mr-2" />
              Difficulty Level <span className="text-red-400">*</span>
            </label>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {difficultyLevels.map((level) => (
                <button
                  key={level.value}
                  type="button"
                  onClick={() =>
                    setFormData((prev) => ({
                      ...prev,
                      difficulty: level.value,
                    }))
                  }
                  className={`p-4 rounded-lg border text-left transition-colors ${
                    formData.difficulty === level.value
                      ? "border-[var(--neon-blue)] bg-[var(--neon-blue)] bg-opacity-20"
                      : "border-[var(--medium-grey)] hover:border-[var(--neon-blue)]"
                  }`}
                >
                  <div className="text-sm font-medium text-white mb-1">
                    {level.label}
                  </div>
                  <div className="text-xs text-[var(--medium-grey)]">
                    {level.description}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Learning Objectives */}
          <div>
            <label className="block text-sm font-medium text-white mb-3">
              <Target className="w-4 h-4 inline mr-2" />
              Learning Objectives <span className="text-red-400">*</span>
            </label>
            <div className="space-y-2">
              {formData.learningObjectives.map((objective, index) => (
                <div key={index} className="flex items-center gap-2">
                  <div className="flex-1 px-3 py-2 bg-[var(--navy-blue-lighter)] border border-[var(--medium-grey)] rounded-lg text-white">
                    {objective}
                  </div>
                  <button
                    type="button"
                    onClick={() => handleRemoveObjective(index)}
                    className="p-2 text-[var(--crimson-red)] hover:text-red-300 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
              {showAddObjective ? (
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={newObjective}
                    onChange={(e) => setNewObjective(e.target.value)}
                    className="flex-1 px-3 py-2 bg-[var(--navy-blue-lighter)] border border-[var(--medium-grey)] rounded-lg text-white placeholder-[var(--medium-grey)] focus:border-[var(--neon-blue)] focus:outline-none"
                    placeholder="Enter learning objective"
                    autoFocus
                  />
                  <button
                    type="button"
                    onClick={handleAddObjective}
                    className="px-3 py-2 bg-[var(--neon-blue)] text-white rounded-lg hover:bg-[var(--neon-blue-dark)] transition-colors"
                  >
                    Add
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowAddObjective(false);
                      setNewObjective("");
                    }}
                    className="px-3 py-2 text-[var(--medium-grey)] hover:text-white transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setShowAddObjective(true)}
                  className="flex items-center gap-2 px-3 py-2 bg-[var(--neon-blue)] text-white rounded-lg hover:bg-[var(--neon-blue-dark)] transition-colors text-sm"
                >
                  <Plus className="w-4 h-4" />
                  Add Objective
                </button>
              )}
            </div>
          </div>

          {/* Target Audience */}
          <div>
            <label className="block text-sm font-medium text-white mb-3">
              <Users className="w-4 h-4 inline mr-2" />
              Target Audience
            </label>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              {targetAudiences.map((audience) => (
                <label
                  key={audience}
                  className="flex items-center gap-2 cursor-pointer"
                >
                  <input
                    type="checkbox"
                    checked={formData.targetAudience.includes(audience)}
                    onChange={() => handleTargetAudienceChange(audience)}
                    className="w-4 h-4 text-[var(--neon-blue)] bg-[var(--navy-blue-lighter)] border-[var(--medium-grey)] rounded focus:ring-[var(--neon-blue)]"
                  />
                  <span className="text-sm text-white">{audience}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Prerequisites */}
          <div>
            <label className="block text-sm font-medium text-white mb-3">
              Prerequisites
            </label>
            <div className="space-y-2">
              {formData.prerequisites.map((prerequisite, index) => (
                <div key={index} className="flex items-center gap-2">
                  <div className="flex-1 px-3 py-2 bg-[var(--navy-blue-lighter)] border border-[var(--medium-grey)] rounded-lg text-white">
                    {prerequisite}
                  </div>
                  <button
                    type="button"
                    onClick={() => handleRemovePrerequisite(index)}
                    className="p-2 text-[var(--crimson-red)] hover:text-red-300 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
              {showAddPrerequisite ? (
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={newPrerequisite}
                    onChange={(e) => setNewPrerequisite(e.target.value)}
                    className="flex-1 px-3 py-2 bg-[var(--navy-blue-lighter)] border border-[var(--medium-grey)] rounded-lg text-white placeholder-[var(--medium-grey)] focus:border-[var(--neon-blue)] focus:outline-none"
                    placeholder="Enter prerequisite"
                    autoFocus
                  />
                  <button
                    type="button"
                    onClick={handleAddPrerequisite}
                    className="px-3 py-2 bg-[var(--neon-blue)] text-white rounded-lg hover:bg-[var(--neon-blue-dark)] transition-colors"
                  >
                    Add
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowAddPrerequisite(false);
                      setNewPrerequisite("");
                    }}
                    className="px-3 py-2 text-[var(--medium-grey)] hover:text-white transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setShowAddPrerequisite(true)}
                  className="flex items-center gap-2 px-3 py-2 bg-[var(--neon-blue)] text-white rounded-lg hover:bg-[var(--neon-blue-dark)] transition-colors text-sm"
                >
                  <Plus className="w-4 h-4" />
                  Add Prerequisite
                </button>
              )}
            </div>
          </div>

          {/* Content */}
          <div>
            <label className="block text-sm font-medium text-white mb-2">
              Training Content <span className="text-red-400">*</span>
            </label>
            <textarea
              value={formData.content}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, content: e.target.value }))
              }
              className="w-full px-3 py-2 bg-[var(--navy-blue-lighter)] border border-[var(--medium-grey)] rounded-lg text-white placeholder-[var(--medium-grey)] focus:border-[var(--neon-blue)] focus:outline-none"
              placeholder="Enter the main training content, instructions, and materials"
              rows={8}
              required
            />
          </div>

          {/* File Attachments */}
          <div>
            <label className="block text-sm font-medium text-white mb-3">
              <Upload className="w-4 h-4 inline mr-2" />
              Attachments
            </label>
            <div className="mb-4">
              <input
                type="file"
                multiple
                onChange={handleFileUpload}
                className="hidden"
                id="file-upload"
                accept=".pdf,.doc,.docx,.ppt,.pptx,.mp4,.avi,.mov,.jpg,.jpeg,.png,.gif"
              />
              <label
                htmlFor="file-upload"
                className="flex items-center gap-2 px-4 py-2 bg-[var(--neon-blue)] text-white rounded-lg hover:bg-[var(--neon-blue-dark)] transition-colors cursor-pointer"
              >
                <Upload className="w-4 h-4" />
                Upload Files
              </label>
            </div>
            {formData.attachments.length > 0 && (
              <div className="space-y-2 max-h-32 overflow-y-auto">
                {formData.attachments.map((file, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-3 bg-[var(--navy-blue-lighter)] rounded-lg border border-[var(--medium-grey)]"
                  >
                    <div className="flex items-center gap-2">
                      {getFileIcon(file)}
                      <div>
                        <div className="text-sm font-medium text-white">
                          {file.name}
                        </div>
                        <div className="text-xs text-[var(--medium-grey)]">
                          {(file.size / 1024 / 1024).toFixed(2)} MB
                        </div>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemoveAttachment(index)}
                      className="p-1 text-[var(--crimson-red)] hover:text-red-300 transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Tags */}
          <div>
            <label className="block text-sm font-medium text-white mb-3">
              Tags
            </label>
            <div className="space-y-2">
              {formData.tags.map((tag, index) => (
                <div key={index} className="flex items-center gap-2">
                  <div className="flex-1 px-3 py-2 bg-[var(--navy-blue-lighter)] border border-[var(--medium-grey)] rounded-lg text-white">
                    {tag}
                  </div>
                  <button
                    type="button"
                    onClick={() => handleRemoveTag(index)}
                    className="p-2 text-[var(--crimson-red)] hover:text-red-300 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
              {showAddTag ? (
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={newTag}
                    onChange={(e) => setNewTag(e.target.value)}
                    className="flex-1 px-3 py-2 bg-[var(--navy-blue-lighter)] border border-[var(--medium-grey)] rounded-lg text-white placeholder-[var(--medium-grey)] focus:border-[var(--neon-blue)] focus:outline-none"
                    placeholder="Enter tag"
                    autoFocus
                  />
                  <button
                    type="button"
                    onClick={handleAddTag}
                    className="px-3 py-2 bg-[var(--neon-blue)] text-white rounded-lg hover:bg-[var(--neon-blue-dark)] transition-colors"
                  >
                    Add
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowAddTag(false);
                      setNewTag("");
                    }}
                    className="px-3 py-2 text-[var(--medium-grey)] hover:text-white transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setShowAddTag(true)}
                  className="flex items-center gap-2 px-3 py-2 bg-[var(--neon-blue)] text-white rounded-lg hover:bg-[var(--neon-blue-dark)] transition-colors text-sm"
                >
                  <Plus className="w-4 h-4" />
                  Add Tag
                </button>
              )}
            </div>
          </div>

          {/* Publish Status */}
          <div>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.isPublished}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    isPublished: e.target.checked,
                  }))
                }
                className="w-4 h-4 text-[var(--neon-blue)] bg-[var(--navy-blue-lighter)] border-[var(--medium-grey)] rounded focus:ring-[var(--neon-blue)]"
              />
              <span className="text-sm text-white">Publish immediately</span>
            </label>
          </div>

          {/* Form Actions */}
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
              className="px-6 py-2 bg-[var(--neon-blue)] text-white rounded-lg hover:bg-[var(--neon-blue-dark)] transition-colors"
            >
              Create Training Module
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
