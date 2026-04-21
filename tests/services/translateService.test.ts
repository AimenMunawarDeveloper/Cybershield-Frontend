import { vi, describe, it, expect, beforeEach, afterEach } from "vitest";

// We need to test the TranslateService class directly
// The module uses fetch internally for Google Translate API calls

describe("TranslateService", () => {
  let TranslateService: any;
  let service: any;

  beforeEach(async () => {
    localStorage.clear();
    vi.restoreAllMocks();

    // Dynamically re-import for clean state each test
    vi.resetModules();

    // Set the API key before importing
    vi.stubEnv("NEXT_PUBLIC_GOOGLE_TRANSLATE_API_KEY", "test-api-key");

    const mod = await import("@/services/translateService");
    TranslateService = mod.TranslateService;
    service = new TranslateService();
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  // ----- translateToUrdu -----

  it("returns original text for empty string", async () => {
    const result = await service.translateToUrdu("");
    expect(result).toBe("");
  });

  it("returns original text for whitespace-only string", async () => {
    const result = await service.translateToUrdu("   ");
    expect(result).toBe("   ");
  });

  it("calls Google Translate API and returns translated text", async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        data: {
          translations: [{ translatedText: "ہیلو" }],
        },
      }),
    });

    const result = await service.translateToUrdu("Hello");
    expect(result).toBe("ہیلو");
    expect(global.fetch).toHaveBeenCalledTimes(1);
  });

  it("caches translation results to avoid duplicate API calls", async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        data: {
          translations: [{ translatedText: "ہیلو" }],
        },
      }),
    });

    const result1 = await service.translateToUrdu("Hello");
    const result2 = await service.translateToUrdu("Hello");

    expect(result1).toBe("ہیلو");
    expect(result2).toBe("ہیلو");
    expect(global.fetch).toHaveBeenCalledTimes(1);
  });

  it("returns original text when API returns an error", async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      statusText: "Forbidden",
    });

    const result = await service.translateToUrdu("Hello");
    expect(result).toBe("Hello");
  });

  it("returns original text when fetch throws", async () => {
    global.fetch = vi.fn().mockRejectedValue(new Error("Network error"));

    const result = await service.translateToUrdu("Hello");
    expect(result).toBe("Hello");
  });

  it("returns original text when API key is not set", async () => {
    vi.unstubAllEnvs();
    vi.stubEnv("NEXT_PUBLIC_GOOGLE_TRANSLATE_API_KEY", "");

    vi.resetModules();
    const mod = await import("@/services/translateService");
    const noKeyService = new mod.TranslateService();

    const result = await noKeyService.translateToUrdu("Hello");
    expect(result).toBe("Hello");
  });

  // ----- translateBatch -----

  it("batch translates multiple texts", async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        data: {
          translations: [
            { translatedText: "ایک" },
            { translatedText: "دو" },
          ],
        },
      }),
    });

    const results = await service.translateBatch(["One", "Two"]);
    expect(results).toEqual(["ایک", "دو"]);
  });

  it("batch returns empty array for empty input", async () => {
    const results = await service.translateBatch([]);
    expect(results).toEqual([]);
  });

  it("batch uses cache for already-translated texts", async () => {
    global.fetch = vi.fn()
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          data: {
            translations: [{ translatedText: "ہیلو" }],
          },
        }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          data: {
            translations: [{ translatedText: "دنیا" }],
          },
        }),
      });

    await service.translateToUrdu("Hello");
    const results = await service.translateBatch(["Hello", "World"]);

    expect(results[0]).toBe("ہیلو");
    expect(results[1]).toBe("دنیا");
    expect(global.fetch).toHaveBeenCalledTimes(2);
  });

  it("batch returns original texts when API fails", async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      statusText: "Server Error",
    });

    const results = await service.translateBatch(["One", "Two"]);
    expect(results).toEqual(["One", "Two"]);
  });

  it("batch returns original texts when no API key", async () => {
    vi.unstubAllEnvs();
    vi.stubEnv("NEXT_PUBLIC_GOOGLE_TRANSLATE_API_KEY", "");

    vi.resetModules();
    const mod = await import("@/services/translateService");
    const noKeyService = new mod.TranslateService();

    const results = await noKeyService.translateBatch(["One", "Two"]);
    expect(results).toEqual(["One", "Two"]);
  });

  // ----- isCached -----

  it("isCached returns false for uncached text", () => {
    expect(service.isCached("Unknown")).toBe(false);
  });

  it("isCached returns true after translation", async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        data: {
          translations: [{ translatedText: "ٹیسٹ" }],
        },
      }),
    });

    await service.translateToUrdu("Test");
    expect(service.isCached("Test")).toBe(true);
  });

  // ----- clearCache -----

  it("clearCache removes all cached translations", async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        data: {
          translations: [{ translatedText: "ٹیسٹ" }],
        },
      }),
    });

    await service.translateToUrdu("Test");
    expect(service.isCached("Test")).toBe(true);

    service.clearCache();
    expect(service.isCached("Test")).toBe(false);
  });

  // ----- getCacheSize -----

  it("getCacheSize returns the number of cached entries", async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        data: {
          translations: [{ translatedText: "ٹیسٹ" }],
        },
      }),
    });

    expect(service.getCacheSize()).toBe(0);
    await service.translateToUrdu("Test");
    expect(service.getCacheSize()).toBe(1);
  });

  // ----- API request format -----

  it("sends correct request format to Google Translate API", async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        data: {
          translations: [{ translatedText: "ہیلو" }],
        },
      }),
    });

    await service.translateToUrdu("Hello");

    const fetchCall = (global.fetch as any).mock.calls[0];
    expect(fetchCall[0]).toContain("translation.googleapis.com");
    expect(fetchCall[0]).toContain("key=test-api-key");

    const body = JSON.parse(fetchCall[1].body);
    expect(body.q).toEqual(["Hello"]);
    expect(body.target).toBe("ur");
    expect(body.source).toBe("en");
    expect(body.format).toBe("text");
  });

  // ----- Invalid API response -----

  it("returns original text when API response has no translations", async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ data: {} }),
    });

    const result = await service.translateToUrdu("Hello");
    expect(result).toBe("Hello");
  });
});
