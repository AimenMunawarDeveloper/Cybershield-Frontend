import React from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import LanguageToggle from "@/components/LanguageToggle";

const setLanguage = vi.fn();
const useLanguage = vi.fn();

vi.mock("@/contexts/LanguageContext", () => ({
  useLanguage: () => useLanguage(),
}));

describe("LanguageToggle", () => {
  beforeEach(() => {
    setLanguage.mockReset();
  });

  it("shows the current language in the button title", () => {
    useLanguage.mockReturnValue({
      language: "en",
      setLanguage,
    });

    render(<LanguageToggle />);

    expect(screen.getByTitle("Current language: English")).toBeInTheDocument();
  });

  it("opens the menu and changes the language", async () => {
    const user = userEvent.setup();
    useLanguage.mockReturnValue({
      language: "en",
      setLanguage,
    });

    render(<LanguageToggle />);

    await user.click(screen.getByTitle("Current language: English"));
    await user.click(screen.getByRole("button", { name: /اردو/i }));

    expect(setLanguage).toHaveBeenCalledWith("ur");
  });

  it("renders the Urdu indicator when Urdu is active", async () => {
    const user = userEvent.setup();
    useLanguage.mockReturnValue({
      language: "ur",
      setLanguage,
    });

    render(<LanguageToggle />);

    await user.click(screen.getByTitle("Current language: Urdu"));

    expect(screen.getByText("زبان")).toBeInTheDocument();
  });
});
