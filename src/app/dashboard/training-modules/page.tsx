"use client";

import { useState } from "react";
import HeroSection from "@/components/HeroSection";
import ModuleGrid from "@/components/ModuleGrid";
import ModuleTable from "@/components/ModuleTable";
import CreateTrainingModuleModal from "@/components/CreateTrainingModuleModal";

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
import { Plus, Grid, List, Filter, Search } from "lucide-react";

export default function TrainingModulesPage() {
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

      {/* Main Content Area */}
      <div className="bg-white/95 backdrop-blur-sm rounded-t-3xl mt-8 min-h-screen ml-4 mr-4">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header Section */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8">
            <div className="flex items-center gap-4 mb-4 sm:mb-0">
              <button
                onClick={() => setIsModalOpen(true)}
                className="inline-flex items-center gap-2 bg-[var(--neon-blue)] text-white px-6 py-3 rounded-full text-lg font-medium hover:bg-[var(--medium-blue)] transform hover:scale-105 transition-all duration-300 shadow-lg"
              >
                <Plus className="w-5 h-5" />
                New Training Module
              </button>
            </div>

            <div className="flex items-center gap-4">
              {/* View Mode Toggle */}
              <div className="flex items-center bg-gray-100 rounded-lg p-1">
                <button
                  onClick={() => setViewMode("grid")}
                  className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    viewMode === "grid"
                      ? "bg-white text-[var(--neon-blue)] shadow-sm"
                      : "text-gray-600 hover:text-gray-900"
                  }`}
                >
                  <Grid className="w-4 h-4" />
                  Grid View
                </button>
                <button
                  onClick={() => setViewMode("table")}
                  className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    viewMode === "table"
                      ? "bg-white text-[var(--neon-blue)] shadow-sm"
                      : "text-gray-600 hover:text-gray-900"
                  }`}
                >
                  <List className="w-4 h-4" />
                  Table View
                </button>
              </div>

              {/* Training Language Dropdown */}
              <select className="px-4 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[var(--neon-blue)] text-[var(--navy-blue)]">
                <option value="en" className="text-[var(--navy-blue)]">
                  English
                </option>
                <option value="es" className="text-[var(--navy-blue)]">
                  Spanish
                </option>
                <option value="fr" className="text-[var(--navy-blue)]">
                  French
                </option>
                <option value="de" className="text-[var(--navy-blue)]">
                  German
                </option>
              </select>
            </div>
          </div>

          {/* Training Module Library Section */}
          <div className="mb-8 mx-4 sm:mx-6 lg:mx-8">
            <h2 className="text-3xl font-bold text-gray-900 mb-2">
              Training Module Library
            </h2>
            <p className="text-gray-600 mb-6">
              See our training modules support article.{" "}
              <a href="#" className="text-[var(--neon-blue)] hover:underline">
                support article
              </a>
            </p>

            {/* Filters and Search */}
            <div className="flex flex-col sm:flex-row gap-4 mb-6">
              {/* Filter Dropdown */}
              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-gray-500" />
                <select
                  value={filter}
                  onChange={(e) => setFilter(e.target.value)}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[var(--neon-blue)] text-[var(--navy-blue)]"
                >
                  <option value="all" className="text-[var(--navy-blue)]">
                    Show all trainings
                  </option>
                  <option value="beginner" className="text-[var(--navy-blue)]">
                    Beginner Level
                  </option>
                  <option
                    value="intermediate"
                    className="text-[var(--navy-blue)]"
                  >
                    Intermediate Level
                  </option>
                  <option value="advanced" className="text-[var(--navy-blue)]">
                    Advanced Level
                  </option>
                  <option value="premium" className="text-[var(--navy-blue)]">
                    Premium Modules
                  </option>
                  <option value="custom" className="text-[var(--navy-blue)]">
                    Custom Modules
                  </option>
                </select>
              </div>

              {/* Sort Dropdown */}
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600">Sort:</span>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[var(--neon-blue)] text-[var(--navy-blue)]"
                >
                  <option
                    value="popularity"
                    className="text-[var(--navy-blue)]"
                  >
                    Popularity (Most to Least)
                  </option>
                  <option value="duration" className="text-[var(--navy-blue)]">
                    Duration (Short to Long)
                  </option>
                  <option
                    value="difficulty"
                    className="text-[var(--navy-blue)]"
                  >
                    Difficulty (Easy to Hard)
                  </option>
                  <option
                    value="alphabetical"
                    className="text-[var(--navy-blue)]"
                  >
                    Alphabetical (A to Z)
                  </option>
                  <option value="newest" className="text-[var(--navy-blue)]">
                    Newest First
                  </option>
                </select>
              </div>

              {/* Search Bar */}
              <div className="flex-1 max-w-md">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Type the name of a training module"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-[var(--neon-blue)]"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Training Modules Grid/Table */}
          {viewMode === "grid" ? <ModuleGrid /> : <ModuleTable />}
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
