"use client";

import React, { createContext, useContext, useEffect, useState } from "react";

type Theme = "light" | "dark";

const STORAGE_KEY = "cybershield-theme";

interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<Theme>("light");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const stored = localStorage.getItem(STORAGE_KEY) as Theme | null;
    const prefersDark = typeof window !== "undefined" && window.matchMedia("(prefers-color-scheme: dark)").matches;
    const next: Theme = stored === "dark" || stored === "light" ? stored : prefersDark ? "dark" : "light";
    setThemeState(next);
    applyTheme(next);
  }, []);

  const applyTheme = (value: Theme) => {
    if (typeof document === "undefined") return;
    const root = document.documentElement;
    if (value === "dark") {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }
  };

  const setTheme = (value: Theme) => {
    setThemeState(value);
    localStorage.setItem(STORAGE_KEY, value);
    applyTheme(value);
  };

  const toggleTheme = () => {
    setTheme(theme === "dark" ? "light" : "dark");
  };

  // Prevent hydration mismatch: render with default until mounted
  const value: ThemeContextType = {
    theme: mounted ? theme : "light",
    setTheme,
    toggleTheme,
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (ctx === undefined) {
    throw new Error("useTheme must be used within ThemeProvider");
  }
  return ctx;
}
