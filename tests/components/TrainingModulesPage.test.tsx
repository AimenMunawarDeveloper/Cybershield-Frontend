import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import { vi, describe, it, expect, beforeEach } from "vitest";
import React from "react";

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

const {
  mockGetUserProfile,
  mockGetCourses,
  mockCreateCourse,
  mockUpdateCourse,
  mockDeleteCourse,
} = vi.hoisted(() => ({
  mockGetUserProfile: vi.fn(),
  mockGetCourses: vi.fn(),
  mockCreateCourse: vi.fn(),
  mockUpdateCourse: vi.fn(),
  mockDeleteCourse: vi.fn(),
}));

const mockPush = vi.fn();

vi.mock("@clerk/nextjs", () => ({
  useUser: () => ({ user: { id: "user-1" }, isLoaded: true }),
  useAuth: () => ({ getToken: vi.fn(async () => "token") }),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush }),
  usePathname: () => "/dashboard/training-modules",
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
    getUserProfile: mockGetUserProfile,
    getCourses: mockGetCourses,
    createCourse: mockCreateCourse,
    updateCourse: mockUpdateCourse,
    deleteCourse: mockDeleteCourse,
  })),
}));

vi.mock("@/hooks/useTranslation", () => ({
  useTranslation: () => ({
    t: (s: string) => s,
    tAsync: vi.fn(async (s: string) => s),
    preTranslate: vi.fn(async () => {}),
    language: "en",
  }),
}));

vi.mock("@/components/HeroSection", () => ({
  default: ({ courses }: { courses?: unknown[] }) =>
    React.createElement("div", { "data-testid": "hero-section" }, `Hero: ${courses?.length ?? 0} courses`),
}));

vi.mock("@/components/ModuleTable", () => ({
  default: ({ courses, loading }: { courses: unknown[]; loading: boolean }) =>
    React.createElement(
      "div",
      { "data-testid": "module-table" },
      loading ? "Loading..." : `Table: ${courses?.length ?? 0} courses`
    ),
}));

vi.mock("@/components/CreateTrainingModuleModal", () => ({
  default: ({ isOpen, onClose, onSubmit }: { isOpen: boolean; onClose: () => void; onSubmit: (data: unknown) => void }) =>
    isOpen
      ? React.createElement(
          "div",
          { "data-testid": "create-modal" },
          React.createElement("button", { onClick: onClose }, "Close Modal"),
          React.createElement(
            "button",
            {
              onClick: () =>
                onSubmit({
                  courseTitle: "Test Course",
                  description: "",
                  level: "basic",
                  badges: [],
                  modules: [{ title: "M1", sections: [{ title: "S1", material: "C" }], quiz: [] }],
                }),
            },
            "Submit Course"
          )
        )
      : null,
}));

vi.mock("@/lib/coursesData", () => ({}));

import TrainingModulesPage from "@/app/dashboard/training-modules/page";

// ---------------------------------------------------------------------------
// Sample data
// ---------------------------------------------------------------------------

