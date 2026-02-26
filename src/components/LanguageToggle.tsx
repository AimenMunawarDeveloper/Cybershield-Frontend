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
        className="p-1.5 hover:bg-muted rounded-full transition-colors h-8 w-8 relative"
        title={`Current language: ${language === "en" ? "English" : "Urdu"}`}
      >
        <Globe className="h-4 w-4 text-foreground" />
        {language === "ur" && (
          <span className="absolute -top-0.5 -right-0.5 h-2 w-2 bg-primary rounded-full"></span>
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
          <div className="absolute right-0 mt-2 w-48 bg-card border border-border rounded-lg shadow-xl z-50 overflow-hidden">
            <div className="py-1">
              {languages.map((lang) => (
                <button
                  key={lang.code}
                  onClick={() => handleLanguageChange(lang.code as "en" | "ur")}
                  className={`w-full px-4 py-2.5 text-left flex items-center justify-between hover:bg-muted transition-colors ${
                    language === lang.code ? "bg-muted" : ""
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-xl">{lang.flag}</span>
                    <span className="text-foreground text-sm font-medium">
                      {lang.label}
                    </span>
                  </div>
                  {language === lang.code && (
                    <Check className="h-4 w-4 text-primary" />
                  )}
                </button>
              ))}
            </div>
            <div className="border-t border-border px-4 py-2 bg-muted/50">
              <p className="text-xs text-muted-foreground">
                {language === "en" ? "Language" : "زبان"}
              </p>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
