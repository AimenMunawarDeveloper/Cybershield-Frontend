"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { Clock, Shield, Lock, Star, Users, Award } from "lucide-react";
import { courses } from "@/lib/coursesData";

// Container component for grid layout
const ModuleGrid = () => {
  return (
    <div className="container mx-auto px-4 py-8">
      {/* Level Sections */}
      <div className="space-y-12">
        {/* Beginner Level */}
        <div>
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Level 1 — Beginner (Awareness Track)
            </h2>
            <p className="text-gray-600">
              For: Students, general public, new employees, non-technical users
            </p>
            <p className="text-gray-600">
              Goal: Identify, avoid, and report common cyber threats.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {courses
              .filter((course) => course.level === "beginner")
              .map((course) => (
                <ModuleCard key={course.id} course={course} />
              ))}
          </div>
        </div>

        {/* Intermediate Level */}
        <div>
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Level 2 — Intermediate (Operational Track)
            </h2>
            <p className="text-gray-600">
              For: IT students, cybersecurity learners, power users,
              organization staff
            </p>
            <p className="text-gray-600">
              Goal: Understand how attacks work and how to defend against them.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {courses
              .filter((course) => course.level === "intermediate")
              .map((course) => (
                <ModuleCard key={course.id} course={course} />
              ))}
          </div>
        </div>

        {/* Advanced Level */}
        <div>
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Level 3 — Advanced (Technical & Analytical Track)
            </h2>
            <p className="text-gray-600">
              For: Students serious about cybersecurity, SOC interns, technical
              staff
            </p>
            <p className="text-gray-600">
              Goal: Understand deeper technical concepts & basic incident
              response.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {courses
              .filter((course) => course.level === "advanced")
              .map((course) => (
                <ModuleCard key={course.id} course={course} />
              ))}
          </div>
        </div>
      </div>
    </div>
  );
};

const ModuleCard = ({ course }: { course: (typeof courses)[0] }) => {
  const router = useRouter();

  const handleCardClick = () => {
    router.push(`/dashboard/training-modules/${course.id}`);
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case "Beginner":
        return "bg-[var(--neon-blue)]/10 text-[var(--neon-blue)]";
      case "Intermediate":
        return "bg-[var(--electric-blue)]/10 text-[var(--electric-blue)]";
      case "Advanced":
        return "bg-[var(--purple-blue)]/10 text-[var(--purple-blue)]";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case "Security Awareness":
        return <Shield className="w-4 h-4" />;
      case "Access Control":
        return <Lock className="w-4 h-4" />;
      case "Threat Protection":
        return <Shield className="w-4 h-4" />;
      case "Compliance":
        return <Award className="w-4 h-4" />;
      case "Incident Management":
        return <Users className="w-4 h-4" />;
      case "Network Security":
        return <Shield className="w-4 h-4" />;
      case "Device Security":
        return <Shield className="w-4 h-4" />;
      case "Threat Intelligence":
        return <Shield className="w-4 h-4" />;
      case "Cloud Security":
        return <Shield className="w-4 h-4" />;
      default:
        return <Shield className="w-4 h-4" />;
    }
  };

  return (
    <div
      onClick={handleCardClick}
      className="group relative overflow-hidden rounded-2xl bg-white shadow-lg transition-all duration-300 hover:shadow-2xl hover:transform hover:scale-[1.03] cursor-pointer border border-gray-100"
    >
      <div className="absolute -right-12 -top-12 h-40 w-40 bg-gradient-to-br from-[var(--neon-blue)]/30 to-[var(--purple-blue)]/30 rounded-full blur-2xl group-hover:blur-3xl transition-all duration-300"></div>

      {/* Image Container with enhanced gradient */}
      <div className="relative h-48 lg:h-64 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/50 to-transparent z-10"></div>
        <img
          src={course.imageUrl}
          alt={course.title}
          className="h-full w-full object-cover transform transition-transform duration-500 group-hover:scale-110"
          loading="lazy"
          onError={(e) => {
            const target = e.target as HTMLImageElement;
            target.src =
              "https://images.unsplash.com/photo-1563013544-824ae1b704d3?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80";
          }}
        />
        <div className="absolute top-4 left-4 z-20 flex gap-2">
          <span className="px-3 py-1.5 bg-[var(--neon-blue)] text-white text-sm font-medium rounded-full shadow-lg flex items-center gap-1">
            {getCategoryIcon(course.category)}
            {course.category}
          </span>
          {course.isPremium && (
            <span className="px-3 py-1.5 bg-gradient-to-r from-yellow-400 to-orange-500 text-white text-sm font-medium rounded-full shadow-lg flex items-center gap-1">
              <Star className="w-3 h-3" />
              Premium
            </span>
          )}
          {course.isCustom && (
            <span className="px-3 py-1.5 bg-gradient-to-r from-purple-500 to-pink-500 text-white text-sm font-medium rounded-full shadow-lg flex items-center gap-1">
              <Star className="w-3 h-3" />
              Custom
            </span>
          )}
        </div>
      </div>

      {/* Content Container with improved spacing */}
      <div className="p-5 lg:p-6">
        <h2 className="text-xl lg:text-2xl font-bold mb-4 line-clamp-2 bg-gradient-to-r from-[var(--neon-blue)] to-[var(--purple-blue)] bg-clip-text text-transparent hover:from-[var(--purple-blue)] hover:to-[var(--neon-blue)] transition-all duration-300">
          {course.title}
        </h2>

        {/* Difficulty and Duration Section */}
        <div className="flex items-center justify-between mb-4">
          <span
            className={`px-3 py-1 rounded-full text-sm font-medium ${getDifficultyColor(
              course.difficulty
            )}`}
          >
            Skill Level: {course.difficulty}
          </span>
          <div className="flex items-center space-x-2 text-[var(--neon-blue)]">
            <Clock className="w-4 h-4" />
            <span className="text-sm font-medium">Est. {course.duration}</span>
          </div>
        </div>

        {/* Description */}
        <p className="text-gray-600 mb-4 line-clamp-3 text-sm lg:text-base">
          {course.description}
        </p>

        {/* Footer with action buttons */}
        <div className="flex items-center justify-between pt-2 border-t border-gray-100">
          <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
            <button className="px-3 py-1.5 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors">
              Update
            </button>
            <button className="px-3 py-1.5 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors">
              Duplicate
            </button>
            <button className="px-3 py-1.5 text-sm bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors">
              Delete
            </button>
          </div>
          <span className="text-[var(--neon-blue)] font-medium group-hover:text-[var(--purple-blue)] transition-colors duration-300 flex items-center">
            Start Training
            <svg
              className="w-4 h-4 ml-1 transform group-hover:translate-x-1 transition-transform duration-300"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M9 5l7 7-7 7"
              />
            </svg>
          </span>
        </div>
      </div>

      {/* Decorative Elements with subtle animation */}
      <div className="absolute -left-4 bottom-4 w-8 h-8 border-l-2 border-b-2 border-[var(--neon-blue)]/30 group-hover:border-[var(--purple-blue)]/30 transition-colors duration-300"></div>
      <div className="absolute -right-4 top-4 w-8 h-8 border-t-2 border-r-2 border-[var(--neon-blue)]/30 group-hover:border-[var(--purple-blue)]/30 transition-colors duration-300"></div>
    </div>
  );
};

export default ModuleGrid;
