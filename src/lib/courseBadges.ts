import type { LucideIcon } from "lucide-react";
import {
  Award,
  Network,
  Bug,
  Key,
  Shield,
  Lock,
  Target,
  Zap,
  BookOpen,
  FileCheck,
} from "lucide-react";

export interface BadgeOption {
  id: string;
  label: string;
}

export const AVAILABLE_BADGES: BadgeOption[] = [
  { id: "award", label: "Course Complete" },
  { id: "network", label: "Network Security" },
  { id: "bug", label: "Threat Awareness" },
  { id: "key", label: "Access Control" },
  { id: "shield", label: "Security Awareness" },
  { id: "lock", label: "Data Protection" },
  { id: "target", label: "Phishing Defense" },
  { id: "zap", label: "Quick Learner" },
  { id: "book-open", label: "Knowledge Builder" },
  { id: "file-check", label: "Quiz Master" },
];

const iconMap: Record<string, LucideIcon> = {
  award: Award,
  network: Network,
  bug: Bug,
  key: Key,
  shield: Shield,
  lock: Lock,
  target: Target,
  zap: Zap,
  "book-open": BookOpen,
  "file-check": FileCheck,
};

export function getBadgeIcon(id: string): LucideIcon | null {
  return iconMap[id] ?? null;
}
