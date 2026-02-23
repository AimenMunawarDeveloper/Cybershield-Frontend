/**
 * Types for courses from the API (MongoDB).
 * Course list and details are fetched from /api/courses.
 */

export interface MediaItem {
  type: 'image' | 'video';
  url: string;
  alt?: string;
  caption?: string;
}

export interface ModuleSection {
  _id?: string;
  title: string;
  material: string;
  urls: string[];
  media?: MediaItem[];
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
