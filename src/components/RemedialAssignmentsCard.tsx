"use client";

import { useRouter } from "next/navigation";
import { BookOpen, Calendar, Clock, ShieldAlert, ArrowRight } from "lucide-react";

export interface RemedialAssignmentItem {
  _id: string;
  user: string;
  course: { _id: string; courseTitle: string; description?: string };
  reason: string;
  assignedAt: string;
  dueAt?: string;
}

function getDaysLeft(dueAt: string): number {
  const due = new Date(dueAt);
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  due.setHours(0, 0, 0, 0);
  return Math.ceil((due.getTime() - now.getTime()) / (24 * 60 * 60 * 1000));
}

function DueBadge({
  dueAt,
  t,
}: {
  dueAt: string;
  t: (key: string) => string;
}) {
  const days = getDaysLeft(dueAt);
  if (days < 0) {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-red-500/20 text-red-400 border border-red-500/40">
        <Clock className="w-3 h-3" />
        {t("Overdue")}
      </span>
    );
  }
  if (days <= 7) {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-amber-500/20 text-amber-400 border border-amber-500/40">
        <Clock className="w-3 h-3" />
        {days === 0 ? t("Due today") : days === 1 ? t("1 day left") : `${days} ${t("days left")}`}
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-[var(--navy-blue-lighter)] text-[var(--dashboard-text-secondary)] border border-[var(--sidebar-border)]">
      <Calendar className="w-3 h-3" />
      {t("Due by")} {new Date(dueAt).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}
    </span>
  );
}

interface RemedialAssignmentsCardProps {
  assignments: RemedialAssignmentItem[];
  t: (key: string) => string;
  variant?: "dashboard" | "full";
  showViewAll?: boolean;
  maxDisplay?: number;
}

export default function RemedialAssignmentsCard({
  assignments,
  t,
  variant = "full",
  showViewAll = true,
  maxDisplay = variant === "dashboard" ? 5 : 999,
}: RemedialAssignmentsCardProps) {
  const router = useRouter();
  const displayList = assignments.slice(0, maxDisplay);
  const hasMore = assignments.length > maxDisplay;
  const isDashboard = variant === "dashboard";

  return (
    <div className={isDashboard ? "dashboard-card rounded-lg p-6" : "rounded-xl border border-amber-500/25 bg-gradient-to-br from-amber-500/8 via-[var(--navy-blue-lighter)]/50 to-amber-500/5 shadow-lg overflow-hidden"}>
      {/* Header - same structure as other dashboard cards (e.g. Training Completion) */}
      <div className={isDashboard ? "mb-4" : "px-5 py-4 border-b border-amber-500/20 bg-amber-500/5"}>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className={isDashboard ? "" : "flex items-center gap-3"}>
            {!isDashboard && (
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-500/20 border border-amber-500/30">
                <ShieldAlert className="h-5 w-5 text-amber-400" />
              </div>
            )}
            <div>
              <h3 className="text-lg font-semibold text-[var(--dashboard-text-primary)]">
                {t("Assigned to you")}
              </h3>
              <p className={`text-[var(--dashboard-text-secondary)] mt-0.5 ${isDashboard ? "text-xs" : "text-sm"}`}>
                {t("Complete by the deadline to improve your security awareness.")}
              </p>
            </div>
          </div>
          {showViewAll && (
            <button
              type="button"
              onClick={() => router.push("/dashboard/training-modules")}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[var(--neon-blue)] text-white text-sm font-medium hover:opacity-90 transition-opacity"
            >
              {t("Go to Training")}
              <ArrowRight className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      {/* List - dashboard: same inner card style as Security Awareness / Training Completion */}
      <div className={isDashboard ? "" : "p-4"}>
        <div className={isDashboard ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4" : "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"}>
          {displayList.map((ra) => {
            const course = ra.course;
            if (!course?._id) return null;
            const dueAt = ra.dueAt || ra.assignedAt;
            const daysLeft = dueAt ? getDaysLeft(dueAt) : null;
            const isUrgent = daysLeft !== null && daysLeft <= 7 && daysLeft >= 0;
            const isOverdue = daysLeft !== null && daysLeft < 0;

            return (
              <button
                key={ra._id}
                type="button"
                onClick={() => router.push(`/dashboard/training-modules/${course._id}`)}
                className={`group text-left rounded-lg transition-colors ${
                  isDashboard
                    ? "bg-[var(--navy-blue-lighter)] p-4 hover:bg-[var(--navy-blue-lighter)]/80 border border-transparent hover:border-[var(--neon-blue)]/30"
                    : `rounded-xl border transition-all duration-200 hover:shadow-md hover:scale-[1.02] p-4 ${
                        isOverdue
                          ? "bg-red-500/10 border-red-500/30 hover:bg-red-500/15"
                          : isUrgent
                          ? "bg-amber-500/10 border-amber-500/30 hover:bg-amber-500/20"
                          : "bg-white/5 border-amber-500/20 hover:bg-amber-500/10"
                      }`
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${
                    isDashboard ? "bg-[var(--neon-blue)]/20" : isOverdue ? "bg-red-500/20" : "bg-amber-500/20"
                  }`}>
                    <BookOpen className={`h-5 w-5 ${isDashboard ? "text-[var(--neon-blue)]" : isOverdue ? "text-red-400" : "text-amber-400"}`} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h4 className="font-semibold text-[var(--dashboard-text-primary)] truncate group-hover:text-[var(--neon-blue)] transition-colors">
                      {course.courseTitle}
                    </h4>
                    <div className="flex flex-wrap items-center gap-2 mt-2">
                      {dueAt && <DueBadge dueAt={dueAt} t={t} />}
                      <span className="text-xs text-[var(--dashboard-text-secondary)]">
                        {t("Assigned")} {new Date(ra.assignedAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                  <ArrowRight className="h-4 w-4 shrink-0 text-[var(--dashboard-text-secondary)] group-hover:text-[var(--neon-blue)] group-hover:translate-x-0.5 transition-all" />
                </div>
              </button>
            );
          })}
        </div>
        {hasMore && showViewAll && (
          <div className={`mt-4 pt-4 ${isDashboard ? "border-t border-[var(--sidebar-border)]" : "border-t border-amber-500/20"}`}>
            <button
              type="button"
              onClick={() => router.push("/dashboard/training-modules")}
              className={`text-sm font-medium transition-colors ${isDashboard ? "text-[var(--neon-blue)] hover:opacity-80" : "text-amber-400 hover:text-amber-300"}`}
            >
              +{assignments.length - maxDisplay} {t("more")} →
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
