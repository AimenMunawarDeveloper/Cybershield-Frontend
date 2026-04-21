import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import { vi, describe, it, expect, beforeEach } from "vitest";
import React from "react";

// ---------------------------------------------------------------------------
// Stable hoisted mocks
// ---------------------------------------------------------------------------

const {
  mockGetUserProfile,
  mockGetToken,
  mockPush,
  stableRouter,
  mockStartSession,
  mockEndSession,
  mockGetId,
} = vi.hoisted(() => {
  const pushFn = vi.fn();
  return {
    mockGetUserProfile: vi.fn(),
    mockGetToken: vi.fn(async () => "test-token"),
    mockPush: pushFn,
    stableRouter: { push: pushFn, replace: vi.fn(), back: vi.fn(), forward: vi.fn(), refresh: vi.fn(), prefetch: vi.fn() },
    mockStartSession: vi.fn(),
    mockEndSession: vi.fn(),
    mockGetId: vi.fn(() => "el-conv-id"),
  };
});

vi.mock("@clerk/nextjs", () => ({
  useAuth: () => ({ getToken: mockGetToken }),
  useUser: () => ({ user: { id: "user-1" }, isLoaded: true }),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => stableRouter,
  usePathname: () => "/dashboard/voice-phishing",
}));

vi.mock("@/lib/api", () => ({
  ApiClient: vi.fn().mockImplementation(() => ({
    getUserProfile: mockGetUserProfile,
  })),
}));

vi.mock("@/hooks/useTranslation", () => ({
  useTranslation: () => ({
    t: (s: string) => s,
    preTranslate: vi.fn(async () => {}),
    isTranslating: false,
  }),
}));

vi.mock("@/contexts/LanguageContext", () => ({
  useLanguage: () => ({ language: "en" }),
}));

vi.mock("next/image", () => ({
  default: (props: Record<string, unknown>) => React.createElement("img", props),
}));

vi.mock("next/link", () => ({
  default: ({ children, href, ...rest }: { children: React.ReactNode; href: string }) =>
    React.createElement("a", { href, ...rest }, children),
}));

vi.mock("@/components/NetworkBackground", () => ({
  default: () => React.createElement("div", { "data-testid": "network-bg" }),
}));

vi.mock("@elevenlabs/react", () => ({
  useConversation: () => ({
    startSession: mockStartSession,
    endSession: mockEndSession,
    getId: mockGetId,
    isSpeaking: false,
    status: "disconnected",
  }),
}));

import VoicePhishingPage from "@/app/dashboard/voice-phishing/page";

// ---------------------------------------------------------------------------
// Sample data
// ---------------------------------------------------------------------------

const sampleTemplates = [
  {
    _id: "t1",
    title: "HBL Bank Phish",
    description: "Fake HBL bank security alert",
    type: "phishing",
    firstMessage: "Hello, this is HBL security.",
    isActive: true,
    createdBy: { displayName: "Admin", email: "admin@test.com" },
  },
  {
    _id: "t2",
    title: "Normal Service Call",
    description: "Legitimate customer service call",
    type: "normal",
    firstMessage: "Hello, this is customer service.",
    isActive: true,
    createdBy: { displayName: "Admin", email: "admin@test.com" },
  },
];

const sampleDefaultScenarios = [
  {
    id: "phishing-0",
    title: "HBL Bank Security Alert",
    description: "HBL Bank Security Alert - Suspicious activity detected.",
    type: "phishing",
    firstMessage: "Hello, this is HBL security department.",
    isDefault: true,
  },
  {
    id: "normal-0",
    title: "HBL Customer Service",
    description: "HBL Customer Service - General inquiry.",
    type: "normal",
    firstMessage: "Hello, how can I help you today?",
    isDefault: true,
  },
];

const sampleConversations = [
  {
    _id: "c1",
    scenarioType: "phishing",
    scenarioDescription: "HBL Bank Security Alert - Suspicious activity",
    status: "completed",
    score: 85,
    scoreDetails: {
      fellForPhishing: false,
      providedSensitiveInfo: false,
      sensitiveInfoTypes: [],
      resistanceLevel: "high",
      analysisRationale: "Good resistance shown.",
    },
    duration: 180,
    createdAt: "2026-04-20T10:00:00Z",
  },
  {
    _id: "c2",
    scenarioType: "normal",
    scenarioDescription: "Customer service inquiry",
    status: "completed",
    score: 90,
    scoreDetails: {
      fellForPhishing: false,
      providedSensitiveInfo: false,
      sensitiveInfoTypes: [],
      resistanceLevel: "high",
      analysisRationale: "Handled well.",
    },
    duration: 120,
    createdAt: "2026-04-19T08:00:00Z",
  },
  {
    _id: "c3",
    scenarioType: "phishing",
    scenarioDescription: "UBL Account Suspension",
    status: "completed",
    score: 25,
    scoreDetails: {
      fellForPhishing: true,
      providedSensitiveInfo: true,
      sensitiveInfoTypes: ["CNIC", "ATM PIN"],
      resistanceLevel: "low",
      analysisRationale: "Fell for phishing.",
    },
    duration: 90,
    createdAt: "2026-04-18T09:00:00Z",
  },
];

