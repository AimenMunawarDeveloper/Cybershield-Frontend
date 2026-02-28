"use client";

import { useEffect, useState } from "react";
import { Shield, Users, GraduationCap } from "lucide-react";
import { ApiClient } from "@/lib/api";
import { useTranslation } from "@/hooks/useTranslation";

interface OrgUser {
  _id: string;
  email: string;
  displayName: string;
  role: string;
  status?: string;
  emailRiskScore?: number;
  whatsappRiskScore?: number;
  lmsRiskScore?: number;
}

interface UserEmailRiskSectionProps {
  getToken: () => Promise<string | null>;
  profile: { _id?: string; role: string; orgId?: string } | null;
}

export default function UserEmailRiskSection({ getToken, profile }: UserEmailRiskSectionProps) {
  const { t } = useTranslation();
  const [users, setUsers] = useState<OrgUser[]>([]);
  const [loading, setLoading] = useState(false);
  const [orgs, setOrgs] = useState<{ _id: string; name: string }[]>([]);
  const [selectedOrgId, setSelectedOrgId] = useState<string | null>(null);
  const [pagination, setPagination] = useState({ current: 1, pages: 1, total: 0 });
  const [riskTab, setRiskTab] = useState<"email" | "whatsapp">("email");

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

  // Client admin should not see their own row in the risk score table
  const displayUsers =
    isClientAdmin && profile?._id
      ? users.filter((u) => u._id !== profile._id)
      : users;

  const getRiskLabel = (score: number | undefined) => {
    const s = score ?? 0;
    if (s <= 0.3) return { text: t("Low"), className: "text-[var(--neon-blue)]" };
    if (s <= 0.6) return { text: t("Medium"), className: "text-amber-400" };
    return { text: t("High"), className: "text-red-400" };
  };

  // LMS score: high is good (completion) — opposite of risk
  const getLmsLevelLabel = (score: number | undefined) => {
    const s = score ?? 0;
    if (s <= 0.33) return { text: t("Low"), className: "text-[var(--dashboard-text-secondary)]" };
    if (s <= 0.66) return { text: t("Medium"), className: "text-amber-400" };
    return { text: t("High"), className: "text-[var(--success-green)]" };
  };

  return (
    <div className="mt-8 relative z-10">
      <div className="dashboard-card rounded-lg p-6">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
          <div className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-[var(--neon-blue)]" />
            <h3 className="text-lg font-semibold text-[var(--dashboard-text-primary)]">
              {t("User risk scores")}
            </h3>
          </div>
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="text-xs text-[var(--dashboard-text-secondary)]">{t("Risk type")}:</span>
              <div className="flex rounded-lg border border-[var(--sidebar-border)] p-0.5 bg-[var(--navy-blue-lighter)]">
                <button
                  type="button"
                  onClick={() => setRiskTab("email")}
                  className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                    riskTab === "email"
                      ? "bg-[var(--neon-blue)] text-white"
                      : "text-[var(--dashboard-text-secondary)] hover:text-[var(--dashboard-text-primary)]"
                  }`}
                >
                  {t("Email")}
                </button>
                <button
                  type="button"
                  onClick={() => setRiskTab("whatsapp")}
                  className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                    riskTab === "whatsapp"
                      ? "bg-[var(--neon-blue)] text-white"
                      : "text-[var(--dashboard-text-secondary)] hover:text-[var(--dashboard-text-primary)]"
                  }`}
                >
                  {t("WhatsApp")}
                </button>
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
          {riskTab === "email"
            ? t("Email risk (0–1): based on simulated phishing (open, click, credentials). Lower is better.")
            : t("WhatsApp risk (0–1): based on simulated phishing (read, click, credentials). Lower is better.")}
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
                    {riskTab === "email" ? t("Email risk") : t("WhatsApp risk")}
                  </th>
                  <th className="text-left py-3 px-2 text-[var(--dashboard-text-secondary)] font-medium">{t("Level")}</th>
                </tr>
              </thead>
              <tbody>
                {displayUsers.map((u) => {
                  const score = riskTab === "email"
                    ? (typeof u.emailRiskScore === "number" ? u.emailRiskScore.toFixed(2) : "0.00")
                    : (typeof u.whatsappRiskScore === "number" ? u.whatsappRiskScore.toFixed(2) : "0.00");
                  const scoreValue = riskTab === "email" ? (u.emailRiskScore ?? 0) : (u.whatsappRiskScore ?? 0);
                  const levelRisk = getRiskLabel(scoreValue);
                  return (
                    <tr key={u._id} className="border-b border-[var(--sidebar-border)]/50 hover:bg-[var(--navy-blue-lighter)]/50">
                      <td className="py-3 px-2 text-[var(--dashboard-text-primary)]">{u.displayName || "—"}</td>
                      <td className="py-3 px-2 text-[var(--dashboard-text-secondary)]">{u.email || "—"}</td>
                      <td className="py-3 px-2 text-[var(--dashboard-text-secondary)]">{t(u.role?.replace("_", " ") || "—")}</td>
                      <td className="py-3 px-2 font-mono text-[var(--dashboard-text-primary)]">{score}</td>
                      <td className={`py-3 px-2 font-medium ${levelRisk.className}`}>{levelRisk.text}</td>
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

      {/* LMS score — separate from risk scores; high = good (completion) */}
      <div className="dashboard-card rounded-lg p-6 mt-6">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
          <div className="flex items-center gap-2">
            <GraduationCap className="w-5 h-5 text-[var(--success-green)]" />
            <h3 className="text-lg font-semibold text-[var(--dashboard-text-primary)]">
              {t("LMS score")}
            </h3>
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
        <p className="text-xs text-[var(--dashboard-text-secondary)] mb-4">
          {t("LMS score (0–1): based on training completion. 0 = no progress, 1 = all assigned courses done. Higher is better.")}
        </p>
        {loading ? (
          <div className="flex justify-center py-12">
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
                  <th className="text-left py-3 px-2 text-[var(--dashboard-text-secondary)] font-medium">{t("LMS score")}</th>
                  <th className="text-left py-3 px-2 text-[var(--dashboard-text-secondary)] font-medium">{t("Completion")}</th>
                </tr>
              </thead>
              <tbody>
                {displayUsers.map((u) => {
                  const lmsScore = typeof u.lmsRiskScore === "number" ? u.lmsRiskScore.toFixed(2) : "0.00";
                  const lmsLevel = getLmsLevelLabel(u.lmsRiskScore ?? 0);
                  return (
                    <tr key={u._id} className="border-b border-[var(--sidebar-border)]/50 hover:bg-[var(--navy-blue-lighter)]/50">
                      <td className="py-3 px-2 text-[var(--dashboard-text-primary)]">{u.displayName || "—"}</td>
                      <td className="py-3 px-2 text-[var(--dashboard-text-secondary)]">{u.email || "—"}</td>
                      <td className="py-3 px-2 text-[var(--dashboard-text-secondary)]">{t(u.role?.replace("_", " ") || "—")}</td>
                      <td className="py-3 px-2 font-mono text-[var(--dashboard-text-primary)]">{lmsScore}</td>
                      <td className={`py-3 px-2 font-medium ${lmsLevel.className}`}>{lmsLevel.text}</td>
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
