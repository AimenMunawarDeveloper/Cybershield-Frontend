"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@clerk/nextjs";
import {
  X,
  Plus,
  Trash2,
  ChevronDown,
  ChevronRight,
  HelpCircle,
  Link as LinkIcon,
  Award,
  Image as ImageIcon,
  Video,
  Upload,
  Loader2,
} from "lucide-react";
import { AVAILABLE_BADGES, getBadgeIcon } from "@/lib/courseBadges";

// Media item (image or video)
export interface MediaItem {
  type: 'image' | 'video';
  url: string;
  alt?: string;
  caption?: string;
}

// Section inside a module (content only; URLs etc.)
export interface ModuleSection {
  title: string;
  material: string;
  urls: string[];
  media?: MediaItem[];
}

// Single quiz question (MCQ)
export interface QuizQuestion {
  question: string;
  choices: string[];
  correctIndex: number;
}

// One module: title, sections (content), then quiz
export interface CourseModule {
  title: string;
  sections: ModuleSection[];
  quiz: QuizQuestion[];
}

export type CourseLevel = "basic" | "advanced";

export interface TrainingModuleData {
  courseTitle: string;
  description: string;
  level: CourseLevel;
  badges: string[];
  modules: CourseModule[];
}

interface CreateTrainingModuleModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: TrainingModuleData) => void;
  /** When set, modal is in edit mode: prefill with this data and show "Save changes" */
  initialData?: TrainingModuleData | null;
  /** When set with initialData, form submit is treated as update for this course id */
  courseId?: string | null;
}

const emptySection = (): ModuleSection => ({
  title: "",
  material: "",
  urls: [],
  media: [],
});

const emptyQuizQuestion = (): QuizQuestion => ({
  question: "",
  choices: [""],
  correctIndex: 0,
});

const emptyModule = (): CourseModule => ({
  title: "",
  sections: [emptySection()],
  quiz: [],
});

