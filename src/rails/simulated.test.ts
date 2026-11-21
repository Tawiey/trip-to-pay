import { describe, it, expect } from "vitest";
import { simulatedBank } from "./simulated";

describe("simulatedBank", () => {
  it("issues a card expiring at trip end", () => {
    const c = simulatedBank.issueCard({ endDate: "2026-10-16" });
    expect(c.expiresOn).toBe("2026-10-16");
    expect(c.status).toBe("active");
    expect(c.last4).toMatch(/^\d{4}$/);
    expect(c.pan.endsWith(c.last4)).toBe(true);
    expect(c.cvv).toMatch(/^\d{3}$/);
  });
  it("pays out via simulated PayShap", () => {
    const p = simulatedBank.payout("e1", 113940);
    expect(p.reference).toMatch(/^PS-[A-Z0-9]{8}$/);
    expect(p).toMatchObject({ method: "PayShap", simulated: true, amount: 113940 });
  });
});
