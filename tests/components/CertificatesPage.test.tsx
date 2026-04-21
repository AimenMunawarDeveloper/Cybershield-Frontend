import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import { vi, describe, it, expect, beforeEach } from "vitest";
import React from "react";

const {
  mockPush,
  mockGetToken,
  mockGetUserCertificates,
} = vi.hoisted(() => ({
  mockPush: vi.fn(),
  mockGetToken: vi.fn().mockImplementation(async () => "test-token"),
  mockGetUserCertificates: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush }),
}));

vi.mock("@clerk/nextjs", () => ({
  useAuth: () => ({ getToken: mockGetToken }),
}));

vi.mock("@/lib/api", () => ({
  ApiClient: vi.fn().mockImplementation(() => ({
    getUserCertificates: mockGetUserCertificates,
  })),
}));

vi.mock("@/contexts/LanguageContext", () => ({
  useLanguage: () => ({ language: "en" }),
}));

vi.mock("@/hooks/useTranslation", () => ({
  useTranslation: () => ({
    t: (s: string) => s,
    preTranslate: vi.fn(async () => {}),
    isTranslating: false,
  }),
}));

vi.mock("next/image", () => ({
  default: (props: Record<string, unknown>) =>
    React.createElement("img", { ...props, src: props.src as string }),
}));

vi.mock("@/components/NetworkBackground", () => ({
  default: () => React.createElement("div", { "data-testid": "network-bg" }),
}));

vi.mock("@/components/Certificate", () => ({
  default: (props: { userName: string; courseTitle: string; certificateNumber: string; issuedDate: string }) =>
    React.createElement("div", { "data-testid": "certificate-component" }, [
      React.createElement("span", { key: "name" }, props.userName),
      React.createElement("span", { key: "title" }, props.courseTitle),
      React.createElement("span", { key: "num" }, props.certificateNumber),
    ]),
}));

import CertificatesPage from "@/app/dashboard/certificates/page";

