"use client";

import { useState, useEffect, useRef } from "react";
import { useAuth } from "@clerk/nextjs";
import { useConversation } from "@elevenlabs/react";
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
} from "lucide-react";

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

export default function VoicePhishingPage() {
  const { getToken } = useAuth();
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
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [conversationOverrides, setConversationOverrides] = useState<any>(undefined);
  const [pendingStart, setPendingStart] = useState<{
    agentId: string;
    userId: string;
  } | null>(null);

  const conversation = useConversation({
    overrides: conversationOverrides,
    onConnect: () => {
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
      setError(error?.message || error?.toString() || "An error occurred during the conversation");
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
        setError(error.message || "Failed to start conversation");
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
    fetchConversationHistory();
  }, []);

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
        setError("Authentication required. Please log in again.");
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
        throw new Error(data.message || "Failed to initiate conversation");
      }

      setConversationId(data.data.conversationId);
      setScenario(data.data.scenario);

      try {
        await navigator.mediaDevices.getUserMedia({ audio: true });
      } catch (micError) {
        throw new Error("Microphone access denied. Please allow microphone access.");
      }

      const agentId = process.env.NEXT_PUBLIC_ELEVENLABS_AGENT_ID;
      
      if (!agentId) {
        throw new Error("ElevenLabs agent ID not configured. Please set NEXT_PUBLIC_ELEVENLABS_AGENT_ID in your environment variables.");
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
      setError(error.message || "Failed to start conversation");
    } finally {
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

      // End the ElevenLabs conversation
      await conversation.endSession();

      // End conversation on backend and get score
      const token = await getToken();
      if (!token) return;

      const API_BASE_URL =
        process.env.NEXT_PUBLIC_API_URL || "http://localhost:5001/api";
      const response = await fetch(
        `${API_BASE_URL}/voice-phishing/${conversationId}/end`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();

      if (response.ok && data.success) {
        setScore(data.data.score);
        setScoreDetails(data.data.scoreDetails);
        await fetchConversationHistory();
      } else {
        setError(data.message || "Failed to end conversation");
      }
    } catch (error: any) {
      console.error("Failed to end conversation:", error);
      setError(error.message || "Failed to end conversation");
    }
  };

  const getScoreColor = (score: number | null) => {
    if (score === null) return "text-gray-400";
    if (score >= 75) return "text-green-400";
    if (score >= 50) return "text-yellow-400";
    return "text-red-400";
  };

  const getScoreLabel = (score: number | null) => {
    if (score === null) return "Not scored";
    if (score >= 90) return "Excellent";
    if (score >= 75) return "Good";
    if (score >= 50) return "Fair";
    if (score >= 25) return "Poor";
    return "Very Poor";
  };

  return (
    <div className="flex flex-1 flex-col gap-6 p-6 pt-4 relative">
      {/* Blurred background element */}
      <div className="blurred-background"></div>

      {/* Page Header */}
      <div className="relative z-10">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 bg-[var(--neon-blue)] rounded-lg flex items-center justify-center">
            <Phone className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">Voice Phishing Simulation</h1>
            <p className="text-[var(--medium-grey)] text-sm">
              Test your ability to resist phishing attempts through voice calls
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 relative z-10">
        {/* Main Call Interface */}
        <div className="lg:col-span-2 space-y-6">
          {/* Call Control Card */}
          <div className="dashboard-card rounded-lg p-6">
            <div className="flex flex-col items-center justify-center space-y-6">
              {/* Scenario Info */}
              {scenario && (
                <div className="w-full p-4 bg-[var(--navy-blue-lighter)] rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    {scenario.type === "phishing" ? (
                      <AlertTriangle className="w-5 h-5 text-yellow-400" />
                    ) : (
                      <CheckCircle className="w-5 h-5 text-green-400" />
                    )}
                    <span className="text-sm font-semibold text-white">
                      {scenario.type === "phishing" ? "Phishing Scenario" : "Normal Scenario"}
                    </span>
                  </div>
                  <p className="text-sm text-[var(--medium-grey)]">
                    {scenario.description}
                  </p>
                </div>
              )}

              {/* Call Button */}
              {!isConnected && !conversationId && (
                <button
                  onClick={initiateConversation}
                  disabled={loading}
                  className="w-24 h-24 bg-[var(--neon-blue)] rounded-full flex items-center justify-center hover:bg-[var(--neon-blue-dark)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <div className="w-8 h-8 border-4 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <Mic className="w-10 h-10 text-white" />
                  )}
                </button>
              )}

              {/* Active Call Controls */}
              {isConnected && (
                <div className="flex flex-col items-center space-y-4">
                  <div className="w-24 h-24 bg-red-500 rounded-full flex items-center justify-center animate-pulse">
                    <Phone className="w-10 h-10 text-white" />
                  </div>
                  <p className="text-sm text-[var(--medium-grey)]">
                    Call in progress...
                  </p>
                  <button
                    onClick={endConversation}
                    className="px-6 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors flex items-center gap-2"
                  >
                    <PhoneOff className="w-4 h-4" />
                    End Call
                  </button>
                </div>
              )}

              {/* Score Display */}
              {score !== null && (
                <div className="w-full p-6 bg-[var(--navy-blue-lighter)] rounded-lg">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-white">Your Score</h3>
                    <Trophy className="w-6 h-6 text-yellow-400" />
                  </div>
                  <div className="text-center">
                    <div className={`text-5xl font-bold mb-2 ${getScoreColor(score)}`}>
                      {score}
                    </div>
                    <div className="text-sm text-[var(--medium-grey)] mb-4">
                      {getScoreLabel(score)}
                    </div>
                    {scoreDetails && (
                      <div className="text-left space-y-2 text-sm">
                        <div className="flex items-center gap-2">
                          {scoreDetails.fellForPhishing ? (
                            <XCircle className="w-4 h-4 text-red-400" />
                          ) : (
                            <CheckCircle className="w-4 h-4 text-green-400" />
                          )}
                          <span className="text-white">
                            {scoreDetails.fellForPhishing
                              ? "Fell for phishing attempt"
                              : "Resisted phishing attempt"}
                          </span>
                        </div>
                        {scoreDetails.providedSensitiveInfo && (
                          <div className="text-red-400">
                            Provided sensitive information:{" "}
                            {scoreDetails.sensitiveInfoTypes.join(", ")}
                          </div>
                        )}
                        <div className="text-[var(--medium-grey)]">
                          Resistance Level:{" "}
                          <span className="text-white capitalize">
                            {scoreDetails.resistanceLevel}
                          </span>
                        </div>
                        <div className="text-xs text-[var(--medium-grey)] mt-2">
                          {scoreDetails.analysisRationale}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {error && (
                <div className="w-full p-4 bg-red-500/20 border border-red-500 rounded-lg">
                  <p className="text-sm text-red-400">{error}</p>
                </div>
              )}
            </div>
          </div>

          {/* Transcript Card */}
          <div className="dashboard-card rounded-lg p-6">
            <div className="flex items-center gap-2 mb-4">
              <MessageSquare className="w-5 h-5 text-[var(--neon-blue)]" />
              <h3 className="text-lg font-semibold text-white">Conversation Transcript</h3>
            </div>
            <div className="max-h-96 overflow-y-auto space-y-3">
              {messages.length === 0 ? (
                <p className="text-sm text-[var(--medium-grey)] text-center py-8">
                  {isConnected
                    ? "Waiting for conversation to start..."
                    : "Start a call to see the transcript here"}
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
                      className={`max-w-[80%] p-3 rounded-lg ${
                        msg.role === "user"
                          ? "bg-[var(--neon-blue)] text-white"
                          : "bg-[var(--navy-blue-lighter)] text-white"
                      }`}
                    >
                      <div className="text-xs text-opacity-70 mb-1">
                        {msg.role === "user" ? "You" : "Agent"}
                      </div>
                      <div className="text-sm">{msg.message}</div>
                    </div>
                  </div>
                ))
              )}
              <div ref={messagesEndRef} />
            </div>
          </div>
        </div>

        {/* Conversation History Sidebar */}
        <div className="space-y-6">
          <div className="dashboard-card rounded-lg p-6">
            <h3 className="text-lg font-semibold text-white mb-4">
              Conversation History
            </h3>
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {conversationHistory.length === 0 ? (
                <p className="text-sm text-[var(--medium-grey)] text-center py-4">
                  No previous conversations
                </p>
              ) : (
                conversationHistory.map((conv) => (
                  <div
                    key={conv._id}
                    className="p-3 bg-[var(--navy-blue-lighter)] rounded-lg cursor-pointer hover:bg-[var(--navy-blue-lighter)]/80 transition-colors"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span
                        className={`text-xs px-2 py-1 rounded-full ${
                          conv.scenarioType === "phishing"
                            ? "bg-yellow-500/20 text-yellow-400"
                            : "bg-green-500/20 text-green-400"
                        }`}
                      >
                        {conv.scenarioType}
                      </span>
                      {conv.score !== null && (
                        <span
                          className={`text-sm font-semibold ${getScoreColor(conv.score)}`}
                        >
                          {conv.score}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-[var(--medium-grey)] mb-1">
                      {conv.scenarioDescription}
                    </p>
                    <p className="text-xs text-[var(--medium-grey)]">
                      {new Date(conv.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

