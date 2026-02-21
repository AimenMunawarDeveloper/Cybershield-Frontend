"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { Clock, Users } from "lucide-react";
import type { Course } from "@/lib/coursesData";

const DEFAULT_IMAGE =
  "https://images.unsplash.com/photo-1563013544-824ae1b704d3?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80";

interface ModuleGridProps {
  courses?: Course[];
}

const ModuleGrid = ({ courses = [] }: ModuleGridProps) => {
  if (courses.length === 0) {
    return (
      <div className="container mx-auto px-4 py-8 text-center text-gray-500">
        No courses yet. Create one from the training modules page.
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {courses.map((course) => (
          <ModuleCard key={course._id} course={course} />
        ))}
      </div>
    </div>
  );
};

const ModuleCard = ({ course }: { course: Course }) => {
  const router = useRouter();

  return (
    <div
      onClick={() => router.push(`/dashboard/training-modules/${course._id}`)}
      className="group relative overflow-hidden rounded-2xl bg-white shadow-lg transition-all duration-300 hover:shadow-2xl hover:scale-[1.02] cursor-pointer border border-gray-100"
    >
      <div className="relative h-48 overflow-hidden">
        <img
          src={DEFAULT_IMAGE}
          alt={course.courseTitle}
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
          onError={(e) => {
            (e.target as HTMLImageElement).src = DEFAULT_IMAGE;
          }}
        />
      </div>
      <div className="p-5">
        <h2 className="text-xl font-bold mb-2 text-gray-900 line-clamp-2">
          {course.courseTitle}
        </h2>
        <p className="text-gray-600 mb-4 line-clamp-2 text-sm">
          {course.description || "No description"}
        </p>
        <div className="flex items-center justify-between text-sm text-gray-500">
          {course.createdBy && (
            <span className="flex items-center gap-1">
              <Users className="w-4 h-4" />
              {course.createdBy.displayName || course.createdBy.email}
            </span>
          )}
          {course.createdAt && (
            <span className="flex items-center gap-1">
              <Clock className="w-4 h-4" />
              {new Date(course.createdAt).toLocaleDateString()}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

export default ModuleGrid;
