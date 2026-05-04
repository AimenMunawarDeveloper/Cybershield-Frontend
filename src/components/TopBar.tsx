"use client";

import {
  SignedIn,
  SignedOut,
  UserButton,
  useUser,
  useAuth,
} from "@clerk/nextjs";
import Link from "next/link";
import { Moon, Sun } from "lucide-react";
import LanguageToggle from "@/components/LanguageToggle";
import { useTranslation } from "@/hooks/useTranslation";
import { usePathname } from "next/navigation";
import Image from "next/image";
import { useState, useEffect } from "react";
import {
  NavigationMenu,
  NavigationMenuList,
  NavigationMenuItem,
  NavigationMenuLink,
} from "@/components/ui/navigation-menu";
import { Button } from "@/components/ui/button";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { useTheme } from "@/contexts/ThemeContext";

interface TopBarProps {
  variant?: "main" | "dashboard";
  showSidebarTrigger?: boolean;
}

// Component for user greeting with time and date
function UserGreeting() {
  const { user } = useUser();
  const [currentTime, setCurrentTime] = useState(new Date());
  const { t } = useTranslation();

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const firstName = t(user?.firstName || "User");

  return (
    <div className="flex min-w-0 flex-col">
      <span className="truncate text-sm font-semibold sm:text-lg text-[var(--dashboard-text-primary)]">
        {t("Hello")} {firstName}
      </span>
      <span className="truncate text-[10px] leading-tight sm:text-sm text-[var(--dashboard-text-secondary)]">
        {formatTime(currentTime)}{" "}
        <span className="hidden sm:inline">• {formatDate(currentTime)}</span>
        <span className="sm:hidden">
          •{" "}
          {currentTime.toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
          })}
        </span>
      </span>
    </div>
  );
}

export default function TopBar({
  variant = "main",
  showSidebarTrigger = false,
}: TopBarProps) {
  const pathname = usePathname();
  const isDashboardPage = pathname.startsWith("/dashboard");
  const isAuthPage =
    pathname.startsWith("/sign-in") || pathname.startsWith("/sign-up");
  const { isLoaded } = useAuth();
  const { t } = useTranslation();
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === "dark";

  // Don't render TopBar on dashboard pages when variant is "main" since it will be handled by dashboard layout
  // IMPORTANT: All hooks must be called before any conditional returns to follow Rules of Hooks
  if (variant === "main" && isDashboardPage) {
    return null;
  }

  // Show loading state while authentication is being determined
  if (!isLoaded) {
    return (
      <header className="flex min-h-12 w-full flex-wrap items-center justify-between gap-2 px-2 py-2 sm:gap-3 sm:px-4 md:gap-4">
        <div className="flex min-w-0 flex-1 items-center gap-2 sm:gap-4">
          {showSidebarTrigger && <SidebarTrigger className="-ml-1 shrink-0" />}
          <div className="h-10 min-w-0 flex-1 max-w-[12rem] animate-pulse rounded bg-gray-200 sm:max-w-xs"></div>
        </div>
        <div className="flex shrink-0 items-center gap-2 sm:gap-4">
          <div className="h-8 w-8 shrink-0 animate-pulse rounded-full bg-gray-200"></div>
        </div>
      </header>
    );
  }

  return (
    <header
      className={`flex w-full min-h-12 flex-wrap items-center gap-x-2 gap-y-2 px-2 py-2 sm:gap-x-3 sm:px-4 md:gap-4 ${
        variant === "dashboard"
          ? "bg-[var(--navy-blue)] sm:my-2"
          : isAuthPage
          ? "w-full bg-white px-4 py-4"
          : "my-2 bg-[var(--navy-blue)] px-2 sm:px-4"
      }`}
    >
      <div className="flex min-w-0 flex-1 basis-[min(100%,14rem)] items-center gap-2 sm:gap-4 md:basis-auto md:flex-none">
        {showSidebarTrigger && (
          <SidebarTrigger className="-ml-1 shrink-0 text-white hover:bg-[var(--navy-blue-lighter)]" />
        )}
        {variant === "main" ? (
          <Image
            src="/images/CyberShield_logo_Final-removebg.png"
            alt="CyberShield Logo"
            width={200}
            height={60}
            className={`h-10 w-auto max-w-[min(100%,12rem)] object-contain sm:h-12 sm:max-w-none ${
              isAuthPage ? "brightness-0" : "brightness-0 invert"
            }`}
          />
        ) : (
          <UserGreeting />
        )}
      </div>

      <div className="ml-auto flex shrink-0 items-center gap-1 sm:gap-2 md:gap-4">
        <NavigationMenu className="max-w-none">
          <NavigationMenuList className="flex items-center gap-1 sm:gap-2 md:gap-4">
            <SignedOut>
              <NavigationMenuItem>
                <NavigationMenuLink asChild>
                  <Link
                    href="/sign-in"
                    className={`font-medium ${
                      isAuthPage
                        ? "text-[var(--navy-blue)] hover:text-[var(--neon-blue)]"
                        : "text-white hover:text-[var(--neon-blue)]"
                    }`}
                  >
                    {t("Sign In")}
                  </Link>
                </NavigationMenuLink>
              </NavigationMenuItem>
              <NavigationMenuItem>
                <NavigationMenuLink asChild>
                  <Button
                    asChild
                    className="bg-[var(--neon-blue)] text-[var(--navy-blue)] rounded-md font-medium text-sm h-8 px-4 cursor-pointer flex items-center hover:bg-[var(--electric-blue)] transition-colors"
                  >
                    <Link href="/sign-up">{t("Sign Up")}</Link>
                  </Button>
                </NavigationMenuLink>
              </NavigationMenuItem>
            </SignedOut>
            <SignedIn>
              <NavigationMenuItem>
                <LanguageToggle />
              </NavigationMenuItem>
              <NavigationMenuItem>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={toggleTheme}
                  className="p-1.5 hover:bg-[var(--navy-blue-lighter)] rounded-full transition-colors h-8 w-8"
                >
                  {isDark ? (
                    <Moon className="h-4 w-4 text-[var(--dashboard-text-primary)]" />
                  ) : (
                    <Sun className="h-4 w-4 text-[var(--dashboard-text-primary)]" />
                  )}
                </Button>
              </NavigationMenuItem>
              <NavigationMenuItem>
                <UserButton
                  afterSignOutUrl="/sign-in"
                  signInUrl="/sign-in"
                  appearance={{
                    elements: {
                      avatarBox: "w-7 h-7",
                      userButtonPopoverCard:
                        "shadow-lg border border-[var(--sidebar-border)] bg-[var(--navy-blue-light)]",
                      userButtonPopoverActionButton:
                        "hover:bg-[var(--navy-blue-lighter)]",
                      userButtonPopoverActionButtonText: "text-white",
                      userButtonPopoverFooter: "hidden",
                    },
                  }}
                />
              </NavigationMenuItem>
            </SignedIn>
          </NavigationMenuList>
        </NavigationMenu>
      </div>
    </header>
  );
}
