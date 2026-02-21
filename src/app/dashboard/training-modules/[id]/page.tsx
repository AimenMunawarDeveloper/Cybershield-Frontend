"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import { useAuth } from "@clerk/nextjs";
import {
  ChevronDown,
  ChevronRight,
  Lock,
  Clock,
  BarChart3,
  FlaskConical,
  Monitor,
  Award,
  ArrowUp,
  ArrowLeft,
  User,
  FileQuestion,
  CheckCircle2,
} from "lucide-react";
import { ApiClient } from "@/lib/api";
import type { Course, CourseModule } from "@/lib/coursesData";
import { getBadgeIcon, AVAILABLE_BADGES } from "@/lib/courseBadges";
import ProgressRadialChart from "@/components/ProgressRadialChart";

const DEFAULT_IMAGE =
  "https://images.unsplash.com/photo-1563013544-824ae1b704d3?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80";

const DESCRIPTION_WORD_LIMIT = 50;

function truncateByWords(text: string, wordLimit: number): { visible: string; remaining: string; isLong: boolean } {
  const trimmed = (text || "").trim();
  if (!trimmed) return { visible: "", remaining: "", isLong: false };
  const words = trimmed.split(/\s+/);
  if (words.length <= wordLimit) return { visible: trimmed, remaining: "", isLong: false };
  const visible = words.slice(0, wordLimit).join(" ");
  const remaining = words.slice(wordLimit).join(" ");
  return { visible, remaining, isLong: true };
}

