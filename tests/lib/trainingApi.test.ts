import { vi, describe, it, expect, beforeEach } from "vitest";

const mockGetToken = vi.fn(async () => "test-token");

vi.mock("@clerk/nextjs", () => ({
  useAuth: () => ({ getToken: mockGetToken }),
}));

import { ApiClient } from "@/lib/api";

describe("ApiClient — Training / Course Methods", () => {
  let client: InstanceType<typeof ApiClient>;

  beforeEach(() => {
    vi.clearAllMocks();
    client = new ApiClient(mockGetToken);
    global.fetch = vi.fn();
  });

  // -----------------------------------------------------------------------
  // getCourses
  // -----------------------------------------------------------------------

  describe("getCourses", () => {
    it("sends GET to /courses with default params", async () => {
      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
        ok: true,
        json: async () => ({ success: true, courses: [], pagination: { page: 1, limit: 50, total: 0, pages: 1 } }),
      });

      const result = await client.getCourses();
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining("/courses"),
        expect.objectContaining({ method: "GET" })
      );
      expect(result.success).toBe(true);
    });

    it("passes query parameters", async () => {
      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
        ok: true,
        json: async () => ({ success: true, courses: [] }),
      });

      await client.getCourses({ page: 2, limit: 10, sort: "oldest" });
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringMatching(/page=2.*limit=10.*sort=oldest/),
        expect.anything()
      );
    });
  });

  // -----------------------------------------------------------------------
  // getCourseById
  // -----------------------------------------------------------------------

  describe("getCourseById", () => {
    it("returns course data", async () => {
      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
        ok: true,
        json: async () => ({ success: true, course: { _id: "c1", courseTitle: "Test" } }),
      });

      const result = await client.getCourseById("c1");
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining("/courses/c1"),
        expect.objectContaining({ method: "GET" })
      );
      expect(result.course.courseTitle).toBe("Test");
    });

    it("returns null for 404", async () => {
      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
        ok: false,
        status: 404,
        json: async () => ({ error: "Course not found" }),
      });

      const result = await client.getCourseById("bad-id");
      expect(result).toBeNull();
    });
  });

  // -----------------------------------------------------------------------
  // createCourse
  // -----------------------------------------------------------------------

  describe("createCourse", () => {
    it("sends POST with course payload", async () => {
      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
        ok: true,
        json: async () => ({ success: true, course: { _id: "c1", courseTitle: "New" } }),
      });

      const payload = {
        courseTitle: "New",
        description: "Desc",
        modules: [{ title: "M1", sections: [{ title: "S1", material: "Content" }], quiz: [] }],
      };
      const result = await client.createCourse(payload);

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining("/courses"),
        expect.objectContaining({
          method: "POST",
          body: JSON.stringify(payload),
        })
      );
      expect(result.course.courseTitle).toBe("New");
    });

    it("throws on error response", async () => {
      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
        ok: false,
        json: async () => ({ error: "courseTitle is required" }),
      });

      await expect(client.createCourse({ courseTitle: "", modules: [] })).rejects.toThrow("courseTitle is required");
    });
  });

  // -----------------------------------------------------------------------
  // updateCourse
  // -----------------------------------------------------------------------

  describe("updateCourse", () => {
    it("sends PUT with payload", async () => {
      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
        ok: true,
        json: async () => ({ success: true, course: { _id: "c1", courseTitle: "Updated" } }),
      });

      const payload = { courseTitle: "Updated", modules: [] };
      await client.updateCourse("c1", payload);

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining("/courses/c1"),
        expect.objectContaining({ method: "PUT" })
      );
    });
  });

  // -----------------------------------------------------------------------
  // deleteCourse
  // -----------------------------------------------------------------------

  describe("deleteCourse", () => {
    it("sends DELETE", async () => {
      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
        ok: true,
        json: async () => ({ success: true }),
      });

      await client.deleteCourse("c1");
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining("/courses/c1"),
        expect.objectContaining({ method: "DELETE" })
      );
    });

    it("throws on error", async () => {
      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
        ok: false,
        json: async () => ({ error: "Insufficient permissions" }),
      });

      await expect(client.deleteCourse("c1")).rejects.toThrow("Insufficient permissions");
    });
  });

  // -----------------------------------------------------------------------
  // getCourseProgress
  // -----------------------------------------------------------------------

  describe("getCourseProgress", () => {
    it("returns completed array", async () => {
      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
        ok: true,
        json: async () => ({ success: true, completed: ["0-0", "0-1"] }),
      });

      const result = await client.getCourseProgress("c1");
      expect(result.completed).toEqual(["0-0", "0-1"]);
    });
  });

  // -----------------------------------------------------------------------
  // markCourseProgressComplete
  // -----------------------------------------------------------------------

  describe("markCourseProgressComplete", () => {
    it("sends POST with submoduleId", async () => {
      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
        ok: true,
        json: async () => ({ success: true, completed: ["0-0"], certificateGenerated: false }),
      });

      const result = await client.markCourseProgressComplete("c1", "0-0");
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining("/courses/c1/progress"),
        expect.objectContaining({
          method: "POST",
          body: JSON.stringify({ submoduleId: "0-0" }),
        })
      );
      expect(result.completed).toContain("0-0");
      expect(result.certificateGenerated).toBe(false);
    });
  });

  // -----------------------------------------------------------------------
  // unmarkCourseProgressComplete
  // -----------------------------------------------------------------------

  describe("unmarkCourseProgressComplete", () => {
    it("sends DELETE with submoduleId", async () => {
      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
        ok: true,
        json: async () => ({ success: true, completed: [] }),
      });

      const result = await client.unmarkCourseProgressComplete("c1", "0-0");
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining("/courses/c1/progress"),
        expect.objectContaining({ method: "DELETE" })
      );
      expect(result.completed).toEqual([]);
    });
  });

  // -----------------------------------------------------------------------
  // generateCertificate
  // -----------------------------------------------------------------------

  describe("generateCertificate", () => {
    it("sends POST to generate endpoint", async () => {
      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
        ok: true,
        json: async () => ({ success: true, certificate: { certificateNumber: "CERT-123" } }),
      });

      const result = await client.generateCertificate("c1");
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining("/certificates/generate/c1"),
        expect.objectContaining({ method: "POST" })
      );
      expect(result.certificate.certificateNumber).toBe("CERT-123");
    });
  });

  // -----------------------------------------------------------------------
  // getCertificateByCourse
  // -----------------------------------------------------------------------

  describe("getCertificateByCourse", () => {
    it("returns certificate for course", async () => {
      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
        ok: true,
        json: async () => ({ success: true, certificate: { courseTitle: "Test" } }),
      });

      const result = await client.getCertificateByCourse("c1");
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining("/certificates/course/c1"),
        expect.objectContaining({ method: "GET" })
      );
      expect(result.certificate.courseTitle).toBe("Test");
    });

    it("returns null certificate when not found", async () => {
      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
        ok: true,
        json: async () => ({ success: true, certificate: null }),
      });

      const result = await client.getCertificateByCourse("c1");
      expect(result.certificate).toBeNull();
    });
  });

  // -----------------------------------------------------------------------
  // getCoursesProgress
  // -----------------------------------------------------------------------

  describe("getCoursesProgress", () => {
    it("returns courses progress summary", async () => {
      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
        ok: true,
        json: async () => ({
          success: true,
          courses: [{ _id: "c1", courseTitle: "Test", progressPercent: 50, isCompleted: false }],
          totalCompleted: 0,
          totalCourses: 1,
        }),
      });

      const result = await client.getCoursesProgress();
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining("/users/me/courses-progress"),
        expect.objectContaining({ method: "GET" })
      );
      expect(result.totalCourses).toBe(1);
      expect(result.courses[0].progressPercent).toBe(50);
    });
  });
});
