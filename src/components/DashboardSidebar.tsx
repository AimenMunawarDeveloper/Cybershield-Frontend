"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useUser, useAuth } from "@clerk/nextjs";
import { useEffect, useState, Fragment } from "react";
import {
  BookOpen,
  BarChart3,
  Settings,
  HelpCircle,
  Home,
  AlertTriangle,
  Users,
  FileText,
  Trophy,
  MessageSquare,
  Building2,
  Building,
  Mail,
  Phone,
  ShieldAlert,
} from "lucide-react";

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuBadge,
} from "@/components/ui/sidebar";
import { ApiClient } from "@/lib/api";
import { useTranslation } from "@/hooks/useTranslation";

// This is sample data.
const data = {
  navMain: [
    {
      title: "Dashboard",
      url: "/dashboard",
      icon: Home,
      isActive: true,
    },
    {
      title: "Training Modules",
      url: "/dashboard/training-modules",
      icon: BookOpen,
      badge: "12",
    },
    {
      title: "Campaigns",
      url: "/dashboard/simulations",
      icon: AlertTriangle,
      badge: "3",
    },
    {
      title: "WhatsApp Phishing",
      url: "/dashboard/whatsapp-phishing",
      icon: MessageSquare,
    },
    {
      title: "Email Phishing",
      url: "/dashboard/email-phishing",
      icon: Mail,
    },
    {
      title: "Voice Phishing",
      url: "/dashboard/voice-phishing",
      icon: Phone,
    },
    {
      title: "Risk Analysis",
      url: "/dashboard/analysis",
      icon: BarChart3,
    },
    {
      title: "Certificates",
      url: "/dashboard/certificates",
      icon: Trophy,
    },
    {
      title: "Team Management",
      url: "/dashboard/team",
      icon: Users,
    },
    {
      title: "Reports",
      url: "/dashboard/reports",
      icon: FileText,
    },
    {
      title: "Incident Reporting",
      url: "/dashboard/incident-reporting",
      icon: ShieldAlert,
    },
    {
      title: "Settings",
      url: "/dashboard/settings",
      icon: Settings,
    },
  ],
  support: [
    {
      title: "Help & Support",
      url: "/dashboard/help",
      icon: HelpCircle,
    },
  ],
};