describe("CertificatesPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetToken.mockImplementation(async () => "test-token");
  });

  it("shows loading state initially", async () => {
    mockGetUserCertificates.mockImplementation(() => new Promise(() => {}));

    render(<CertificatesPage />);

    expect(screen.getByText("Loading certificates...")).toBeInTheDocument();
  });

  it("renders certificates list when data is loaded", async () => {
    mockGetUserCertificates.mockResolvedValue({
      certificates: [
        {
          _id: "c1",
          userName: "John Doe",
          userEmail: "john@test.com",
          courseTitle: "Cybersecurity Basics",
          courseDescription: "Learn the basics",
          certificateNumber: "CERT-ABC123",
          issuedDate: "2026-01-15T00:00:00Z",
          completionDate: "2026-01-15T00:00:00Z",
          course: {
            courseTitle: "Cybersecurity Basics",
            description: "Learn the basics",
            level: "basic",
            createdByName: "Admin",
          },
        },
      ],
    });

    render(<CertificatesPage />);

    await waitFor(() => {
      expect(screen.getByText("My Certificates")).toBeInTheDocument();
    });

    expect(screen.getByText("Cybersecurity Basics")).toBeInTheDocument();
    expect(screen.getByText("CERT-ABC123")).toBeInTheDocument();
  });

  it("shows empty state when no certificates exist", async () => {
    mockGetUserCertificates.mockResolvedValue({ certificates: [] });

    render(<CertificatesPage />);

    await waitFor(() => {
      expect(screen.getByText("No Certificates Yet")).toBeInTheDocument();
    });

    expect(screen.getByText("Complete courses to earn certificates and showcase your achievements.")).toBeInTheDocument();
    expect(screen.getByText("Browse Courses")).toBeInTheDocument();
  });

  it("shows certificate count in header", async () => {
    mockGetUserCertificates.mockResolvedValue({
      certificates: [
        { _id: "c1", userName: "John", userEmail: "j@t.com", courseTitle: "Course 1", certificateNumber: "CERT-1", issuedDate: "2026-01-01", completionDate: "2026-01-01" },
        { _id: "c2", userName: "John", userEmail: "j@t.com", courseTitle: "Course 2", certificateNumber: "CERT-2", issuedDate: "2026-02-01", completionDate: "2026-02-01" },
      ],
    });

    render(<CertificatesPage />);

    await waitFor(() => {
      expect(screen.getByText("My Certificates")).toBeInTheDocument();
    });

    expect(screen.getByText(/certificates/)).toBeInTheDocument();
    expect(screen.getByText(/earned/)).toBeInTheDocument();
  });

  it("shows View and Download buttons for each certificate", async () => {
    mockGetUserCertificates.mockResolvedValue({
      certificates: [
        { _id: "c1", userName: "John", userEmail: "j@t.com", courseTitle: "Test Course", certificateNumber: "CERT-1", issuedDate: "2026-01-01", completionDate: "2026-01-01" },
      ],
    });

    render(<CertificatesPage />);

    await waitFor(() => {
      expect(screen.getByText("Test Course")).toBeInTheDocument();
    });

    const viewButtons = screen.getAllByText("View");
    const downloadButtons = screen.getAllByText("Download");
    expect(viewButtons.length).toBeGreaterThanOrEqual(1);
    expect(downloadButtons.length).toBeGreaterThanOrEqual(1);
  });

  it("shows Back to Dashboard button", async () => {
    mockGetUserCertificates.mockResolvedValue({ certificates: [] });

    render(<CertificatesPage />);

    await waitFor(() => {
      expect(screen.getByText("Back to Dashboard")).toBeInTheDocument();
    });
  });

  it("shows error state when fetch fails", async () => {
    mockGetUserCertificates.mockRejectedValue(new Error("Network error"));

    render(<CertificatesPage />);

    await waitFor(() => {
      expect(screen.getByText(/Network error|Failed to load/)).toBeInTheDocument();
    });
  });

  it("shows multiple certificates", async () => {
    mockGetUserCertificates.mockResolvedValue({
      certificates: [
        { _id: "c1", userName: "John", userEmail: "j@t.com", courseTitle: "Course A", certificateNumber: "CERT-A", issuedDate: "2026-01-01", completionDate: "2026-01-01" },
        { _id: "c2", userName: "John", userEmail: "j@t.com", courseTitle: "Course B", certificateNumber: "CERT-B", issuedDate: "2026-02-01", completionDate: "2026-02-01" },
        { _id: "c3", userName: "John", userEmail: "j@t.com", courseTitle: "Course C", certificateNumber: "CERT-C", issuedDate: "2026-03-01", completionDate: "2026-03-01" },
      ],
    });

    render(<CertificatesPage />);

    await waitFor(() => {
      expect(screen.getByText("Course A")).toBeInTheDocument();
      expect(screen.getByText("Course B")).toBeInTheDocument();
      expect(screen.getByText("Course C")).toBeInTheDocument();
    });
  });

  it("Browse Courses button navigates to training modules", async () => {
    mockGetUserCertificates.mockResolvedValue({ certificates: [] });

    render(<CertificatesPage />);

    await waitFor(() => {
      expect(screen.getByText("Browse Courses")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText("Browse Courses"));

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith("/dashboard/training-modules");
    });
  });

  it("displays certificate number for each certificate", async () => {
    mockGetUserCertificates.mockResolvedValue({
      certificates: [
        { _id: "c1", userName: "John", userEmail: "j@t.com", courseTitle: "Course 1", certificateNumber: "CERT-XYZ789", issuedDate: "2026-01-01", completionDate: "2026-01-01" },
      ],
    });

    render(<CertificatesPage />);

    await waitFor(() => {
      expect(screen.getByText("CERT-XYZ789")).toBeInTheDocument();
    });
  });

  it("displays issued date for each certificate", async () => {
    mockGetUserCertificates.mockResolvedValue({
      certificates: [
        { _id: "c1", userName: "John", userEmail: "j@t.com", courseTitle: "Course 1", certificateNumber: "CERT-1", issuedDate: "2026-06-15T00:00:00Z", completionDate: "2026-06-15T00:00:00Z" },
      ],
    });

    render(<CertificatesPage />);

    await waitFor(() => {
      expect(screen.getByText("Course 1")).toBeInTheDocument();
    });

    expect(screen.getByText(/2026/)).toBeInTheDocument();
  });

  it("opens certificate modal when View is clicked", async () => {
    mockGetUserCertificates.mockResolvedValue({
      certificates: [
        { _id: "c1", userName: "John Doe", userEmail: "j@t.com", courseTitle: "Modal Course", certificateNumber: "CERT-MODAL", issuedDate: "2026-01-01", completionDate: "2026-01-01", course: { courseTitle: "Modal Course", level: "basic", createdByName: "Admin" } },
      ],
    });

    render(<CertificatesPage />);

    await waitFor(() => {
      expect(screen.getByText("Modal Course")).toBeInTheDocument();
    });

    const viewButtons = screen.getAllByText("View");
    fireEvent.click(viewButtons[0]);

    await waitFor(() => {
      expect(screen.getByText("Certificate Details")).toBeInTheDocument();
    });

    expect(screen.getByTestId("certificate-component")).toBeInTheDocument();
    expect(screen.getByText("Download Certificate")).toBeInTheDocument();
  });

  it("closes certificate modal when Close is clicked", async () => {
    mockGetUserCertificates.mockResolvedValue({
      certificates: [
        { _id: "c1", userName: "John", userEmail: "j@t.com", courseTitle: "Close Test", certificateNumber: "CERT-CL", issuedDate: "2026-01-01", completionDate: "2026-01-01", course: { courseTitle: "Close Test", level: "basic" } },
      ],
    });

    render(<CertificatesPage />);

    await waitFor(() => {
      expect(screen.getByText("Close Test")).toBeInTheDocument();
    });

    fireEvent.click(screen.getAllByText("View")[0]);

    await waitFor(() => {
      expect(screen.getByText("Certificate Details")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText("Close"));

    await waitFor(() => {
      expect(screen.queryByText("Certificate Details")).not.toBeInTheDocument();
    });
  });
});
