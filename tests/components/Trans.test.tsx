import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import { LanguageProvider } from "@/contexts/LanguageContext";
import Trans from "@/components/Trans";

const serviceMocks = vi.hoisted(() => ({
  translateToUrdu: vi.fn(),
}));

vi.mock("@/services/translateService", () => ({
  translateService: {
    translateToUrdu: serviceMocks.translateToUrdu,
  },
}));

describe("Trans", () => {
  beforeEach(() => {
    localStorage.clear();
    serviceMocks.translateToUrdu.mockReset();
  });

  it("renders the original text in English", () => {
    localStorage.setItem("app-language", "en");

    render(
      <LanguageProvider>
        <Trans>Hello world</Trans>
      </LanguageProvider>
    );

    expect(screen.getByText("Hello world")).toBeInTheDocument();
  });

  it("renders the translated text for Urdu", async () => {
    localStorage.setItem("app-language", "ur");
    serviceMocks.translateToUrdu.mockResolvedValue("ہیلو دنیا");

    render(
      <LanguageProvider>
        <Trans as="p">Hello world</Trans>
      </LanguageProvider>
    );

    await waitFor(() => {
      expect(screen.getByText("ہیلو دنیا")).toBeInTheDocument();
    });
  });

  it("falls back to original text when translation fails", async () => {
    localStorage.setItem("app-language", "ur");
    serviceMocks.translateToUrdu.mockRejectedValue(new Error("network error"));

    render(
      <LanguageProvider>
        <Trans>Hello world</Trans>
      </LanguageProvider>
    );

    await waitFor(() => {
      expect(screen.getByText("Hello world")).toBeInTheDocument();
    });
  });
});
