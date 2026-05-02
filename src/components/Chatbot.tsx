"use client";

import { useState, useRef, useEffect, useMemo, useCallback } from "react";
import { useAuth } from "@clerk/nextjs";
import { MessageSquare, X, Send, Minimize2, Bot, User } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { useTranslation } from "@/hooks/useTranslation";
import { useTheme } from "@/contexts/ThemeContext";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

// Format inline markdown (bold, italic, etc.)
function formatInlineMarkdown(text: string, isUserMessage: boolean): React.ReactElement[] {
  if (!text) return [<span key="empty"></span>];
  
  const parts: React.ReactElement[] = [];
  const segments: Array<{ type: 'text' | 'bold' | 'italic'; content: string; start: number; end: number }> = [];
  
  // Find all bold segments (**text**)
  const boldRegex = /\*\*(.+?)\*\*/g;
  let match: RegExpExecArray | null;
  while ((match = boldRegex.exec(text)) !== null) {
    segments.push({
      type: 'bold',
      content: match[1],
      start: match.index,
      end: match.index + match[0].length,
    });
  }
  
  // Find all italic segments (*text*) that aren't part of bold
  const italicRegex = /\*(.+?)\*/g;
  let italicMatch: RegExpExecArray | null;
  while ((italicMatch = italicRegex.exec(text)) !== null) {
    // Check if this is part of a bold segment
    const matchIndex = italicMatch.index;
    const matchEnd = matchIndex + italicMatch[0].length;
    const isPartOfBold = segments.some(
      (seg) => seg.type === 'bold' && matchIndex >= seg.start && matchIndex < seg.end
    );
    if (!isPartOfBold) {
      segments.push({
        type: 'italic',
        content: italicMatch[1],
        start: matchIndex,
        end: matchEnd,
      });
    }
  }
  
  // Sort segments by start position
  segments.sort((a, b) => a.start - b.start);
  
  // Build React elements
  let lastIndex = 0;
  let key = 0;
  
  segments.forEach((segment) => {
    // Add text before the segment
    if (segment.start > lastIndex) {
      parts.push(<span key={`text-${key++}`}>{text.substring(lastIndex, segment.start)}</span>);
    }
    
    // Add the formatted segment
    if (segment.type === 'bold') {
      parts.push(
        <strong 
          key={`bold-${key++}`} 
          className={isUserMessage ? "text-white font-semibold" : "text-gray-800 dark:text-white font-semibold"}
        >
          {segment.content}
        </strong>
      );
    } else if (segment.type === 'italic') {
      parts.push(
        <em 
          key={`italic-${key++}`} 
          className={isUserMessage ? "text-white" : "text-gray-800 dark:text-white"}
        >
          {segment.content}
        </em>
      );
    }
    
    lastIndex = segment.end;
  });
  
  // Add remaining text
  if (lastIndex < text.length) {
    parts.push(<span key={`text-${key++}`}>{text.substring(lastIndex)}</span>);
  }
  
  return parts.length > 0 ? parts : [<span key="text">{text}</span>];
}

// Format markdown text with support for paragraphs, lists, and inline formatting
function formatMarkdown(text: string, isUserMessage: boolean): React.ReactElement[] {
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
    
    // Check if it's a numbered list item (starts with number followed by period)
    if (/^\d+\.\s/.test(trimmedLine)) {
      const listContent = trimmedLine.replace(/^\d+\.\s/, '').trim();
      const formattedContent = formatInlineMarkdown(listContent, isUserMessage);
      const listNumber = trimmedLine.match(/^\d+\./)?.[0] || '';
      parts.push(
        <div key={`list-${lineIndex}`} className="flex items-start gap-2 my-1.5">
          <span className={isUserMessage ? "text-white/80 mt-0.5 flex-shrink-0" : "text-gray-600 dark:text-gray-300 mt-0.5 flex-shrink-0"}>
            {listNumber}
          </span>
          <span className="flex-1">{formattedContent}</span>
        </div>
      );
      return;
    }
    
    // Check if it's a list item (starts with - or * followed by space)
    if (/^[-*]\s/.test(trimmedLine)) {
      const listContent = trimmedLine.substring(2).trim();
      const formattedContent = formatInlineMarkdown(listContent, isUserMessage);
      parts.push(
        <div key={`list-${lineIndex}`} className="flex items-start gap-2 my-1.5">
          <span className={isUserMessage ? "text-white/80 mt-0.5 flex-shrink-0" : "text-gray-600 dark:text-gray-300 mt-0.5 flex-shrink-0"}>•</span>
          <span className="flex-1">{formattedContent}</span>
        </div>
      );
      return;
    }
    
    // Regular paragraph
    const formattedContent = formatInlineMarkdown(trimmedLine, isUserMessage);
    parts.push(
      <p key={`p-${lineIndex}`} className="mb-2 last:mb-0">
        {formattedContent}
      </p>
    );
  });
  
  return parts;
}

