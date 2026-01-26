"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@clerk/nextjs";
import { useTranslation } from "@/hooks/useTranslation";
import { 
  Mail, 
  MessageSquare, 
  AlertTriangle, 
  CheckCircle2, 
  Clock, 
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  Filter,
  Search,
  Download
} from "lucide-react";

interface Incident {
  _id: string;
  messageType: "email" | "whatsapp";
  message: string;
  text?: string;
  subject?: string;
  from?: string;
  from_phone?: string;
  urls: string[];
  date?: string;
  timestamp: string;
  createdAt: string;
  is_phishing?: boolean;
  phishing_probability?: number;
  legitimate_probability?: number;
  confidence?: number;
  persuasion_cues?: string[];
  userId?: {
    _id: string;
    displayName?: string;
    email?: string;
  };
}

interface IncidentTableProps {
  className?: string;
}

export default function IncidentTable({ className = "" }: IncidentTableProps) {
  const { getToken } = useAuth();
  const { t, language } = useTranslation();
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [filters, setFilters] = useState({
    messageType: "",
    isPhishing: "",
    search: "",
  });

  useEffect(() => {
    fetchIncidents();
  }, [page, filters]);

  const fetchIncidents = async () => {
    try {
      setLoading(true);
      setError(null);
      const token = await getToken();
      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:5001";

      const params = new URLSearchParams({
        page: page.toString(),
        limit: "20",
      });

      if (filters.messageType) {
        params.append("messageType", filters.messageType);
      }
      if (filters.isPhishing !== "") {
        params.append("isPhishing", filters.isPhishing);
      }

      const res = await fetch(`${backendUrl}/api/incidents?${params}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) {
        throw new Error("Failed to fetch incidents");
      }

      const data = await res.json();
      if (data.success) {
        setIncidents(data.incidents || []);
        setTotalPages(data.pagination?.pages || 1);
      } else {
        throw new Error(data.error || "Failed to fetch incidents");
      }
    } catch (err) {
      console.error("Error fetching incidents:", err);
      setError(err instanceof Error ? err.message : "Failed to load incidents");
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return date.toLocaleString(language === "ur" ? "ur-PK" : "en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const truncateText = (text: string, maxLength: number = 100) => {
    if (!text) return "N/A";
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + "...";
  };

  const filteredIncidents = incidents.filter((incident) => {
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      return (
        incident.message?.toLowerCase().includes(searchLower) ||
        incident.subject?.toLowerCase().includes(searchLower) ||
        incident.from?.toLowerCase().includes(searchLower) ||
        incident.from_phone?.toLowerCase().includes(searchLower)
      );
    }
    return true;
  });

  if (loading && incidents.length === 0) {
    return (
      <div className={`flex items-center justify-center p-12 ${className}`}>
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[var(--neon-blue)] mx-auto"></div>
          <p className="text-[var(--light-blue)]">{t("Loading incidents...")}</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white mb-2">{t("Incident Reports")}</h2>
          <p className="text-[var(--medium-grey)]">{t("View and manage all reported incidents")}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-[var(--navy-blue-lighter)]/50 backdrop-blur-md p-4 rounded-xl border border-[var(--medium-grey)]/20">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Search */}
          <div className="md:col-span-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-[var(--medium-grey)]" />
              <input
                type="text"
                placeholder={t("Search incidents...")}
                value={filters.search}
                onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                className="w-full pl-10 pr-4 py-2 bg-[var(--navy-blue)]/80 border border-[var(--medium-grey)]/30 rounded-lg text-white placeholder-[var(--medium-grey)] focus:outline-none focus:border-[var(--neon-blue)]"
              />
            </div>
          </div>

          {/* Message Type Filter */}
          <div>
            <select
              value={filters.messageType}
              onChange={(e) => setFilters({ ...filters, messageType: e.target.value, page: 1 })}
              className="w-full px-4 py-2 bg-[var(--navy-blue)]/80 border border-[var(--medium-grey)]/30 rounded-lg text-white focus:outline-none focus:border-[var(--neon-blue)]"
            >
              <option value="">{t("All Types")}</option>
              <option value="email">{t("Email")}</option>
              <option value="whatsapp">{t("WhatsApp")}</option>
            </select>
          </div>

          {/* Phishing Filter */}
          <div>
            <select
              value={filters.isPhishing}
              onChange={(e) => setFilters({ ...filters, isPhishing: e.target.value, page: 1 })}
              className="w-full px-4 py-2 bg-[var(--navy-blue)]/80 border border-[var(--medium-grey)]/30 rounded-lg text-white focus:outline-none focus:border-[var(--neon-blue)]"
            >
              <option value="">{t("All Results")}</option>
              <option value="true">{t("Phishing")}</option>
              <option value="false">{t("Not Phishing")}</option>
            </select>
          </div>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-900/20 border border-red-500/50 rounded-lg p-4 text-red-300 flex items-center gap-2">
          <AlertTriangle className="w-5 h-5" />
          <span>{error}</span>
        </div>
      )}

      {/* Table */}
      <div className="bg-[var(--navy-blue-lighter)]/50 backdrop-blur-md rounded-xl border border-[var(--medium-grey)]/20 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-[var(--navy-blue)]/80 border-b border-[var(--medium-grey)]/30">
              <tr>
                <th className="px-6 py-4 text-left text-sm font-semibold text-white">{t("Type")}</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-white">{t("Subject/From")}</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-white">{t("Message")}</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-white">{t("URLs")}</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-white">{t("Result")}</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-white">{t("Probability")}</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-white">{t("Date")}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--medium-grey)]/20">
              {filteredIncidents.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-[var(--medium-grey)]">
                    {loading ? t("Loading...") : t("No incidents found")}
                  </td>
                </tr>
              ) : (
                filteredIncidents.map((incident) => (
                  <tr
                    key={incident._id}
                    className="hover:bg-[var(--navy-blue)]/30 transition-colors"
                  >
                    {/* Type */}
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        {incident.messageType === "email" ? (
                          <Mail className="w-5 h-5 text-[#51b0ec]" />
                        ) : (
                          <MessageSquare className="w-5 h-5 text-[#25d366]" />
                        )}
                        <span className="text-white text-sm capitalize">
                          {incident.messageType}
                        </span>
                      </div>
                    </td>

                    {/* Subject/From */}
                    <td className="px-6 py-4">
                      <div className="space-y-1">
                        {incident.subject && (
                          <div className="text-white text-sm font-medium">
                            {truncateText(incident.subject, 40)}
                          </div>
                        )}
                        <div className="text-[var(--medium-grey)] text-xs">
                          {incident.from || incident.from_phone || "N/A"}
                        </div>
                      </div>
                    </td>

                    {/* Message */}
                    <td className="px-6 py-4">
                      <div className="text-[var(--light-blue)] text-sm max-w-xs">
                        {truncateText(incident.message || incident.text || "", 80)}
                      </div>
                    </td>

                    {/* URLs */}
                    <td className="px-6 py-4">
                      {incident.urls && incident.urls.length > 0 ? (
                        <div className="flex flex-wrap gap-1">
                          {incident.urls.slice(0, 2).map((url, idx) => (
                            <a
                              key={idx}
                              href={url.startsWith("http") ? url : `https://${url}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-[#51b0ec] hover:text-[#4fc3f7] text-xs flex items-center gap-1"
                            >
                              <ExternalLink className="w-3 h-3" />
                              {truncateText(url, 20)}
                            </a>
                          ))}
                          {incident.urls.length > 2 && (
                            <span className="text-[var(--medium-grey)] text-xs">
                              +{incident.urls.length - 2}
                            </span>
                          )}
                        </div>
                      ) : (
                        <span className="text-[var(--medium-grey)] text-sm">—</span>
                      )}
                    </td>

                    {/* Result */}
                    <td className="px-6 py-4">
                      {incident.is_phishing !== undefined ? (
                        <div className="flex items-center gap-2">
                          {incident.is_phishing ? (
                            <>
                              <AlertTriangle className="w-5 h-5 text-red-400" />
                              <span className="text-red-400 text-sm font-semibold">
                                {t("Phishing")}
                              </span>
                            </>
                          ) : (
                            <>
                              <CheckCircle2 className="w-5 h-5 text-green-400" />
                              <span className="text-green-400 text-sm font-semibold">
                                {t("Safe")}
                              </span>
                            </>
                          )}
                        </div>
                      ) : (
                        <span className="text-[var(--medium-grey)] text-sm">—</span>
                      )}
                    </td>

                    {/* Probability */}
                    <td className="px-6 py-4">
                      {incident.phishing_probability !== undefined ? (
                        <div className="space-y-1">
                          <div className="text-white text-sm font-mono font-bold">
                            {(incident.phishing_probability * 100).toFixed(1)}%
                          </div>
                          {incident.confidence !== undefined && (
                            <div className="text-[var(--medium-grey)] text-xs">
                              {t("Confidence")}: {(incident.confidence * 100).toFixed(0)}%
                            </div>
                          )}
                        </div>
                      ) : (
                        <span className="text-[var(--medium-grey)] text-sm">—</span>
                      )}
                    </td>

                    {/* Date */}
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2 text-[var(--light-blue)] text-sm">
                        <Clock className="w-4 h-4" />
                        <span>{formatDate(incident.createdAt || incident.timestamp)}</span>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="px-6 py-4 border-t border-[var(--medium-grey)]/20 flex items-center justify-between">
            <div className="text-[var(--medium-grey)] text-sm">
              {t("Page")} {page} {t("of")} {totalPages}
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-4 py-2 bg-[var(--navy-blue)]/80 border border-[var(--medium-grey)]/30 rounded-lg text-white disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[var(--navy-blue)] transition-colors flex items-center gap-2"
              >
                <ChevronLeft className="w-4 h-4" />
                {t("Previous")}
              </button>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="px-4 py-2 bg-[var(--navy-blue)]/80 border border-[var(--medium-grey)]/30 rounded-lg text-white disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[var(--navy-blue)] transition-colors flex items-center gap-2"
              >
                {t("Next")}
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
