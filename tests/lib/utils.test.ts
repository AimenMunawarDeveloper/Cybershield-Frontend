import { cn } from "@/lib/utils";

describe("cn", () => {
  it("merges class names and resolves Tailwind conflicts", () => {
    expect(cn("px-2", "px-4", "font-bold")).toBe("px-4 font-bold");
  });

  it("ignores falsey values", () => {
    expect(cn("text-white", undefined, false && "hidden", null)).toBe("text-white");
  });
});
