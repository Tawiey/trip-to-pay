import { describe, it, expect } from "vitest";
import { formatZAR, rands } from "./money";

describe("money", () => {
  it("formats rand amounts SA style", () => {
    expect(formatZAR(113940)).toBe("R 1 139.40");
    expect(formatZAR(-14000)).toBe("-R 140.00");
    expect(formatZAR(950000, { whole: true })).toBe("R 9 500");
    expect(formatZAR(0)).toBe("R 0.00");
    expect(formatZAR(123456789)).toBe("R 1 234 567.89");
  });
  it("converts rands to cents without float drift", () => {
    expect(rands(4.95)).toBe(495);
    expect(rands(1049.4)).toBe(104940);
  });
});
