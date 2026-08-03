import { describe, expect, it } from "vitest";
import { RSI_LOWER, RSI_UPPER, rsi, rsiSignal, rsiStateLabel } from "@/lib/rsi";
import { dailyCloses } from "@/lib/series";

describe("rsi", () => {
  it("returns null when there is not enough data", () => {
    expect(rsi([1, 2, 3])).toBeNull();
    expect(rsi(Array.from({ length: 14 }, (_, i) => i + 1))).toBeNull(); // 14件=period+1未満
    expect(rsi(Array.from({ length: 15 }, (_, i) => i + 1))).not.toBeNull();
  });

  it("is 100 when every change is a gain", () => {
    const closes = Array.from({ length: 30 }, (_, i) => 100 + i);
    expect(rsi(closes)).toBe(100);
  });

  it("is 0 when every change is a loss", () => {
    const closes = Array.from({ length: 30 }, (_, i) => 200 - i);
    expect(rsi(closes)).toBe(0);
  });

  it("sits near the middle for symmetric zig-zag moves", () => {
    const closes = Array.from({ length: 60 }, (_, i) => 100 + (i % 2 === 0 ? 0 : 1));
    const v = rsi(closes)!;
    expect(v).toBeGreaterThan(35);
    expect(v).toBeLessThan(65);
  });

  it("rises with a strong uptrend and falls with a downtrend", () => {
    const up = Array.from({ length: 40 }, (_, i) => 100 + i * 2 + (i % 5 === 0 ? -1 : 0));
    const down = Array.from({ length: 40 }, (_, i) => 200 - i * 2 + (i % 5 === 0 ? 1 : 0));
    expect(rsi(up)!).toBeGreaterThan(rsi(down)!);
    expect(rsi(up)!).toBeGreaterThan(70);
    expect(rsi(down)!).toBeLessThan(30);
  });

  it("stays within 0-100 for arbitrary series", () => {
    const closes = dailyCloses({ code: "7203", low: 2200, high: 3200, price: 2850, previousClose: 2810 });
    const v = rsi(closes)!;
    expect(v).toBeGreaterThanOrEqual(0);
    expect(v).toBeLessThanOrEqual(100);
  });
});

describe("rsiSignal", () => {
  it("flags a sell signal strictly above the upper bound (75)", () => {
    expect(rsiSignal(RSI_UPPER + 0.1)).toBe("sell");
    expect(rsiSignal(RSI_UPPER)).toBe("neutral"); // 75ちょうどは中立（"超えたら"のため）
  });

  it("flags a buy signal strictly below the lower bound (25)", () => {
    expect(rsiSignal(RSI_LOWER - 0.1)).toBe("buy");
    expect(rsiSignal(RSI_LOWER)).toBe("neutral"); // 25ちょうどは中立（"下回ったら"のため）
  });

  it("treats missing values as neutral", () => {
    expect(rsiSignal(null)).toBe("neutral");
    expect(rsiSignal(50)).toBe("neutral");
  });
});

describe("rsiStateLabel", () => {
  it("describes the indicator state, not an investment judgement", () => {
    expect(rsiStateLabel(80).ja).toBe("買われ過ぎ");
    expect(rsiStateLabel(20).ja).toBe("売られ過ぎ");
    expect(rsiStateLabel(50).ja).toBe("中立圏");
    expect(rsiStateLabel(null).ja).toBe("算出不可");
  });
});

describe("dailyCloses", () => {
  it("is deterministic and ends at the current price", () => {
    const a = dailyCloses({ code: "6758", low: 2500, high: 3600, price: 3120, previousClose: 3150 });
    const b = dailyCloses({ code: "6758", low: 2500, high: 3600, price: 3120, previousClose: 3150 });
    expect(a).toEqual(b);
    expect(a[a.length - 1]).toBeCloseTo(3120, 2);
    expect(a).toHaveLength(120);
  });

  it("differs by code", () => {
    const a = dailyCloses({ code: "1111", low: 100, high: 200, price: 150, previousClose: 149 });
    const b = dailyCloses({ code: "2222", low: 100, high: 200, price: 150, previousClose: 149 });
    expect(a).not.toEqual(b);
  });
});
