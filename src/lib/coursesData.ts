/**
 * Types for courses from the API (MongoDB).
 * Course list and details are fetched from /api/courses.
 */

export interface MediaItem {
  type: 'image' | 'video';
  url: string;
  alt?: string;
  caption?: string;
  publicId?: string; // Cloudinary public ID (for images or legacy videos)
  subtitleUrl?: string; // URL with subtitle overlay (for legacy Cloudinary videos)
  youtubeId?: string; // YouTube video ID (for videos uploaded to YouTube)
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

export type ActivityType = "email" | "whatsapp";

export interface CourseModule {
  _id?: string;
  title: string;
  sections: ModuleSection[];
  quiz: QuizQuestion[];
  activityType?: ActivityType | null;
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
