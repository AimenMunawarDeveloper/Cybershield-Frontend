import React from "react";
import { render, screen } from "@testing-library/react";
import DataTable from "@/components/DataTable";

vi.mock("@/hooks/useTranslation", () => ({
  useTranslation: () => ({
    t: (text: string) => text,
  }),
}));

describe("DataTable", () => {
  it("renders loading state", () => {
    render(<DataTable loading />);

    expect(screen.getByText("Loading...")).toBeInTheDocument();
  });

  it("renders empty state for affiliated users with no courses", () => {
    render(<DataTable userRole="affiliated" coursesData={[]} />);

    expect(screen.getByText("No courses available")).toBeInTheDocument();
  });

  it("renders transformed affiliated course data", () => {
    render(
      <DataTable
        userRole="affiliated"
        coursesData={[
          {
            _id: "course-1",
            courseTitle: "Email Security Basics",
            totalModules: 3,
            modulesCompleted: 2,
            progressPercent: 67,
            isCompleted: false,
          },
        ]}
      />
    );

    expect(screen.getByText("Your Courses")).toBeInTheDocument();
    expect(screen.getByText("Email Security Basics")).toBeInTheDocument();
    expect(screen.getByText("67% score")).toBeInTheDocument();
  });

  it("renders static system admin data and headings", () => {
    render(<DataTable userRole="system_admin" />);

    expect(screen.getByText("Organizations")).toBeInTheDocument();
    expect(screen.getByText("ORGANIZATIONS")).toBeInTheDocument();
    expect(screen.getByText("National University of Sciences & Technology")).toBeInTheDocument();
  });
});
