"use client";

import React, { useState, useEffect, useMemo, useCallback, useRef } from "react";
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
  Mail,
  MessageCircle,
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
        <strong key={`bold-${key++}`} className="font-semibold text-gray-900 dark:text-white">
          {segment.content}
        </strong>
      );
    } else if (segment.type === 'italic') {
      parts.push(
        <em key={`italic-${key++}`} className="text-gray-700 dark:text-[var(--dashboard-text-secondary)]">
          {segment.content}
        </em>
      );
    } else if (segment.type === 'code') {
      parts.push(
        <code key={`code-${key++}`} className="px-1.5 py-0.5 bg-gray-100 dark:bg-[var(--navy-blue-lighter)] text-[var(--neon-blue)] rounded text-sm font-mono">
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
              <li key={idx} className="pl-2 text-gray-800 dark:text-[var(--dashboard-text-secondary)] leading-relaxed">
                {formatInlineMarkdown(item)}
              </li>
            ))}
          </ol>
        );
      } else {
        parts.push(
          <ul key={`list-${key++}`} className="list-disc list-inside space-y-2 my-4 ml-4">
            {listItems.map((item, idx) => (
              <li key={idx} className="pl-2 text-gray-800 dark:text-[var(--dashboard-text-secondary)] leading-relaxed">
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
        ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-500/30' 
        : isTip 
        ? 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-500/30'
        : 'bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-500/30';
      const iconColor = isInfo
        ? 'text-blue-600 dark:text-blue-400'
        : isTip
        ? 'text-yellow-600 dark:text-yellow-400'
        : 'text-orange-600 dark:text-orange-400';
      const Icon = isInfo ? Info : isTip ? Lightbulb : AlertCircle;
      
      parts.push(
        <div key={`callout-${key++}`} className={`${bgColor} border-l-4 rounded-r-lg p-4 my-4`}>
          <div className="flex items-start gap-3">
            <Icon className={`w-5 h-5 ${iconColor} flex-shrink-0 mt-0.5`} />
            <div className="flex-1">
              <p className="font-semibold text-gray-900 dark:text-white mb-1">{translateFn ? translateFn(type) : type}</p>
              <div className="text-gray-800 dark:text-[var(--dashboard-text-secondary)] leading-relaxed">{formatInlineMarkdown(content)}</div>
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
        <h3 key={`h3-${key++}`} className="text-xl font-bold text-gray-900 dark:text-white mt-6 mb-3">
          {formatInlineMarkdown(headingText)}
        </h3>
      );
      return;
    }
    if (trimmed.startsWith('##')) {
      flushList();
      const headingText = trimmed.substring(2).trim();
      parts.push(
        <h2 key={`h2-${key++}`} className="text-2xl font-bold text-gray-900 dark:text-white mt-8 mb-4 border-b border-gray-200 dark:border-[var(--neon-blue)]/30 pb-2">
          {formatInlineMarkdown(headingText)}
        </h2>
      );
      return;
    }
    if (trimmed.startsWith('#')) {
      flushList();
      const headingText = trimmed.substring(1).trim();
      parts.push(
        <h1 key={`h1-${key++}`} className="text-3xl font-bold text-gray-900 dark:text-white mt-8 mb-4">
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
      <p key={`p-${key++}`} className="text-gray-800 dark:text-[var(--dashboard-text-secondary)] leading-relaxed mb-6 text-lg">
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

function parseSubmoduleId(submoduleId: string): { moduleIndex: number; sectionIndex: number | "quiz" | "activity" } | null {
  if (!submoduleId) return null;
  if (submoduleId.endsWith("-quiz")) {
    const moduleIndex = parseInt(submoduleId.slice(0, -5), 10);
    if (Number.isNaN(moduleIndex) || moduleIndex < 0) return null;
    return { moduleIndex, sectionIndex: "quiz" };
  }
  if (submoduleId.endsWith("-activity")) {
    const moduleIndex = parseInt(submoduleId.slice(0, -9), 10);
    if (Number.isNaN(moduleIndex) || moduleIndex < 0) return null;
    return { moduleIndex, sectionIndex: "activity" };
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
  const isActivity = sectionIndex === "activity";

  const currentModule: CourseModule | null =
    displayCourse?.modules?.[moduleIndex] ?? null;
  const currentSection: ModuleSection | null =
    typeof sectionIndex === "number" && currentModule?.sections?.[sectionIndex]
      ? currentModule.sections[sectionIndex]
      : null;
  const activityType = isActivity ? (currentModule?.activityType ?? null) : null;

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
  const [activityStarted, setActivityStarted] = useState(false);
  /** 5-minute countdown (seconds remaining) for email activity; 0 = not started or expired */
  const [activityTimeRemainingSec, setActivityTimeRemainingSec] = useState(0);
  const [activityTimeExpired, setActivityTimeExpired] = useState(false);
  const [activityEmail, setActivityEmail] = useState("");
  const [activityPhone, setActivityPhone] = useState("");
  const [activityContactError, setActivityContactError] = useState<string | null>(null);
  const [activitySendLoading, setActivitySendLoading] = useState(false);
  const [activityEmailStatus, setActivityEmailStatus] = useState<{
    passed: boolean | null;
    hasEmail: boolean;
    openedAt?: string | null;
    clickedAt?: string | null;
    credentialsEnteredAt?: string | null;
  } | null>(null);
  const [activityWhatsAppStatus, setActivityWhatsAppStatus] = useState<{
    passed: boolean | null;
    hasCampaign: boolean;
    clickedAt?: string | null;
    reportedAt?: string | null;
  } | null>(null);
  const activityResultRecordedRef = useRef(false);
  const [activityRetryLoading, setActivityRetryLoading] = useState(false);
  const isRead = (submoduleIdParam: string) => completedIds.includes(submoduleIdParam);

  const startActivity = useCallback(async () => {
    setActivityContactError(null);
    if (activityType === "email") {
      const trimmed = activityEmail.trim();
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!trimmed) {
        setActivityContactError(t("Please enter your email address."));
        return;
      }
      if (!emailRegex.test(trimmed)) {
        setActivityContactError(t("Please enter a valid email address."));
        return;
      }
      setActivitySendLoading(true);
      try {
        const api = new ApiClient(getToken);
        const res = await api.sendActivityEmail(courseId, trimmed, submoduleId);
        setActivityStarted(true);
        const limitMinutes = res?.timeLimitMinutes ?? 5;
        setActivityTimeRemainingSec(limitMinutes * 60);
        setActivityTimeExpired(false);
      } catch (err) {
        setActivityContactError(err instanceof Error ? err.message : t("Failed to send email. Please try again."));
      } finally {
        setActivitySendLoading(false);
      }
      return;
    }
    if (activityType === "whatsapp") {
      const trimmed = activityPhone.trim();
      const digitsOnly = trimmed.replace(/\D/g, "");
      if (digitsOnly.length < 10) {
        setActivityContactError(t("Please enter a valid phone number (at least 10 digits)."));
        return;
      }
      setActivitySendLoading(true);
      try {
        const api = new ApiClient(getToken);
        const res = await api.sendActivityWhatsApp(courseId, trimmed, submoduleId);
        setActivityStarted(true);
        const limitMinutes = res?.timeLimitMinutes ?? 5;
        setActivityTimeRemainingSec(limitMinutes * 60);
        setActivityTimeExpired(false);
      } catch (err) {
        setActivityContactError(err instanceof Error ? err.message : t("Failed to send WhatsApp message. Please try again."));
      } finally {
        setActivitySendLoading(false);
      }
      return;
    }
    setActivityStarted(true);
  }, [activityType, activityEmail, activityPhone, courseId, submoduleId, getToken, t]);

  useEffect(() => {
    if (!isActivity || activityType !== "email" || !activityStarted || !getToken || !courseId) return;
    let cancelled = false;
    const fetchStatus = async () => {
      try {
        const api = new ApiClient(getToken);
        const res = await api.getActivityEmailStatus(courseId, submoduleId);
        if (cancelled) return;
        setActivityEmailStatus({
          hasEmail: res.hasEmail ?? false,
          passed: res.passed ?? null,
          openedAt: res.openedAt ?? null,
          clickedAt: res.clickedAt ?? null,
          credentialsEnteredAt: res.credentialsEnteredAt ?? null,
        });
      } catch {
        if (!cancelled) setActivityEmailStatus(null);
      }
    };
    fetchStatus();
    const interval = setInterval(fetchStatus, 10000);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [isActivity, activityType, activityStarted, courseId, submoduleId, getToken]);

  useEffect(() => {
    if (!isActivity || activityType !== "whatsapp" || !activityStarted || !getToken || !courseId) return;
    let cancelled = false;
    const fetchStatus = async () => {
      try {
        const api = new ApiClient(getToken);
        const res = await api.getActivityWhatsAppStatus(courseId, submoduleId);
        if (cancelled) return;
        setActivityWhatsAppStatus({
          hasCampaign: res.hasCampaign ?? false,
          passed: res.passed ?? null,
          clickedAt: res.clickedAt ?? null,
          reportedAt: res.reportedAt ?? null,
        });
      } catch {
        if (!cancelled) setActivityWhatsAppStatus(null);
      }
    };
    fetchStatus();
    const interval = setInterval(fetchStatus, 10000);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [isActivity, activityType, activityStarted, courseId, submoduleId, getToken]);

  // Activity 5-minute countdown: when email or WhatsApp is sent, count down; at 0, mark expired and stop
  useEffect(() => {
    if (!isActivity || (activityType !== "email" && activityType !== "whatsapp") || !activityStarted || activityTimeRemainingSec <= 0) return;
    const interval = setInterval(() => {
      setActivityTimeRemainingSec((prev) => {
        if (prev <= 1) {
          setActivityTimeExpired(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [isActivity, activityType, activityStarted, activityTimeRemainingSec]);

  // When time is up: fetch final status from MongoDB and record pass/fail in course progress
  useEffect(() => {
    if (!isActivity || activityType !== "email" || !activityTimeExpired || !activityEmailStatus?.hasEmail || !getToken || !courseId || activityResultRecordedRef.current) return;
    activityResultRecordedRef.current = true;
    const run = async () => {
      try {
        const api = new ApiClient(getToken);
        const res = await api.getActivityEmailStatus(courseId, submoduleId);
        setActivityEmailStatus({
          hasEmail: res.hasEmail ?? false,
          passed: res.passed ?? null,
          openedAt: res.openedAt ?? null,
          clickedAt: res.clickedAt ?? null,
          credentialsEnteredAt: res.credentialsEnteredAt ?? null,
        });
        await api.recordActivityResult(courseId, submoduleId, res.passed === true);
      } catch {
        activityResultRecordedRef.current = false;
      }
    };
    run();
  }, [isActivity, activityType, activityTimeExpired, activityEmailStatus?.hasEmail, courseId, submoduleId, getToken]);

  useEffect(() => {
    if (!isActivity || activityType !== "whatsapp" || !activityTimeExpired || !activityWhatsAppStatus?.hasCampaign || !getToken || !courseId || activityResultRecordedRef.current) return;
    activityResultRecordedRef.current = true;
    const run = async () => {
      try {
        const api = new ApiClient(getToken);
        const res = await api.getActivityWhatsAppStatus(courseId, submoduleId);
        setActivityWhatsAppStatus({
          hasCampaign: res.hasCampaign ?? false,
          passed: res.passed ?? null,
          clickedAt: res.clickedAt ?? null,
          reportedAt: res.reportedAt ?? null,
        });
        await api.recordActivityResult(courseId, submoduleId, res.passed === true);
      } catch {
        activityResultRecordedRef.current = false;
      }
    };
    run();
  }, [isActivity, activityType, activityTimeExpired, activityWhatsAppStatus?.hasCampaign, courseId, submoduleId, getToken]);

  const handleActivityRetry = useCallback(async () => {
    if (!getToken || activityRetryLoading) return;
    setActivityRetryLoading(true);
    try {
      const api = new ApiClient(getToken);
      await api.activityRetry(courseId, submoduleId);
      activityResultRecordedRef.current = false;
      setActivityStarted(false);
      setActivityEmailStatus(null);
      setActivityWhatsAppStatus(null);
      setActivityTimeRemainingSec(0);
      setActivityTimeExpired(false);
      setActivityContactError(null);
      const progressRes = await api.getCourseProgress(courseId).catch(() => ({ completed: [] }));
      setCompletedIds(progressRes.completed ?? []);
    } catch {
      // ignore
    } finally {
      setActivityRetryLoading(false);
    }
  }, [courseId, submoduleId, getToken, activityRetryLoading]);

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
  const hasActivity = !!(currentModule?.activityType);
  const canGoPrev =
    isQuiz ? sections.length > 0 : isActivity ? (hasQuiz || sections.length > 0) : sectionIndex > 0;
  const canGoNext = isQuiz
    ? hasActivity
    : isActivity
      ? false
      : sectionIndex < sections.length - 1 || hasQuiz || hasActivity;
  const prevUrl = isQuiz
    ? `${moduleIndex}-${sections.length - 1}`
    : isActivity
      ? hasQuiz
        ? `${moduleIndex}-quiz`
        : sections.length > 0
          ? `${moduleIndex}-${sections.length - 1}`
          : null
      : sectionIndex > 0
        ? `${moduleIndex}-${sectionIndex - 1}`
        : null;
  const nextUrl = isQuiz
    ? hasActivity
      ? `${moduleIndex}-activity`
      : null
    : isActivity
      ? null
      : sectionIndex < sections.length - 1
        ? `${moduleIndex}-${sectionIndex + 1}`
        : hasQuiz
          ? `${moduleIndex}-quiz`
          : hasActivity
            ? `${moduleIndex}-activity`
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
        "Start Activity",
        "Activity",
        "Email",
        "WhatsApp",
        "This activity will be completed via Email.",
        "This activity will be completed via WhatsApp.",
        "Complete this activity by following the instructions sent to your email.",
        "Complete this activity by following the instructions sent via WhatsApp.",
        "Complete this activity as instructed.",
        "Email address",
        "Phone number",
        "Please enter your email address.",
        "Please enter a valid email address.",
        "Please enter a valid phone number (at least 10 digits).",
        "e.g. you@example.com",
        "e.g. +1 234 567 8900",
        "Phone",
        "Sending email...",
        "Sending message...",
        "Failed to send email. Please try again.",
        "Failed to send WhatsApp message. Please try again.",
        "Passed",
        "Failed",
        "Pending",
        "You opened the email without clicking links or entering credentials. You can mark as complete.",
        "You clicked a link or entered credentials. To pass this activity, open the email only—do not click links or enter credentials. This activity cannot be marked complete.",
        "Open the email without clicking links or entering credentials to pass.",
        "You cannot complete this activity because you clicked a link or entered credentials in the email.",
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
      (acc, m) =>
        acc +
        (m.sections?.length ?? 0) +
        ((m.quiz?.length ?? 0) > 0 ? 1 : 0) +
        (m.activityType ? 1 : 0),
      0
    );
  }, [displayCourse]);

  const getCompletedCount = () => completedIds.length;
  const progressPercent = getTotalItems() > 0 ? Math.round((getCompletedCount() / getTotalItems()) * 100) : 0;

  if (loading || !displayCourse) {
    return (
      <div className="min-h-screen bg-[#f8fafc] dark:bg-[var(--navy-blue)] flex items-center justify-center">
        <p className="text-gray-500 dark:text-[var(--dashboard-text-secondary)]">{t("Loading...")}</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#f8fafc] dark:bg-[var(--navy-blue)] flex items-center justify-center">
        <p className="text-red-600 dark:text-red-400">{error}</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[var(--navy-blue)] flex">
      {/* Sidebar Navigation */}
      <aside
        className={`${
          sidebarCollapsed ? "w-0" : "w-80"
        } bg-white dark:bg-[var(--navy-blue-light)] border-r border-gray-200 dark:border-[var(--neon-blue)]/30 transition-all duration-300 overflow-hidden flex-shrink-0 sticky top-0 h-screen overflow-y-auto`}
      >
        <div className="p-6">
          {/* Course Header */}
          <div className="mb-6">
            <button
              onClick={() => router.push(`/dashboard/training-modules/${courseId}`)}
              className="flex items-center gap-2 text-sm text-gray-600 dark:text-[var(--dashboard-text-secondary)] hover:text-[var(--neon-blue)] dark:hover:text-[var(--neon-blue)] transition-colors mb-3"
            >
              <ArrowLeft className="w-4 h-4" />
              {t("Back to course")}
            </button>
            <h2 className="text-lg font-bold text-gray-900 dark:text-white line-clamp-2 mb-2">{displayCourse.courseTitle}</h2>
            <div className="flex items-center gap-4 text-xs text-gray-500 dark:text-[var(--dashboard-text-secondary)]">
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
            <div className="h-2 bg-gray-200 dark:bg-[var(--navy-blue-lighter)] rounded-full overflow-hidden">
              <div
                className="h-full bg-[var(--neon-blue)] transition-all duration-300"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
            <p className="text-xs text-gray-500 dark:text-[var(--dashboard-text-secondary)] mt-1">
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
                <div key={mod._id || modIdx} className="border border-gray-200 dark:border-[var(--neon-blue)]/30 rounded-lg overflow-hidden">
                  <button
                    onClick={() => toggleSidebarModule(modIdx)}
                    className={`w-full px-4 py-3 flex items-center justify-between text-left transition-colors ${
                      isCurrentModule
                        ? "bg-[var(--neon-blue)]/10 dark:bg-[var(--neon-blue)]/20 border-l-4 border-l-[var(--neon-blue)]"
                        : "hover:bg-gray-50 dark:hover:bg-[var(--navy-blue-lighter)]"
                    }`}
                  >
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      <div
                        className={`w-6 h-6 rounded flex items-center justify-center flex-shrink-0 ${
                          isCurrentModule
                            ? "bg-[var(--neon-blue)] text-white"
                            : "bg-gray-200 dark:bg-[var(--navy-blue-lighter)] text-gray-600 dark:text-[var(--dashboard-text-secondary)]"
                        }`}
                      >
                        <span className="text-xs font-semibold">{modIdx + 1}</span>
                      </div>
                      <span
                        className={`text-sm font-medium truncate ${
                          isCurrentModule ? "text-[var(--neon-blue)]" : "text-gray-900 dark:text-white"
                        }`}
                      >
                        {mod.title || `Module ${modIdx + 1}`}
                      </span>
                    </div>
                    {isExpanded ? (
                      <ChevronDown className="w-4 h-4 text-gray-400 dark:text-gray-500 flex-shrink-0" />
                    ) : (
                      <ChevronRight className="w-4 h-4 text-gray-400 dark:text-gray-500 flex-shrink-0" />
                    )}
                  </button>

                  {isExpanded && (
                    <div className="bg-gray-50 dark:bg-[var(--navy-blue)] border-t border-gray-200 dark:border-[var(--neon-blue)]/30">
                      {sections.map((section, secIdx) => {
                        const sectionId = `${modIdx}-${secIdx}`;
                        const isCurrent = modIdx === moduleIndex && secIdx === sectionIndex;
                        const isCompleted = isRead(sectionId);

                        return (
                          <button
                            key={section._id || secIdx}
                            onClick={() => router.push(`/dashboard/training-modules/${courseId}/${sectionId}`)}
                            className={`w-full px-4 py-2.5 pl-12 flex items-center gap-2 text-left text-sm transition-colors border-b border-gray-100 dark:border-[var(--neon-blue)]/20 last:border-0 ${
                              isCurrent
                                ? "bg-[var(--neon-blue)]/5 dark:bg-[var(--neon-blue)]/10 text-[var(--neon-blue)] font-medium"
                                : "text-gray-700 dark:text-[var(--dashboard-text-secondary)] hover:bg-gray-100 dark:hover:bg-[var(--navy-blue-lighter)]"
                            }`}
                          >
                            {isCompleted ? (
                              <CheckCircle2 className="w-4 h-4 text-[var(--neon-blue)] flex-shrink-0" />
                            ) : (
                              <Circle className="w-4 h-4 text-gray-400 dark:text-gray-500 flex-shrink-0" />
                            )}
                            <span className="truncate">{section.title || `Section ${secIdx + 1}`}</span>
                          </button>
                        );
                      })}
                      {hasQuiz && (
                        <button
                          onClick={() => router.push(`/dashboard/training-modules/${courseId}/${modIdx}-quiz`)}
                          className={`w-full px-4 py-2.5 pl-12 flex items-center gap-2 text-left text-sm transition-colors border-b border-gray-100 dark:border-[var(--neon-blue)]/20 ${
                            modIdx === moduleIndex && isQuiz
                              ? "bg-[var(--neon-blue)]/5 dark:bg-[var(--neon-blue)]/10 text-[var(--neon-blue)] font-medium"
                              : "text-gray-700 dark:text-[var(--dashboard-text-secondary)] hover:bg-gray-100 dark:hover:bg-[var(--navy-blue-lighter)]"
                          }`}
                        >
                          {isRead(`${modIdx}-quiz`) ? (
                            <CheckCircle2 className="w-4 h-4 text-[var(--neon-blue)] flex-shrink-0" />
                          ) : (
                            <FileQuestion className="w-4 h-4 text-[var(--neon-blue)] flex-shrink-0" />
                          )}
                          <span>{t("Module Quiz")}</span>
                        </button>
                      )}
                      {mod.activityType && (
                        <button
                          onClick={() => router.push(`/dashboard/training-modules/${courseId}/${modIdx}-activity`)}
                          className={`w-full px-4 py-2.5 pl-12 flex items-center gap-2 text-left text-sm transition-colors border-b border-gray-100 dark:border-[var(--neon-blue)]/20 last:border-b-0 ${
                            modIdx === moduleIndex && isActivity
                              ? "bg-[var(--neon-blue)]/5 dark:bg-[var(--neon-blue)]/10 text-[var(--neon-blue)] font-medium"
                              : "text-gray-700 dark:text-[var(--dashboard-text-secondary)] hover:bg-gray-100 dark:hover:bg-[var(--navy-blue-lighter)]"
                          }`}
                        >
                          {isRead(`${modIdx}-activity`) ? (
                            <CheckCircle2 className="w-4 h-4 text-[var(--neon-blue)] flex-shrink-0" />
                          ) : (
                            <MessageCircle className="w-4 h-4 text-[var(--neon-blue)] flex-shrink-0" />
                          )}
                          <span>{t("Activity")}</span>
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
        <header className="bg-white dark:bg-[var(--navy-blue-light)] border-b border-gray-200 dark:border-[var(--neon-blue)]/30 sticky top-0 z-20">
          <div className="px-6 py-4 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
                className="p-2 hover:bg-gray-100 dark:hover:bg-[var(--navy-blue-lighter)] rounded-lg transition-colors"
                aria-label="Toggle sidebar"
              >
                <BookOpen className="w-5 h-5 text-gray-600 dark:text-[var(--dashboard-text-secondary)]" />
              </button>
              <div>
                <h1 className="text-lg font-semibold text-gray-900 dark:text-white">{displayCourse.courseTitle}</h1>
                {currentModule && (
                  <p className="text-sm text-gray-500 dark:text-[var(--dashboard-text-secondary)]">
                    {currentModule.title}{" "}
                    {isQuiz
                      ? `• ${t("Module Quiz")}`
                      : isActivity
                        ? `• ${t("Activity")}`
                        : currentSection
                          ? `• ${currentSection.title}`
                          : ""}
                  </p>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600 dark:text-[var(--dashboard-text-secondary)]">
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
              <div className="mb-6 bg-white dark:bg-[var(--navy-blue-light)] border border-[var(--neon-blue)]/30 dark:border-[var(--neon-blue)]/50 rounded-lg p-5 shadow-sm">
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 w-12 h-12 rounded-lg bg-[var(--neon-blue)] flex items-center justify-center">
                    <Award className="w-6 h-6 text-white" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-1.5">{t("Certificate Earned! 🎉")}</h3>
                    <p className="text-gray-600 dark:text-[var(--dashboard-text-secondary)] mb-4 text-sm leading-relaxed">
                      {t("Congratulations! You've successfully completed this course and earned a certificate of completion.")}
                    </p>
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => router.push("/dashboard/certificates")}
                        className="inline-flex items-center gap-2 px-5 py-2.5 bg-[var(--neon-blue)] text-white rounded-md hover:bg-[var(--medium-blue)] dark:hover:bg-[#4fc3f7] transition-colors text-sm font-medium"
                      >
                        <Award className="w-4 h-4" />
                        {t("View Certificate")}
                      </button>
                      <button
                        onClick={() => router.push(`/dashboard/training-modules/${courseId}`)}
                        className="inline-flex items-center gap-2 px-5 py-2.5 border border-[var(--neon-blue)] text-[var(--neon-blue)] rounded-md hover:bg-[var(--neon-blue)]/5 dark:hover:bg-[var(--neon-blue)]/10 transition-colors text-sm font-medium"
                      >
                        <ArrowLeft className="w-4 h-4" />
                        {t("Back to Course")}
                      </button>
                    </div>
                  </div>
                  <button
                    onClick={() => setCertificateGenerated(false)}
                    className="flex-shrink-0 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-400 transition-colors p-1"
                    aria-label="Close notification"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>
            )}
        {isQuiz ? (
              <article className="bg-white dark:bg-[var(--navy-blue-light)] rounded-xl shadow-sm border border-gray-200 dark:border-[var(--neon-blue)]/30 overflow-hidden">
                {/* Start Quiz screen */}
                {!quizStarted ? (
                  <div className="px-8 py-12 text-center">
                    <div className="max-w-md mx-auto">
                      <div className="w-20 h-20 rounded-2xl bg-[var(--neon-blue)]/10 dark:bg-[var(--neon-blue)]/20 flex items-center justify-center mx-auto mb-6">
                        <FileQuestion className="w-10 h-10 text-[var(--neon-blue)]" />
                      </div>
                      <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">{t("Module Quiz")}</h1>
                      {currentModule?.title && (
                        <p className="text-gray-600 dark:text-[var(--dashboard-text-secondary)] mb-6">{currentModule.title}</p>
                      )}
                      <p className="text-gray-700 dark:text-[var(--dashboard-text-secondary)] mb-2">
                        {t("You have")} <strong className="dark:text-white">{quizDurationMinutes}</strong> {t("minutes to complete this quiz.")}
                      </p>
                      <p className="text-sm text-gray-500 dark:text-[var(--dashboard-text-secondary)] mb-8">
                        {quizQuestions.length} {quizQuestions.length === 1 ? t("question") : t("questions")}
                      </p>
                      <button
                        type="button"
                        onClick={startQuiz}
                        className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-xl bg-[var(--neon-blue)] text-white hover:bg-[var(--medium-blue)] dark:hover:bg-[#4fc3f7] transition-colors text-lg font-semibold shadow-md hover:shadow-lg"
                      >
                        <PlayCircle className="w-6 h-6" />
                        {t("Start Quiz")}
                      </button>
                    </div>
                  </div>
                ) : (
                <>
                <div className="bg-gradient-to-r from-[var(--neon-blue)]/10 to-[var(--electric-blue)]/10 dark:from-[var(--neon-blue)]/20 dark:to-[var(--electric-blue)]/20 px-8 py-6 border-b border-gray-200 dark:border-[var(--neon-blue)]/30">
                  <div className="flex items-center justify-between flex-wrap gap-4">
                    <div className="flex items-center gap-4">
                      <div className="w-14 h-14 rounded-xl bg-[var(--neon-blue)] flex items-center justify-center shadow-lg">
                        <FileQuestion className="w-7 h-7 text-white" />
                      </div>
                      <div>
                        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">{t("Module Quiz")}</h1>
                        {currentModule?.title && (
                          <p className="text-sm text-gray-600 dark:text-[var(--dashboard-text-secondary)]">{currentModule.title}</p>
                        )}
                      </div>
                    </div>
                    {/* Timer */}
                    <div className={`flex items-center gap-2 px-4 py-2 rounded-lg font-mono text-lg font-semibold ${
                      quizTimeExpired ? "bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-400" : quizTimeRemainingSec <= 60 ? "bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-400" : "bg-white/80 dark:bg-[var(--navy-blue-lighter)]/80 text-gray-800 dark:text-white"
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
                  <div className="px-8 py-3 bg-amber-50 dark:bg-amber-900/20 border-b border-amber-200 dark:border-amber-500/30 text-amber-800 dark:text-amber-400 text-sm font-medium">
                    {t("The quiz has ended. Submit your answers to see your score.")}
                  </div>
                )}
                <div className="px-8 py-8">
              {quizQuestions.length === 0 ? (
                    <div className="text-center py-12">
                      <FileQuestion className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
                      <p className="text-gray-500 dark:text-[var(--dashboard-text-secondary)] text-lg">{t("No questions in this quiz.")}</p>
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
                              <h3 className="text-xl font-semibold text-gray-900 dark:text-white leading-relaxed mb-6">
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
                                              : "bg-[var(--neon-blue)]/10 text-[var(--neon-blue)] font-medium border-2 border-[var(--neon-blue)] shadow-sm disabled:text-[var(--neon-blue)]"
                                            : showCorrect
                                            ? "bg-green-50 text-green-800 border-2 border-green-500 disabled:text-green-800"
                                            : "bg-white dark:bg-[var(--navy-blue-lighter)] text-gray-700 dark:text-[var(--dashboard-text-secondary)] border-2 border-gray-200 dark:border-[var(--neon-blue)]/30 hover:bg-gray-50 dark:hover:bg-[var(--navy-blue)] hover:border-gray-300 dark:hover:border-[var(--neon-blue)]/50 disabled:text-gray-700 dark:disabled:text-[var(--dashboard-text-secondary)]"
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
                                              : "bg-gray-100 dark:bg-[var(--navy-blue-lighter)] text-gray-700 dark:text-[var(--dashboard-text-secondary)] border-2 border-gray-300 dark:border-[var(--neon-blue)]/30"
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
                  <div className="mt-10 pt-8 border-t border-gray-200 dark:border-[var(--neon-blue)]/30">
                    <div className="space-y-4">
                {(showQuizResults || isRead(submoduleId)) ? (
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
                                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-4 rounded-xl bg-gray-50 dark:bg-[var(--navy-blue-lighter)] border border-gray-200 dark:border-[var(--neon-blue)]/30">
                                  <div>
                                    <p className="text-sm font-medium text-gray-600 dark:text-[var(--dashboard-text-secondary)] mb-0.5">{t("Score")}</p>
                                    <p className="text-2xl font-bold text-gray-900 dark:text-white">
                                      {t("You scored")} {score.correctCount} {t("out of")} {score.total} ({score.scorePercent}%)
                                    </p>
                                  </div>
                                  <div className={`flex items-center gap-2 px-4 py-2.5 rounded-lg font-semibold ${score.passed ? "bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400 border border-green-200 dark:border-green-500/30" : "bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-400 border border-red-200 dark:border-red-500/30"}`}>
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
                                  <div className="flex items-center gap-2 px-4 py-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-500/30 rounded-lg">
                                    <CheckCircle2 className="w-5 h-5 text-green-600 dark:text-green-400 shrink-0" />
                                    <span className="!text-green-800 dark:!text-green-400 font-medium">{t("All answers are correct! Great job!")}</span>
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
                                className="inline-flex items-center justify-center gap-3 px-6 py-3 rounded-lg bg-[var(--neon-blue)] text-white hover:bg-[var(--medium-blue)] dark:hover:bg-[#4fc3f7] transition-colors text-base font-semibold disabled:opacity-60 disabled:cursor-not-allowed shadow-md hover:shadow-lg"
                              >
                                <RotateCcw className="w-5 h-5 shrink-0" />
                                <span>{markingRead ? t("Updating…") : t("Retake Quiz")}</span>
                              </button>
                            ) : (
                              <button
                                type="button"
                                onClick={retakeQuiz}
                                className="inline-flex items-center justify-center gap-3 px-6 py-3 rounded-lg bg-[var(--neon-blue)] text-white hover:bg-[var(--medium-blue)] dark:hover:bg-[#4fc3f7] transition-colors text-base font-semibold disabled:opacity-60 disabled:cursor-not-allowed shadow-md hover:shadow-lg"
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
                      disabled={(!allQuizAttempted && !quizTimeExpired) || markingRead}
                            className="inline-flex items-center justify-center gap-3 px-6 py-3 rounded-lg bg-[var(--neon-blue)] text-white hover:bg-[var(--medium-blue)] dark:hover:bg-[#4fc3f7] transition-colors text-base font-semibold disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-[var(--neon-blue)] shadow-md hover:shadow-lg"
                    >
                      <Check className="w-5 h-5 shrink-0" />
                            <span>{markingRead ? t("Submitting…") : t("Submit Quiz")}</span>
                    </button>
                    {!allQuizAttempted && !quizTimeExpired && quizQuestions.length > 0 && (
                            <p className="text-sm text-gray-600 dark:text-[var(--dashboard-text-secondary)]">
                              {t("Please answer all")} {quizQuestions.length} {quizQuestions.length !== 1 ? t("questions") : t("question")} {t("to submit.")}
                      </p>
                    )}
                    {quizTimeExpired && (
                      <p className="text-sm text-amber-700 dark:text-amber-400 font-medium">
                        {t("The quiz has ended. Submit your answers to see your score.")}
                      </p>
                    )}
                  </>
                )}
                      {markReadError && !showQuizResults && (
                        <p className="text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 px-4 py-2 rounded-lg border border-red-200 dark:border-red-500/30">
                          {markReadError}
                        </p>
                      )}
                    </div>
              </div>
            </div>
                </>
                )}
          </article>
        ) : isActivity ? (
              <article className="bg-white dark:bg-[var(--navy-blue-light)] rounded-xl shadow-sm border border-gray-200 dark:border-[var(--neon-blue)]/30 overflow-hidden">
                {!activityStarted ? (
                  <div className="px-8 py-12">
                    <div className="max-w-md mx-auto">
                      <div className="w-20 h-20 rounded-2xl bg-[var(--neon-blue)]/10 dark:bg-[var(--neon-blue)]/20 flex items-center justify-center mx-auto mb-6">
                        {activityType === "whatsapp" ? (
                          <MessageCircle className="w-10 h-10 text-[var(--neon-blue)]" />
                        ) : (
                          <Mail className="w-10 h-10 text-[var(--neon-blue)]" />
                        )}
                      </div>
                      <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2 text-center">{t("Activity")}</h1>
                      {currentModule?.title && (
                        <p className="text-gray-600 dark:text-[var(--dashboard-text-secondary)] mb-6 text-center">{currentModule.title}</p>
                      )}
                      <p className="text-gray-700 dark:text-[var(--dashboard-text-secondary)] mb-6 text-center">
                        {activityType === "email"
                          ? t("This activity will be completed via Email.")
                          : activityType === "whatsapp"
                            ? t("This activity will be completed via WhatsApp.")
                            : t("Complete this activity as instructed.")}
                      </p>
                      {(activityType === "email" || activityType === "whatsapp") && (
                        <div className="mb-6 text-left">
                          <label htmlFor="activity-contact" className="block text-sm font-medium text-gray-700 dark:text-white mb-2">
                            {activityType === "email" ? t("Email address") : t("Phone number")}
                          </label>
                          {activityType === "email" ? (
                            <input
                              id="activity-contact"
                              type="email"
                              value={activityEmail}
                              onChange={(e) => {
                                setActivityEmail(e.target.value);
                                setActivityContactError(null);
                              }}
                              placeholder={t("e.g. you@example.com")}
                              className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-[var(--neon-blue)]/30 focus:ring-2 focus:ring-[var(--neon-blue)] focus:border-[var(--neon-blue)] outline-none text-gray-900 dark:text-white dark:bg-[var(--navy-blue-lighter)]"
                            />
                          ) : (
                            <input
                              id="activity-contact"
                              type="tel"
                              value={activityPhone}
                              onChange={(e) => {
                                setActivityPhone(e.target.value);
                                setActivityContactError(null);
                              }}
                              placeholder={t("e.g. +1 234 567 8900")}
                              className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-[var(--neon-blue)]/30 focus:ring-2 focus:ring-[var(--neon-blue)] focus:border-[var(--neon-blue)] outline-none text-gray-900 dark:text-white dark:bg-[var(--navy-blue-lighter)]"
                            />
                          )}
                          {activityContactError && (
                            <p className="mt-2 text-sm text-red-600 dark:text-red-400">{activityContactError}</p>
                          )}
                        </div>
                      )}
                      <div className="text-center">
                        <button
                          type="button"
                          onClick={() => startActivity()}
                          disabled={activitySendLoading}
                          className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-xl bg-[var(--neon-blue)] text-white hover:bg-[var(--medium-blue)] dark:hover:bg-[#4fc3f7] transition-colors text-lg font-semibold shadow-md hover:shadow-lg disabled:opacity-70 disabled:cursor-not-allowed"
                        >
                          {activitySendLoading ? (
                            <>
                              <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
                              {activityType === "email" ? t("Sending email...") : t("Sending message...")}
                            </>
                          ) : (
                            <>
                              <PlayCircle className="w-6 h-6" />
                              {t("Start Activity")}
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="px-8 py-8">
                    <div className="bg-gradient-to-r from-[var(--neon-blue)]/10 to-[var(--electric-blue)]/10 dark:from-[var(--neon-blue)]/20 dark:to-[var(--electric-blue)]/20 rounded-xl p-6 mb-8">
                      <div className="flex items-center gap-4 mb-4">
                        {activityType === "whatsapp" ? (
                          <MessageCircle className="w-10 h-10 text-[var(--neon-blue)]" />
                        ) : (
                          <Mail className="w-10 h-10 text-[var(--neon-blue)]" />
                        )}
                        <div>
                          <h2 className="text-xl font-bold text-gray-900 dark:text-white">{t("Activity")}</h2>
                          <p className="text-sm text-gray-600 dark:text-[var(--dashboard-text-secondary)]">
                            {activityType === "email" ? t("Email") : activityType === "whatsapp" ? t("WhatsApp") : t("Activity")}
                          </p>
                        </div>
                      </div>
                      <p className="text-gray-700 dark:text-[var(--dashboard-text-secondary)] mb-2">
                        {activityType === "email"
                          ? t("Complete this activity by following the instructions sent to your email.")
                          : activityType === "whatsapp"
                            ? t("Complete this activity by following the instructions sent via WhatsApp.")
                            : t("Complete this activity as instructed.")}
                      </p>
                      {(activityType === "email" && activityEmail.trim()) || (activityType === "whatsapp" && activityPhone.trim()) ? (
                        <p className="text-sm text-gray-600 dark:text-[var(--dashboard-text-secondary)] mt-2">
                          {activityType === "email"
                            ? t("Email") + ": " + activityEmail.trim()
                            : t("Phone") + ": " + activityPhone.trim()}
                        </p>
                      ) : null}
                    </div>

                    {activityType === "email" && activityEmailStatus?.hasEmail && (() => {
                      // Only show Pass/Fail AFTER the 5 min timer is up. Until then show Pending.
                      const timeUp = activityTimeExpired;
                      const passed = timeUp && activityEmailStatus.passed === true;
                      const showFailed = timeUp && activityEmailStatus.passed === false;
                      const pending = !timeUp;
                      return (
                      <div
                        className={`mb-6 rounded-xl border-2 p-4 ${
                          passed
                            ? "bg-green-50 dark:bg-green-900/20 border-green-500 dark:border-green-500/30 text-green-800 dark:text-green-400"
                            : showFailed
                              ? "bg-red-50 dark:bg-red-900/20 border-red-500 dark:border-red-500/30 text-red-800 dark:text-red-400"
                              : "bg-amber-50 dark:bg-amber-900/20 border-amber-500 dark:border-amber-500/30 text-amber-800 dark:text-amber-400"
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          {passed ? (
                            <CheckCircle2 className="w-6 h-6 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
                          ) : showFailed ? (
                            <X className="w-6 h-6 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
                          ) : (
                            <AlertCircle className="w-6 h-6 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
                          )}
                          <div>
                            {passed && (
                              <>
                                <p className="font-semibold">{t("Passed")}</p>
                                <p className="text-sm mt-1">
                                  {t("You did not click links or enter credentials. You can mark as complete.")}
                                </p>
                              </>
                            )}
                            {showFailed && (
                              <>
                                <p className="font-semibold">{t("Failed")}</p>
                                <p className="text-sm mt-1">
                                  {t("You clicked a link or entered credentials. Do not click links or enter credentials to pass. Try again.")}
                                </p>
                              </>
                            )}
                            {pending && (
                              <>
                                <p className="font-semibold">{t("Pending")}</p>
                                <p className="text-sm mt-1">
                                  {t("Open the email after 2 minutes.")}
                                </p>
                                {activityTimeRemainingSec > 0 ? (
                                  <p className="text-sm mt-2 font-medium text-amber-700 dark:text-amber-400">
                                    {t("Time remaining")}: {Math.floor(activityTimeRemainingSec / 60)}:{String(activityTimeRemainingSec % 60).padStart(2, "0")}
                                  </p>
                                ) : null}
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    ); })()}

                    {activityType === "whatsapp" && activityWhatsAppStatus?.hasCampaign && (() => {
                      const timeUp = activityTimeExpired;
                      const passed = timeUp && activityWhatsAppStatus.passed === true;
                      const showFailed = timeUp && activityWhatsAppStatus.passed === false;
                      const pending = !timeUp;
                      return (
                      <div
                        className={`mb-6 rounded-xl border-2 p-4 ${
                          passed ? "bg-green-50 dark:bg-green-900/20 border-green-500 dark:border-green-500/30 text-green-800 dark:text-green-400"
                            : showFailed ? "bg-red-50 dark:bg-red-900/20 border-red-500 dark:border-red-500/30 text-red-800 dark:text-red-400"
                            : "bg-amber-50 dark:bg-amber-900/20 border-amber-500 dark:border-amber-500/30 text-amber-800 dark:text-amber-400"
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          {passed ? <CheckCircle2 className="w-6 h-6 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
                            : showFailed ? <X className="w-6 h-6 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
                            : <AlertCircle className="w-6 h-6 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />}
                          <div>
                            {passed && (
                              <>
                                <p className="font-semibold">{t("Passed")}</p>
                                <p className="text-sm mt-1">{t("You did not click links or enter credentials. You can mark as complete.")}</p>
                              </>
                            )}
                            {showFailed && (
                              <>
                                <p className="font-semibold">{t("Failed")}</p>
                                <p className="text-sm mt-1">{t("You clicked a link or entered credentials. Do not click links or enter credentials to pass. Try again.")}</p>
                              </>
                            )}
                            {pending && (
                              <>
                                <p className="font-semibold">{t("Pending")}</p>
                                {activityTimeRemainingSec > 0 && (
                                  <p className="text-sm mt-2 font-medium text-amber-700 dark:text-amber-400">
                                    {t("Time remaining")}: {Math.floor(activityTimeRemainingSec / 60)}:{String(activityTimeRemainingSec % 60).padStart(2, "0")}
                                  </p>
                                )}
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    ); })()}

                    <div className="pt-6 border-t border-gray-200 dark:border-[var(--neon-blue)]/30">
                      {isRead(submoduleId) ? (
                        <button
                          type="button"
                          onClick={toggleComplete}
                          disabled={markingRead}
                          className="inline-flex items-center justify-center gap-3 px-6 py-3 rounded-lg bg-[var(--neon-blue)] text-white hover:bg-[var(--medium-blue)] dark:hover:bg-[#4fc3f7] transition-colors text-base font-semibold disabled:opacity-60 disabled:cursor-not-allowed shadow-md hover:shadow-lg"
                        >
                          <CheckCircle2 className="w-5 h-5 shrink-0" />
                          <span>{markingRead ? t("Updating…") : t("Mark as Incomplete")}</span>
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={toggleComplete}
                          disabled={markingRead || (activityType === "email" && !activityTimeExpired) || (activityType === "email" && activityEmailStatus?.hasEmail && activityEmailStatus.passed === false) || (activityType === "whatsapp" && !activityTimeExpired) || (activityType === "whatsapp" && activityWhatsAppStatus?.hasCampaign && activityWhatsAppStatus.passed === false)}
                          className="group inline-flex items-center justify-center gap-3 px-6 py-3 rounded-lg border-2 border-[var(--neon-blue)] bg-white dark:bg-[var(--navy-blue-light)] hover:bg-[var(--neon-blue)] transition-colors text-base font-semibold disabled:opacity-60 disabled:cursor-not-allowed shadow-sm hover:shadow-md"
                        >
                          <Circle className="w-5 h-5 shrink-0 text-[var(--neon-blue)] group-hover:text-white dark:group-hover:text-[var(--neon-blue)] transition-colors" />
                          <span className="text-[var(--neon-blue)] group-hover:text-white dark:group-hover:text-[var(--neon-blue)] transition-colors">
                            {markingRead ? t("Saving…") : t("Mark as Complete")}
                          </span>
                        </button>
                      )}
                      {activityType === "email" && activityTimeExpired && activityEmailStatus?.hasEmail && activityEmailStatus.passed === false && (
                        <>
                          <p className="mt-2 text-sm text-red-600 dark:text-red-400">
                            {t("You cannot complete this activity because you clicked a link or entered credentials in the email.")}
                          </p>
                          <p className="mt-2 text-sm text-gray-700 dark:text-[var(--dashboard-text-secondary)]">
                            {t("Do not click the link or enter credentials. Try the activity again.")}
                          </p>
                          <button
                            type="button"
                            onClick={handleActivityRetry}
                            disabled={activityRetryLoading}
                            className="mt-4 inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg border-2 border-[var(--neon-blue)] bg-white dark:bg-[var(--navy-blue-light)] text-[var(--neon-blue)] hover:bg-[var(--neon-blue)] hover:text-white transition-colors text-sm font-semibold disabled:opacity-60 disabled:cursor-not-allowed"
                          >
                            {activityRetryLoading ? (
                              <>
                                <span className="w-4 h-4 border-2 border-[var(--neon-blue)] border-t-transparent rounded-full animate-spin" />
                                {t("Resetting…")}
                              </>
                            ) : (
                              t("Try again")
                            )}
                          </button>
                        </>
                      )}
                      {activityType === "whatsapp" && activityTimeExpired && activityWhatsAppStatus?.hasCampaign && activityWhatsAppStatus.passed === false && (
                        <>
                          <p className="mt-2 text-sm text-red-600 dark:text-red-400">
                            {t("You cannot complete this activity because you clicked a link or entered credentials in the message.")}
                          </p>
                          <p className="mt-2 text-sm text-gray-700 dark:text-[var(--dashboard-text-secondary)]">
                            {t("Do not click the link or enter credentials. Try the activity again.")}
                          </p>
                          <button
                            type="button"
                            onClick={handleActivityRetry}
                            disabled={activityRetryLoading}
                            className="mt-4 inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg border-2 border-[var(--neon-blue)] bg-white dark:bg-[var(--navy-blue-light)] text-[var(--neon-blue)] hover:bg-[var(--neon-blue)] hover:text-white transition-colors text-sm font-semibold disabled:opacity-60 disabled:cursor-not-allowed"
                          >
                            {activityRetryLoading ? (
                              <>
                                <span className="w-4 h-4 border-2 border-[var(--neon-blue)] border-t-transparent rounded-full animate-spin" />
                                {t("Resetting…")}
                              </>
                            ) : (
                              t("Try again")
                            )}
                          </button>
                        </>
                      )}
                      {markReadError && (
                        <p className="mt-3 text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 px-4 py-2 rounded-lg border border-red-200 dark:border-red-500/30">
                          {markReadError}
                        </p>
                      )}
                    </div>
                  </div>
                )}
              </article>
        ) : currentSection ? (
              <article className="bg-white dark:bg-[var(--navy-blue-light)] rounded-xl shadow-sm border border-gray-200 dark:border-[var(--neon-blue)]/30 overflow-hidden">
                {/* Section Header */}
                <div className="bg-gradient-to-r from-[var(--neon-blue)]/10 to-[var(--electric-blue)]/10 dark:from-[var(--neon-blue)]/20 dark:to-[var(--electric-blue)]/20 px-8 py-6 border-b border-gray-200 dark:border-[var(--neon-blue)]/30">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-xl bg-[var(--neon-blue)] flex items-center justify-center shadow-lg">
                      <BookOpen className="w-7 h-7 text-white" />
                </div>
                <div>
                      <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
                    {currentSection.title || t("Section")}
                  </h1>
                  {currentModule?.title && (
                        <p className="text-sm text-gray-600 dark:text-[var(--dashboard-text-secondary)]">{currentModule.title}</p>
                  )}
                </div>
                  </div>
                </div>

                {/* Section Content */}
                <div className="px-8 py-8">
                  {(currentSection.material || translatedSectionMaterial) && (
                    <article className="max-w-none mb-8 prose prose-lg prose-gray max-w-none">
                      <div className="text-gray-800 dark:text-[var(--dashboard-text-secondary)] leading-relaxed space-y-6">
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
                                <figcaption className="text-sm text-gray-500 dark:text-[var(--dashboard-text-secondary)] text-center mt-3 italic">
                                  {translatedMediaCaptions.get(idx) || mediaItem.caption}
                                </figcaption>
                              )}
                            </figure>
                          ) : (
                            <figure className="w-full">
                              <VideoPlayer mediaItem={mediaItem} />
                              {mediaItem.caption && (
                                <figcaption className="text-sm text-gray-500 dark:text-[var(--dashboard-text-secondary)] text-center mt-3 italic">
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
                    <div className="mt-8 pt-8 border-t border-gray-200 dark:border-[var(--neon-blue)]/30">
                      <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                        <LinkIcon className="w-5 h-5 text-[var(--neon-blue)]" />
                        {t("Additional Resources")}
                  </h2>
                      <ul className="space-y-3">
                    {currentSection.urls.map((url, i) => (
                      <li key={i}>
                        <a
                          href={url}
                          target="_blank"
                          rel="noopener noreferrer"
                              className="flex items-center gap-3 px-4 py-3 bg-gray-50 dark:bg-[var(--navy-blue-lighter)] hover:bg-[var(--neon-blue)]/5 dark:hover:bg-[var(--neon-blue)]/10 border border-gray-200 dark:border-[var(--neon-blue)]/30 hover:border-[var(--neon-blue)]/30 dark:hover:border-[var(--neon-blue)]/50 rounded-lg transition-colors group"
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
                      <BookOpen className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
                      <p className="text-gray-500 dark:text-[var(--dashboard-text-secondary)] text-lg">{t("No content available for this section.")}</p>
                    </div>
              )}

              {/* Mark as read */}
                  <div className="mt-10 pt-8 border-t border-gray-200 dark:border-[var(--neon-blue)]/30">
                    <div>
                {isRead(submoduleId) ? (
                        <button
                          type="button"
                          onClick={toggleComplete}
                          disabled={markingRead}
                          className="inline-flex items-center justify-center gap-3 px-6 py-3 rounded-lg bg-[var(--neon-blue)] text-white hover:bg-[var(--medium-blue)] dark:hover:bg-[#4fc3f7] transition-colors text-base font-semibold disabled:opacity-60 disabled:cursor-not-allowed shadow-md hover:shadow-lg"
                        >
                    <CheckCircle2 className="w-5 h-5 shrink-0" />
                          <span>{markingRead ? t("Updating…") : t("Mark as Incomplete")}</span>
                        </button>
                ) : (
                  <button
                    type="button"
                          onClick={toggleComplete}
                    disabled={markingRead}
                          className="group inline-flex items-center justify-center gap-3 px-6 py-3 rounded-lg border-2 border-[var(--neon-blue)] bg-white dark:bg-[var(--navy-blue-light)] hover:bg-[var(--neon-blue)] transition-colors text-base font-semibold disabled:opacity-60 disabled:cursor-not-allowed shadow-sm hover:shadow-md"
                  >
                          <Circle className="w-5 h-5 shrink-0 text-[var(--neon-blue)] group-hover:text-white dark:group-hover:text-[var(--neon-blue)] transition-colors" />
                          <span className="text-[var(--neon-blue)] group-hover:text-white dark:group-hover:text-[var(--neon-blue)] transition-colors">{markingRead ? t("Saving…") : t("Mark as Complete")}</span>
                  </button>
                )}
                {markReadError && (
                        <p className="mt-3 text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 px-4 py-2 rounded-lg border border-red-200 dark:border-red-500/30">
                          {markReadError}
                        </p>
                )}
                    </div>
              </div>
            </div>
          </article>
        ) : (
              <div className="bg-white dark:bg-[var(--navy-blue-light)] rounded-xl p-12 text-center border border-gray-200 dark:border-[var(--neon-blue)]/30">
                <BookOpen className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
                <p className="text-gray-500 dark:text-[var(--dashboard-text-secondary)] text-lg">{t("Section not found.")}</p>
          </div>
        )}

        {/* Bottom navigation */}
        <nav className="mt-10 flex items-center justify-between gap-4">
          {prevUrl ? (
            <button
              onClick={() => router.push(`/dashboard/training-modules/${courseId}/${prevUrl}`)}
                  className="inline-flex items-center justify-center gap-2.5 px-6 py-3 rounded-lg border-2 border-gray-300 dark:border-[var(--neon-blue)]/30 bg-white dark:bg-[var(--navy-blue-light)] text-gray-700 dark:text-white hover:bg-gray-50 dark:hover:bg-[var(--navy-blue-lighter)] hover:border-[var(--neon-blue)] dark:hover:border-[var(--neon-blue)] hover:text-[var(--neon-blue)] transition-colors font-medium shadow-sm hover:shadow-md"
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
                  className="inline-flex items-center justify-center gap-2.5 px-6 py-3 rounded-lg bg-[var(--neon-blue)] text-white hover:bg-[var(--medium-blue)] dark:hover:bg-[#4fc3f7] transition-colors font-semibold shadow-md hover:shadow-lg ml-auto"
            >
                  <span>
                    {sectionIndex === sections.length - 1 && hasQuiz
                      ? t("Module Quiz")
                      : sectionIndex === sections.length - 1 && hasActivity && !hasQuiz
                        ? t("Activity")
                        : t("Next")}
                  </span>
                  <ChevronRight className="w-5 h-5 flex-shrink-0" />
            </button>
          ) : (
            <button
              onClick={() => router.push(`/dashboard/training-modules/${courseId}`)}
                  className="inline-flex items-center justify-center gap-2.5 px-6 py-3 rounded-lg border-2 border-gray-300 dark:border-[var(--neon-blue)]/30 bg-white dark:bg-[var(--navy-blue-light)] text-gray-700 dark:text-white hover:bg-gray-50 dark:hover:bg-[var(--navy-blue-lighter)] hover:border-[var(--neon-blue)] dark:hover:border-[var(--neon-blue)] hover:text-[var(--neon-blue)] transition-colors font-medium ml-auto shadow-sm hover:shadow-md"
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
