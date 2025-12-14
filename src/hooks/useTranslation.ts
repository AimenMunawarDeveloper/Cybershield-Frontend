"use client";

import { useState, useEffect, useCallback } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { translateService } from "@/services/translateService";

/**
 * Hook for translating text in React components
 * 
 * Usage:
 * const { t, isTranslating } = useTranslation();
 * const translatedText = t("Hello World");
 */
export function useTranslation() {
  const { language } = useLanguage();
  const [translations, setTranslations] = useState<Map<string, string>>(new Map());
  const [isTranslating, setIsTranslating] = useState(false);
  const [pendingTranslations, setPendingTranslations] = useState<Set<string>>(new Set());

  useEffect(() => {
    // Clear translations when language changes to English
    if (language === "en") {
      setTranslations(new Map());
      setPendingTranslations(new Set());
      setIsTranslating(false);
    }
  }, [language]);

  /**
   * Translate text synchronously (returns from cache or triggers async translation)
   */
  const t = (text: string): string => {
    if (!text || language === "en") return text;

    // Check if already translated in local state
    if (translations.has(text)) {
      return translations.get(text)!;
    }

    // Check if in persistent cache (fast, synchronous)
    if (translateService.isCached(text)) {
      // Get from cache and update local state
      translateService.translateToUrdu(text).then((translated) => {
        setTranslations((prev) => {
          const newMap = new Map(prev);
          newMap.set(text, translated);
          return newMap;
        });
      });
      return text; // Return cached on next render
    }

    // Not cached - need to translate
    if (!pendingTranslations.has(text)) {
      setPendingTranslations((prev) => new Set(prev).add(text));
      setIsTranslating(true);

      // Trigger async translation
      translateService.translateToUrdu(text).then((translated) => {
        setTranslations((prev) => {
          const newMap = new Map(prev);
          newMap.set(text, translated);
          return newMap;
        });
        setPendingTranslations((prev) => {
          const newSet = new Set(prev);
          newSet.delete(text);
          if (newSet.size === 0) {
            setIsTranslating(false);
          }
          return newSet;
        });
      }).catch((error) => {
        console.error("Translation error:", error);
        setPendingTranslations((prev) => {
          const newSet = new Set(prev);
          newSet.delete(text);
          if (newSet.size === 0) {
            setIsTranslating(false);
          }
          return newSet;
        });
      });
    }

    // Return original text while translation is in progress
    return text;
  };

  /**
   * Translate text asynchronously (use in useEffect or event handlers)
   */
  const tAsync = async (text: string): Promise<string> => {
    if (!text || language === "en") return text;

    // Check if already translated
    if (translations.has(text)) {
      return translations.get(text)!;
    }

    try {
      const translated = await translateService.translateToUrdu(text);
      setTranslations((prev) => {
        const newMap = new Map(prev);
        newMap.set(text, translated);
        return newMap;
      });
      return translated;
    } catch (error) {
      console.error("Translation error:", error);
      return text;
    }
  };

  /**
   * Pre-translate multiple texts before rendering
   * Use this to avoid showing English text flash
   */
  const preTranslate = useCallback(async (texts: string[]): Promise<void> => {
    if (language === "en" || texts.length === 0) return;

    setIsTranslating(true);

    try {
      // Filter out already translated texts
      const textsToTranslate = texts.filter(text => 
        text && !translations.has(text) && !translateService.isCached(text)
      );

      if (textsToTranslate.length === 0) {
        setIsTranslating(false);
        return;
      }

      // Use batch translation for better performance
      const translatedTexts = await translateService.translateBatch(textsToTranslate);

      // Update local state with all translations
      setTranslations((prev) => {
        const newMap = new Map(prev);
        textsToTranslate.forEach((text, index) => {
          newMap.set(text, translatedTexts[index]);
        });
        return newMap;
      });
    } catch (error) {
      console.error("Pre-translation error:", error);
    } finally {
      setIsTranslating(false);
    }
  }, [language, translations]);

  return { t, tAsync, preTranslate, isTranslating, language };
}
