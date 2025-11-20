"use client";

import { useState } from "react";
import { ChevronDown, ChevronRight, BookOpen } from "lucide-react";

interface Submodule {
  id: string;
  title: string;
}

interface Module {
  id: string;
  title: string;
  submodules: Submodule[];
}

export default function TrainingModuleDetailPage() {
  const [expandedModules, setExpandedModules] = useState<Set<string>>(new Set());

  // Hardcoded modules data
  const modules: Module[] = [
    {
      id: "1",
      title: "Introduction to Cybersecurity",
      submodules: [
        { id: "1.1", title: "What is Cybersecurity?" },
        { id: "1.2", title: "History of Cyber Threats" },
        { id: "1.3", title: "Common Attack Vectors" },
        { id: "1.4", title: "Cybersecurity Fundamentals" },
      ],
    },
    {
      id: "2",
      title: "Network Security",
      submodules: [
        { id: "2.1", title: "Network Architecture" },
        { id: "2.2", title: "Firewalls and IDS/IPS" },
        { id: "2.3", title: "VPN and Remote Access" },
        { id: "2.4", title: "Wireless Security" },
      ],
    },
    {
      id: "3",
      title: "Data Protection",
      submodules: [
        { id: "3.1", title: "Encryption Basics" },
        { id: "3.2", title: "Data Classification" },
        { id: "3.3", title: "Backup and Recovery" },
        { id: "3.4", title: "Data Loss Prevention" },
      ],
    },
    {
      id: "4",
      title: "Identity and Access Management",
      submodules: [
        { id: "4.1", title: "Authentication Methods" },
        { id: "4.2", title: "Authorization Models" },
        { id: "4.3", title: "Multi-Factor Authentication" },
        { id: "4.4", title: "Single Sign-On (SSO)" },
      ],
    },
    {
      id: "5",
      title: "Incident Response",
      submodules: [
        { id: "5.1", title: "Incident Detection" },
        { id: "5.2", title: "Response Procedures" },
        { id: "5.3", title: "Forensics Basics" },
        { id: "5.4", title: "Post-Incident Review" },
      ],
    },
  ];

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

  return (
    <div className="min-h-screen bg-gradient-to-br from-[var(--navy-blue)] via-[var(--navy-blue-light)] to-[var(--navy-blue)]">
      <div className="bg-white/95 backdrop-blur-sm rounded-t-3xl mt-8 min-h-screen ml-4 mr-4">
        <div className="flex h-[calc(100vh-4rem)]">
          {/* Left Sidebar - Modules */}
          <div className="w-80 border-r border-gray-200 bg-gray-50 overflow-y-auto">
            <div className="p-4">
              <div className="flex items-center gap-2 mb-6">
                <BookOpen className="w-5 h-5 text-[var(--neon-blue)]" />
                <h2 className="text-lg font-semibold text-gray-900">Modules</h2>
              </div>
              
              <div className="space-y-1">
                {modules.map((module) => {
                  const isExpanded = expandedModules.has(module.id);
                  return (
                    <div key={module.id} className="border border-gray-200 rounded-lg overflow-hidden">
                      {/* Module Header */}
                      <button
                        onClick={() => toggleModule(module.id)}
                        className="w-full px-4 py-3 bg-white hover:bg-gray-50 transition-colors flex items-center justify-between text-left"
                      >
                        <div className="flex items-center gap-2 flex-1">
                          {isExpanded ? (
                            <ChevronDown className="w-4 h-4 text-[var(--neon-blue)] flex-shrink-0" />
                          ) : (
                            <ChevronRight className="w-4 h-4 text-gray-400 flex-shrink-0" />
                          )}
                          <span className="text-sm font-medium text-gray-900">
                            Module {module.id}: {module.title}
                          </span>
                        </div>
                      </button>

                      {/* Submodules */}
                      {isExpanded && (
                        <div className="bg-gray-50 border-t border-gray-200">
                          {module.submodules.map((submodule) => (
                            <button
                              key={submodule.id}
                              className="w-full px-4 py-2.5 pl-12 text-left text-sm text-gray-700 hover:bg-gray-100 hover:text-[var(--neon-blue)] transition-colors border-b border-gray-100 last:border-b-0"
                            >
                              {submodule.title}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Main Content Area */}
          <div className="flex-1 overflow-y-auto">
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
              <h1 className="text-3xl font-bold text-gray-900">hi</h1>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

