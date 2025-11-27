"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import {
  ChevronDown,
  ChevronRight,
  Lock,
  Clock,
  BarChart3,
  FlaskConical,
  Monitor,
  Shield,
  Bug,
  Key,
  Network,
  Award,
  ArrowUp,
  ArrowLeft,
  BookOpen,
  User,
  FileQuestion,
} from "lucide-react";
import { getCourseById, type Course } from "@/lib/coursesData";

export default function TrainingModuleDetailPage() {
  const params = useParams();
  const router = useRouter();
  const courseId = params.id as string;
  const [expandedModules, setExpandedModules] = useState<Set<string>>(
    new Set()
  );
  const [activeTab, setActiveTab] = useState<"overview" | "curriculum">(
    "overview"
  );
  const [course, setCourse] = useState<Course | null>(null);

  useEffect(() => {
    const foundCourse = getCourseById(courseId);
    if (!foundCourse) {
      router.push("/dashboard/training-modules");
      return;
    }
    setCourse(foundCourse);
    // Expand first module by default
    if (foundCourse.modules.length > 0) {
      setExpandedModules(new Set([foundCourse.modules[0].id]));
    }
  }, [courseId, router]);

  if (!course) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">Loading course...</p>
        </div>
      </div>
    );
  }

  const modules = course.modules;
  const skills = course.skills;

  const toggleModule = (moduleId: string) => {
    setExpandedModules((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(moduleId)) {
        newSet.delete(moduleId);
      } else {
        newSet.add(moduleId);
      }
      return newSet;
    });
  };

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const languages = [
    "Arabic",
    "Bahasa Indonesia",
    "Chinese (Simplified)",
    "German",
    "English",
    "Spanish",
    "French",
    "Greek",
    "Italian",
    "Japanese",
    "Korean",
    "Dutch",
    "Polish",
    "Portuguese",
    "Romanian",
    "Thai",
    "Turkish",
    "Ukrainian",
  ];

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Back Button */}
        <button
          onClick={() => router.push("/dashboard/training-modules")}
          className="mb-6 flex items-center gap-2 text-gray-600 hover:text-[var(--neon-blue)] transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Training Modules</span>
        </button>

        {/* Breadcrumbs */}
        <div className="mb-6 text-sm text-gray-600">
          <span
            className="hover:text-[var(--neon-blue)] cursor-pointer"
            onClick={() => router.push("/dashboard/training-modules")}
          >
            Catalog
          </span>{" "}
          <span className="mx-2">/</span>{" "}
          <span className="text-gray-900">{course.title}</span>
        </div>

        {/* Course Header */}
        <div className="mb-6">
          <div className="inline-block px-3 py-1 bg-[var(--neon-blue)]/10 text-[var(--neon-blue)] rounded-md text-sm font-medium mb-4">
            Course
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            {course.title}
          </h1>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
          {/* Left Column - Course Info */}
          <div className="lg:col-span-2">
            {/* Level and Description - Start of image height */}
            <div className="mb-6">
              <p className="text-lg text-gray-600 mb-2">{course.levelName}</p>
              <p className="text-gray-700 mb-6">{course.description}</p>
            </div>

            {/* Course Delivery Options */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <div className="border border-gray-200 rounded-lg p-4 hover:border-[var(--neon-blue)] transition-colors cursor-pointer">
                <div className="flex items-center gap-3 mb-2">
                  <BookOpen className="w-6 h-6 text-[var(--neon-blue)]" />
                  <h3 className="font-semibold text-gray-900">
                    Self-Paced Online
                  </h3>
                </div>
                <p className="text-sm text-gray-600">
                  Learn online at your own pace.
                </p>
              </div>
              <div className="border border-gray-200 rounded-lg p-4 hover:border-[var(--neon-blue)] transition-colors cursor-pointer">
                <div className="flex items-center gap-3 mb-2">
                  <User className="w-6 h-6 text-[var(--neon-blue)]" />
                  <h3 className="font-semibold text-gray-900">
                    Instructor-Led
                  </h3>
                </div>
                <p className="text-sm text-gray-600">Learn with an academy.</p>
              </div>
            </div>

            {/* Enrollment Section */}
            <div className="mb-6">
              <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
                <select className="px-4 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[var(--neon-blue)] text-gray-700">
                  <option value="en">English (English)</option>
                  {languages
                    .filter((lang) => lang !== "English")
                    .map((lang) => (
                      <option key={lang} value={lang.toLowerCase()}>
                        {lang}
                      </option>
                    ))}
                </select>
                <button className="px-6 py-2 bg-[var(--neon-blue)] text-white rounded-lg font-medium hover:bg-[var(--medium-blue)] transition-colors">
                  Get Started With Self-Paced
                </button>
                <span className="text-sm text-gray-600">
                  8,331,872 already enrolled
                </span>
              </div>
            </div>

            {/* Available Languages - End of image height */}
            <div className="mb-6">
              <h3 className="text-sm font-semibold text-gray-900 mb-2">
                AVAILABLE LANGUAGES
              </h3>
              <div className="flex flex-wrap gap-2">
                {languages.map((lang) => (
                  <span
                    key={lang}
                    className="px-3 py-1 bg-gray-100 text-gray-700 rounded-md text-xs hover:bg-[var(--neon-blue)]/10 hover:text-[var(--neon-blue)] transition-colors cursor-pointer"
                  >
                    {lang}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Right Column - Image and Badges */}
          <div className="lg:col-span-1 flex flex-col h-full">
            {/* Course Image - Full Height from levelName to languages */}
            <div className="relative w-full flex-1 rounded-lg overflow-hidden mb-4">
              <Image
                src={course.imageUrl}
                alt={course.title}
                fill
                className="object-cover"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.src =
                    "https://images.unsplash.com/photo-1563013544-824ae1b704d3?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80";
                }}
              />
            </div>

            {/* Course Summary Badges - Smaller */}
            <div className="flex flex-wrap items-center gap-2">
              <div className="flex items-center gap-1 text-gray-700">
                <Lock className="w-3 h-3 text-[var(--neon-blue)]" />
                <span className="text-xs font-medium">FREE</span>
              </div>
              <div className="flex items-center gap-1 text-gray-700">
                <Clock className="w-3 h-3 text-[var(--neon-blue)]" />
                <span className="text-xs font-medium">
                  {course.hours} HOURS
                </span>
              </div>
              <div className="flex items-center gap-1 text-gray-700">
                <BarChart3 className="w-3 h-3 text-[var(--neon-blue)]" />
                <span className="text-xs font-medium">
                  {course.difficulty.toUpperCase()}
                </span>
              </div>
              <div className="flex items-center gap-1 text-gray-700">
                <FlaskConical className="w-3 h-3 text-[var(--neon-blue)]" />
                <span className="text-xs font-medium">{course.labs} LABS</span>
              </div>
              <div className="flex items-center gap-1 text-gray-700">
                <Monitor className="w-3 h-3 text-[var(--neon-blue)]" />
                <span className="text-xs font-medium">SELF-PACED</span>
              </div>
            </div>
          </div>
        </div>

        <div className="mb-8 pb-6 border-b border-gray-200"></div>

        {/* Navigation Tabs */}
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
          {/* Main Content Area */}
          <div className="flex-1">
            {activeTab === "overview" && (
              <div>
                {/* Course Description */}
                <div className="mb-8">
                  <p className="text-gray-700 leading-relaxed mb-4">
                    {course.description}
                  </p>
                  <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                    <p className="text-sm text-gray-600">
                      <span className="font-semibold">Target Audience:</span>{" "}
                      {course.targetAudience}
                    </p>
                    <p className="text-sm text-gray-600">
                      <span className="font-semibold">Goal:</span> {course.goal}
                    </p>
                  </div>
                </div>

                {/* Here's what you will learn */}
                <div className="mb-8">
                  <h2 className="text-2xl font-bold text-gray-900 mb-6">
                    Here&apos;s what you will learn.
                  </h2>
                  <div className="space-y-2">
                    {modules.map((module) => {
                      const isExpanded = expandedModules.has(module.id);
                      return (
                        <div
                          key={module.id}
                          className={`border rounded-lg overflow-hidden transition-all ${
                            isExpanded
                              ? "border-[var(--neon-blue)] shadow-md"
                              : "border-gray-200 hover:border-gray-300"
                          }`}
                        >
                          <button
                            onClick={() => toggleModule(module.id)}
                            className="w-full px-4 py-4 bg-white hover:bg-gray-50 transition-colors flex items-center justify-between text-left cursor-pointer"
                          >
                            <div className="flex items-center gap-3 flex-1">
                              <div className="w-8 h-8 rounded-full bg-[var(--neon-blue)]/10 flex items-center justify-center flex-shrink-0">
                                <div className="w-2 h-2 bg-[var(--neon-blue)] rounded-full"></div>
                              </div>
                              <span className="text-base font-medium text-gray-900">
                                {module.title}
                              </span>
                            </div>
                            <div className="flex-shrink-0">
                              {isExpanded ? (
                                <ChevronDown className="w-5 h-5 text-[var(--neon-blue)]" />
                              ) : (
                                <ChevronRight className="w-5 h-5 text-gray-400" />
                              )}
                            </div>
                          </button>

                          {/* Submodules and Quiz */}
                          {isExpanded && (
                            <div className="bg-gray-50 border-t border-gray-200">
                              {module.submodules.map((submodule) => (
                                <button
                                  key={submodule.id}
                                  className="w-full px-4 py-3 pl-14 text-left text-sm text-gray-700 hover:bg-gray-100 hover:text-[var(--neon-blue)] transition-colors flex items-center gap-2 border-b border-gray-100 last:border-b-0"
                                >
                                  <ChevronRight className="w-4 h-4 text-gray-400" />
                                  {submodule.title}
                                </button>
                              ))}
                              {/* Module Quiz */}
                              <button className="w-full px-4 py-3 pl-14 text-left text-sm text-gray-700 hover:bg-gray-100 hover:text-[var(--neon-blue)] transition-colors flex items-center gap-2 border-b border-gray-100 last:border-b-0">
                                <FileQuestion className="w-4 h-4 text-[var(--neon-blue)]" />
                                <span>Module Quiz</span>
                              </button>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {activeTab === "curriculum" && (
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-6">
                  Course Curriculum
                </h2>
                <div className="space-y-2">
                  {modules.map((module) => {
                    const isExpanded = expandedModules.has(module.id);
                    return (
                      <div
                        key={module.id}
                        className={`border rounded-lg overflow-hidden transition-all ${
                          isExpanded
                            ? "border-[var(--neon-blue)] shadow-md"
                            : "border-gray-200 hover:border-gray-300"
                        }`}
                      >
                        <button
                          onClick={() => toggleModule(module.id)}
                          className="w-full px-4 py-4 bg-white hover:bg-gray-50 transition-colors flex items-center justify-between text-left cursor-pointer"
                        >
                          <div className="flex items-center gap-3 flex-1">
                            <div className="w-8 h-8 rounded-full bg-[var(--neon-blue)]/10 flex items-center justify-center flex-shrink-0">
                              <div className="w-2 h-2 bg-[var(--neon-blue)] rounded-full"></div>
                            </div>
                            <span className="text-base font-medium text-gray-900">
                              {module.title}
                            </span>
                          </div>
                          <div className="flex-shrink-0">
                            {isExpanded ? (
                              <ChevronDown className="w-5 h-5 text-[var(--neon-blue)]" />
                            ) : (
                              <ChevronRight className="w-5 h-5 text-gray-400" />
                            )}
                          </div>
                        </button>

                        {isExpanded && (
                          <div className="bg-gray-50 border-t border-gray-200">
                            {module.submodules.map((submodule) => (
                              <button
                                key={submodule.id}
                                className="w-full px-4 py-3 pl-14 text-left text-sm text-gray-700 hover:bg-gray-100 hover:text-[var(--neon-blue)] transition-colors flex items-center gap-2 border-b border-gray-100 last:border-b-0"
                              >
                                <ChevronRight className="w-4 h-4 text-gray-400" />
                                {submodule.title}
                              </button>
                            ))}
                            {/* Module Quiz */}
                            <button className="w-full px-4 py-3 pl-14 text-left text-sm text-gray-700 hover:bg-gray-100 hover:text-[var(--neon-blue)] transition-colors flex items-center gap-2 border-b border-gray-100 last:border-b-0">
                              <FileQuestion className="w-4 h-4 text-[var(--neon-blue)]" />
                              <span>Module Quiz</span>
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Right Sidebar */}
          <div className="w-80 flex-shrink-0">
            <div className="sticky top-8 space-y-8">
              {/* Achievements Section - Smaller Badges */}
              <div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">
                  Achievements
                </h3>
                <p className="text-sm text-gray-600 mb-4">
                  Badges you can earn in this course.
                </p>
                <div className="grid grid-cols-3 gap-1.5">
                  {/* Verified Badge - Smaller */}
                  <div className="col-span-3 p-1.5 bg-gradient-to-br from-[var(--neon-blue)]/10 to-[var(--electric-blue)]/10 border-2 border-[var(--neon-blue)] rounded-lg">
                    <div className="flex flex-col items-center text-center">
                      <Award className="w-4 h-4 text-[var(--neon-blue)] mb-0.5" />
                      <span className="text-[10px] font-semibold text-[var(--neon-blue)]">
                        Verified
                      </span>
                      <span className="text-[10px] text-gray-600 mt-0.5 line-clamp-2">
                        {course.title}
                      </span>
                    </div>
                  </div>
                  {/* Other Badges - Smaller */}
                  <div className="p-1 border-2 border-[var(--neon-blue)]/30 rounded-full flex items-center justify-center aspect-square">
                    <Network className="w-2.5 h-2.5 text-[var(--neon-blue)]" />
                  </div>
                  <div className="p-1 border-2 border-[var(--neon-blue)]/30 rounded-full flex items-center justify-center aspect-square">
                    <Bug className="w-2.5 h-2.5 text-[var(--neon-blue)]" />
                  </div>
                  <div className="p-1 border-2 border-[var(--neon-blue)]/30 rounded-full flex items-center justify-center aspect-square">
                    <Key className="w-2.5 h-2.5 text-[var(--neon-blue)]" />
                  </div>
                  <div className="p-1 border-2 border-[var(--neon-blue)]/30 rounded-full flex items-center justify-center aspect-square">
                    <Shield className="w-2.5 h-2.5 text-[var(--neon-blue)]" />
                  </div>
                  <div className="p-1 border-2 border-[var(--neon-blue)]/30 rounded-full flex items-center justify-center aspect-square">
                    <Network className="w-2.5 h-2.5 text-[var(--neon-blue)]" />
                  </div>
                </div>
              </div>

              {/* Skills Section */}
              <div>
                <h3 className="text-lg font-bold text-gray-900 mb-4">
                  Skills You Will Learn
                </h3>
                <div className="flex flex-wrap gap-2">
                  {skills.map((skill, index) => (
                    <span
                      key={index}
                      className="px-3 py-1.5 bg-[var(--neon-blue)]/10 text-[var(--neon-blue)] rounded-md text-sm font-medium"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Scroll to Top Button */}
      <button
        onClick={scrollToTop}
        className="fixed bottom-8 right-8 w-12 h-12 bg-[var(--neon-blue)] text-white rounded-full flex items-center justify-center shadow-lg hover:bg-[var(--medium-blue)] transition-colors z-50"
        aria-label="Scroll to top"
      >
        <ArrowUp className="w-5 h-5" />
      </button>
    </div>
  );
}
