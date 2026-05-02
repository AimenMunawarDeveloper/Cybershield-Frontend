"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import { useAuth } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { ApiClient } from "@/lib/api";
import Certificate from "@/components/Certificate";
import { Award, Download, ArrowLeft, Loader2, Calendar, User, FileText, X } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { useTranslation } from "@/hooks/useTranslation";

interface CertificateData {
  _id: string;
  userName: string;
  userEmail: string;
  courseTitle: string;
  courseDescription?: string;
  certificateNumber: string;
  issuedDate: string;
  completionDate: string;
  course?: {
    courseTitle: string;
    description?: string;
    level?: string;
    createdByName?: string;
  };
}

export default function CertificatesPage() {
  const { getToken } = useAuth();
  const router = useRouter();
  const { language } = useLanguage();
  const { t, preTranslate, isTranslating } = useTranslation();
  const [certificates, setCertificates] = useState<CertificateData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedCertificate, setSelectedCertificate] = useState<CertificateData | null>(null);
  const [translationReady, setTranslationReady] = useState(false);
  const [translatedCertificates, setTranslatedCertificates] = useState<CertificateData[]>([]);

  useEffect(() => {
    if (!getToken) return;

    const fetchCertificates = async () => {
      try {
        setLoading(true);
        setError(null);
        const api = new ApiClient(getToken);
        const data = await api.getUserCertificates();
        setCertificates(data.certificates || []);
      } catch (err) {
        console.error("Failed to fetch certificates:", err);
        setError(err instanceof Error ? err.message : "Failed to load certificates");
      } finally {
        setLoading(false);
      }
    };

    fetchCertificates();
  }, [getToken]);

  // Pre-translate static strings when language changes (performance optimization)
  useEffect(() => {
    const preTranslatePageContent = async () => {
      if (language === "en") {
        setTranslationReady(true);
        return;
      }

      setTranslationReady(false);

      // Collect all static strings on the page for batch translation
      const staticStrings = [
        // Header
        "Back to Dashboard",
        "My Certificates",
        "certificate",
        "certificates",
        "earned",
        
        // Empty state
        "No Certificates Yet",
        "Complete courses to earn certificates and showcase your achievements.",
        "Browse Courses",
        
        // Certificate list
        "View",
        "Download",
        
        // Modal
        "Certificate Details",
        "Close",
        "Download Certificate",
        
        // Error states
        "Loading certificates...",
        "Go to Dashboard",
        
        // Certificate text (for download)
        "CERTIFICATE",
        "OF ACHIEVEMENT",
        "Course Level",
        "Level",
        "Course Creator",
        "Certificate No:",
        "Issued on",
      ];

      try {
        await preTranslate(staticStrings);
        setTranslationReady(true);
      } catch (error) {
        console.error("Error pre-translating page content:", error);
        setTranslationReady(true); // Still allow page to render
      }
    };

    preTranslatePageContent();
  }, [language, preTranslate]);

  // Translate dynamic certificate content when language or certificates change
  useEffect(() => {
    if (language === "en" || certificates.length === 0 || !translationReady) {
      setTranslatedCertificates([]);
      return;
    }

    const translateCertificates = async () => {
      try {
        const textsToTranslate: string[] = [];
        const textMap: Array<{ type: string; certIndex: number; field?: string }> = [];

        certificates.forEach((cert, index) => {
          if (cert.courseTitle) {
            textsToTranslate.push(cert.courseTitle);
            textMap.push({ type: "courseTitle", certIndex: index });
          }
          if (cert.courseDescription) {
            textsToTranslate.push(cert.courseDescription);
            textMap.push({ type: "courseDescription", certIndex: index });
          }
          if (cert.course?.description) {
            textsToTranslate.push(cert.course.description);
            textMap.push({ type: "courseDesc", certIndex: index });
          }
        });

        if (textsToTranslate.length === 0) {
          setTranslatedCertificates([]);
          return;
        }

        // Batch translate all texts
        const { translateService } = await import("@/services/translateService");
        const translatedTexts = await translateService.translateBatch(textsToTranslate);

        // Reconstruct certificates with translated content
        const translated = certificates.map((cert, index) => {
          const titleIndex = textMap.findIndex(m => m.type === "courseTitle" && m.certIndex === index);
          const descIndex = textMap.findIndex(m => m.type === "courseDescription" && m.certIndex === index);
          const courseDescIndex = textMap.findIndex(m => m.type === "courseDesc" && m.certIndex === index);

          return {
            ...cert,
            courseTitle: titleIndex >= 0 
              ? translatedTexts[textsToTranslate.indexOf(cert.courseTitle)]
              : cert.courseTitle,
            courseDescription: descIndex >= 0
              ? translatedTexts[textsToTranslate.indexOf(cert.courseDescription || "")]
              : cert.courseDescription,
            course: cert.course ? {
              ...cert.course,
              description: courseDescIndex >= 0
                ? translatedTexts[textsToTranslate.indexOf(cert.course.description || "")]
                : cert.course.description,
            } : cert.course,
          };
        });

        setTranslatedCertificates(translated);
      } catch (error) {
        console.error("Error translating certificates:", error);
        setTranslatedCertificates([]);
      }
    };

    translateCertificates();
  }, [certificates, language, translationReady]);

  // Use translated certificates or fallback to original
  const displayCertificates = useMemo(() => {
    return language === "ur" && translatedCertificates.length > 0 ? translatedCertificates : certificates;
  }, [translatedCertificates, certificates, language]);

  const handleDownload = async (certificate: CertificateData) => {
    try {
      const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleDateString("en-US", {
          year: "numeric",
          month: "long",
          day: "numeric",
        });
      };

      // Get translated text for certificate
      const getTranslatedText = async (text: string): Promise<string> => {
        if (language === "en") return text;
        try {
          const { translateService } = await import("@/services/translateService");
          return await translateService.translateToUrdu(text);
        } catch (error) {
          console.error("Error translating text:", error);
          return text;
        }
      };

      // Use translated certificate if available
      const certToUse = displayCertificates.find(c => c._id === certificate._id) || certificate;

      const courseLevel = certToUse.course?.level || "";
      const courseCreator = certToUse.course?.createdByName || t("Course Creator");
      const levelText = courseLevel 
        ? `${courseLevel.charAt(0).toUpperCase() + courseLevel.slice(1)} ${await getTranslatedText("Level")}`
        : await getTranslatedText(t("Course Level"));
      
      // Translate certificate text
      const certificateTitle = await getTranslatedText("CERTIFICATE");
      const achievementText = await getTranslatedText("OF ACHIEVEMENT");
      const courseCreatorLabel = await getTranslatedText(t("Course Creator"));
      const certificateNoLabel = await getTranslatedText(t("Certificate No:"));
      const issuedOnLabel = await getTranslatedText(t("Issued on"));
      
      // Translate description and course title
      // Use translated content if available, otherwise translate on the fly
      const courseTitleToUse = language === "ur" && certToUse.courseTitle !== certificate.courseTitle
        ? certToUse.courseTitle
        : language === "ur" 
          ? await getTranslatedText(certificate.courseTitle)
          : certificate.courseTitle;
      
      // Always use the format: "Successfully completed the course xyz on xyz"
      const descriptionBase = `Successfully completed the course "${courseTitleToUse}" on ${formatDate(certificate.completionDate)}.`;
      const translatedDescription = language === "ur"
        ? await getTranslatedText(descriptionBase)
        : descriptionBase;

      // Create a canvas element
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        throw new Error('Canvas context not available');
      }

      // Set canvas size (landscape A4 equivalent at 300 DPI)
      // Using aspect ratio similar to max-w-4xl (896px) with padding
      const width = 3508; // A4 landscape width at 300 DPI
      const height = 2480; // A4 landscape height at 300 DPI
      canvas.width = width;
      canvas.height = height;

      // Draw background gradient (matching Certificate component)
      const gradient = ctx.createLinearGradient(0, 0, width, height);
      gradient.addColorStop(0, '#eff6ff'); // blue-50
      gradient.addColorStop(0.5, '#e0f2fe'); // sky-100
      gradient.addColorStop(1, '#eff6ff'); // blue-50
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, width, height);

      // Draw subtle hexagonal pattern overlay (simplified)
      ctx.save();
      ctx.globalAlpha = 0.15;
      ctx.strokeStyle = 'rgba(37, 99, 235, 0.2)'; // blue-600 with opacity
      ctx.lineWidth = 2;
      // Draw simplified grid pattern
      for (let i = 0; i < width; i += 40) {
        ctx.beginPath();
        ctx.moveTo(i, 0);
        ctx.lineTo(i, height);
        ctx.stroke();
      }
      for (let i = 0; i < height; i += 40) {
        ctx.beginPath();
        ctx.moveTo(0, i);
        ctx.lineTo(width, i);
        ctx.stroke();
      }
      ctx.restore();

      // Draw border (border-2 border-blue-200, rounded-2xl)
      const borderWidth = 8; // border-2 equivalent
      const borderRadius = 32; // rounded-2xl equivalent
      ctx.strokeStyle = '#bfdbfe'; // blue-200
      ctx.lineWidth = borderWidth;
      roundRect(ctx, borderWidth/2, borderWidth/2, width - borderWidth, height - borderWidth, borderRadius);
      ctx.stroke();

      // Draw decorative top line (matching component)
      const topLineGradient = ctx.createLinearGradient(width * 0.125, 0, width * 0.875, 0);
      topLineGradient.addColorStop(0, 'transparent');
      topLineGradient.addColorStop(0.5, 'rgba(59, 130, 246, 0.7)'); // blue-500 with opacity
      topLineGradient.addColorStop(1, 'transparent');
      ctx.fillStyle = topLineGradient;
      ctx.fillRect(width * 0.125, 200, width * 0.75, 4);

      // Set text styles
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';

      // Draw "CERTIFICATE" title (text-6xl font-bold text-blue-900)
      ctx.fillStyle = '#1e3a8a'; // blue-900
      ctx.font = 'bold 240px Arial, sans-serif'; // text-6xl equivalent
      ctx.fillText(certificateTitle, width / 2, 450);

      // Draw "OF ACHIEVEMENT" subtitle (text-2xl font-bold text-blue-600)
      ctx.fillStyle = '#2563eb'; // blue-600
      ctx.font = 'bold 96px Arial, sans-serif'; // text-2xl equivalent
      ctx.fillText(achievementText, width / 2, 600);

      // Draw recipient name (text-5xl font-bold text-blue-900)
      ctx.fillStyle = '#1e3a8a'; // blue-900
      ctx.font = 'bold 180px Arial, sans-serif'; // text-5xl equivalent
      const userName = certificate.userName.toUpperCase();
      ctx.fillText(userName, width / 2, 950);

      // Draw separator line (w-3/4 mx-auto h-px bg-blue-500)
      ctx.strokeStyle = '#3b82f6'; // blue-500
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(width * 0.125, 1150);
      ctx.lineTo(width * 0.875, 1150);
      ctx.stroke();

      // Draw description (text-lg text-gray-700)
      ctx.fillStyle = '#374151'; // gray-700
      ctx.font = '54px Arial, sans-serif'; // text-lg equivalent
      const maxWidth = width * 0.7;
      const lines = wrapText(ctx, translatedDescription, maxWidth);
      let yPos = 1350;
      lines.forEach((line: string) => {
        ctx.fillText(line, width / 2, yPos);
        yPos += 70;
      });

      // Draw bottom separator
      ctx.beginPath();
      ctx.moveTo(width * 0.125, yPos + 100);
      ctx.lineTo(width * 0.875, yPos + 100);
      ctx.stroke();

      // Draw course details section
      const detailY = yPos + 350;
      
      // Left - Course Level (text-gray-800 text-sm font-medium)
      ctx.fillStyle = '#1f2937'; // gray-800
      ctx.font = '42px Arial, sans-serif'; // text-sm equivalent
      ctx.fillText(levelText, width * 0.25, detailY);
      ctx.strokeStyle = '#3b82f6'; // blue-500
      ctx.lineWidth = 3; // border-b-2
      ctx.beginPath();
      ctx.moveTo(width * 0.25 - 450, detailY + 60);
      ctx.lineTo(width * 0.25 + 450, detailY + 60);
      ctx.stroke();

      // Center badge (w-20 h-20 rounded-full border-2 border-blue-500 bg-blue-100)
      ctx.fillStyle = '#dbeafe'; // blue-100
      ctx.beginPath();
      ctx.arc(width / 2, detailY, 120, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#3b82f6'; // blue-500
      ctx.lineWidth = 4; // border-2
      ctx.stroke();
      ctx.save();
      ctx.translate(width / 2, detailY);
      ctx.rotate(Math.PI / 2);
      ctx.fillStyle = '#1e40af'; // blue-700
      ctx.font = 'bold 48px Arial, sans-serif'; // text-xs equivalent
      ctx.fillText('01', 0, 0);
      ctx.restore();

      // Right - Course Creator
      // Label (text-blue-600 text-xs)
      ctx.fillStyle = '#2563eb'; // blue-600
      ctx.font = '36px Arial, sans-serif'; // text-xs equivalent
      ctx.fillText(courseCreatorLabel, width * 0.75, detailY - 40);
      // Value (text-gray-800 text-sm font-medium)
      ctx.fillStyle = '#1f2937'; // gray-800
      ctx.font = '42px Arial, sans-serif'; // text-sm equivalent
      ctx.fillText(courseCreator || 'N/A', width * 0.75, detailY + 20);
      ctx.strokeStyle = '#3b82f6'; // blue-500
      ctx.lineWidth = 3; // border-b-2
      ctx.beginPath();
      ctx.moveTo(width * 0.75 - 450, detailY + 60);
      ctx.lineTo(width * 0.75 + 450, detailY + 60);
      ctx.stroke();

      // Draw certificate number and date (matching component)
      const footerY = detailY + 300;
      ctx.strokeStyle = '#93c5fd'; // blue-300
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(width * 0.125, footerY);
      ctx.lineTo(width * 0.875, footerY);
      ctx.stroke();

      // Certificate No (text-sm text-blue-700 font-mono)
      ctx.fillStyle = '#1e40af'; // blue-700
      ctx.font = '42px monospace'; // text-sm equivalent
      ctx.fillText(`${certificateNoLabel} ${certificate.certificateNumber}`, width / 2, footerY + 80);
      // Issued date (text-xs text-blue-600)
      ctx.fillStyle = '#2563eb'; // blue-600
      ctx.font = '36px Arial, sans-serif'; // text-xs equivalent
      ctx.fillText(`${issuedOnLabel} ${formatDate(certificate.issuedDate)}`, width / 2, footerY + 140);

      // Draw decorative bottom line (matching component)
      const bottomLineGradient = ctx.createLinearGradient(width * 0.125, 0, width * 0.875, 0);
      bottomLineGradient.addColorStop(0, 'transparent');
      bottomLineGradient.addColorStop(0.5, 'rgba(59, 130, 246, 0.7)'); // blue-500 with opacity
      bottomLineGradient.addColorStop(1, 'transparent');
      ctx.fillStyle = bottomLineGradient;
      ctx.fillRect(width * 0.125, height - 200, width * 0.75, 4);

      // Convert canvas to blob and download
      canvas.toBlob((blob) => {
        if (blob) {
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `certificate-${certificate.certificateNumber}.png`;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          URL.revokeObjectURL(url);
        }
      }, 'image/png', 1.0);
    } catch (error) {
      console.error('Error downloading certificate:', error);
      alert('Failed to download certificate. Please try again.');
    }
  };

  // Helper function to wrap text
  const wrapText = (ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] => {
    const words = text.split(' ');
    const lines: string[] = [];
    let currentLine = words[0];

    for (let i = 1; i < words.length; i++) {
      const word = words[i];
      const width = ctx.measureText(currentLine + ' ' + word).width;
      if (width < maxWidth) {
        currentLine += ' ' + word;
      } else {
        lines.push(currentLine);
        currentLine = word;
      }
    }
    lines.push(currentLine);
    return lines;
  };

  // Helper function to draw rounded rectangle
  const roundRect = (ctx: CanvasRenderingContext2D, x: number, y: number, width: number, height: number, radius: number) => {
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.lineTo(x + width - radius, y);
    ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
    ctx.lineTo(x + width, y + height - radius);
    ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
    ctx.lineTo(x + radius, y + height);
    ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
    ctx.lineTo(x, y + radius);
    ctx.quadraticCurveTo(x, y, x + radius, y);
    ctx.closePath();
  };

  if (loading) {
    return (
      <div className="flex min-h-screen min-w-0 items-center justify-center overflow-x-hidden bg-[#f8fafc] dark:bg-[var(--navy-blue)]">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-[var(--neon-blue)] mx-auto mb-4" />
          <p className="text-gray-600 dark:text-[var(--dashboard-text-secondary)]">{t("Loading certificates...")}</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-screen min-w-0 items-center justify-center overflow-x-hidden bg-[#f8fafc] px-4 dark:bg-[var(--navy-blue)]">
        <div className="max-w-md text-center">
          <p className="mb-4 break-words text-red-600 dark:text-red-400">{error}</p>
          <button
            type="button"
            onClick={() => router.push("/dashboard")}
            className="min-h-[44px] w-full rounded-lg bg-[var(--neon-blue)] px-4 py-2 text-white hover:bg-[var(--medium-blue)] dark:hover:bg-[#4fc3f7] sm:w-auto"
          >
            {t("Go to Dashboard")}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen min-w-0 overflow-x-hidden bg-white px-3 py-4 dark:bg-[var(--navy-blue)] sm:p-6">
      <div className="mx-auto max-w-7xl min-w-0">
        {/* Header - Cisco Style */}
        <div className="mb-6 sm:mb-8">
          <button
            type="button"
            onClick={() => router.push("/dashboard")}
            className="mb-4 flex min-h-[44px] items-center gap-2 text-sm text-gray-600 transition-colors hover:text-[var(--neon-blue)] dark:text-[var(--dashboard-text-secondary)] dark:hover:text-[var(--neon-blue)] sm:mb-6"
          >
            <ArrowLeft className="h-4 w-4 shrink-0" />
            {t("Back to Dashboard")}
          </button>
          <div className="mb-2 flex min-w-0 items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[var(--neon-blue)]/10 dark:bg-[var(--neon-blue)]/20">
              <Award className="h-5 w-5 text-[var(--neon-blue)]" />
            </div>
            <div className="min-w-0">
              <h1 className="text-xl font-semibold text-gray-900 dark:text-white sm:text-2xl">{t("My Certificates")}</h1>
            </div>
          </div>
          <p className="text-sm text-gray-600 dark:text-[var(--dashboard-text-secondary)] sm:ml-[3.25rem]">
            {displayCertificates.length} {displayCertificates.length !== 1 ? t("certificates") : t("certificate")} {t("earned")}
          </p>
        </div>

        {displayCertificates.length === 0 ? (
          <div className="rounded-lg border border-gray-200 bg-white p-6 text-center dark:border-[var(--neon-blue)]/30 dark:bg-[var(--navy-blue-light)] sm:p-12">
            <Award className="w-12 h-12 text-gray-300 dark:text-gray-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">{t("No Certificates Yet")}</h3>
            <p className="text-sm text-gray-600 dark:text-[var(--dashboard-text-secondary)] mb-6">
              {t("Complete courses to earn certificates and showcase your achievements.")}
            </p>
            <button
              type="button"
              onClick={() => router.push("/dashboard/training-modules")}
              className="min-h-[44px] w-full rounded-md bg-[var(--neon-blue)] px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-[var(--medium-blue)] dark:hover:bg-[#4fc3f7] sm:w-auto"
            >
              {t("Browse Courses")}
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {displayCertificates.map((cert) => (
              <div
                key={cert._id}
                className="overflow-hidden rounded-lg border border-gray-200 bg-white transition-all hover:border-[var(--neon-blue)]/30 dark:border-[var(--neon-blue)]/30 dark:bg-[var(--navy-blue-light)] dark:hover:border-[var(--neon-blue)]/50"
              >
                <div className="p-4 sm:p-5">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <div className="flex min-w-0 flex-1 items-start gap-3 sm:gap-4">
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-[var(--neon-blue)]/10 dark:bg-[var(--neon-blue)]/20">
                        <Award className="h-6 w-6 text-[var(--neon-blue)]" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <h3 className="mb-2 break-words text-base font-semibold text-gray-900 dark:text-white">
                          {cert.courseTitle}
                        </h3>
                        <div className="flex flex-col gap-2 text-sm text-gray-600 dark:text-[var(--dashboard-text-secondary)] sm:flex-row sm:flex-wrap sm:items-center sm:gap-4">
                          <div className="flex min-w-0 items-center gap-1.5">
                            <User className="h-3.5 w-3.5 shrink-0 text-gray-400 dark:text-gray-500" />
                            <span className="truncate">{cert.userName}</span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <Calendar className="h-3.5 w-3.5 shrink-0 text-gray-400 dark:text-gray-500" />
                            <span>{new Date(cert.issuedDate).toLocaleDateString()}</span>
                          </div>
                          <div className="flex min-w-0 items-center gap-1.5">
                            <FileText className="h-3.5 w-3.5 shrink-0 text-gray-400 dark:text-gray-500" />
                            <span className="break-all font-mono text-xs">{cert.certificateNumber}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="flex w-full shrink-0 flex-col gap-2 sm:w-auto sm:flex-row">
                      <button
                        type="button"
                        onClick={() => setSelectedCertificate(cert)}
                        className="min-h-[44px] w-full rounded-md bg-[var(--neon-blue)] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[var(--medium-blue)] dark:hover:bg-[#4fc3f7] sm:w-auto"
                      >
                        {t("View")}
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDownload(cert)}
                        className="flex min-h-[44px] w-full items-center justify-center gap-2 rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 dark:border-[var(--neon-blue)]/30 dark:text-white dark:hover:bg-[var(--navy-blue-lighter)] sm:w-auto"
                      >
                        <Download className="h-4 w-4 shrink-0" />
                        {t("Download")}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Certificate Modal/View - Cisco Style */}
        {selectedCertificate && (
          <div
            className="fixed inset-0 z-50 flex items-end justify-center overflow-y-auto bg-black/50 p-0 dark:bg-black/70 sm:items-center sm:p-4 sm:p-6"
            onClick={() => setSelectedCertificate(null)}
          >
            <div
              className="max-h-[min(92dvh,100dvh)] w-full max-w-5xl overflow-y-auto rounded-t-2xl bg-white p-4 shadow-lg dark:bg-[var(--navy-blue-light)] sm:rounded-lg sm:p-6 min-h-0"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="mb-4 flex items-start justify-between gap-3 border-b border-gray-200 pb-4 dark:border-[var(--neon-blue)]/30 sm:mb-6">
                <h2 className="min-w-0 text-base font-semibold text-gray-900 dark:text-white sm:text-lg">{t("Certificate Details")}</h2>
                <button
                  type="button"
                  onClick={() => setSelectedCertificate(null)}
                  className="shrink-0 rounded p-2 text-gray-400 transition-colors hover:text-gray-600 dark:text-gray-500 dark:hover:text-white min-h-[44px] min-w-[44px] flex items-center justify-center sm:min-h-0 sm:min-w-0 sm:p-1"
                  aria-label={t("Close")}
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              <div className="min-w-0 overflow-x-auto">
              <Certificate
                userName={selectedCertificate.userName}
                courseTitle={(() => {
                  const cert = displayCertificates.find(c => c._id === selectedCertificate._id);
                  return cert ? cert.courseTitle : selectedCertificate.courseTitle;
                })()}
                certificateNumber={selectedCertificate.certificateNumber}
                issuedDate={selectedCertificate.issuedDate}
                description={(() => {
                  const cert = displayCertificates.find(c => c._id === selectedCertificate._id);
                  const courseTitleToUse = cert?.courseTitle || selectedCertificate.courseTitle;
                  const completionDate = new Date(selectedCertificate.completionDate).toLocaleDateString();
                  return `Successfully completed the course "${courseTitleToUse}" on ${completionDate}.`;
                })()}
                courseLevel={selectedCertificate.course?.level}
                courseCreator={selectedCertificate.course?.createdByName}
                language={language}
              />
              </div>
              <div className="mt-4 flex flex-col gap-2 border-t border-gray-200 pt-4 dark:border-[var(--neon-blue)]/30 sm:mt-6 sm:flex-row sm:justify-end sm:gap-3">
                <button
                  type="button"
                  onClick={() => setSelectedCertificate(null)}
                  className="min-h-[44px] w-full rounded-md border border-gray-300 px-5 py-2.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 dark:border-[var(--neon-blue)]/30 dark:text-white dark:hover:bg-[var(--navy-blue-lighter)] sm:w-auto"
                >
                  {t("Close")}
                </button>
                <button
                  type="button"
                  onClick={() => handleDownload(selectedCertificate)}
                  className="flex min-h-[44px] w-full items-center justify-center gap-2 rounded-md bg-[var(--neon-blue)] px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-[var(--medium-blue)] dark:hover:bg-[#4fc3f7] sm:w-auto"
                >
                  <Download className="h-4 w-4 shrink-0" />
                  {t("Download Certificate")}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
