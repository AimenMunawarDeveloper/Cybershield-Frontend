"use client";

import { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import { useAuth } from "@clerk/nextjs";
import HeroSection from "@/components/HeroSection";
import ModuleTable from "@/components/ModuleTable";
import CreateTrainingModuleModal, {
  type TrainingModuleData,
} from "@/components/CreateTrainingModuleModal";
import { ApiClient } from "@/lib/api";
import type { Course } from "@/lib/coursesData";
import { Plus, Grid, List, Filter, Search, Users, Pencil, Trash2, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useTranslation } from "@/hooks/useTranslation";

function courseToInitialData(course: Course): TrainingModuleData {
  return {
    courseTitle: course.courseTitle,
    description: course.description ?? "",
    level: course.level === "advanced" ? "advanced" : "basic",
    badges: course.badges ?? [],
    modules: (course.modules ?? []).map((m) => ({
      title: m.title ?? "",
      sections:
        (m.sections ?? []).length > 0
          ? (m.sections ?? []).map((s) => ({
              title: s.title ?? "",
              material: s.material ?? "",
              urls: Array.isArray(s.urls) ? s.urls : [],
              media: Array.isArray(s.media) ? s.media : [],
            }))
          : [{ title: "", material: "", urls: [], media: [] }],
      quiz: Array.isArray(m.quiz)
        ? m.quiz.map((q) => ({
            question: q.question ?? "",
            choices: Array.isArray(q.choices) && q.choices.length > 0 ? q.choices : [""],
            correctIndex: typeof q.correctIndex === "number" ? q.correctIndex : 0,
          }))
        : [],
    })),
  };
}

interface UserProfile {
  _id: string;
  email: string;
  displayName: string;
  role: "system_admin" | "client_admin" | "affiliated" | "non_affiliated";
  orgId?: string;
  orgName?: string;
}

export default function TrainingModulesPage() {
  const router = useRouter();
  const { getToken } = useAuth();
  const { t, tAsync, preTranslate, language } = useTranslation();
  const [viewMode, setViewMode] = useState<"grid" | "table">("grid");
  const [filter, setFilter] = useState("all");
  const [sortBy, setSortBy] = useState("newest");
  const [searchQuery, setSearchQuery] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCourse, setEditingCourse] = useState<Course | null>(null);
  const [courseToDelete, setCourseToDelete] = useState<Course | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [courses, setCourses] = useState<Course[]>([]);
  const [translatedCourses, setTranslatedCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [translationReady, setTranslationReady] = useState(false);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);

  // Fetch user profile to check permissions
  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        const api = new ApiClient(getToken!);
        const profile = await api.getUserProfile();
        setUserProfile(profile);
      } catch (err) {
        console.error("Failed to fetch user profile:", err);
      }
    };
    if (getToken) {
      fetchUserProfile();
    }
  }, [getToken]);

  // Check if user can perform CRUD operations
  const canPerformCRUD = userProfile?.role === "system_admin" || userProfile?.role === "client_admin";

  const fetchCourses = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const api = new ApiClient(getToken!);
      const res = await api.getCourses({ limit: 100, sort: sortBy === "oldest" ? "oldest" : "newest" });
      console.log("[TrainingModules] Fetched courses:", res);
      if (res.success && Array.isArray(res.courses)) {
        console.log("[TrainingModules] Setting courses:", res.courses.length, "courses");
        console.log("[TrainingModules] First course sample:", res.courses[0]);
        setCourses(res.courses);
      } else {
        console.warn("[TrainingModules] No courses in response or invalid format");
        setCourses([]);
      }
    } catch (err) {
      console.error("[TrainingModules] Failed to fetch courses:", err);
      setError(err instanceof Error ? err.message : t("Failed to load courses"));
      setCourses([]);
    } finally {
      setLoading(false);
    }
  }, [getToken, sortBy]);

  useEffect(() => {
    fetchCourses();
  }, [fetchCourses]);

  // Pre-translate static strings when language changes
  useEffect(() => {
    const preTranslatePageContent = async () => {
      if (language === "en") {
        setTranslationReady(true);
        return;
      }

      setTranslationReady(false);

      // Collect all static strings on the page
      const staticStrings = [
        // About Us section
        "About Us",
        "Empowering Lifelong Learners, One Course at a Time",
        "Founded with a vision to bridge the gap between traditional learning and modern technology, our platform offers flexible, on-demand learning that fits into your lifestyle. Join thousands of learners who are achieving their goals and shaping their future one lesson at a time.",
        "See More",
        "Total Register Students",
        "Excellent Employees",
        "Excellent Courses",
        
        // Course Catalog section
        "Explore Our Course Catalog",
        "New Training Module",
        "Search Courses",
        "Show all trainings",
        "Sort:",
        "Newest First",
        "Oldest First",
        "Alphabetical (A to Z)",
        "Grid View",
        "Table View",
        "Loading courses...",
        "No description",
        "Unknown",
        
        // Delete modal
        "Delete course?",
        "This will permanently delete",
        "and all progress for this course. This cannot be undone.",
        "Cancel",
        "Delete",
        "Deleting…",
        
        // Error messages
        "Failed to save course",
        "Failed to load courses",
        "Failed to delete course",
        "Edit",
      ];

      await preTranslate(staticStrings);
      setTranslationReady(true);
    };

    preTranslatePageContent();
  }, [language, preTranslate]);

  // Translate course data when language or courses change
  useEffect(() => {
    console.log("[TrainingModules] Translation effect triggered:", {
      language,
      coursesCount: courses.length,
      translationReady,
      translatedCoursesCount: translatedCourses.length,
    });

    if (language === "en" || courses.length === 0) {
      console.log("[TrainingModules] Setting courses directly (English or empty)");
      setTranslatedCourses(courses);
      return;
    }

    if (!translationReady) {
      console.log("[TrainingModules] Translation not ready yet, waiting...");
      // Don't set translated courses yet if translation is not ready
      // This prevents showing English text when language is Urdu
      return;
    }

    const translateCourses = async () => {
      console.log("[TrainingModules] Starting translation for", courses.length, "courses");
      
      // Collect all course titles and descriptions for batch translation
      const courseTexts: string[] = [];
      courses.forEach((course, index) => {
        if (course?.courseTitle && typeof course.courseTitle === "string") {
          courseTexts.push(course.courseTitle);
          console.log(`[TrainingModules] Course ${index} title:`, course.courseTitle);
        } else {
          console.warn(`[TrainingModules] Course ${index} has invalid title:`, course?.courseTitle);
        }
        if (course?.description && typeof course.description === "string") {
          courseTexts.push(course.description);
        }
      });

      console.log("[TrainingModules] Collected", courseTexts.length, "texts to translate");

      // Batch translate all course texts
      if (courseTexts.length > 0) {
        console.log("[TrainingModules] Calling preTranslate...");
        await preTranslate(courseTexts);
        console.log("[TrainingModules] preTranslate completed");
      }

      // Map translated texts back to courses using tAsync to ensure we get the translated values
      const translated = await Promise.all(
        courses.map(async (course, index) => {
          const originalTitle = course.courseTitle && typeof course.courseTitle === "string" ? course.courseTitle : "";
          const originalDesc = course.description && typeof course.description === "string" ? course.description : "";
          
          // Use tAsync to get translated values (it will use cached translations from preTranslate)
          const translatedTitle = originalTitle ? await tAsync(originalTitle) : "";
          const translatedDescription = originalDesc ? await tAsync(originalDesc) : "";
          
          console.log(`[TrainingModules] Course ${index} translation:`, {
            originalTitle,
            translatedTitle,
            titleChanged: originalTitle !== translatedTitle,
            originalDesc: originalDesc?.substring(0, 50),
            translatedDesc: translatedDescription?.substring(0, 50),
            descChanged: originalDesc !== translatedDescription,
          });

          return {
            ...course,
            courseTitle: translatedTitle || originalTitle,
            description: translatedDescription || originalDesc,
          };
        })
      );
      
      console.log("[TrainingModules] Setting translated courses:", translated.length);
      console.log("[TrainingModules] First translated course:", translated[0]);
      setTranslatedCourses(translated);
    };

    translateCourses();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [courses, language, translationReady]);

  const handleTrainingModuleSubmit = async (data: TrainingModuleData) => {
    try {
      const api = new ApiClient(getToken!);
      if (editingCourse) {
        await api.updateCourse(editingCourse._id, {
          courseTitle: data.courseTitle,
          description: data.description,
          level: data.level,
          badges: data.badges,
          modules: data.modules,
        });
      } else {
        await api.createCourse({
          courseTitle: data.courseTitle,
          description: data.description,
          level: data.level,
          badges: data.badges,
          modules: data.modules,
        });
      }
      setIsModalOpen(false);
      setEditingCourse(null);
      await fetchCourses();
    } catch (err) {
      console.error("Failed to save course:", err);
      alert(err instanceof Error ? err.message : t("Failed to save course"));
    }
  };

  const handleDeleteCourse = async () => {
    if (!courseToDelete || !getToken) return;
    try {
      setDeleting(true);
      const api = new ApiClient(getToken);
      await api.deleteCourse(courseToDelete._id);
      setCourseToDelete(null);
      await fetchCourses();
    } catch (err) {
      console.error("Failed to delete course:", err);
      alert(err instanceof Error ? err.message : t("Failed to delete course"));
    } finally {
      setDeleting(false);
    }
  };

  const openEditModal = (course: Course) => {
    setEditingCourse(course);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingCourse(null);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[var(--navy-blue)] via-[var(--navy-blue-light)] to-[var(--navy-blue)]">
      <HeroSection 
        courses={(() => {
          const coursesToPass = language === "en" ? courses : (translatedCourses.length > 0 ? translatedCourses : courses);
          console.log("[TrainingModules] Passing courses to HeroSection:", {
            language,
            coursesCount: courses.length,
            translatedCoursesCount: translatedCourses.length,
            passingCount: coursesToPass.length,
            translationReady,
            firstCourse: coursesToPass[0],
          });
          return coursesToPass;
        })()}
        translationReady={translationReady} 
      />

      {/* About Us Section */}
      {translationReady && (
        <div className="bg-white py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            {/* Left Side - Text Content */}
            <div className="space-y-6">
              <div>
                <p className="text-sm font-semibold text-[var(--neon-blue)] mb-2">
                  {t("About Us")}
                </p>
                <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
                  {t("Empowering Lifelong Learners, One Course at a Time")}
                </h2>
                <p className="text-lg text-gray-700 mb-6">
                  {t("Founded with a vision to bridge the gap between traditional learning and modern technology, our platform offers flexible, on-demand learning that fits into your lifestyle. Join thousands of learners who are achieving their goals and shaping their future one lesson at a time.")}
                </p>
                <button className="px-6 py-3 bg-[var(--neon-blue)] text-white rounded-lg font-medium hover:bg-[var(--medium-blue)] transition-colors">
                  {t("See More")}
                </button>
              </div>

              {/* Statistics */}
              <div className="grid grid-cols-3 gap-6 pt-8 border-t border-gray-200">
                <div className="text-center">
                  <div className="text-4xl font-bold text-[var(--neon-blue)] mb-2">
                    50+
                  </div>
                  <div className="text-sm text-gray-600">
                    {t("Total Register Students")}
                  </div>
                </div>
                <div className="text-center border-l border-r border-gray-200">
                  <div className="text-4xl font-bold text-[var(--neon-blue)] mb-2">
                    30+
                  </div>
                  <div className="text-sm text-gray-600">
                    {t("Excellent Employees")}
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-4xl font-bold text-[var(--neon-blue)] mb-2">
                    25+
                  </div>
                  <div className="text-sm text-gray-600">{t("Excellent Courses")}</div>
                </div>
              </div>
            </div>

            {/* Right Side - Images */}
            <div className="relative">
              <div className="grid grid-cols-2 gap-4">
                <div className="relative h-48 rounded-lg overflow-hidden">
                  <Image
                    src="https://images.unsplash.com/photo-1522202176988-66273c2fd55f?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80"
                    alt="Classroom"
                    fill
                    className="object-cover"
                  />
                </div>
                <div className="relative h-48 rounded-lg overflow-hidden mt-8">
                  <Image
                    src="https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80"
                    alt="Learning"
                    fill
                    className="object-cover"
                  />
                </div>
                <div className="relative h-48 rounded-lg overflow-hidden col-span-2">
                  <Image
                    src="https://images.unsplash.com/photo-1522071820081-009f0129c71c?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80"
                    alt="Collaboration"
                    fill
                    className="object-cover"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      )}

      {/* Course Catalog Section */}
      {translationReady && (
        <div className="bg-gradient-to-br from-[var(--navy-blue-light)] to-[var(--navy-blue-lighter)] py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          {/* Header with Controls */}
          <div className="mb-8">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
              <h2 className="text-4xl font-bold text-white mb-4 md:mb-0">
                {t("Explore Our Course Catalog")}
              </h2>
              <div className="flex items-center gap-4">
                {canPerformCRUD && (
                  <button
                    onClick={() => setIsModalOpen(true)}
                    className="inline-flex items-center gap-2 bg-[var(--neon-blue)] text-white px-4 py-2 rounded-full text-sm font-medium hover:bg-[var(--medium-blue)] transition-colors shadow"
                  >
                    <Plus className="w-4 h-4" />
                    {t("New Training Module")}
                  </button>
                )}
              </div>
            </div>

            {/* Controls Row */}
            <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between mb-6">
              <div className="flex flex-col sm:flex-row gap-3 flex-1">
                {/* Search Bar */}
                <div className="flex-1 max-w-md">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-white z-10" />
                    <input
                      type="text"
                      placeholder={t("Search Courses")}
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 rounded-lg text-sm bg-white/10 backdrop-blur-sm text-white placeholder-white/70 border border-white/20 focus:outline-none focus:ring-2 focus:ring-[var(--neon-blue)] focus:bg-white/20"
                    />
                  </div>
                </div>

                {/* Filter Dropdown */}
                <div className="flex items-center gap-2">
                  <Filter className="w-4 h-4 text-white/70" />
                  <select
                    value={filter}
                    onChange={(e) => setFilter(e.target.value)}
                    className="px-4 py-2 rounded-lg text-sm bg-white/10 backdrop-blur-sm text-white border border-white/20 focus:outline-none focus:ring-2 focus:ring-[var(--neon-blue)]"
                  >
                    <option
                      value="all"
                      className="bg-[var(--navy-blue)] text-white"
                    >
                      {t("Show all trainings")}
                    </option>
                  </select>
                </div>

                {/* Sort Dropdown */}
                <div className="flex items-center gap-2">
                  <span className="text-sm text-white/70">{t("Sort:")}</span>
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="px-4 py-2 rounded-lg text-sm bg-white/10 backdrop-blur-sm text-white border border-white/20 focus:outline-none focus:ring-2 focus:ring-[var(--neon-blue)]"
                  >
                    <option
                      value="newest"
                      className="bg-[var(--navy-blue)] text-white"
                    >
                      {t("Newest First")}
                    </option>
                    <option
                      value="oldest"
                      className="bg-[var(--navy-blue)] text-white"
                    >
                      {t("Oldest First")}
                    </option>
                    <option
                      value="alphabetical"
                      className="bg-[var(--navy-blue)] text-white"
                    >
                      {t("Alphabetical (A to Z)")}
                    </option>
                  </select>
                </div>
              </div>

              <div className="flex items-center gap-4">
                {/* View Mode Toggle */}
                <div className="flex items-center bg-white/10 backdrop-blur-sm rounded-lg p-1 border border-white/20">
                  <button
                    onClick={() => setViewMode("grid")}
                    className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                      viewMode === "grid"
                        ? "bg-[var(--neon-blue)] text-white shadow-sm"
                        : "text-white/70 hover:text-white"
                    }`}
                  >
                    <Grid className="w-4 h-4" />
                    {t("Grid View")}
                  </button>
                  <button
                    onClick={() => setViewMode("table")}
                    className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                      viewMode === "table"
                        ? "bg-[var(--neon-blue)] text-white shadow-sm"
                        : "text-white/70 hover:text-white"
                    }`}
                  >
                    <List className="w-4 h-4" />
                    {t("Table View")}
                  </button>
                </div>

                {/* Training Language Dropdown */}
                <select className="px-4 py-2 rounded-lg text-sm bg-white/10 backdrop-blur-sm text-white border border-white/20 focus:outline-none focus:ring-2 focus:ring-[var(--neon-blue)]">
                  <option
                    value="en"
                    className="bg-[var(--navy-blue)] text-white"
                  >
                    English
                  </option>
                  <option
                    value="es"
                    className="bg-[var(--navy-blue)] text-white"
                  >
                    Spanish
                  </option>
                  <option
                    value="fr"
                    className="bg-[var(--navy-blue)] text-white"
                  >
                    French
                  </option>
                  <option
                    value="de"
                    className="bg-[var(--navy-blue)] text-white"
                  >
                    German
                  </option>
                </select>
              </div>
            </div>
          </div>

          {/* Course Cards/Grid */}
          {viewMode === "grid" ? (
            <>
              {loading && (
                <div className="text-center py-12 text-white">{translationReady ? t("Loading courses...") : "Loading courses..."}</div>
              )}
              {error && (
                <div className="text-center py-12 text-red-300">{error}</div>
              )}
              {!loading && !error && translationReady && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                  {[...translatedCourses]
                    .filter((course) => {
                      if (!searchQuery) return true;
                      return (
                        course.courseTitle
                          .toLowerCase()
                          .includes(searchQuery.toLowerCase()) ||
                        (course.description || "")
                          .toLowerCase()
                          .includes(searchQuery.toLowerCase())
                      );
                    })
                    .sort((a, b) => {
                      if (sortBy === "alphabetical")
                        return a.courseTitle.localeCompare(b.courseTitle);
                      return 0;
                    })
                    .map((course) => (
                      <div
                        key={course._id}
                        className="bg-white rounded-lg overflow-hidden shadow-lg hover:shadow-xl transition-shadow cursor-pointer relative group"
                      >
                        <div
                          onClick={() =>
                            router.push(`/dashboard/training-modules/${course._id}`)
                          }
                          className="block"
                        >
                          <div className="relative h-48 bg-[var(--navy-blue-lighter)]">
                            <Image
                              src="https://images.unsplash.com/photo-1563013544-824ae1b704d3?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80"
                              alt={course.courseTitle}
                              fill
                              className="object-cover"
                            />
                          </div>
                          <div className="p-4">
                            <h3 className="text-lg font-bold text-gray-900 mb-2">
                              {course.courseTitle}
                            </h3>
                            <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                              {course.description || t("No description")}
                            </p>
                            <div className="flex items-center justify-between">
                              {course.createdBy && (
                                <div className="flex items-center gap-2">
                                  <Users className="w-4 h-4 text-[var(--neon-blue)]" />
                                  <span className="text-sm text-gray-600">
                                    {course.createdBy.displayName || t("Unknown")}
                                  </span>
                                </div>
                              )}
                              {course.createdAt && (
                                <span className="text-xs text-gray-500">
                                  {new Date(course.createdAt).toLocaleDateString()}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                        {canPerformCRUD && (
                          <div
                            className="absolute top-2 right-2 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                // Find original course for editing
                                const originalCourse = courses.find(c => c._id === course._id);
                                if (originalCourse) openEditModal(originalCourse);
                              }}
                              className="p-2 rounded-lg bg-white/90 shadow hover:bg-white text-gray-700 hover:text-[var(--neon-blue)]"
                              title={t("Edit")}
                            >
                              <Pencil className="w-4 h-4" />
                            </button>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                // Find original course for deletion
                                const originalCourse = courses.find(c => c._id === course._id);
                                if (originalCourse) setCourseToDelete(originalCourse);
                              }}
                              className="p-2 rounded-lg bg-white/90 shadow hover:bg-white text-gray-700 hover:text-red-500"
                              title={t("Delete")}
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        )}
                      </div>
                    ))}
                </div>
              )}
            </>
          ) : (
            translationReady && (
              <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6">
                <ModuleTable
                  courses={translatedCourses}
                  loading={loading}
                  error={error}
                  onEdit={canPerformCRUD ? ((translatedCourse) => {
                    // Find original course for editing
                    const originalCourse = courses.find(c => c._id === translatedCourse._id);
                    if (originalCourse) openEditModal(originalCourse);
                  }) : undefined}
                  onDelete={canPerformCRUD ? ((translatedCourse) => {
                    // Find original course for deletion
                    const originalCourse = courses.find(c => c._id === translatedCourse._id);
                    if (originalCourse) setCourseToDelete(originalCourse);
                  }) : undefined}
                />
              </div>
            )
          )}

        </div>
      </div>
      )}

      {/* Create / Edit Training Module Modal */}
      <CreateTrainingModuleModal
        isOpen={isModalOpen}
        onClose={closeModal}
        onSubmit={handleTrainingModuleSubmit}
        initialData={editingCourse ? courseToInitialData(editingCourse) : null}
        courseId={editingCourse?._id ?? null}
      />

      {/* Delete confirmation */}
      {courseToDelete && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 max-w-md w-full shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-gray-900">{t("Delete course?")}</h3>
              <button
                type="button"
                onClick={() => setCourseToDelete(null)}
                className="p-2 text-gray-500 hover:text-gray-700 rounded-lg hover:bg-gray-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <p className="text-gray-600 mb-6">
              {t("This will permanently delete")} &quot;{language === "ur" ? (translatedCourses.find(c => c._id === courseToDelete._id)?.courseTitle || courseToDelete.courseTitle) : courseToDelete.courseTitle}&quot; {t("and all progress for this course. This cannot be undone.")}
            </p>
            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setCourseToDelete(null)}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
              >
                {t("Cancel")}
              </button>
              <button
                type="button"
                onClick={handleDeleteCourse}
                disabled={deleting}
                className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 disabled:opacity-50"
              >
                {deleting ? t("Deleting…") : t("Delete")}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
