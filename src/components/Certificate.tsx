"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { useTranslation } from "@/hooks/useTranslation";

interface CertificateProps {
  userName: string;
  courseTitle: string;
  certificateNumber: string;
  issuedDate: string;
  description?: string;
  className?: string;
  courseLevel?: string;
  courseCreator?: string;
  language?: "en" | "ur";
}

export default function Certificate({
  userName,
  courseTitle,
  certificateNumber,
  issuedDate,
  description,
  className = "",
  courseLevel,
  courseCreator,
  language: propLanguage,
}: CertificateProps) {
  const { language: contextLanguage } = useLanguage();
  const { t } = useTranslation();
  const language = propLanguage || contextLanguage;
  
  const [translatedDescription, setTranslatedDescription] = useState<string | undefined>(description);
  const [translatedCourseTitle, setTranslatedCourseTitle] = useState<string>(courseTitle);
  const [translationReady, setTranslationReady] = useState(false);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  // Translate dynamic content when language changes
  useEffect(() => {
    if (language === "en") {
      setTranslatedDescription(description);
      setTranslatedCourseTitle(courseTitle);
      setTranslationReady(true);
      return;
    }

    const translateContent = async () => {
      try {
        setTranslationReady(false);
        const { translateService } = await import("@/services/translateService");
        
        const textsToTranslate: string[] = [];
        if (description) textsToTranslate.push(description);
        if (courseTitle) textsToTranslate.push(courseTitle);
        
        if (textsToTranslate.length > 0) {
          const translatedTexts = await translateService.translateBatch(textsToTranslate);
          
          if (description) {
            const descIndex = textsToTranslate.indexOf(description);
            setTranslatedDescription(descIndex >= 0 ? translatedTexts[descIndex] : description);
          } else {
            setTranslatedDescription(undefined);
          }
          
          if (courseTitle) {
            const titleIndex = textsToTranslate.indexOf(courseTitle);
            setTranslatedCourseTitle(titleIndex >= 0 ? translatedTexts[titleIndex] : courseTitle);
          }
        }
        
        setTranslationReady(true);
      } catch (error) {
        console.error("Error translating certificate content:", error);
        setTranslatedDescription(description);
        setTranslatedCourseTitle(courseTitle);
        setTranslationReady(true);
      }
    };

    translateContent();
  }, [language, description, courseTitle]);

  // Use translated content or fallback to original
  const displayDescription = useMemo(() => {
    return language === "ur" && translationReady && translatedDescription !== undefined
      ? translatedDescription
      : description;
  }, [language, translationReady, translatedDescription, description]);

  const displayCourseTitle = useMemo(() => {
    return language === "ur" && translationReady ? translatedCourseTitle : courseTitle;
  }, [language, translationReady, translatedCourseTitle, courseTitle]);

  return (
    <div
      className={`relative w-full max-w-4xl mx-auto bg-gradient-to-br from-blue-50 via-sky-100 to-blue-50 rounded-2xl overflow-hidden shadow-2xl border-2 border-blue-200 ${className}`}
      style={{
        background: "linear-gradient(135deg, #eff6ff 0%, #e0f2fe 50%, #eff6ff 100%)",
      }}
    >
      {/* Hexagonal grid pattern overlay */}
      <div className="absolute inset-0 opacity-15">
        <div
          className="absolute top-0 left-0 w-64 h-64"
          style={{
            backgroundImage: `
              repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(37, 99, 235, 0.2) 2px, rgba(37, 99, 235, 0.2) 4px),
              repeating-linear-gradient(60deg, transparent, transparent 2px, rgba(37, 99, 235, 0.2) 2px, rgba(37, 99, 235, 0.2) 4px),
              repeating-linear-gradient(120deg, transparent, transparent 2px, rgba(37, 99, 235, 0.2) 2px, rgba(37, 99, 235, 0.2) 4px)
            `,
            clipPath: "polygon(0 0, 100% 0, 100% 70%, 0 100%)",
          }}
        />
        <div
          className="absolute bottom-0 right-0 w-64 h-64"
          style={{
            backgroundImage: `
              repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(37, 99, 235, 0.2) 2px, rgba(37, 99, 235, 0.2) 4px),
              repeating-linear-gradient(60deg, transparent, transparent 2px, rgba(37, 99, 235, 0.2) 2px, rgba(37, 99, 235, 0.2) 4px),
              repeating-linear-gradient(120deg, transparent, transparent 2px, rgba(37, 99, 235, 0.2) 2px, rgba(37, 99, 235, 0.2) 4px)
            `,
            clipPath: "polygon(30% 0, 100% 0, 100% 100%, 0 100%)",
          }}
        />
      </div>

      {/* Decorative top line */}
      <div className="absolute top-8 left-1/2 transform -translate-x-1/2 w-3/4 h-1 bg-gradient-to-r from-transparent via-blue-500 to-transparent opacity-70" />

      {/* Main content */}
      <div className="relative z-10 px-12 py-16 text-center">
        {/* Certificate Header */}
        <h1 className="text-6xl font-bold text-blue-900 mb-4 tracking-wider">
          {language === "ur" ? t("CERTIFICATE") : "CERTIFICATE"}
        </h1>
        <h2 className="text-2xl font-bold text-blue-600 mb-12 tracking-wide">
          {language === "ur" ? t("OF ACHIEVEMENT") : "OF ACHIEVEMENT"}
        </h2>

        {/* Recipient Name */}
        <div className="mb-8">
          <h3 className="text-5xl font-bold text-blue-900 mb-2 tracking-wide">
            {userName.toUpperCase()}
          </h3>
        </div>

        {/* Separator line */}
        <div className="w-3/4 mx-auto h-px bg-blue-500 mb-8" />

        {/* Description */}
        <p className="text-lg text-gray-700 mb-12 max-w-2xl mx-auto leading-relaxed">
          {displayDescription ||
            `Thank you for participating in the competition and winning the best award, which took place on ${formatDate(issuedDate)}.`}
        </p>

        {/* Bottom separator */}
        <div className="w-3/4 mx-auto h-px bg-blue-500 mb-12" />

        {/* Course details section */}
        <div className="flex items-center justify-between max-w-3xl mx-auto">
          {/* Left - Course Level */}
          <div className="flex-1 text-center">
            <p className="text-gray-800 text-sm font-medium">
              {courseLevel 
                ? `${courseLevel.charAt(0).toUpperCase() + courseLevel.slice(1)} ${language === "ur" ? t("Level") : "Level"}`
                : language === "ur" ? t("Course Level") : "Course Level"}
            </p>
            <div className="h-16 border-b-2 border-blue-500 w-48 mx-auto"></div>
          </div>

          {/* Center certificate number */}
          <div className="flex-shrink-0">
            <div className="w-20 h-20 rounded-full border-2 border-blue-500 flex items-center justify-center bg-blue-100">
              <span className="text-blue-700 text-xs font-bold transform rotate-90 whitespace-nowrap">
                01
              </span>
            </div>
          </div>

          {/* Right - Course Creator */}
          <div className="flex-1 text-center">
            <p className="text-blue-600 text-xs mb-0">{language === "ur" ? t("Course Creator") : "Course Creator"}</p>
            <p className="text-gray-800 text-sm font-medium">
              {courseCreator || "N/A"}
            </p>
            <div className="h-16 border-b-2 border-blue-500 w-48 mx-auto"></div>
          </div>
        </div>

        {/* Certificate number */}
        <div className="mt-12 pt-8 border-t border-blue-300">
          <p className="text-sm text-blue-700 font-mono">
            {language === "ur" ? t("Certificate No:") : "Certificate No:"} {certificateNumber}
          </p>
          <p className="text-xs text-blue-600 mt-2">
            {language === "ur" ? t("Issued on") : "Issued on"} {formatDate(issuedDate)}
          </p>
        </div>
      </div>

      {/* Decorative bottom line */}
      <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 w-3/4 h-1 bg-gradient-to-r from-transparent via-blue-500 to-transparent opacity-70" />
    </div>
  );
}
