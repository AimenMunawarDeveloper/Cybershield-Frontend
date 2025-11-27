"use client";

import { useState } from "react";
import Image from "next/image";
import HeroSection from "@/components/HeroSection";
import ModuleTable from "@/components/ModuleTable";
import CreateTrainingModuleModal from "@/components/CreateTrainingModuleModal";
import { courses } from "@/lib/coursesData";

interface TrainingModuleData {
  title: string;
  description: string;
  category: string;
  difficulty: string;
  duration: number;
  learningObjectives: string[];
  content: string;
  attachments: File[];
  targetAudience: string[];
  prerequisites: string[];
  tags: string[];
  isPublished: boolean;
}
import { Plus, Grid, List, Filter, Search, Users } from "lucide-react";
import { useRouter } from "next/navigation";

export default function TrainingModulesPage() {
  const router = useRouter();
  const [viewMode, setViewMode] = useState<"grid" | "table">("grid");
  const [filter, setFilter] = useState("all");
  const [sortBy, setSortBy] = useState("popularity");
  const [searchQuery, setSearchQuery] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleTrainingModuleSubmit = (moduleData: TrainingModuleData) => {
    console.log("New training module created:", moduleData);
    // Here you would typically make an API call to save the training module
    // For now, we'll just log it and close the modal
    setIsModalOpen(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[var(--navy-blue)] via-[var(--navy-blue-light)] to-[var(--navy-blue)]">
      <HeroSection />

      {/* About Us Section */}
      <div className="bg-white py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            {/* Left Side - Text Content */}
            <div className="space-y-6">
              <div>
                <p className="text-sm font-semibold text-[var(--neon-blue)] mb-2">
                  About Us
                </p>
                <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
                  Empowering Lifelong Learners, One Course at a Time
                </h2>
                <p className="text-lg text-gray-700 mb-6">
                  Founded with a vision to bridge the gap between traditional
                  learning and modern technology, our platform offers flexible,
                  on-demand learning that fits into your lifestyle. Join
                  thousands of learners who are achieving their goals and
                  shaping their future one lesson at a time.
                </p>
                <button className="px-6 py-3 bg-[var(--neon-blue)] text-white rounded-lg font-medium hover:bg-[var(--medium-blue)] transition-colors">
                  See More
                </button>
              </div>

              {/* Statistics */}
              <div className="grid grid-cols-3 gap-6 pt-8 border-t border-gray-200">
                <div className="text-center">
                  <div className="text-4xl font-bold text-[var(--neon-blue)] mb-2">
                    50+
                  </div>
                  <div className="text-sm text-gray-600">
                    Total Register Students
                  </div>
                </div>
                <div className="text-center border-l border-r border-gray-200">
                  <div className="text-4xl font-bold text-[var(--neon-blue)] mb-2">
                    30+
                  </div>
                  <div className="text-sm text-gray-600">
                    Excellent Employees
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-4xl font-bold text-[var(--neon-blue)] mb-2">
                    25+
                  </div>
                  <div className="text-sm text-gray-600">Excellent Courses</div>
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

      {/* Course Catalog Section */}
      <div className="bg-gradient-to-br from-[var(--navy-blue-light)] to-[var(--navy-blue-lighter)] py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          {/* Header with Controls */}
          <div className="mb-8">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
              <h2 className="text-4xl font-bold text-white mb-4 md:mb-0">
                Explore Our Course Catalog
              </h2>
              <div className="flex items-center gap-4">
                <button
                  onClick={() => setIsModalOpen(true)}
                  className="inline-flex items-center gap-2 bg-[var(--neon-blue)] text-white px-6 py-3 rounded-full text-lg font-medium hover:bg-[var(--medium-blue)] transform hover:scale-105 transition-all duration-300 shadow-lg"
                >
                  <Plus className="w-5 h-5" />
                  New Training Module
                </button>
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
                      placeholder="Search Courses"
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
                      Show all trainings
                    </option>
                    <option
                      value="beginner"
                      className="bg-[var(--navy-blue)] text-white"
                    >
                      Beginner Level
                    </option>
                    <option
                      value="intermediate"
                      className="bg-[var(--navy-blue)] text-white"
                    >
                      Intermediate Level
                    </option>
                    <option
                      value="advanced"
                      className="bg-[var(--navy-blue)] text-white"
                    >
                      Advanced Level
                    </option>
                    <option
                      value="premium"
                      className="bg-[var(--navy-blue)] text-white"
                    >
                      Premium Modules
                    </option>
                    <option
                      value="custom"
                      className="bg-[var(--navy-blue)] text-white"
                    >
                      Custom Modules
                    </option>
                  </select>
                </div>

                {/* Sort Dropdown */}
                <div className="flex items-center gap-2">
                  <span className="text-sm text-white/70">Sort:</span>
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="px-4 py-2 rounded-lg text-sm bg-white/10 backdrop-blur-sm text-white border border-white/20 focus:outline-none focus:ring-2 focus:ring-[var(--neon-blue)]"
                  >
                    <option
                      value="popularity"
                      className="bg-[var(--navy-blue)] text-white"
                    >
                      Popularity (Most to Least)
                    </option>
                    <option
                      value="duration"
                      className="bg-[var(--navy-blue)] text-white"
                    >
                      Duration (Short to Long)
                    </option>
                    <option
                      value="difficulty"
                      className="bg-[var(--navy-blue)] text-white"
                    >
                      Difficulty (Easy to Hard)
                    </option>
                    <option
                      value="alphabetical"
                      className="bg-[var(--navy-blue)] text-white"
                    >
                      Alphabetical (A to Z)
                    </option>
                    <option
                      value="newest"
                      className="bg-[var(--navy-blue)] text-white"
                    >
                      Newest First
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
                    Grid View
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
                    Table View
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
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
              {courses
                .filter((course) => {
                  if (filter === "all") return true;
                  if (filter === "beginner") return course.level === "beginner";
                  if (filter === "intermediate")
                    return course.level === "intermediate";
                  if (filter === "advanced") return course.level === "advanced";
                  if (filter === "premium") return course.isPremium;
                  if (filter === "custom") return course.isCustom;
                  return true;
                })
                .filter((course) => {
                  if (!searchQuery) return true;
                  return (
                    course.title
                      .toLowerCase()
                      .includes(searchQuery.toLowerCase()) ||
                    course.description
                      .toLowerCase()
                      .includes(searchQuery.toLowerCase())
                  );
                })
                .sort((a, b) => {
                  if (sortBy === "popularity") return 0; // Mock sort
                  if (sortBy === "duration") return a.hours - b.hours;
                  if (sortBy === "difficulty") {
                    const order: Record<string, number> = {
                      beginner: 1,
                      intermediate: 2,
                      advanced: 3,
                    };
                    return (order[a.level] || 0) - (order[b.level] || 0);
                  }
                  if (sortBy === "alphabetical")
                    return a.title.localeCompare(b.title);
                  return 0;
                })
                .map((course) => (
                  <div
                    key={course.id}
                    onClick={() =>
                      router.push(`/dashboard/training-modules/${course.id}`)
                    }
                    className="bg-white rounded-lg overflow-hidden shadow-lg hover:shadow-xl transition-shadow cursor-pointer"
                  >
                    <div className="relative h-48">
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
                    <div className="p-4">
                      <h3 className="text-lg font-bold text-gray-900 mb-2">
                        {course.title}
                      </h3>
                      <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                        {course.description}
                      </p>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Users className="w-4 h-4 text-[var(--neon-blue)]" />
                          <span className="text-sm text-gray-600">
                            3k+ Students
                          </span>
                        </div>
                        <span className="text-lg font-bold text-gray-900">
                          {course.isPremium ? "$350" : "Free"}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          ) : (
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6">
              <ModuleTable />
            </div>
          )}

          <div className="text-center mt-8">
            <button className="px-8 py-3 bg-[var(--neon-blue)] text-white rounded-lg font-medium hover:bg-[var(--medium-blue)] transition-colors">
              Load More Courses
            </button>
          </div>
        </div>
      </div>

      {/* Create Training Module Modal */}
      <CreateTrainingModuleModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleTrainingModuleSubmit}
      />
    </div>
  );
}
