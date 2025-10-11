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

interface ActivityFeedProps {
  userRole?: "system_admin" | "client_admin" | "affiliated" | "non_affiliated";
}

const getRoleBasedActivities = (role: string) => {
  switch (role) {
    case "system_admin":
      return {
        title: "Platform Activity",
        subtitle: "+15% this month",
        activities: [
          {
            id: 1,
            icon: Users,
            iconColor: "text-[var(--neon-blue)]",
            title: "NUST organization joined with 2,847 users",
            date: "22 DEC 7:20 PM",
          },
          {
            id: 2,
            icon: Shield,
            iconColor: "text-[var(--success-green)]",
            title: "Global phishing campaign completed - 85% success rate",
            date: "21 DEC 11:21 PM",
          },
          {
            id: 3,
            icon: Target,
            iconColor: "text-[var(--neon-blue)]",
            title: "New AI-generated phishing templates deployed",
            date: "20 DEC 2:15 PM",
          },
          {
            id: 4,
            icon: Award,
            iconColor: "text-[var(--neon-blue)]",
            title: "2,340 certificates issued across all organizations",
            date: "19 DEC 9:45 AM",
          },
          {
            id: 5,
            icon: AlertTriangle,
            iconColor: "text-[var(--crimson-red)]",
            title: "Risk score alert: 3 organizations need attention",
            date: "18 DEC 4:30 PM",
          },
        ],
      };
    case "client_admin":
      return {
        title: "Organization Activity",
        subtitle: "+8% this month",
        activities: [
          {
            id: 1,
            icon: Users,
            iconColor: "text-[var(--neon-blue)]",
            title: "142 new students enrolled in CS department",
            date: "22 DEC 7:20 PM",
          },
          {
            id: 2,
            icon: Shield,
            iconColor: "text-[var(--success-green)]",
            title: "Phishing simulation completed - 78% pass rate",
            date: "21 DEC 11:21 PM",
          },
          {
            id: 3,
            icon: BookOpen,
            iconColor: "text-[var(--neon-blue)]",
            title: "Email Security course assigned to all students",
            date: "20 DEC 2:15 PM",
          },
          {
            id: 4,
            icon: Award,
            iconColor: "text-[var(--neon-blue)]",
            title: "156 certificates issued to your students",
            date: "19 DEC 9:45 AM",
          },
          {
            id: 5,
            icon: AlertTriangle,
            iconColor: "text-[var(--crimson-red)]",
            title: "15 students need to complete required training",
            date: "18 DEC 4:30 PM",
          },
        ],
      };
    case "affiliated":
      return {
        title: "Your Activity",
        subtitle: "+12% this month",
        activities: [
          {
            id: 1,
            icon: Award,
            iconColor: "text-[var(--success-green)]",
            title: "Email Phishing Awareness course completed - 100% score",
            date: "22 DEC 7:20 PM",
          },
          {
            id: 2,
            icon: Shield,
            iconColor: "text-[var(--success-green)]",
            title: "Passed WhatsApp Security simulation test",
            date: "21 DEC 11:21 PM",
          },
          {
            id: 3,
            icon: BookOpen,
            iconColor: "text-[var(--neon-blue)]",
            title: "Started Advanced Threat Detection course",
            date: "20 DEC 2:15 PM",
          },
          {
            id: 4,
            icon: Award,
            iconColor: "text-[var(--neon-blue)]",
            title: "Earned 'Security Champion' badge",
            date: "19 DEC 9:45 AM",
          },
          {
            id: 5,
            icon: Bell,
            iconColor: "text-[var(--neon-blue)]",
            title: "New phishing simulation available",
            date: "18 DEC 4:30 PM",
          },
        ],
      };
    case "non_affiliated":
      return {
        title: "Your Activity",
        subtitle: "+5% this month",
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
        title: "Your Activity",
        subtitle: "+5% this month",
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
  }
};

export default function ActivityFeed({
  userRole = "non_affiliated",
}: ActivityFeedProps) {
  const { title, subtitle, activities } = getRoleBasedActivities(userRole);
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
