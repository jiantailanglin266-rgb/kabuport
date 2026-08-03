import { describe, expect, it } from "vitest";
import { formatPercent, formatRatio, formatYen, formatYenCompact, nz } from "@/lib/format";

describe("format", () => {
  it("nz distinguishes 0 from missing", () => {
    expect(nz(0)).toBe(true);
    expect(nz(null)).toBe(false);
    expect(nz(undefined)).toBe(false);
    expect(nz(NaN)).toBe(false);
  });

  it("missing values render as dash, not zero", () => {
    expect(formatYen(undefined, "ja")).toBe("—");
    expect(formatRatio(null)).toBe("—");
    expect(formatYenCompact(undefined, "en")).toBe("—");
  });

  it("yen compact ja uses 億/兆", () => {
    expect(formatYenCompact(45_000_000_000_000, "ja")).toBe("45.00兆円");
    expect(formatYenCompact(2_850_000, "ja")).toBe("285万円");
  });

  it("yen compact en uses B/T", () => {
    expect(formatYenCompact(13_000_000_000_000, "en")).toBe("¥13.00T");
  });

  it("percent adds sign, ratio does not", () => {
    expect(formatPercent(1.5)).toBe("+1.50%");
    expect(formatPercent(-1.5)).toBe("-1.50%");
    expect(formatRatio(3)).toBe("3.00%");
  });

  it("yen formats per locale", () => {
    expect(formatYen(2850, "ja")).toBe("2,850円");
    expect(formatYen(2850, "en")).toBe("¥2,850");
  });
});
