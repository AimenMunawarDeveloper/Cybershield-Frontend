"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
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
import { useTranslation } from "@/hooks/useTranslation";
import { useLanguage } from "@/contexts/LanguageContext";
import VideoPlayer from "@/components/VideoPlayer";

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
        <strong key={`bold-${key++}`} className="font-semibold text-foreground">
          {segment.content}
        </strong>
      );
    } else if (segment.type === 'italic') {
      parts.push(
        <em key={`italic-${key++}`} className="text-foreground">
          {segment.content}
        </em>
      );
    } else if (segment.type === 'code') {
      parts.push(
        <code key={`code-${key++}`} className="px-1.5 py-0.5 bg-muted text-primary rounded text-sm font-mono">
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
function formatContent(material: string, translateFn?: (text: string) => string): React.ReactElement[] {
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
              <li key={idx} className="pl-2 text-foreground leading-relaxed">
                {formatInlineMarkdown(item)}
              </li>
            ))}
          </ol>
        );
      } else {
        parts.push(
          <ul key={`list-${key++}`} className="list-disc list-inside space-y-2 my-4 ml-4">
            {listItems.map((item, idx) => (
              <li key={idx} className="pl-2 text-foreground leading-relaxed">
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
              <p className="font-semibold text-foreground mb-1">{translateFn ? translateFn(type) : type}</p>
              <div className="text-foreground leading-relaxed">{formatInlineMarkdown(content)}</div>
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
        <h3 key={`h3-${key++}`} className="text-xl font-bold text-foreground mt-6 mb-3">
          {formatInlineMarkdown(headingText)}
        </h3>
      );
      return;
    }
    if (trimmed.startsWith('##')) {
      flushList();
      const headingText = trimmed.substring(2).trim();
      parts.push(
        <h2 key={`h2-${key++}`} className="text-2xl font-bold text-foreground mt-8 mb-4 border-b border-border pb-2">
          {formatInlineMarkdown(headingText)}
        </h2>
      );
      return;
    }
    if (trimmed.startsWith('#')) {
      flushList();
      const headingText = trimmed.substring(1).trim();
      parts.push(
        <h1 key={`h1-${key++}`} className="text-3xl font-bold text-foreground mt-8 mb-4">
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
      <p key={`p-${key++}`} className="text-foreground leading-relaxed mb-6 text-lg">
        {formatInlineMarkdown(trimmed)}
      </p>
    );
  });
  
  flushList();
  return parts;
}

// Quiz timer: basic = 10 min, advanced = 15 min
const QUIZ_TIME_BASIC_SEC = 10 * 60;
const QUIZ_TIME_ADVANCED_SEC = 15 * 60;

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
  const { language } = useLanguage();
  const { t, preTranslate, isTranslating } = useTranslation();
  const courseId = params.id as string;
  const submoduleId = params.submoduleId as string;
  const [course, setCourse] = useState<Course | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [translationReady, setTranslationReady] = useState(false);
  const [translatedCourse, setTranslatedCourse] = useState<Course | null>(null);
  const [translatedSectionMaterial, setTranslatedSectionMaterial] = useState<string | null>(null);
  const [translatedMediaCaptions, setTranslatedMediaCaptions] = useState<Map<number, string>>(new Map());

  // Use translated course or fallback to original (must be declared early)
  const displayCourse = useMemo(() => translatedCourse || course, [translatedCourse, course]);

  const parsed = parseSubmoduleId(submoduleId);
  const moduleIndex = parsed?.moduleIndex ?? -1;
  const sectionIndex = parsed?.sectionIndex ?? -1;
  const isQuiz = sectionIndex === "quiz";

  const currentModule: CourseModule | null =
    displayCourse?.modules?.[moduleIndex] ?? null;
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
  const [certificateGenerated, setCertificateGenerated] = useState(false);
  const [quizSelections, setQuizSelections] = useState<Record<number, number>>({});
  const [showQuizResults, setShowQuizResults] = useState(false);
  const [quizResults, setQuizResults] = useState<Record<number, boolean>>({});
  const [sidebarExpanded, setSidebarExpanded] = useState<Set<number>>(new Set());
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  // Quiz timer: start screen, then countdown; stop when time runs out
  const [quizStarted, setQuizStarted] = useState(false);
  const [quizTimeRemainingSec, setQuizTimeRemainingSec] = useState(0);
  const [quizTimeExpired, setQuizTimeExpired] = useState(false);
  // Persist last quiz score so it stays visible after marking complete (isRead)
  const [lastQuizScore, setLastQuizScore] = useState<{ correctCount: number; total: number; scorePercent: number; passed: boolean } | null>(null);
  const isRead = (submoduleIdParam: string) => completedIds.includes(submoduleIdParam);
  const allQuizAttempted =
    quizQuestions.length > 0 &&
    quizQuestions.every((_, qi) => Object.prototype.hasOwnProperty.call(quizSelections, qi));

  // Quiz duration: advanced = 15 min, basic (or missing) = 10 min
  const quizDurationSec = displayCourse?.level === "advanced" ? QUIZ_TIME_ADVANCED_SEC : QUIZ_TIME_BASIC_SEC;
  const quizDurationMinutes = Math.floor(quizDurationSec / 60);

  const startQuiz = useCallback(() => {
    setQuizStarted(true);
    setQuizTimeRemainingSec(quizDurationSec);
    setQuizTimeExpired(false);
  }, [quizDurationSec]);

  // Countdown timer: when quiz has started, decrement every second; at 0, stop quiz
  useEffect(() => {
    if (!isQuiz || !quizStarted || quizTimeExpired) return;
    const interval = setInterval(() => {
      setQuizTimeRemainingSec((prev) => {
        if (prev <= 1) {
          setQuizTimeExpired(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [isQuiz, quizStarted, quizTimeExpired]);

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
    setLastQuizScore(null);
    setMarkReadError(null);
    setQuizStarted(false);
    setQuizTimeRemainingSec(0);
    setQuizTimeExpired(false);
  };

  // Persist score when results are shown so it stays visible after isRead becomes true
  useEffect(() => {
    if (isQuiz && showQuizResults && quizQuestions.length > 0 && Object.keys(quizResults).length > 0) {
      const correctCount = Object.values(quizResults).filter(Boolean).length;
      const total = quizQuestions.length;
      const scorePercent = total > 0 ? Math.round((correctCount / total) * 100) : 0;
      setLastQuizScore({ correctCount, total, scorePercent, passed: scorePercent > 50 });
    }
  }, [isQuiz, showQuizResults, quizResults, quizQuestions.length]);
  
  const toggleComplete = async () => {
    if (markingRead) return;
    if (!getToken) {
      setMarkReadError(t("Please sign in to save your progress."));
      return;
    }
    
    // For quizzes, validate answers first; progress counts only if passed (score > 50%)
    if (isQuiz && !isRead(submoduleId) && !showQuizResults) {
      if (!allQuizAttempted) {
        setMarkReadError(t("Please answer all questions before submitting."));
        return;
      }
      setQuizTimeExpired(true);
      checkQuizAnswers();
      const correctCount = quizQuestions.reduce((acc, _, qi) => 
        acc + (quizSelections[qi] === quizQuestions[qi].correctIndex ? 1 : 0), 0);
      const total = quizQuestions.length;
      const scorePercent = total > 0 ? Math.round((correctCount / total) * 100) : 0;
      const passed = scorePercent > 50;
      if (!passed) {
        setMarkReadError(t("You need to pass (score above 50%) to complete this quiz. Review and retake."));
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
        // Mark as complete (for quiz: only reached here if passed)
      const res = await api.markCourseProgressComplete(courseId, submoduleId);
      setCompletedIds(res.completed ?? [...completedIds, submoduleId]);
      
      // Check if certificate was generated
      if (res.certificateGenerated) {
        setCertificateGenerated(true);
        // Auto-hide notification after 10 seconds
        setTimeout(() => setCertificateGenerated(false), 10000);
      }
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : t("Failed to update progress");
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
    if (displayCourse && moduleIndex >= 0) {
      setSidebarExpanded(new Set([moduleIndex]));
    }
  }, [displayCourse, moduleIndex]);

  // Pre-translate static strings when language changes (performance optimization)
  useEffect(() => {
    const preTranslatePageContent = async () => {
      if (language === "en") {
        setTranslationReady(true);
        return;
      }

      setTranslationReady(false);

      // Collect all static strings on the page for batch translation
      const staticStrings = [
        // Navigation
        "Back to course",
        "items",
        "complete",
        "of",
        "completed",
        "Module Quiz",
        "Section",
        "Previous",
        "Next",
        "Back to Course",
        
        // Buttons and actions
        "Mark as Complete",
        "Mark as Incomplete",
        "Saving…",
        "Updating…",
        "Submit Quiz",
        "Submitting…",
        "Retake Quiz",
        "Complete Quiz",
        "Start Quiz",
        "You have",
        "minutes to complete this quiz.",
        "Time's up!",
        "The quiz has ended. Submit your answers to see your score.",
        "remaining",
        
        // Quiz
        "No questions in this quiz.",
        "Please answer all",
        "question",
        "questions",
        "to submit.",
        "Please answer all questions before submitting.",
        "Some answers are incorrect. Please review and try again.",
        "You need to pass (score above 50%) to complete this quiz. Review and retake.",
        "All answers are correct! Great job!",
        "Score",
        "You scored",
        "out of",
        "Pass",
        "Fail",
        "Marks",
        "Question",
        "Correct",
        "Incorrect",
        
        // Certificate notification
        "Certificate Earned! 🎉",
        "Congratulations! You've successfully completed this course and earned a certificate of completion.",
        "View Certificate",
        
        // Resources
        "Additional Resources",
        "No content available for this section.",
        "Section not found.",
        
        // Callout types
        "INFO",
        "NOTE",
        "TIP",
        "WARNING",
        "IMPORTANT",
        
        // Error messages
        "Please sign in to save your progress.",
        "Failed to update progress",
        "Loading...",
        
        // Module navigation
        "modules",
        "of",
        
        // Media
        "Course image",
      ];

      await preTranslate(staticStrings);
      setTranslationReady(true);
    };

    preTranslatePageContent();
  }, [language, preTranslate]);

  // Translate dynamic course content when language or course changes
  useEffect(() => {
    if (language === "en" || !course) {
      setTranslatedCourse(course);
      return;
    }

    if (!translationReady) {
      return;
    }

    const translateCourseContent = async () => {
      try {
        // Collect all dynamic texts for batch translation
        const textsToTranslate: string[] = [];
        const textMap: Array<{ type: string; path: string[] }> = [];

        // Course title
        if (course.courseTitle) {
          textsToTranslate.push(course.courseTitle);
          textMap.push({ type: "courseTitle", path: [] });
        }

        // Module titles and section titles
        course.modules?.forEach((mod, modIdx) => {
          if (mod.title) {
            textsToTranslate.push(mod.title);
            textMap.push({ type: "moduleTitle", path: [modIdx.toString()] });
          }

          mod.sections?.forEach((section, secIdx) => {
            if (section.title) {
              textsToTranslate.push(section.title);
              textMap.push({ type: "sectionTitle", path: [modIdx.toString(), secIdx.toString()] });
            }
          });

          // Quiz questions
          mod.quiz?.forEach((q, qIdx) => {
            if (q.question) {
              textsToTranslate.push(q.question);
              textMap.push({ type: "quizQuestion", path: [modIdx.toString(), qIdx.toString(), "question"] });
            }
            q.choices?.forEach((choice, cIdx) => {
              if (choice) {
                textsToTranslate.push(choice);
                textMap.push({ type: "quizChoice", path: [modIdx.toString(), qIdx.toString(), "choices", cIdx.toString()] });
              }
            });
          });
        });

        if (textsToTranslate.length === 0) {
          setTranslatedCourse(course);
          return;
        }

        // Batch translate all texts
        const { translateService } = await import("@/services/translateService");
        const translatedTexts = await translateService.translateBatch(textsToTranslate);

        // Reconstruct course with translated content
        const translated: Course = {
          ...course,
          courseTitle: course.courseTitle && textMap.find(m => m.type === "courseTitle")
            ? translatedTexts[textsToTranslate.indexOf(course.courseTitle)]
            : course.courseTitle,
          modules: course.modules?.map((mod, modIdx) => {
            const moduleTitleIndex = textMap.findIndex(m => m.type === "moduleTitle" && m.path[0] === modIdx.toString());
            const translatedModuleTitle = moduleTitleIndex >= 0
              ? translatedTexts[textsToTranslate.indexOf(mod.title || "")]
              : mod.title;

            return {
              ...mod,
              title: translatedModuleTitle,
              sections: mod.sections?.map((section, secIdx) => {
                const sectionTitleIndex = textMap.findIndex(
                  m => m.type === "sectionTitle" && m.path[0] === modIdx.toString() && m.path[1] === secIdx.toString()
                );
                const translatedSectionTitle = sectionTitleIndex >= 0
                  ? translatedTexts[textsToTranslate.indexOf(section.title || "")]
                  : section.title;

                return {
                  ...section,
                  title: translatedSectionTitle,
                };
              }),
              quiz: mod.quiz?.map((q, qIdx) => {
                const questionIndex = textMap.findIndex(
                  m => m.type === "quizQuestion" && m.path[0] === modIdx.toString() && m.path[1] === qIdx.toString()
                );
                const translatedQuestion = questionIndex >= 0
                  ? translatedTexts[textsToTranslate.indexOf(q.question || "")]
                  : q.question;

                const translatedChoices = q.choices?.map((choice, cIdx) => {
                  const choiceIndex = textMap.findIndex(
                    m => m.type === "quizChoice" && m.path[0] === modIdx.toString() && m.path[1] === qIdx.toString() && m.path[3] === cIdx.toString()
                  );
                  return choiceIndex >= 0
                    ? translatedTexts[textsToTranslate.indexOf(choice || "")]
                    : choice;
                });

                return {
                  ...q,
                  question: translatedQuestion,
                  choices: translatedChoices,
                };
              }),
            };
          }),
        };

        setTranslatedCourse(translated);
      } catch (error) {
        console.error("Error translating course content:", error);
        setTranslatedCourse(course);
      }
    };

    translateCourseContent();
  }, [course, language, translationReady]);

  // Translate current section material when section changes (performance: only translate visible content)
  useEffect(() => {
    if (language === "en" || !currentSection || !translationReady) {
      setTranslatedSectionMaterial(null);
      setTranslatedMediaCaptions(new Map());
      return;
    }

    const translateSectionContent = async () => {
      try {
        const textsToTranslate: string[] = [];
        const materialIndexRef = { value: -1 };
        const captionIndices: number[] = [];
        const captionMap: Map<number, number> = new Map(); // Maps media index to translation index

        // Translate section material
        if (currentSection.material) {
          materialIndexRef.value = textsToTranslate.length;
          textsToTranslate.push(currentSection.material);
        }

        // Translate media captions (alt text will use caption translation if available)
        if (currentSection.media && currentSection.media.length > 0) {
          currentSection.media.forEach((mediaItem, idx) => {
            if (mediaItem.caption) {
              captionMap.set(idx, textsToTranslate.length);
              textsToTranslate.push(mediaItem.caption);
            } else if (mediaItem.alt) {
              // If no caption, translate alt text
              captionMap.set(idx, textsToTranslate.length);
              textsToTranslate.push(mediaItem.alt);
            }
          });
        }

        if (textsToTranslate.length === 0) {
          setTranslatedSectionMaterial(null);
          setTranslatedMediaCaptions(new Map());
          return;
        }

        // Batch translate all texts
        const { translateService } = await import("@/services/translateService");
        const translatedTexts = await translateService.translateBatch(textsToTranslate);

        // Update state with translations
        if (materialIndexRef.value >= 0) {
          setTranslatedSectionMaterial(translatedTexts[materialIndexRef.value]);
        } else {
          setTranslatedSectionMaterial(null);
        }

        // Update media captions
        const newCaptions = new Map<number, string>();
        captionMap.forEach((translationIdx, mediaIdx) => {
          newCaptions.set(mediaIdx, translatedTexts[translationIdx]);
        });
        setTranslatedMediaCaptions(newCaptions);
      } catch (error) {
        console.error("Error translating section content:", error);
        setTranslatedSectionMaterial(null);
        setTranslatedMediaCaptions(new Map());
      }
    };

    translateSectionContent();
  }, [currentSection, language, translationReady]);

  const toggleSidebarModule = (modIdx: number) => {
    setSidebarExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(modIdx)) next.delete(modIdx);
      else next.add(modIdx);
      return next;
    });
  };

  const getTotalItems = useCallback(() => {
    if (!displayCourse) return 0;
    return displayCourse.modules.reduce(
      (acc, m) => acc + (m.sections?.length ?? 0) + ((m.quiz?.length ?? 0) > 0 ? 1 : 0),
      0
    );
  }, [displayCourse]);

  const getCompletedCount = () => completedIds.length;
  const progressPercent = getTotalItems() > 0 ? Math.round((getCompletedCount() / getTotalItems()) * 100) : 0;

  if (loading || !displayCourse) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">{t("Loading...")}</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-red-600">{error}</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex">
      {/* Sidebar Navigation */}
      <aside
        className={`${
          sidebarCollapsed ? "w-0" : "w-80"
        } bg-card border-r border-border transition-all duration-300 overflow-hidden flex-shrink-0 sticky top-0 h-screen overflow-y-auto`}
      >
        <div className="p-6">
          {/* Course Header */}
          <div className="mb-6">
            <button
              onClick={() => router.push(`/dashboard/training-modules/${courseId}`)}
              className="flex items-center gap-2 text-sm text-foreground hover:text-primary transition-colors mb-3"
            >
              <ArrowLeft className="w-4 h-4" />
              {t("Back to course")}
            </button>
            <h2 className="text-lg font-bold text-foreground line-clamp-2 mb-2">{displayCourse.courseTitle}</h2>
            <div className="flex items-center gap-4 text-xs text-muted-foreground">
              <div className="flex items-center gap-1">
                <Clock className="w-3 h-3" />
                <span>{getTotalItems()} {t("items")}</span>
              </div>
              <div className="flex items-center gap-1">
                <Award className="w-3 h-3" />
                <span>{progressPercent}% {t("complete")}</span>
              </div>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="mb-6">
            <div className="h-2 bg-muted rounded-full overflow-hidden">
              <div
                className="h-full bg-primary transition-all duration-300"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {getCompletedCount()} {t("of")} {getTotalItems()} {t("completed")}
            </p>
          </div>

          {/* Course Modules Navigation */}
          <nav className="space-y-1">
            {displayCourse.modules.map((mod, modIdx) => {
              const isExpanded = sidebarExpanded.has(modIdx);
              const sections = mod.sections || [];
              const hasQuiz = (mod.quiz?.length ?? 0) > 0;
              const isCurrentModule = modIdx === moduleIndex;

              return (
                <div key={mod._id || modIdx} className="border border-border rounded-lg overflow-hidden">
                  <button
                    onClick={() => toggleSidebarModule(modIdx)}
                    className={`w-full px-4 py-3 flex items-center justify-between text-left transition-colors ${
                      isCurrentModule
                        ? "bg-primary/10 border-l-4 border-l-primary"
                        : "hover:bg-muted"
                    }`}
                  >
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      <div
                        className={`w-6 h-6 rounded flex items-center justify-center flex-shrink-0 ${
                          isCurrentModule
                            ? "bg-primary text-primary-foreground"
                            : "bg-muted text-muted-foreground"
                        }`}
                      >
                        <span className="text-xs font-semibold">{modIdx + 1}</span>
                      </div>
                      <span
                        className={`text-sm font-medium truncate ${
                          isCurrentModule ? "text-primary" : "text-foreground"
                        }`}
                      >
                        {mod.title || `Module ${modIdx + 1}`}
                      </span>
                    </div>
                    {isExpanded ? (
                      <ChevronDown className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                    ) : (
                      <ChevronRight className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                    )}
                  </button>

                  {isExpanded && (
                    <div className="bg-muted/50 border-t border-border">
                      {sections.map((section, secIdx) => {
                        const sectionId = `${modIdx}-${secIdx}`;
                        const isCurrent = modIdx === moduleIndex && secIdx === sectionIndex;
                        const isCompleted = isRead(sectionId);

                        return (
                          <button
                            key={section._id || secIdx}
                            onClick={() => router.push(`/dashboard/training-modules/${courseId}/${sectionId}`)}
                            className={`w-full px-4 py-2.5 pl-12 flex items-center gap-2 text-left text-sm transition-colors border-b border-border last:border-0 ${
                              isCurrent
                                ? "bg-primary/5 text-primary font-medium"
                                : "text-foreground hover:bg-muted"
                            }`}
                          >
                            {isCompleted ? (
                              <CheckCircle2 className="w-4 h-4 text-primary flex-shrink-0" />
                            ) : (
                              <Circle className="w-4 h-4 text-muted-foreground flex-shrink-0" />
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
                              ? "bg-primary/5 text-primary font-medium"
                              : "text-foreground hover:bg-muted"
                          }`}
                        >
                          {isRead(`${modIdx}-quiz`) ? (
                            <CheckCircle2 className="w-4 h-4 text-primary flex-shrink-0" />
                          ) : (
                            <FileQuestion className="w-4 h-4 text-primary flex-shrink-0" />
                          )}
                          <span>{t("Module Quiz")}</span>
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
        <header className="bg-card border-b border-border sticky top-0 z-20">
          <div className="px-6 py-4 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
                className="p-2 hover:bg-muted rounded-lg transition-colors"
                aria-label="Toggle sidebar"
              >
                <BookOpen className="w-5 h-5 text-muted-foreground" />
              </button>
              <div>
                <h1 className="text-lg font-semibold text-foreground">{displayCourse.courseTitle}</h1>
                {currentModule && (
                  <p className="text-sm text-muted-foreground">
                    {currentModule.title} {isQuiz ? `• ${t("Module Quiz")}` : currentSection ? `• ${currentSection.title}` : ""}
                  </p>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">
                {moduleIndex + 1} {t("of")} {displayCourse.modules.length} {t("modules")}
            </span>
          </div>
        </div>
      </header>

        {/* Main content - professional layout */}
        <main className="flex-1 overflow-y-auto">
          <div className="max-w-4xl mx-auto px-6 py-8">
            {/* Certificate Generated Notification - Cisco Style with Cybershield Colors */}
            {certificateGenerated && (
              <div className="mb-6 bg-card border border-primary/30 rounded-lg p-5 shadow-sm">
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 w-12 h-12 rounded-lg bg-primary flex items-center justify-center">
                    <Award className="w-6 h-6 text-primary-foreground" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-base font-semibold text-foreground mb-1.5">{t("Certificate Earned! 🎉")}</h3>
                    <p className="text-muted-foreground mb-4 text-sm leading-relaxed">
                      {t("Congratulations! You've successfully completed this course and earned a certificate of completion.")}
                    </p>
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => router.push("/dashboard/certificates")}
                        className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary text-primary-foreground rounded-md hover:opacity-90 transition-colors text-sm font-medium"
                      >
                        <Award className="w-4 h-4" />
                        {t("View Certificate")}
                      </button>
                      <button
                        onClick={() => router.push(`/dashboard/training-modules/${courseId}`)}
                        className="inline-flex items-center gap-2 px-5 py-2.5 border border-primary text-primary rounded-md hover:bg-primary/5 transition-colors text-sm font-medium"
                      >
                        <ArrowLeft className="w-4 h-4" />
                        {t("Back to Course")}
                      </button>
                    </div>
                  </div>
                  <button
                    onClick={() => setCertificateGenerated(false)}
                    className="flex-shrink-0 text-muted-foreground hover:text-muted-foreground transition-colors p-1"
                    aria-label="Close notification"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>
            )}
        {isQuiz ? (
              <article className="bg-card rounded-xl shadow-sm border border-border overflow-hidden">
                {/* Start Quiz screen */}
                {!quizStarted ? (
                  <div className="px-8 py-12 text-center">
                    <div className="max-w-md mx-auto">
                      <div className="w-20 h-20 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-6">
                        <FileQuestion className="w-10 h-10 text-primary" />
                      </div>
                      <h1 className="text-2xl font-bold text-foreground mb-2">{t("Module Quiz")}</h1>
                      {currentModule?.title && (
                        <p className="text-muted-foreground mb-6">{currentModule.title}</p>
                      )}
                      <p className="text-foreground mb-2">
                        {t("You have")} <strong>{quizDurationMinutes}</strong> {t("minutes to complete this quiz.")}
                      </p>
                      <p className="text-sm text-muted-foreground mb-8">
                        {quizQuestions.length} {quizQuestions.length === 1 ? t("question") : t("questions")}
                      </p>
                      <button
                        type="button"
                        onClick={startQuiz}
                        className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-xl bg-primary text-primary-foreground hover:opacity-90 transition-colors text-lg font-semibold shadow-md hover:shadow-lg"
                      >
                        <PlayCircle className="w-6 h-6" />
                        {t("Start Quiz")}
                      </button>
                    </div>
                  </div>
                ) : (
                <>
                <div className="bg-gradient-to-r from-primary/10 to-primary/10 px-8 py-6 border-b border-border">
                  <div className="flex items-center justify-between flex-wrap gap-4">
                    <div className="flex items-center gap-4">
                      <div className="w-14 h-14 rounded-xl bg-primary flex items-center justify-center shadow-lg">
                        <FileQuestion className="w-7 h-7 text-primary-foreground" />
                      </div>
                      <div>
                        <h1 className="text-2xl font-bold text-foreground mb-1">{t("Module Quiz")}</h1>
                        {currentModule?.title && (
                          <p className="text-sm text-muted-foreground">{currentModule.title}</p>
                        )}
                      </div>
                    </div>
                    {/* Timer */}
                    <div className={`flex items-center gap-2 px-4 py-2 rounded-lg font-mono text-lg font-semibold ${
                      quizTimeExpired ? "bg-red-100 text-red-800" : quizTimeRemainingSec <= 60 ? "bg-amber-100 text-amber-800" : "bg-card/80 text-foreground"
                    }`}>
                      <Clock className="w-5 h-5" />
                      {quizTimeExpired ? (
                        <span>{t("Time's up!")}</span>
                      ) : (
                        <span>
                          {Math.floor(quizTimeRemainingSec / 60)}:{(quizTimeRemainingSec % 60).toString().padStart(2, "0")} {t("remaining")}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                {quizTimeExpired && (
                  <div className="px-8 py-3 bg-amber-50 border-b border-amber-200 text-amber-800 text-sm font-medium">
                    {t("The quiz has ended. Submit your answers to see your score.")}
                  </div>
                )}
                <div className="px-8 py-8">
              {quizQuestions.length === 0 ? (
                    <div className="text-center py-12">
                      <FileQuestion className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                      <p className="text-muted-foreground text-lg">{t("No questions in this quiz.")}</p>
                    </div>
              ) : (
                    <div className="space-y-10">
                  {quizQuestions.map((q, qi) => (
                    <section
                      key={q._id || qi}
                          className={qi < quizQuestions.length - 1 ? "pb-10 border-b border-border" : ""}
                        >
                          <div className={`flex items-start gap-4 mb-10 ${qi > 0 ? "pt-8" : ""}`}>
                            <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                              <span className="text-primary font-bold text-lg">{qi + 1}</span>
                            </div>
                            <div className="flex-1">
                              <h3 className="text-xl font-semibold text-foreground leading-relaxed mb-6">
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
                                          if (!showQuizResults && !quizTimeExpired) {
                                            setQuizSelections((prev) => ({ ...prev, [qi]: ci }));
                                }
                                        }}
                                        disabled={showQuizResults || quizTimeExpired}
                                        className={`w-full flex items-center gap-4 px-6 py-4 rounded-lg text-left transition-all min-h-[3.5rem] disabled:opacity-100 disabled:cursor-default ${
                                  isSelected
                                            ? showCorrect
                                              ? "bg-green-50 text-green-800 font-medium border-2 border-green-500 shadow-sm disabled:text-green-800"
                                              : isIncorrect
                                              ? "bg-red-50 text-red-800 font-medium border-2 border-red-500 shadow-sm disabled:text-red-800"
                                              : "bg-primary/10 text-primary font-medium border-2 border-primary shadow-sm disabled:text-primary"
                                            : showCorrect
                                            ? "bg-green-50 text-green-800 border-2 border-green-500 disabled:text-green-800"
                                            : "bg-white text-foreground border-2 border-border hover:bg-muted hover:border-border disabled:text-foreground"
                                        } ${showQuizResults ? "cursor-default" : "cursor-pointer"}`}
                              >
                                <span
                                          className={`flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center text-base font-bold transition-colors ${
                                    isSelected
                                              ? showCorrect
                                                ? "bg-green-500 text-white"
                                                : isIncorrect
                                                ? "bg-red-500 text-white"
                                                : "bg-primary text-primary-foreground"
                                              : showCorrect
                                              ? "bg-green-500 text-white border-2 border-green-600"
                                              : "bg-muted text-foreground border-2 border-border"
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

              {/* Quiz submit / results: show when quiz in progress (Submit) or after quiz (score + retake) */}
                  <div className="mt-10 pt-8 border-t border-border">
                    <div className="space-y-4">
                {(showQuizResults || (isRead(submoduleId) && !quizStarted)) ? (
                        <div className="space-y-4">
                          {(() => {
                            const score = showQuizResults && Object.keys(quizResults).length > 0
                              ? (() => {
                                  const correctCount = Object.values(quizResults).filter(Boolean).length;
                                  const total = quizQuestions.length;
                                  const scorePercent = total > 0 ? Math.round((correctCount / total) * 100) : 0;
                                  return { correctCount, total, scorePercent, passed: scorePercent > 50 };
                                })()
                              : lastQuizScore;
                            return score ? (
                              <>
                                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-4 rounded-xl bg-gray-50 border border-border">
                                  <div>
                                    <p className="text-sm font-medium text-muted-foreground mb-0.5">{t("Score")}</p>
                                    <p className="text-2xl font-bold text-foreground">
                                      {t("You scored")} {score.correctCount} {t("out of")} {score.total} ({score.scorePercent}%)
                                    </p>
                                  </div>
                                  <div className={`flex items-center gap-2 px-4 py-2.5 rounded-lg font-semibold ${score.passed ? "bg-green-100 text-green-800 border border-green-200" : "bg-red-100 text-red-800 border border-red-200"}`}>
                                    {score.passed ? (
                                      <>
                                        <CheckCircle2 className="w-5 h-5 shrink-0" />
                                        <span>{t("Pass")}</span>
                                      </>
                                    ) : (
                                      <>
                                        <X className="w-5 h-5 shrink-0" />
                                        <span>{t("Fail")}</span>
                                      </>
                                    )}
                                  </div>
                                </div>
                                {showQuizResults && Object.values(quizResults).every(r => r) && (
                                  <div className="flex items-center gap-2 px-4 py-3 bg-green-50 border border-green-200 rounded-lg">
                                    <CheckCircle2 className="w-5 h-5 text-green-600 shrink-0" />
                                    <span className="!text-green-800 font-medium">{t("All answers are correct! Great job!")}</span>
                                  </div>
                                )}
                                {/* Per-question marks breakdown */}
                                {showQuizResults && Object.keys(quizResults).length > 0 && (
                                  <div className="rounded-xl border border-border bg-card p-4">
                                    <p className="text-sm font-semibold text-foreground mb-3">{t("Marks")}</p>
                                    <div className="grid gap-2 sm:grid-cols-2">
                                      {quizQuestions.map((_, qi) => {
                                        const correct = quizResults[qi];
                                        return (
                                          <div
                                            key={qi}
                                            className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium ${correct ? "bg-green-50 text-green-800 border border-green-200" : "bg-red-50 text-red-800 border border-red-200"}`}
                                          >
                                            {correct ? <CheckCircle2 className="w-4 h-4 shrink-0" /> : <X className="w-4 h-4 shrink-0" />}
                                            <span>{t("Question")} {qi + 1}: {correct ? t("Correct") : t("Incorrect")}</span>
                                          </div>
                                        );
                                      })}
                                    </div>
                                  </div>
                                )}
                              </>
                            ) : null;
                          })()}
                          <div className="space-y-3">
                            {isRead(submoduleId) ? (
                              <button
                                type="button"
                                onClick={toggleComplete}
                                disabled={markingRead}
                                className="inline-flex items-center justify-center gap-3 px-6 py-3 rounded-lg bg-primary text-primary-foreground hover:opacity-90 transition-colors text-base font-semibold disabled:opacity-60 disabled:cursor-not-allowed shadow-md hover:shadow-lg"
                              >
                                <RotateCcw className="w-5 h-5 shrink-0" />
                                <span>{markingRead ? t("Updating…") : t("Retake Quiz")}</span>
                              </button>
                            ) : (
                              <button
                                type="button"
                                onClick={retakeQuiz}
                                className="inline-flex items-center justify-center gap-3 px-6 py-3 rounded-lg bg-primary text-primary-foreground hover:opacity-90 transition-colors text-base font-semibold disabled:opacity-60 disabled:cursor-not-allowed shadow-md hover:shadow-lg"
                              >
                                <RotateCcw className="w-5 h-5 shrink-0" />
                                <span>{t("Retake Quiz")}</span>
                              </button>
                            )}
                          </div>
                        </div>
                ) : (
                  <>
                    <button
                      type="button"
                            onClick={toggleComplete}
                      disabled={!allQuizAttempted || markingRead}
                            className="inline-flex items-center justify-center gap-3 px-6 py-3 rounded-lg bg-primary text-primary-foreground hover:opacity-90 transition-colors text-base font-semibold disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-primary shadow-md hover:shadow-lg"
                    >
                      <Check className="w-5 h-5 shrink-0" />
                            <span>{markingRead ? t("Submitting…") : t("Submit Quiz")}</span>
                    </button>
                    {!allQuizAttempted && !quizTimeExpired && quizQuestions.length > 0 && (
                            <p className="text-sm text-muted-foreground">
                              {t("Please answer all")} {quizQuestions.length} {quizQuestions.length !== 1 ? t("questions") : t("question")} {t("to submit.")}
                      </p>
                    )}
                    {quizTimeExpired && (
                      <p className="text-sm text-amber-700 font-medium">
                        {t("The quiz has ended. Submit your answers to see your score.")}
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
                </>
                )}
          </article>
        ) : currentSection ? (
              <article className="bg-card rounded-xl shadow-sm border border-border overflow-hidden">
                {/* Section Header */}
                <div className="bg-gradient-to-r from-primary/10 to-primary/10 px-8 py-6 border-b border-border">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-xl bg-primary flex items-center justify-center shadow-lg">
                      <BookOpen className="w-7 h-7 text-primary-foreground" />
                </div>
                <div>
                      <h1 className="text-2xl font-bold text-foreground mb-1">
                    {currentSection.title || t("Section")}
                  </h1>
                  {currentModule?.title && (
                        <p className="text-sm text-muted-foreground">{currentModule.title}</p>
                  )}
                </div>
                  </div>
                </div>

                {/* Section Content */}
                <div className="px-8 py-8">
                  {(currentSection.material || translatedSectionMaterial) && (
                    <article className="max-w-none mb-8 prose prose-lg prose-gray max-w-none">
                      <div className="text-foreground leading-relaxed space-y-6">
                        {formatContent(
                          translatedSectionMaterial || currentSection.material || "",
                          t
                        )}
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
                                alt={
                                  mediaItem.alt 
                                    ? (translatedMediaCaptions.get(idx) || mediaItem.alt)
                                    : mediaItem.caption
                                    ? (translatedMediaCaptions.get(idx) || mediaItem.caption)
                                    : t('Course image')
                                }
                                className="w-full rounded-xl shadow-lg object-cover"
                                onError={(e) => {
                                  console.error('Image failed to load:', mediaItem.url);
                                  e.currentTarget.style.display = 'none';
                                }}
                              />
                              {mediaItem.caption && (
                                <figcaption className="text-sm text-muted-foreground text-center mt-3 italic">
                                  {translatedMediaCaptions.get(idx) || mediaItem.caption}
                                </figcaption>
                              )}
                            </figure>
                          ) : (
                            <figure className="w-full">
                              <VideoPlayer mediaItem={mediaItem} />
                              {mediaItem.caption && (
                                <figcaption className="text-sm text-muted-foreground text-center mt-3 italic">
                                  {translatedMediaCaptions.get(idx) || mediaItem.caption}
                                </figcaption>
                              )}
                            </figure>
                          )}
                        </div>
                      ))}
                </div>
              )}

              {(currentSection.urls?.length ?? 0) > 0 && (
                    <div className="mt-8 pt-8 border-t border-border">
                      <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                        <LinkIcon className="w-5 h-5 text-primary" />
                        {t("Additional Resources")}
                  </h2>
                      <ul className="space-y-3">
                    {currentSection.urls.map((url, i) => (
                      <li key={i}>
                        <a
                          href={url}
                          target="_blank"
                          rel="noopener noreferrer"
                              className="flex items-center gap-3 px-4 py-3 bg-muted hover:bg-primary/5 border border-border hover:border-primary/30 rounded-lg transition-colors group"
                        >
                              <LinkIcon className="w-4 h-4 text-primary flex-shrink-0" />
                              <span className="text-primary hover:underline break-all text-sm font-medium group-hover:text-primary">
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
                      <BookOpen className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                      <p className="text-muted-foreground text-lg">{t("No content available for this section.")}</p>
                    </div>
              )}

              {/* Mark as read */}
                  <div className="mt-10 pt-8 border-t border-border">
                    <div>
                {isRead(submoduleId) ? (
                        <button
                          type="button"
                          onClick={toggleComplete}
                          disabled={markingRead}
                          className="inline-flex items-center justify-center gap-3 px-6 py-3 rounded-lg bg-primary text-primary-foreground hover:opacity-90 transition-colors text-base font-semibold disabled:opacity-60 disabled:cursor-not-allowed shadow-md hover:shadow-lg"
                        >
                    <CheckCircle2 className="w-5 h-5 shrink-0" />
                          <span>{markingRead ? t("Updating…") : t("Mark as Incomplete")}</span>
                        </button>
                ) : (
                  <button
                    type="button"
                          onClick={toggleComplete}
                    disabled={markingRead}
                          className="group inline-flex items-center justify-center gap-3 px-6 py-3 rounded-lg border-2 border-primary bg-white hover:bg-primary transition-colors text-base font-semibold disabled:opacity-60 disabled:cursor-not-allowed shadow-sm hover:shadow-md"
                  >
                          <Circle className="w-5 h-5 shrink-0 text-primary group-hover:text-primary-foreground transition-colors" />
                          <span className="text-primary group-hover:text-primary-foreground transition-colors">{markingRead ? t("Saving…") : t("Mark as Complete")}</span>
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
              <div className="bg-card rounded-xl p-12 text-center border border-border">
                <BookOpen className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground text-lg">{t("Section not found.")}</p>
          </div>
        )}

        {/* Bottom navigation */}
        <nav className="mt-10 flex items-center justify-between gap-4">
          {prevUrl ? (
            <button
              onClick={() => router.push(`/dashboard/training-modules/${courseId}/${prevUrl}`)}
                  className="inline-flex items-center justify-center gap-2.5 px-6 py-3 rounded-lg border-2 border-border bg-card text-foreground hover:bg-muted hover:border-primary hover:text-primary transition-colors font-medium shadow-sm hover:shadow-md"
            >
                  <ChevronLeft className="w-5 h-5 flex-shrink-0" />
                  <span>{t("Previous")}</span>
            </button>
          ) : (
            <div />
          )}
          {nextUrl ? (
            <button
              onClick={() => router.push(`/dashboard/training-modules/${courseId}/${nextUrl}`)}
                  className="inline-flex items-center justify-center gap-2.5 px-6 py-3 rounded-lg bg-primary text-primary-foreground hover:opacity-90 transition-colors font-semibold shadow-md hover:shadow-lg ml-auto"
            >
                  <span>{sectionIndex === sections.length - 1 && hasQuiz ? t("Module Quiz") : t("Next")}</span>
                  <ChevronRight className="w-5 h-5 flex-shrink-0" />
            </button>
          ) : (
            <button
              onClick={() => router.push(`/dashboard/training-modules/${courseId}`)}
                  className="inline-flex items-center justify-center gap-2.5 px-6 py-3 rounded-lg border-2 border-border bg-card text-foreground hover:bg-muted hover:border-primary hover:text-primary transition-colors font-medium ml-auto shadow-sm hover:shadow-md"
            >
                  <ArrowLeft className="w-5 h-5 flex-shrink-0" />
                  <span>{t("Back to Course")}</span>
            </button>
          )}
        </nav>
          </div>
      </main>
      </div>
    </div>
  );
}