const STORAGE_KEY = "cybershield_chat_history";

// Helper to save messages to localStorage
const saveMessagesToStorage = (messages: Message[]) => {
  if (typeof window === "undefined") return;
  try {
    const serialized = messages.map((msg) => ({
      ...msg,
      timestamp: msg.timestamp.toISOString(),
    }));
    localStorage.setItem(STORAGE_KEY, JSON.stringify(serialized));
  } catch (error) {
    console.error("Failed to save messages to localStorage:", error);
  }
};

// Helper to load messages from localStorage
const loadMessagesFromStorage = (): Message[] | null => {
  if (typeof window === "undefined") return null;
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return null;
    const parsed = JSON.parse(stored);
    return parsed.map((msg: any) => ({
      ...msg,
      timestamp: new Date(msg.timestamp),
    }));
  } catch (error) {
    console.error("Failed to load messages from localStorage:", error);
    return null;
  }
};

const getInitialMessages = (language: "en" | "ur"): Message[] => {
  const stored = loadMessagesFromStorage();
  if (stored && stored.length > 0) {
    return stored;
  }
  const initialMessage = language === "ur"
    ? "ہیلو! میں سینٹرا ہوں، آپ کا سائبر شیلڈ اسسٹنٹ۔ میں آپ کی سائبرسیکیوریٹی کے سوالات میں کیسے مدد کر سکتا ہوں؟"
    : "Hello! I'm Sentra, your CyberShield assistant. How can I help you with cybersecurity questions today?";
  
  return [
    {
      id: "1",
      role: "assistant",
      content: initialMessage,
      timestamp: new Date(),
    },
  ];
};

