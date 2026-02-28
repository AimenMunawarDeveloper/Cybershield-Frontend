"use client";

import { useState } from "react";
import { Globe, Check } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { Button } from "@/components/ui/button";

export default function LanguageToggle() {
  const { language, setLanguage } = useLanguage();
  const [showMenu, setShowMenu] = useState(false);

  const languages = [
    { code: "en", label: "English", flag: "🇬🇧" },
    { code: "ur", label: "اردو", flag: "🇵🇰" },
  ];

  const handleLanguageChange = (langCode: "en" | "ur") => {
    setLanguage(langCode);
    setShowMenu(false);
  };

  return (
    <div className="relative">
      <Button
        variant="ghost"
        size="icon"
        onClick={() => setShowMenu(!showMenu)}
        className="p-1.5 hover:bg-[var(--navy-blue-lighter)] rounded-full transition-colors h-8 w-8 relative"
        title={`Current language: ${language === "en" ? "English" : "Urdu"}`}
      >
        <Globe className="h-4 w-4 text-[var(--dashboard-text-primary)]" />
        {language === "ur" && (
          <span className="absolute -top-0.5 -right-0.5 h-2 w-2 bg-[var(--neon-blue)] rounded-full"></span>
        )}
      </Button>

      {showMenu && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-40"
            onClick={() => setShowMenu(false)}
          />

          {/* Dropdown Menu */}
          <div className="absolute right-0 mt-2 w-48 bg-[var(--navy-blue-light)] border border-[var(--sidebar-border)] rounded-lg shadow-xl z-50 overflow-hidden">
            <div className="py-1">
              {languages.map((lang) => (
                <button
                  key={lang.code}
                  onClick={() => handleLanguageChange(lang.code as "en" | "ur")}
                  className={`w-full px-4 py-2.5 text-left flex items-center justify-between hover:bg-[var(--navy-blue-lighter)] transition-colors ${
                    language === lang.code ? "bg-[var(--navy-blue-lighter)]" : ""
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-xl">{lang.flag}</span>
                    <span className="text-[var(--dashboard-text-primary)] text-sm font-medium">
                      {lang.label}
                    </span>
                  </div>
                  {language === lang.code && (
                    <Check className="h-4 w-4 text-[var(--neon-blue)]" />
                  )}
                </button>
              ))}
            </div>
            <div className="border-t border-[var(--sidebar-border)] px-4 py-2 bg-[var(--navy-blue)]">
              <p className="text-xs text-[var(--dashboard-text-secondary)]">
                {language === "en" ? "Language" : "زبان"}
              </p>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
