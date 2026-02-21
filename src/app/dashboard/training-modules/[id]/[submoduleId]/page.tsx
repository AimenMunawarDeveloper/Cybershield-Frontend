"use client";

import { useState, useEffect } from "react";
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
} from "lucide-react";
import { ApiClient } from "@/lib/api";
import type { Course, CourseModule, ModuleSection, QuizQuestion } from "@/lib/coursesData";

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
  const quizQuestions: QuizQuestion[] = isQuiz ? currentModule?.quiz ?? [] : [];

  const [completedIds, setCompletedIds] = useState<string[]>([]);
  const [markingRead, setMarkingRead] = useState(false);
  const [markReadError, setMarkReadError] = useState<string | null>(null);
  const [quizSelections, setQuizSelections] = useState<Record<number, number>>({});
  const isRead = (submoduleIdParam: string) => completedIds.includes(submoduleIdParam);
  const allQuizAttempted =
    quizQuestions.length > 0 &&
    quizQuestions.every((_, qi) => Object.prototype.hasOwnProperty.call(quizSelections, qi));
  const markAsRead = async () => {
    if (isRead(submoduleId) || markingRead) return;
    if (!getToken) {
      setMarkReadError("Please sign in to save your progress.");
      return;
    }
    setMarkReadError(null);
    setMarkingRead(true);
    try {
      const api = new ApiClient(getToken);
      const res = await api.markCourseProgressComplete(courseId, submoduleId);
      setCompletedIds(res.completed ?? [...completedIds, submoduleId]);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to save progress";
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
    <div className="min-h-screen bg-[#f8fafc]">
      {/* Minimal top bar */}
      <header className="bg-white border-b border-gray-100 sticky top-0 z-10">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-3">
          <div className="flex items-center justify-between gap-4">
            <button
              onClick={() => router.push(`/dashboard/training-modules/${courseId}`)}
              className="flex items-center gap-2 text-sm text-gray-600 hover:text-[var(--neon-blue)] transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to course
            </button>
            <span className="text-sm text-gray-400 truncate max-w-[180px] sm:max-w-xs" title={course.courseTitle}>
              {course.courseTitle}
            </span>
          </div>
        </div>
      </header>

      {/* Main content - centered, readable width */}
      <main className="max-w-3xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
        {isQuiz ? (
          <article className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="px-6 sm:px-10 py-8">
              <div className="flex items-center gap-3 mb-8">
                <div className="w-12 h-12 rounded-xl bg-[var(--neon-blue)]/10 flex items-center justify-center">
                  <FileQuestion className="w-6 h-6 text-[var(--neon-blue)]" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">Module Quiz</h1>
                  {currentModule?.title && (
                    <p className="text-sm text-gray-500 mt-0.5">{currentModule.title}</p>
                  )}
                </div>
              </div>
              {quizQuestions.length === 0 ? (
                <p className="text-gray-500">No questions in this quiz.</p>
              ) : (
                <div className="space-y-8">
                  {quizQuestions.map((q, qi) => (
                    <section
                      key={q._id || qi}
                      className="pb-8 border-b border-gray-100 last:border-0 last:pb-0"
                    >
                      <p className="text-lg font-medium text-gray-900 mb-4">
                        {qi + 1}. {q.question}
                      </p>
                      <ul className="space-y-3">
                        {q.choices.map((c, ci) => {
                          const isSelected = quizSelections[qi] === ci;
                          return (
                            <li key={ci}>
                              <button
                                type="button"
                                onClick={() =>
                                  setQuizSelections((prev) => ({ ...prev, [qi]: ci }))
                                }
                                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-colors ${
                                  isSelected
                                    ? "bg-[var(--neon-blue)]/10 text-[var(--neon-blue)] font-medium border-2 border-[var(--neon-blue)]/50"
                                    : "bg-gray-50 text-gray-700 border-2 border-transparent hover:bg-gray-100"
                                }`}
                              >
                                <span
                                  className={`flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium ${
                                    isSelected
                                      ? "bg-[var(--neon-blue)] text-white"
                                      : "bg-gray-200 text-gray-600"
                                  }`}
                                >
                                  {String.fromCharCode(65 + ci)}
                                </span>
                                <span className="flex-1">{c}</span>
                              </button>
                            </li>
                          );
                        })}
                      </ul>
                    </section>
                  ))}
                </div>
              )}

              {/* Quiz submit */}
              <div className="mt-8 pt-6 border-t border-gray-200">
                {isRead(submoduleId) ? (
                  <p className="flex items-center gap-2 text-[var(--neon-blue)] font-medium text-sm">
                    <CheckCircle2 className="w-5 h-5 shrink-0" />
                    Quiz submitted
                  </p>
                ) : (
                  <>
                    <button
                      type="button"
                      onClick={markAsRead}
                      disabled={!allQuizAttempted || markingRead}
                      className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[var(--neon-blue)] text-white hover:bg-[var(--medium-blue)] transition-colors text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-[var(--neon-blue)]"
                    >
                      <Check className="w-5 h-5 shrink-0" />
                      {markingRead ? "Submitting…" : "Submit quiz"}
                    </button>
                    {!allQuizAttempted && quizQuestions.length > 0 && (
                      <p className="mt-2 text-sm text-gray-500">
                        Answer all {quizQuestions.length} question{quizQuestions.length !== 1 ? "s" : ""} to submit.
                      </p>
                    )}
                    {markReadError && (
                      <p className="mt-2 text-sm text-red-600">{markReadError}</p>
                    )}
                  </>
                )}
              </div>
            </div>
          </article>
        ) : currentSection ? (
          <article className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="px-6 sm:px-10 py-8">
              <div className="flex items-center gap-3 mb-8">
                <div className="w-12 h-12 rounded-xl bg-[var(--neon-blue)]/10 flex items-center justify-center">
                  <BookOpen className="w-6 h-6 text-[var(--neon-blue)]" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">
                    {currentSection.title || "Section"}
                  </h1>
                  {currentModule?.title && (
                    <p className="text-sm text-gray-500 mt-0.5">{currentModule.title}</p>
                  )}
                </div>
              </div>

              {currentSection.material && (
                <div className="prose prose-lg prose-gray max-w-none mb-8">
                  <div className="text-gray-700 leading-relaxed whitespace-pre-wrap">
                    {currentSection.material}
                  </div>
                </div>
              )}

              {(currentSection.urls?.length ?? 0) > 0 && (
                <div className="pt-6 border-t border-gray-100">
                  <h2 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
                    <LinkIcon className="w-4 h-4 text-[var(--neon-blue)]" />
                    Learn more
                  </h2>
                  <ul className="space-y-2">
                    {currentSection.urls.map((url, i) => (
                      <li key={i}>
                        <a
                          href={url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[var(--neon-blue)] hover:underline break-all text-sm"
                        >
                          {url}
                        </a>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {!currentSection.material && !(currentSection.urls?.length) && (
                <p className="text-gray-500">No content for this section.</p>
              )}

              {/* Mark as read */}
              <div className="mt-8 pt-6 border-t border-gray-200">
                {isRead(submoduleId) ? (
                  <p className="flex items-center gap-2 text-[var(--neon-blue)] font-medium text-sm">
                    <CheckCircle2 className="w-5 h-5 shrink-0" />
                    Marked as read
                  </p>
                ) : (
                  <button
                    type="button"
                    onClick={markAsRead}
                    disabled={markingRead}
                    className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-gray-200 bg-white text-gray-700 hover:bg-gray-50 hover:border-[var(--neon-blue)]/50 hover:text-[var(--neon-blue)] transition-colors text-sm font-medium disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    <Circle className="w-5 h-5 shrink-0" />
                    {markingRead ? "Saving…" : "Mark as read"}
                  </button>
                )}
                {markReadError && (
                  <p className="mt-2 text-sm text-red-600">{markReadError}</p>
                )}
              </div>
            </div>
          </article>
        ) : (
          <div className="bg-white rounded-2xl p-8 text-center">
            <p className="text-gray-500">Section not found.</p>
          </div>
        )}

        {/* Bottom navigation */}
        <nav className="mt-10 flex items-center justify-between gap-4">
          {prevUrl ? (
            <button
              onClick={() => router.push(`/dashboard/training-modules/${courseId}/${prevUrl}`)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-gray-200 bg-white text-gray-700 hover:bg-gray-50 hover:border-[var(--neon-blue)]/30 hover:text-[var(--neon-blue)] transition-colors text-sm font-medium"
            >
              <ChevronLeft className="w-4 h-4" />
              Previous
            </button>
          ) : (
            <div />
          )}
          {nextUrl ? (
            <button
              onClick={() => router.push(`/dashboard/training-modules/${courseId}/${nextUrl}`)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[var(--neon-blue)] text-white hover:bg-[var(--medium-blue)] transition-colors text-sm font-medium ml-auto"
            >
              {sectionIndex === sections.length - 1 && hasQuiz ? "Module Quiz" : "Next"}
              <ChevronRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              onClick={() => router.push(`/dashboard/training-modules/${courseId}`)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-gray-200 bg-white text-gray-700 hover:bg-gray-50 text-sm font-medium ml-auto"
            >
              Back to course
            </button>
          )}
        </nav>
      </main>
    </div>
  );
}
