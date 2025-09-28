"use client";

import { Check, MoreVertical } from "lucide-react";

const projects = [
  {
    id: 1,
    company: {
      icon: "Xd",
      name: "Chakra Soft UI Version",
      iconColor: "bg-purple-500",
    },
    members: [
      { name: "A", color: "bg-blue-500" },
      { name: "B", color: "bg-green-500" },
      { name: "C", color: "bg-yellow-500" },
      { name: "D", color: "bg-red-500" },
      { name: "E", color: "bg-purple-500" },
    ],
    budget: "$14,000",
    completion: 60,
  },
  {
    id: 2,
    company: {
      icon: "△",
      name: "Add Progress Track",
      iconColor: "bg-blue-500",
    },
    members: [
      { name: "F", color: "bg-indigo-500" },
      { name: "G", color: "bg-pink-500" },
    ],
    budget: "$3,000",
    completion: 10,
  },
];

export default function DataTable() {
  return (
    <div className="dashboard-card rounded-lg p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-white mb-1">Projects</h3>
          <div className="flex items-center text-sm">
            <Check className="w-4 h-4 text-[var(--success-green)] mr-1" />
            <span className="text-[var(--medium-grey)]">
              30 done this month
            </span>
          </div>
        </div>
        <button className="w-8 h-8 bg-[var(--navy-blue-lighter)] rounded-lg flex items-center justify-center hover:bg-[var(--navy-blue)] transition-colors">
          <MoreVertical className="w-4 h-4 text-white" />
        </button>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          {/* Table Header */}
          <thead>
            <tr className="border-b border-[var(--navy-blue-lighter)]">
              <th className="text-left py-3 px-0 text-sm font-medium text-[var(--medium-grey)]">
                COMPANIES
              </th>
              <th className="text-left py-3 px-4 text-sm font-medium text-[var(--medium-grey)]">
                MEMBERS
              </th>
              <th className="text-left py-3 px-4 text-sm font-medium text-[var(--medium-grey)]">
                BUDGET
              </th>
              <th className="text-left py-3 px-4 text-sm font-medium text-[var(--medium-grey)]">
                COMPLETION
              </th>
            </tr>
          </thead>

          {/* Table Body */}
          <tbody>
            {projects.map((project) => (
              <tr
                key={project.id}
                className="border-b border-[var(--navy-blue-lighter)] last:border-b-0"
              >
                {/* Company */}
                <td className="py-4 px-0">
                  <div className="flex items-center">
                    <div
                      className={`w-8 h-8 ${project.company.iconColor} rounded-lg flex items-center justify-center mr-3`}
                    >
                      <span className="text-white text-xs font-bold">
                        {project.company.icon}
                      </span>
                    </div>
                    <span className="text-white text-sm">
                      {project.company.name}
                    </span>
                  </div>
                </td>

                {/* Members */}
                <td className="py-4 px-4">
                  <div className="flex -space-x-2">
                    {project.members.map((member, index) => (
                      <div
                        key={index}
                        className={`w-8 h-8 ${member.color} rounded-full flex items-center justify-center border-2 border-[var(--navy-blue-light)]`}
                      >
                        <span className="text-white text-xs font-medium">
                          {member.name}
                        </span>
                      </div>
                    ))}
                  </div>
                </td>

                {/* Budget */}
                <td className="py-4 px-4">
                  <span className="text-white text-sm">{project.budget}</span>
                </td>

                {/* Completion */}
                <td className="py-4 px-4">
                  <div className="flex items-center">
                    <span className="text-white text-sm mr-2">
                      {project.completion}%
                    </span>
                    <div className="w-16 h-2 bg-[var(--navy-blue-lighter)] rounded-full overflow-hidden">
                      <div
                        className="h-full bg-[var(--neon-blue)] rounded-full transition-all duration-300"
                        style={{ width: `${project.completion}%` }}
                      />
                    </div>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
