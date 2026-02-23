"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@clerk/nextjs";
import {
  ArrowLeft,
  BookOpen,
  FileQuestion,
  Link as LinkIcon,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  Circle,
  Check,
  ChevronDown,
  ChevronUp,
  PlayCircle,
  Clock,
  Award,
  AlertCircle,
  Info,
  Lightbulb,
  X,
  RotateCcw,
} from "lucide-react";
import { ApiClient } from "@/lib/api";
import type { Course, CourseModule, ModuleSection, QuizQuestion } from "@/lib/coursesData";

// Format inline markdown (bold, italic, code)
function formatInlineMarkdown(text: string): React.ReactElement[] {
  if (!text) return [<span key="empty"></span>];
  
  const parts: React.ReactElement[] = [];
  const segments: Array<{ type: 'bold' | 'italic' | 'code' | 'text'; content: string; start: number; end: number }> = [];
  
  // Find bold (**text** or __text__)
  const boldRegex = /(\*\*|__)(.+?)\1/g;
  let match;
  while ((match = boldRegex.exec(text)) !== null) {
    segments.push({ type: 'bold', content: match[2], start: match.index, end: match.index + match[0].length });
  }
  
  // Find italic (*text* or _text_) - but not if it's part of bold (**text**)
  const italicRegex = /\*([^*]+?)\*|_([^_]+?)_/g;
  while ((match = italicRegex.exec(text)) !== null) {
    // Skip if it's part of a bold marker
    const before = text.substring(Math.max(0, match.index - 1), match.index);
    const after = text.substring(match.index + match[0].length, match.index + match[0].length + 1);
    if ((before === '*' && match[0].startsWith('*')) || (after === '*' && match[0].endsWith('*'))) {
      continue;
    }
    if ((before === '_' && match[0].startsWith('_')) || (after === '_' && match[0].endsWith('_'))) {
      continue;
    }
    const content = match[1] || match[2];
    segments.push({ type: 'italic', content, start: match.index, end: match.index + match[0].length });
  }
  
  // Find code (`text`)
  const codeRegex = /`([^`]+?)`/g;
  while ((match = codeRegex.exec(text)) !== null) {
    segments.push({ type: 'code', content: match[1], start: match.index, end: match.index + match[0].length });
  }
  
  // Sort segments by position
  segments.sort((a, b) => a.start - b.start);
  
  let lastIndex = 0;
  let key = 0;
  
  segments.forEach((segment) => {
    // Add text before the segment
    if (segment.start > lastIndex) {
      parts.push(<span key={`text-${key++}`}>{text.substring(lastIndex, segment.start)}</span>);
    }
    
    // Add the formatted segment
    if (segment.type === 'bold') {
      parts.push(
        <strong key={`bold-${key++}`} className="font-semibold text-gray-900">
          {segment.content}
        </strong>
      );
    } else if (segment.type === 'italic') {
      parts.push(
        <em key={`italic-${key++}`} className="text-gray-700">
          {segment.content}
        </em>
      );
    } else if (segment.type === 'code') {
      parts.push(
        <code key={`code-${key++}`} className="px-1.5 py-0.5 bg-gray-100 text-[var(--neon-blue)] rounded text-sm font-mono">
          {segment.content}
        </code>
      );
    }
    
    lastIndex = segment.end;
  });
  
  // Add remaining text
  if (lastIndex < text.length) {
    parts.push(<span key={`text-${key++}`}>{text.substring(lastIndex)}</span>);
  }
  
  return parts.length > 0 ? parts : [<span key="text">{text}</span>];
}

// Format content with proper structure (headings, lists, paragraphs, callouts)
function formatContent(material: string): React.ReactElement[] {
  if (!material) return [];
  
  const parts: React.ReactElement[] = [];
  const lines = material.split('\n');
  let inList = false;
  let listItems: string[] = [];
  let listType: 'ul' | 'ol' | null = null;
  let key = 0;
  
  const flushList = () => {
    if (listItems.length > 0) {
      if (listType === 'ol') {
        parts.push(
          <ol key={`list-${key++}`} className="list-decimal list-inside space-y-2 my-4 ml-4">
            {listItems.map((item, idx) => (
              <li key={idx} className="pl-2 text-gray-800 leading-relaxed">
                {formatInlineMarkdown(item)}
              </li>
            ))}
          </ol>
        );
      } else {
        parts.push(
          <ul key={`list-${key++}`} className="list-disc list-inside space-y-2 my-4 ml-4">
            {listItems.map((item, idx) => (
              <li key={idx} className="pl-2 text-gray-800 leading-relaxed">
                {formatInlineMarkdown(item)}
              </li>
            ))}
          </ul>
        );
      }
      listItems = [];
      listType = null;
      inList = false;
    }
  };
  
  lines.forEach((line, lineIndex) => {
    const trimmed = line.trim();
    
    // Empty line
    if (trimmed === '') {
      flushList();
      return;
    }
    
    // Check for callout boxes (INFO:, NOTE:, TIP:, WARNING:)
    const calloutMatch = trimmed.match(/^(INFO|NOTE|TIP|WARNING|IMPORTANT):\s*(.+)/i);
    if (calloutMatch) {
      flushList();
      const [, type, content] = calloutMatch;
      const calloutType = type.toUpperCase();
      const isInfo = calloutType === 'INFO' || calloutType === 'NOTE';
      const isTip = calloutType === 'TIP';
      const isWarning = calloutType === 'WARNING' || calloutType === 'IMPORTANT';
      
      const bgColor = isInfo 
        ? 'bg-blue-50 border-blue-200' 
        : isTip 
        ? 'bg-yellow-50 border-yellow-200'
        : 'bg-orange-50 border-orange-200';
      const iconColor = isInfo
        ? 'text-blue-600'
        : isTip
        ? 'text-yellow-600'
        : 'text-orange-600';
      const Icon = isInfo ? Info : isTip ? Lightbulb : AlertCircle;
      
      parts.push(
        <div key={`callout-${key++}`} className={`${bgColor} border-l-4 rounded-r-lg p-4 my-4`}>
          <div className="flex items-start gap-3">
            <Icon className={`w-5 h-5 ${iconColor} flex-shrink-0 mt-0.5`} />
            <div className="flex-1">
              <p className="font-semibold text-gray-900 mb-1">{type}</p>
              <div className="text-gray-800 leading-relaxed">{formatInlineMarkdown(content)}</div>
            </div>
          </div>
        </div>
      );
      return;
    }
    
    // Check for headings (# H1, ## H2, ### H3)
    if (trimmed.startsWith('###')) {
      flushList();
      const headingText = trimmed.substring(3).trim();
      parts.push(
        <h3 key={`h3-${key++}`} className="text-xl font-bold text-gray-900 mt-6 mb-3">
          {formatInlineMarkdown(headingText)}
        </h3>
      );
      return;
    }
    if (trimmed.startsWith('##')) {
      flushList();
      const headingText = trimmed.substring(2).trim();
      parts.push(
        <h2 key={`h2-${key++}`} className="text-2xl font-bold text-gray-900 mt-8 mb-4 border-b border-gray-200 pb-2">
          {formatInlineMarkdown(headingText)}
        </h2>
      );
      return;
    }
    if (trimmed.startsWith('#')) {
      flushList();
      const headingText = trimmed.substring(1).trim();
      parts.push(
        <h1 key={`h1-${key++}`} className="text-3xl font-bold text-gray-900 mt-8 mb-4">
          {formatInlineMarkdown(headingText)}
        </h1>
      );
      return;
    }
    
    // Check for numbered list (1. 2. etc.)
    const numberedMatch = trimmed.match(/^(\d+)\.\s+(.+)/);
    if (numberedMatch) {
      if (!inList || listType !== 'ol') {
        flushList();
        inList = true;
        listType = 'ol';
      }
      listItems.push(numberedMatch[2]);
      return;
    }
    
    // Check for bulleted list (- or *)
    if (/^[-*]\s+/.test(trimmed)) {
      if (!inList || listType !== 'ul') {
        flushList();
        inList = true;
        listType = 'ul';
      }
      listItems.push(trimmed.replace(/^[-*]\s+/, ''));
      return;
    }
    
    // Regular paragraph
    flushList();
    parts.push(
      <p key={`p-${key++}`} className="text-gray-800 leading-relaxed mb-6 text-lg">
        {formatInlineMarkdown(trimmed)}
      </p>
    );
  });
  
  flushList();
  return parts;
}

function parseSubmoduleId(submoduleId: string): { moduleIndex: number; sectionIndex: number | "quiz" } | null {
  if (!submoduleId) return null;
  if (submoduleId.endsWith("-quiz")) {
    const moduleIndex = parseInt(submoduleId.slice(0, -5), 10);
    if (Number.isNaN(moduleIndex) || moduleIndex < 0) return null;
    return { moduleIndex, sectionIndex: "quiz" };
  }
  const parts = submoduleId.split("-");
  if (parts.length !== 2) return null;
  const moduleIndex = parseInt(parts[0], 10);
  const sectionIndex = parseInt(parts[1], 10);
  if (Number.isNaN(moduleIndex) || Number.isNaN(sectionIndex) || moduleIndex < 0 || sectionIndex < 0)
    return null;
  return { moduleIndex, sectionIndex };
}

export default function SubmodulePage() {
  const params = useParams();
  const router = useRouter();
  const { getToken } = useAuth();
  const courseId = params.id as string;
  const submoduleId = params.submoduleId as string;
  const [course, setCourse] = useState<Course | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const parsed = parseSubmoduleId(submoduleId);
  const moduleIndex = parsed?.moduleIndex ?? -1;
  const sectionIndex = parsed?.sectionIndex ?? -1;
  const isQuiz = sectionIndex === "quiz";

  const currentModule: CourseModule | null =
    course?.modules?.[moduleIndex] ?? null;
  const currentSection: ModuleSection | null =
    typeof sectionIndex === "number" && currentModule?.sections?.[sectionIndex]
      ? currentModule.sections[sectionIndex]
      : null;

  // Debug: Log section data to see if media is present
  useEffect(() => {
    if (currentSection) {
      console.log('Current section:', currentSection);
      console.log('Section media:', currentSection.media);
    }
  }, [currentSection]);
  const quizQuestions: QuizQuestion[] = isQuiz ? currentModule?.quiz ?? [] : [];

  const [completedIds, setCompletedIds] = useState<string[]>([]);
  const [markingRead, setMarkingRead] = useState(false);
  const [markReadError, setMarkReadError] = useState<string | null>(null);
  const [quizSelections, setQuizSelections] = useState<Record<number, number>>({});
  const [showQuizResults, setShowQuizResults] = useState(false);
  const [quizResults, setQuizResults] = useState<Record<number, boolean>>({});
  const [sidebarExpanded, setSidebarExpanded] = useState<Set<number>>(new Set());
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const isRead = (submoduleIdParam: string) => completedIds.includes(submoduleIdParam);
  const allQuizAttempted =
    quizQuestions.length > 0 &&
    quizQuestions.every((_, qi) => Object.prototype.hasOwnProperty.call(quizSelections, qi));
  
  const checkQuizAnswers = () => {
    const results: Record<number, boolean> = {};
    quizQuestions.forEach((q, qi) => {
      const selected = quizSelections[qi];
      results[qi] = selected === q.correctIndex;
    });
    setQuizResults(results);
    setShowQuizResults(true);
    return Object.values(results).every(r => r);
  };
  
  const retakeQuiz = () => {
    setQuizSelections({});
    setShowQuizResults(false);
    setQuizResults({});
    setMarkReadError(null);
  };
  
  const toggleComplete = async () => {
    if (markingRead) return;
    if (!getToken) {
      setMarkReadError("Please sign in to save your progress.");
      return;
    }
    
    // For quizzes, validate answers first
    if (isQuiz && !isRead(submoduleId) && !showQuizResults) {
      if (!allQuizAttempted) {
        setMarkReadError("Please answer all questions before submitting.");
        return;
      }
      
      const allCorrect = checkQuizAnswers();
      if (!allCorrect) {
        setMarkReadError("Some answers are incorrect. Please review and try again.");
        return;
      }
    }
    
    setMarkReadError(null);
    setMarkingRead(true);
    try {
      const api = new ApiClient(getToken);
      if (isRead(submoduleId)) {
        // Unmark as complete
        const res = await api.unmarkCourseProgressComplete(courseId, submoduleId);
        setCompletedIds(res.completed ?? completedIds.filter(id => id !== submoduleId));
        if (isQuiz) {
          retakeQuiz();
        }
      } else {
        // Mark as complete (only if quiz is correct or not a quiz)
      const res = await api.markCourseProgressComplete(courseId, submoduleId);
      setCompletedIds(res.completed ?? [...completedIds, submoduleId]);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to update progress";
      setMarkReadError(message);
    } finally {
      setMarkingRead(false);
    }
  };

  const sections = currentModule?.sections ?? [];
  const hasQuiz = (currentModule?.quiz?.length ?? 0) > 0;
  const canGoPrev =
    isQuiz ? sections.length > 0 : sectionIndex > 0;
  const canGoNext = isQuiz
    ? false
    : sectionIndex < sections.length - 1 || hasQuiz;
  const prevUrl = isQuiz
    ? `${moduleIndex}-${sections.length - 1}`
    : sectionIndex > 0
      ? `${moduleIndex}-${sectionIndex - 1}`
      : null;
  const nextUrl = isQuiz
    ? null
    : sectionIndex < sections.length - 1
      ? `${moduleIndex}-${sectionIndex + 1}`
      : hasQuiz
        ? `${moduleIndex}-quiz`
        : null;

  useEffect(() => {
    if (!getToken || !courseId) return;
    let cancelled = false;
    (async () => {
      try {
        setLoading(true);
        setError(null);
        const api = new ApiClient(getToken);
        const [courseRes, progressRes] = await Promise.all([
          api.getCourseById(courseId),
          api.getCourseProgress(courseId).catch(() => ({ completed: [] })),
        ]);
        if (cancelled) return;
        if (!courseRes?.course) {
          router.push("/dashboard/training-modules");
          return;
        }
        setCourse(courseRes.course);
        setCompletedIds(progressRes.completed ?? []);
      } catch (err) {
        if (!cancelled)
          setError(err instanceof Error ? err.message : "Failed to load course");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [courseId, getToken, router]);

  useEffect(() => {
    if (!loading && course && parsed === null) {
      router.push(`/dashboard/training-modules/${courseId}`);
    }
  }, [loading, course, parsed, courseId, router]);

  // Expand sidebar modules on load
  useEffect(() => {
    if (course && moduleIndex >= 0) {
      setSidebarExpanded(new Set([moduleIndex]));
    }
  }, [course, moduleIndex]);

  const toggleSidebarModule = (modIdx: number) => {
    setSidebarExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(modIdx)) next.delete(modIdx);
      else next.add(modIdx);
      return next;
    });
  };

  const getTotalItems = () => {
    if (!course) return 0;
    return course.modules.reduce(
      (acc, m) => acc + (m.sections?.length ?? 0) + ((m.quiz?.length ?? 0) > 0 ? 1 : 0),
      0
    );
  };

  const getCompletedCount = () => completedIds.length;
  const progressPercent = getTotalItems() > 0 ? Math.round((getCompletedCount() / getTotalItems()) * 100) : 0;

  if (loading || !course) {
    return (
      <div className="min-h-screen bg-[#f8fafc] flex items-center justify-center">
        <p className="text-gray-500">Loading...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#f8fafc] flex items-center justify-center">
        <p className="text-red-600">{error}</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar Navigation */}
      <aside
        className={`${
          sidebarCollapsed ? "w-0" : "w-80"
        } bg-white border-r border-gray-200 transition-all duration-300 overflow-hidden flex-shrink-0 sticky top-0 h-screen overflow-y-auto`}
      >
        <div className="p-6">
          {/* Course Header */}
          <div className="mb-6">
            <button
              onClick={() => router.push(`/dashboard/training-modules/${courseId}`)}
              className="flex items-center gap-2 text-sm text-gray-600 hover:text-[var(--neon-blue)] transition-colors mb-3"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to course
            </button>
            <h2 className="text-lg font-bold text-gray-900 line-clamp-2 mb-2">{course.courseTitle}</h2>
            <div className="flex items-center gap-4 text-xs text-gray-500">
              <div className="flex items-center gap-1">
                <Clock className="w-3 h-3" />
                <span>{getTotalItems()} items</span>
              </div>
              <div className="flex items-center gap-1">
                <Award className="w-3 h-3" />
                <span>{progressPercent}% complete</span>
              </div>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="mb-6">
            <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-[var(--neon-blue)] transition-all duration-300"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
            <p className="text-xs text-gray-500 mt-1">
              {getCompletedCount()} of {getTotalItems()} completed
            </p>
          </div>

          {/* Course Modules Navigation */}
          <nav className="space-y-1">
            {course.modules.map((mod, modIdx) => {
              const isExpanded = sidebarExpanded.has(modIdx);
              const sections = mod.sections || [];
              const hasQuiz = (mod.quiz?.length ?? 0) > 0;
              const isCurrentModule = modIdx === moduleIndex;

              return (
                <div key={mod._id || modIdx} className="border border-gray-200 rounded-lg overflow-hidden">
                  <button
                    onClick={() => toggleSidebarModule(modIdx)}
                    className={`w-full px-4 py-3 flex items-center justify-between text-left transition-colors ${
                      isCurrentModule
                        ? "bg-[var(--neon-blue)]/10 border-l-4 border-l-[var(--neon-blue)]"
                        : "hover:bg-gray-50"
                    }`}
                  >
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      <div
                        className={`w-6 h-6 rounded flex items-center justify-center flex-shrink-0 ${
                          isCurrentModule
                            ? "bg-[var(--neon-blue)] text-white"
                            : "bg-gray-200 text-gray-600"
                        }`}
                      >
                        <span className="text-xs font-semibold">{modIdx + 1}</span>
                      </div>
                      <span
                        className={`text-sm font-medium truncate ${
                          isCurrentModule ? "text-[var(--neon-blue)]" : "text-gray-900"
                        }`}
                      >
                        {mod.title || `Module ${modIdx + 1}`}
                      </span>
                    </div>
                    {isExpanded ? (
                      <ChevronDown className="w-4 h-4 text-gray-400 flex-shrink-0" />
                    ) : (
                      <ChevronRight className="w-4 h-4 text-gray-400 flex-shrink-0" />
                    )}
                  </button>

                  {isExpanded && (
                    <div className="bg-gray-50 border-t border-gray-200">
                      {sections.map((section, secIdx) => {
                        const sectionId = `${modIdx}-${secIdx}`;
                        const isCurrent = modIdx === moduleIndex && secIdx === sectionIndex;
                        const isCompleted = isRead(sectionId);

                        return (
                          <button
                            key={section._id || secIdx}
                            onClick={() => router.push(`/dashboard/training-modules/${courseId}/${sectionId}`)}
                            className={`w-full px-4 py-2.5 pl-12 flex items-center gap-2 text-left text-sm transition-colors border-b border-gray-100 last:border-0 ${
                              isCurrent
                                ? "bg-[var(--neon-blue)]/5 text-[var(--neon-blue)] font-medium"
                                : "text-gray-700 hover:bg-gray-100"
                            }`}
                          >
                            {isCompleted ? (
                              <CheckCircle2 className="w-4 h-4 text-[var(--neon-blue)] flex-shrink-0" />
                            ) : (
                              <Circle className="w-4 h-4 text-gray-400 flex-shrink-0" />
                            )}
                            <span className="truncate">{section.title || `Section ${secIdx + 1}`}</span>
                          </button>
                        );
                      })}
                      {hasQuiz && (
                        <button
                          onClick={() => router.push(`/dashboard/training-modules/${courseId}/${modIdx}-quiz`)}
                          className={`w-full px-4 py-2.5 pl-12 flex items-center gap-2 text-left text-sm transition-colors ${
                            modIdx === moduleIndex && isQuiz
                              ? "bg-[var(--neon-blue)]/5 text-[var(--neon-blue)] font-medium"
                              : "text-gray-700 hover:bg-gray-100"
                          }`}
                        >
                          {isRead(`${modIdx}-quiz`) ? (
                            <CheckCircle2 className="w-4 h-4 text-[var(--neon-blue)] flex-shrink-0" />
                          ) : (
                            <FileQuestion className="w-4 h-4 text-[var(--neon-blue)] flex-shrink-0" />
                          )}
                          <span>Module Quiz</span>
                        </button>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </nav>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Bar */}
        <header className="bg-white border-b border-gray-200 sticky top-0 z-20">
          <div className="px-6 py-4 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                aria-label="Toggle sidebar"
              >
                <BookOpen className="w-5 h-5 text-gray-600" />
              </button>
              <div>
                <h1 className="text-lg font-semibold text-gray-900">{course.courseTitle}</h1>
                {currentModule && (
                  <p className="text-sm text-gray-500">
                    {currentModule.title} {isQuiz ? "• Quiz" : currentSection ? `• ${currentSection.title}` : ""}
                  </p>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600">
                {moduleIndex + 1} of {course.modules.length} modules
            </span>
          </div>
        </div>
      </header>

        {/* Main content - professional layout */}
        <main className="flex-1 overflow-y-auto">
          <div className="max-w-4xl mx-auto px-6 py-8">
        {isQuiz ? (
              <article className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="bg-gradient-to-r from-[var(--neon-blue)]/10 to-[var(--electric-blue)]/10 px-8 py-6 border-b border-gray-200">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-xl bg-[var(--neon-blue)] flex items-center justify-center shadow-lg">
                      <FileQuestion className="w-7 h-7 text-white" />
                </div>
                <div>
                      <h1 className="text-2xl font-bold text-gray-900 mb-1">Module Quiz</h1>
                  {currentModule?.title && (
                        <p className="text-sm text-gray-600">{currentModule.title}</p>
                  )}
                </div>
              </div>
                </div>
                <div className="px-8 py-8">
              {quizQuestions.length === 0 ? (
                    <div className="text-center py-12">
                      <FileQuestion className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                      <p className="text-gray-500 text-lg">No questions in this quiz.</p>
                    </div>
              ) : (
                    <div className="space-y-10">
                  {quizQuestions.map((q, qi) => (
                    <section
                      key={q._id || qi}
                          className={qi < quizQuestions.length - 1 ? "pb-10 border-b border-gray-200" : ""}
                        >
                          <div className={`flex items-start gap-4 mb-10 ${qi > 0 ? "pt-8" : ""}`}>
                            <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-[var(--neon-blue)]/10 flex items-center justify-center">
                              <span className="text-[var(--neon-blue)] font-bold text-lg">{qi + 1}</span>
                            </div>
                            <div className="flex-1">
                              <h3 className="text-xl font-semibold text-gray-900 leading-relaxed mb-6">
                                {q.question}
                              </h3>
                      <ul className="space-y-3">
                        {q.choices.map((c, ci) => {
                          const isSelected = quizSelections[qi] === ci;
                                  const isCorrect = ci === q.correctIndex;
                                  const isIncorrect = showQuizResults && isSelected && !isCorrect;
                                  const showCorrect = showQuizResults && isCorrect;
                                  
                          return (
                            <li key={ci}>
                              <button
                                type="button"
                                        onClick={() => {
                                          if (!showQuizResults) {
                                            setQuizSelections((prev) => ({ ...prev, [qi]: ci }));
                                }
                                        }}
                                        disabled={showQuizResults}
                                        className={`w-full flex items-center gap-4 px-6 py-4 rounded-lg text-left transition-all min-h-[3.5rem] disabled:opacity-100 disabled:cursor-default ${
                                  isSelected
                                            ? showCorrect
                                              ? "bg-green-50 text-green-800 font-medium border-2 border-green-500 shadow-sm disabled:text-green-800"
                                              : isIncorrect
                                              ? "bg-red-50 text-red-800 font-medium border-2 border-red-500 shadow-sm disabled:text-red-800"
                                              : "bg-[var(--neon-blue)]/10 text-[var(--neon-blue)] font-medium border-2 border-[var(--neon-blue)] shadow-sm disabled:text-[var(--neon-blue)]"
                                            : showCorrect
                                            ? "bg-green-50 text-green-800 border-2 border-green-500 disabled:text-green-800"
                                            : "bg-white text-gray-700 border-2 border-gray-200 hover:bg-gray-50 hover:border-gray-300 disabled:text-gray-700"
                                        } ${showQuizResults ? "cursor-default" : "cursor-pointer"}`}
                              >
                                <span
                                          className={`flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center text-base font-bold transition-colors ${
                                    isSelected
                                              ? showCorrect
                                                ? "bg-green-500 text-white"
                                                : isIncorrect
                                                ? "bg-red-500 text-white"
                                                : "bg-[var(--neon-blue)] text-white"
                                              : showCorrect
                                              ? "bg-green-500 text-white border-2 border-green-600"
                                              : "bg-gray-100 text-gray-700 border-2 border-gray-300"
                                  }`}
                                >
                                  {String.fromCharCode(65 + ci)}
                                </span>
                                        <span 
                                          className="flex-1 text-base leading-relaxed font-medium"
                                          style={{
                                            color: isSelected
                                              ? showCorrect
                                                ? "#166534" // green-800
                                                : isIncorrect
                                                ? "#991b1b" // red-800
                                                : "var(--neon-blue)"
                                              : showCorrect
                                              ? "#166534" // green-800
                                              : "#374151" // gray-700
                                          }}
                                        >{c}</span>
                                        {showCorrect && (
                                          <CheckCircle2 className="w-6 h-6 text-green-600 flex-shrink-0" />
                                        )}
                                        {isIncorrect && (
                                          <X className="w-6 h-6 text-red-600 flex-shrink-0" />
                                        )}
                              </button>
                            </li>
                          );
                        })}
                      </ul>
                            </div>
                          </div>
                    </section>
                  ))}
                </div>
              )}

              {/* Quiz submit */}
                  <div className="mt-10 pt-8 border-t border-gray-200">
                    <div className="space-y-4">
                {isRead(submoduleId) ? (
                        <div className="space-y-3">
                          <button
                            type="button"
                            onClick={toggleComplete}
                            disabled={markingRead}
                            className="inline-flex items-center justify-center gap-3 px-6 py-3 rounded-lg bg-[var(--neon-blue)] text-white hover:bg-[var(--medium-blue)] transition-colors text-base font-semibold disabled:opacity-60 disabled:cursor-not-allowed shadow-md hover:shadow-lg"
                          >
                            <RotateCcw className="w-5 h-5 shrink-0" />
                            <span>{markingRead ? "Updating…" : "Retake Quiz"}</span>
                          </button>
                        </div>
                      ) : showQuizResults ? (
                        <div className="space-y-4">
                          {Object.values(quizResults).every(r => r) ? (
                            <div className="space-y-3">
                              <div className="flex items-center gap-2 px-4 py-3 bg-green-50 border border-green-200 rounded-lg">
                                <CheckCircle2 className="w-5 h-5 text-green-600 shrink-0" />
                                <span className="!text-green-800 font-medium">All answers are correct! Great job!</span>
                              </div>
                              <button
                                type="button"
                                onClick={toggleComplete}
                                disabled={markingRead}
                                className="inline-flex items-center justify-center gap-3 px-6 py-3 rounded-lg bg-[var(--neon-blue)] text-white hover:bg-[var(--medium-blue)] transition-colors text-base font-semibold disabled:opacity-60 disabled:cursor-not-allowed shadow-md hover:shadow-lg"
                              >
                    <CheckCircle2 className="w-5 h-5 shrink-0" />
                                <span>{markingRead ? "Submitting…" : "Complete Quiz"}</span>
                              </button>
                            </div>
                          ) : (
                            <div className="space-y-3">
                              <button
                                type="button"
                                onClick={retakeQuiz}
                                className="inline-flex items-center justify-center gap-3 px-6 py-3 rounded-lg bg-[var(--neon-blue)] text-white hover:bg-[var(--medium-blue)] transition-colors text-base font-semibold disabled:opacity-60 disabled:cursor-not-allowed shadow-md hover:shadow-lg"
                              >
                                <RotateCcw className="w-5 h-5 shrink-0" />
                                <span>Retake Quiz</span>
                              </button>
                            </div>
                          )}
                        </div>
                ) : (
                  <>
                    <button
                      type="button"
                            onClick={toggleComplete}
                      disabled={!allQuizAttempted || markingRead}
                            className="inline-flex items-center justify-center gap-3 px-6 py-3 rounded-lg bg-[var(--neon-blue)] text-white hover:bg-[var(--medium-blue)] transition-colors text-base font-semibold disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-[var(--neon-blue)] shadow-md hover:shadow-lg"
                    >
                      <Check className="w-5 h-5 shrink-0" />
                            <span>{markingRead ? "Submitting…" : "Submit Quiz"}</span>
                    </button>
                    {!allQuizAttempted && quizQuestions.length > 0 && (
                            <p className="text-sm text-gray-600">
                              Please answer all {quizQuestions.length} question{quizQuestions.length !== 1 ? "s" : ""} to submit.
                      </p>
                    )}
                  </>
                )}
                      {markReadError && !showQuizResults && (
                        <p className="text-sm text-red-600 bg-red-50 px-4 py-2 rounded-lg border border-red-200">
                          {markReadError}
                        </p>
                      )}
                    </div>
              </div>
            </div>
          </article>
        ) : currentSection ? (
              <article className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                {/* Section Header */}
                <div className="bg-gradient-to-r from-[var(--neon-blue)]/10 to-[var(--electric-blue)]/10 px-8 py-6 border-b border-gray-200">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-xl bg-[var(--neon-blue)] flex items-center justify-center shadow-lg">
                      <BookOpen className="w-7 h-7 text-white" />
                </div>
                <div>
                      <h1 className="text-2xl font-bold text-gray-900 mb-1">
                    {currentSection.title || "Section"}
                  </h1>
                  {currentModule?.title && (
                        <p className="text-sm text-gray-600">{currentModule.title}</p>
                  )}
                </div>
                  </div>
                </div>

                {/* Section Content */}
                <div className="px-8 py-8">
                  {currentSection.material && (
                    <article className="max-w-none mb-8 prose prose-lg prose-gray max-w-none">
                      <div className="text-gray-800 leading-relaxed space-y-6">
                        {formatContent(currentSection.material)}
                      </div>
                    </article>
                  )}
                  
                  {/* Render Media Items */}
                  {currentSection.media && currentSection.media.length > 0 && (
                    <div className="space-y-6 mb-8">
                      {currentSection.media.map((mediaItem, idx) => (
                        <div key={idx} className="my-8">
                          {mediaItem.type === 'image' ? (
                            <figure className="w-full">
                              <img
                                src={mediaItem.url}
                                alt={mediaItem.alt || 'Course image'}
                                className="w-full rounded-xl shadow-lg object-cover"
                                onError={(e) => {
                                  console.error('Image failed to load:', mediaItem.url);
                                  e.currentTarget.style.display = 'none';
                                }}
                              />
                              {mediaItem.caption && (
                                <figcaption className="text-sm text-gray-500 text-center mt-3 italic">
                                  {mediaItem.caption}
                                </figcaption>
                              )}
                            </figure>
                          ) : (
                            <figure className="w-full">
                              <div className="relative w-full aspect-video rounded-xl overflow-hidden shadow-lg bg-gray-100">
                                <video
                                  src={mediaItem.url}
                                  controls
                                  className="w-full h-full object-contain"
                                  onError={(e) => {
                                    console.error('Video failed to load:', mediaItem.url);
                                    e.currentTarget.style.display = 'none';
                                  }}
                                >
                                  Your browser does not support the video tag.
                                </video>
                              </div>
                              {mediaItem.caption && (
                                <figcaption className="text-sm text-gray-500 text-center mt-3 italic">
                                  {mediaItem.caption}
                                </figcaption>
                              )}
                            </figure>
                          )}
                        </div>
                      ))}
                </div>
              )}

              {(currentSection.urls?.length ?? 0) > 0 && (
                    <div className="mt-8 pt-8 border-t border-gray-200">
                      <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                        <LinkIcon className="w-5 h-5 text-[var(--neon-blue)]" />
                        Additional Resources
                  </h2>
                      <ul className="space-y-3">
                    {currentSection.urls.map((url, i) => (
                      <li key={i}>
                        <a
                          href={url}
                          target="_blank"
                          rel="noopener noreferrer"
                              className="flex items-center gap-3 px-4 py-3 bg-gray-50 hover:bg-[var(--neon-blue)]/5 border border-gray-200 hover:border-[var(--neon-blue)]/30 rounded-lg transition-colors group"
                        >
                              <LinkIcon className="w-4 h-4 text-[var(--neon-blue)] flex-shrink-0" />
                              <span className="text-[var(--neon-blue)] hover:underline break-all text-sm font-medium group-hover:text-[var(--medium-blue)]">
                          {url}
                              </span>
                        </a>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {!currentSection.material && !(currentSection.urls?.length) && (
                    <div className="text-center py-12">
                      <BookOpen className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                      <p className="text-gray-500 text-lg">No content available for this section.</p>
                    </div>
              )}

              {/* Mark as read */}
                  <div className="mt-10 pt-8 border-t border-gray-200">
                    <div>
                {isRead(submoduleId) ? (
                        <button
                          type="button"
                          onClick={toggleComplete}
                          disabled={markingRead}
                          className="inline-flex items-center justify-center gap-3 px-6 py-3 rounded-lg bg-[var(--neon-blue)] text-white hover:bg-[var(--medium-blue)] transition-colors text-base font-semibold disabled:opacity-60 disabled:cursor-not-allowed shadow-md hover:shadow-lg"
                        >
                    <CheckCircle2 className="w-5 h-5 shrink-0" />
                          <span>{markingRead ? "Updating…" : "Mark as Incomplete"}</span>
                        </button>
                ) : (
                  <button
                    type="button"
                          onClick={toggleComplete}
                    disabled={markingRead}
                          className="group inline-flex items-center justify-center gap-3 px-6 py-3 rounded-lg border-2 border-[var(--neon-blue)] bg-white hover:bg-[var(--neon-blue)] transition-colors text-base font-semibold disabled:opacity-60 disabled:cursor-not-allowed shadow-sm hover:shadow-md"
                  >
                          <Circle className="w-5 h-5 shrink-0 text-[var(--neon-blue)] group-hover:text-white transition-colors" />
                          <span className="text-[var(--neon-blue)] group-hover:text-white transition-colors">{markingRead ? "Saving…" : "Mark as Complete"}</span>
                  </button>
                )}
                {markReadError && (
                        <p className="mt-3 text-sm text-red-600 bg-red-50 px-4 py-2 rounded-lg border border-red-200">
                          {markReadError}
                        </p>
                )}
                    </div>
              </div>
            </div>
          </article>
        ) : (
              <div className="bg-white rounded-xl p-12 text-center border border-gray-200">
                <BookOpen className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500 text-lg">Section not found.</p>
          </div>
        )}

        {/* Bottom navigation */}
        <nav className="mt-10 flex items-center justify-between gap-4">
          {prevUrl ? (
            <button
              onClick={() => router.push(`/dashboard/training-modules/${courseId}/${prevUrl}`)}
                  className="inline-flex items-center justify-center gap-2.5 px-6 py-3 rounded-lg border-2 border-gray-300 bg-white text-gray-700 hover:bg-gray-50 hover:border-[var(--neon-blue)] hover:text-[var(--neon-blue)] transition-colors font-medium shadow-sm hover:shadow-md"
            >
                  <ChevronLeft className="w-5 h-5 flex-shrink-0" />
                  <span>Previous</span>
            </button>
          ) : (
            <div />
          )}
          {nextUrl ? (
            <button
              onClick={() => router.push(`/dashboard/training-modules/${courseId}/${nextUrl}`)}
                  className="inline-flex items-center justify-center gap-2.5 px-6 py-3 rounded-lg bg-[var(--neon-blue)] text-white hover:bg-[var(--medium-blue)] transition-colors font-semibold shadow-md hover:shadow-lg ml-auto"
            >
                  <span>{sectionIndex === sections.length - 1 && hasQuiz ? "Module Quiz" : "Next"}</span>
                  <ChevronRight className="w-5 h-5 flex-shrink-0" />
            </button>
          ) : (
            <button
              onClick={() => router.push(`/dashboard/training-modules/${courseId}`)}
                  className="inline-flex items-center justify-center gap-2.5 px-6 py-3 rounded-lg border-2 border-gray-300 bg-white text-gray-700 hover:bg-gray-50 hover:border-[var(--neon-blue)] hover:text-[var(--neon-blue)] transition-colors font-medium ml-auto shadow-sm hover:shadow-md"
            >
                  <ArrowLeft className="w-5 h-5 flex-shrink-0" />
                  <span>Back to Course</span>
            </button>
          )}
        </nav>
          </div>
      </main>
      </div>
    </div>
  );
}
