"use client";

import React, { useEffect, useState } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { translateService } from "@/services/translateService";

interface TransProps {
  children: string;
  as?: keyof React.JSX.IntrinsicElements;
  className?: string;
  [key: string]: any;
}

/**
 * Translation component that automatically translates text based on current language
 */
export default function Trans({
  children,
  as: Component = "span",
  className,
  ...props
}: TransProps) {
  const { language } = useLanguage();
  const [translatedText, setTranslatedText] = useState(children);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const translateText = async () => {
      if (language === "en") {
        setTranslatedText(children);
        return;
      }

      setIsLoading(true);
      try {
        const translated = await translateService.translateToUrdu(children);
        setTranslatedText(translated);
      } catch (error) {
        console.error("Translation error:", error);
        setTranslatedText(children);
      } finally {
        setIsLoading(false);
      }
    };

    translateText();
  }, [children, language]);

  return (
    <Component className={className} {...props}>
      {isLoading ? children : translatedText}
    </Component>
  );
}

/**
 * Hook for translating text in components
 */
export function useTranslate() {
  const { language } = useLanguage();
  const [cache] = useState(new Map<string, string>());

  const t = async (text: string): Promise<string> => {
    if (language === "en") return text;

    // Check cache
    if (cache.has(text)) {
      return cache.get(text)!;
    }

    try {
      const translated = await translateService.translateToUrdu(text);
      cache.set(text, translated);
      return translated;
    } catch (error) {
      console.error("Translation error:", error);
      return text;
    }
  };

  const tSync = (text: string): string => {
    if (language === "en") return text;
    return cache.get(text) || text;
  };

  return { t, tSync, language };
}
