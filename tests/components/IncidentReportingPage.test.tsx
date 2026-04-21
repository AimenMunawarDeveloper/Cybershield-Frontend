import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { vi, describe, it, expect, beforeEach } from "vitest";
import React from "react";

// ---------------------------------------------------------------------------
// Mocks — destructured from vi.hoisted for auto-hoisting
// ---------------------------------------------------------------------------

const { mockGetToken } = vi.hoisted(() => ({
  mockGetToken: vi.fn(async () => "mock-token"),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn() }),
}));

vi.mock("@clerk/nextjs", () => ({
  useAuth: () => ({ getToken: mockGetToken }),
}));

vi.mock("@/contexts/LanguageContext", () => ({
  useLanguage: () => ({ language: "en" }),
}));

vi.mock("@/hooks/useTranslation", () => ({
  useTranslation: () => ({
    t: (s: string) => s,
    preTranslate: vi.fn(async () => {}),
    language: "en",
  }),
}));

vi.mock("@/components/NetworkBackground", () => ({
  default: () => <div data-testid="network-background" />,
}));

vi.mock("recharts", () => ({
  ResponsiveContainer: ({ children }: any) => <div>{children}</div>,
  AreaChart: ({ children }: any) => <div data-testid="area-chart">{children}</div>,
  Area: () => <div />,
  PieChart: ({ children }: any) => <div data-testid="pie-chart">{children}</div>,
  Pie: ({ children }: any) => <div>{children}</div>,
  Cell: () => <div />,
  XAxis: () => <div />,
  YAxis: () => <div />,
  CartesianGrid: () => <div />,
}));

