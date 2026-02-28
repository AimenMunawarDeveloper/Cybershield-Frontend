"use client";

import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { useAuth, useUser } from "@clerk/nextjs";
import { useRouter, useParams } from "next/navigation";
import { ApiClient } from "@/lib/api";
import Link from "next/link";
import { useLanguage } from "@/contexts/LanguageContext";
import { useTranslation } from "@/hooks/useTranslation";
import {
  ArrowLeft,
  Clock,
  Trophy,
  AlertTriangle,
  CheckCircle,
  XCircle,
  MessageSquare,
  Calendar,
  Phone,
  User,
  Bot,
  FileText,
  BarChart3,
  Play,
  Pause,
  Volume2,
} from "lucide-react";
import NetworkBackground from "@/components/NetworkBackground";

interface Conversation {
  _id: string;
  scenarioType: "phishing" | "normal";
  scenarioDescription: string;
  status: "initiated" | "active" | "completed" | "failed";
  score: number | null;
  scoreDetails: {
    fellForPhishing: boolean;
    providedSensitiveInfo: boolean;
    sensitiveInfoTypes: string[];
    resistanceLevel: "high" | "medium" | "low";
    analysisRationale: string;
  } | null;
  transcript: Array<{
    role: "user" | "agent";
    message: string;
    timestamp: string;
  }>;
  fullTranscript: string;
  duration: number;
  startedAt: string;
  endedAt: string | null;
  createdAt: string;
  elevenLabsConversationId?: string;
  recordingUrl?: string;
  metadata?: {
    userAgent?: string;
    ipAddress?: string;
    connectionType?: string;
  };
}

// Simple markdown formatter for analysis rationale
function formatMarkdown(text: string): React.ReactElement[] {
  if (!text) return [];
  
  const parts: React.ReactElement[] = [];
  const lines = text.split('\n');
  
  lines.forEach((line, lineIndex) => {
    const trimmedLine = line.trim();
    
    if (trimmedLine === '') {
      parts.push(<br key={`br-${lineIndex}`} />);
      return;
    }
    
    if (/^[-*]\s/.test(trimmedLine)) {
      const listContent = trimmedLine.substring(2).trim();
      const formattedContent = formatInlineMarkdown(listContent);
      parts.push(
        <div key={`list-${lineIndex}`} className="flex items-start gap-2 my-1.5">
          <span className="text-[var(--dashboard-text-secondary)] dark:text-[var(--medium-grey)] mt-0.5 flex-shrink-0">•</span>
          <span className="flex-1">{formattedContent}</span>
        </div>
      );
    } else {
      const formattedContent = formatInlineMarkdown(trimmedLine);
      parts.push(
        <p key={`p-${lineIndex}`} className="mb-2 last:mb-0">
          {formattedContent}
        </p>
      );
    }
  });
  
  return parts;
}

function formatInlineMarkdown(text: string): React.ReactElement[] {
  if (!text) return [<span key="empty"></span>];
  
  const parts: React.ReactElement[] = [];
  const boldRegex = /\*\*(.+?)\*\*/g;
  let lastIndex = 0;
  let match;
  let key = 0;
  
  while ((match = boldRegex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push(<span key={`text-${key++}`}>{text.substring(lastIndex, match.index)}</span>);
    }
    parts.push(
      <strong key={`bold-${key++}`} className="text-[var(--dashboard-text-primary)] dark:text-white font-semibold">
        {match[1]}
      </strong>
    );
    lastIndex = match.index + match[0].length;
  }
  
  if (lastIndex < text.length) {
    parts.push(<span key={`text-${key++}`}>{text.substring(lastIndex)}</span>);
  }
  
  return parts.length > 0 ? parts : [<span key="text">{text}</span>];
}

function getScoreColor(score: number): string {
  if (score >= 90) return "text-green-400";
  if (score >= 75) return "text-blue-400";
  if (score >= 50) return "text-yellow-400";
  return "text-red-400";
}

function getScoreLabel(score: number, t?: (text: string) => string): string {
  if (!t) {
    if (score >= 90) return "Excellent";
    if (score >= 75) return "Good";
    if (score >= 50) return "Fair";
    return "Needs Improvement";
  }
  if (score >= 90) return t("Excellent");
  if (score >= 75) return t("Good");
  if (score >= 50) return t("Fair");
  return t("Needs Improvement");
}

