"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import {
  ArrowLeft,
  Clock,
  User,
  BookOpen,
  FileText,
  Download,
  MessageSquare,
  Play,
  Volume2,
  Settings,
  Maximize,
  CheckCircle2,
  Circle,
  ChevronRight,
} from "lucide-react";
import { getCourseById, type Course } from "@/lib/coursesData";

export default function SubmodulePage() {
  const params = useParams();
  const router = useRouter();
  const courseId = params.id as string;
  const submoduleId = params.submoduleId as string;
  const [course, setCourse] = useState<Course | null>(null);
  const [activeTab, setActiveTab] = useState<
    "transcript" | "notes" | "downloads" | "discussions"
  >("transcript");
  const [currentModule, setCurrentModule] = useState<any>(null);
  const [currentSubmodule, setCurrentSubmodule] = useState<any>(null);

  useEffect(() => {
    const foundCourse = getCourseById(courseId);
    if (!foundCourse) {
      router.push("/dashboard/training-modules");
      return;
    }
    setCourse(foundCourse);

    // Find the module and submodule
    for (const module of foundCourse.modules) {
      const submodule = module.submodules.find((s) => s.id === submoduleId);
      if (submodule) {
        setCurrentModule(module);
        setCurrentSubmodule(submodule);
        break;
      }
    }
  }, [courseId, submoduleId, router]);

  if (!course || !currentSubmodule) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">Loading content...</p>
        </div>
      </div>
    );
  }

  const getModuleProgress = (moduleId: string) => {
    // Mock progress calculation
    if (moduleId === currentModule?.id) {
      return 50; // Current module is 50% complete
    }
    const moduleIndex = course.modules.findIndex((m) => m.id === moduleId);
    const currentIndex = course.modules.findIndex(
      (m) => m.id === currentModule?.id
    );
    return moduleIndex < currentIndex ? 100 : 0;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Breadcrumb */}
      <div className="bg-white border-b border-gray-200 px-6 py-3">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <button
              onClick={() => router.push("/dashboard")}
              className="hover:text-[var(--neon-blue)]"
            >
              Dashboard
            </button>
            <ChevronRight className="w-4 h-4" />
            <button
              onClick={() => router.push("/dashboard/training-modules")}
              className="hover:text-[var(--neon-blue)]"
            >
              Courses
            </button>
            <ChevronRight className="w-4 h-4" />
            <button
              onClick={() => router.push("/dashboard/training-modules")}
              className="hover:text-[var(--neon-blue)]"
            >
              Programs
            </button>
            <ChevronRight className="w-4 h-4" />
            <span className="text-gray-900">{course.title}</span>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Sidebar */}
          <div className="lg:col-span-3 space-y-4">
            {/* Lecture Information Card */}
            <div className="bg-[var(--navy-blue-light)] rounded-lg p-4 text-white">
              <h3 className="font-semibold mb-3">Lecture Information</h3>
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-[var(--neon-blue)]" />
                  <span>Lecture Type: Pre-recorded</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-[var(--neon-blue)]" />
                  <span>Duration: ~{course.hours} hours</span>
                </div>
                <div className="flex items-center gap-2">
                  <User className="w-4 h-4 text-[var(--neon-blue)]" />
                  <span>Instructor: Prof. Security</span>
                </div>
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-[var(--neon-blue)]" />
                  <span>Total Modules: {course.modules.length}</span>
                </div>
              </div>
            </div>

            {/* Assignment Card */}
            <div className="bg-white rounded-lg border border-gray-200 p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-semibold text-gray-900">
                  Assignment
                </span>
                <span className="px-2 py-1 bg-[var(--sunset-orange)]/20 text-[var(--sunset-orange)] rounded-full text-xs font-medium">
                  New
                </span>
              </div>
              <h4 className="text-sm font-medium text-gray-900 mb-2">
                {currentSubmodule.title}: Problem-Solving Assignment
              </h4>
              <button className="text-sm text-[var(--neon-blue)] hover:underline flex items-center gap-1">
                View Details
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            {/* Course Description */}
            <div className="bg-white rounded-lg border border-gray-200 p-4">
              <h4 className="font-semibold text-gray-900 mb-2">
                {currentSubmodule.title}
              </h4>
              <p className="text-sm text-gray-600">{course.description}</p>
            </div>

            {/* Topics Covered */}
            <div className="bg-white rounded-lg border border-gray-200 p-4">
              <h4 className="font-semibold text-gray-900 mb-3">
                Topic&apos;s we&apos;ll cover
              </h4>
              <ol className="space-y-2 text-sm text-gray-700">
                {currentModule.submodules.map((sub: any, index: number) => (
                  <li key={sub.id} className="flex items-start gap-2">
                    <span className="text-[var(--neon-blue)] font-semibold">
                      {index + 1}.
                    </span>
                    <span>{sub.title}</span>
                  </li>
                ))}
              </ol>
            </div>
          </div>

          {/* Main Content Area */}
          <div className="lg:col-span-6 space-y-4">
            {/* Instructor Post */}
            <div className="bg-white rounded-lg border border-gray-200 p-4">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-full bg-[var(--neon-blue)]/20 flex items-center justify-center">
                  <User className="w-5 h-5 text-[var(--neon-blue)]" />
                </div>
                <div>
                  <p className="font-medium text-gray-900">Prof. Security</p>
                  <p className="text-xs text-gray-500">2hrs. ago</p>
                </div>
              </div>
              <p className="text-sm text-gray-700">
                {currentSubmodule.title} is a critical cybersecurity concept
                that helps protect against various threats. Understanding these
                techniques helps in organizing <strong>data efficiently</strong>
                , making it easier to identify, prevent, and respond to security
                incidents.
              </p>
            </div>

            {/* Video Player */}
            <div className="bg-black rounded-lg overflow-hidden relative aspect-video">
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center">
                  <div className="w-20 h-20 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center mb-4 mx-auto cursor-pointer hover:bg-white/30 transition-colors">
                    <Play className="w-10 h-10 text-white ml-1" />
                  </div>
                  <div className="text-white">
                    <h3 className="text-xl font-semibold mb-1">
                      {currentSubmodule.title}
                    </h3>
                    <p className="text-sm text-white/80">
                      Week{" "}
                      {course.modules.findIndex(
                        (m) => m.id === currentModule.id
                      ) + 1}{" "}
                      • Lesson{" "}
                      {currentModule.submodules.findIndex(
                        (s: any) => s.id === submoduleId
                      ) + 1}
                    </p>
                  </div>
                </div>
              </div>
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-white text-sm">02:00 / 10:00</span>
                  <div className="flex items-center gap-3">
                    <Volume2 className="w-5 h-5 text-white cursor-pointer" />
                    <Settings className="w-5 h-5 text-white cursor-pointer" />
                    <Maximize className="w-5 h-5 text-white cursor-pointer" />
                  </div>
                </div>
                <div className="w-full bg-white/20 h-1 rounded-full">
                  <div
                    className="bg-[var(--neon-blue)] h-1 rounded-full"
                    style={{ width: "20%" }}
                  ></div>
                </div>
              </div>
            </div>

            {/* Tabs */}
            <div className="bg-white rounded-lg border border-gray-200">
              <div className="flex border-b border-gray-200">
                {[
                  { id: "transcript", label: "Transcript" },
                  { id: "notes", label: "Notes" },
                  { id: "downloads", label: "Downloads" },
                  { id: "discussions", label: "Discussions" },
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as any)}
                    className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
                      activeTab === tab.id
                        ? "border-[var(--neon-blue)] text-[var(--neon-blue)]"
                        : "border-transparent text-gray-600 hover:text-gray-900"
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
              <div className="p-6">
                {activeTab === "transcript" && (
                  <div className="text-sm text-gray-700 space-y-4">
                    <p>
                      Your browser, no download required. In a split-screen
                      video, your instructor guides you step-by-step. Have a
                      question or want to discuss your course content with
                      peers, checkout our community discussion forums. Here you
                      can ask for help, have in-depth conversations and check
                      out the latest conversations happening in the community.
                    </p>
                    <p>
                      Be sure to pay it forward, engage with your peers that are
                      asking for help too. We are thrilled you&apos;re here and
                      we wish you the best of luck as you embark on this
                      journey.
                    </p>
                    <div className="flex items-center gap-6 pt-4 border-t border-gray-200">
                      <button className="flex items-center gap-2 text-[var(--neon-blue)] hover:underline">
                        <span className="font-semibold">500k</span>
                        <span>Upvotes</span>
                      </button>
                      <button className="text-gray-600 hover:text-[var(--neon-blue)]">
                        Shares
                      </button>
                      <button className="text-gray-600 hover:text-[var(--neon-blue)]">
                        400 Comments
                      </button>
                    </div>
                  </div>
                )}
                {activeTab === "notes" && (
                  <div className="text-sm text-gray-700">
                    <p>
                      Your notes will appear here. Start taking notes while
                      watching the video.
                    </p>
                  </div>
                )}
                {activeTab === "downloads" && (
                  <div className="text-sm text-gray-700">
                    <div className="space-y-2">
                      <button className="flex items-center gap-2 text-[var(--neon-blue)] hover:underline">
                        <Download className="w-4 h-4" />
                        <span>Course Materials PDF</span>
                      </button>
                      <button className="flex items-center gap-2 text-[var(--neon-blue)] hover:underline">
                        <Download className="w-4 h-4" />
                        <span>Practice Exercises</span>
                      </button>
                    </div>
                  </div>
                )}
                {activeTab === "discussions" && (
                  <div className="text-sm text-gray-700">
                    <p>
                      Join the discussion forum to ask questions and interact
                      with peers.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right Sidebar - Course Progress */}
          <div className="lg:col-span-3">
            <div className="bg-white rounded-lg border border-gray-200 p-4 sticky top-6">
              <h3 className="font-semibold text-gray-900 mb-4">
                Course Progress
              </h3>
              <div className="space-y-4">
                {course.modules.map((module, moduleIndex) => {
                  const progress = getModuleProgress(module.id);
                  const isCurrentModule = module.id === currentModule.id;
                  const isCompleted = progress === 100;

                  return (
                    <div key={module.id}>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-gray-900">
                          Week {moduleIndex + 1}
                        </span>
                        {isCompleted ? (
                          <CheckCircle2 className="w-5 h-5 text-[var(--neon-blue)]" />
                        ) : (
                          <Circle className="w-5 h-5 text-gray-300" />
                        )}
                      </div>
                      <p className="text-xs text-gray-600 mb-2">
                        {module.title}
                      </p>
                      {isCurrentModule && (
                        <div className="space-y-1">
                          {module.submodules.map((sub: any) => {
                            const isCurrentSub = sub.id === submoduleId;
                            const isSubCompleted =
                              module.submodules.findIndex(
                                (s: any) => s.id === sub.id
                              ) <
                              module.submodules.findIndex(
                                (s: any) => s.id === submoduleId
                              );

                            return (
                              <button
                                key={sub.id}
                                onClick={() =>
                                  router.push(
                                    `/dashboard/training-modules/${courseId}/${sub.id}`
                                  )
                                }
                                className={`w-full text-left px-3 py-2 rounded text-xs flex items-center justify-between ${
                                  isCurrentSub
                                    ? "bg-[var(--neon-blue)]/10 text-[var(--neon-blue)]"
                                    : isSubCompleted
                                    ? "text-gray-700 hover:bg-gray-50"
                                    : "text-gray-500 hover:bg-gray-50"
                                }`}
                              >
                                <span>{sub.title}</span>
                                {isCurrentSub ? (
                                  <Play className="w-3 h-3 text-[var(--neon-blue)]" />
                                ) : isSubCompleted ? (
                                  <CheckCircle2 className="w-3 h-3 text-[var(--neon-blue)]" />
                                ) : null}
                              </button>
                            );
                          })}
                        </div>
                      )}
                      {!isCurrentModule && progress > 0 && (
                        <div className="w-full bg-gray-200 h-1 rounded-full">
                          <div
                            className="bg-[var(--neon-blue)] h-1 rounded-full"
                            style={{ width: `${progress}%` }}
                          ></div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
