"use client";

import { useState, useEffect, useMemo } from "react";
import { ArrowRight, Shield, Lock, Users } from "lucide-react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import NetworkBackground from "./NetworkBackground";
import { useTranslation } from "@/hooks/useTranslation";
import { Course } from "@/lib/coursesData";

const ModuleCard = ({
  module,
  featured,
  t,
}: {
  module: {
    title: string;
    description: string;
    image?: string;
  } | null | undefined;
  featured: boolean;
  t: (text: string) => string;
}) => {
  if (!module) {
    return null;
  }

  return (
    <div className="relative group bg-white rounded-2xl shadow-lg p-6 transition-all duration-300 hover:shadow-xl">
      {featured && (
        <div className="absolute -top-3 -right-3 bg-red-500 text-white px-4 py-1 rounded-full text-sm animate-pulse">
          {t("Featured")}
        </div>
      )}
      <div className="overflow-hidden rounded-lg mb-4">
        <img
          src={module.image || "https://images.unsplash.com/photo-1563013544-824ae1b704d3?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80"}
          alt={module.title || "Course"}
          className="w-full h-64 object-cover transform transition-transform duration-300 group-hover:scale-110"
          loading="lazy"
        />
      </div>
      <h3 className="text-xl font-semibold text-gray-800 mb-2">
        {module.title || ""}
      </h3>
      <p className="text-gray-600 mb-4">{module.description || ""}</p>
      <div className="flex items-center justify-end">
        <button className="flex items-center space-x-2 bg-[var(--neon-blue)] text-white px-4 py-2 rounded-lg hover:bg-[var(--medium-blue)] transition-colors">
          <Shield />
          <span>{t("Start Training")}</span>
        </button>
      </div>
    </div>
  );
};

interface HeroSectionProps {
  courses?: Course[];
  translationReady?: boolean;
}

