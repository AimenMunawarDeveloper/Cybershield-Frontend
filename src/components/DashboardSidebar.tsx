"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
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
      title: "Learning Modules",
      url: "/dashboard/learning",
      icon: BookOpen,
      badge: "12",
    },
    {
      title: "Phishing Simulations",
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
          <SidebarGroupLabel>Platform</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {data.navMain.map((item) => (
                <SidebarMenuItem key={item.title} className="mb-2">
                  <SidebarMenuButton
                    asChild
                    isActive={pathname === item.url}
                    tooltip={item.title}
                  >
                    <Link href={item.url}>
                      <div className="flex items-center justify-center w-8 h-8 rounded-full bg-[var(--neon-blue)]">
                        <item.icon className="w-4 h-4 text-white" />
                      </div>
                      <span>{item.title}</span>
                      {item.badge && (
                        <SidebarMenuBadge>{item.badge}</SidebarMenuBadge>
                      )}
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
        <SidebarGroup>
          <SidebarGroupLabel>Support</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {data.support.map((item) => (
                <SidebarMenuItem key={item.title} className="mb-2">
                  <SidebarMenuButton
                    asChild
                    isActive={pathname === item.url}
                    tooltip={item.title}
                  >
                    <Link href={item.url}>
                      <div className="flex items-center justify-center w-8 h-8 rounded-full bg-[var(--neon-blue)]">
                        <item.icon className="w-4 h-4 text-white" />
                      </div>
                      <span>{item.title}</span>
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
