"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
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
  Download,
  ExternalLink,
  CheckCircle,
  Layers,
  GraduationCap,
} from "lucide-react";
import { ApiClient } from "@/lib/api";
import type { Course, CourseModule } from "@/lib/coursesData";
import { getBadgeIcon, AVAILABLE_BADGES } from "@/lib/courseBadges";
import ProgressRadialChart from "@/components/ProgressRadialChart";
import { useTranslation } from "@/hooks/useTranslation";
import { useLanguage } from "@/contexts/LanguageContext";

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
  const { language } = useLanguage();
  const { t, preTranslate, isTranslating } = useTranslation();
  const courseId = params.id as string;
  const [expandedModules, setExpandedModules] = useState<Set<string>>(new Set());
  const [activeTab, setActiveTab] = useState<"overview" | "curriculum">("overview");
  const [course, setCourse] = useState<Course | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [descriptionExpanded, setDescriptionExpanded] = useState(false);
  const [completedIds, setCompletedIds] = useState<string[]>([]);
  const [certificate, setCertificate] = useState<any | null>(null);
  const [loadingCertificate, setLoadingCertificate] = useState(false);
  const [translationReady, setTranslationReady] = useState(false);
  const [translatedCourse, setTranslatedCourse] = useState<Course | null>(null);
  const [translatedBadgeLabels, setTranslatedBadgeLabels] = useState<Map<string, string>>(new Map());

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
          setError(err instanceof Error ? err.message : t("Failed to load course"));
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

  // Use translated course or fallback to original (must be declared early)
  const displayCourse = useMemo(() => translatedCourse || course, [translatedCourse, course]);

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
        "Back to Training Modules",
        "Catalog",
        "Course",
        
        // Description
        "No description.",
        "Read less",
        "Read more",
        "Created by",
        "Complete",
        
        // Badges
        "Basic",
        "Advanced",
        "MODULE",
        "MODULES",
        "QUIZ",
        "QUIZZES",
        "ONLINE",
        
        // Progress
        "Your progress",
        "Overall completion rate",
        "completed",
        "of",
        
        // Certificate
        "Certificate Earned",
        "Certificate Available",
        "Earn a Certificate",
        "You've successfully completed this course and earned a certificate.",
        "Complete all modules to earn your certificate.",
        "more to earn your certificate.",
        "View Certificate",
        "Issued on",
        "Generating...",
        "Generate Certificate",
        "Complete course to unlock",
        "Added",
        
        // Tabs
        "Overview",
        "Curriculum",
        "Here's what you will learn.",
        "Course Curriculum",
        
        // Module Quiz
        "Module Quiz",
        
        // Achievements
        "Achievements",
        "Badges you can earn in this course.",
        "No badges added yet",
        
        // Skills
        "Skills You Will Learn",
        "more",
        "Complete the course",
        
        // Loading/Error
        "Loading course...",
        "Course not found.",
        "Failed to load course",
        
        // Section labels
        "Section",
        
        // Badge labels
        ...AVAILABLE_BADGES.map(badge => badge.label),
      ];

      await preTranslate(staticStrings);
      
      // Translate badge labels separately for efficient caching and Map-based lookup
      if (language === "ur") {
        const badgeLabels = AVAILABLE_BADGES.map(badge => badge.label);
        const { translateService } = await import("@/services/translateService");
        const translatedBadges = await translateService.translateBatch(badgeLabels);
        const badgeMap = new Map<string, string>();
        AVAILABLE_BADGES.forEach((badge, index) => {
          badgeMap.set(badge.id, translatedBadges[index]);
        });
        setTranslatedBadgeLabels(badgeMap);
      } else {
        setTranslatedBadgeLabels(new Map());
      }
      
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

        // Course title and description
        if (course.courseTitle) {
          textsToTranslate.push(course.courseTitle);
          textMap.push({ type: "courseTitle", path: [] });
        }
        if (course.description) {
          textsToTranslate.push(course.description);
          textMap.push({ type: "description", path: [] });
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
          description: course.description && textMap.find(m => m.type === "description")
            ? translatedTexts[textsToTranslate.indexOf(course.description)]
            : course.description,
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

  // Check for certificate when course is completed
  useEffect(() => {
    if (!getToken || !courseId || !displayCourse) {
      setCertificate(null);
      return;
    }

    // Calculate progress
    const modules: CourseModule[] = displayCourse.modules || [];
    const totalItems = modules.reduce(
      (acc, m) => acc + (m.sections?.length ?? 0) + ((m.quiz?.length ?? 0) > 0 ? 1 : 0),
      0
    );
    const completedCount = completedIds.length;
    const progressPercent = totalItems > 0 ? Math.round((completedCount / totalItems) * 100) : 0;

    if (progressPercent < 100) {
      setCertificate(null);
      return;
    }
    
    const checkCertificate = async () => {
      try {
        setLoadingCertificate(true);
        const api = new ApiClient(getToken);
        const certData = await api.getCertificateByCourse(courseId);
        if (certData.certificate) {
          setCertificate(certData.certificate);
        }
      } catch (err) {
        // Certificate doesn't exist yet or error - that's okay
        setCertificate(null);
      } finally {
        setLoadingCertificate(false);
      }
    };

    checkCertificate();
  }, [getToken, courseId, displayCourse, completedIds]);

  const toggleModule = useCallback((moduleId: string) => {
    setExpandedModules((prev) => {
      const next = new Set(prev);
      if (next.has(moduleId)) next.delete(moduleId);
      else next.add(moduleId);
      return next;
    });
  }, []);

  const goToSection = useCallback((moduleIndex: number, sectionIndex: number) => {
    router.push(`/dashboard/training-modules/${courseId}/${moduleIndex}-${sectionIndex}`);
  }, [router, courseId]);

  const goToQuiz = useCallback((moduleIndex: number) => {
    router.push(`/dashboard/training-modules/${courseId}/${moduleIndex}-quiz`);
  }, [router, courseId]);

  if (loading || !displayCourse) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">{loading ? t("Loading course...") : t("Course not found.")}</p>
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

  const modules: CourseModule[] = displayCourse.modules || [];
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
          <span>{t("Back to Training Modules")}</span>
        </button>

        <div className="mb-6 text-sm text-gray-600">
          <span
            className="hover:text-[var(--neon-blue)] cursor-pointer"
            onClick={() => router.push("/dashboard/training-modules")}
          >
            {t("Catalog")}
          </span>{" "}
          <span className="mx-2">/</span>{" "}
          <span className="text-gray-900">{displayCourse.courseTitle}</span>
        </div>

        <div className="mb-6">
          <div className="inline-block px-3 py-1 bg-[var(--neon-blue)]/10 text-[var(--neon-blue)] rounded-md text-sm font-medium mb-4">
            {t("Course")}
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            {displayCourse.courseTitle}
          </h1>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8 items-start">
          {/* Left (2/3): description + badges + added */}
          <div className="lg:col-span-2 space-y-6">
            <div>
              {displayCourse.createdBy && (
                <p className="text-sm text-gray-600 mb-2">
                  {t("Created by")} {displayCourse.createdBy.displayName || displayCourse.createdBy.email || "Unknown"}
                  {displayCourse.createdAt && (
                    <span className="ml-2">
                      · {new Date(displayCourse.createdAt).toLocaleDateString()}
                    </span>
                  )}
                </p>
              )}
              <div className="text-gray-700">
                {(() => {
                  const desc = displayCourse.description || t("No description.");
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
                            {t("Read less")}
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
                            {t("Read more")}
                          </button>
                        </>
                      )}
                    </p>
                  );
                })()}
              </div>
            </div>

            {/* Course Summary Badges - below description */}
            <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-gray-100">
              <div className="flex items-center gap-1.5 text-gray-700">
                <BarChart3 className="w-4 h-4 text-[var(--neon-blue)]" />
                <span className="text-sm font-medium">
                  {modules.length} {modules.length !== 1 ? t("MODULES") : t("MODULE")}
                </span>
              </div>
              <div className="flex items-center gap-1.5 text-gray-700">
                <FlaskConical className="w-4 h-4 text-[var(--neon-blue)]" />
                <span className="text-sm font-medium">
                  {modules.filter((m) => (m.quiz?.length ?? 0) > 0).length}{" "}
                  {modules.filter((m) => (m.quiz?.length ?? 0) > 0).length === 1 ? t("QUIZ") : t("QUIZZES")}
                </span>
              </div>
              <div className="flex items-center gap-1.5 text-gray-700">
                {displayCourse?.level === "advanced" ? (
                  <GraduationCap className="w-4 h-4 text-[var(--neon-blue)]" />
                ) : (
                  <Layers className="w-4 h-4 text-[var(--neon-blue)]" />
                )}
                <span className="text-sm font-medium uppercase">
                  {displayCourse?.level === "advanced" ? t("Advanced") : t("Basic")}
                </span>
              </div>
              <div className="flex items-center gap-1.5 text-gray-700">
                <Monitor className="w-4 h-4 text-[var(--neon-blue)]" />
                <span className="text-sm font-medium">{t("ONLINE")}</span>
              </div>
            </div>

            {displayCourse.createdAt && (
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Clock className="w-4 h-4" />
                <span>{t("Added")} {new Date(displayCourse.createdAt).toLocaleDateString()}</span>
              </div>
            )}
          </div>

          {/* Right (1/3): image + certificate below, button on right */}
          <div className="lg:col-span-1 space-y-6">
            <div className="relative w-full rounded-xl overflow-hidden shadow-md bg-gray-100 aspect-video">
              <Image
                src={DEFAULT_IMAGE}
                alt={displayCourse.courseTitle}
                fill
                className="object-cover"
                priority
                sizes="(max-width: 1024px) 100vw, 33vw"
              />
            </div>

            {/* Certificate Section - below image, button right-aligned */}
            <div className={`border rounded-xl overflow-hidden transition-all bg-white ${
              certificate 
                ? "border-[var(--neon-blue)]/30 shadow-sm" 
                : progressPercent === 100
                ? "border-[var(--neon-blue)]/20"
                : "border-gray-200"
            }`}>
              <div className="p-4">
                <div className="flex items-start gap-3">
                  <div className={`flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center ${
                    certificate 
                      ? "bg-[var(--neon-blue)]" 
                      : progressPercent === 100
                      ? "bg-[var(--neon-blue)]/80"
                      : "bg-gray-100"
                  }`}>
                    <Award className={`w-5 h-5 ${
                      certificate || progressPercent === 100 ? "text-white" : "text-gray-400"
                    }`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-semibold text-gray-900 mb-1">
                      {certificate ? t("Certificate Earned") : progressPercent === 100 ? t("Certificate Available") : t("Earn a Certificate")}
                    </h3>
                    <p className="text-xs text-gray-600 mb-3 leading-relaxed">
                      {certificate 
                        ? t("You've successfully completed this course and earned a certificate.")
                        : progressPercent === 100
                        ? t("Complete all modules to earn your certificate.")
                        : `${t("Complete")} ${100 - progressPercent}% ${t("more to earn your certificate.")}`
                      }
                    </p>
                    {certificate ? (
                      <div className="flex flex-col gap-2 items-end">
                        <button
                          onClick={() => router.push(`/dashboard/certificates`)}
                          className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-[var(--neon-blue)] text-white rounded-md hover:bg-[var(--medium-blue)] transition-colors text-sm font-medium"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                          {t("View Certificate")}
                        </button>
                        <div className="flex items-center gap-2 text-xs text-gray-500">
                          <CheckCircle className="w-3.5 h-3.5 text-[var(--neon-blue)]" />
                          <span>{t("Issued on")} {new Date(certificate.issuedDate).toLocaleDateString()}</span>
                        </div>
                      </div>
                    ) : progressPercent === 100 ? (
                      <div className="flex justify-end">
                        <button
                          onClick={async () => {
                            try {
                              setLoadingCertificate(true);
                              const api = new ApiClient(getToken);
                              await api.generateCertificate(courseId);
                              const certData = await api.getCertificateByCourse(courseId);
                              if (certData.certificate) {
                                setCertificate(certData.certificate);
                              }
                            } catch (err) {
                              console.error("Failed to generate certificate:", err);
                            } finally {
                              setLoadingCertificate(false);
                            }
                          }}
                          disabled={loadingCertificate}
                          className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-[var(--neon-blue)] text-white rounded-md hover:bg-[var(--medium-blue)] transition-colors text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {loadingCertificate ? (
                            <>
                              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                              {t("Generating...")}
                            </>
                          ) : (
                            <>
                              <Award className="w-3.5 h-3.5" />
                              {t("Generate Certificate")}
                            </>
                          )}
                        </button>
                      </div>
                    ) : (
                      <div className="flex justify-end">
                        <div className="flex items-center gap-2 text-xs text-gray-500">
                          <Lock className="w-3.5 h-3.5" />
                          <span>{t("Complete course to unlock")}</span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
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
            {t("Overview")}
          </button>
          <button
            onClick={() => setActiveTab("curriculum")}
            className={`pb-4 px-1 font-medium transition-colors ${
              activeTab === "curriculum"
                ? "text-[var(--neon-blue)] border-b-2 border-[var(--neon-blue)]"
                : "text-gray-600 hover:text-gray-900"
            }`}
          >
            {t("Curriculum")}
          </button>
        </div>

        <div className="flex gap-8">
          <div className="flex-1">
            {(activeTab === "overview" || activeTab === "curriculum") && (
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-6">
                  {activeTab === "overview" ? t("Here's what you will learn.") : t("Course Curriculum")}
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
                                    {section.title || `${t("Section")} ${sectionIndex + 1}`}
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
                                <span>{t("Module Quiz")}</span>
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
              {/* Your progress - first */}
              {totalItems > 0 && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-0.5">
                    {t("Your progress")}
                  </h3>
                  <p className="text-xs text-gray-500 mb-4">
                    {t("Overall completion rate")}
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
                      {completedCount} {t("of")} {totalItems} {t("completed")}
                    </p>
                  </div>
                </div>
              )}

              {/* Achievements Section - Badges (from course) */}
              <div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">
                  {t("Achievements")}
                </h3>
                <p className="text-sm text-gray-600 mb-4">
                  {t("Badges you can earn in this course.")}
                </p>
                <div className="grid grid-cols-3 gap-3">
                  {displayCourse.badges && displayCourse.badges.length > 0 ? (
                    displayCourse.badges.map((badgeId, index) => {
                      const Icon = getBadgeIcon(badgeId);
                      const originalLabel = AVAILABLE_BADGES.find((b) => b.id === badgeId)?.label ?? badgeId;
                      const label = language === "ur" && translatedBadgeLabels.has(badgeId)
                        ? translatedBadgeLabels.get(badgeId)!
                        : originalLabel;
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
                          {displayCourse.courseTitle.split(" ").slice(0, 2).join(" ") || t("Course")}
                        </span>
                      </div>
                      <p className="col-span-2 text-xs text-gray-500 self-center">{t("No badges added yet")}</p>
                    </>
                  )}
                </div>
              </div>

              {/* Skills / Topics */}
              <div>
                <h3 className="text-lg font-bold text-gray-900 mb-4">
                  {t("Skills You Will Learn")}
                </h3>
                <div className="flex flex-wrap gap-2">
                  {modules.slice(0, 6).map((m, i) => (
                    <span
                      key={m._id || i}
                      className="px-3 py-1.5 bg-[var(--neon-blue)]/10 text-[var(--neon-blue)] rounded-md text-sm font-medium"
                    >
                      {m.title || `${t("Module")} ${i + 1}`}
                    </span>
                  ))}
                  {modules.length > 6 && (
                    <span className="px-3 py-1.5 bg-gray-100 text-gray-600 rounded-md text-sm">
                      +{modules.length - 6} {t("more")}
                    </span>
                  )}
                  {modules.length === 0 && (
                    <span className="px-3 py-1.5 bg-gray-100 text-gray-500 rounded-md text-sm">
                      {t("Complete the course")}
                    </span>
                  )}
                </div>
              </div>

              {displayCourse.createdBy && (
                <div className="flex items-center gap-2">
                  <User className="w-5 h-5 text-[var(--neon-blue)]" />
                  <span className="text-sm text-gray-700">
                    {displayCourse.createdBy.displayName || displayCourse.createdBy.email}
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
