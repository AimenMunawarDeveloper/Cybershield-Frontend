import React from "react";
import { act, fireEvent, render, screen } from "@testing-library/react";
import { LanguageProvider, useLanguage } from "@/contexts/LanguageContext";

function Consumer() {
  const { language, setLanguage, isTranslating } = useLanguage();

  return (
    <div>
      <span data-testid="language">{language}</span>
      <span data-testid="translating">{String(isTranslating)}</span>
      <button onClick={() => setLanguage("ur")}>urdu</button>
      <button onClick={() => setLanguage("en")}>english</button>
    </div>
  );
}

describe("LanguageContext", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("loads the saved language from localStorage", () => {
    localStorage.setItem("app-language", "ur");

    render(
      <LanguageProvider>
        <Consumer />
      </LanguageProvider>
    );

    expect(screen.getByTestId("language")).toHaveTextContent("ur");
  });

  it("updates language, persists it, and resets translating state", async () => {
    render(
      <LanguageProvider>
        <Consumer />
      </LanguageProvider>
    );

    fireEvent.click(screen.getByRole("button", { name: "urdu" }));

    expect(screen.getByTestId("language")).toHaveTextContent("ur");
    expect(screen.getByTestId("translating")).toHaveTextContent("true");
    expect(localStorage.getItem("app-language")).toBe("ur");

    act(() => {
      vi.advanceTimersByTime(300);
    });

    expect(screen.getByTestId("translating")).toHaveTextContent("false");
  });
});
