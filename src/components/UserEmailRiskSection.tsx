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
  emailRiskScore?: number;
}

interface UserEmailRiskSectionProps {
  getToken: () => Promise<string | null>;
  profile: { role: string; orgId?: string } | null;
}

export default function UserEmailRiskSection({ getToken, profile }: UserEmailRiskSectionProps) {
  const { t } = useTranslation();
  const [users, setUsers] = useState<OrgUser[]>([]);
  const [loading, setLoading] = useState(false);
  const [orgs, setOrgs] = useState<{ _id: string; name: string }[]>([]);
  const [selectedOrgId, setSelectedOrgId] = useState<string | null>(null);
  const [pagination, setPagination] = useState({ current: 1, pages: 1, total: 0 });

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

  const getRiskLabel = (score: number | undefined) => {
    const s = score ?? 0;
    if (s <= 0.3) return { text: t("Low"), className: "text-[var(--neon-blue)]" };
    if (s <= 0.6) return { text: t("Medium"), className: "text-amber-400" };
    return { text: t("High"), className: "text-red-400" };
  };

  return (
    <div className="mt-8 relative z-10">
      <div className="dashboard-card rounded-lg p-6">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
          <div className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-[var(--neon-blue)]" />
            <h3 className="text-lg font-semibold text-[var(--dashboard-text-primary)]">
              {t("User email risk scores")}
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
          {t("Email risk score (0–1) is based on simulated phishing: opens, clicks, and credentials submitted. Lower is better.")}
        </p>
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-2 border-[var(--neon-blue)] border-t-transparent" />
          </div>
        ) : users.length === 0 ? (
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
                  <th className="text-left py-3 px-2 text-[var(--dashboard-text-secondary)] font-medium">{t("Email risk score")}</th>
                  <th className="text-left py-3 px-2 text-[var(--dashboard-text-secondary)] font-medium">{t("Level")}</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => {
                  const risk = getRiskLabel(u.emailRiskScore);
                  const score = typeof u.emailRiskScore === "number" ? u.emailRiskScore.toFixed(2) : "0.00";
                  return (
                    <tr key={u._id} className="border-b border-[var(--sidebar-border)]/50 hover:bg-[var(--navy-blue-lighter)]/50">
                      <td className="py-3 px-2 text-[var(--dashboard-text-primary)]">{u.displayName || "—"}</td>
                      <td className="py-3 px-2 text-[var(--dashboard-text-secondary)]">{u.email || "—"}</td>
                      <td className="py-3 px-2 text-[var(--dashboard-text-secondary)]">{t(u.role?.replace("_", " ") || "—")}</td>
                      <td className="py-3 px-2 font-mono text-[var(--dashboard-text-primary)]">{score}</td>
                      <td className={`py-3 px-2 font-medium ${risk.className}`}>{risk.text}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
        {pagination.total > 0 && (
          <p className="text-xs text-[var(--dashboard-text-secondary)] mt-3">
            {t("Showing")} {users.length} {t("of")} {pagination.total} {t("users")}
          </p>
        )}
      </div>
    </div>
  );
}
