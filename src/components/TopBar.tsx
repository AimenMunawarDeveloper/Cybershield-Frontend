"use client";

import {
  SignedIn,
  SignedOut,
  UserButton,
  useUser,
  useAuth,
} from "@clerk/nextjs";
import Link from "next/link";
import { Bell, Search } from "lucide-react";
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
import { Input } from "@/components/ui/input";
import { SidebarTrigger } from "@/components/ui/sidebar";

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
    <div className="flex flex-col">
      <span className="text-lg font-semibold text-white">
        {t("Hello")} {firstName}
      </span>
      <span className="text-sm text-[var(--medium-grey)]">
        {formatTime(currentTime)} • {formatDate(currentTime)}
      </span>
    </div>
  );
}

// Component for search bar
function SearchBar() {
  const [searchQuery, setSearchQuery] = useState("");
  const { t } = useTranslation();

  return (
    <div className="relative">
      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-[var(--medium-grey)]" />
      <Input
        type="text"
        placeholder={t("Search...")}
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        className="pl-10 w-80 h-8 text-sm bg-[var(--navy-blue-lighter)] border-[var(--sidebar-border)] text-white placeholder-[var(--medium-grey)] focus:border-[var(--neon-blue)]"
      />
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

  // Don't render TopBar on dashboard pages when variant is "main" since it will be handled by dashboard layout
  if (variant === "main" && isDashboardPage) return null;

  // Show loading state while authentication is being determined
  if (!isLoaded) {
    return (
      <header className="flex justify-between items-center my-2 px-4 gap-4 h-12">
        <div className="flex items-center gap-4">
          {showSidebarTrigger && <SidebarTrigger className="-ml-1" />}
          <div className="h-12 w-48 bg-gray-200 animate-pulse rounded"></div>
        </div>
        <div className="flex items-center gap-4">
          {variant === "dashboard" && (
            <div className="h-8 w-80 bg-gray-200 animate-pulse rounded"></div>
          )}
          <div className="h-8 w-8 bg-gray-200 animate-pulse rounded-full"></div>
        </div>
      </header>
    );
  }

  return (
    <header
      className={`flex justify-between items-center gap-4 h-12 ${
        variant === "dashboard"
          ? "bg-transparent my-2 px-4"
          : isAuthPage
          ? "bg-white w-full px-4 py-4"
          : "bg-[var(--navy-blue)] my-2 px-4"
      }`}
    >
      <div className="flex items-center gap-4">
        {showSidebarTrigger && (
          <SidebarTrigger className="-ml-1 text-white hover:bg-[var(--navy-blue-lighter)]" />
        )}
        {variant === "main" ? (
          <Image
            src="/images/CyberShield_logo_Final-removebg.png"
            alt="CyberShield Logo"
            width={200}
            height={60}
            className={`h-12 w-full object-contain ${
              isAuthPage ? "brightness-0" : "brightness-0 invert"
            }`}
          />
        ) : (
          <UserGreeting />
        )}
      </div>

      {variant === "dashboard" && (
        <div className="flex-1 flex justify-center">
          <SearchBar />
        </div>
      )}

      <div className="flex items-center gap-4">
        <NavigationMenu className="flex items-center gap-4">
          <NavigationMenuList className="flex items-center gap-4">
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
                  className="p-1.5 hover:bg-[var(--navy-blue-lighter)] rounded-full transition-colors h-8 w-8"
                >
                  <Bell className="h-4 w-4 text-white" />
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
