// Cache version for invalidation when needed
const CACHE_VERSION = "v1";
const CACHE_KEY = "translation_cache";
const CACHE_EXPIRY_DAYS = 7; // Cache expires after 7 days

// Translation cache to avoid repeated API calls
class TranslationCache {
  private cache: Map<string, { text: string; timestamp: number }>;

  constructor() {
    this.cache = new Map();
    this.loadFromLocalStorage();
  }

  private loadFromLocalStorage() {
    if (typeof window === "undefined") return;

    try {
      const stored = localStorage.getItem(CACHE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed.version === CACHE_VERSION) {
          Object.entries(parsed.data).forEach(([key, value]: [string, any]) => {
            // Check if cache entry is not expired
            const daysSinceCache = (Date.now() - value.timestamp) / (1000 * 60 * 60 * 24);
            if (daysSinceCache < CACHE_EXPIRY_DAYS) {
              this.cache.set(key, value);
            }
          });
          console.log(`Loaded ${this.cache.size} translations from cache`);
        }
      }
    } catch (error) {
      console.error("Failed to load translation cache:", error);
    }
  }

  private saveToLocalStorage() {
    if (typeof window === "undefined") return;

    try {
      const data: Record<string, any> = {};
      this.cache.forEach((value, key) => {
        data[key] = value;
      });

      localStorage.setItem(
        CACHE_KEY,
        JSON.stringify({
          version: CACHE_VERSION,
          data,
          savedAt: Date.now(),
        })
      );
    } catch (error) {
      console.error("Failed to save translation cache:", error);
    }
  }

  get(key: string): string | undefined {
    const entry = this.cache.get(key);
    return entry?.text;
  }

  set(key: string, text: string) {
    this.cache.set(key, { text, timestamp: Date.now() });
    // Save to localStorage periodically (debounced)
    this.debouncedSave();
  }

  has(key: string): boolean {
    return this.cache.has(key);
  }

  clear() {
    this.cache.clear();
    if (typeof window !== "undefined") {
      localStorage.removeItem(CACHE_KEY);
    }
  }

  size(): number {
    return this.cache.size;
  }

  private saveTimeout: NodeJS.Timeout | null = null;
  private debouncedSave() {
    if (this.saveTimeout) clearTimeout(this.saveTimeout);
    this.saveTimeout = setTimeout(() => {
      this.saveToLocalStorage();
    }, 1000); // Save after 1 second of inactivity
  }
}

const translationCache = new TranslationCache();

// Queue for batching translation requests
let translationQueue: Array<{
  text: string;
  resolve: (value: string) => void;
  reject: (error: Error) => void;
}> = [];

let batchTimeout: NodeJS.Timeout | null = null;

export class TranslateService {
  private apiKey: string;
  private baseUrl: string;

  constructor() {
    this.apiKey = process.env.NEXT_PUBLIC_GOOGLE_TRANSLATE_API_KEY || "";
    this.baseUrl = "https://translation.googleapis.com/language/translate/v2";
  }

  /**
   * Translate text from English to Urdu
   */
  async translateToUrdu(text: string): Promise<string> {
    if (!text || text.trim() === "") return text;

    // Check cache first
    const cacheKey = `en-ur:${text}`;
    if (translationCache.has(cacheKey)) {
      return translationCache.get(cacheKey)!;
    }

    try {
      const translatedText = await this.translate(text, "ur", "en");
      // Cache the result
      translationCache.set(cacheKey, translatedText);
      return translatedText;
    } catch (error) {
      console.error("Translation error:", error);
      return text; // Return original text on error
    }
  }

  /**
   * Core translation method
   */
  private async translate(
    text: string,
    targetLanguage: string,
    sourceLanguage: string
  ): Promise<string> {
    if (!this.apiKey) {
      console.warn("Google Translate API key not configured");
      return text;
    }

    const requestData = {
      q: [text],
      target: targetLanguage,
      source: sourceLanguage,
      format: "text",
    };

    const response = await fetch(
      `${this.baseUrl}?key=${encodeURIComponent(this.apiKey)}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestData),
      }
    );

    if (!response.ok) {
      throw new Error(`Translation API error: ${response.statusText}`);
    }

    const result = await response.json();

    if (result.data && result.data.translations && result.data.translations[0]) {
      return result.data.translations[0].translatedText;
    }

    throw new Error("Invalid translation response");
  }

  /**
   * Batch translate multiple texts (for performance)
   */
  async translateBatch(texts: string[]): Promise<string[]> {
    if (!this.apiKey) {
      console.warn("Google Translate API key not configured");
      return texts;
    }

    if (texts.length === 0) return [];

    // Check cache for all texts
    const results: string[] = [];
    const textsToTranslate: string[] = [];
    const indices: number[] = [];

    texts.forEach((text, index) => {
      const cacheKey = `en-ur:${text}`;
      if (translationCache.has(cacheKey)) {
        results[index] = translationCache.get(cacheKey)!;
      } else {
        textsToTranslate.push(text);
        indices.push(index);
      }
    });

    // If all texts are cached, return immediately
    if (textsToTranslate.length === 0) {
      return results;
    }

    try {
      const requestData = {
        q: textsToTranslate,
        target: "ur",
        source: "en",
        format: "text",
      };

      const response = await fetch(
        `${this.baseUrl}?key=${encodeURIComponent(this.apiKey)}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(requestData),
        }
      );

      if (!response.ok) {
        throw new Error(`Translation API error: ${response.statusText}`);
      }

      const result = await response.json();

      if (result.data && result.data.translations) {
        result.data.translations.forEach((translation: any, i: number) => {
          const translatedText = translation.translatedText;
          const originalText = textsToTranslate[i];
          const originalIndex = indices[i];

          // Cache the result
          translationCache.set(`en-ur:${originalText}`, translatedText);
          results[originalIndex] = translatedText;
        });
      }

      return results;
    } catch (error) {
      console.error("Batch translation error:", error);
      // Return original texts on error
      indices.forEach((originalIndex, i) => {
        results[originalIndex] = textsToTranslate[i];
      });
      return results;
    }
  }

  /**
   * Clear translation cache
   */
  clearCache() {
    translationCache.clear();
  }

  /**
   * Get cache size
   */
  getCacheSize() {
    return translationCache.size();
  }

  /**
   * Check if text is already cached
   */
  isCached(text: string): boolean {
    return translationCache.has(`en-ur:${text}`);
  }
}

export const translateService = new TranslateService();
