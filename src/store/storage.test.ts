import { describe, it, expect } from "vitest";
import { sanitizeStored } from "./storage";

describe("sanitizeStored", () => {
  it("passes through valid JSON", () => {
    expect(sanitizeStored('{"state":{},"version":1}')).toBe('{"state":{},"version":1}');
  });
  it("drops corrupt JSON so the app falls back to the seed", () => {
    expect(sanitizeStored("{not json")).toBeNull();
  });
  it("keeps null as null", () => {
    expect(sanitizeStored(null)).toBeNull();
  });
});
