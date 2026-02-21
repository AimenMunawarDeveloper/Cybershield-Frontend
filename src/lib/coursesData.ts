/**
 * Types for courses from the API (MongoDB).
 * Course list and details are fetched from /api/courses.
 */

export interface ModuleSection {
  _id?: string;
  title: string;
  material: string;
  urls: string[];
}

export interface QuizQuestion {
  _id?: string;
  question: string;
  choices: string[];
  correctIndex: number;
}

export interface CourseModule {
  _id?: string;
  title: string;
  sections: ModuleSection[];
  quiz: QuizQuestion[];
}

export interface CourseCreatedBy {
  _id: string;
  displayName?: string;
  email?: string;
}

export type CourseLevel = "basic" | "advanced";

export interface Course {
  _id: string;
  courseTitle: string;
  description: string;
  level?: CourseLevel;
  modules: CourseModule[];
  badges?: string[];
  createdBy?: CourseCreatedBy;
  createdAt?: string;
  updatedAt?: string;
}
