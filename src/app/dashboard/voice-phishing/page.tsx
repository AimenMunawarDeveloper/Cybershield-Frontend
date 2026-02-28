"use client";

import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { useAuth, useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { useConversation } from "@elevenlabs/react";
import { ApiClient } from "@/lib/api";
import Link from "next/link";
import {
  Mic,
  MicOff,
  Phone,
  PhoneOff,
  MessageSquare,
  Trophy,
  AlertTriangle,
  CheckCircle,
  XCircle,
  X,
  Clock,
  ChevronUp,
  ChevronDown,
  FileText,
  Plus,
  Edit,
  Trash2,
} from "lucide-react";
import NetworkBackground from "@/components/NetworkBackground";
import { useTranslation } from "@/hooks/useTranslation";
import { useLanguage } from "@/contexts/LanguageContext";

// Simple markdown formatter for analysis rationale
function formatMarkdown(text: string): React.ReactElement[] {
  if (!text) return [];
  
  const parts: React.ReactElement[] = [];
  const lines = text.split('\n');
  
  lines.forEach((line, lineIndex) => {
    const trimmedLine = line.trim();
    
    // Empty line - add spacing
    if (trimmedLine === '') {
      parts.push(<br key={`br-${lineIndex}`} />);
      return;
    }
    
    // Check if it's a list item (starts with - or * followed by space)
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
      // Regular paragraph
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

// Format inline markdown (bold, etc.)
function formatInlineMarkdown(text: string): React.ReactElement[] {
  if (!text) return [<span key="empty"></span>];
  
  const parts: React.ReactElement[] = [];
  const boldRegex = /\*\*(.+?)\*\*/g;
  let lastIndex = 0;
  let match;
  let key = 0;
  
  while ((match = boldRegex.exec(text)) !== null) {
    // Add text before the bold
    if (match.index > lastIndex) {
      parts.push(<span key={`text-${key++}`}>{text.substring(lastIndex, match.index)}</span>);
    }
    // Add bold text
    parts.push(
      <strong key={`bold-${key++}`} className="text-[var(--dashboard-text-primary)] dark:text-white font-semibold">
        {match[1]}
      </strong>
    );
    lastIndex = match.index + match[0].length;
  }
  
  // Add remaining text
  if (lastIndex < text.length) {
    parts.push(<span key={`text-${key++}`}>{text.substring(lastIndex)}</span>);
  }
  
  return parts.length > 0 ? parts : [<span key="text">{text}</span>];
}

interface ConversationMessage {
  role: "user" | "agent";
  message: string;
  timestamp: Date;
}

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
  duration: number;
  createdAt: string;
}

interface UserProfile {
  _id: string;
  role: string;
  orgId?: string;
}

export default function VoicePhishingPage() {
  const { getToken } = useAuth();
  const { user, isLoaded } = useUser();
  const router = useRouter();
  const { language } = useLanguage();
  const { t, preTranslate, isTranslating } = useTranslation();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [profileLoading, setProfileLoading] = useState(true);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ConversationMessage[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [scenario, setScenario] = useState<{
    type: "phishing" | "normal";
    description: string;
    firstMessage?: string;
    variables?: {
      scenario_type: string;
      scenario_description: string;
    };
  } | null>(null);
  const [score, setScore] = useState<number | null>(null);
  const [scoreDetails, setScoreDetails] = useState<any>(null);
  const [conversationHistory, setConversationHistory] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(false);
  const [calculatingScore, setCalculatingScore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [conversationOverrides, setConversationOverrides] = useState<any>(undefined);
  const [pendingStart, setPendingStart] = useState<{
    agentId: string;
    userId: string;
  } | null>(null);
  const [showTranscript, setShowTranscript] = useState(false);
  const [templates, setTemplates] = useState<any[]>([]);
  const [defaultScenarios, setDefaultScenarios] = useState<any[]>([]);
  const [loadingTemplates, setLoadingTemplates] = useState(false);
  const [loadingDefaultScenarios, setLoadingDefaultScenarios] = useState(false);
  const [showTemplateModal, setShowTemplateModal] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<any | null>(null);
  const [templateForm, setTemplateForm] = useState({
    title: "",
    description: "",
    type: "phishing" as "phishing" | "normal",
    firstMessage: "",
  });
  const [translationReady, setTranslationReady] = useState(false);
  const [translatedTemplates, setTranslatedTemplates] = useState<any[]>([]);
  const [translatedConversations, setTranslatedConversations] = useState<Conversation[]>([]);
  const [translatedScenario, setTranslatedScenario] = useState<{
    type: "phishing" | "normal";
    description: string;
    firstMessage?: string;
    variables?: {
      scenario_type: string;
      scenario_description: string;
    };
  } | null>(null);
  const [templateToDelete, setTemplateToDelete] = useState<string | null>(null);
  const [deletingTemplate, setDeletingTemplate] = useState(false);

  const conversation = useConversation({
    overrides: conversationOverrides,
    onConnect: () => {
      setLoading(false);
      setIsConnected(true);
    },
    onDisconnect: () => {
      setIsConnected(false);
    },
    onMessage: (message: any) => {
      if (typeof message === "string") {
        return;
      }

      const messageType = message.type || message.source || (message as any).role;
      let role: "user" | "agent" | null = null;
      let messageText = "";

      if (messageType === "user_transcript" || messageType === "user" || message.source === "user") {
        role = "user";
        messageText = message.message || message.text || message.content || message.transcript || "";
      } else if (messageType === "assistant_transcript" || messageType === "assistant" || messageType === "agent" || message.source === "assistant" || message.source === "agent") {
        role = "agent";
        messageText = message.message || message.text || message.content || message.transcript || "";
      } else {
        messageText = message.message || message.text || message.content || message.transcript || "";
        if (messageText) {
          role = "agent";
        }
      }

      if (role && messageText && messageText.trim()) {
        const newMessage: ConversationMessage = {
          role,
          message: messageText,
          timestamp: new Date(),
        };
        
        setMessages((prev) => {
          const exists = prev.some(
            (m) => 
              m.message.trim().toLowerCase() === newMessage.message.trim().toLowerCase() && 
              m.role === newMessage.role
          );
          if (!exists) {
            return [...prev, newMessage];
          }
          return prev;
        });

        if (conversationId) {
          setTimeout(() => {
            updateTranscriptOnBackend([newMessage]);
          }, 500);
        }
      }
    },
    onError: (error: any) => {
      console.error("Conversation error:", error);
      setError(error?.message || error?.toString() || t("An error occurred during the conversation"));
    },
  });

  const { isSpeaking } = conversation;

  useEffect(() => {
    const startSessionWithOverrides = async () => {
      if (!pendingStart || !conversationOverrides || !conversationOverrides.agent) {
        return;
      }

      if (!conversationOverrides.agent.variables && !conversationOverrides.agent.firstMessage) {
        return;
      }

      try {
        const elevenLabsConversationId = await conversation.startSession({
          agentId: pendingStart.agentId,
          connectionType: "webrtc",
          userId: pendingStart.userId,
        });
        
        if (elevenLabsConversationId && conversationId) {
          const token = await getToken();
          if (token) {
            const API_BASE_URL =
              process.env.NEXT_PUBLIC_API_URL || "http://localhost:5001/api";
            await fetch(
              `${API_BASE_URL}/voice-phishing/${conversationId}/transcript`,
              {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                  Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                  conversationId: elevenLabsConversationId,
                }),
              }
            );
          }
        }
        
        setPendingStart(null);
      } catch (error: any) {
        console.error("Failed to start session:", error);
        setError(error.message || t("Failed to start conversation"));
        setLoading(false);
        setPendingStart(null);
      }
    };

    startSessionWithOverrides();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [conversationOverrides, pendingStart]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (isLoaded && user) {
      fetchProfile();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoaded, user]);

  useEffect(() => {
    fetchConversationHistory();
  }, []);

  useEffect(() => {
    // Only fetch templates if user is an admin
    if (profile && (profile.role === "system_admin" || profile.role === "client_admin")) {
      fetchTemplates();
      fetchDefaultScenarios();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile]);

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
        // Page header
        "Voice Phishing Simulation",
        "Test your ability to resist phishing attempts through voice calls",
        
        // Status messages
        "Connecting...",
        "Calculating learning score...",
        "Call in progress...",
        "Ready to start",
        "Setting up your voice phishing simulation",
        "Analyzing your conversation and generating your learning score",
        "Listen carefully and respond to the caller",
        "Click the microphone to start a call",
        
        // Scenario types
        "Phishing Scenario",
        "Normal Scenario",
        "Phishing",
        "Normal",
        
        // Score labels
        "Not scored",
        "Excellent",
        "Good",
        "Fair",
        "Poor",
        "Very Poor",
        
        // Score details
        "Call Completed",
        "Fell for phishing attempt",
        "Resisted phishing attempt",
        "Provided sensitive information:",
        "Resistance Level:",
        
        // Buttons
        "Start New Call",
        "Transcript",
        "Conversation Transcript",
        "Waiting for conversation to start...",
        "Start a call to see the transcript here",
        "You",
        "Agent",
        
        // Templates section
        "Scenario Templates",
        "Create Template",
        "No templates found",
        "Create your first scenario template",
        "Available Templates",
        "Add these to your templates",
        "No default scenarios available",
        "Add",
        "Added",
        "Edit Template",
        "Delete Template",
        "Edit Template",
        "Create Template",
        "Title",
        "Enter template title",
        "Description",
        "Enter scenario description",
        "Type",
        "First Message",
        "Enter the first message the agent will say",
        "Update Template",
        "Cancel",
        
        // Call history
        "Call History",
        "No previous calls",
        "Your call history will appear here",
        
        // Error messages
        "Authentication required. Please log in again.",
        "Failed to initiate conversation",
        "Microphone access denied. Please allow microphone access.",
        "ElevenLabs agent ID not configured. Please set NEXT_PUBLIC_ELEVENLABS_AGENT_ID in your environment variables.",
        "Failed to start conversation",
        "Request timed out. The analysis is taking longer than expected. Please try again.",
        "Failed to end conversation. Please check your connection and try again.",
        "An error occurred during the conversation",
        "Are you sure you want to delete this template?",
        "Delete Template?",
        "This action cannot be undone.",
        "Deleting…",
        "Delete",
      ];

      await preTranslate(staticStrings);
      setTranslationReady(true);
    };

    preTranslatePageContent();
  }, [language, preTranslate]);

  // Translate dynamic template content when language or templates change
  useEffect(() => {
    if (language === "en" || templates.length === 0 || !translationReady) {
      setTranslatedTemplates(templates);
      return;
    }

    const translateTemplates = async () => {
      try {
        const textsToTranslate: string[] = [];
        const textMap: Array<{ type: string; templateIndex: number; field: string }> = [];

        templates.forEach((template, index) => {
          if (template.title) {
            textsToTranslate.push(template.title);
            textMap.push({ type: "title", templateIndex: index, field: "title" });
          }
          if (template.description) {
            textsToTranslate.push(template.description);
            textMap.push({ type: "description", templateIndex: index, field: "description" });
          }
          if (template.firstMessage) {
            textsToTranslate.push(template.firstMessage);
            textMap.push({ type: "firstMessage", templateIndex: index, field: "firstMessage" });
          }
        });

        if (textsToTranslate.length === 0) {
          setTranslatedTemplates(templates);
          return;
        }

        // Batch translate all texts
        const { translateService } = await import("@/services/translateService");
        const translatedTexts = await translateService.translateBatch(textsToTranslate);

        // Reconstruct templates with translated content
        const translated = templates.map((template, index) => {
          const titleIndex = textMap.findIndex(m => m.type === "title" && m.templateIndex === index);
          const descriptionIndex = textMap.findIndex(m => m.type === "description" && m.templateIndex === index);
          const firstMessageIndex = textMap.findIndex(m => m.type === "firstMessage" && m.templateIndex === index);

          return {
            ...template,
            title: titleIndex >= 0 ? translatedTexts[textsToTranslate.indexOf(template.title || "")] : template.title,
            description: descriptionIndex >= 0 ? translatedTexts[textsToTranslate.indexOf(template.description || "")] : template.description,
            firstMessage: firstMessageIndex >= 0 ? translatedTexts[textsToTranslate.indexOf(template.firstMessage || "")] : template.firstMessage,
          };
        });

        setTranslatedTemplates(translated);
      } catch (error) {
        console.error("Error translating templates:", error);
        setTranslatedTemplates(templates);
      }
    };

    translateTemplates();
  }, [templates, language, translationReady]);

  // Translate dynamic conversation history when language or conversations change
  useEffect(() => {
    if (language === "en" || conversationHistory.length === 0 || !translationReady) {
      setTranslatedConversations(conversationHistory);
      return;
    }

    const translateConversations = async () => {
      try {
        const textsToTranslate: string[] = [];
        const textMap: Array<{ type: string; convIndex: number }> = [];

        conversationHistory.forEach((conv, index) => {
          if (conv.scenarioDescription) {
            textsToTranslate.push(conv.scenarioDescription);
            textMap.push({ type: "scenarioDescription", convIndex: index });
          }
        });

        if (textsToTranslate.length === 0) {
          setTranslatedConversations(conversationHistory);
          return;
        }

        // Batch translate all texts
        const { translateService } = await import("@/services/translateService");
        const translatedTexts = await translateService.translateBatch(textsToTranslate);

        // Reconstruct conversations with translated content
        const translated = conversationHistory.map((conv, index) => {
          const descIndex = textMap.findIndex(m => m.type === "scenarioDescription" && m.convIndex === index);
          return {
            ...conv,
            scenarioDescription: descIndex >= 0 
              ? translatedTexts[textsToTranslate.indexOf(conv.scenarioDescription || "")]
              : conv.scenarioDescription,
          };
        });

        setTranslatedConversations(translated);
      } catch (error) {
        console.error("Error translating conversations:", error);
        setTranslatedConversations(conversationHistory);
      }
    };

    translateConversations();
  }, [conversationHistory, language, translationReady]);

  // Use translated data or fallback to original
  const displayTemplates = useMemo(() => {
    return language === "ur" && translatedTemplates.length > 0 ? translatedTemplates : templates;
  }, [translatedTemplates, templates, language]);

  const displayConversations = useMemo(() => {
    return language === "ur" && translatedConversations.length > 0 ? translatedConversations : conversationHistory;
  }, [translatedConversations, conversationHistory, language]);

  // Translate current scenario when language or scenario changes
  useEffect(() => {
    if (language === "en" || !scenario || !translationReady) {
      setTranslatedScenario(null);
      return;
    }

    const translateScenario = async () => {
      try {
        const textsToTranslate: string[] = [];
        if (scenario.description) {
          textsToTranslate.push(scenario.description);
        }
        if (scenario.firstMessage) {
          textsToTranslate.push(scenario.firstMessage);
        }

        if (textsToTranslate.length === 0) {
          setTranslatedScenario(null);
          return;
        }

        // Batch translate
        const { translateService } = await import("@/services/translateService");
        const translatedTexts = await translateService.translateBatch(textsToTranslate);

        setTranslatedScenario({
          ...scenario,
          description: scenario.description 
            ? translatedTexts[textsToTranslate.indexOf(scenario.description)]
            : scenario.description,
          firstMessage: scenario.firstMessage
            ? translatedTexts[textsToTranslate.indexOf(scenario.firstMessage)]
            : scenario.firstMessage,
        });
      } catch (error) {
        console.error("Error translating scenario:", error);
        setTranslatedScenario(null);
      }
    };

    translateScenario();
  }, [scenario, language, translationReady]);

  // Use translated scenario or fallback to original
  const displayScenario = useMemo(() => {
    return language === "ur" && translatedScenario ? translatedScenario : scenario;
  }, [translatedScenario, scenario, language]);

  const fetchTemplates = async () => {
    try {
      setLoadingTemplates(true);
      const token = await getToken();
      if (!token) return;

      const API_BASE_URL =
        process.env.NEXT_PUBLIC_API_URL || "http://localhost:5001/api";
      const response = await fetch(`${API_BASE_URL}/voice-phishing-templates`, {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setTemplates(data.data || []);
        }
      }
    } catch (error) {
      console.error("Failed to fetch templates:", error);
    } finally {
      setLoadingTemplates(false);
    }
  };

  const fetchDefaultScenarios = async () => {
    try {
      setLoadingDefaultScenarios(true);
      const token = await getToken();
      if (!token) return;

      const API_BASE_URL =
        process.env.NEXT_PUBLIC_API_URL || "http://localhost:5001/api";
      const response = await fetch(`${API_BASE_URL}/voice-phishing-templates/defaults`, {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setDefaultScenarios(data.data || []);
        }
      }
    } catch (error) {
      console.error("Failed to fetch default scenarios:", error);
    } finally {
      setLoadingDefaultScenarios(false);
    }
  };

  const handleCreateTemplate = () => {
    setEditingTemplate(null);
    setTemplateForm({
      title: "",
      description: "",
      type: "phishing",
      firstMessage: "",
    });
    setShowTemplateModal(true);
  };

  const handleEditTemplate = (template: any) => {
    setEditingTemplate(template);
    setTemplateForm({
      title: template.title,
      description: template.description,
      type: template.type,
      firstMessage: template.firstMessage,
    });
    setShowTemplateModal(true);
  };

  const handleDeleteTemplate = (templateId: string) => {
    setTemplateToDelete(templateId);
  };

  const confirmDeleteTemplate = async () => {
    if (!templateToDelete) return;

    try {
      setDeletingTemplate(true);
      const token = await getToken();
      if (!token) return;

      const API_BASE_URL =
        process.env.NEXT_PUBLIC_API_URL || "http://localhost:5001/api";
      const response = await fetch(
        `${API_BASE_URL}/voice-phishing-templates/${templateToDelete}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.ok) {
        await fetchTemplates();
        setTemplateToDelete(null);
      }
    } catch (error) {
      console.error("Failed to delete template:", error);
    } finally {
      setDeletingTemplate(false);
    }
  };

  const handleSaveTemplate = async () => {
    try {
      const token = await getToken();
      if (!token) return;

      const API_BASE_URL =
        process.env.NEXT_PUBLIC_API_URL || "http://localhost:5001/api";

      const url = editingTemplate
        ? `${API_BASE_URL}/voice-phishing-templates/${editingTemplate._id}`
        : `${API_BASE_URL}/voice-phishing-templates`;

      const response = await fetch(url, {
        method: editingTemplate ? "PUT" : "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(templateForm),
      });

      if (response.ok) {
        setShowTemplateModal(false);
        await fetchTemplates();
      }
    } catch (error) {
      console.error("Failed to save template:", error);
    }
  };

  const handleAddDefaultScenario = async (scenario: any) => {
    try {
      const token = await getToken();
      if (!token) return;

      const API_BASE_URL =
        process.env.NEXT_PUBLIC_API_URL || "http://localhost:5001/api";

      const response = await fetch(`${API_BASE_URL}/voice-phishing-templates`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          title: scenario.title,
          description: scenario.description,
          type: scenario.type,
          firstMessage: scenario.firstMessage,
        }),
      });

      if (response.ok) {
        await fetchTemplates();
      }
    } catch (error) {
      console.error("Failed to add default scenario:", error);
    }
  };

  // Check if a default scenario has already been added to templates
  const isDefaultScenarioAdded = (scenario: any) => {
    return templates.some(
      (template) =>
        template.description === scenario.description &&
        template.firstMessage === scenario.firstMessage &&
        template.type === scenario.type
    );
  };

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

  const fetchConversationHistory = async () => {
    try {
      const token = await getToken();
      if (!token) return;

      const API_BASE_URL =
        process.env.NEXT_PUBLIC_API_URL || "http://localhost:5001/api";
      const response = await fetch(`${API_BASE_URL}/voice-phishing`, {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success && data.data) {
          setConversationHistory(data.data.conversations || []);
        }
      }
      } catch (error) {
        // Silently fail - history is not critical
      }
  };

  const initiateConversation = async () => {
    try {
      setLoading(true);
      setError(null);
      setMessages([]);
      setScore(null);
      setScoreDetails(null);

      const token = await getToken();
      if (!token) {
        setError(t("Authentication required. Please log in again."));
        return;
      }

      // Get scenario from backend (for tracking and analysis)
      const API_BASE_URL =
        process.env.NEXT_PUBLIC_API_URL || "http://localhost:5001/api";
      const response = await fetch(`${API_BASE_URL}/voice-phishing/initiate`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          connectionType: "webrtc",
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || t("Failed to initiate conversation"));
      }

      setConversationId(data.data.conversationId);
      setScenario(data.data.scenario);
      setShowTranscript(true);

      try {
        await navigator.mediaDevices.getUserMedia({ audio: true });
      } catch (micError) {
        throw new Error(t("Microphone access denied. Please allow microphone access."));
      }

      const agentId = process.env.NEXT_PUBLIC_ELEVENLABS_AGENT_ID;
      
      if (!agentId) {
        throw new Error(t("ElevenLabs agent ID not configured. Please set NEXT_PUBLIC_ELEVENLABS_AGENT_ID in your environment variables."));
      }

      const overrides: any = {
        agent: {
          firstMessage: data.data.scenario.firstMessage,
          variables: {
            scenario_type: data.data.scenario.variables?.scenario_type || "",
            scenario_description: data.data.scenario.variables?.scenario_description || "",
          },
        },
      };
      
      setConversationOverrides(overrides);
      setPendingStart({
        agentId: agentId,
        userId: data.data.conversationId,
      });
    } catch (error: any) {
      console.error("Failed to initiate conversation:", error);
      setError(error.message || t("Failed to start conversation"));
      setLoading(false);
    }
  };

  const updateTranscriptOnBackend = async (newMessages: ConversationMessage[]) => {
    if (!conversationId) return;

    try {
      const token = await getToken();
      if (!token) return;

      const API_BASE_URL =
        process.env.NEXT_PUBLIC_API_URL || "http://localhost:5001/api";
      
      await fetch(
        `${API_BASE_URL}/voice-phishing/${conversationId}/transcript`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            messages: newMessages.map((m) => ({
              role: m.role,
              message: m.message,
            })),
            conversationId: conversation.getId(),
          }),
        }
      );
    } catch (error) {
      console.error("Failed to update transcript on backend:", error);
    }
  };

  const endConversation = async () => {
    try {
      if (!conversationId) return;

      // Set calculating score state
      setCalculatingScore(true);
      setError(null);
      setIsConnected(false); // Disconnect the call UI

      // End the ElevenLabs conversation
      await conversation.endSession();

      // End conversation on backend and get score
      const token = await getToken();
      if (!token) {
        setError(t("Authentication required. Please log in again."));
        setCalculatingScore(false);
        return;
      }

      const API_BASE_URL =
        process.env.NEXT_PUBLIC_API_URL || "http://localhost:5001/api";
      
      console.log("Ending conversation:", conversationId);
      
      // Add timeout and better error handling
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 120000); // 2 minute timeout
      
      try {
        const response = await fetch(
          `${API_BASE_URL}/voice-phishing/${conversationId}/end`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            signal: controller.signal,
          }
        );

        clearTimeout(timeoutId);

        if (!response.ok) {
          const errorText = await response.text();
          console.error("Backend error response:", errorText);
          throw new Error(`Server error: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();

        if (data.success) {
          setScore(data.data.score);
          setScoreDetails(data.data.scoreDetails);
          await fetchConversationHistory();
        } else {
          setError(data.message || "Failed to end conversation");
        }
      } catch (fetchError: any) {
        clearTimeout(timeoutId);
        if (fetchError.name === 'AbortError') {
          setError(t("Request timed out. The analysis is taking longer than expected. Please try again."));
        } else {
          throw fetchError;
        }
      } finally {
        setCalculatingScore(false);
      }
    } catch (error: any) {
      console.error("Failed to end conversation:", error);
      setError(error.message || t("Failed to end conversation. Please check your connection and try again."));
      setCalculatingScore(false);
    }
  };

  const cancelCall = () => {
    setConversationId(null);
    setScenario(null);
    setMessages([]);
    setScore(null);
    setScoreDetails(null);
    setError(null);
    setShowTranscript(false);
  };

  const getScoreColor = (score: number | null) => {
    if (score === null) return "text-gray-400";
    if (score >= 75) return "text-green-400";
    if (score >= 50) return "text-yellow-400";
    return "text-red-400";
  };

  const getScoreLabel = useCallback((score: number | null) => {
    if (score === null) return t("Not scored");
    if (score >= 90) return t("Excellent");
    if (score >= 75) return t("Good");
    if (score >= 50) return t("Fair");
    if (score >= 25) return t("Poor");
    return t("Very Poor");
  }, [t]);

  // Show loading state while profile is loading
  if (profileLoading) {
    return (
      <div className="flex flex-1 flex-col gap-6 p-6 pt-4 relative min-h-screen">
        <NetworkBackground />
        <div className="relative z-10 flex items-center justify-center min-h-screen">
          <div className="w-10 h-10 border-4 border-white border-t-transparent rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  // Check if user is admin (for templates section visibility)
  const isAdmin = profile && (profile.role === "system_admin" || profile.role === "client_admin");

  return (
    <div className="flex flex-1 flex-col gap-6 p-6 pt-4 relative min-h-screen">
      <NetworkBackground />
      {/* Blurred background element */}
      <div className="blurred-background"></div>

      {/* Page Header */}
      <div className="relative z-10">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 bg-[var(--neon-blue)] rounded-lg flex items-center justify-center">
            <Phone className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-[var(--dashboard-text-primary)] dark:text-white">{t("Voice Phishing Simulation")}</h1>
            <p className="text-[var(--dashboard-text-secondary)] dark:text-[var(--medium-grey)] text-sm">
              {t("Test your ability to resist phishing attempts through voice calls")}
            </p>
          </div>
        </div>
      </div>

      {/* Main Voice Chat Interface */}
      <div className="relative z-10 flex-1 flex flex-col items-center justify-center">
        <div className="w-full max-w-2xl mx-auto">
          {/* Voice Chat Card */}
          <div className="bg-[var(--navy-blue)]/80 backdrop-blur-xl rounded-3xl border border-[var(--neon-blue)]/20 p-8 md:p-12 shadow-2xl shadow-[var(--neon-blue)]/10">
            <div className="flex flex-col items-center justify-center space-y-8">
              
              {/* Show Orb and Controls only when call is not completed */}
              {score === null && (
                <>
                  {/* Glowing Orb */}
                  <div className="relative">
                    {/* Outer glow rings */}
                    <div className={`absolute inset-0 rounded-full blur-3xl scale-150 ${isConnected ? 'animate-pulse' : ''}`} style={{ background: 'radial-gradient(circle, rgba(81, 176, 236, 0.2) 0%, rgba(8, 66, 241, 0.15) 50%, transparent 70%)' }}></div>
                    <div className={`absolute inset-0 rounded-full blur-2xl scale-125 ${isConnected ? 'animate-pulse' : ''}`} style={{ background: 'radial-gradient(circle, rgba(0, 229, 222, 0.12) 0%, rgba(13, 13, 163, 0.1) 60%, transparent 80%)' }}></div>
                    
                    {/* Main orb */}
                    <div 
                      className={`relative w-32 h-32 md:w-40 md:h-40 rounded-full flex items-center justify-center overflow-hidden ${
                        isConnected ? 'animate-pulse' : ''
                      }`}
                      style={{
                        background: isConnected 
                          ? 'radial-gradient(circle at 30% 30%, #ff4444 0%, #cc0000 50%, #880000 100%)'
                          : '#050120',
                        boxShadow: isConnected
                          ? '0 0 60px rgba(255, 68, 68, 0.5), inset 0 0 60px rgba(255, 100, 100, 0.3)'
                          : '0 0 50px rgba(81, 176, 236, 0.3), 0 0 80px rgba(8, 66, 241, 0.2), inset 0 0 40px rgba(0, 229, 222, 0.1)',
                      }}
                    >
                      {/* Base gradient layer */}
                      {!isConnected && (
                        <div 
                          className="absolute inset-0 rounded-full"
                          style={{
                            background: `
                              radial-gradient(ellipse 140% 80% at 10% 40%, #0b076f 0%, transparent 50%),
                              radial-gradient(ellipse 120% 100% at 0% 60%, #050120 0%, transparent 40%),
                              radial-gradient(ellipse 100% 80% at 100% 50%, #00e5de 0%, #00b4d8 20%, transparent 50%),
                              radial-gradient(ellipse 80% 60% at 90% 70%, #00d4aa 0%, transparent 40%)
                            `,
                          }}
                        ></div>
                      )}
                      
                      {/* Mid layer - blues */}
                      {!isConnected && (
                        <div 
                          className="absolute inset-0 rounded-full"
                          style={{
                            background: `
                              radial-gradient(ellipse 100% 100% at 30% 30%, #0d0da3 0%, transparent 45%),
                              radial-gradient(ellipse 90% 70% at 50% 80%, #001ace 0%, #0842f1 20%, transparent 50%),
                              radial-gradient(ellipse 80% 90% at 20% 70%, #014efd 0%, transparent 40%)
                            `,
                          }}
                        ></div>
                      )}
                      
                      {/* Top layer - highlights and cyan */}
                      {!isConnected && (
                        <div 
                          className="absolute inset-0 rounded-full"
                          style={{
                            background: `
                              radial-gradient(ellipse 70% 50% at 75% 45%, rgba(0, 229, 222, 0.8) 0%, rgba(81, 176, 236, 0.4) 30%, transparent 60%),
                              radial-gradient(ellipse 50% 40% at 60% 55%, rgba(0, 180, 216, 0.6) 0%, transparent 50%),
                              radial-gradient(ellipse 60% 50% at 45% 50%, rgba(8, 66, 241, 0.5) 0%, rgba(1, 78, 253, 0.3) 30%, transparent 55%)
                            `,
                          }}
                        ></div>
                      )}
                      
                      {/* Accent layer - smooth transitions */}
                      {!isConnected && (
                        <div 
                          className="absolute inset-0 rounded-full"
                          style={{
                            background: `
                              radial-gradient(ellipse 40% 35% at 70% 35%, rgba(81, 176, 236, 0.6) 0%, transparent 70%),
                              radial-gradient(ellipse 50% 40% at 80% 60%, rgba(0, 229, 222, 0.5) 0%, transparent 60%),
                              radial-gradient(ellipse 35% 30% at 55% 40%, rgba(58, 124, 165, 0.4) 0%, transparent 70%)
                            `,
                          }}
                        ></div>
                      )}
                      
                      {/* Top highlight shimmer */}
                      {!isConnected && (
                        <div 
                          className="absolute rounded-full"
                          style={{
                            width: '45%',
                            height: '35%',
                            background: 'radial-gradient(ellipse at 50% 50%, rgba(171, 210, 235, 0.25) 0%, rgba(81, 176, 236, 0.15) 40%, transparent 70%)',
                            top: '12%',
                            right: '15%',
                          }}
                        ></div>
                      )}
                      
                      {/* Icon in center - only show for loading, calculating score, and connected states */}
                      {loading ? (
                        <div className="w-10 h-10 border-4 border-white border-t-transparent rounded-full animate-spin relative z-10" />
                      ) : calculatingScore ? (
                        <div className="w-10 h-10 border-4 border-white border-t-transparent rounded-full animate-spin relative z-10" />
                      ) : isConnected ? (
                        <Phone className="w-12 h-12 md:w-14 md:h-14 text-white/90 relative z-10" />
                      ) : null}
                    </div>
                  </div>

                  {/* Status Text */}
                  <div className="text-center space-y-2">
                    <h2 className="text-xl md:text-2xl font-semibold text-[var(--dashboard-text-primary)] dark:text-white">
                      {loading 
                        ? t("Connecting...") 
                        : calculatingScore 
                          ? t("Calculating learning score...") 
                          : isConnected 
                            ? t("Call in progress...") 
                            : t("Ready to start")}
                    </h2>
                    <p className="text-[var(--dashboard-text-secondary)] dark:text-[var(--light-blue)] text-sm md:text-base">
                      {loading 
                        ? t("Setting up your voice phishing simulation") 
                        : calculatingScore
                          ? t("Analyzing your conversation and generating your learning score")
                        : isConnected 
                          ? t("Listen carefully and respond to the caller") 
                          : t("Click the microphone to start a call")
                      }
                    </p>
                  </div>

                  {/* Scenario Info Badge - Only show for admins */}
                  {displayScenario && isAdmin && (
                    <div className="px-4 py-2 bg-[var(--navy-blue-lighter)]/80 rounded-full border border-[var(--neon-blue)]/30">
                      <div className="flex items-center gap-2">
                        {displayScenario.type === "phishing" ? (
                          <AlertTriangle className="w-4 h-4 text-yellow-400" />
                        ) : (
                          <CheckCircle className="w-4 h-4 text-green-400" />
                        )}
                        <span className="text-sm text-[var(--dashboard-text-primary)] dark:text-white">
                          {displayScenario.type === "phishing" ? t("Phishing Scenario") : t("Normal Scenario")}
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Control Buttons */}
                  <div className="flex items-center gap-4">
                    {/* Cancel/Close Button */}
                    {(isConnected || conversationId) && !calculatingScore && (
                      <button
                        onClick={isConnected ? endConversation : cancelCall}
                        className="w-14 h-14 rounded-full bg-gray-200 dark:bg-[var(--navy-blue-lighter)] border border-gray-300 dark:border-[var(--medium-grey)]/30 flex items-center justify-center hover:bg-gray-300 dark:hover:bg-[var(--navy-blue-lighter)]/80 transition-all hover:scale-105"
                      >
                        <X className="w-6 h-6 text-[var(--dashboard-text-primary)] dark:text-white" />
                      </button>
                    )}

                    {/* Main Action Button */}
                    {!isConnected && !conversationId && !calculatingScore && (
                      <button
                        onClick={initiateConversation}
                        disabled={loading}
                        className="w-16 h-16 rounded-full bg-[var(--neon-blue)] flex items-center justify-center hover:bg-[var(--medium-blue)] dark:hover:bg-[var(--neon-blue)]/80 transition-all hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-[var(--neon-blue)]/30"
                      >
                        <Mic className="w-7 h-7 text-white" />
                      </button>
                    )}

                    {/* End Call Button */}
                    {isConnected && !calculatingScore && (
                      <button
                        onClick={endConversation}
                        className="w-16 h-16 rounded-full bg-red-500 flex items-center justify-center hover:bg-red-600 transition-all hover:scale-105 shadow-lg shadow-red-500/30"
                      >
                        <PhoneOff className="w-7 h-7 text-white" />
                      </button>
                    )}
                  </div>
                </>
              )}

              {/* Error Display */}
              {error && (
                <div className="w-full max-w-md p-4 bg-red-500/20 border border-red-500/50 rounded-xl">
                  <p className="text-sm text-red-400 text-center">{error}</p>
                </div>
              )}

              {/* Score Display - Only shown when call is completed */}
              {score !== null && (
                <div className="w-full max-w-md p-6">
                  <div className="flex items-center justify-center mb-6">
                    <Trophy className="w-12 h-12 text-yellow-400" />
                  </div>
                  <div className="text-center">
                    <h3 className="text-xl font-semibold text-[var(--dashboard-text-primary)] dark:text-white mb-2">{t("Call Completed")}</h3>
                    <div className={`text-6xl font-bold mb-2 ${getScoreColor(score)}`}>
                      {score}
                    </div>
                    <div className="text-lg text-[var(--dashboard-text-secondary)] dark:text-[var(--medium-grey)] mb-6">
                      {getScoreLabel(score)}
                    </div>
                    {scoreDetails && (
                      <div className="text-left space-y-3 text-sm bg-[var(--navy-blue-lighter)]/50 rounded-xl p-4 mb-6">
                        <div className="flex items-center gap-2">
                          {scoreDetails.fellForPhishing ? (
                            <XCircle className="w-5 h-5 text-red-400" />
                          ) : (
                            <CheckCircle className="w-5 h-5 text-green-400" />
                          )}
                          <span className="text-[var(--dashboard-text-primary)] dark:text-white">
                            {scoreDetails.fellForPhishing
                              ? t("Fell for phishing attempt")
                              : t("Resisted phishing attempt")}
                          </span>
                        </div>
                        {scoreDetails.providedSensitiveInfo && (
                          <div className="text-red-400">
                            {t("Provided sensitive information:")}{" "}
                            {scoreDetails.sensitiveInfoTypes.join(", ")}
                          </div>
                        )}
                        <div className="text-[var(--dashboard-text-secondary)] dark:text-[var(--medium-grey)]">
                          {t("Resistance Level:")}{" "}
                          <span className="text-[var(--dashboard-text-primary)] dark:text-white capitalize">
                            {scoreDetails.resistanceLevel}
                          </span>
                        </div>
                        <div className="text-xs text-[var(--dashboard-text-secondary)] dark:text-[var(--medium-grey)] mt-2 pt-2 border-t border-gray-300 dark:border-[var(--medium-grey)]/20 leading-relaxed">
                          {formatMarkdown(scoreDetails.analysisRationale)}
                        </div>
                      </div>
                    )}
                  </div>
                  
                  {/* Start New Call Button */}
                  <button
                    onClick={cancelCall}
                    className="w-full px-6 py-4 bg-[var(--neon-blue)] text-white rounded-xl hover:bg-[var(--medium-blue)] dark:hover:bg-[var(--neon-blue)]/80 transition-colors font-semibold text-lg shadow-lg shadow-[var(--neon-blue)]/30"
                  >
                    {t("Start New Call")}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Default Scenarios Section - Only visible to admins */}
      {isAdmin && (
        <div className="relative z-10 mt-8">
          <div className="bg-[var(--navy-blue-light)]/95 backdrop-blur-sm rounded-3xl p-6 md:p-8">
            <div className="flex items-center gap-3 mb-6">
              <FileText className="w-6 h-6 text-[var(--neon-blue)]" />
              <h3 className="text-xl font-semibold text-[var(--dashboard-text-primary)] dark:text-white">{t("Available Templates")}</h3>
              <span className="text-sm text-[var(--dashboard-text-secondary)] dark:text-[var(--medium-grey)]">
                ({t("Add these to your templates")})
              </span>
            </div>

            {loadingDefaultScenarios ? (
              <div className="text-center py-12">
                <div className="w-10 h-10 border-4 border-white border-t-transparent rounded-full animate-spin mx-auto" />
              </div>
            ) : defaultScenarios.length === 0 ? (
              <div className="text-center py-12">
                <FileText className="w-16 h-16 text-[var(--dashboard-text-secondary)] dark:text-[var(--medium-grey)] mx-auto mb-4 opacity-50" />
                <p className="text-[var(--dashboard-text-secondary)] dark:text-[var(--medium-grey)]">{t("No default scenarios available")}</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {defaultScenarios.map((scenario) => {
                  const isAdded = isDefaultScenarioAdded(scenario);
                  return (
                    <div
                      key={scenario.id}
                      className="group relative overflow-hidden bg-[var(--navy-blue-lighter)]/80 dark:bg-[var(--navy-blue-lighter)]/80 rounded-2xl border border-[var(--neon-blue)]/10 dark:border-[var(--neon-blue)]/20 hover:border-[var(--neon-blue)]/40 dark:hover:border-[var(--neon-blue)]/50 transition-all duration-300 hover:shadow-lg hover:shadow-[var(--neon-blue)]/10 dark:hover:shadow-[var(--neon-blue)]/20 hover:-translate-y-1"
                    >
                      {/* Gradient accent bar */}
                      <div className={`absolute top-0 left-0 right-0 h-1 ${
                        scenario.type === "phishing"
                          ? "bg-gradient-to-r from-yellow-500/50 to-yellow-400/30"
                          : "bg-gradient-to-r from-green-500/50 to-green-400/30"
                      }`} />
                      
                      <div className="p-5">
                        {/* Header with badge and action */}
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex items-center gap-2">
                            <div className={`p-2 rounded-lg ${
                              scenario.type === "phishing"
                                ? "bg-yellow-500/10 dark:bg-yellow-500/20"
                                : "bg-green-500/10 dark:bg-green-500/20"
                            }`}>
                              {scenario.type === "phishing" ? (
                                <AlertTriangle className={`w-4 h-4 ${
                                  scenario.type === "phishing"
                                    ? "text-yellow-400"
                                    : "text-green-400"
                                }`} />
                              ) : (
                                <CheckCircle className="w-4 h-4 text-green-400" />
                              )}
                            </div>
                            <span
                              className={`text-xs px-2.5 py-1 rounded-full font-semibold ${
                                scenario.type === "phishing"
                                  ? "bg-yellow-500/20 text-yellow-400 border border-yellow-500/40 dark:border-yellow-500/50"
                                  : "bg-green-500/20 text-green-400 border border-green-500/40 dark:border-green-500/50"
                              }`}
                            >
                              {scenario.type === "phishing" ? t("Phishing") : t("Normal")}
                            </span>
                          </div>
                          {isAdded ? (
                            <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-green-500/20 dark:bg-green-500/30 text-green-400 border border-green-500/40 dark:border-green-500/50 text-xs font-medium">
                              <CheckCircle className="w-3.5 h-3.5" />
                              {t("Added")}
                            </span>
                          ) : (
                            <button
                              onClick={() => handleAddDefaultScenario(scenario)}
                              className="flex items-center gap-1.5 px-3 py-1.5 bg-[var(--neon-blue)] text-white rounded-lg hover:bg-[var(--medium-blue)] dark:hover:bg-[var(--neon-blue)]/90 transition-all duration-200 text-xs font-semibold shadow-sm hover:shadow-md hover:shadow-[var(--neon-blue)]/30"
                            >
                              <Plus className="w-3.5 h-3.5" />
                              {t("Add")}
                            </button>
                          )}
                        </div>

                        {/* Title */}
                        <h4 className="text-[var(--dashboard-text-primary)] dark:text-white font-bold text-base mb-3 line-clamp-1 group-hover:text-[var(--neon-blue)] dark:group-hover:text-[var(--neon-blue)] transition-colors">
                          {scenario.title}
                        </h4>

                        {/* Description */}
                        <p className="text-sm text-[var(--dashboard-text-secondary)] dark:text-[var(--medium-grey)] mb-4 line-clamp-2 leading-relaxed">
                          {scenario.description}
                        </p>

                        {/* First Message Preview */}
                        <div className="pt-4 border-t border-[var(--neon-blue)]/10 dark:border-[var(--neon-blue)]/20">
                          <div className="flex items-start gap-2">
                            <MessageSquare className="w-4 h-4 text-[var(--neon-blue)] mt-0.5 flex-shrink-0" />
                            <p className="text-xs text-[var(--dashboard-text-secondary)] dark:text-[var(--medium-grey)] italic line-clamp-2 leading-relaxed">
                              "{scenario.firstMessage}"
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Templates Management Section - Only visible to admins */}
      {isAdmin && (
        <div className="relative z-10 mt-8">
          <div className="bg-[var(--navy-blue-light)]/95 backdrop-blur-sm rounded-3xl p-6 md:p-8">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <FileText className="w-6 h-6 text-[var(--neon-blue)]" />
              <h3 className="text-xl font-semibold text-[var(--dashboard-text-primary)] dark:text-white">{t("Scenario Templates")}</h3>
            </div>
            <button
              onClick={handleCreateTemplate}
              className="flex items-center gap-2 px-4 py-2 bg-[var(--neon-blue)] text-white rounded-xl hover:bg-[var(--medium-blue)] dark:hover:bg-[var(--neon-blue)]/80 transition-colors"
            >
              <Plus className="w-5 h-5" />
              <span>{t("Create Template")}</span>
            </button>
          </div>

          {loadingTemplates ? (
            <div className="text-center py-12">
              <div className="w-10 h-10 border-4 border-white border-t-transparent rounded-full animate-spin mx-auto" />
            </div>
          ) : displayTemplates.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="w-16 h-16 text-[var(--dashboard-text-secondary)] dark:text-[var(--medium-grey)] mx-auto mb-4 opacity-50" />
              <p className="text-[var(--dashboard-text-secondary)] dark:text-[var(--medium-grey)]">{t("No templates found")}</p>
              <p className="text-[var(--dashboard-text-secondary)] dark:text-[var(--medium-grey)] text-sm mt-1">
                {t("Create your first scenario template")}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {displayTemplates.map((template) => (
                <div
                  key={template._id}
                  className="group relative overflow-hidden bg-[var(--navy-blue-lighter)]/80 dark:bg-[var(--navy-blue-lighter)]/80 rounded-2xl border border-[var(--neon-blue)]/10 dark:border-[var(--neon-blue)]/20 hover:border-[var(--neon-blue)]/40 dark:hover:border-[var(--neon-blue)]/50 transition-all duration-300 hover:shadow-lg hover:shadow-[var(--neon-blue)]/10 dark:hover:shadow-[var(--neon-blue)]/20 hover:-translate-y-1"
                >
                  {/* Gradient accent bar */}
                  <div className={`absolute top-0 left-0 right-0 h-1 ${
                    template.type === "phishing"
                      ? "bg-gradient-to-r from-yellow-500/50 to-yellow-400/30"
                      : "bg-gradient-to-r from-green-500/50 to-green-400/30"
                  }`} />
                  
                  <div className="p-5">
                    {/* Header with badge and actions */}
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-2">
                        <div className={`p-2 rounded-lg ${
                          template.type === "phishing"
                            ? "bg-yellow-500/10 dark:bg-yellow-500/20"
                            : "bg-green-500/10 dark:bg-green-500/20"
                        }`}>
                          {template.type === "phishing" ? (
                            <AlertTriangle className="w-4 h-4 text-yellow-400" />
                          ) : (
                            <CheckCircle className="w-4 h-4 text-green-400" />
                          )}
                        </div>
                        <span
                          className={`text-xs px-2.5 py-1 rounded-full font-semibold ${
                            template.type === "phishing"
                              ? "bg-yellow-500/20 text-yellow-400 border border-yellow-500/40 dark:border-yellow-500/50"
                              : "bg-green-500/20 text-green-400 border border-green-500/40 dark:border-green-500/50"
                          }`}
                        >
                          {template.type === "phishing" ? t("Phishing") : t("Normal")}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => handleEditTemplate(template)}
                          className="p-2 hover:bg-[var(--navy-blue)]/50 dark:hover:bg-[var(--navy-blue)]/80 rounded-lg transition-all duration-200 hover:scale-110 group/btn"
                          title={t("Edit Template")}
                        >
                          <Edit className="w-4 h-4 text-[var(--neon-blue)] group-hover/btn:text-[var(--medium-blue)] transition-colors" />
                        </button>
                        <button
                          onClick={() => handleDeleteTemplate(template._id)}
                          className="p-2 hover:bg-red-500/20 dark:hover:bg-red-500/30 rounded-lg transition-all duration-200 hover:scale-110 group/btn"
                          title={t("Delete Template")}
                        >
                          <Trash2 className="w-4 h-4 text-red-400 group-hover/btn:text-red-500 transition-colors" />
                        </button>
                      </div>
                    </div>

                    {/* Title */}
                    <h4 className="text-[var(--dashboard-text-primary)] dark:text-white font-bold text-base mb-3 line-clamp-1 group-hover:text-[var(--neon-blue)] dark:group-hover:text-[var(--neon-blue)] transition-colors">
                      {template.title}
                    </h4>

                    {/* Description */}
                    <p className="text-sm text-[var(--dashboard-text-secondary)] dark:text-[var(--medium-grey)] mb-4 line-clamp-2 leading-relaxed">
                      {template.description}
                    </p>

                    {/* First Message Preview */}
                    <div className="pt-4 border-t border-[var(--neon-blue)]/10 dark:border-[var(--neon-blue)]/20">
                      <div className="flex items-start gap-2">
                        <MessageSquare className="w-4 h-4 text-[var(--neon-blue)] mt-0.5 flex-shrink-0" />
                        <p className="text-xs text-[var(--dashboard-text-secondary)] dark:text-[var(--medium-grey)] italic line-clamp-2 leading-relaxed">
                          "{template.firstMessage}"
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        </div>
      )}

      {/* Call History Section */}
      <div className="relative z-10 mt-8">
        <div className="bg-[var(--navy-blue-light)]/95 backdrop-blur-sm rounded-3xl p-6 md:p-8">
          <div className="flex items-center gap-3 mb-6">
            <Clock className="w-6 h-6 text-[var(--neon-blue)]" />
            <h3 className="text-xl font-semibold text-[var(--dashboard-text-primary)] dark:text-white">{t("Call History")}</h3>
          </div>
          
          {displayConversations.length === 0 ? (
            <div className="text-center py-12">
              <Phone className="w-16 h-16 text-[var(--dashboard-text-secondary)] dark:text-[var(--medium-grey)] mx-auto mb-4 opacity-50" />
              <p className="text-[var(--dashboard-text-secondary)] dark:text-[var(--medium-grey)]">{t("No previous calls")}</p>
              <p className="text-[var(--dashboard-text-secondary)] dark:text-[var(--medium-grey)] text-sm mt-1">{t("Your call history will appear here")}</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {displayConversations.map((conv) => (
                <div
                  key={conv._id}
                  onClick={() => router.push(`/dashboard/voice-phishing/${conv._id}`)}
                  className="p-4 bg-[var(--navy-blue-lighter)]/80 rounded-xl border border-[var(--neon-blue)]/10 hover:border-[var(--neon-blue)]/30 transition-all cursor-pointer group hover:scale-[1.02]"
                >
                  <div className="flex items-center justify-between mb-3">
                    <span
                      className={`text-xs px-3 py-1 rounded-full font-medium ${
                        conv.scenarioType === "phishing"
                          ? "bg-yellow-500/20 text-yellow-400 border border-yellow-500/30"
                          : "bg-green-500/20 text-green-400 border border-green-500/30"
                      }`}
                    >
                      {conv.scenarioType === "phishing" ? t("Phishing") : t("Normal")}
                    </span>
                    {conv.score !== null && (
                      <span
                        className={`text-lg font-bold ${getScoreColor(conv.score)}`}
                      >
                        {conv.score}
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-[var(--dashboard-text-primary)] dark:text-white mb-2 line-clamp-2">
                    {conv.scenarioDescription}
                  </p>
                  <div className="flex items-center gap-2 text-xs text-[var(--dashboard-text-secondary)] dark:text-[var(--medium-grey)]">
                    <Clock className="w-3 h-3" />
                    <span>{new Date(conv.createdAt).toLocaleDateString()}</span>
                    {conv.duration > 0 && (
                      <>
                        <span>•</span>
                        <span>{Math.round(conv.duration / 60)}m {conv.duration % 60}s</span>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Transcript Button - Bottom Right (only show after call starts) */}
      {(isConnected || conversationId) && (
        <button
          onClick={() => setShowTranscript(!showTranscript)}
          className={`fixed bottom-6 right-6 z-50 flex items-center gap-2 px-4 py-3 rounded-full shadow-lg transition-all ${
            showTranscript
              ? 'bg-[var(--neon-blue)] text-white'
              : 'bg-gray-200 dark:bg-[var(--navy-blue-lighter)] text-[var(--dashboard-text-primary)] dark:text-white border border-gray-300 dark:border-[var(--neon-blue)]/30 hover:border-[var(--neon-blue)]'
          }`}
        >
          <MessageSquare className="w-5 h-5" />
          <span className="font-medium">{t("Transcript")}</span>
          {messages.length > 0 && (
            <span className="w-5 h-5 bg-[var(--neon-blue)] rounded-full text-xs flex items-center justify-center text-white">
              {messages.length}
            </span>
          )}
          {showTranscript ? (
            <ChevronDown className="w-4 h-4" />
          ) : (
            <ChevronUp className="w-4 h-4" />
          )}
        </button>
      )}

      {/* Transcript Panel */}
      {showTranscript && (isConnected || conversationId) && (
        <div className="fixed bottom-20 right-6 z-50 w-96 max-h-[60vh] bg-white dark:bg-[var(--navy-blue)]/95 backdrop-blur-xl rounded-2xl border border-gray-300 dark:border-[var(--neon-blue)]/30 shadow-2xl overflow-hidden">
          <div className="p-4 border-b border-gray-300 dark:border-[var(--neon-blue)]/20 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-[var(--neon-blue)]" />
              <h3 className="font-semibold text-[var(--dashboard-text-primary)] dark:text-white">{t("Conversation Transcript")}</h3>
            </div>
            <button
              onClick={() => setShowTranscript(false)}
              className="text-[var(--dashboard-text-secondary)] dark:text-[var(--medium-grey)] hover:text-[var(--dashboard-text-primary)] dark:hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          <div className="p-4 max-h-[50vh] overflow-y-auto space-y-3">
            {messages.length === 0 ? (
              <p className="text-sm text-[var(--dashboard-text-secondary)] dark:text-[var(--medium-grey)] text-center py-8">
                {isConnected
                  ? t("Waiting for conversation to start...")
                  : t("Start a call to see the transcript here")}
              </p>
            ) : (
              messages.map((msg, index) => (
                <div
                  key={index}
                  className={`flex ${
                    msg.role === "user" ? "justify-end" : "justify-start"
                  }`}
                >
                  <div
                    className={`max-w-[85%] p-3 rounded-2xl ${
                      msg.role === "user"
                        ? "bg-[var(--neon-blue)] text-white rounded-br-md"
                        : "bg-gray-100 dark:bg-[var(--navy-blue-lighter)] text-[var(--dashboard-text-primary)] dark:text-white rounded-bl-md"
                    }`}
                  >
                    <div className={`text-xs mb-1 ${
                      msg.role === "user" 
                        ? "opacity-70" 
                        : "text-[var(--dashboard-text-secondary)] dark:opacity-70"
                    }`}>
                      {msg.role === "user" ? t("You") : t("Agent")}
                    </div>
                    <div className={`text-sm ${
                      msg.role === "user" 
                        ? "text-white" 
                        : "text-[var(--dashboard-text-primary)] dark:text-white"
                    }`}>{msg.message}</div>
                  </div>
                </div>
              ))
            )}
            <div ref={messagesEndRef} />
          </div>
        </div>
      )}

      {/* Template Modal - Only visible to admins */}
      {showTemplateModal && isAdmin && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
          <div className="bg-[var(--dashboard-card-bg)] dark:bg-[var(--navy-blue)] rounded-3xl p-6 md:p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-[var(--dashboard-card-border)] dark:border-[var(--neon-blue)]/30">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-[var(--dashboard-text-primary)] dark:text-white">
                {editingTemplate ? t("Edit Template") : t("Create Template")}
              </h2>
              <button
                onClick={() => setShowTemplateModal(false)}
                className="text-[var(--dashboard-text-secondary)] dark:text-[var(--medium-grey)] hover:text-[var(--dashboard-text-primary)] dark:hover:text-white transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-[var(--dashboard-text-primary)] dark:text-white mb-2">{t("Title")}</label>
                <input
                  type="text"
                  value={templateForm.title}
                  onChange={(e) =>
                    setTemplateForm({ ...templateForm, title: e.target.value })
                  }
                  className="w-full px-4 py-2 bg-white dark:bg-[var(--navy-blue-lighter)] border border-gray-300 dark:border-[var(--neon-blue)]/30 rounded-xl text-[var(--dashboard-text-primary)] dark:text-white placeholder-[var(--dashboard-text-secondary)] dark:placeholder-[var(--medium-grey)] focus:outline-none focus:border-[var(--neon-blue)]"
                  placeholder={t("Enter template title")}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-[var(--dashboard-text-primary)] dark:text-white mb-2">{t("Description")}</label>
                <textarea
                  value={templateForm.description}
                  onChange={(e) =>
                    setTemplateForm({ ...templateForm, description: e.target.value })
                  }
                  className="w-full px-4 py-2 bg-white dark:bg-[var(--navy-blue-lighter)] border border-gray-300 dark:border-[var(--neon-blue)]/30 rounded-xl text-[var(--dashboard-text-primary)] dark:text-white placeholder-[var(--dashboard-text-secondary)] dark:placeholder-[var(--medium-grey)] focus:outline-none focus:border-[var(--neon-blue)]"
                  placeholder={t("Enter scenario description")}
                  rows={3}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-[var(--dashboard-text-primary)] dark:text-white mb-2">{t("Type")}</label>
                <select
                  value={templateForm.type}
                  onChange={(e) =>
                    setTemplateForm({
                      ...templateForm,
                      type: e.target.value as "phishing" | "normal",
                    })
                  }
                  className="w-full px-4 py-2 bg-white dark:bg-[var(--navy-blue-lighter)] border border-gray-300 dark:border-[var(--neon-blue)]/30 rounded-xl text-[var(--dashboard-text-primary)] dark:text-white focus:outline-none focus:border-[var(--neon-blue)]"
                >
                  <option value="phishing">{t("Phishing")}</option>
                  <option value="normal">{t("Normal")}</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-[var(--dashboard-text-primary)] dark:text-white mb-2">
                  {t("First Message")}
                </label>
                <textarea
                  value={templateForm.firstMessage}
                  onChange={(e) =>
                    setTemplateForm({ ...templateForm, firstMessage: e.target.value })
                  }
                  className="w-full px-4 py-2 bg-white dark:bg-[var(--navy-blue-lighter)] border border-gray-300 dark:border-[var(--neon-blue)]/30 rounded-xl text-[var(--dashboard-text-primary)] dark:text-white placeholder-[var(--dashboard-text-secondary)] dark:placeholder-[var(--medium-grey)] focus:outline-none focus:border-[var(--neon-blue)]"
                  placeholder={t("Enter the first message the agent will say")}
                  rows={4}
                />
              </div>

              <div className="flex items-center gap-4 pt-4">
                <button
                  onClick={handleSaveTemplate}
                  className="flex-1 px-6 py-3 bg-[var(--neon-blue)] text-white rounded-xl hover:bg-[var(--medium-blue)] dark:hover:bg-[var(--neon-blue)]/80 transition-colors font-semibold"
                >
                  {editingTemplate ? t("Update Template") : t("Create Template")}
                </button>
                <button
                  onClick={() => setShowTemplateModal(false)}
                  className="flex-1 px-6 py-3 bg-gray-200 dark:bg-[var(--navy-blue-lighter)] text-[var(--dashboard-text-primary)] dark:text-white rounded-xl hover:bg-gray-300 dark:hover:bg-[var(--navy-blue-lighter)]/80 transition-colors font-semibold border border-gray-300 dark:border-transparent"
                >
                  {t("Cancel")}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {templateToDelete && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
          <div className="bg-[var(--dashboard-card-bg)] dark:bg-[var(--navy-blue)] rounded-3xl p-6 md:p-8 max-w-md w-full border border-[var(--dashboard-card-border)] dark:border-[var(--neon-blue)]/30">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-[var(--dashboard-text-primary)] dark:text-white">{t("Delete Template?")}</h2>
              <button
                type="button"
                onClick={() => setTemplateToDelete(null)}
                disabled={deletingTemplate}
                className="text-[var(--dashboard-text-secondary)] dark:text-[var(--medium-grey)] hover:text-[var(--dashboard-text-primary)] dark:hover:text-white transition-colors disabled:opacity-50"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            <p className="text-[var(--dashboard-text-secondary)] dark:text-[var(--medium-grey)] mb-6">
              {t("Are you sure you want to delete this template?")} {t("This action cannot be undone.")}
            </p>
            <div className="flex items-center gap-4 pt-4">
              <button
                type="button"
                onClick={() => setTemplateToDelete(null)}
                disabled={deletingTemplate}
                className="flex-1 px-6 py-3 bg-gray-200 dark:bg-[var(--navy-blue-lighter)] text-[var(--dashboard-text-primary)] dark:text-white rounded-xl hover:bg-gray-300 dark:hover:bg-[var(--navy-blue-lighter)]/80 transition-colors font-semibold border border-gray-300 dark:border-transparent disabled:opacity-50"
              >
                {t("Cancel")}
              </button>
              <button
                type="button"
                onClick={confirmDeleteTemplate}
                disabled={deletingTemplate}
                className="flex-1 px-6 py-3 bg-red-500 text-white rounded-xl hover:bg-red-600 transition-colors font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {deletingTemplate ? t("Deleting…") : t("Delete")}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
