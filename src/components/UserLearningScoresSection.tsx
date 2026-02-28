"use client";

import { useEffect, useState } from "react";
import { Shield, Users } from "lucide-react";
import { ApiClient } from "@/lib/api";
import { useTranslation } from "@/hooks/useTranslation";

interface OrgUser {
  _id: string;
  email: string;
  displayName: string;
  role: string;
  status?: string;
  learningScores?: { email: number; whatsapp: number; lms: number; voice?: number };
}

type LearningScoreTab = "email" | "whatsapp" | "lms" | "voice";

const TAB_CONFIG: { id: LearningScoreTab; label: string; description: string }[] = [
  { id: "email", label: "Email", description: "Learning score – Email (0–1): based on simulated phishing (open, click, credentials). Higher is better." },
  { id: "whatsapp", label: "WhatsApp", description: "Learning score – WhatsApp (0–1): based on simulated phishing (read, click, credentials). Higher is better." },
  { id: "lms", label: "LMS", description: "Learning score – LMS (0–1): based on training completion. 0 = no progress, 1 = all assigned courses done. Higher is better." },
  { id: "voice", label: "Voice", description: "Learning score – Voice (0–1): based on voice phishing simulation. Higher is better." },
];

interface UserLearningScoresSectionProps {
  getToken: () => Promise<string | null>;
  profile: { _id?: string; role: string; orgId?: string } | null;
}