import IncidentReportingPage from "@/app/dashboard/incident-reporting/page";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function mockFetchResponses(
  analyzeResponse?: Partial<Response>,
  incidentsResponse?: Partial<Response>
) {
  const defaultAnalyze = {
    ok: true,
    json: async () => ({
      success: true,
      is_phishing: true,
      phishing_probability: 0.92,
      legitimate_probability: 0.08,
      confidence: 0.95,
      persuasion_cues: ["urgency", "authority"],
      incidentId: "mock-incident-id",
    }),
  };

  const defaultIncidents = {
    ok: true,
    json: async () => ({
      success: true,
      incidents: [],
      pagination: { page: 1, limit: 50, total: 0, pages: 0 },
    }),
  };

  global.fetch = vi.fn().mockImplementation((url: string) => {
    if (url.includes("/api/incidents/analyze")) {
      return Promise.resolve({ ...defaultAnalyze, ...analyzeResponse });
    }
    if (url.includes("/api/incidents")) {
      return Promise.resolve({ ...defaultIncidents, ...incidentsResponse });
    }
    return Promise.resolve({
      ok: true,
      json: async () => ({}),
    });
  });
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("IncidentReportingPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockFetchResponses();
  });

  // ----- Rendering -----

  it("renders the page with title and hero section", async () => {
    render(<IncidentReportingPage />);

    await waitFor(() => {
      expect(screen.getByText("Incident Reporting")).toBeInTheDocument();
    });

    expect(
      screen.getByText(
        "Report security incidents and suspicious activities to help protect your organization."
      )
    ).toBeInTheDocument();
  });

  it("displays hero badges (Secure Reporting, Quick Response, Confidential)", async () => {
    render(<IncidentReportingPage />);

    await waitFor(() => {
      expect(screen.getByText("Secure Reporting")).toBeInTheDocument();
    });
    expect(screen.getByText("Quick Response")).toBeInTheDocument();
    expect(screen.getByText("Confidential")).toBeInTheDocument();
  });

  it("shows Email and WhatsApp tabs", async () => {
    render(<IncidentReportingPage />);

    await waitFor(() => {
      expect(screen.getByText("Email")).toBeInTheDocument();
    });
    expect(screen.getByText("WhatsApp")).toBeInTheDocument();
  });

  it("shows email form by default", async () => {
    render(<IncidentReportingPage />);

    await waitFor(() => {
      expect(screen.getByText("Report an Email Incident")).toBeInTheDocument();
    });

    expect(screen.getByPlaceholderText("Enter the full email body")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("Enter email subject")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("Enter sender email address")).toBeInTheDocument();
  });

  it("shows Submit Report and Clear Form buttons", async () => {
    render(<IncidentReportingPage />);

    await waitFor(() => {
      expect(screen.getByText("Submit Report")).toBeInTheDocument();
    });
    expect(screen.getByText("Clear Form")).toBeInTheDocument();
  });

  // ----- Tab switching -----

  it("switches to WhatsApp form when WhatsApp tab is clicked", async () => {
    render(<IncidentReportingPage />);

    await waitFor(() => {
      expect(screen.getByText("Email")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText("WhatsApp"));

    await waitFor(() => {
      expect(screen.getByText("Report a WhatsApp Incident")).toBeInTheDocument();
    });

    expect(screen.getByPlaceholderText("Enter the WhatsApp message content")).toBeInTheDocument();
  });

  it("switches back to Email form when Email tab is clicked", async () => {
    render(<IncidentReportingPage />);

    await waitFor(() => {
      expect(screen.getByText("Email")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText("WhatsApp"));
    await waitFor(() => {
      expect(screen.getByText("Report a WhatsApp Incident")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText("Email"));
    await waitFor(() => {
      expect(screen.getByText("Report an Email Incident")).toBeInTheDocument();
    });
  });

  // ----- View Mode Toggle -----

  it("shows Report and View Reports toggle buttons", async () => {
    render(<IncidentReportingPage />);

    await waitFor(() => {
      expect(screen.getByText("Report")).toBeInTheDocument();
    });
    expect(screen.getByText("View Reports")).toBeInTheDocument();
  });

  it("toggles between form and graph view", async () => {
    render(<IncidentReportingPage />);

    await waitFor(() => {
      expect(screen.getByText("Report an Incident")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText("View Reports"));

    await waitFor(() => {
      expect(screen.getAllByText("Incident Reports").length).toBeGreaterThanOrEqual(1);
    });
  });

  // ----- Email Form Validation -----

  it("shows validation error when submitting empty email form", async () => {
    render(<IncidentReportingPage />);

    await waitFor(() => {
      expect(screen.getByText("Submit Report")).toBeInTheDocument();
    });

    const form = screen.getByText("Submit Report").closest("form")!;
    fireEvent.submit(form);

    await waitFor(() => {
      expect(
        screen.getByText("Please fix the errors in the form.")
      ).toBeInTheDocument();
    });
  });

  it("shows error for missing email subject", async () => {
    render(<IncidentReportingPage />);

    await waitFor(() => {
      expect(screen.getByPlaceholderText("Enter the full email body")).toBeInTheDocument();
    });

    const messageInput = screen.getByPlaceholderText("Enter the full email body");
    fireEvent.change(messageInput, { target: { value: "Some phishing content" } });

    const fromInput = screen.getByPlaceholderText("Enter sender email address");
    fireEvent.change(fromInput, { target: { value: "test@example.com" } });

    const form = screen.getByText("Submit Report").closest("form")!;
    fireEvent.submit(form);

    await waitFor(() => {
      expect(screen.getByText("Subject is required")).toBeInTheDocument();
    });
  });

  it("shows error for invalid email address format", async () => {
    render(<IncidentReportingPage />);

    await waitFor(() => {
      expect(screen.getByPlaceholderText("Enter the full email body")).toBeInTheDocument();
    });

    fireEvent.change(screen.getByPlaceholderText("Enter the full email body"), {
      target: { value: "Suspicious content" },
    });
    fireEvent.change(screen.getByPlaceholderText("Enter email subject"), {
      target: { value: "Test Subject" },
    });
    fireEvent.change(screen.getByPlaceholderText("Enter sender email address"), {
      target: { value: "not-an-email" },
    });

    fireEvent.click(screen.getByText("Submit Report"));

    await waitFor(() => {
      expect(screen.getByText("Please enter a valid email address")).toBeInTheDocument();
    });
  });

  // ----- WhatsApp Form Validation -----

  it("shows validation error when submitting empty WhatsApp form", async () => {
    render(<IncidentReportingPage />);

    await waitFor(() => {
      expect(screen.getByText("WhatsApp")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText("WhatsApp"));

    await waitFor(() => {
      expect(screen.getByText("Report a WhatsApp Incident")).toBeInTheDocument();
    });

    const form = screen.getByText("Submit Report").closest("form")!;
    fireEvent.submit(form);

    await waitFor(() => {
      expect(
        screen.getByText("Please fix the errors in the form.")
      ).toBeInTheDocument();
    });
  });

  // ----- Successful Email Submission -----

  it("submits email form and shows success toast with phishing result", async () => {
    mockFetchResponses();

    render(<IncidentReportingPage />);

    await waitFor(() => {
      expect(screen.getByPlaceholderText("Enter the full email body")).toBeInTheDocument();
    });

    fireEvent.change(screen.getByPlaceholderText("Enter the full email body"), {
      target: { value: "Your account has been compromised" },
    });
    fireEvent.change(screen.getByPlaceholderText("Enter email subject"), {
      target: { value: "Urgent Alert" },
    });
    fireEvent.change(screen.getByPlaceholderText("Enter sender email address"), {
      target: { value: "phisher@evil.com" },
    });

    fireEvent.click(screen.getByText("Submit Report"));

    await waitFor(() => {
      expect(screen.getByText("Report submitted")).toBeInTheDocument();
    });

    expect(screen.getByText("Phishing detected")).toBeInTheDocument();
    expect(screen.getByText(/92\.0%/)).toBeInTheDocument();
  });

  it("shows 'Not phishing' when ML result is safe", async () => {
    mockFetchResponses({
      ok: true,
      json: async () => ({
        success: true,
        is_phishing: false,
        phishing_probability: 0.05,
        legitimate_probability: 0.95,
        confidence: 0.98,
        persuasion_cues: [],
        incidentId: "safe-id",
      }),
    });

    render(<IncidentReportingPage />);

    await waitFor(() => {
      expect(screen.getByPlaceholderText("Enter the full email body")).toBeInTheDocument();
    });

    fireEvent.change(screen.getByPlaceholderText("Enter the full email body"), {
      target: { value: "Meeting notes from today" },
    });
    fireEvent.change(screen.getByPlaceholderText("Enter email subject"), {
      target: { value: "Meeting Notes" },
    });
    fireEvent.change(screen.getByPlaceholderText("Enter sender email address"), {
      target: { value: "colleague@company.com" },
    });

    fireEvent.click(screen.getByText("Submit Report"));

    await waitFor(() => {
      expect(screen.getByText("Not phishing")).toBeInTheDocument();
    });
    expect(screen.getByText(/5\.0%/)).toBeInTheDocument();
  });

  // ----- Successful WhatsApp Submission -----

  it("submits WhatsApp form and shows success toast", async () => {
    mockFetchResponses();

    render(<IncidentReportingPage />);

    await waitFor(() => {
      expect(screen.getByText("WhatsApp")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText("WhatsApp"));

    await waitFor(() => {
      expect(screen.getByPlaceholderText("Enter the WhatsApp message content")).toBeInTheDocument();
    });

    fireEvent.change(screen.getByPlaceholderText("Enter the WhatsApp message content"), {
      target: { value: "Click this link to win a prize" },
    });

    fireEvent.click(screen.getByText("Submit Report"));

    await waitFor(() => {
      expect(screen.getByText("Report submitted")).toBeInTheDocument();
    });
  });

  // ----- Error Handling -----

  it("shows error message when API returns failure", async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 500,
      json: async () => ({ error: "Internal Server Error" }),
    });

    render(<IncidentReportingPage />);

    await waitFor(() => {
      expect(screen.getByPlaceholderText("Enter the full email body")).toBeInTheDocument();
    });

    fireEvent.change(screen.getByPlaceholderText("Enter the full email body"), {
      target: { value: "Test content" },
    });
    fireEvent.change(screen.getByPlaceholderText("Enter email subject"), {
      target: { value: "Test Subject" },
    });
    fireEvent.change(screen.getByPlaceholderText("Enter sender email address"), {
      target: { value: "test@example.com" },
    });

    fireEvent.click(screen.getByText("Submit Report"));

    await waitFor(() => {
      expect(
        screen.getByText("Failed to submit incident report. Please try again.")
      ).toBeInTheDocument();
    });
  });

  it("shows error when fetch throws a network error", async () => {
    global.fetch = vi.fn().mockRejectedValue(new Error("Network error"));

    render(<IncidentReportingPage />);

    await waitFor(() => {
      expect(screen.getByPlaceholderText("Enter the full email body")).toBeInTheDocument();
    });

    fireEvent.change(screen.getByPlaceholderText("Enter the full email body"), {
      target: { value: "Test" },
    });
    fireEvent.change(screen.getByPlaceholderText("Enter email subject"), {
      target: { value: "Test" },
    });
    fireEvent.change(screen.getByPlaceholderText("Enter sender email address"), {
      target: { value: "test@example.com" },
    });

    fireEvent.click(screen.getByText("Submit Report"));

    await waitFor(() => {
      expect(
        screen.getByText("Failed to submit incident report. Please try again.")
      ).toBeInTheDocument();
    });
  });

  // ----- Clear Form -----

  it("clears email form when Clear Form is clicked", async () => {
    render(<IncidentReportingPage />);

    await waitFor(() => {
      expect(screen.getByPlaceholderText("Enter the full email body")).toBeInTheDocument();
    });

    const messageInput = screen.getByPlaceholderText("Enter the full email body") as HTMLTextAreaElement;
    fireEvent.change(messageInput, { target: { value: "Some content" } });
    expect(messageInput.value).toBe("Some content");

    fireEvent.click(screen.getByText("Clear Form"));

    await waitFor(() => {
      expect(messageInput.value).toBe("");
    });
  });

  it("clears WhatsApp form when Clear Form is clicked", async () => {
    render(<IncidentReportingPage />);

    await waitFor(() => {
      expect(screen.getByText("WhatsApp")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText("WhatsApp"));

    await waitFor(() => {
      expect(screen.getByPlaceholderText("Enter the WhatsApp message content")).toBeInTheDocument();
    });

    const waMessage = screen.getByPlaceholderText("Enter the WhatsApp message content") as HTMLTextAreaElement;
    fireEvent.change(waMessage, { target: { value: "WhatsApp content" } });
    expect(waMessage.value).toBe("WhatsApp content");

    fireEvent.click(screen.getByText("Clear Form"));

    await waitFor(() => {
      expect(waMessage.value).toBe("");
    });
  });

  // ----- Form Reset After Submission -----

  it("resets form after successful email submission", async () => {
    mockFetchResponses();

    render(<IncidentReportingPage />);

    await waitFor(() => {
      expect(screen.getByPlaceholderText("Enter the full email body")).toBeInTheDocument();
    });

    const messageInput = screen.getByPlaceholderText("Enter the full email body") as HTMLTextAreaElement;
    fireEvent.change(messageInput, { target: { value: "Phishing content" } });
    fireEvent.change(screen.getByPlaceholderText("Enter email subject"), {
      target: { value: "Alert" },
    });
    fireEvent.change(screen.getByPlaceholderText("Enter sender email address"), {
      target: { value: "bad@evil.com" },
    });

    fireEvent.click(screen.getByText("Submit Report"));

    await waitFor(() => {
      expect(screen.getByText("Report submitted")).toBeInTheDocument();
    });

    expect(messageInput.value).toBe("");
  });

  // ----- Fetch call validation -----

  it("sends correct payload for email submission", async () => {
    mockFetchResponses();

    render(<IncidentReportingPage />);

    await waitFor(() => {
      expect(screen.getByPlaceholderText("Enter the full email body")).toBeInTheDocument();
    });

    fireEvent.change(screen.getByPlaceholderText("Enter the full email body"), {
      target: { value: "Suspicious email body" },
    });
    fireEvent.change(screen.getByPlaceholderText("Enter email subject"), {
      target: { value: "Urgent Update" },
    });
    fireEvent.change(screen.getByPlaceholderText("Enter sender email address"), {
      target: { value: "attacker@phishing.com" },
    });

    fireEvent.click(screen.getByText("Submit Report"));

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalled();
    });

    const fetchCall = (global.fetch as any).mock.calls.find((c: any[]) =>
      c[0].includes("/api/incidents/analyze")
    );
    expect(fetchCall).toBeDefined();

    const body = JSON.parse(fetchCall[1].body);
    expect(body.messageType).toBe("email");
    expect(body.message).toBe("Suspicious email body");
    expect(body.subject).toBe("Urgent Update");
    expect(body.from).toBe("attacker@phishing.com");
  });

  it("sends correct payload for WhatsApp submission", async () => {
    mockFetchResponses();

    render(<IncidentReportingPage />);

    await waitFor(() => {
      expect(screen.getByText("WhatsApp")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText("WhatsApp"));

    await waitFor(() => {
      expect(screen.getByPlaceholderText("Enter the WhatsApp message content")).toBeInTheDocument();
    });

    fireEvent.change(screen.getByPlaceholderText("Enter the WhatsApp message content"), {
      target: { value: "You won a prize!" },
    });

    fireEvent.click(screen.getByText("Submit Report"));

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalled();
    });

    const fetchCall = (global.fetch as any).mock.calls.find((c: any[]) =>
      c[0].includes("/api/incidents/analyze")
    );
    expect(fetchCall).toBeDefined();

    const body = JSON.parse(fetchCall[1].body);
    expect(body.messageType).toBe("whatsapp");
    expect(body.message).toBe("You won a prize!");
  });

  it("includes Authorization header in API call", async () => {
    mockFetchResponses();

    render(<IncidentReportingPage />);

    await waitFor(() => {
      expect(screen.getByPlaceholderText("Enter the full email body")).toBeInTheDocument();
    });

    fireEvent.change(screen.getByPlaceholderText("Enter the full email body"), {
      target: { value: "Content" },
    });
    fireEvent.change(screen.getByPlaceholderText("Enter email subject"), {
      target: { value: "Subject" },
    });
    fireEvent.change(screen.getByPlaceholderText("Enter sender email address"), {
      target: { value: "a@b.com" },
    });

    fireEvent.click(screen.getByText("Submit Report"));

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalled();
    });

    const fetchCall = (global.fetch as any).mock.calls.find((c: any[]) =>
      c[0].includes("/api/incidents/analyze")
    );
    expect(fetchCall[1].headers["Authorization"]).toBe("Bearer mock-token");
  });

  // ----- Character count -----

  it("displays character count for email message", async () => {
    render(<IncidentReportingPage />);

    await waitFor(() => {
      expect(screen.getByPlaceholderText("Enter the full email body")).toBeInTheDocument();
    });

    fireEvent.change(screen.getByPlaceholderText("Enter the full email body"), {
      target: { value: "Hello" },
    });

    expect(screen.getByText("5 characters")).toBeInTheDocument();
  });

  // ----- URL Management in Email Form -----

  it("shows Add URL button in email form", async () => {
    render(<IncidentReportingPage />);

    await waitFor(() => {
      expect(screen.getAllByText("Add URL").length).toBeGreaterThanOrEqual(1);
    });
  });

  // ----- NetworkBackground -----

  it("renders NetworkBackground component", async () => {
    render(<IncidentReportingPage />);

    await waitFor(() => {
      expect(screen.getByTestId("network-background")).toBeInTheDocument();
    });
  });

  // ----- WhatsApp optional fields -----

  it("renders sender and date fields for WhatsApp form", async () => {
    render(<IncidentReportingPage />);

    await waitFor(() => {
      expect(screen.getByText("WhatsApp")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText("WhatsApp"));

    await waitFor(() => {
      expect(
        screen.getByPlaceholderText("e.g. +92123456789 or contact name")
      ).toBeInTheDocument();
    });
    expect(screen.getByText("Date received")).toBeInTheDocument();
  });

  // ----- Form field rendering -----

  it("renders email form with all required field labels", async () => {
    render(<IncidentReportingPage />);

    await waitFor(() => {
      expect(screen.getByText("Report an Email Incident")).toBeInTheDocument();
    });

    expect(screen.getAllByText("Message").length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText("Subject")).toBeInTheDocument();
    expect(screen.getByText("From")).toBeInTheDocument();
  });
});