export default function Chatbot() {
  const { language } = useLanguage();
  const { t, preTranslate, isTranslating } = useTranslation();
  const { theme } = useTheme();
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [translationReady, setTranslationReady] = useState(false);
  const [messages, setMessages] = useState<Message[]>(() => getInitialMessages(language));
  const [inputMessage, setInputMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const { getToken } = useAuth();

  // Pre-translate static strings when language changes
  useEffect(() => {
    const preTranslatePageContent = async () => {
      if (language === "en") {
        setTranslationReady(true);
        return;
      }

      setTranslationReady(false);

      const staticStrings = [
        "We typically reply in seconds",
        "Type your message...",
        "Sorry, I'm having trouble connecting right now. Please try again in a moment.",
        "Hello! I'm Sentra, your CyberShield assistant. How can I help you with cybersecurity questions today?",
      ];

      try {
        await preTranslate(staticStrings);
        setTranslationReady(true);
      } catch (error) {
        console.error("Error pre-translating chatbot content:", error);
        setTranslationReady(true);
      }
    };

    preTranslatePageContent();
  }, [language, preTranslate]);

  // Update messages when language changes - translate all existing messages
  useEffect(() => {
    const stored = loadMessagesFromStorage();
    const initialMessageEn = "Hello! I'm Sentra, your CyberShield assistant. How can I help you with cybersecurity questions today?";
    const initialMessageUr = "ہیلو! میں سینٹرا ہوں، آپ کا سائبر شیلڈ اسسٹنٹ۔ میں آپ کی سائبرسیکیوریٹی کے سوالات میں کیسے مدد کر سکتا ہوں؟";
    const correctInitialMessage = language === "ur" ? initialMessageUr : initialMessageEn;
    
    if (!stored || stored.length === 0) {
      // No stored messages - create new initial message
      const newMessage: Message = {
        id: "1",
        role: "assistant",
        content: correctInitialMessage,
        timestamp: new Date(),
      };
      setMessages([newMessage]);
      saveMessagesToStorage([newMessage]);
      return;
    }

    // Translate all messages when language changes
    const translateMessages = async () => {
      try {
        // Check if first message is the initial greeting
        const firstMessage = stored[0];
        const isInitialGreeting = firstMessage && firstMessage.id === "1" && firstMessage.role === "assistant";
        
        // Collect all messages that need translation
        const messagesToTranslate = stored.map((msg) => {
          // Handle initial greeting specially
          if (isInitialGreeting && msg.id === "1" && msg.role === "assistant") {
            return correctInitialMessage;
          }
          return msg.content;
        });

        // Translate all messages based on target language
        const { translateService } = await import("@/services/translateService");
        
        let translatedTexts: string[];
        
        if (language === "en") {
          // Check if messages contain Urdu characters (indicating they're in Urdu)
          const hasUrduChars = messagesToTranslate.some(text => 
            /[\u0600-\u06FF]/.test(text) && text !== initialMessageEn && text !== initialMessageUr
          );
          
          if (hasUrduChars) {
            // Messages are in Urdu, translate to English using Google Translate API directly
            // We'll use the translate method with auto-detection
            const API_KEY = process.env.NEXT_PUBLIC_GOOGLE_TRANSLATE_API_KEY || "";
            const textsNeedingTranslation = messagesToTranslate.map((text, index) => {
              // Handle initial greeting specially
              if (isInitialGreeting && index === 0 && text === initialMessageUr) {
                return null; // Will be handled separately
              }
              // Only translate if it contains Urdu characters
              return /[\u0600-\u06FF]/.test(text) ? text : null;
            });
            
            // Translate Urdu messages to English
            const urduTexts = textsNeedingTranslation.filter((t): t is string => t !== null);
            const translatedFromUrdu = urduTexts.length > 0 
              ? await Promise.all(
                  urduTexts.map(async (text) => {
                    try {
                      const response = await fetch(
                        `https://translation.googleapis.com/language/translate/v2?key=${encodeURIComponent(API_KEY)}`,
                        {
                          method: "POST",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({
                            q: [text],
                            target: "en",
                            source: "ur",
                            format: "text",
                          }),
                        }
                      );
                      const result = await response.json();
                      return result.data?.translations?.[0]?.translatedText || text;
                    } catch (error) {
                      console.error("Error translating from Urdu:", error);
                      return text;
                    }
                  })
                )
              : [];
            
            // Reconstruct messages with translations
            let urduIndex = 0;
            translatedTexts = messagesToTranslate.map((text, index) => {
              if (isInitialGreeting && index === 0 && text === initialMessageUr) {
                return correctInitialMessage;
              }
              if (textsNeedingTranslation[index] !== null) {
                return translatedFromUrdu[urduIndex++];
              }
              return text; // Already in English
            });
          } else {
            // Messages are already in English, just update initial greeting if needed
            translatedTexts = messagesToTranslate.map((text, index) => {
              if (isInitialGreeting && index === 0 && text === initialMessageUr) {
                return correctInitialMessage;
              }
              return text;
            });
          }
        } else {
          // Translate to Urdu
          translatedTexts = await translateService.translateBatch(messagesToTranslate);
          // Update initial greeting if needed
          if (isInitialGreeting && translatedTexts[0] !== correctInitialMessage) {
            translatedTexts[0] = correctInitialMessage;
          }
        }

        // Reconstruct messages with translated content
        const updatedMessages = stored.map((msg, index) => {
          // Handle initial greeting
          if (isInitialGreeting && index === 0 && msg.id === "1" && msg.role === "assistant") {
            return { ...msg, content: correctInitialMessage };
          }
          // Translate other messages
          return {
            ...msg,
            content: translatedTexts[index] || msg.content,
          };
        });

        setMessages(updatedMessages);
        saveMessagesToStorage(updatedMessages);
      } catch (error) {
        console.error("Error translating messages:", error);
        // On error, at least update the initial message
        const updatedMessages = stored.map((msg, index) => {
          if (index === 0 && msg.id === "1" && msg.role === "assistant") {
            return { ...msg, content: correctInitialMessage };
          }
          return msg;
        });
        setMessages(updatedMessages);
      }
    };

    translateMessages();
  }, [language]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  // Save messages to localStorage whenever they change
  useEffect(() => {
    if (messages.length > 0) {
      saveMessagesToStorage(messages);
    }
  }, [messages]);

  useEffect(() => {
    if (isOpen && !isMinimized) {
      scrollToBottom();
      // Focus input when chat opens
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
    }
  }, [messages, isOpen, isMinimized]);

  const sendMessage = async () => {
    if (!inputMessage.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: inputMessage.trim(),
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputMessage("");
    setIsLoading(true);

    try {
      const token = await getToken();
      if (!token) {
        throw new Error("Authentication required");
      }

      const API_BASE_URL =
        process.env.NEXT_PUBLIC_API_URL || "http://localhost:5001/api";

      // Build conversation history (last 10 messages for context)
      const conversationHistory = messages
        .slice(-10)
        .map((msg) => ({
          role: msg.role,
          content: msg.content,
        }));

      const response = await fetch(`${API_BASE_URL}/chat/message`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          message: userMessage.content,
          conversationHistory,
          language: language, // Send language preference to backend
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Failed to get response");
      }

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: data.data.message,
        timestamp: new Date(data.data.timestamp),
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error: any) {
      console.error("Error sending message:", error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: language === "ur" 
          ? t("Sorry, I'm having trouble connecting right now. Please try again in a moment.")
          : "Sorry, I'm having trouble connecting right now. Please try again in a moment.",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const toggleChat = () => {
    if (isOpen) {
      setIsMinimized(!isMinimized);
    } else {
      setIsOpen(true);
      setIsMinimized(false);
    }
  };

  const closeChat = () => {
    setIsOpen(false);
    setIsMinimized(false);
    // Clear conversation history when user explicitly closes chat
    const initialMessage = language === "ur"
      ? "ہیلو! میں سینٹرا ہوں، آپ کا سائبر شیلڈ اسسٹنٹ۔ میں آپ کی سائبرسیکیوریٹی کے سوالات میں کیسے مدد کر سکتا ہوں؟"
      : "Hello! I'm Sentra, your CyberShield assistant. How can I help you with cybersecurity questions today?";
    
    const message: Message = {
      id: "1",
      role: "assistant",
      content: initialMessage,
      timestamp: new Date(),
    };
    setMessages([message]);
    saveMessagesToStorage([message]);
  };

  return (
    <>
      {/* Chat Window */}
      {isOpen && (
        <div
          className={`fixed z-50 transition-all duration-300 ease-in-out max-sm:left-3 max-sm:right-3 sm:bottom-24 sm:right-6 ${
            isMinimized
              ? "bottom-[max(5.5rem,env(safe-area-inset-bottom,0px)+4.5rem)] h-[4.5rem] w-full max-w-md opacity-90 sm:left-auto sm:w-80"
              : "bottom-[max(5.5rem,env(safe-area-inset-bottom,0px)+4.5rem)] h-[min(600px,calc(100dvh-8rem))] w-full max-w-md opacity-100 sm:left-auto sm:h-[600px] sm:w-96"
          }`}
        >
          <div className="flex h-full min-h-0 flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-2xl dark:border-[var(--neon-blue)]/30 dark:bg-[var(--navy-blue-light)]">
            {/* Header */}
            <div className="flex shrink-0 items-center justify-between gap-2 rounded-t-2xl bg-gradient-to-r from-[var(--neon-blue)] to-[#3a8bc2] p-3 text-white shadow-lg dark:from-[var(--neon-blue)] dark:to-[#4fc3f7] dark:shadow-[var(--neon-blue)]/20 sm:p-4">
              <div className="flex min-w-0 items-center gap-2 sm:gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/20 dark:bg-white/10 sm:h-10 sm:w-10">
                  <Bot className="h-4 w-4 sm:h-5 sm:w-5" />
                </div>
                <div className="min-w-0">
                  <h3 className="truncate text-sm font-semibold">Sentra</h3>
                  <p className="truncate text-xs text-white/80 dark:text-white/70">{language === "ur" ? t("We typically reply in seconds") : "We typically reply in seconds"}</p>
                </div>
              </div>
              <div className="flex shrink-0 items-center gap-1 sm:gap-2">
                <button
                  type="button"
                  onClick={() => setIsMinimized(!isMinimized)}
                  className="rounded-lg p-2 transition-colors hover:bg-white/20 dark:hover:bg-white/10 sm:p-1.5"
                  aria-label={isMinimized ? "Expand" : "Minimize"}
                >
                  <Minimize2 className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={closeChat}
                  className="rounded-lg p-2 transition-colors hover:bg-white/20 dark:hover:bg-white/10 sm:p-1.5"
                  aria-label="Close"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Messages Container */}
            {!isMinimized && (
              <>
                <div className="min-h-0 flex-1 space-y-4 overflow-y-auto overscroll-contain bg-gray-50 p-3 dark:bg-[var(--navy-blue)] sm:p-4">
                  {messages.map((message) => (
                    <div
                      key={message.id}
                      className={`flex gap-3 ${
                        message.role === "user" ? "justify-end" : "justify-start"
                      }`}
                    >
                      {message.role === "assistant" && (
                        <div className="w-8 h-8 bg-[var(--neon-blue)] rounded-full flex items-center justify-center flex-shrink-0">
                          <Bot className="w-4 h-4 text-white" />
                        </div>
                      )}
                      <div
                        className={`max-w-[min(85%,20rem)] rounded-2xl px-3 py-2.5 sm:max-w-[75%] sm:px-4 ${
                          message.role === "user"
                            ? "rounded-br-md bg-[var(--neon-blue)] text-white"
                            : "rounded-bl-md border border-gray-200 bg-white text-gray-800 shadow-sm dark:border-[var(--neon-blue)]/30 dark:bg-[var(--navy-blue-lighter)] dark:text-white"
                        }`}
                      >
                        <div className="break-words text-sm leading-relaxed [overflow-wrap:anywhere]">
                          {formatMarkdown(message.content, message.role === "user")}
                        </div>
                        <span className="text-xs opacity-70 mt-1 block">
                          {message.timestamp.toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                      </div>
                      {message.role === "user" && (
                        <div className="w-8 h-8 bg-gray-200 dark:bg-[var(--navy-blue-lighter)] rounded-full flex items-center justify-center flex-shrink-0">
                          <User className="w-4 h-4 text-gray-600 dark:text-white" />
                        </div>
                      )}
                    </div>
                  ))}
                  {isLoading && (
                    <div className="flex gap-3 justify-start">
                      <div className="w-8 h-8 bg-[var(--neon-blue)] rounded-full flex items-center justify-center flex-shrink-0">
                        <Bot className="w-4 h-4 text-white" />
                      </div>
                      <div className="bg-white dark:bg-[var(--navy-blue-lighter)] border border-gray-200 dark:border-[var(--neon-blue)]/30 rounded-2xl rounded-bl-md px-4 py-2.5 shadow-sm">
                        <div className="flex gap-1">
                          <div className="w-2 h-2 bg-gray-400 dark:bg-gray-300 rounded-full animate-bounce" style={{ animationDelay: "0ms" }}></div>
                          <div className="w-2 h-2 bg-gray-400 dark:bg-gray-300 rounded-full animate-bounce" style={{ animationDelay: "150ms" }}></div>
                          <div className="w-2 h-2 bg-gray-400 dark:bg-gray-300 rounded-full animate-bounce" style={{ animationDelay: "300ms" }}></div>
                        </div>
                      </div>
                    </div>
                  )}
                  <div ref={messagesEndRef} />
                </div>

                {/* Input Area */}
                <div className="shrink-0 border-t border-gray-200 bg-white p-3 pb-[max(0.75rem,env(safe-area-inset-bottom,0px))] dark:border-[var(--neon-blue)]/30 dark:bg-[var(--navy-blue-light)] sm:p-4 sm:pb-4">
                  <div className="flex gap-2">
                    <input
                      ref={inputRef}
                      type="text"
                      value={inputMessage}
                      onChange={(e) => setInputMessage(e.target.value)}
                      onKeyPress={handleKeyPress}
                      placeholder={language === "ur" ? t("Type your message...") : "Type your message..."}
                      className="min-h-[44px] min-w-0 flex-1 rounded-xl border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 placeholder:text-gray-500 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-[var(--neon-blue)] dark:border-[var(--neon-blue)]/30 dark:bg-[var(--navy-blue-lighter)] dark:text-white dark:placeholder-gray-400 sm:min-h-0 sm:px-4 sm:py-2.5"
                      disabled={isLoading}
                    />
                    <button
                      type="button"
                      onClick={sendMessage}
                      disabled={!inputMessage.trim() || isLoading}
                      className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[var(--neon-blue)] text-white transition-colors hover:bg-[#3a8bc2] disabled:cursor-not-allowed disabled:opacity-50 sm:h-auto sm:w-auto sm:px-4 sm:py-2.5"
                      aria-label="Send"
                    >
                      <Send className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Floating Button */}
      <button
        type="button"
        onClick={toggleChat}
        className="group fixed bottom-[max(1rem,env(safe-area-inset-bottom,0px))] right-4 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-[var(--neon-blue)] text-white shadow-lg transition-all duration-300 hover:scale-110 hover:bg-[#3a8bc2] dark:bg-[var(--neon-blue)] dark:shadow-[var(--neon-blue)]/30 dark:hover:bg-[#4fc3f7] sm:bottom-6 sm:right-6"
        aria-label={isOpen ? "Toggle chat" : "Open chat"}
      >
        <MessageSquare className="h-6 w-6" />
      </button>
    </>
  );
}