export default function HeroSection({ courses = [], translationReady = true }: HeroSectionProps) {
  const { t, preTranslate, language } = useTranslation();
  const [currentSlide, setCurrentSlide] = useState(0);
  const [translatedModules, setTranslatedModules] = useState<Array<{
    title: string;
    description: string;
    image?: string;
  }>>([]);

  console.log("[HeroSection] Component render:", {
    coursesCount: courses.length,
    translationReady,
    language,
    firstCourse: courses[0],
  });

  // Convert courses to carousel modules format
  const modules = useMemo(() => {
    console.log("[HeroSection] useMemo triggered, courses:", courses.length);
    
    if (!courses || courses.length === 0) {
      console.log("[HeroSection] No courses, using fallback modules");
      // Fallback to default modules if no courses
      return [
        {
          title: "Phishing Awareness",
          description:
            "Learn to identify and avoid phishing attacks through interactive scenarios and real-world examples.",
          image:
            "https://images.unsplash.com/photo-1563013544-824ae1b704d3?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
        },
        {
          title: "Password Security",
          description:
            "Master the art of creating and managing strong passwords to protect your digital identity.",
          image:
            "https://images.unsplash.com/photo-1633265486064-086b219458ec?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
        },
        {
          title: "Social Engineering",
          description:
            "Understand how attackers manipulate human psychology and learn to defend against these tactics.",
          image:
            "https://images.unsplash.com/photo-1555949963-aa79dcee981c?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
        },
      ];
    }

    // Take first 3 courses for carousel
    // Filter out invalid courses and ensure proper string conversion
    const validCourses = courses.filter((course) => {
      const isValid = course && course.courseTitle && typeof course.courseTitle === "string";
      if (!isValid) {
        console.warn("[HeroSection] Invalid course filtered out:", course);
      }
      return isValid;
    });
    
    console.log("[HeroSection] Valid courses after filtering:", validCourses.length, "out of", courses.length);
    
    const mappedModules = validCourses
      .slice(0, 3)
      .map((course, index) => {
        const title = String(course.courseTitle || "").trim();
        const description = String(course.description || "").trim();
        const module = {
          title,
          description,
          image: undefined, // Courses don't have images in the schema, but we can add default
        };
        console.log(`[HeroSection] Module ${index}:`, {
          ...module,
          courseTitleRaw: course.courseTitle,
          descriptionRaw: course.description,
          titleLength: title.length,
          descLength: description.length,
        });
        return module;
      });
    
    console.log("[HeroSection] Final modules:", mappedModules);
    return mappedModules;
  }, [courses]);

  // Use modules directly since they're already translated from parent component
  // Only set translatedModules when modules change
  useEffect(() => {
    console.log("[HeroSection] useEffect for translatedModules:", {
      modulesCount: modules.length,
      language,
      translationReady,
      currentModules: modules,
    });

    // Only set translated modules if we have modules and (language is English or translation is ready)
    if (modules.length > 0 && (language === "en" || translationReady)) {
      console.log("[HeroSection] Setting translatedModules:", modules);
      setTranslatedModules(modules);
    } else if (language === "en") {
      // For English, always show modules immediately
      console.log("[HeroSection] Setting modules for English:", modules);
      setTranslatedModules(modules);
    } else {
      console.log("[HeroSection] Not setting modules yet - waiting for translation");
    }
    // For Urdu, wait until translationReady is true
  }, [modules, language, translationReady]);

  const displayModules = translatedModules.length > 0 ? translatedModules : modules;

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % displayModules.length);
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + displayModules.length) % displayModules.length);
  };

  useEffect(() => {
    if (displayModules.length === 0) return;
    const timer = setInterval(nextSlide, 6000);
    return () => clearInterval(timer);
  }, [displayModules.length]);

  return (
    <div className="bg-gradient-to-br from-[var(--navy-blue)] via-[var(--navy-blue-light)] to-[var(--navy-blue)] py-16 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Network Animation Background */}
      <NetworkBackground />

      <div className="max-w-7xl mx-auto grid md:grid-cols-2 gap-12 items-center relative z-10">
        <div className="space-y-8 text-center md:text-left">
          <h1 className="text-4xl md:text-5xl font-serif font-bold text-[var(--dashboard-text-primary)] leading-tight">
            {t("Master Cybersecurity, Protect Your Digital World.")}
          </h1>
          <p className="text-xl text-[var(--dashboard-text-secondary)] leading-relaxed">
            {t("Interactive training modules designed to enhance your cybersecurity awareness. Learn through engaging scenarios and real-world examples.")}
          </p>
          <button className="group inline-flex items-center space-x-3 bg-[var(--neon-blue)] text-white px-8 py-4 rounded-full text-lg font-medium hover:bg-[var(--medium-blue)] transform hover:scale-105 transition-all duration-300">
            <span>{t("Explore All Modules")}</span>
            <ArrowRight className="group-hover:translate-x-2 transition-transform duration-300" />
          </button>
        </div>

        <div className="relative perspective-1000">
          <div className="overflow-hidden rounded-2xl transition-all duration-700 transform hover:scale-105">
            <div className="relative">
              {(translatedModules.length > 0 || modules.length > 0) && (
                <>
                  <div className="transition-opacity duration-500 ease-in-out">
                    {(() => {
                      const displayModules = translatedModules.length > 0 ? translatedModules : modules;
                      const currentModule = displayModules[currentSlide];
                      if (!currentModule) return null;
                      return (
                        <ModuleCard
                          module={currentModule}
                          featured={false}
                          t={t}
                        />
                      );
                    })()}
                  </div>

                  <div className="absolute -bottom-6 left-1/2 transform -translate-x-1/2 flex space-x-2">
                    {(translatedModules.length > 0 ? translatedModules : modules).map((_, index) => (
                      <button
                        key={index}
                        className={`w-2 h-2 rounded-full transition-all duration-300 ${
                          currentSlide === index
                            ? "bg-[var(--neon-blue)] w-4"
                            : "bg-gray-300"
                        }`}
                        onClick={() => setCurrentSlide(index)}
                      />
                    ))}
                  </div>

                  <div className="absolute top-1/2 -translate-y-1/2 flex justify-between w-full px-4">
                    <button
                      onClick={prevSlide}
                      className="bg-white/80 backdrop-blur-sm p-3 rounded-full shadow-lg hover:bg-white hover:scale-110 transition-all duration-300 transform"
                      aria-label="Previous module"
                    >
                      <ChevronLeft className="w-6 h-6 text-gray-800" />
                    </button>
                    <button
                      onClick={nextSlide}
                      className="bg-white/80 backdrop-blur-sm p-3 rounded-full shadow-lg hover:bg-white hover:scale-110 transition-all duration-300 transform"
                      aria-label="Next module"
                    >
                      <ChevronRight className="w-6 h-6 text-gray-800" />
                    </button>
                  </div>

                  <div className="absolute top-1/2 -translate-y-1/2 w-full pointer-events-none">
                    {(() => {
                      const prevIndex = (currentSlide - 1 + displayModules.length) % displayModules.length;
                      const nextIndex = (currentSlide + 1) % displayModules.length;
                      const prevModule = displayModules[prevIndex];
                      const nextModule = displayModules[nextIndex];
                      
                      return (
                        <>
                          {prevModule && (
                            <div className="absolute -left-4 opacity-20 transform -translate-x-full scale-90 blur-sm">
                              <ModuleCard
                                module={prevModule}
                                featured={false}
                                t={t}
                              />
                            </div>
                          )}
                          {nextModule && (
                            <div className="absolute -right-4 opacity-20 transform translate-x-full scale-90 blur-sm">
                              <ModuleCard
                                module={nextModule}
                                featured={false}
                                t={t}
                              />
                            </div>
                          )}
                        </>
                      );
                    })()}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
