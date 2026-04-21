import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { vi, describe, it, expect, beforeEach } from "vitest";
import React from "react";

// ---------------------------------------------------------------------------
// Mocks — vi.hoisted for stable references
// ---------------------------------------------------------------------------

const {
  mockToggleTheme,
  mockSetLanguage,
  mockTheme,
  mockLanguage,
} = vi.hoisted(() => ({
  mockToggleTheme: vi.fn(),
  mockSetLanguage: vi.fn(),
  mockTheme: { value: "dark" as string },
  mockLanguage: { value: "en" as string },
}));

vi.mock("@clerk/nextjs", () => ({
  SignedIn: ({ children }: any) => <div data-testid="signed-in">{children}</div>,
  SignedOut: ({ children }: any) => <div data-testid="signed-out">{children}</div>,
  UserButton: () => <div data-testid="user-button" />,
  useUser: () => ({ user: { firstName: "Test" } }),
  useAuth: () => ({ isLoaded: true }),
}));

vi.mock("next/navigation", () => ({
  usePathname: () => "/dashboard",
}));

vi.mock("next/image", () => ({
  default: (props: any) => <img {...props} />,
}));

vi.mock("@/contexts/ThemeContext", () => ({
  useTheme: () => ({
    theme: mockTheme.value,
    toggleTheme: mockToggleTheme,
    setTheme: vi.fn(),
  }),
}));

vi.mock("@/contexts/LanguageContext", () => ({
  useLanguage: () => ({
    language: mockLanguage.value,
    setLanguage: mockSetLanguage,
    isTranslating: false,
  }),
}));

vi.mock("@/hooks/useTranslation", () => ({
  useTranslation: () => ({
    t: (s: string) => s,
    preTranslate: vi.fn(async () => {}),
    language: mockLanguage.value,
  }),
}));

vi.mock("@/components/ui/navigation-menu", () => ({
  NavigationMenu: ({ children, ...props }: any) => <nav {...props}>{children}</nav>,
  NavigationMenuList: ({ children, ...props }: any) => <ul {...props}>{children}</ul>,
  NavigationMenuItem: ({ children, ...props }: any) => <li {...props}>{children}</li>,
  NavigationMenuLink: ({ children, ...props }: any) => <div {...props}>{children}</div>,
}));

vi.mock("@/components/ui/button", () => ({
  Button: ({ children, ...props }: any) => <button {...props}>{children}</button>,
}));

vi.mock("@/components/ui/input", () => ({
  Input: (props: any) => <input {...props} />,
}));

vi.mock("@/components/ui/sidebar", () => ({
  SidebarTrigger: (props: any) => <button {...props}>sidebar</button>,
}));

vi.mock("@/components/LanguageToggle", () => ({
  default: () => <div data-testid="language-toggle">LanguageToggle</div>,
}));

import TopBar from "@/components/TopBar";

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("TopBar", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockTheme.value = "dark";
    mockLanguage.value = "en";
  });

  // ----- Theme toggle rendering -----

  it("renders Moon icon when theme is dark", () => {
    mockTheme.value = "dark";
    const { container } = render(<TopBar variant="dashboard" />);

    const moonIcon = container.querySelector(".lucide-moon");
    expect(moonIcon).toBeInTheDocument();
  });

  it("renders Sun icon when theme is light", () => {
    mockTheme.value = "light";
    const { container } = render(<TopBar variant="dashboard" />);

    const sunIcon = container.querySelector(".lucide-sun");
    expect(sunIcon).toBeInTheDocument();
  });

  it("does not show Sun icon in dark mode", () => {
    mockTheme.value = "dark";
    const { container } = render(<TopBar variant="dashboard" />);

    const sunIcon = container.querySelector(".lucide-sun");
    expect(sunIcon).not.toBeInTheDocument();
  });

  it("does not show Moon icon in light mode", () => {
    mockTheme.value = "light";
    const { container } = render(<TopBar variant="dashboard" />);

    const moonIcon = container.querySelector(".lucide-moon");
    expect(moonIcon).not.toBeInTheDocument();
  });

  // ----- Theme toggle interaction -----

  it("calls toggleTheme when theme button is clicked", () => {
    const { container } = render(<TopBar variant="dashboard" />);

    const themeButton = container.querySelector(".lucide-moon")?.closest("button");
    expect(themeButton).toBeTruthy();
    fireEvent.click(themeButton!);

    expect(mockToggleTheme).toHaveBeenCalledTimes(1);
  });

  // ----- Language toggle rendering -----

  it("renders LanguageToggle component", () => {
    render(<TopBar variant="dashboard" />);

    expect(screen.getByTestId("language-toggle")).toBeInTheDocument();
  });

  // ----- General rendering -----

  it("renders user greeting on dashboard variant", () => {
    render(<TopBar variant="dashboard" />);

    expect(screen.getByText(/Hello/)).toBeInTheDocument();
  });

  it("renders search bar on dashboard variant", () => {
    render(<TopBar variant="dashboard" />);

    expect(screen.getByPlaceholderText("Search...")).toBeInTheDocument();
  });

  it("renders notification bell icon", () => {
    const { container } = render(<TopBar variant="dashboard" />);

    const bellIcon = container.querySelector(".lucide-bell");
    expect(bellIcon).toBeInTheDocument();
  });

  it("renders UserButton component", () => {
    render(<TopBar variant="dashboard" />);

    expect(screen.getByTestId("user-button")).toBeInTheDocument();
  });

  it("renders sidebar trigger when showSidebarTrigger is true", () => {
    render(<TopBar variant="dashboard" showSidebarTrigger={true} />);

    expect(screen.getByText("sidebar")).toBeInTheDocument();
  });

  // ----- SignedIn / SignedOut -----

  it("shows signed-in content area", () => {
    render(<TopBar variant="dashboard" />);

    expect(screen.getByTestId("signed-in")).toBeInTheDocument();
  });
});
