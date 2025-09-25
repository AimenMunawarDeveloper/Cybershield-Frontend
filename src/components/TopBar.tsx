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

  const firstName = user?.firstName || "User";

  return (
    <div className="flex flex-col">
      <span className="text-lg font-semibold text-gray-900">
        Hello {firstName}
      </span>
      <span className="text-sm" style={{ color: "var(--dark-grey)" }}>
        {formatTime(currentTime)} • {formatDate(currentTime)}
      </span>
    </div>
  );
}

// Component for search bar
function SearchBar() {
  const [searchQuery, setSearchQuery] = useState("");

  return (
    <div className="relative">
      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
      <Input
        type="text"
        placeholder="Search..."
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        className="pl-10 w-80 h-8 text-sm"
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
  const { isLoaded } = useAuth();

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
    <header className="flex justify-between items-center my-2 px-4 gap-4 h-12">
      <div className="flex items-center gap-4">
        {showSidebarTrigger && <SidebarTrigger className="-ml-1" />}
        {variant === "main" ? (
          <Image
            src="/images/CyberShield_logo_Final-removebg.png"
            alt="CyberShield Logo"
            width={200}
            height={60}
            className="h-12 w-full object-contain"
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
                    className="text-gray-700 hover:text-gray-900 font-medium"
                  >
                    Sign In
                  </Link>
                </NavigationMenuLink>
              </NavigationMenuItem>
              <NavigationMenuItem>
                <NavigationMenuLink asChild>
                  <Button
                    asChild
                    className="bg-navy-blue text-white rounded-md font-medium text-sm h-8 px-4 cursor-pointer flex items-center hover:bg-[#0f1a2a] transition-colors"
                  >
                    <Link href="/sign-up">Sign Up</Link>
                  </Button>
                </NavigationMenuLink>
              </NavigationMenuItem>
            </SignedOut>
            <SignedIn>
              <NavigationMenuItem>
                <Button
                  variant="ghost"
                  size="icon"
                  className="p-1.5 hover:bg-gray-100 rounded-full transition-colors h-8 w-8"
                >
                  <Bell className="h-4 w-4 text-gray-600" />
                </Button>
              </NavigationMenuItem>
              <NavigationMenuItem>
                <UserButton
                  afterSignOutUrl="/sign-in"
                  signInUrl="/sign-in"
                  appearance={{
                    elements: {
                      avatarBox: "w-7 h-7",
                      userButtonPopoverCard: "shadow-lg border border-gray-200",
                      userButtonPopoverActionButton: "hover:bg-gray-50",
                      userButtonPopoverActionButtonText: "text-gray-700",
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
