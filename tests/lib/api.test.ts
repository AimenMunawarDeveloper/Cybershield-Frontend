import { ApiClient } from "@/lib/api";

describe("ApiClient", () => {
  const getToken = vi.fn(async () => "token-123");

  beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn());
    getToken.mockClear();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("adds auth headers and returns organizations data", async () => {
    (fetch as any).mockResolvedValue({
      ok: true,
      json: async () => ({ organizations: [] }),
    });

    const api = new ApiClient(getToken);
    const result = await api.getOrganizations();

    expect(fetch).toHaveBeenCalledWith(
      "http://localhost:5001/api/admins/orgs",
      expect.objectContaining({
        method: "GET",
        headers: expect.objectContaining({
          Authorization: "Bearer token-123",
        }),
      })
    );
    expect(result).toEqual({ organizations: [] });
  });

  it("throws the backend error when invite client admin fails", async () => {
    (fetch as any).mockResolvedValue({
      ok: false,
      json: async () => ({ error: "Invite failed" }),
    });

    const api = new ApiClient(getToken);

    await expect(api.inviteClientAdmin("a@example.com", "Org")).rejects.toThrow("Invite failed");
  });

  it("handles getUserProfile responses that are not valid JSON", async () => {
    (fetch as any).mockResolvedValue({
      ok: false,
      text: async () => "server down",
    });

    const api = new ApiClient(getToken);

    await expect(api.getUserProfile()).rejects.toThrow("Failed to fetch user profile");
  });

  it("creates form data and removes content-type for saveReport", async () => {
    (fetch as any).mockResolvedValue({
      ok: true,
      json: async () => ({ success: true, reportId: "report-1" }),
    });

    const api = new ApiClient(getToken);
    const blob = new Blob(["pdf"], { type: "application/pdf" });
    const result = await api.saveReport({
      reportName: "Weekly Report",
      reportDate: "2026-04-20",
      fileName: "weekly.pdf",
      pdfBlob: blob,
      reportData: { score: 90 },
    });

    const [, requestInit] = (fetch as any).mock.calls[0];
    expect(requestInit.headers["Content-Type"]).toBeUndefined();
    expect(result).toEqual({ success: true, reportId: "report-1" });
  });
});
