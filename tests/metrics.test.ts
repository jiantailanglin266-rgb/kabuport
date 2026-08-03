import { describe, expect, it } from "vitest";
import * as m from "@/lib/metrics";

describe("metrics", () => {
  it("priceChange / percent", () => {
    expect(m.priceChange(110, 100)).toBe(10);
    expect(m.priceChangePercent(110, 100)).toBeCloseTo(10);
    expect(m.priceChangePercent(100, 0)).toBeNull();
  });

  it("direction & symbol", () => {
    expect(m.direction(5)).toBe("up");
    expect(m.direction(-5)).toBe("down");
    expect(m.direction(0)).toBe("flat");
    expect(m.directionSymbol("up")).toBe("▲");
    expect(m.directionSymbol("down")).toBe("▼");
  });

  it("dividendYield", () => {
    expect(m.dividendYield(75, 2500)).toBeCloseTo(3.0);
    expect(m.dividendYield(75, 0)).toBeNull();
  });

  it("payoutRatio", () => {
    expect(m.payoutRatio(50, 200)).toBeCloseTo(25);
    expect(m.payoutRatio(50, 0)).toBeNull();
  });

  it("minInvestment", () => {
    expect(m.minInvestment(2850, 100)).toBe(285000);
    expect(m.minInvestment(2850, 0)).toBeNull();
  });

  it("per / pbr", () => {
    expect(m.per(2000, 100)).toBe(20);
    expect(m.per(2000, 0)).toBeNull();
    expect(m.pbr(3000, 1500)).toBe(2);
  });

  it("roe / equityRatio", () => {
    expect(m.roe(100, 1000)).toBeCloseTo(10);
    expect(m.equityRatio(3000, 10000)).toBeCloseTo(30);
  });

  it("growthRate handles bad denominators", () => {
    expect(m.growthRate(120, 100)).toBeCloseTo(20);
    expect(m.growthRate(120, 0)).toBeNull();
  });

  it("totalYield combines but null when both missing", () => {
    expect(m.totalYield(3, 1)).toBeCloseTo(4);
    expect(m.totalYield(3, undefined)).toBeCloseTo(3);
    expect(m.totalYield(undefined, undefined)).toBeNull();
  });
});