export default function TrainingModuleDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { getToken } = useAuth();
  const courseId = params.id as string;
  const [expandedModules, setExpandedModules] = useState<Set<string>>(new Set());
  const [activeTab, setActiveTab] = useState<"overview" | "curriculum">("overview");
  const [course, setCourse] = useState<Course | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [descriptionExpanded, setDescriptionExpanded] = useState(false);
  const [completedIds, setCompletedIds] = useState<string[]>([]);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      if (!getToken) return;
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
        const mods = courseRes.course.modules || [];
        if (mods.length > 0 && mods[0]._id) {
          setExpandedModules(new Set([mods[0]._id]));
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Failed to load course");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [courseId, router, getToken]);

  // Refetch progress when user returns to this tab so the bar stays up to date after marking sections read
  useEffect(() => {
    if (!courseId || !getToken) return;
    const onFocus = () => {
      new ApiClient(getToken).getCourseProgress(courseId).then((res) => setCompletedIds(res.completed ?? [])).catch(() => {});
    };
    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
  }, [courseId, getToken]);

  const toggleModule = (moduleId: string) => {
    setExpandedModules((prev) => {
      const next = new Set(prev);
      if (next.has(moduleId)) next.delete(moduleId);
      else next.add(moduleId);
      return next;
    });
  };

  const goToSection = (moduleIndex: number, sectionIndex: number) => {
    router.push(`/dashboard/training-modules/${courseId}/${moduleIndex}-${sectionIndex}`);
  };

  const goToQuiz = (moduleIndex: number) => {
    router.push(`/dashboard/training-modules/${courseId}/${moduleIndex}-quiz`);
  };

  if (loading || !course) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">{loading ? "Loading course..." : "Course not found."}</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center text-red-600">{error}</div>
      </div>
    );
  }

  const modules: CourseModule[] = course.modules || [];
  const totalItems = modules.reduce(
    (acc, m) => acc + (m.sections?.length ?? 0) + ((m.quiz?.length ?? 0) > 0 ? 1 : 0),
    0
  );
  const completedCount = completedIds.length;
  const progressPercent = totalItems > 0 ? Math.round((completedCount / totalItems) * 100) : 0;
  const isCompleted = (moduleIndex: number, sectionIndex: number | "quiz") =>
    sectionIndex === "quiz"
      ? completedIds.includes(`${moduleIndex}-quiz`)
      : completedIds.includes(`${moduleIndex}-${sectionIndex}`);

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <button
          onClick={() => router.push("/dashboard/training-modules")}
          className="mb-6 flex items-center gap-2 text-gray-600 hover:text-[var(--neon-blue)] transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Training Modules</span>
        </button>

        <div className="mb-6 text-sm text-gray-600">
          <span
            className="hover:text-[var(--neon-blue)] cursor-pointer"
            onClick={() => router.push("/dashboard/training-modules")}
          >
            Catalog
          </span>{" "}
          <span className="mx-2">/</span>{" "}
          <span className="text-gray-900">{course.courseTitle}</span>
        </div>

        <div className="mb-6">
          <div className="inline-block px-3 py-1 bg-[var(--neon-blue)]/10 text-[var(--neon-blue)] rounded-md text-sm font-medium mb-4">
            Course
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            {course.courseTitle}
          </h1>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
          <div className="lg:col-span-2">
            <div className="mb-6">
              {course.createdBy && (
                <p className="text-sm text-gray-600 mb-2">
                  Created by {course.createdBy.displayName || course.createdBy.email || "Unknown"}
                  {course.createdAt && (
                    <span className="ml-2">
                      · {new Date(course.createdAt).toLocaleDateString()}
                    </span>
                  )}
                </p>
              )}
              <div className="text-gray-700 mb-6">
                {(() => {
                  const desc = course.description || "No description.";
                  const { visible, remaining, isLong } = truncateByWords(desc, DESCRIPTION_WORD_LIMIT);
                  if (!isLong) return <p>{desc}</p>;
                  return (
                    <p>
                      {descriptionExpanded ? (
                        <>
                          {desc}
                          <button
                            type="button"
                            onClick={() => setDescriptionExpanded(false)}
                            className="ml-1 text-[var(--neon-blue)] hover:underline font-medium"
                          >
                            Read less
                          </button>
                        </>
                      ) : (
                        <>
                          {visible}
                          {" "}
                          <button
                            type="button"
                            onClick={() => setDescriptionExpanded(true)}
                            className="text-[var(--neon-blue)] hover:underline font-medium"
                          >
                            Read more
                          </button>
                        </>
                      )}
                    </p>
                  );
                })()}
              </div>
            </div>
          </div>
          <div className="lg:col-span-1 flex flex-col">
            <div className="relative w-full aspect-video rounded-lg overflow-hidden mb-4">
              <Image
                src={DEFAULT_IMAGE}
                alt={course.courseTitle}
                fill
                className="object-cover"
              />
            </div>
            {/* Course Summary Badges */}
            <div className="flex flex-wrap items-center gap-2 mb-2">
              <div className="flex items-center gap-1 text-gray-700">
                <Lock className="w-3 h-3 text-[var(--neon-blue)]" />
                <span className="text-xs font-medium">FREE</span>
              </div>
              <div className="flex items-center gap-1 text-gray-700">
                <Clock className="w-3 h-3 text-[var(--neon-blue)]" />
                <span className="text-xs font-medium">SELF-PACED</span>
              </div>
              <div className="flex items-center gap-1 text-gray-700">
                <BarChart3 className="w-3 h-3 text-[var(--neon-blue)]" />
                <span className="text-xs font-medium">
                  {modules.length} MODULE{modules.length !== 1 ? "S" : ""}
                </span>
              </div>
              <div className="flex items-center gap-1 text-gray-700">
                <FlaskConical className="w-3 h-3 text-[var(--neon-blue)]" />
                <span className="text-xs font-medium">
                  {modules.reduce((acc, m) => acc + (m.quiz?.length ?? 0), 0)}{" "}
                  {modules.reduce((acc, m) => acc + (m.quiz?.length ?? 0), 0) === 1 ? "QUIZ" : "QUIZZES"}
                </span>
              </div>
              <div className="flex items-center gap-1 text-gray-700">
                <Monitor className="w-3 h-3 text-[var(--neon-blue)]" />
                <span className="text-xs font-medium">ONLINE</span>
              </div>
            </div>
            {/* Progress - circular like dashboard */}
            {totalItems > 0 && (
              <div className="mb-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-0.5">
                  Your progress
                </h3>
                <p className="text-xs text-gray-500 mb-4">
                  Overall completion rate
                </p>
                <div className="flex flex-col items-center mb-4">
                  <ProgressRadialChart
                    value={progressPercent}
                    size={140}
                    showIcon={true}
                  />
                </div>
                <div className="bg-gray-100 rounded-lg p-4 text-center">
                  <p className="text-2xl font-bold text-gray-900">
                    {progressPercent}%
                  </p>
                  <p className="text-xs text-gray-500">
                    {completedCount} of {totalItems} completed
                  </p>
                </div>
              </div>
            )}
            {course.createdAt && (
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Clock className="w-4 h-4" />
                <span>Added {new Date(course.createdAt).toLocaleDateString()}</span>
              </div>
            )}
          </div>
        </div>

        <div className="mb-8 pb-6 border-b border-gray-200" />

        <div className="flex gap-8 mb-8 border-b border-gray-200">
          <button
            onClick={() => setActiveTab("overview")}
            className={`pb-4 px-1 font-medium transition-colors ${
              activeTab === "overview"
                ? "text-[var(--neon-blue)] border-b-2 border-[var(--neon-blue)]"
                : "text-gray-600 hover:text-gray-900"
            }`}
          >
            Overview
          </button>
          <button
            onClick={() => setActiveTab("curriculum")}
            className={`pb-4 px-1 font-medium transition-colors ${
              activeTab === "curriculum"
                ? "text-[var(--neon-blue)] border-b-2 border-[var(--neon-blue)]"
                : "text-gray-600 hover:text-gray-900"
            }`}
          >
            Curriculum
          </button>
        </div>

        <div className="flex gap-8">
          <div className="flex-1">
            {(activeTab === "overview" || activeTab === "curriculum") && (
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-6">
                  {activeTab === "overview" ? "Here's what you will learn." : "Course Curriculum"}
                </h2>
                <div className="space-y-2">
                  {modules.map((module, moduleIndex) => {
                    const moduleId = module._id || String(moduleIndex);
                    const isExpanded = expandedModules.has(moduleId);
                    const sections = module.sections || [];
                    const hasQuiz = (module.quiz?.length ?? 0) > 0;
                    return (
                      <div
                        key={moduleId}
                        className={`border rounded-lg overflow-hidden transition-all ${
                          isExpanded
                            ? "border-[var(--neon-blue)] shadow-md"
                            : "border-gray-200 hover:border-gray-300"
                        }`}
                      >
                        <button
                          onClick={() => toggleModule(moduleId)}
                          className="w-full px-4 py-4 bg-white hover:bg-gray-50 transition-colors flex items-center justify-between text-left cursor-pointer"
                        >
                          <div className="flex items-center gap-3 flex-1">
                            <div className="w-8 h-8 rounded-full bg-[var(--neon-blue)]/10 flex items-center justify-center flex-shrink-0">
                              <div className="w-2 h-2 bg-[var(--neon-blue)] rounded-full" />
                            </div>
                            <span className="text-base font-medium text-gray-900">
                              {module.title || `Module ${moduleIndex + 1}`}
                            </span>
                          </div>
                          {isExpanded ? (
                            <ChevronDown className="w-5 h-5 text-[var(--neon-blue)]" />
                          ) : (
                            <ChevronRight className="w-5 h-5 text-gray-400" />
                          )}
                        </button>

                        {isExpanded && (
                          <div className="bg-gray-50 border-t border-gray-200">
                            {sections.map((section, sectionIndex) => {
                                const done = isCompleted(moduleIndex, sectionIndex);
                                return (
                                  <button
                                    key={section._id || sectionIndex}
                                    onClick={() => goToSection(moduleIndex, sectionIndex)}
                                    className="w-full px-4 py-3 pl-14 text-left text-sm text-gray-700 hover:bg-gray-100 hover:text-[var(--neon-blue)] transition-colors flex items-center gap-2 border-b border-gray-100 last:border-b-0"
                                  >
                                    {done ? (
                                      <CheckCircle2 className="w-4 h-4 text-[var(--neon-blue)] flex-shrink-0" />
                                    ) : (
                                      <ChevronRight className="w-4 h-4 text-gray-400 flex-shrink-0" />
                                    )}
                                    {section.title || `Section ${sectionIndex + 1}`}
                                  </button>
                                );
                              })}
                            {hasQuiz && (
                              <button
                                onClick={() => goToQuiz(moduleIndex)}
                                className="w-full px-4 py-3 pl-14 text-left text-sm text-gray-700 hover:bg-gray-100 hover:text-[var(--neon-blue)] transition-colors flex items-center gap-2 border-b border-gray-100 last:border-b-0"
                              >
                                {isCompleted(moduleIndex, "quiz") ? (
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
                </div>
              </div>
            )}
          </div>

          <div className="w-80 flex-shrink-0">
            <div className="sticky top-8 space-y-8">
              {/* Achievements Section - Badges (from course) */}
              <div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">
                  Achievements
                </h3>
                <p className="text-sm text-gray-600 mb-4">
                  Badges you can earn in this course.
                </p>
                <div className="grid grid-cols-3 gap-3">
                  {course.badges && course.badges.length > 0 ? (
                    course.badges.map((badgeId, index) => {
                      const Icon = getBadgeIcon(badgeId);
                      const label = AVAILABLE_BADGES.find((b) => b.id === badgeId)?.label ?? badgeId;
                      const isFirst = index === 0;
                      return (
                        <div
                          key={badgeId}
                          className={`flex flex-col items-center justify-center rounded-xl border-2 p-3 min-h-[5.5rem] transition-shadow hover:shadow-md ${
                            isFirst
                              ? "bg-gradient-to-br from-[var(--electric-blue)]/20 to-[var(--medium-blue)]/20 border-[var(--electric-blue)]"
                              : "bg-[var(--neon-blue)]/10 border-[var(--neon-blue)]/40"
                          }`}
                          title={label}
                        >
                          <div
                            className={`flex items-center justify-center w-10 h-10 rounded-full mb-2 ${
                              isFirst ? "bg-[var(--electric-blue)]/20" : "bg-[var(--neon-blue)]/20"
                            }`}
                          >
                            {Icon ? (
                              <Icon
                                className={`w-6 h-6 flex-shrink-0 ${
                                  isFirst ? "text-[var(--electric-blue)]" : "text-[var(--neon-blue)]"
                                }`}
                              />
                            ) : null}
                          </div>
                          <span
                            className={`text-[10px] font-semibold text-center leading-tight line-clamp-2 px-0.5 ${
                              isFirst ? "text-[var(--electric-blue)]" : "text-[var(--neon-blue)]"
                            }`}
                          >
                            {label}
                          </span>
                        </div>
                      );
                    })
                  ) : (
                    <>
                      <div className="flex flex-col items-center justify-center rounded-xl border-2 border-[var(--electric-blue)] bg-gradient-to-br from-[var(--electric-blue)]/20 to-[var(--medium-blue)]/20 p-3 min-h-[5.5rem]">
                        <div className="flex items-center justify-center w-10 h-10 rounded-full bg-[var(--electric-blue)]/20 mb-2">
                          <Award className="w-6 h-6 text-[var(--electric-blue)] flex-shrink-0" />
                        </div>
                        <span className="text-[10px] font-semibold text-[var(--electric-blue)] text-center leading-tight line-clamp-2 px-0.5">
                          {course.courseTitle.split(" ").slice(0, 2).join(" ") || "Course"}
                        </span>
                      </div>
                      <p className="col-span-2 text-xs text-gray-500 self-center">No badges added yet</p>
                    </>
                  )}
                </div>
              </div>

              {/* Skills / Topics */}
              <div>
                <h3 className="text-lg font-bold text-gray-900 mb-4">
                  Skills You Will Learn
                </h3>
                <div className="flex flex-wrap gap-2">
                  {modules.slice(0, 6).map((m, i) => (
                    <span
                      key={m._id || i}
                      className="px-3 py-1.5 bg-[var(--neon-blue)]/10 text-[var(--neon-blue)] rounded-md text-sm font-medium"
                    >
                      {m.title || `Module ${i + 1}`}
                    </span>
                  ))}
                  {modules.length > 6 && (
                    <span className="px-3 py-1.5 bg-gray-100 text-gray-600 rounded-md text-sm">
                      +{modules.length - 6} more
                    </span>
                  )}
                  {modules.length === 0 && (
                    <span className="px-3 py-1.5 bg-gray-100 text-gray-500 rounded-md text-sm">
                      Complete the course
                    </span>
                  )}
                </div>
              </div>

              {course.createdBy && (
                <div className="flex items-center gap-2">
                  <User className="w-5 h-5 text-[var(--neon-blue)]" />
                  <span className="text-sm text-gray-700">
                    {course.createdBy.displayName || course.createdBy.email}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <button
        onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
        className="fixed bottom-8 right-8 w-12 h-12 bg-[var(--neon-blue)] text-white rounded-full flex items-center justify-center shadow-lg hover:bg-[var(--medium-blue)] transition-colors z-50"
        aria-label="Scroll to top"
      >
        <ArrowUp className="w-5 h-5" />
      </button>
    </div>
  );
}