export function DashboardSidebar({
  ...props
}: React.ComponentProps<typeof Sidebar>) {
  const pathname = usePathname();
  const { user, isLoaded } = useUser();
  const { getToken } = useAuth();
  const [userRole, setUserRole] = useState<string | null>(null);
  const { t } = useTranslation();
  const isAdminRole =
    userRole === "system_admin" || userRole === "client_admin";

  useEffect(() => {
    const fetchUserProfile = async () => {
      if (isLoaded && user) {
        try {
          const apiClient = new ApiClient(getToken);
          const profile = await apiClient.getUserProfile();
          setUserRole(profile.role);
        } catch (err) {
          console.error("Failed to fetch user profile:", err);
        }
      }
    };

    fetchUserProfile();
  }, [isLoaded, user, getToken]);

  return (
    <Sidebar
      variant="inset"
      className="bg-[var(--navy-blue-light)] border-r border-[var(--sidebar-border)]"
      {...props}
    >
      <SidebarHeader className="bg-[var(--navy-blue-light)]">
        <div className="flex items-center justify-center px-2 py-2">
          <Image
            src="/images/CyberShield_logo_Final-removebg.png"
            alt="CyberShield Logo"
            width={180}
            height={60}
            className="h-12 w-auto object-contain brightness-0 invert"
          />
        </div>
        {/* Shiny line below logo */}
        <div className="mx-4 h-px bg-gradient-to-r from-transparent via-[var(--neon-blue)] to-transparent opacity-60"></div>
      </SidebarHeader>
      <SidebarContent className="bg-[var(--navy-blue-light)]">
        <SidebarGroup>
          <SidebarGroupLabel>{t("Platform")}</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {data.navMain.map((item, index) => {
                // Hide campaign-related items for non-admin roles
                const isCampaignNav =
                  item.url === "/dashboard/simulations" ||
                  item.url === "/dashboard/whatsapp-phishing" ||
                  item.url === "/dashboard/email-phishing";
                const isVoiceNav = item.url === "/dashboard/voice-phishing";

                if (isCampaignNav && !isAdminRole) {
                  return null;
                }

                return (
                  <Fragment key={item.title}>
                    <SidebarMenuItem className="mb-2">
                      {isVoiceNav ? (
                        <SidebarMenuButton
                          asChild
                          isActive={pathname === item.url}
                          tooltip={t(item.title)}
                        >
                          {/* Keep styling identical; block interaction without changing color */}
                          <Link
                            href={item.url}
                            tabIndex={-1}
                            className="pointer-events-none"
                          >
                            <div className="flex items-center justify-center w-8 h-8 rounded-full bg-[var(--neon-blue)]">
                              <item.icon className="w-4 h-4 text-white" />
                            </div>
                            <span>{t(item.title)}</span>
                            {item.badge && (
                              <SidebarMenuBadge>{item.badge}</SidebarMenuBadge>
                            )}
                          </Link>
                        </SidebarMenuButton>
                      ) : (
                        <SidebarMenuButton
                          asChild
                          isActive={pathname === item.url}
                          tooltip={t(item.title)}
                        >
                          <Link href={item.url}>
                            <div className="flex items-center justify-center w-8 h-8 rounded-full bg-[var(--neon-blue)]">
                              <item.icon className="w-4 h-4 text-white" />
                            </div>
                            <span>{t(item.title)}</span>
                            {item.badge && (
                              <SidebarMenuBadge>{item.badge}</SidebarMenuBadge>
                            )}
                          </Link>
                        </SidebarMenuButton>
                      )}
                    </SidebarMenuItem>

                  {/* Show Organizations/Organization right after Dashboard */}
                  {index === 0 && (
                    <>
                      {/* System Admin Only - Organizations Management */}
                      {userRole === "system_admin" && (
                        <SidebarMenuItem
                          key="organizations-mgmt"
                          className="mb-2"
                        >
                          <SidebarMenuButton
                            asChild
                            isActive={
                              pathname === "/dashboard/organizations-management"
                            }
                            tooltip={t("Organizations Management")}
                          >
                            <Link href="/dashboard/organizations-management">
                              <div className="flex items-center justify-center w-8 h-8 rounded-full bg-[var(--neon-blue)]">
                                <Building2 className="w-4 h-4 text-white" />
                              </div>
                              <span>{t("Organizations")}</span>
                            </Link>
                          </SidebarMenuButton>
                        </SidebarMenuItem>
                      )}

                      {/* Client Admin Only - Organization Management */}
                      {userRole === "client_admin" && (
                        <SidebarMenuItem
                          key="organization-mgmt"
                          className="mb-2"
                        >
                          <SidebarMenuButton
                            asChild
                            isActive={
                              pathname === "/dashboard/organization-management"
                            }
                            tooltip={t("Organization Management")}
                          >
                            <Link href="/dashboard/organization-management">
                              <div className="flex items-center justify-center w-8 h-8 rounded-full bg-[var(--neon-blue)]">
                                <Building className="w-4 h-4 text-white" />
                              </div>
                              <span>{t("Organization")}</span>
                            </Link>
                          </SidebarMenuButton>
                        </SidebarMenuItem>
                      )}
                    </>
                  )}
                </Fragment>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
        <SidebarGroup>
          <SidebarGroupLabel>{t("Support")}</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {data.support.map((item) => (
                <SidebarMenuItem key={item.title} className="mb-2">
                  <SidebarMenuButton
                    asChild
                    isActive={pathname === item.url}
                    tooltip={t(item.title)}
                  >
                    <Link href={item.url}>
                      <div className="flex items-center justify-center w-8 h-8 rounded-full bg-[var(--neon-blue)]">
                        <item.icon className="w-4 h-4 text-white" />
                      </div>
                      <span>{t(item.title)}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}