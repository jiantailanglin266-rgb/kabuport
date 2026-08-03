import { describe, expect, it } from "vitest";
import { technicalScore } from "@/lib/metrics";
import { priceSeries } from "@/lib/series";

describe("technicalScore", () => {
  it("returns higher score near 52-week high with positive momentum", () => {
    const nearHigh = technicalScore({ price: 99, previousClose: 96, week52High: 100, week52Low: 50 });
    const nearLow = technicalScore({ price: 52, previousClose: 55, week52High: 100, week52Low: 50 });
    expect(nearHigh).toBeGreaterThan(nearLow);
    expect(nearHigh).toBeLessThanOrEqual(100);
    expect(nearLow).toBeGreaterThanOrEqual(0);
  });

  it("guards against invalid range", () => {
    expect(technicalScore({ price: 100, previousClose: 100, week52High: 50, week52Low: 50 })).toBe(0);
  });

  it("is bounded 0..100", () => {
    const s = technicalScore({ price: 100, previousClose: 90, week52High: 100, week52Low: 10 });
    expect(s).toBeGreaterThanOrEqual(0);
    expect(s).toBeLessThanOrEqual(100);
  });
});

describe("priceSeries", () => {
  it("is deterministic for the same code (SSR-safe)", () => {
    const a = priceSeries("7203", 2200, 3200, 2850);
    const b = priceSeries("7203", 2200, 3200, 2850);
    expect(a).toEqual(b);
  });

  it("ends at the last price and stays within range", () => {
    const s = priceSeries("6758", 2500, 3600, 3120, 32);
    expect(s).toHaveLength(32);
    expect(s[s.length - 1]).toBe(3120);
    expect(Math.min(...s)).toBeGreaterThanOrEqual(2500);
    expect(Math.max(...s)).toBeLessThanOrEqual(3600);
  });

  it("differs by code", () => {
    expect(priceSeries("7203", 100, 200, 150)).not.toEqual(priceSeries("9999", 100, 200, 150));
  });
});
