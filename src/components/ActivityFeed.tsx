"use client";

import {
  Check,
  Bell,
  AlertTriangle,
  Shield,
  Award,
  Users,
  Target,
  BookOpen,
} from "lucide-react";
import { useTranslation } from "@/hooks/useTranslation";

interface ActivityFeedProps {
  userRole?: "system_admin" | "client_admin" | "affiliated" | "non_affiliated";
}

const getRoleBasedActivities = (role: string, t: any) => {
  switch (role) {
    case "system_admin":
      return {
        title: t("Platform Activity"),
        subtitle: t("+15% this month"),
        activities: [
          {
            id: 1,
            icon: Users,
            iconColor: "text-[var(--neon-blue)]",
            title: t("NUST organization joined with 2,847 users"),
            date: t("22 DEC 7:20 PM"),
          },
          {
            id: 2,
            icon: Shield,
            iconColor: "text-[var(--success-green)]",
            title: t("Global phishing campaign completed - 85% success rate"),
            date: t("21 DEC 11:21 PM"),
          },
          {
            id: 3,
            icon: Target,
            iconColor: "text-[var(--neon-blue)]",
            title: t("New AI-generated phishing templates deployed"),
            date: t("20 DEC 2:15 PM"),
          },
          {
            id: 4,
            icon: Award,
            iconColor: "text-[var(--neon-blue)]",
            title: t("2,340 certificates issued across all organizations"),
            date: t("19 DEC 9:45 AM"),
          },
          {
            id: 5,
            icon: AlertTriangle,
            iconColor: "text-[var(--crimson-red)]",
            title: t("Risk score alert: 3 organizations need attention"),
            date: t("18 DEC 4:30 PM"),
          },
        ],
      };
    case "client_admin":
      return {
        title: t("Organization Activity"),
        subtitle: t("+8% this month"),
        activities: [
          {
            id: 1,
            icon: Users,
            iconColor: "text-[var(--neon-blue)]",
            title: t("142 new students enrolled in CS department"),
            date: t("22 DEC 7:20 PM"),
          },
          {
            id: 2,
            icon: Shield,
            iconColor: "text-[var(--success-green)]",
            title: t("Phishing simulation completed - 78% pass rate"),
            date: t("21 DEC 11:21 PM"),
          },
          {
            id: 3,
            icon: BookOpen,
            iconColor: "text-[var(--neon-blue)]",
            title: t("Email Security course assigned to all students"),
            date: t("20 DEC 2:15 PM"),
          },
          {
            id: 4,
            icon: Award,
            iconColor: "text-[var(--neon-blue)]",
            title: t("156 certificates issued to your students"),
            date: t("19 DEC 9:45 AM"),
          },
          {
            id: 5,
            icon: AlertTriangle,
            iconColor: "text-[var(--crimson-red)]",
            title: t("15 students need to complete required training"),
            date: t("18 DEC 4:30 PM"),
          },
        ],
      };
    case "affiliated":
      return {
        title: t("Your Activity"),
        subtitle: t("+12% this month"),
        activities: [
          {
            id: 1,
            icon: Award,
            iconColor: "text-[var(--success-green)]",
            title: t("Email Phishing Awareness course completed - 100% score"),
            date: t("22 DEC 7:20 PM"),
          },
          {
            id: 2,
            icon: Shield,
            iconColor: "text-[var(--success-green)]",
            title: t("Passed WhatsApp Security simulation test"),
            date: t("21 DEC 11:21 PM"),
          },
          {
            id: 3,
            icon: BookOpen,
            iconColor: "text-[var(--neon-blue)]",
            title: t("Started Advanced Threat Detection course"),
            date: t("20 DEC 2:15 PM"),
          },
          {
            id: 4,
            icon: Award,
            iconColor: "text-[var(--neon-blue)]",
            title: t("Earned 'Security Champion' badge"),
            date: t("19 DEC 9:45 AM"),
          },
          {
            id: 5,
            icon: Bell,
            iconColor: "text-[var(--neon-blue)]",
            title: t("New phishing simulation available"),
            date: t("18 DEC 4:30 PM"),
          },
        ],
      };
    case "non_affiliated":
      return {
        title: t("Your Activity"),
        subtitle: t("+5% this month"),
        activities: [
          {
            id: 1,
            icon: Award,
            iconColor: "text-[var(--success-green)]",
            title: "Basic Cybersecurity Fundamentals completed - 92% score",
            date: "22 DEC 7:20 PM",
          },
          {
            id: 2,
            icon: Shield,
            iconColor: "text-[var(--success-green)]",
            title: "Passed Email Security Basics test",
            date: "21 DEC 11:21 PM",
          },
          {
            id: 3,
            icon: BookOpen,
            iconColor: "text-[var(--neon-blue)]",
            title: "Started Password Security course",
            date: "20 DEC 2:15 PM",
          },
          {
            id: 4,
            icon: Award,
            iconColor: "text-[var(--neon-blue)]",
            title: "Earned 'Cybersecurity Novice' badge",
            date: "19 DEC 9:45 AM",
          },
          {
            id: 5,
            icon: Bell,
            iconColor: "text-[var(--neon-blue)]",
            title: "New course available: Social Engineering Awareness",
            date: "18 DEC 4:30 PM",
          },
        ],
      };
    default:
      return {
        title: t("Your Activity"),
        subtitle: t("+5% this month"),
        activities: [
          {
            id: 1,
            icon: Award,
            iconColor: "text-[var(--success-green)]",
            title: t("Basic Cybersecurity Fundamentals completed - 92% score"),
            date: t("22 DEC 7:20 PM"),
          },
          {
            id: 2,
            icon: Shield,
            iconColor: "text-[var(--success-green)]",
            title: t("Passed Email Security Basics test"),
            date: t("21 DEC 11:21 PM"),
          },
          {
            id: 3,
            icon: BookOpen,
            iconColor: "text-[var(--neon-blue)]",
            title: t("Started Password Security course"),
            date: t("20 DEC 2:15 PM"),
          },
          {
            id: 4,
            icon: Award,
            iconColor: "text-[var(--neon-blue)]",
            title: t("Earned 'Cybersecurity Novice' badge"),
            date: t("19 DEC 9:45 AM"),
          },
          {
            id: 5,
            icon: Bell,
            iconColor: "text-[var(--neon-blue)]",
            title: t("New course available: Social Engineering Awareness"),
            date: t("18 DEC 4:30 PM"),
          },
        ],
      };
  }
};

export default function ActivityFeed({
  userRole = "non_affiliated",
}: ActivityFeedProps) {
  const { t } = useTranslation();
  const { title, subtitle, activities } = getRoleBasedActivities(userRole, t);
  return (
    <div className="dashboard-card rounded-lg p-6">
      {/* Header */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-white mb-1">{title}</h3>
        <div className="flex items-center text-sm">
          <Check className="w-4 h-4 text-[var(--success-green)] mr-1" />
          <span className="text-[var(--success-green)]">{subtitle}</span>
        </div>
      </div>

      {/* Activities List */}
      <div className="space-y-4 max-h-80 overflow-y-auto">
        {activities.map((activity) => {
          const IconComponent = activity.icon;
          return (
            <div key={activity.id} className="flex items-start space-x-3 py-2">
              {/* Icon */}
              <div className="flex-shrink-0 mt-1">
                <IconComponent className={`w-5 h-5 ${activity.iconColor}`} />
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <p className="text-white text-sm font-medium truncate">
                  {activity.title}
                </p>
                <p className="text-[var(--medium-grey)] text-xs mt-1">
                  {activity.date}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
