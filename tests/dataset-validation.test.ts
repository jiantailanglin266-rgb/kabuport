import { describe, expect, it } from "vitest";
// @ts-expect-error - .mjs script module without type declarations
import { validateDataset, validatePriceRow } from "../scripts/lib/validate-core.mjs";

const okMeta = {
  generatedAt: "2026-08-03T09:00:00.000Z",
  lastSuccessfulUpdateAt: "2026-08-03T09:00:00.000Z",
  sourceName: "J-Quants API",
  sourceUrl: "https://jpx-jquants.com/",
  freshness: "delayed_12weeks",
  marketDataDate: "2026-05-08",
  isFallback: false,
  warning: null,
};

describe("validateDataset", () => {
  it("accepts a well-formed dataset", () => {
    const r = validateDataset({
      meta: okMeta,
      stocks: { stocks: [{ code: "7203", nameJa: "トヨタ", close: 2850, changePercent: 1.4, tradingDate: "2026-05-08" }] },
      rankings: { rankings: [{ id: "gainers", formula: "x", marketDataDate: "2026-05-08", rows: [] }] },
      summary: { indices: [] },
    });
    expect(r.errors).toEqual([]);
    expect(r.stats.stockCount).toBe(1);
    expect(r.stats.withPrice).toBe(1);
  });

  it("rejects realtime freshness (requires a paid distribution contract)", () => {
    const r = validateDataset({ meta: { ...okMeta, freshness: "realtime" }, stocks: null, rankings: null, summary: null });
    expect(r.errors.join()).toMatch(/realtime/);
  });

  it("rejects negative prices and malformed dates", () => {
    const r = validateDataset({
      meta: okMeta,
      stocks: { stocks: [{ code: "1234", close: -10, tradingDate: "2026/05/08" }] },
      rankings: null,
      summary: null,
    });
    expect(r.errors.some((e: string) => e.includes("負数"))).toBe(true);
    expect(r.errors.some((e: string) => e.includes("tradingDate"))).toBe(true);
  });

  it("warns on duplicate codes and extreme moves", () => {
    const r = validateDataset({
      meta: okMeta,
      stocks: {
        stocks: [
          { code: "7203", close: 100, changePercent: 5, tradingDate: "2026-05-08" },
          { code: "7203", close: 100, changePercent: 90, tradingDate: "2026-05-08" },
        ],
      },
      rankings: null,
      summary: null,
    });
    expect(r.warnings.some((w: string) => w.includes("重複"))).toBe(true);
    expect(r.warnings.some((w: string) => w.includes("極端"))).toBe(true);
  });

  it("requires a source name when an index value is displayed", () => {
    const r = validateDataset({
      meta: okMeta,
      stocks: null,
      rankings: null,
      summary: { indices: [{ id: "nikkei225", value: 39000 }] },
    });
    expect(r.errors.some((e: string) => e.includes("提供元"))).toBe(true);
  });

  it("flags a missing meta file", () => {
    const r = validateDataset({ meta: null, stocks: null, rankings: null, summary: null });
    expect(r.errors.some((e: string) => e.includes("meta.json"))).toBe(true);
  });
});

describe("validatePriceRow", () => {
  it("passes a valid OHLC row", () => {
    expect(
      validatePriceRow({ code: "7203", tradingDate: "2026-05-08", open: 100, high: 110, low: 95, close: 105, volume: 1000 }),
    ).toEqual([]);
  });

  it("detects high < low", () => {
    const p = validatePriceRow({ code: "7203", tradingDate: "2026-05-08", high: 90, low: 100 });
    expect(p.join()).toMatch(/高値が安値より小さい/);
  });

  it("detects negative volume and bad dates", () => {
    const p = validatePriceRow({ code: "7203", tradingDate: "20260508", volume: -5 });
    expect(p.join()).toMatch(/tradingDate/);
    expect(p.join()).toMatch(/出来高が負数/);
  });
});
