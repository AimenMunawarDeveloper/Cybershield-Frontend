import React from "react";
import { act, renderHook, waitFor } from "@testing-library/react";
import { LanguageProvider } from "@/contexts/LanguageContext";
import { useTranslation } from "@/hooks/useTranslation";

const serviceMocks = vi.hoisted(() => ({
  translateToUrdu: vi.fn(),
  translateBatch: vi.fn(),
  isCached: vi.fn(),
}));

vi.mock("@/services/translateService", () => ({
  translateService: {
    translateToUrdu: serviceMocks.translateToUrdu,
    translateBatch: serviceMocks.translateBatch,
    isCached: serviceMocks.isCached,
  },
}));

function createWrapper(language: "en" | "ur" = "en") {
  localStorage.setItem("app-language", language);
  return function Wrapper({ children }: { children: React.ReactNode }) {
    return <LanguageProvider>{children}</LanguageProvider>;
  };
}

describe("useTranslation", () => {
  beforeEach(() => {
    localStorage.clear();
    serviceMocks.translateToUrdu.mockReset();
    serviceMocks.translateBatch.mockReset();
    serviceMocks.isCached.mockReset();
  });

  it("returns the original text immediately for English", () => {
    const { result } = renderHook(() => useTranslation(), {
      wrapper: createWrapper("en"),
    });

    expect(result.current.t("Hello")).toBe("Hello");
  });

  it("triggers async translation and updates from cache for Urdu", async () => {
    serviceMocks.translateToUrdu.mockResolvedValue("ہیلو");
    serviceMocks.isCached.mockReturnValue(false);

    const { result } = renderHook(() => useTranslation(), {
      wrapper: createWrapper("ur"),
    });

    expect(result.current.t("Hello")).toBe("Hello");

    await waitFor(() => {
      expect(result.current.t("Hello")).toBe("ہیلو");
    });
  });

  it("pretranslates a batch of texts", async () => {
    serviceMocks.translateBatch.mockResolvedValue(["ایک", "دو"]);
    serviceMocks.isCached.mockReturnValue(false);

    const { result } = renderHook(() => useTranslation(), {
      wrapper: createWrapper("ur"),
    });

    await act(async () => {
      await result.current.preTranslate(["One", "Two"]);
    });

    expect(serviceMocks.translateBatch).toHaveBeenCalledWith(["One", "Two"]);
    expect(result.current.t("One")).toBe("ایک");
    expect(result.current.t("Two")).toBe("دو");
  });
});