export default function UserLearningScoresSection({ getToken, profile }: UserLearningScoresSectionProps) {
  const { t } = useTranslation();
  const [users, setUsers] = useState<OrgUser[]>([]);
  const [loading, setLoading] = useState(false);
  const [orgs, setOrgs] = useState<{ _id: string; name: string }[]>([]);
  const [selectedOrgId, setSelectedOrgId] = useState<string | null>(null);
  const [pagination, setPagination] = useState({ current: 1, pages: 1, total: 0 });
  const [learningTab, setLearningTab] = useState<LearningScoreTab>("email");

  const isAdmin = profile?.role === "system_admin" || profile?.role === "client_admin";
  const isClientAdmin = profile?.role === "client_admin";

  useEffect(() => {
    if (!isAdmin || !profile) return;
    if (isClientAdmin && profile.orgId) {
      setSelectedOrgId(profile.orgId);
      return;
    }
    const apiClient = new ApiClient(getToken);
    apiClient.getOrganizations().then((res: { organizations?: { _id: string; name: string }[] }) => {
      const list = res.organizations || [];
      setOrgs(list);
      if (list.length > 0 && !selectedOrgId) setSelectedOrgId(list[0]._id);
    }).catch(() => setOrgs([]));
  }, [isAdmin, isClientAdmin, profile?.orgId, profile?.role]);

  useEffect(() => {
    if (!selectedOrgId || !isAdmin) return;
    setLoading(true);
    const apiClient = new ApiClient(getToken);
    apiClient.getOrgUsers(selectedOrgId, 1, 100)
      .then((res: { users: OrgUser[]; pagination?: { current: number; pages: number; total: number } }) => {
        setUsers(res.users || []);
        setPagination(res.pagination || { current: 1, pages: 1, total: res.users?.length || 0 });
      })
      .catch(() => setUsers([]))
      .finally(() => setLoading(false));
  }, [selectedOrgId, isAdmin, getToken]);

  if (!isAdmin) return null;

  // Client admin should not see their own row in the learning scores table
  const displayUsers =
    isClientAdmin && profile?._id
      ? users.filter((u) => u._id !== profile._id)
      : users;

  // All learning scores 0–1: higher = better. Lower score → Low, higher → High.
  const getLearningScoreLevelLabel = (score: number | undefined) => {
    const s = score ?? 0;
    if (s <= 0.33) return { text: t("Low"), className: "text-[var(--dashboard-text-secondary)]" };   // low score = Low
    if (s <= 0.66) return { text: t("Medium"), className: "text-amber-400" };                         // medium score = Medium
    return { text: t("High"), className: "text-[var(--success-green)]" };                              // high score = High
  };

  const getScoreForTab = (u: OrgUser): number => {
    const ls = u.learningScores;
    switch (learningTab) {
      case "email": return ls?.email ?? 0;
      case "whatsapp": return ls?.whatsapp ?? 0;
      case "lms": return ls?.lms ?? 0;
      case "voice": return ls?.voice ?? 0;
    }
  };

  const currentTabConfig = TAB_CONFIG.find((c) => c.id === learningTab)!;

  return (
    <div className="mt-8 relative z-10">
      <div className="dashboard-card rounded-lg p-6">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
          <div className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-[var(--neon-blue)]" />
            <h3 className="text-lg font-semibold text-[var(--dashboard-text-primary)]">
              {t("Learning scores")}
            </h3>
          </div>
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="text-xs text-[var(--dashboard-text-secondary)]">{t("Type")}:</span>
              <div className="flex flex-wrap gap-1 rounded-lg border border-[var(--sidebar-border)] p-0.5 bg-[var(--navy-blue-lighter)]">
                {TAB_CONFIG.map((tab) => (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setLearningTab(tab.id)}
                    className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                      learningTab === tab.id
                        ? "bg-[var(--neon-blue)] text-white"
                        : "text-[var(--dashboard-text-secondary)] hover:text-[var(--dashboard-text-primary)]"
                    }`}
                  >
                    {t(tab.label)}
                  </button>
                ))}
              </div>
            </div>
            {profile?.role === "system_admin" && orgs.length > 1 && (
              <div className="flex items-center gap-2">
                <label className="text-xs text-[var(--dashboard-text-secondary)]">{t("Organization")}</label>
                <select
                  value={selectedOrgId || ""}
                  onChange={(e) => setSelectedOrgId(e.target.value || null)}
                  className="bg-[var(--navy-blue-lighter)] border border-[var(--sidebar-border)] rounded-lg px-3 py-2 text-sm text-[var(--dashboard-text-primary)] focus:border-[var(--neon-blue)] outline-none"
                >
                  {orgs.map((org) => (
                    <option key={org._id} value={org._id}>{org.name}</option>
                  ))}
                </select>
              </div>
            )}
          </div>
        </div>
        <p className="text-xs text-[var(--dashboard-text-secondary)] mb-4">
          {t(currentTabConfig.description)}
        </p>
        <p className="text-xs text-[var(--dashboard-text-secondary)] mb-4">
          {t("Level: Low (score ≤ 0.33), Medium (0.34–0.66), High (0.67–1). Lower score = Low, higher score = High.")}
        </p>
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-2 border-[var(--neon-blue)] border-t-transparent" />
          </div>
        ) : displayUsers.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-[var(--dashboard-text-secondary)]">
            <Users className="w-12 h-12 mb-2 opacity-50" />
            <p className="text-sm">{t("No users in this organization")}</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[var(--sidebar-border)]">
                  <th className="text-left py-3 px-2 text-[var(--dashboard-text-secondary)] font-medium">{t("User")}</th>
                  <th className="text-left py-3 px-2 text-[var(--dashboard-text-secondary)] font-medium">{t("Email")}</th>
                  <th className="text-left py-3 px-2 text-[var(--dashboard-text-secondary)] font-medium">{t("Role")}</th>
                  <th className="text-left py-3 px-2 text-[var(--dashboard-text-secondary)] font-medium">
                    {t("Learning score")} ({t(currentTabConfig.label)})
                  </th>
                  <th className="text-left py-3 px-2 text-[var(--dashboard-text-secondary)] font-medium">{t("Level")}</th>
                </tr>
              </thead>
              <tbody>
                {displayUsers.map((u) => {
                  const scoreValue = getScoreForTab(u);
                  const score = (typeof scoreValue === "number" ? scoreValue.toFixed(2) : "0.00");
                  const levelLabel = getLearningScoreLevelLabel(scoreValue);
                  return (
                    <tr key={u._id} className="border-b border-[var(--sidebar-border)]/50 hover:bg-[var(--navy-blue-lighter)]/50">
                      <td className="py-3 px-2 text-[var(--dashboard-text-primary)]">{u.displayName || "—"}</td>
                      <td className="py-3 px-2 text-[var(--dashboard-text-secondary)]">{u.email || "—"}</td>
                      <td className="py-3 px-2 text-[var(--dashboard-text-secondary)]">{t(u.role?.replace("_", " ") || "—")}</td>
                      <td className="py-3 px-2 font-mono text-[var(--dashboard-text-primary)]">{score}</td>
                      <td className={`py-3 px-2 font-medium ${levelLabel.className}`}>{levelLabel.text}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
        {(pagination.total > 0 || displayUsers.length > 0) && (
          <p className="text-xs text-[var(--dashboard-text-secondary)] mt-3">
            {t("Showing")} {displayUsers.length} {t("of")} {pagination.total} {t("users")}
          </p>
        )}
      </div>
    </div>
  );
}