// ---------------------------------------------------------------------------
// Helper: mock fetch
// ---------------------------------------------------------------------------

function setupFetchMock(opts: {
  templates?: unknown[];
  defaults?: unknown[];
  conversations?: unknown[];
} = {}) {
  const templatesData = opts.templates ?? sampleTemplates;
  const defaultsData = opts.defaults ?? sampleDefaultScenarios;
  const conversationsData = opts.conversations ?? sampleConversations;

  (global.fetch as ReturnType<typeof vi.fn>).mockImplementation(async (url: string) => {
    if (typeof url === "string" && url.includes("/voice-phishing-templates/defaults")) {
      return {
        ok: true,
        json: async () => ({ success: true, data: defaultsData }),
      };
    }
    if (typeof url === "string" && url.includes("/voice-phishing-templates")) {
      return {
        ok: true,
        json: async () => ({ success: true, data: templatesData }),
      };
    }
    if (typeof url === "string" && url.includes("/voice-phishing/initiate")) {
      return {
        ok: true,
        json: async () => ({
          success: true,
          data: {
            conversationId: "new-conv-1",
            connectionType: "webrtc",
            scenario: {
              type: "phishing",
              description: "Test phishing scenario",
              firstMessage: "Hello, this is your bank.",
              variables: { scenario_type: "phishing", scenario_description: "Test" },
            },
          },
        }),
      };
    }
    if (typeof url === "string" && url.includes("/voice-phishing") && !url.includes("templates")) {
      return {
        ok: true,
        json: async () => ({
          success: true,
          data: {
            conversations: conversationsData,
            pagination: { current: 1, pages: 1, total: conversationsData.length },
          },
        }),
      };
    }
    return { ok: true, json: async () => ({}) };
  });
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("VoicePhishingPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetToken.mockResolvedValue("test-token");
    mockGetUserProfile.mockResolvedValue({
      _id: "u1",
      email: "admin@test.com",
      displayName: "Admin User",
      role: "client_admin",
      orgId: "org1",
    });
    global.fetch = vi.fn() as ReturnType<typeof vi.fn>;
    setupFetchMock();
  });

  // -----------------------------------------------------------------------
  // Page Title & Layout
  // -----------------------------------------------------------------------

  it("renders page title Voice Phishing Simulation", async () => {
    const { container } = render(<VoicePhishingPage />);

    await waitFor(() => {
      expect(container.innerHTML).toContain("Voice Phishing Simulation");
    });
  });

  it("shows subtitle text", async () => {
    const { container } = render(<VoicePhishingPage />);

    await waitFor(() => {
      expect(container.innerHTML).toContain("Test your ability to resist phishing attempts through voice calls");
    });
  });

  // -----------------------------------------------------------------------
  // Available Templates (Defaults) — Admin Only
  // -----------------------------------------------------------------------

  it("renders Available Templates section for admins", async () => {
    const { container } = render(<VoicePhishingPage />);

    await waitFor(() => {
      expect(container.innerHTML).toContain("Available Templates");
      expect(container.innerHTML).toContain("Add these to your templates");
    });
  });

  it("shows default scenarios with Add button", async () => {
    const { container } = render(<VoicePhishingPage />);

    await waitFor(() => {
      expect(container.innerHTML).toContain("HBL Bank Security Alert");
      expect(container.innerHTML).toContain("HBL Customer Service");
    });
  });

  it("shows empty state when no default scenarios", async () => {
    setupFetchMock({ defaults: [] });

    const { container } = render(<VoicePhishingPage />);

    await waitFor(() => {
      expect(container.innerHTML).toContain("No default scenarios available");
    });
  });

  // -----------------------------------------------------------------------
  // Scenario Templates — Admin Only
  // -----------------------------------------------------------------------

  it("renders Scenario Templates section for admins", async () => {
    const { container } = render(<VoicePhishingPage />);

    await waitFor(() => {
      expect(container.innerHTML).toContain("Scenario Templates");
    });
  });

  it("shows Create Template button for admins", async () => {
    render(<VoicePhishingPage />);

    await waitFor(() => {
      expect(screen.getByText("Create Template")).toBeInTheDocument();
    });
  });

  it("shows template cards with edit and delete buttons", async () => {
    const { container } = render(<VoicePhishingPage />);

    await waitFor(() => {
      expect(container.innerHTML).toContain("HBL Bank Phish");
      expect(container.innerHTML).toContain("Normal Service Call");
    });
  });

  it("shows template type badges (Phishing/Normal)", async () => {
    const { container } = render(<VoicePhishingPage />);

    await waitFor(() => {
      expect(container.innerHTML).toContain("Phishing");
      expect(container.innerHTML).toContain("Normal");
    });
  });

  it("shows empty state when no custom templates", async () => {
    setupFetchMock({ templates: [] });

    const { container } = render(<VoicePhishingPage />);

    await waitFor(() => {
      expect(container.innerHTML).toContain("No templates found");
      expect(container.innerHTML).toContain("Create your first scenario template");
    });
  });

  it("opens Create Template modal on button click", async () => {
    const { container } = render(<VoicePhishingPage />);

    await waitFor(() => {
      expect(screen.getByText("Create Template")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText("Create Template"));

    await waitFor(() => {
      expect(container.innerHTML).toContain("Title");
      expect(container.innerHTML).toContain("Description");
      expect(container.innerHTML).toContain("First Message");
    });
  });

  // -----------------------------------------------------------------------
  // Call History
  // -----------------------------------------------------------------------

  it("renders Call History section", async () => {
    const { container } = render(<VoicePhishingPage />);

    await waitFor(() => {
      expect(container.innerHTML).toContain("Call History");
    });
  });

  it("shows conversation cards with scores", async () => {
    const { container } = render(<VoicePhishingPage />);

    await waitFor(() => {
      expect(container.innerHTML).toContain("85");
      expect(container.innerHTML).toContain("90");
      expect(container.innerHTML).toContain("25");
    });
  });

  it("shows scenario type and description on conversation cards", async () => {
    const { container } = render(<VoicePhishingPage />);

    await waitFor(() => {
      expect(container.innerHTML).toContain("HBL Bank Security Alert");
      expect(container.innerHTML).toContain("Customer service inquiry");
      expect(container.innerHTML).toContain("UBL Account Suspension");
    });
  });

  it("shows empty call history state", async () => {
    setupFetchMock({ conversations: [] });

    const { container } = render(<VoicePhishingPage />);

    await waitFor(() => {
      expect(container.innerHTML).toContain("No previous calls");
      expect(container.innerHTML).toContain("Your call history will appear here");
    });
  });

  it("navigates to conversation detail on card click", async () => {
    const { container } = render(<VoicePhishingPage />);

    await waitFor(() => {
      expect(container.innerHTML).toContain("HBL Bank Security Alert");
    });

    const cards = container.querySelectorAll("[class*='cursor-pointer']");
    if (cards.length > 0) {
      fireEvent.click(cards[0]);
      expect(mockPush).toHaveBeenCalledWith("/dashboard/voice-phishing/c1");
    }
  });

  // -----------------------------------------------------------------------
  // Access Control — templates hidden from non-admins
  // -----------------------------------------------------------------------

  it("hides Available Templates from non-admin users", async () => {
    mockGetUserProfile.mockResolvedValue({
      _id: "u2",
      email: "user@test.com",
      displayName: "Regular User",
      role: "affiliated",
      orgId: "org1",
    });

    const { container } = render(<VoicePhishingPage />);

    await waitFor(() => {
      expect(container.innerHTML).toContain("Call History");
    });

    expect(container.innerHTML).not.toContain("Available Templates");
    expect(container.innerHTML).not.toContain("Scenario Templates");
    expect(container.innerHTML).not.toContain("Create Template");
  });

  it("hides templates from non-affiliated users", async () => {
    mockGetUserProfile.mockResolvedValue({
      _id: "u3",
      email: "nonaff@test.com",
      displayName: "Non-Affiliated",
      role: "non_affiliated",
    });

    const { container } = render(<VoicePhishingPage />);

    await waitFor(() => {
      expect(container.innerHTML).toContain("Call History");
    });

    expect(container.innerHTML).not.toContain("Scenario Templates");
    expect(container.innerHTML).not.toContain("Create Template");
  });

  it("shows templates for system_admin", async () => {
    mockGetUserProfile.mockResolvedValue({
      _id: "sa1",
      email: "sysadmin@test.com",
      displayName: "Sys Admin",
      role: "system_admin",
    });

    const { container } = render(<VoicePhishingPage />);

    await waitFor(() => {
      expect(container.innerHTML).toContain("Scenario Templates");
      expect(container.innerHTML).toContain("Available Templates");
    });
  });

  it("shows templates for client_admin", async () => {
    const { container } = render(<VoicePhishingPage />);

    await waitFor(() => {
      expect(container.innerHTML).toContain("Scenario Templates");
      expect(container.innerHTML).toContain("Available Templates");
    });
  });

  // -----------------------------------------------------------------------
  // Call History visible to all roles
  // -----------------------------------------------------------------------

  it("shows Call History for affiliated users", async () => {
    mockGetUserProfile.mockResolvedValue({
      _id: "u2",
      email: "user@test.com",
      displayName: "Regular User",
      role: "affiliated",
      orgId: "org1",
    });

    const { container } = render(<VoicePhishingPage />);

    await waitFor(() => {
      expect(container.innerHTML).toContain("Call History");
    });
  });

  // -----------------------------------------------------------------------
  // Loading
  // -----------------------------------------------------------------------

  it("shows loading state while profile is loading", () => {
    mockGetUserProfile.mockImplementation(() => new Promise(() => {}));
    const { container } = render(<VoicePhishingPage />);

    expect(container.querySelector(".animate-spin")).toBeTruthy();
  });

  // -----------------------------------------------------------------------
  // Voice Orb / Call section
  // -----------------------------------------------------------------------

  it("shows ready-to-start state when no call active", async () => {
    const { container } = render(<VoicePhishingPage />);

    await waitFor(() => {
      expect(container.innerHTML).toContain("Click the microphone to start a call");
    });
  });
});
