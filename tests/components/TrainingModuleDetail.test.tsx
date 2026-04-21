import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import { vi, describe, it, expect, beforeEach } from "vitest";
import React from "react";

// ---------------------------------------------------------------------------
// Stable mocks (hoisted so references don't change between renders)
// ---------------------------------------------------------------------------

const {
  mockGetCourseById,
  mockGetCourseProgress,
  mockGetCertificateByCourse,
  mockGenerateCertificate,
  stableGetToken,
  stablePreTranslate,
  mockPush,
  stableRouter,
  stableT,
  stableLangCtx,
} = vi.hoisted(() => {
  const pushFn = vi.fn();
  return {
    mockGetCourseById: vi.fn(),
    mockGetCourseProgress: vi.fn(),
    mockGetCertificateByCourse: vi.fn(),
    mockGenerateCertificate: vi.fn(),
    stableGetToken: vi.fn(async () => "token"),
    stablePreTranslate: vi.fn(async () => {}),
    mockPush: pushFn,
    stableRouter: { push: pushFn, replace: vi.fn(), prefetch: vi.fn(), back: vi.fn(), forward: vi.fn(), refresh: vi.fn() },
    stableT: (s: string) => s,
    stableLangCtx: { language: "en" },
  };
});

vi.mock("@clerk/nextjs", () => ({
  useAuth: () => ({ getToken: stableGetToken }),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => stableRouter,
  useParams: () => ({ id: "course-1" }),
  usePathname: () => "/dashboard/training-modules/course-1",
}));

vi.mock("next/image", () => ({
  default: (props: Record<string, unknown>) =>
    React.createElement("img", { ...props, src: props.src as string }),
}));

vi.mock("next/link", () => ({
  default: ({ children, href }: { children: React.ReactNode; href: string }) =>
    React.createElement("a", { href }, children),
}));

vi.mock("@/lib/api", () => ({
  ApiClient: vi.fn().mockImplementation(() => ({
    getCourseById: mockGetCourseById,
    getCourseProgress: mockGetCourseProgress,
    getCertificateByCourse: mockGetCertificateByCourse,
    generateCertificate: mockGenerateCertificate,
  })),
}));

vi.mock("@/hooks/useTranslation", () => ({
  useTranslation: () => ({
    t: stableT,
    preTranslate: stablePreTranslate,
    isTranslating: false,
    language: "en",
  }),
}));

vi.mock("@/contexts/LanguageContext", () => ({
  useLanguage: () => stableLangCtx,
}));

vi.mock("@/components/ProgressRadialChart", () => ({
  default: ({ value, label }: { value: number; label: string }) =>
    React.createElement("div", { "data-testid": "progress-chart" }, `${value}% ${label}`),
}));

vi.mock("@/lib/courseBadges", () => ({
  getBadgeIcon: () => "🏆",
  AVAILABLE_BADGES: [
    { id: "phishing_expert", label: "Phishing Expert", icon: "🏆" },
    { id: "security_champion", label: "Security Champion", icon: "🛡" },
  ],
}));

import TrainingModuleDetailPage from "@/app/dashboard/training-modules/[id]/page";

// ---------------------------------------------------------------------------
// Sample data
// ---------------------------------------------------------------------------

const sampleCourse = {
  _id: "course-1",
  courseTitle: "Phishing Awareness Training",
  description: "Learn how to identify and prevent phishing attacks in this comprehensive course.",
  level: "basic",
  modules: [
    {
      _id: "mod-1",
      title: "Introduction to Phishing",
      sections: [
        { _id: "sec-1", title: "What is Phishing", material: "Phishing is a type of social engineering..." },
        { _id: "sec-2", title: "Types of Phishing", material: "Email phishing, spear phishing..." },
      ],
      quiz: [
        { question: "What is phishing?", choices: ["A fish", "Social engineering", "Malware"], correctIndex: 1 },
      ],
      activityType: null,
    },
    {
      _id: "mod-2",
      title: "Preventing Phishing",
      sections: [
        { _id: "sec-3", title: "Best Practices", material: "Always verify the sender..." },
      ],
      quiz: [],
      activityType: null,
    },
  ],
  badges: ["phishing_expert"],
  createdBy: { _id: "u1", displayName: "Admin User", email: "admin@test.com" },
  createdAt: "2026-04-20T00:00:00Z",
  orgId: null,
};

