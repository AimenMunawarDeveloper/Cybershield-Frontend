"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useUser, useAuth } from "@clerk/nextjs";
import { useEffect, useState, Fragment } from "react";
import {
  BookOpen,
  Home,
  AlertTriangle,
  FileText,
  Trophy,
  MessageSquare,
  Building2,
  Building,
  Mail,
  Phone,
  ShieldAlert,
  Medal,
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
  useSidebar,
} from "@/components/ui/sidebar";
import { ApiClient } from "@/lib/api";
import { useTranslation } from "@/hooks/useTranslation";

// Nav items; badge for Training Modules and Campaigns is filled from API counts.
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
    },
    {
      title: "Campaigns",
      url: "/dashboard/simulations",
      icon: AlertTriangle,
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
      title: "Certificates",
      url: "/dashboard/certificates",
      icon: Trophy,
    },
    {
      title: "Leaderboards",
      url: "/dashboard/leaderboards",
      icon: Medal,
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
  ],
};

export function DashboardSidebar({
  ...props
}: React.ComponentProps<typeof Sidebar>) {
  const pathname = usePathname();
  const { isMobile, setOpenMobile } = useSidebar();
  const { user, isLoaded } = useUser();
  const { getToken } = useAuth();
  const [userRole, setUserRole] = useState<string | null>(null);
  const [trainingModulesCount, setTrainingModulesCount] = useState<number | null>(null);
  const [campaignsCount, setCampaignsCount] = useState<number | null>(null);
  const { t } = useTranslation();
  const isAdminRole =
    userRole === "system_admin" || userRole === "client_admin";

  const closeMobileSidebar = () => {
    if (isMobile) setOpenMobile(false);
  };

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

  // Fetch training modules (courses) count for the current user
  useEffect(() => {
    if (!isLoaded || !user) return;
    const apiClient = new ApiClient(getToken);
    apiClient
      .getCourses({ limit: 1000 })
      .then((res) => {
        const count = res.success && Array.isArray(res.courses) ? res.courses.length : 0;
        setTrainingModulesCount(count);
      })
      .catch(() => setTrainingModulesCount(0));
  }, [isLoaded, user, getToken]);

  // Fetch campaigns count for admins only (same logic as dashboard)
  useEffect(() => {
    if (!isLoaded || !user || !isAdminRole) {
      if (!isAdminRole) setCampaignsCount(0);
      return;
    }
    const apiClient = new ApiClient(getToken);
    Promise.all([
      apiClient.getCampaigns(1, 1000).catch(() => ({ success: false, data: { campaigns: [] } })),
      apiClient.getWhatsAppCampaigns(1, 1000).catch(() => ({ success: false, data: { campaigns: [] } })),
    ])
      .then(([emailRes, whatsappRes]) => {
        const email = emailRes.success && emailRes.data?.campaigns ? emailRes.data.campaigns : [];
        const whatsapp = whatsappRes.success && whatsappRes.data?.campaigns ? whatsappRes.data.campaigns : [];
        const standaloneWhatsapp = whatsapp.filter(
          (c: Record<string, unknown>) => !(c as { managedByParentCampaign?: boolean }).managedByParentCampaign
        );
        setCampaignsCount(email.length + standaloneWhatsapp.length);
      })
      .catch(() => setCampaignsCount(0));
  }, [isLoaded, user, getToken, isAdminRole]);

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
            className="h-10 w-auto max-w-[min(100%,11rem)] object-contain sm:h-12 sm:max-w-none sidebar-logo"
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

                // Hide Reports for non-admin roles
                const isReportsNav = item.url === "/dashboard/reports";

                if ((isCampaignNav || isReportsNav) && !isAdminRole) {
                  return null;
                }

                // Dynamic badge: Training Modules and Campaigns use API counts; others use item.badge
                const badgeValue =
                  item.url === "/dashboard/training-modules"
                    ? trainingModulesCount
                    : item.url === "/dashboard/simulations"
                      ? campaignsCount
                      : (item as { badge?: string }).badge;
                const showBadge =
                  badgeValue !== undefined && badgeValue !== null;

                return (
                  <Fragment key={item.title}>
                    <SidebarMenuItem className="mb-2">
                      <SidebarMenuButton
                        asChild
                        isActive={pathname === item.url}
                        tooltip={t(item.title)}
                      >
                        <Link href={item.url} onClick={closeMobileSidebar}>
                          <div className="flex items-center justify-center w-8 h-8 rounded-full bg-[var(--neon-blue)]">
                            <item.icon className="w-4 h-4 text-white" />
                          </div>
                          <span>{t(item.title)}</span>
                          {showBadge && (
                            <SidebarMenuBadge>
                              {typeof badgeValue === "number"
                                ? String(badgeValue)
                                : badgeValue}
                            </SidebarMenuBadge>
                          )}
                        </Link>
                      </SidebarMenuButton>
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
                            <Link
                              href="/dashboard/organizations-management"
                              onClick={closeMobileSidebar}
                            >
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
                            <Link
                              href="/dashboard/organization-management"
                              onClick={closeMobileSidebar}
                            >
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
      </SidebarContent>
    </Sidebar>
  );
}