"use client";

import React, { createContext, useContext, useState, useEffect } from "react";

type Language = "en" | "ur";

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  isTranslating: boolean;
}

const LanguageContext = createContext<LanguageContextType | undefined>(
  undefined
);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<Language>("en");
  const [isTranslating, setIsTranslating] = useState(false);
  const [mounted, setMounted] = useState(false);

  // Load language from localStorage on mount
  useEffect(() => {
    setMounted(true);
    const savedLanguage = localStorage.getItem("app-language") as Language;
    if (savedLanguage === "en" || savedLanguage === "ur") {
      setLanguageState(savedLanguage);
    }
  }, []);

  const setLanguage = (lang: Language) => {
    setIsTranslating(true);
    setLanguageState(lang);
    localStorage.setItem("app-language", lang);
    
    // Reset translating state after a brief delay
    setTimeout(() => {
      setIsTranslating(false);
    }, 300);
  };

  // Always render the Provider to maintain consistent component tree structure
  // This prevents "Rendered more hooks than during the previous render" errors
  // The language will default to "en" until mounted and localStorage is read
  return (
    <LanguageContext.Provider value={{ language, setLanguage, isTranslating }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error("useLanguage must be used within a LanguageProvider");
  }
  return context;
}