// Helper: wait for full page to render (past loading state)
async function waitForFullRender() {
  await waitFor(() => {
    expect(screen.getByText("Overview")).toBeInTheDocument();
  });
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("TrainingModuleDetailPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetCourseById.mockResolvedValue({ success: true, course: sampleCourse });
    mockGetCourseProgress.mockResolvedValue({ success: true, completed: [] });
    mockGetCertificateByCourse.mockResolvedValue({ success: true, certificate: null });
  });

  it("renders course title and description", async () => {
    const { container } = render(<TrainingModuleDetailPage />);
    await waitForFullRender();

    expect(container.innerHTML).toContain("Phishing Awareness Training");
    expect(container.innerHTML).toContain("Learn how to identify and prevent phishing attacks");
  });

  it("shows loading state initially", () => {
    mockGetCourseById.mockImplementation(() => new Promise(() => {}));
    render(<TrainingModuleDetailPage />);

    expect(screen.getByText("Loading course...")).toBeInTheDocument();
  });

  it("redirects to training modules list when course not found", async () => {
    mockGetCourseById.mockResolvedValue({ success: true, course: null });
    render(<TrainingModuleDetailPage />);

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith("/dashboard/training-modules");
    });
  });

  it("shows Overview and Curriculum tabs", async () => {
    render(<TrainingModuleDetailPage />);

    await waitFor(() => {
      expect(screen.getByText("Overview")).toBeInTheDocument();
      expect(screen.getByText("Curriculum")).toBeInTheDocument();
    });
  });

  it("shows Back to Training Modules link", async () => {
    render(<TrainingModuleDetailPage />);

    await waitFor(() => {
      expect(screen.getByText("Back to Training Modules")).toBeInTheDocument();
    });
  });

  it("shows module titles in curriculum tab", async () => {
    const { container } = render(<TrainingModuleDetailPage />);
    await waitForFullRender();

    fireEvent.click(screen.getByText("Curriculum"));

    await waitFor(() => {
      expect(container.innerHTML).toContain("Introduction to Phishing");
      expect(container.innerHTML).toContain("Preventing Phishing");
    });
  });

  it("shows progress chart", async () => {
    render(<TrainingModuleDetailPage />);

    await waitFor(() => {
      expect(screen.getByTestId("progress-chart")).toBeInTheDocument();
    });
  });

  it("shows course level badge", async () => {
    render(<TrainingModuleDetailPage />);

    await waitFor(() => {
      expect(screen.getByText("Basic")).toBeInTheDocument();
    });
  });

  it("shows badges/achievements section", async () => {
    render(<TrainingModuleDetailPage />);

    await waitFor(() => {
      expect(screen.getByText("Achievements")).toBeInTheDocument();
    });
  });

  it("shows creator info", async () => {
    const { container } = render(<TrainingModuleDetailPage />);
    await waitForFullRender();

    expect(container.innerHTML).toContain("Created by");
    expect(container.innerHTML).toContain("Admin User");
  });

  it("displays progress with some items completed", async () => {
    mockGetCourseProgress.mockResolvedValue({ success: true, completed: ["0-0", "0-1"] });
    const { container } = render(<TrainingModuleDetailPage />);
    await waitForFullRender();

    expect(container.innerHTML).toContain("Phishing Awareness Training");
    expect(screen.getByTestId("progress-chart")).toBeInTheDocument();
  });

  it("fetches course data on mount", async () => {
    render(<TrainingModuleDetailPage />);

    await waitFor(() => {
      expect(mockGetCourseById).toHaveBeenCalledWith("course-1");
      expect(mockGetCourseProgress).toHaveBeenCalledWith("course-1");
    });
  });

  it("shows earn certificate section when not completed", async () => {
    render(<TrainingModuleDetailPage />);

    await waitFor(() => {
      expect(screen.getByText("Earn a Certificate")).toBeInTheDocument();
    });
  });

  it("shows module quiz indicator in curriculum", async () => {
    const { container } = render(<TrainingModuleDetailPage />);
    await waitForFullRender();

    fireEvent.click(screen.getByText("Curriculum"));

    await waitFor(() => {
      expect(container.innerHTML).toContain("Module Quiz");
    });
  });

  it("handles error when loading course fails", async () => {
    mockGetCourseById.mockRejectedValue(new Error("Server error"));
    render(<TrainingModuleDetailPage />);

    await waitFor(() => {
      expect(screen.getByText("Course not found.")).toBeInTheDocument();
    });
  });
});
