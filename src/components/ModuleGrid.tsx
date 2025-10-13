"use client";

import React from "react";
import { Clock, Shield, Lock, Star, Users, Award } from "lucide-react";

// Container component for grid layout
const ModuleGrid = () => {
  const modules = [
    {
      id: 1,
      title: "Phishing Awareness",
      description:
        "Learn to identify and avoid phishing attacks through interactive scenarios and real-world examples.",
      duration: "15 min",
      difficulty: "Beginner",
      imageUrl:
        "https://images.unsplash.com/photo-1563013544-824ae1b704d3?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
      category: "Security Awareness",
      isPremium: false,
      isCustom: false,
      progress: 0,
    },
    {
      id: 2,
      title: "Password Security",
      description:
        "Master the art of creating and managing strong passwords to protect your digital identity and accounts.",
      duration: "12 min",
      difficulty: "Beginner",
      imageUrl:
        "https://images.unsplash.com/photo-1590736969955-71cc94901144?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
      category: "Access Control",
      isPremium: false,
      isCustom: false,
      progress: 0,
    },
    {
      id: 3,
      title: "Social Engineering",
      description:
        "Understand how attackers manipulate human psychology and learn to defend against these sophisticated tactics.",
      duration: "18 min",
      difficulty: "Intermediate",
      imageUrl:
        "https://images.unsplash.com/photo-1555949963-aa79dcee981c?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
      category: "Security Awareness",
      isPremium: true,
      isCustom: false,
      progress: 0,
    },
    {
      id: 4,
      title: "Ransomware Defense",
      description:
        "Learn how to protect your organization from ransomware attacks and what to do if you become a victim.",
      duration: "20 min",
      difficulty: "Intermediate",
      imageUrl:
        "https://images.unsplash.com/photo-1558494949-ef010cbdcc31?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
      category: "Threat Protection",
      isPremium: false,
      isCustom: false,
      progress: 0,
    },
    {
      id: 5,
      title: "Multi-Factor Authentication",
      description:
        "Discover the importance of MFA and how to implement it effectively across your digital accounts.",
      duration: "10 min",
      difficulty: "Beginner",
      imageUrl:
        "https://images.unsplash.com/photo-1563013544-824ae1b704d3?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
      category: "Access Control",
      isPremium: false,
      isCustom: false,
      progress: 0,
    },
    {
      id: 6,
      title: "Data Privacy & GDPR",
      description:
        "Understand data protection regulations and best practices for handling personal information securely.",
      duration: "25 min",
      difficulty: "Advanced",
      imageUrl:
        "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
      category: "Compliance",
      isPremium: true,
      isCustom: false,
      progress: 0,
    },
    {
      id: 7,
      title: "Incident Response",
      description:
        "Learn the fundamentals of cybersecurity incident response and how to handle security breaches effectively.",
      duration: "30 min",
      difficulty: "Advanced",
      imageUrl:
        "https://images.unsplash.com/photo-1551288049-bebda4e38f71?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
      category: "Incident Management",
      isPremium: false,
      isCustom: true,
      progress: 0,
    },
    {
      id: 8,
      title: "Secure Communication",
      description:
        "Master secure communication practices including encrypted messaging and safe email handling.",
      duration: "14 min",
      difficulty: "Intermediate",
      imageUrl:
        "https://images.unsplash.com/photo-1577563908411-5077b6dc7624?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
      category: "Communication Security",
      isPremium: false,
      isCustom: false,
      progress: 0,
    },
    {
      id: 9,
      title: "Mobile Security",
      description:
        "Protect your mobile devices and learn about mobile-specific security threats and best practices.",
      duration: "16 min",
      difficulty: "Intermediate",
      imageUrl:
        "https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
      category: "Device Security",
      isPremium: false,
      isCustom: false,
      progress: 0,
    },
  ];

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {modules.map((module) => (
          <ModuleCard key={module.id} module={module} />
        ))}
      </div>
    </div>
  );
};

const ModuleCard = ({ module }) => {
  const getDifficultyColor = (difficulty) => {
    switch (difficulty) {
      case "Beginner":
        return "bg-green-100 text-green-800";
      case "Intermediate":
        return "bg-yellow-100 text-yellow-800";
      case "Advanced":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getCategoryIcon = (category) => {
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
      case "Communication Security":
        return <Shield className="w-4 h-4" />;
      case "Device Security":
        return <Shield className="w-4 h-4" />;
      default:
        return <Shield className="w-4 h-4" />;
    }
  };

  return (
    <div className="group relative overflow-hidden rounded-2xl bg-white shadow-lg transition-all duration-300 hover:shadow-2xl hover:transform hover:scale-[1.03] cursor-pointer border border-gray-100">
      <div className="absolute -right-12 -top-12 h-40 w-40 bg-gradient-to-br from-[var(--neon-blue)]/30 to-[var(--purple-blue)]/30 rounded-full blur-2xl group-hover:blur-3xl transition-all duration-300"></div>

      {/* Image Container with enhanced gradient */}
      <div className="relative h-48 lg:h-64 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/50 to-transparent z-10"></div>
        <img
          src={module.imageUrl}
          alt={module.title}
          className="h-full w-full object-cover transform transition-transform duration-500 group-hover:scale-110"
          loading="lazy"
          onError={(e) => {
            e.target.src =
              "https://images.unsplash.com/photo-1563013544-824ae1b704d3?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80";
          }}
        />
        <div className="absolute top-4 left-4 z-20 flex gap-2">
          <span className="px-3 py-1.5 bg-[var(--neon-blue)] text-white text-sm font-medium rounded-full shadow-lg flex items-center gap-1">
            {getCategoryIcon(module.category)}
            {module.category}
          </span>
          {module.isPremium && (
            <span className="px-3 py-1.5 bg-gradient-to-r from-yellow-400 to-orange-500 text-white text-sm font-medium rounded-full shadow-lg flex items-center gap-1">
              <Star className="w-3 h-3" />
              Premium
            </span>
          )}
          {module.isCustom && (
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
          {module.title}
        </h2>

        {/* Difficulty and Duration Section */}
        <div className="flex items-center justify-between mb-4">
          <span
            className={`px-3 py-1 rounded-full text-sm font-medium ${getDifficultyColor(
              module.difficulty
            )}`}
          >
            Skill Level: {module.difficulty}
          </span>
          <div className="flex items-center space-x-2 text-[var(--neon-blue)]">
            <Clock className="w-4 h-4" />
            <span className="text-sm font-medium">Est. {module.duration}</span>
          </div>
        </div>

        {/* Description */}
        <p className="text-gray-600 mb-4 line-clamp-3 text-sm lg:text-base">
          {module.description}
        </p>

        {/* Footer with action buttons */}
        <div className="flex items-center justify-between pt-2 border-t border-gray-100">
          <div className="flex gap-2">
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