export default function CreateTrainingModuleModal({
  isOpen,
  onClose,
  onSubmit,
  initialData = null,
  courseId = null,
}: CreateTrainingModuleModalProps) {
  const { getToken } = useAuth();
  const [courseTitle, setCourseTitle] = useState("");
  const [description, setDescription] = useState("");
  const [level, setLevel] = useState<"basic" | "advanced">("basic");
  const [selectedBadges, setSelectedBadges] = useState<string[]>([]);
  const [modules, setModules] = useState<CourseModule[]>([emptyModule()]);
  const [expandedModule, setExpandedModule] = useState<number>(0);
  const [expandedQuiz, setExpandedQuiz] = useState<number | null>(null);

  const isEditMode = Boolean(courseId && initialData);

  useEffect(() => {
    if (!isOpen) return;
    if (initialData) {
      setCourseTitle(initialData.courseTitle);
      setDescription(initialData.description ?? "");
      setLevel(initialData.level === "advanced" ? "advanced" : "basic");
      setSelectedBadges(initialData.badges ?? []);
      const mods = initialData.modules?.length
        ? initialData.modules.map((m) => ({
            title: m.title ?? "",
            sections:
              m.sections?.length > 0
                ? m.sections.map((s) => ({
                    title: s.title ?? "",
                    material: s.material ?? "",
                    urls: Array.isArray(s.urls) ? s.urls : [],
                  }))
                : [emptySection()],
            quiz: Array.isArray(m.quiz)
              ? m.quiz.map((q) => ({
                  question: q.question ?? "",
                  choices: Array.isArray(q.choices) && q.choices.length > 0 ? q.choices : [""],
                  correctIndex: typeof q.correctIndex === "number" ? q.correctIndex : 0,
                }))
              : [],
          }))
        : [emptyModule()];
      setModules(mods);
      setExpandedModule(0);
      setExpandedQuiz(null);
    } else {
      setCourseTitle("");
      setDescription("");
      setLevel("basic");
      setSelectedBadges([]);
      setModules([emptyModule()]);
      setExpandedModule(0);
      setExpandedQuiz(null);
    }
  }, [isOpen, initialData]);

  const toggleBadge = (badgeId: string) => {
    setSelectedBadges((prev) =>
      prev.includes(badgeId) ? prev.filter((b) => b !== badgeId) : [...prev, badgeId]
    );
  };

  const addModule = () => {
    setModules((prev) => [...prev, emptyModule()]);
    setExpandedModule(modules.length);
  };

  const removeModule = (index: number) => {
    setModules((prev) => prev.filter((_, i) => i !== index));
    setExpandedModule((prev) => (prev >= index && prev > 0 ? prev - 1 : prev));
    if (expandedQuiz !== null && expandedQuiz >= index) {
      setExpandedQuiz(expandedQuiz === index ? null : expandedQuiz - 1);
    }
  };

  const updateModule = (index: number, patch: Partial<CourseModule>) => {
    setModules((prev) =>
      prev.map((m, i) => (i === index ? { ...m, ...patch } : m))
    );
  };

  const addSection = (moduleIndex: number) => {
    const mod = modules[moduleIndex];
    updateModule(moduleIndex, { sections: [...mod.sections, emptySection()] });
  };

  const updateSection = (
    moduleIndex: number,
    sectionIndex: number,
    patch: Partial<ModuleSection>
  ) => {
    const mod = modules[moduleIndex];
    const sections = [...mod.sections];
    sections[sectionIndex] = { ...sections[sectionIndex], ...patch };
    updateModule(moduleIndex, { sections });
  };

  const removeSection = (moduleIndex: number, sectionIndex: number) => {
    const mod = modules[moduleIndex];
    if (mod.sections.length <= 1) return;
    const sections = mod.sections.filter((_, i) => i !== sectionIndex);
    updateModule(moduleIndex, { sections });
  };

  const addSectionUrl = (moduleIndex: number, sectionIndex: number) => {
    const section = modules[moduleIndex].sections[sectionIndex];
    updateSection(moduleIndex, sectionIndex, {
      urls: [...section.urls, ""],
    });
  };

  const updateSectionUrl = (
    moduleIndex: number,
    sectionIndex: number,
    urlIndex: number,
    value: string
  ) => {
    const section = modules[moduleIndex].sections[sectionIndex];
    const urls = [...section.urls];
    urls[urlIndex] = value;
    updateSection(moduleIndex, sectionIndex, { urls });
  };

  const removeSectionUrl = (
    moduleIndex: number,
    sectionIndex: number,
    urlIndex: number
  ) => {
    const section = modules[moduleIndex].sections[sectionIndex];
    const urls = section.urls.filter((_, i) => i !== urlIndex);
    updateSection(moduleIndex, sectionIndex, { urls });
  };

  const [uploading, setUploading] = useState<Record<string, boolean>>({});

  const handleMediaUpload = async (
    moduleIndex: number,
    sectionIndex: number,
    file: File
  ) => {
    const uploadKey = `${moduleIndex}-${sectionIndex}-${file.name}`;
    setUploading((prev) => ({ ...prev, [uploadKey]: true }));

    try {
      const token = await getToken();
      if (!token) {
        throw new Error('Authentication required');
      }

      const formData = new FormData();
      formData.append('file', file);

      const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001/api';
      const response = await fetch(`${API_BASE_URL}/upload`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Upload failed');
      }

      const data = await response.json();
      const section = modules[moduleIndex].sections[sectionIndex];
      const media = section.media || [];
      
      updateSection(moduleIndex, sectionIndex, {
        media: [
          ...media,
          {
            type: data.type,
            url: data.url,
            alt: file.name,
            caption: '',
          },
        ],
      });
    } catch (error) {
      console.error('Upload error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to upload file. Please try again.';
      alert(errorMessage);
    } finally {
      setUploading((prev) => {
        const next = { ...prev };
        delete next[uploadKey];
        return next;
      });
    }
  };

  const removeMedia = (
    moduleIndex: number,
    sectionIndex: number,
    mediaIndex: number
  ) => {
    const section = modules[moduleIndex].sections[sectionIndex];
    const media = (section.media || []).filter((_, i) => i !== mediaIndex);
    updateSection(moduleIndex, sectionIndex, { media });
  };

  const updateMedia = (
    moduleIndex: number,
    sectionIndex: number,
    mediaIndex: number,
    patch: Partial<MediaItem>
  ) => {
    const section = modules[moduleIndex].sections[sectionIndex];
    const media = [...(section.media || [])];
    media[mediaIndex] = { ...media[mediaIndex], ...patch };
    updateSection(moduleIndex, sectionIndex, { media });
  };

  const addQuizToModule = (moduleIndex: number) => {
    const mod = modules[moduleIndex];
    updateModule(moduleIndex, { quiz: [...mod.quiz, emptyQuizQuestion()] });
    setExpandedQuiz(moduleIndex);
  };

  const updateQuizQuestion = (
    moduleIndex: number,
    questionIndex: number,
    patch: Partial<QuizQuestion>
  ) => {
    const mod = modules[moduleIndex];
    const quiz = [...mod.quiz];
    quiz[questionIndex] = { ...quiz[questionIndex], ...patch };
    updateModule(moduleIndex, { quiz });
  };

  const removeQuizQuestion = (moduleIndex: number, questionIndex: number) => {
    const mod = modules[moduleIndex];
    const quiz = mod.quiz.filter((_, i) => i !== questionIndex);
    updateModule(moduleIndex, { quiz });
  };

  const addQuizChoice = (moduleIndex: number, questionIndex: number) => {
    const q = modules[moduleIndex].quiz[questionIndex];
    updateQuizQuestion(moduleIndex, questionIndex, {
      choices: [...q.choices, ""],
    });
  };

  const updateQuizChoice = (
    moduleIndex: number,
    questionIndex: number,
    choiceIndex: number,
    value: string
  ) => {
    const q = modules[moduleIndex].quiz[questionIndex];
    const choices = [...q.choices];
    choices[choiceIndex] = value;
    updateQuizQuestion(moduleIndex, questionIndex, { choices });
  };

  const removeQuizChoice = (
    moduleIndex: number,
    questionIndex: number,
    choiceIndex: number
  ) => {
    const q = modules[moduleIndex].quiz[questionIndex];
    if (q.choices.length <= 1) return;
    const choices = q.choices.filter((_, i) => i !== choiceIndex);
    const correctIndex =
      q.correctIndex >= choices.length
        ? choices.length - 1
        : q.correctIndex > choiceIndex
          ? q.correctIndex - 1
          : q.correctIndex;
    updateQuizQuestion(moduleIndex, questionIndex, {
      choices,
      correctIndex,
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!courseTitle.trim()) {
      alert("Please enter a course title.");
      return;
    }
    const hasModule = modules.some(
      (m) =>
        m.title.trim() &&
        (m.sections.some((s) => s.title.trim() || s.material.trim()) ||
          m.quiz.some((q) => q.question.trim() && q.choices.some((c) => c.trim())))
    );
    if (!hasModule) {
      alert("Please add at least one module with a title and either sections or quiz questions.");
      return;
    }
    const data: TrainingModuleData = {
      courseTitle: courseTitle.trim(),
      description: description.trim(),
      level,
      badges: selectedBadges,
      modules: modules.map((m) => ({
        title: m.title.trim(),
        sections: m.sections
          .map((s) => ({
            title: s.title.trim(),
            material: s.material.trim(),
            urls: s.urls.map((u) => u.trim()).filter(Boolean),
            media: Array.isArray(s.media) ? s.media : [],
          }))
          .filter((s) => s.title || s.material || s.urls.length > 0 || (s.media && s.media.length > 0)),
        quiz: m.quiz
          .map((q) => ({
            question: q.question.trim(),
            choices: q.choices.filter((c) => c.trim()),
            correctIndex: Math.min(
              q.correctIndex,
              q.choices.filter((c) => c.trim()).length - 1
            ),
          }))
          .filter((q) => q.question && q.choices.length > 0),
      })),
    };
    onSubmit(data);
    resetForm();
    onClose();
  };

  const resetForm = () => {
    setCourseTitle("");
    setDescription("");
    setLevel("basic");
    setSelectedBadges([]);
    setModules([emptyModule()]);
    setExpandedModule(0);
    setExpandedQuiz(null);
  };

  if (!isOpen) return null;

  const inputClass =
    "w-full px-3 py-2 bg-[var(--navy-blue-lighter)] border border-[var(--medium-grey)] rounded-lg text-white placeholder-[var(--medium-grey)] focus:border-[var(--neon-blue)] focus:outline-none";
  const labelClass = "block text-sm font-medium text-white mb-2";

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div className="bg-[var(--navy-blue-light)] rounded-xl p-6 w-full max-w-3xl max-h-[90vh] overflow-y-auto shadow-xl border border-[var(--medium-grey)]">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-white">{isEditMode ? "Edit Course" : "Add Course"}</h2>
          <button
            type="button"
            onClick={() => {
              resetForm();
              onClose();
            }}
            className="p-2 hover:bg-[var(--navy-blue-lighter)] rounded-lg transition-colors text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Course title & description */}
          <div className="space-y-4">
            <div>
              <label className={labelClass}>
                Course title <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                value={courseTitle}
                onChange={(e) => setCourseTitle(e.target.value)}
                className={inputClass}
                placeholder="e.g. Cybersecurity Fundamentals"
                required
              />
            </div>
            <div>
              <label className={labelClass}>Description (optional)</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className={inputClass}
                placeholder="Brief description of the course"
                rows={2}
              />
            </div>
            <div>
              <label className={labelClass}>Level</label>
              <div className="flex gap-3 mt-2">
                <button
                  type="button"
                  onClick={() => setLevel("basic")}
                  className={`flex-1 px-4 py-2.5 rounded-lg border-2 text-sm font-medium transition-colors ${
                    level === "basic"
                      ? "border-[var(--neon-blue)] bg-[var(--neon-blue)]/20 text-white"
                      : "border-[var(--medium-grey)] text-[var(--medium-grey)] hover:border-white/50 hover:text-white"
                  }`}
                >
                  Basic
                </button>
                <button
                  type="button"
                  onClick={() => setLevel("advanced")}
                  className={`flex-1 px-4 py-2.5 rounded-lg border-2 text-sm font-medium transition-colors ${
                    level === "advanced"
                      ? "border-[var(--neon-blue)] bg-[var(--neon-blue)]/20 text-white"
                      : "border-[var(--medium-grey)] text-[var(--medium-grey)] hover:border-white/50 hover:text-white"
                  }`}
                >
                  Advanced
                </button>
              </div>
            </div>
          </div>

          {/* Badges */}
          <div>
            <label className={labelClass + " flex items-center gap-2 mb-3"}>
              <Award className="w-4 h-4 text-[var(--neon-blue)]" />
              Badges (optional)
            </label>
            <p className="text-sm text-[var(--medium-grey)] mb-3">
              Click a badge to select or deselect. Selected badges will appear in the course sidebar.
            </p>
            <div className="flex flex-wrap gap-3">
              {AVAILABLE_BADGES.map((badge) => {
                const Icon = getBadgeIcon(badge.id);
                const isSelected = selectedBadges.includes(badge.id);
                return (
                  <button
                    key={badge.id}
                    type="button"
                    onClick={() => toggleBadge(badge.id)}
                    className={`flex flex-col items-center justify-center rounded-xl border-2 p-3 w-24 min-h-[4.5rem] transition-all hover:shadow-md ${
                      isSelected
                        ? "border-[var(--neon-blue)] bg-[var(--neon-blue)]/20 ring-2 ring-[var(--neon-blue)]/50"
                        : "border-[var(--medium-grey)] bg-[var(--navy-blue-lighter)]/50 hover:border-[var(--neon-blue)]/60"
                    }`}
                    title={isSelected ? "Click to deselect" : "Click to select"}
                  >
                    <div
                      className={`flex items-center justify-center w-9 h-9 rounded-full mb-1.5 ${
                        isSelected ? "bg-[var(--neon-blue)]/30" : "bg-[var(--neon-blue)]/10"
                      }`}
                    >
                      {Icon ? (
                        <Icon
                          className={`w-5 h-5 flex-shrink-0 ${
                            isSelected ? "text-[var(--neon-blue)]" : "text-[var(--medium-grey)]"
                          }`}
                        />
                      ) : null}
                    </div>
                    <span
                      className={`text-[10px] font-medium text-center leading-tight line-clamp-2 px-0.5 ${
                        isSelected ? "text-white" : "text-[var(--medium-grey)]"
                      }`}
                    >
                      {badge.label}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Modules (accordion style like the image) */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className={labelClass + " mb-0"}>Modules</span>
              <button
                type="button"
                onClick={addModule}
                className="flex items-center gap-2 px-3 py-2 bg-[var(--neon-blue)] text-white rounded-lg hover:bg-[var(--neon-blue-dark)] transition-colors text-sm"
              >
                <Plus className="w-4 h-4" />
                Add module
              </button>
            </div>

            <div className="space-y-2">
              {modules.map((mod, moduleIndex) => {
                const isExpanded = expandedModule === moduleIndex;
                const isQuizExpanded = expandedQuiz === moduleIndex;
                return (
                  <div
                    key={moduleIndex}
                    className="rounded-lg border border-[var(--medium-grey)] bg-[var(--navy-blue-lighter)]/30 overflow-hidden"
                  >
                    {/* Module header - accordion */}
                    <div
                      className="flex items-center gap-3 px-4 py-3 bg-[var(--navy-blue-lighter)]/50 border-b border-[var(--medium-grey)]/50 cursor-pointer"
                      onClick={() =>
                        setExpandedModule(isExpanded ? -1 : moduleIndex)
                      }
                    >
                      <div className="w-6 h-6 rounded-full bg-[var(--neon-blue)]/30 flex items-center justify-center flex-shrink-0">
                        <div className="w-2 h-2 rounded-full bg-[var(--neon-blue)]" />
                      </div>
                      <input
                        type="text"
                        value={mod.title}
                        onChange={(e) =>
                          updateModule(moduleIndex, { title: e.target.value })
                        }
                        onClick={(e) => e.stopPropagation()}
                        className={`flex-1 bg-transparent border-none text-white font-medium focus:outline-none focus:ring-0 ${
                          !mod.title ? "placeholder-[var(--medium-grey)]" : ""
                        }`}
                        placeholder="Module title (e.g. Types of Cyber Threats)"
                      />
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          removeModule(moduleIndex);
                        }}
                        className="p-1.5 text-[var(--crimson-red)] hover:bg-[var(--crimson-red)]/20 rounded transition-colors"
                        title="Remove module"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                      {isExpanded ? (
                        <ChevronDown className="w-5 h-5 text-[var(--medium-grey)] flex-shrink-0" />
                      ) : (
                        <ChevronRight className="w-5 h-5 text-[var(--medium-grey)] flex-shrink-0" />
                      )}
                    </div>

                    {/* Expanded: sections + Module Quiz */}
                    {isExpanded && (
                      <div className="p-4 space-y-4" onClick={(e) => e.stopPropagation()}>
                        {/* Sections (indented like image) */}
                        <div className="space-y-1">
                          <span className="text-xs font-medium text-[var(--medium-grey)] uppercase tracking-wide">
                            Sections
                          </span>
                          {mod.sections.map((section, sectionIndex) => (
                            <div
                              key={sectionIndex}
                              className="ml-4 pl-3 border-l-2 border-[var(--neon-blue)]/40 space-y-3 py-2"
                            >
                              <div className="flex items-center gap-2">
                                <ChevronRight className="w-4 h-4 text-[var(--medium-grey)] flex-shrink-0" />
                                <input
                                  type="text"
                                  value={section.title}
                                  onChange={(e) =>
                                    updateSection(moduleIndex, sectionIndex, {
                                      title: e.target.value,
                                    })
                                  }
                                  className={inputClass + " flex-1"}
                                  placeholder="Section title (e.g. Phishing, Malware)"
                                />
                                {mod.sections.length > 1 && (
                                  <button
                                    type="button"
                                    onClick={() =>
                                      removeSection(moduleIndex, sectionIndex)
                                    }
                                    className="p-1.5 text-[var(--crimson-red)] hover:bg-[var(--crimson-red)]/20 rounded"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                )}
                              </div>
                              <div className="ml-6">
                                <label className={labelClass}>Material (optional)</label>
                                <textarea
                                  value={section.material}
                                  onChange={(e) =>
                                    updateSection(moduleIndex, sectionIndex, {
                                      material: e.target.value,
                                    })
                                  }
                                  className={inputClass}
                                  placeholder="Content for this section"
                                  rows={2}
                                />
                                <div className="mt-2">
                                  <div className="flex items-center gap-2 mb-1">
                                    <LinkIcon className="w-4 h-4 text-[var(--medium-grey)]" />
                                    <span className="text-sm text-white">URLs (optional)</span>
                                  </div>
                                  {section.urls.map((url, urlIndex) => (
                                    <div key={urlIndex} className="flex gap-2 mb-2">
                                      <input
                                        type="url"
                                        value={url}
                                        onChange={(e) =>
                                          updateSectionUrl(
                                            moduleIndex,
                                            sectionIndex,
                                            urlIndex,
                                            e.target.value
                                          )
                                        }
                                        className={inputClass + " flex-1"}
                                        placeholder="https://..."
                                      />
                                      <button
                                        type="button"
                                        onClick={() =>
                                          removeSectionUrl(
                                            moduleIndex,
                                            sectionIndex,
                                            urlIndex
                                          )
                                        }
                                        className="p-2 text-[var(--crimson-red)] hover:bg-[var(--crimson-red)]/20 rounded"
                                      >
                                        <Trash2 className="w-4 h-4" />
                                      </button>
                                    </div>
                                  ))}
                                  <button
                                    type="button"
                                    onClick={() =>
                                      addSectionUrl(moduleIndex, sectionIndex)
                                    }
                                    className="flex items-center gap-2 px-2 py-1 text-xs text-[var(--neon-blue)] hover:bg-[var(--neon-blue)]/20 rounded"
                                  >
                                    <Plus className="w-3 h-3" />
                                    Add URL
                                  </button>
                                </div>
                                
                                {/* Media Upload Section */}
                                <div className="mt-4">
                                  <div className="flex items-center gap-2 mb-2">
                                    <ImageIcon className="w-4 h-4 text-[var(--medium-grey)]" />
                                    <span className="text-sm text-white">Images & Videos</span>
                                  </div>
                                  
                                  {/* Existing Media */}
                                  {section.media && section.media.length > 0 && (
                                    <div className="space-y-2 mb-3">
                                      {section.media.map((mediaItem, mediaIndex) => (
                                        <div key={mediaIndex} className="flex items-start gap-2 p-2 bg-[var(--navy-blue-lighter)]/30 rounded border border-[var(--medium-grey)]/30">
                                          {mediaItem.type === 'image' ? (
                                            <img
                                              src={mediaItem.url}
                                              alt={mediaItem.alt || 'Uploaded image'}
                                              className="w-20 h-20 object-cover rounded flex-shrink-0"
                                            />
                                          ) : (
                                            <video
                                              src={mediaItem.url}
                                              className="w-20 h-20 object-cover rounded flex-shrink-0"
                                              controls={false}
                                            />
                                          )}
                                          <div className="flex-1 min-w-0">
                                            <input
                                              type="text"
                                              value={mediaItem.caption || ''}
                                              onChange={(e) =>
                                                updateMedia(moduleIndex, sectionIndex, mediaIndex, {
                                                  caption: e.target.value,
                                                })
                                              }
                                              className={inputClass + " text-xs mb-1"}
                                              placeholder="Caption (optional)"
                                            />
                                            <p className="text-xs text-gray-400 truncate">
                                              {mediaItem.alt || mediaItem.url.substring(0, 30)}
                                            </p>
                                          </div>
                                          <button
                                            type="button"
                                            onClick={() =>
                                              removeMedia(moduleIndex, sectionIndex, mediaIndex)
                                            }
                                            className="p-1.5 text-[var(--crimson-red)] hover:bg-[var(--crimson-red)]/20 rounded flex-shrink-0"
                                          >
                                            <Trash2 className="w-3 h-3" />
                                          </button>
                                        </div>
                                      ))}
                                    </div>
                                  )}
                                  
                                  {/* Upload Buttons */}
                                  <div className="flex gap-2">
                                    <label className="flex items-center gap-2 px-3 py-2 text-xs text-[var(--neon-blue)] hover:bg-[var(--neon-blue)]/20 rounded cursor-pointer border border-[var(--neon-blue)]/30">
                                      <ImageIcon className="w-3 h-3" />
                                      <span>Upload Image</span>
                                      <input
                                        type="file"
                                        accept="image/*"
                                        className="hidden"
                                        onChange={(e) => {
                                          const file = e.target.files?.[0];
                                          if (file) {
                                            handleMediaUpload(moduleIndex, sectionIndex, file);
                                          }
                                        }}
                                        disabled={Object.values(uploading).some(v => v)}
                                      />
                                    </label>
                                    <label className="flex items-center gap-2 px-3 py-2 text-xs text-[var(--neon-blue)] hover:bg-[var(--neon-blue)]/20 rounded cursor-pointer border border-[var(--neon-blue)]/30">
                                      <Video className="w-3 h-3" />
                                      <span>Upload Video</span>
                                      <input
                                        type="file"
                                        accept="video/*"
                                        className="hidden"
                                        onChange={(e) => {
                                          const file = e.target.files?.[0];
                                          if (file) {
                                            handleMediaUpload(moduleIndex, sectionIndex, file);
                                          }
                                        }}
                                        disabled={Object.values(uploading).some(v => v)}
                                      />
                                    </label>
                                  </div>
                                  {Object.values(uploading).some(v => v) && (
                                    <div className="flex items-center gap-2 mt-2 text-xs text-gray-400">
                                      <Loader2 className="w-3 h-3 animate-spin" />
                                      <span>Uploading...</span>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          ))}
                          <button
                            type="button"
                            onClick={() => addSection(moduleIndex)}
                            className="ml-4 flex items-center gap-2 px-3 py-2 text-sm text-[var(--neon-blue)] hover:bg-[var(--neon-blue)]/20 rounded-lg"
                          >
                            <Plus className="w-4 h-4" />
                            Add section
                          </button>
                        </div>

                        {/* Module Quiz - separate block after sections */}
                        <div className="border-t border-[var(--medium-grey)]/50 pt-4">
                          <button
                            type="button"
                            onClick={() => {
                              if (mod.quiz.length === 0) addQuizToModule(moduleIndex);
                              else setExpandedQuiz(isQuizExpanded ? null : moduleIndex);
                            }}
                            className="flex items-center gap-3 w-full px-3 py-2 rounded-lg hover:bg-[var(--navy-blue-lighter)]/50 text-left"
                          >
                            <HelpCircle className="w-5 h-5 text-[var(--neon-blue)]" />
                            <span className="font-medium text-white">
                              Module Quiz
                            </span>
                            {mod.quiz.length > 0 && (
                              <span className="text-xs text-[var(--medium-grey)]">
                                {mod.quiz.length} question(s)
                              </span>
                            )}
                            {mod.quiz.length === 0 ? (
                              <span className="text-sm text-[var(--medium-grey)] ml-auto">
                                Add quiz
                              </span>
                            ) : isQuizExpanded ? (
                              <ChevronDown className="w-4 h-4 ml-auto text-[var(--medium-grey)]" />
                            ) : (
                              <ChevronRight className="w-4 h-4 ml-auto text-[var(--medium-grey)]" />
                            )}
                          </button>

                          {mod.quiz.length === 0 && (
                            <p className="text-xs text-[var(--medium-grey)] ml-8 mt-1">
                              Add questions with options and mark the correct answer.
                            </p>
                          )}

                          {isQuizExpanded && mod.quiz.length > 0 && (
                            <div className="ml-8 mt-3 space-y-4">
                              {mod.quiz.map((q, questionIndex) => (
                                <div
                                  key={questionIndex}
                                  className="p-3 rounded-lg bg-[var(--navy-blue-lighter)] border border-[var(--medium-grey)]/50 space-y-3"
                                >
                                  <div className="flex items-start justify-between gap-2">
                                    <span className="text-xs text-[var(--medium-grey)]">
                                      Question {questionIndex + 1}
                                    </span>
                                    <button
                                      type="button"
                                      onClick={() =>
                                        removeQuizQuestion(moduleIndex, questionIndex)
                                      }
                                      className="p-1 text-[var(--crimson-red)] hover:bg-[var(--crimson-red)]/20 rounded"
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                  </div>
                                  <input
                                    type="text"
                                    value={q.question}
                                    onChange={(e) =>
                                      updateQuizQuestion(moduleIndex, questionIndex, {
                                        question: e.target.value,
                                      })
                                    }
                                    className={inputClass}
                                    placeholder="Question text"
                                  />
                                  <div>
                                    <label className={labelClass}>
                                      Choices (select correct)
                                    </label>
                                    {q.choices.map((choice, choiceIndex) => (
                                      <div
                                        key={choiceIndex}
                                        className="flex items-center gap-2 mb-2"
                                      >
                                        <input
                                          type="radio"
                                          name={`quiz-${moduleIndex}-${questionIndex}`}
                                          checked={q.correctIndex === choiceIndex}
                                          onChange={() =>
                                            updateQuizQuestion(moduleIndex, questionIndex, {
                                              correctIndex: choiceIndex,
                                            })
                                          }
                                          className="w-4 h-4 text-[var(--neon-blue)]"
                                        />
                                        <input
                                          type="text"
                                          value={choice}
                                          onChange={(e) =>
                                            updateQuizChoice(
                                              moduleIndex,
                                              questionIndex,
                                              choiceIndex,
                                              e.target.value
                                            )
                                          }
                                          className={inputClass + " flex-1"}
                                          placeholder={`Option ${choiceIndex + 1}`}
                                        />
                                        {q.choices.length > 1 && (
                                          <button
                                            type="button"
                                            onClick={() =>
                                              removeQuizChoice(
                                                moduleIndex,
                                                questionIndex,
                                                choiceIndex
                                              )
                                            }
                                            className="p-1.5 text-[var(--crimson-red)] hover:bg-[var(--crimson-red)]/20 rounded"
                                          >
                                            <Trash2 className="w-4 h-4" />
                                          </button>
                                        )}
                                      </div>
                                    ))}
                                    <button
                                      type="button"
                                      onClick={() =>
                                        addQuizChoice(moduleIndex, questionIndex)
                                      }
                                      className="flex items-center gap-2 px-2 py-1 text-xs text-[var(--neon-blue)] hover:bg-[var(--neon-blue)]/20 rounded"
                                    >
                                      <Plus className="w-3 h-3" />
                                      Add choice
                                    </button>
                                  </div>
                                </div>
                              ))}
                              <button
                                type="button"
                                onClick={() => addQuizToModule(moduleIndex)}
                                className="flex items-center gap-2 px-3 py-2 text-sm text-[var(--neon-blue)] hover:bg-[var(--neon-blue)]/20 rounded-lg"
                              >
                                <Plus className="w-4 h-4" />
                                Add question
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-[var(--medium-grey)]">
            <button
              type="button"
              onClick={() => {
                resetForm();
                onClose();
              }}
              className="px-4 py-2 text-[var(--medium-grey)] hover:text-white transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-2 bg-[var(--neon-blue)] text-white rounded-lg hover:bg-[var(--neon-blue-dark)] transition-colors"
            >
              {isEditMode ? "Save changes" : "Add Course"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