interface UserProfile {
  _id: string;
  role: string;
  orgId?: string;
}

export default function CallDetailsPage() {
  const { getToken } = useAuth();
  const { user, isLoaded } = useUser();
  const router = useRouter();
  const params = useParams();
  const conversationId = params.id as string;
  const { language } = useLanguage();
  const { t, preTranslate, isTranslating } = useTranslation();
  
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [profileLoading, setProfileLoading] = useState(true);
  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [translationReady, setTranslationReady] = useState(false);
  const [translatedConversation, setTranslatedConversation] = useState<Conversation | null>(null);

  useEffect(() => {
    if (isLoaded && user) {
      fetchProfile();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoaded, user]);

  useEffect(() => {
    fetchConversationDetails();
  }, [conversationId]);

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
        "Back to Call History",
        "Call Details",
        
        // Recording Player
        "Call Recording",
        "Listen to the full conversation",
        "Recording is being processed or is not available yet. Please check back later.",
        
        // Score Card
        "Learning score",
        "Excellent",
        "Good",
        "Fair",
        "Needs Improvement",
        "Fell for phishing attempt",
        "Resisted phishing attempt",
        "Provided sensitive information:",
        "Resistance Level:",
        
        // Analysis
        "Analysis",
        
        // Transcript
        "Transcript",
        "No transcript available",
        
        // Call Info
        "Call Information",
        "Phishing",
        "Normal",
        
        // Metadata
        "Metadata",
        "Connection:",
        
        // Error states
        "Error",
        "Conversation not found",
        "Go Back",
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

  // Translate dynamic conversation content when language or conversation changes
  useEffect(() => {
    if (language === "en" || !conversation || !translationReady) {
      setTranslatedConversation(null);
      return;
    }

    const translateConversation = async () => {
      try {
        const textsToTranslate: string[] = [];
        const textMap: Array<{ type: string; field?: string; index?: number }> = [];

        // Scenario description
        if (conversation.scenarioDescription) {
          textsToTranslate.push(conversation.scenarioDescription);
          textMap.push({ type: "scenarioDescription" });
        }

        // Transcript messages
        if (conversation.transcript && conversation.transcript.length > 0) {
          conversation.transcript.forEach((msg, index) => {
            if (msg.message) {
              textsToTranslate.push(msg.message);
              textMap.push({ type: "transcript", index });
            }
          });
        }

        // Full transcript
        if (conversation.fullTranscript) {
          textsToTranslate.push(conversation.fullTranscript);
          textMap.push({ type: "fullTranscript" });
        }

        // Analysis rationale
        if (conversation.scoreDetails?.analysisRationale) {
          textsToTranslate.push(conversation.scoreDetails.analysisRationale);
          textMap.push({ type: "analysisRationale" });
        }

        // Sensitive info types
        if (conversation.scoreDetails?.sensitiveInfoTypes) {
          conversation.scoreDetails.sensitiveInfoTypes.forEach((infoType, index) => {
            textsToTranslate.push(infoType);
            textMap.push({ type: "sensitiveInfoType", index });
          });
        }

        if (textsToTranslate.length === 0) {
          setTranslatedConversation(null);
          return;
        }

        // Batch translate all texts
        const { translateService } = await import("@/services/translateService");
        const translatedTexts = await translateService.translateBatch(textsToTranslate);

        // Reconstruct conversation with translated content
        const translated: Conversation = {
          ...conversation,
          scenarioDescription: (() => {
            const descIndex = textMap.findIndex(m => m.type === "scenarioDescription");
            if (descIndex >= 0) {
              const originalIndex = textsToTranslate.indexOf(conversation.scenarioDescription);
              return originalIndex >= 0 ? translatedTexts[originalIndex] : conversation.scenarioDescription;
            }
            return conversation.scenarioDescription;
          })(),
          transcript: conversation.transcript ? conversation.transcript.map((msg, index) => {
            const msgIndex = textMap.findIndex(m => m.type === "transcript" && m.index === index);
            if (msgIndex >= 0) {
              const originalIndex = textsToTranslate.indexOf(msg.message);
              return {
                ...msg,
                message: originalIndex >= 0 ? translatedTexts[originalIndex] : msg.message,
              };
            }
            return msg;
          }) : conversation.transcript,
          fullTranscript: (() => {
            const fullIndex = textMap.findIndex(m => m.type === "fullTranscript");
            if (fullIndex >= 0) {
              const originalIndex = textsToTranslate.indexOf(conversation.fullTranscript);
              return originalIndex >= 0 ? translatedTexts[originalIndex] : conversation.fullTranscript;
            }
            return conversation.fullTranscript;
          })(),
          scoreDetails: conversation.scoreDetails ? {
            ...conversation.scoreDetails,
            analysisRationale: (() => {
              const rationaleIndex = textMap.findIndex(m => m.type === "analysisRationale");
              if (rationaleIndex >= 0) {
                const originalIndex = textsToTranslate.indexOf(conversation.scoreDetails!.analysisRationale);
                return originalIndex >= 0 ? translatedTexts[originalIndex] : conversation.scoreDetails!.analysisRationale;
              }
              return conversation.scoreDetails!.analysisRationale;
            })(),
            sensitiveInfoTypes: conversation.scoreDetails.sensitiveInfoTypes ? conversation.scoreDetails.sensitiveInfoTypes.map((infoType, index) => {
              const typeIndex = textMap.findIndex(m => m.type === "sensitiveInfoType" && m.index === index);
              if (typeIndex >= 0) {
                const originalIndex = textsToTranslate.indexOf(infoType);
                return originalIndex >= 0 ? translatedTexts[originalIndex] : infoType;
              }
              return infoType;
            }) : conversation.scoreDetails.sensitiveInfoTypes,
          } : conversation.scoreDetails,
        };

        setTranslatedConversation(translated);
      } catch (error) {
        console.error("Error translating conversation:", error);
        setTranslatedConversation(null);
      }
    };

    translateConversation();
  }, [conversation, language, translationReady]);

  // Use translated conversation or fallback to original
  const displayConversation = useMemo(() => {
    return language === "ur" && translatedConversation ? translatedConversation : conversation;
  }, [translatedConversation, conversation, language]);

  // Memoized score label function
  const getDisplayScoreLabel = useCallback((score: number) => {
    return getScoreLabel(score, t);
  }, [t]);

  const fetchProfile = async () => {
    try {
      const apiClient = new ApiClient(getToken);
      const profileData = await apiClient.getUserProfile();
      setProfile(profileData);
    } catch (err) {
      console.error("Failed to fetch profile:", err);
    } finally {
      setProfileLoading(false);
    }
  };

  // Cleanup audio on unmount
  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.src = '';
      }
    };
  }, []);

  // Update time and duration for audio player
  useEffect(() => {
    const audio = audioRef.current;
    const currentConversation = displayConversation || conversation;
    if (!audio || !currentConversation?.recordingUrl) return;

    // Reset audio when URL changes
    audio.load();

    const updateTime = () => setCurrentTime(audio.currentTime);
    const updateDuration = () => setDuration(audio.duration);
    const handleTimeUpdate = () => setCurrentTime(audio.currentTime);
    const handleLoadedMetadata = () => {
      setDuration(audio.duration);
      console.log("Audio metadata loaded, duration:", audio.duration);
    };
    const handleCanPlay = () => {
      console.log("Audio can play");
    };
    const handleError = (e: any) => {
      console.error("Audio error:", e);
      setIsPlaying(false);
    };

    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('durationchange', updateDuration);
    audio.addEventListener('canplay', handleCanPlay);
    audio.addEventListener('error', handleError);

    return () => {
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.removeEventListener('durationchange', updateDuration);
      audio.removeEventListener('canplay', handleCanPlay);
      audio.removeEventListener('error', handleError);
    };
  }, [conversation?.recordingUrl, displayConversation?.recordingUrl]);

  const formatTime = (seconds: number): string => {
    if (isNaN(seconds)) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const audio = audioRef.current;
    if (!audio) return;
    const newTime = parseFloat(e.target.value);
    audio.currentTime = newTime;
    setCurrentTime(newTime);
  };

  const fetchConversationDetails = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const token = await getToken();
      if (!token) {
        setError("Authentication required");
        setLoading(false);
        return;
      }

      const API_BASE_URL =
        process.env.NEXT_PUBLIC_API_URL || "http://localhost:5001/api";
      
      const response = await fetch(
        `${API_BASE_URL}/voice-phishing/${conversationId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error("Failed to fetch conversation details");
      }

        const data = await response.json();
      
      if (data.success) {
        console.log("Conversation data received:", {
          hasRecordingUrl: !!data.data.recordingUrl,
          recordingUrl: data.data.recordingUrl,
          elevenLabsConversationId: data.data.elevenLabsConversationId
        });
        setConversation(data.data);
      } else {
        setError(data.message || "Failed to fetch conversation");
      }
    } catch (err: any) {
      console.error("Error fetching conversation:", err);
      setError(err.message || "Failed to load conversation details");
    } finally {
      setLoading(false);
    }
  };

  // Show loading state while profile is loading
  if (profileLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[var(--navy-blue-dark)] via-[var(--navy-blue)] to-[var(--navy-blue-light)] relative overflow-hidden">
        <NetworkBackground />
        <div className="relative z-10 flex items-center justify-center min-h-screen">
          <div className="w-10 h-10 border-4 border-white border-t-transparent rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[var(--navy-blue-dark)] via-[var(--navy-blue)] to-[var(--navy-blue-light)] relative overflow-hidden">
        <NetworkBackground />
        <div className="relative z-10 flex items-center justify-center min-h-screen">
          <div className="w-10 h-10 border-4 border-white border-t-transparent rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  if (error || !conversation) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[var(--navy-blue-dark)] via-[var(--navy-blue)] to-[var(--navy-blue-light)] relative overflow-hidden">
        <NetworkBackground />
        <div className="relative z-10 flex items-center justify-center min-h-screen">
          <div className="text-center">
            <AlertTriangle className="w-16 h-16 text-red-400 mx-auto mb-4" />
            <h2 className="text-2xl font-semibold text-[var(--dashboard-text-primary)] dark:text-white mb-2">{t("Error")}</h2>
            <p className="text-[var(--dashboard-text-secondary)] dark:text-[var(--medium-grey)] mb-6">{error || t("Conversation not found")}</p>
            <button
              onClick={() => router.back()}
              className="px-6 py-3 bg-[var(--neon-blue)] text-white rounded-xl hover:bg-[var(--medium-blue)] dark:hover:bg-[var(--neon-blue)]/80 transition-colors"
            >
              {t("Go Back")}
            </button>
          </div>
        </div>
      </div>
    );
  }

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}m ${secs}s`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[var(--navy-blue-dark)] via-[var(--navy-blue)] to-[var(--navy-blue-light)] relative overflow-hidden">
      <NetworkBackground />
      
      <div className="relative z-10 container mx-auto px-6 md:px-12 lg:px-16 xl:px-20 py-8 md:py-12">
        {/* Header */}
        <div className="mb-8 md:mb-10">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 text-[var(--dashboard-text-secondary)] dark:text-[var(--light-blue)] hover:text-[var(--dashboard-text-primary)] dark:hover:text-white transition-colors mb-6"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>{t("Back to Call History")}</span>
          </button>
          <h1 className="text-3xl md:text-4xl font-bold text-[var(--dashboard-text-primary)] dark:text-white">{t("Call Details")}</h1>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 md:gap-10 lg:gap-12">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8 md:space-y-10">
            {/* Recording Player */}
            {displayConversation?.recordingUrl ? (
              <div className="bg-[var(--dashboard-card-bg)] dark:bg-[var(--navy-blue-light)]/95 backdrop-blur-sm rounded-3xl p-6 md:p-8 border border-[var(--dashboard-card-border)] dark:border-[var(--neon-blue)]/20">
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-2 rounded-xl bg-[var(--neon-blue)]/20 border border-[var(--neon-blue)]/30">
                    <Volume2 className="w-6 h-6 text-[var(--neon-blue)]" />
                  </div>
                  <div>
                    <h2 className="text-xl font-semibold text-[var(--dashboard-text-primary)] dark:text-white">{t("Call Recording")}</h2>
                    <p className="text-sm text-[var(--dashboard-text-secondary)] dark:text-[var(--medium-grey)]">{t("Listen to the full conversation")}</p>
                  </div>
                </div>
                
                {/* Custom Audio Player */}
                <div className="space-y-4">
                  {/* Play/Pause Button and Time Display */}
                  <div className="flex items-center gap-4">
                    <button
                      onClick={async () => {
                        const audio = audioRef.current;
                        if (!audio) {
                          console.error("Audio element not found");
                          return;
                        }
                        
                        try {
                          if (isPlaying) {
                            audio.pause();
                            setIsPlaying(false);
                          } else {
                            // Ensure audio is loaded
                            if (audio.readyState < 2) {
                              await audio.load();
                            }
                            await audio.play();
                            setIsPlaying(true);
                          }
                        } catch (error) {
                          console.error("Error playing audio:", error);
                          setIsPlaying(false);
                        }
                      }}
                      className="w-14 h-14 rounded-full bg-gradient-to-br from-[var(--neon-blue)] to-[var(--neon-blue-dark)] flex items-center justify-center hover:from-[var(--neon-blue-dark)] hover:to-[var(--neon-blue)] transition-all shadow-lg shadow-[var(--neon-blue)]/40 hover:shadow-[var(--neon-blue)]/60 hover:scale-105 active:scale-95"
                    >
                      {isPlaying ? (
                        <Pause className="w-7 h-7 text-white" />
                      ) : (
                        <Play className="w-7 h-7 text-white ml-0.5" />
                      )}
                    </button>
                    
                    <div className="flex-1">
                      {/* Progress Bar */}
                      <div className="relative">
                        <input
                          type="range"
                          min="0"
                          max={duration || 0}
                          value={currentTime}
                          onChange={handleSeek}
                          className="w-full h-2 bg-[var(--navy-blue)] rounded-full appearance-none cursor-pointer"
                          style={{
                            background: duration > 0 
                              ? `linear-gradient(to right, var(--neon-blue) 0%, var(--neon-blue) ${(currentTime / duration) * 100}%, var(--navy-blue) ${(currentTime / duration) * 100}%, var(--navy-blue) 100%)`
                              : 'var(--navy-blue)'
                          }}
                        />
                      </div>
                      
                      {/* Time Display */}
                      <div className="flex justify-between items-center mt-2 text-xs text-[var(--dashboard-text-secondary)] dark:text-[var(--medium-grey)]">
                        <span>{formatTime(currentTime)}</span>
                        <span>{formatTime(duration)}</span>
                      </div>
                    </div>
                  </div>
                  
                  {/* Audio Element (visually hidden but accessible) */}
                    <audio
                    ref={audioRef}
                    src={displayConversation.recordingUrl}
                    preload="auto"
                    onPlay={() => setIsPlaying(true)}
                    onPause={() => setIsPlaying(false)}
                    onEnded={() => {
                      setIsPlaying(false);
                      setCurrentTime(0);
                    }}
                    onError={(e) => {
                      console.error("Audio error:", e);
                      setIsPlaying(false);
                    }}
                    onLoadedMetadata={() => {
                      const audio = audioRef.current;
                      if (audio) {
                        setDuration(audio.duration);
                      }
                    }}
                    style={{ display: 'none' }}
                  />
                </div>
              </div>
            ) : displayConversation?.elevenLabsConversationId ? (
              <div className="bg-[var(--dashboard-card-bg)] dark:bg-[var(--navy-blue-light)]/95 backdrop-blur-sm rounded-3xl p-6 md:p-8 border border-[var(--dashboard-card-border)] dark:border-[var(--neon-blue)]/20">
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2 rounded-xl bg-gray-200 dark:bg-[var(--medium-grey)]/20 border border-gray-300 dark:border-[var(--medium-grey)]/30">
                    <Volume2 className="w-6 h-6 text-[var(--dashboard-text-secondary)] dark:text-[var(--medium-grey)]" />
                  </div>
                  <h2 className="text-xl font-semibold text-[var(--dashboard-text-primary)] dark:text-white">{t("Call Recording")}</h2>
                </div>
                <p className="text-[var(--dashboard-text-secondary)] dark:text-[var(--medium-grey)] text-sm">
                  {t("Recording is being processed or is not available yet. Please check back later.")}
                </p>
              </div>
            ) : null}

            {/* Score Card */}
            {displayConversation?.score !== null && displayConversation?.score !== undefined && (
              <div className="bg-[var(--dashboard-card-bg)] dark:bg-[var(--navy-blue-light)]/95 backdrop-blur-sm rounded-3xl p-6 md:p-8 border border-[var(--dashboard-card-border)] dark:border-[var(--neon-blue)]/20">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <Trophy className="w-8 h-8 text-yellow-400" />
                    <h2 className="text-2xl font-semibold text-[var(--dashboard-text-primary)] dark:text-white">{t("Learning score")}</h2>
                  </div>
                  <span
                    className={`text-5xl font-bold ${getScoreColor(displayConversation.score)}`}
                  >
                    {displayConversation.score}
                  </span>
                </div>
                <div className="text-center mb-6">
                  <p className="text-lg text-[var(--dashboard-text-secondary)] dark:text-[var(--medium-grey)]">
                    {getDisplayScoreLabel(displayConversation.score)}
                  </p>
                </div>

                {displayConversation.scoreDetails && (
                  <div className="space-y-4 pt-6 border-t border-gray-300 dark:border-[var(--medium-grey)]/20">
                    <div className="flex items-center gap-2">
                      {displayConversation.scoreDetails.fellForPhishing ? (
                        <XCircle className="w-5 h-5 text-red-400" />
                      ) : (
                        <CheckCircle className="w-5 h-5 text-green-400" />
                      )}
                      <span className="text-[var(--dashboard-text-primary)] dark:text-white">
                        {displayConversation.scoreDetails.fellForPhishing
                          ? t("Fell for phishing attempt")
                          : t("Resisted phishing attempt")}
                      </span>
                    </div>
                    
                    {displayConversation.scoreDetails.providedSensitiveInfo && (
                      <div className="text-red-400">
                        {t("Provided sensitive information:")}{" "}
                        {displayConversation.scoreDetails.sensitiveInfoTypes?.join(", ")}
                      </div>
                    )}
                    
                    <div className="text-[var(--dashboard-text-secondary)] dark:text-[var(--medium-grey)]">
                      {t("Resistance Level:")}{" "}
                      <span className="text-[var(--dashboard-text-primary)] dark:text-white capitalize">
                        {displayConversation.scoreDetails.resistanceLevel}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Analysis Rationale */}
            {displayConversation?.scoreDetails?.analysisRationale && (
              <div className="bg-[var(--dashboard-card-bg)] dark:bg-[var(--navy-blue-light)]/95 backdrop-blur-sm rounded-3xl p-6 md:p-8 border border-[var(--dashboard-card-border)] dark:border-[var(--neon-blue)]/20">
                <div className="flex items-center gap-3 mb-4">
                  <BarChart3 className="w-6 h-6 text-[var(--neon-blue)]" />
                  <h2 className="text-xl font-semibold text-[var(--dashboard-text-primary)] dark:text-white">{t("Analysis")}</h2>
                </div>
                <div className="text-sm text-[var(--dashboard-text-secondary)] dark:text-[var(--medium-grey)] leading-relaxed">
                  {formatMarkdown(displayConversation.scoreDetails.analysisRationale)}
                </div>
              </div>
            )}

            {/* Transcript */}
            <div className="bg-[var(--dashboard-card-bg)] dark:bg-[var(--navy-blue-light)]/95 backdrop-blur-sm rounded-3xl p-6 md:p-8 border border-[var(--dashboard-card-border)] dark:border-[var(--neon-blue)]/20">
              <div className="flex items-center gap-3 mb-6">
                <MessageSquare className="w-6 h-6 text-[var(--neon-blue)]" />
                <h2 className="text-xl font-semibold text-[var(--dashboard-text-primary)] dark:text-white">{t("Transcript")}</h2>
              </div>
              
              {displayConversation?.transcript && displayConversation.transcript.length > 0 ? (
                <div className="space-y-4">
                  {displayConversation.transcript.map((msg, index) => (
                    <div
                      key={index}
                      className={`flex gap-4 ${
                        msg.role === "user" ? "justify-end" : "justify-start"
                      }`}
                    >
                      <div
                        className={`max-w-[80%] rounded-2xl p-4 ${
                          msg.role === "user"
                            ? "bg-[var(--neon-blue)]/20 border border-[var(--neon-blue)]/30"
                            : "bg-gray-100 dark:bg-[var(--navy-blue-lighter)]/80 border border-gray-300 dark:border-[var(--medium-grey)]/20"
                        }`}
                      >
                        <div className="flex items-center gap-2 mb-2">
                          {msg.role === "user" ? (
                            <User className="w-4 h-4 text-[var(--neon-blue)]" />
                          ) : (
                            <Bot className="w-4 h-4 text-[var(--dashboard-text-secondary)] dark:text-[var(--medium-grey)]" />
                          )}
                          <span className="text-xs text-[var(--dashboard-text-secondary)] dark:text-[var(--medium-grey)] capitalize">
                            {msg.role}
                          </span>
                        </div>
                        <p className="text-[var(--dashboard-text-primary)] dark:text-white text-sm leading-relaxed">{msg.message}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : displayConversation?.fullTranscript ? (
                <div className="bg-gray-50 dark:bg-[var(--navy-blue-lighter)]/50 rounded-xl p-4">
                  <p className="text-[var(--dashboard-text-primary)] dark:text-white whitespace-pre-wrap text-sm leading-relaxed">
                    {displayConversation.fullTranscript}
                  </p>
                </div>
              ) : (
                <div className="text-center py-8 text-[var(--dashboard-text-secondary)] dark:text-[var(--medium-grey)]">
                  {t("No transcript available")}
                </div>
              )}
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-8 md:space-y-10">
            {/* Call Info Card */}
            <div className="bg-[var(--dashboard-card-bg)] dark:bg-[var(--navy-blue-light)]/95 backdrop-blur-sm rounded-3xl p-6 border border-[var(--dashboard-card-border)] dark:border-[var(--neon-blue)]/20">
              <h3 className="text-lg font-semibold text-[var(--dashboard-text-primary)] dark:text-white mb-4 flex items-center gap-2">
                <FileText className="w-5 h-5 text-[var(--neon-blue)]" />
                {t("Call Information")}
              </h3>
              
              <div className="space-y-4">
                <div>
                  <div className="flex items-center gap-2 text-[var(--dashboard-text-secondary)] dark:text-[var(--medium-grey)] text-sm mb-1">
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-medium ${
                        displayConversation?.scenarioType === "phishing"
                          ? "bg-yellow-500/20 text-yellow-400 border border-yellow-500/30"
                          : "bg-green-500/20 text-green-400 border border-green-500/30"
                      }`}
                    >
                      {displayConversation?.scenarioType === "phishing" ? t("Phishing") : t("Normal")}
                    </span>
                  </div>
                  <p className="text-[var(--dashboard-text-primary)] dark:text-white text-sm">{displayConversation?.scenarioDescription}</p>
                </div>

                <div className="flex items-center gap-2 text-[var(--dashboard-text-secondary)] dark:text-[var(--medium-grey)] text-sm">
                  <Calendar className="w-4 h-4" />
                  <span>{displayConversation ? formatDate(displayConversation.createdAt) : ""}</span>
                </div>

                {displayConversation && displayConversation.duration > 0 && (
                  <div className="flex items-center gap-2 text-[var(--dashboard-text-secondary)] dark:text-[var(--medium-grey)] text-sm">
                    <Clock className="w-4 h-4" />
                    <span>{formatDuration(displayConversation.duration)}</span>
                  </div>
                )}

                <div className="flex items-center gap-2 text-[var(--dashboard-text-secondary)] dark:text-[var(--medium-grey)] text-sm">
                  <Phone className="w-4 h-4" />
                  <span className="capitalize">{displayConversation?.status}</span>
                </div>
              </div>
            </div>

            {/* Metadata Card */}
            {displayConversation?.metadata && (
              <div className="bg-[var(--dashboard-card-bg)] dark:bg-[var(--navy-blue-light)]/95 backdrop-blur-sm rounded-3xl p-6 border border-[var(--dashboard-card-border)] dark:border-[var(--neon-blue)]/20">
                <h3 className="text-lg font-semibold text-[var(--dashboard-text-primary)] dark:text-white mb-4">{t("Metadata")}</h3>
                <div className="space-y-2 text-sm">
                  {displayConversation.metadata.connectionType && (
                    <div className="text-[var(--dashboard-text-secondary)] dark:text-[var(--medium-grey)]">
                      {t("Connection:")} <span className="text-[var(--dashboard-text-primary)] dark:text-white capitalize">{displayConversation.metadata.connectionType}</span>
                    </div>
                  )}
                  {displayConversation.metadata.userAgent && (
                    <div className="text-[var(--dashboard-text-secondary)] dark:text-[var(--medium-grey)]">
                      <div className="text-xs break-all">{displayConversation.metadata.userAgent}</div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
