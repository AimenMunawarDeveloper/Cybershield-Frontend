"use client";

import React, { useState } from "react";
import ReactPaginate from "react-paginate";
import {
  ChevronUp,
  ChevronDown,
  Edit,
  Copy,
  Trash2,
  Info,
  Lock,
} from "lucide-react";

const ModuleTable = () => {
  const [sortField, setSortField] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");
  const [currentPage, setCurrentPage] = useState(0);
  const [entriesPerPage, setEntriesPerPage] = useState(10);

  const modules = [
    {
      id: 1,
      name: "AI-Scams",
      passingScore: 70,
      questions: 7,
      pages: 11,
      isPremium: true,
      complianceFrameworks: ["SOC2", "ISO27001"],
      preview:
        "https://images.unsplash.com/photo-1563013544-824ae1b704d3?ixlib=rb-4.0.3&auto=format&fit=crop&w=100&q=80",
    },
    {
      id: 2,
      name: "CCPA-United-States",
      passingScore: 70,
      questions: 10,
      pages: 19,
      isPremium: true,
      complianceFrameworks: ["CCPA", "PCI"],
      preview:
        "https://images.unsplash.com/photo-1590736969955-71cc94901144?ixlib=rb-4.0.3&auto=format&fit=crop&w=100&q=80",
    },
    {
      id: 3,
      name: "Critical-Infrastructure-Best-Practices",
      passingScore: 70,
      questions: 5,
      pages: 14,
      isPremium: true,
      complianceFrameworks: ["NIST", "CIS"],
      preview:
        "https://images.unsplash.com/photo-1555949963-aa79dcee981c?ixlib=rb-4.0.3&auto=format&fit=crop&w=100&q=80",
    },
    {
      id: 4,
      name: "Cyber-Security",
      passingScore: 70,
      questions: 6,
      pages: 20,
      isPremium: true,
      complianceFrameworks: ["ISO27001", "SOC2"],
      preview:
        "https://images.unsplash.com/photo-1558494949-ef010cbdcc31?ixlib=rb-4.0.3&auto=format&fit=crop&w=100&q=80",
    },
    {
      id: 5,
      name: "Deepfake-Awareness",
      passingScore: 70,
      questions: 8,
      pages: 12,
      isPremium: true,
      complianceFrameworks: ["SOC2"],
      preview:
        "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?ixlib=rb-4.0.3&auto=format&fit=crop&w=100&q=80",
    },
    {
      id: 6,
      name: "Defence-in-Depth",
      passingScore: 70,
      questions: 7,
      pages: 17,
      isPremium: true,
      complianceFrameworks: ["NIST", "CIS", "ISO27001"],
      preview:
        "https://images.unsplash.com/photo-1551288049-bebda4e38f71?ixlib=rb-4.0.3&auto=format&fit=crop&w=100&q=80",
    },
    {
      id: 7,
      name: "Device-Security",
      passingScore: 70,
      questions: 6,
      pages: 10,
      isPremium: true,
      complianceFrameworks: ["PCI", "SOC2"],
      preview:
        "https://images.unsplash.com/photo-1577563908411-5077b6dc7624?ixlib=rb-4.0.3&auto=format&fit=crop&w=100&q=80",
    },
    {
      id: 8,
      name: "DPA-United-Kingdom",
      passingScore: 70,
      questions: 5,
      pages: 15,
      isPremium: true,
      complianceFrameworks: ["GDPR"],
      preview:
        "https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?ixlib=rb-4.0.3&auto=format&fit=crop&w=100&q=80",
    },
    {
      id: 9,
      name: "DPDP-Act-India",
      passingScore: 70,
      questions: 8,
      pages: 18,
      isPremium: true,
      complianceFrameworks: ["DPDP"],
      preview:
        "https://images.unsplash.com/photo-1563013544-824ae1b704d3?ixlib=rb-4.0.3&auto=format&fit=crop&w=100&q=80",
    },
    {
      id: 10,
      name: "Education-Provider-Best-Practices",
      passingScore: 70,
      questions: 9,
      pages: 13,
      isPremium: true,
      complianceFrameworks: ["FERPA", "SOC2"],
      preview:
        "https://images.unsplash.com/photo-1590736969955-71cc94901144?ixlib=rb-4.0.3&auto=format&fit=crop&w=100&q=80",
    },
    {
      id: 11,
      name: "Email-Security",
      passingScore: 70,
      questions: 6,
      pages: 16,
      isPremium: true,
      complianceFrameworks: ["SOC2", "ISO27001"],
      preview:
        "https://images.unsplash.com/photo-1563013544-824ae1b704d3?ixlib=rb-4.0.3&auto=format&fit=crop&w=100&q=80",
    },
    {
      id: 12,
      name: "GDPR-Compliance",
      passingScore: 70,
      questions: 8,
      pages: 22,
      isPremium: true,
      complianceFrameworks: ["GDPR", "SOC2"],
      preview:
        "https://images.unsplash.com/photo-1590736969955-71cc94901144?ixlib=rb-4.0.3&auto=format&fit=crop&w=100&q=80",
    },
    {
      id: 13,
      name: "HIPAA-Compliance",
      passingScore: 70,
      questions: 7,
      pages: 19,
      isPremium: true,
      complianceFrameworks: ["HIPAA", "SOC2"],
      preview:
        "https://images.unsplash.com/photo-1555949963-aa79dcee981c?ixlib=rb-4.0.3&auto=format&fit=crop&w=100&q=80",
    },
    {
      id: 14,
      name: "Incident-Response",
      passingScore: 70,
      questions: 9,
      pages: 25,
      isPremium: true,
      complianceFrameworks: ["NIST", "ISO27001"],
      preview:
        "https://images.unsplash.com/photo-1558494949-ef010cbdcc31?ixlib=rb-4.0.3&auto=format&fit=crop&w=100&q=80",
    },
    {
      id: 15,
      name: "Malware-Awareness",
      passingScore: 70,
      questions: 6,
      pages: 14,
      isPremium: true,
      complianceFrameworks: ["SOC2", "CIS"],
      preview:
        "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?ixlib=rb-4.0.3&auto=format&fit=crop&w=100&q=80",
    },
    {
      id: 16,
      name: "Network-Security",
      passingScore: 70,
      questions: 8,
      pages: 21,
      isPremium: true,
      complianceFrameworks: ["NIST", "CIS", "ISO27001"],
      preview:
        "https://images.unsplash.com/photo-1551288049-bebda4e38f71?ixlib=rb-4.0.3&auto=format&fit=crop&w=100&q=80",
    },
    {
      id: 17,
      name: "PCI-DSS-Compliance",
      passingScore: 70,
      questions: 7,
      pages: 18,
      isPremium: true,
      complianceFrameworks: ["PCI", "SOC2"],
      preview:
        "https://images.unsplash.com/photo-1577563908411-5077b6dc7624?ixlib=rb-4.0.3&auto=format&fit=crop&w=100&q=80",
    },
    {
      id: 18,
      name: "Physical-Security",
      passingScore: 70,
      questions: 5,
      pages: 12,
      isPremium: true,
      complianceFrameworks: ["ISO27001", "SOC2"],
      preview:
        "https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?ixlib=rb-4.0.3&auto=format&fit=crop&w=100&q=80",
    },
    {
      id: 19,
      name: "Risk-Management",
      passingScore: 70,
      questions: 9,
      pages: 24,
      isPremium: true,
      complianceFrameworks: ["NIST", "ISO27001", "SOC2"],
      preview:
        "https://images.unsplash.com/photo-1563013544-824ae1b704d3?ixlib=rb-4.0.3&auto=format&fit=crop&w=100&q=80",
    },
    {
      id: 20,
      name: "Secure-Coding",
      passingScore: 70,
      questions: 8,
      pages: 20,
      isPremium: true,
      complianceFrameworks: ["OWASP", "SOC2"],
      preview:
        "https://images.unsplash.com/photo-1590736969955-71cc94901144?ixlib=rb-4.0.3&auto=format&fit=crop&w=100&q=80",
    },
    {
      id: 21,
      name: "Social-Engineering",
      passingScore: 70,
      questions: 7,
      pages: 16,
      isPremium: true,
      complianceFrameworks: ["SOC2", "CIS"],
      preview:
        "https://images.unsplash.com/photo-1555949963-aa79dcee981c?ixlib=rb-4.0.3&auto=format&fit=crop&w=100&q=80",
    },
    {
      id: 22,
      name: "Threat-Intelligence",
      passingScore: 70,
      questions: 6,
      pages: 17,
      isPremium: true,
      complianceFrameworks: ["NIST", "ISO27001"],
      preview:
        "https://images.unsplash.com/photo-1558494949-ef010cbdcc31?ixlib=rb-4.0.3&auto=format&fit=crop&w=100&q=80",
    },
    {
      id: 23,
      name: "Vulnerability-Management",
      passingScore: 70,
      questions: 8,
      pages: 19,
      isPremium: true,
      complianceFrameworks: ["NIST", "CIS", "SOC2"],
      preview:
        "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?ixlib=rb-4.0.3&auto=format&fit=crop&w=100&q=80",
    },
    {
      id: 24,
      name: "Web-Application-Security",
      passingScore: 70,
      questions: 7,
      pages: 15,
      isPremium: true,
      complianceFrameworks: ["OWASP", "SOC2"],
      preview:
        "https://images.unsplash.com/photo-1551288049-bebda4e38f71?ixlib=rb-4.0.3&auto=format&fit=crop&w=100&q=80",
    },
    {
      id: 25,
      name: "Zero-Trust-Architecture",
      passingScore: 70,
      questions: 9,
      pages: 23,
      isPremium: true,
      complianceFrameworks: ["NIST", "SOC2", "ISO27001"],
      preview:
        "https://images.unsplash.com/photo-1577563908411-5077b6dc7624?ixlib=rb-4.0.3&auto=format&fit=crop&w=100&q=80",
    },
  ];

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  const getSortIcon = (field: string) => {
    if (sortField !== field) {
      return <ChevronUp className="w-4 h-4 text-gray-400" />;
    }
    return sortDirection === "asc" ? (
      <ChevronUp className="w-4 h-4 text-[var(--neon-blue)]" />
    ) : (
      <ChevronDown className="w-4 h-4 text-[var(--neon-blue)]" />
    );
  };

  const totalPages = Math.ceil(modules.length / entriesPerPage);
  const startIndex = currentPage * entriesPerPage;
  const endIndex = startIndex + entriesPerPage;
  const currentData = modules.slice(startIndex, endIndex);

  const handlePageClick = (event: { selected: number }) => {
    setCurrentPage(event.selected);
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
      {/* Table Header */}
      <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">
            Manage Training Modules
          </h3>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600">Show</span>
              <select
                value={entriesPerPage}
                onChange={(e) => setEntriesPerPage(Number(e.target.value))}
                className="px-2 py-1 border border-gray-300 rounded text-sm bg-white text-[var(--navy-blue)] focus:outline-none focus:ring-2 focus:ring-[var(--neon-blue)]"
              >
                <option value={10} className="text-[var(--navy-blue)]">
                  10
                </option>
                <option value={25} className="text-[var(--navy-blue)]">
                  25
                </option>
                <option value={50} className="text-[var(--navy-blue)]">
                  50
                </option>
                <option value={100} className="text-[var(--navy-blue)]">
                  100
                </option>
              </select>
              <span className="text-sm text-gray-600">entries</span>
            </div>
            <div className="text-sm text-gray-600">
              See our training modules{" "}
              <a href="#" className="text-[var(--neon-blue)] hover:underline">
                support article
              </a>
            </div>
          </div>
        </div>

        {/* Search Bar */}
        <div className="mt-4">
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600">Search:</span>
            <input
              type="text"
              className="px-3 py-1 border border-gray-300 rounded text-sm bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-[var(--neon-blue)]"
              placeholder="Search training modules..."
            />
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                onClick={() => handleSort("name")}
              >
                <div className="flex items-center gap-1">
                  MODULE NAME
                  {getSortIcon("name")}
                </div>
              </th>
              <th
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                onClick={() => handleSort("passingScore")}
              >
                <div className="flex items-center gap-1">
                  PASSING SCORE
                  {getSortIcon("passingScore")}
                </div>
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                TRAINING INFORMATION
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                <div className="flex items-center gap-1">
                  COMPLIANCE FRAMEWORKS
                  <Info className="w-3 h-3 text-gray-400" />
                </div>
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                PREVIEW
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                ACTIONS
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {currentData.map((module) => (
              <tr key={module.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-gray-900">
                    {module.name}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">
                    {module.passingScore}%
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex flex-wrap gap-2">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                      Questions: {module.questions}
                    </span>
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                      Pages: {module.pages}
                    </span>
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                      <Lock className="w-3 h-3 mr-1" />
                      Premium
                    </span>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex flex-wrap gap-1">
                    {module.complianceFrameworks.map((framework, index) => (
                      <span
                        key={index}
                        className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-blue-100 text-blue-800 border border-blue-200"
                      >
                        {framework}
                      </span>
                    ))}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="w-12 h-8 rounded border border-gray-200 overflow-hidden">
                    <img
                      src={module.preview}
                      alt={module.name}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.currentTarget.src =
                          "https://images.unsplash.com/photo-1563013544-824ae1b704d3?ixlib=rb-4.0.3&auto=format&fit=crop&w=100&q=80";
                      }}
                    />
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center gap-2">
                    <button className="p-1 text-gray-400 hover:text-[var(--neon-blue)] transition-colors">
                      <Edit className="w-4 h-4" />
                    </button>
                    <button className="p-1 text-gray-400 hover:text-[var(--neon-blue)] transition-colors">
                      <Copy className="w-4 h-4" />
                    </button>
                    <button className="p-1 text-gray-400 hover:text-red-500 transition-colors">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-700">
            Showing {startIndex + 1} to {Math.min(endIndex, modules.length)} of{" "}
            {modules.length} entries
          </div>
          <ReactPaginate
            breakLabel="..."
            nextLabel="Next"
            onPageChange={handlePageClick}
            pageRangeDisplayed={5}
            pageCount={totalPages}
            previousLabel="Previous"
            renderOnZeroPageCount={null}
            className="flex items-center gap-2"
            pageClassName="px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-50 cursor-pointer text-gray-700"
            pageLinkClassName="block text-gray-700"
            activeClassName="bg-[var(--neon-blue)] text-white border-[var(--neon-blue)]"
            previousClassName="px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-50 cursor-pointer text-gray-700"
            nextClassName="px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-50 cursor-pointer text-gray-700"
            disabledClassName="opacity-50 cursor-not-allowed text-gray-400"
            breakClassName="px-2 text-sm text-gray-500"
          />
        </div>
      </div>
    </div>
  );
};

export default ModuleTable;
