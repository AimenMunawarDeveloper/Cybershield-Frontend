"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import ReactPaginate from "react-paginate";
import {
  ChevronUp,
  ChevronDown,
  Edit,
  Copy,
  Trash2,
  Info,
} from "lucide-react";
import type { Course } from "@/lib/coursesData";

const DEFAULT_IMAGE =
  "https://images.unsplash.com/photo-1563013544-824ae1b704d3?ixlib=rb-4.0.3&auto=format&fit=crop&w=100&q=80";

interface ModuleTableProps {
  courses?: Course[];
  loading?: boolean;
  error?: string | null;
  onEdit?: (course: Course) => void;
  onDelete?: (course: Course) => void;
}

const ModuleTable = ({ courses = [], loading = false, error = null, onEdit, onDelete }: ModuleTableProps) => {
  const router = useRouter();
  const [sortField, setSortField] = useState<string | null>("createdAt");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");
  const [currentPage, setCurrentPage] = useState(0);
  const [entriesPerPage, setEntriesPerPage] = useState(10);

  const handleCourseClick = (courseId: string) => {
    router.push(`/dashboard/training-modules/${courseId}`);
  };

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
      return <ChevronUp className="w-4 h-4 text-muted-foreground" />;
    }
    return sortDirection === "asc" ? (
      <ChevronUp className="w-4 h-4 text-primary" />
    ) : (
      <ChevronDown className="w-4 h-4 text-primary" />
    );
  };

  const sorted = [...courses].sort((a, b) => {
    if (sortField === "courseTitle") {
      const cmp = a.courseTitle.localeCompare(b.courseTitle);
      return sortDirection === "asc" ? cmp : -cmp;
    }
    if (sortField === "createdAt") {
      const t1 = new Date(a.createdAt || 0).getTime();
      const t2 = new Date(b.createdAt || 0).getTime();
      return sortDirection === "asc" ? t1 - t2 : t2 - t1;
    }
    if (sortField === "modules") {
      const m1 = a.modules?.length ?? 0;
      const m2 = b.modules?.length ?? 0;
      return sortDirection === "asc" ? m1 - m2 : m2 - m1;
    }
    return 0;
  });

  const totalPages = Math.max(1, Math.ceil(sorted.length / entriesPerPage));
  const startIndex = currentPage * entriesPerPage;
  const endIndex = startIndex + entriesPerPage;
  const currentData = sorted.slice(startIndex, endIndex);

  const handlePageClick = (event: { selected: number }) => {
    setCurrentPage(event.selected);
  };

  if (loading) {
    return (
      <div className="bg-card rounded-lg shadow-sm border border-border p-8 text-center text-muted-foreground">
        Loading courses...
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-card rounded-lg shadow-sm border border-border p-8 text-center text-destructive">
        {error}
      </div>
    );
  }

  return (
    <div className="bg-card rounded-lg shadow-sm border border-border overflow-hidden">
      <div className="px-6 py-4 border-b border-border bg-muted/50">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-foreground">
            Manage Training Modules
          </h3>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Show</span>
              <select
                value={entriesPerPage}
                onChange={(e) => {
                  setEntriesPerPage(Number(e.target.value));
                  setCurrentPage(0);
                }}
                className="px-2 py-1 border border-border rounded text-sm bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value={10} className="text-foreground">10</option>
                <option value={25} className="text-foreground">25</option>
                <option value={50} className="text-foreground">50</option>
                <option value={100} className="text-foreground">100</option>
              </select>
              <span className="text-sm text-muted-foreground">entries</span>
            </div>
            <div className="text-sm text-muted-foreground">
              See our training modules{" "}
              <a href="#" className="text-primary hover:underline">
                support article
              </a>
            </div>
          </div>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-muted/50 border-b border-border">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider w-12">
                PREVIEW
              </th>
              <th
                className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider cursor-pointer hover:bg-muted"
                onClick={() => handleSort("courseTitle")}
              >
                <div className="flex items-center gap-1">
                  COURSE NAME
                  {getSortIcon("courseTitle")}
                </div>
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                DESCRIPTION
              </th>
              <th
                className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider cursor-pointer hover:bg-muted"
                onClick={() => handleSort("modules")}
              >
                <div className="flex items-center gap-1">
                  MODULES
                  {getSortIcon("modules")}
                </div>
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                CREATED BY
              </th>
              <th
                className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider cursor-pointer hover:bg-muted"
                onClick={() => handleSort("createdAt")}
              >
                <div className="flex items-center gap-1">
                  CREATED
                  {getSortIcon("createdAt")}
                </div>
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                ACTIONS
              </th>
            </tr>
          </thead>
          <tbody className="bg-card divide-y divide-border">
            {currentData.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-6 py-12 text-center text-muted-foreground">
                  No courses yet. Create one using &quot;New Training Module&quot;.
                </td>
              </tr>
            ) : (
              currentData.map((course) => (
                <tr
                  key={course._id}
                  className="hover:bg-muted/50 cursor-pointer"
                  onClick={() => handleCourseClick(course._id)}
                >
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="w-12 h-8 rounded border border-border overflow-hidden">
                      <img
                        src={DEFAULT_IMAGE}
                        alt={course.courseTitle}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.currentTarget.src = DEFAULT_IMAGE;
                        }}
                      />
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm font-medium text-foreground">
                      {course.courseTitle}
                    </div>
                  </td>
                  <td className="px-6 py-4 max-w-xs">
                    <div className="text-sm text-muted-foreground truncate" title={course.description || ""}>
                      {course.description || "—"}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-foreground">
                      {course.modules?.length ?? 0}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-600">
                      {course.createdBy?.displayName || course.createdBy?.email || "—"}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-600">
                      {course.createdAt
                        ? new Date(course.createdAt).toLocaleDateString()
                        : "—"}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                    <div className="flex items-center gap-2">
                      {onEdit && (
                        <button
                          type="button"
                          onClick={() => onEdit(course)}
                          className="p-1 text-muted-foreground hover:text-primary transition-colors"
                          title="Edit"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                      )}
                      <button
                        type="button"
                        className="p-1 text-muted-foreground hover:text-primary transition-colors"
                        title="Copy"
                        onClick={() => {}}
                      >
                        <Copy className="w-4 h-4" />
                      </button>
                      {onDelete && (
                        <button
                          type="button"
                          onClick={() => onDelete(course)}
                          className="p-1 text-muted-foreground hover:text-destructive transition-colors"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {currentData.length > 0 && (
        <div className="px-6 py-4 border-t border-border bg-muted/50">
          <div className="flex items-center justify-between">
            <div className="text-sm text-muted-foreground">
              Showing {startIndex + 1} to {Math.min(endIndex, sorted.length)} of{" "}
              {sorted.length} entries
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
              pageClassName="px-3 py-1 text-sm border border-border rounded hover:bg-muted cursor-pointer text-foreground"
              pageLinkClassName="block text-foreground"
              activeClassName="bg-primary text-primary-foreground border-primary"
              previousClassName="px-3 py-1 text-sm border border-border rounded hover:bg-muted cursor-pointer text-foreground"
              nextClassName="px-3 py-1 text-sm border border-border rounded hover:bg-muted cursor-pointer text-foreground"
              disabledClassName="opacity-50 cursor-not-allowed text-muted-foreground"
              breakClassName="px-2 text-sm text-muted-foreground"
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default ModuleTable;
