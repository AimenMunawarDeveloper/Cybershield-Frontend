"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { ApiClient } from "@/lib/api";
import Certificate from "@/components/Certificate";
import { Award, Download, ArrowLeft, Loader2, Calendar, User, FileText, X } from "lucide-react";

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
  const [certificates, setCertificates] = useState<CertificateData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedCertificate, setSelectedCertificate] = useState<CertificateData | null>(null);

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

      const courseLevel = certificate.course?.level || "";
      const courseCreator = certificate.course?.createdByName || "Course Creator";
      const levelText = courseLevel 
        ? `${courseLevel.charAt(0).toUpperCase() + courseLevel.slice(1)} Level`
        : "Course Level";

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
      ctx.fillText('CERTIFICATE', width / 2, 450);

      // Draw "OF ACHIEVEMENT" subtitle (text-2xl font-bold text-blue-600)
      ctx.fillStyle = '#2563eb'; // blue-600
      ctx.font = 'bold 96px Arial, sans-serif'; // text-2xl equivalent
      ctx.fillText('OF ACHIEVEMENT', width / 2, 600);

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
      const description = certificate.courseDescription || `Successfully completed the course "${certificate.courseTitle}" on ${formatDate(certificate.completionDate)}.`;
      const maxWidth = width * 0.7;
      const lines = wrapText(ctx, description, maxWidth);
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
      ctx.fillText('Course Creator', width * 0.75, detailY - 40);
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
      ctx.fillText(`Certificate No: ${certificate.certificateNumber}`, width / 2, footerY + 80);
      // Issued date (text-xs text-blue-600)
      ctx.fillStyle = '#2563eb'; // blue-600
      ctx.font = '36px Arial, sans-serif'; // text-xs equivalent
      ctx.fillText(`Issued on ${formatDate(certificate.issuedDate)}`, width / 2, footerY + 140);

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
      <div className="min-h-screen bg-[#f8fafc] flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-[var(--neon-blue)] mx-auto mb-4" />
          <p className="text-gray-600">Loading certificates...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#f8fafc] flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error}</p>
          <button
            onClick={() => router.push("/dashboard")}
            className="px-4 py-2 bg-[var(--neon-blue)] text-white rounded-lg hover:bg-[var(--medium-blue)]"
          >
            Go to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header - Cisco Style */}
        <div className="mb-8">
          <button
            onClick={() => router.push("/dashboard")}
            className="flex items-center gap-2 text-gray-600 hover:text-[var(--neon-blue)] mb-6 transition-colors text-sm"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Dashboard
          </button>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-lg bg-[var(--neon-blue)]/10 flex items-center justify-center">
              <Award className="w-5 h-5 text-[var(--neon-blue)]" />
            </div>
            <div>
              <h1 className="text-2xl font-semibold text-gray-900">My Certificates</h1>
            </div>
          </div>
          <p className="text-sm text-gray-600 ml-[3.25rem]">
            {certificates.length} certificate{certificates.length !== 1 ? "s" : ""} earned
          </p>
        </div>

        {certificates.length === 0 ? (
          <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
            <Award className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No Certificates Yet</h3>
            <p className="text-sm text-gray-600 mb-6">
              Complete courses to earn certificates and showcase your achievements.
            </p>
            <button
              onClick={() => router.push("/dashboard/training-modules")}
              className="px-5 py-2.5 bg-[var(--neon-blue)] text-white rounded-md hover:bg-[var(--medium-blue)] transition-colors text-sm font-medium"
            >
              Browse Courses
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {certificates.map((cert) => (
              <div
                key={cert._id}
                className="bg-white rounded-lg border border-gray-200 overflow-hidden hover:border-[var(--neon-blue)]/30 transition-all"
              >
                <div className="p-5">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-4 flex-1">
                      <div className="flex-shrink-0 w-12 h-12 rounded-lg bg-[var(--neon-blue)]/10 flex items-center justify-center">
                        <Award className="w-6 h-6 text-[var(--neon-blue)]" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-base font-semibold text-gray-900 mb-2">
                          {cert.courseTitle}
                        </h3>
                        <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600">
                          <div className="flex items-center gap-1.5">
                            <User className="w-3.5 h-3.5 text-gray-400" />
                            <span>{cert.userName}</span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <Calendar className="w-3.5 h-3.5 text-gray-400" />
                            <span>{new Date(cert.issuedDate).toLocaleDateString()}</span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <FileText className="w-3.5 h-3.5 text-gray-400" />
                            <span className="font-mono text-xs">{cert.certificateNumber}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2 flex-shrink-0">
                      <button
                        onClick={() => setSelectedCertificate(cert)}
                        className="px-4 py-2 bg-[var(--neon-blue)] text-white rounded-md hover:bg-[var(--medium-blue)] transition-colors text-sm font-medium"
                      >
                        View
                      </button>
                      <button
                        onClick={() => handleDownload(cert)}
                        className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors text-sm font-medium flex items-center gap-2"
                      >
                        <Download className="w-4 h-4" />
                        Download
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
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-6 overflow-y-auto"
            onClick={() => setSelectedCertificate(null)}
          >
            <div
              className="bg-white rounded-lg max-w-5xl w-full p-6 max-h-[90vh] overflow-y-auto shadow-lg"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex justify-between items-center mb-6 pb-4 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900">Certificate Details</h2>
                <button
                  onClick={() => setSelectedCertificate(null)}
                  className="text-gray-400 hover:text-gray-600 transition-colors p-1"
                  aria-label="Close"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <Certificate
                userName={selectedCertificate.userName}
                courseTitle={selectedCertificate.courseTitle}
                certificateNumber={selectedCertificate.certificateNumber}
                issuedDate={selectedCertificate.issuedDate}
                description={`Successfully completed the course "${selectedCertificate.courseTitle}" on ${new Date(selectedCertificate.completionDate).toLocaleDateString()}.`}
                courseLevel={selectedCertificate.course?.level}
                courseCreator={selectedCertificate.course?.createdByName}
              />
              <div className="mt-6 pt-4 border-t border-gray-200 flex justify-end gap-3">
                <button
                  onClick={() => setSelectedCertificate(null)}
                  className="px-5 py-2.5 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors text-sm font-medium"
                >
                  Close
                </button>
                <button
                  onClick={() => handleDownload(selectedCertificate)}
                  className="px-5 py-2.5 bg-[var(--neon-blue)] text-white rounded-md hover:bg-[var(--medium-blue)] transition-colors text-sm font-medium flex items-center gap-2"
                >
                  <Download className="w-4 h-4" />
                  Download Certificate
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