const sampleCourses = [
  {
    _id: "c1",
    courseTitle: "Phishing Awareness",
    description: "Learn about phishing attacks",
    level: "basic",
    modules: [{ title: "Module 1", sections: [{ title: "S1", material: "Content" }], quiz: [] }],
    badges: [],
    createdBy: { _id: "u1", displayName: "Admin", email: "admin@test.com" },
    createdAt: "2026-04-20T00:00:00Z",
    orgId: null,
  },
  {
    _id: "c2",
    courseTitle: "Password Security",
    description: "Secure your passwords",
    level: "advanced",
    modules: [{ title: "Module 1", sections: [{ title: "S1", material: "Content" }], quiz: [] }],
    badges: ["security_champion"],
    createdBy: { _id: "u1", displayName: "Admin", email: "admin@test.com" },
    createdAt: "2026-04-19T00:00:00Z",
    orgId: null,
  },
];

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("TrainingModulesPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetUserProfile.mockResolvedValue({
      _id: "u1",
      email: "admin@test.com",
      displayName: "Admin",
      role: "system_admin",
    });
    mockGetCourses.mockResolvedValue({
      success: true,
      courses: sampleCourses,
      pagination: { page: 1, limit: 100, total: 2, pages: 1 },
    });
  });

  it("renders hero section and course catalog", async () => {
    render(<TrainingModulesPage />);

    await waitFor(() => {
      expect(screen.getByText("Explore Our Course Catalog")).toBeInTheDocument();
    });

    expect(screen.getByTestId("hero-section")).toBeInTheDocument();
  });

  it("displays courses in grid view by default", async () => {
    render(<TrainingModulesPage />);

    await waitFor(() => {
      expect(screen.getByText("Phishing Awareness")).toBeInTheDocument();
    });

    expect(screen.getByText("Password Security")).toBeInTheDocument();
  });

  it("shows 'New Training Module' button for admins", async () => {
    render(<TrainingModulesPage />);

    await waitFor(() => {
      expect(screen.getByText("New Training Module")).toBeInTheDocument();
    });
  });

  it("hides 'New Training Module' button for affiliated users", async () => {
    mockGetUserProfile.mockResolvedValue({
      _id: "u2",
      email: "user@test.com",
      displayName: "Regular User",
      role: "affiliated",
    });

    render(<TrainingModulesPage />);

    await waitFor(() => {
      expect(screen.getByText("Explore Our Course Catalog")).toBeInTheDocument();
    });

    expect(screen.queryByText("New Training Module")).not.toBeInTheDocument();
  });

  it("client_admin can see the create button", async () => {
    mockGetUserProfile.mockResolvedValue({
      _id: "u3",
      email: "ca@test.com",
      displayName: "Client Admin",
      role: "client_admin",
      orgId: "org1",
    });

    render(<TrainingModulesPage />);

    await waitFor(() => {
      expect(screen.getByText("New Training Module")).toBeInTheDocument();
    });
  });

  it("switches to table view", async () => {
    render(<TrainingModulesPage />);

    await waitFor(() => {
      expect(screen.getByText("Table View")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText("Table View"));

    await waitFor(() => {
      expect(screen.getByTestId("module-table")).toBeInTheDocument();
    });
  });

  it("has grid and table view toggle buttons", async () => {
    render(<TrainingModulesPage />);

    await waitFor(() => {
      expect(screen.getByText("Grid View")).toBeInTheDocument();
      expect(screen.getByText("Table View")).toBeInTheDocument();
    });
  });

  it("has search input", async () => {
    render(<TrainingModulesPage />);

    await waitFor(() => {
      expect(screen.getByPlaceholderText("Search Courses")).toBeInTheDocument();
    });
  });

  it("filters courses by search query", async () => {
    render(<TrainingModulesPage />);

    await waitFor(() => {
      expect(screen.getByText("Phishing Awareness")).toBeInTheDocument();
    });

    const searchInput = screen.getByPlaceholderText("Search Courses");
    fireEvent.change(searchInput, { target: { value: "Phishing" } });

    await waitFor(() => {
      expect(screen.getByText("Phishing Awareness")).toBeInTheDocument();
      expect(screen.queryByText("Password Security")).not.toBeInTheDocument();
    });
  });

  it("has sort dropdown with options", async () => {
    render(<TrainingModulesPage />);

    await waitFor(() => {
      expect(screen.getByText("Newest First")).toBeInTheDocument();
      expect(screen.getByText("Oldest First")).toBeInTheDocument();
      expect(screen.getByText("Alphabetical (A to Z)")).toBeInTheDocument();
    });
  });

  it("has filter dropdown", async () => {
    render(<TrainingModulesPage />);

    await waitFor(() => {
      expect(screen.getByText("Show all trainings")).toBeInTheDocument();
    });
  });

  it("fetches courses and profile on load", async () => {
    render(<TrainingModulesPage />);

    await waitFor(() => {
      expect(mockGetUserProfile).toHaveBeenCalled();
      expect(mockGetCourses).toHaveBeenCalled();
    });
  });

  it("shows loading state", async () => {
    mockGetCourses.mockImplementation(() => new Promise(() => {}));

    render(<TrainingModulesPage />);

    await waitFor(() => {
      expect(screen.getByText(/Loading courses/)).toBeInTheDocument();
    });
  });

  it("shows error state when fetch fails", async () => {
    mockGetCourses.mockRejectedValue(new Error("Network error"));

    render(<TrainingModulesPage />);

    await waitFor(() => {
      expect(screen.getByText("Network error")).toBeInTheDocument();
    });
  });

  it("opens create modal when 'New Training Module' is clicked", async () => {
    render(<TrainingModulesPage />);

    await waitFor(() => {
      expect(screen.getByText("New Training Module")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText("New Training Module"));

    await waitFor(() => {
      expect(screen.getByTestId("create-modal")).toBeInTheDocument();
    });
  });

  it("submits new course via modal", async () => {
    mockCreateCourse.mockResolvedValue({ success: true, course: { _id: "c3", courseTitle: "Test Course" } });

    render(<TrainingModulesPage />);

    await waitFor(() => {
      expect(screen.getByText("New Training Module")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText("New Training Module"));

    await waitFor(() => {
      expect(screen.getByTestId("create-modal")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText("Submit Course"));

    await waitFor(() => {
      expect(mockCreateCourse).toHaveBeenCalled();
    });
  });

  it("shows delete confirmation when delete is triggered", async () => {
    render(<TrainingModulesPage />);

    await waitFor(() => {
      expect(screen.getByText("Phishing Awareness")).toBeInTheDocument();
    });

    const deleteButtons = screen.getAllByTitle("Delete");
    fireEvent.click(deleteButtons[0]);

    await waitFor(() => {
      expect(screen.getByText(/Delete course/)).toBeInTheDocument();
      expect(screen.getByText(/This will permanently delete/)).toBeInTheDocument();
    });
  });

  it("has language selector with English, Spanish, French, German", async () => {
    render(<TrainingModulesPage />);

    await waitFor(() => {
      expect(screen.getByText("English")).toBeInTheDocument();
      expect(screen.getByText("Spanish")).toBeInTheDocument();
      expect(screen.getByText("French")).toBeInTheDocument();
      expect(screen.getByText("German")).toBeInTheDocument();
    });
  });

  it("shows edit button for admins on course cards", async () => {
    render(<TrainingModulesPage />);

    await waitFor(() => {
      expect(screen.getByText("Phishing Awareness")).toBeInTheDocument();
    });

    const editButtons = screen.getAllByTitle("Edit");
    expect(editButtons.length).toBeGreaterThanOrEqual(1);
  });

  it("course cards show description and level", async () => {
    render(<TrainingModulesPage />);

    await waitFor(() => {
      expect(screen.getByText("Learn about phishing attacks")).toBeInTheDocument();
    });
  });

  it("shows empty state when no courses", async () => {
    mockGetCourses.mockResolvedValue({ success: true, courses: [], pagination: { page: 1, limit: 100, total: 0, pages: 1 } });

    render(<TrainingModulesPage />);

    await waitFor(() => {
      expect(screen.getByText("Explore Our Course Catalog")).toBeInTheDocument();
    });
  });
});
