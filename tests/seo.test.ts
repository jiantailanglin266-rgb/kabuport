import { describe, expect, it } from "vitest";
import { hreflangAlternates, localizedUrl } from "@/lib/seo";
import { buildMetadata } from "@/lib/seo";

describe("seo", () => {
  it("localizedUrl builds locale-prefixed absolute URLs", () => {
    expect(localizedUrl("ja", "stocks/7203")).toMatch(/\/ja\/stocks\/7203$/);
    expect(localizedUrl("en")).toMatch(/\/en$/);
  });

  it("hreflang includes ja, en and x-default", () => {
    const alt = hreflangAlternates("stocks/7203");
    expect(Object.keys(alt).sort()).toEqual(["en", "ja", "x-default"]);
    expect(alt["x-default"]).toBe(alt["ja"]);
  });

  it("buildMetadata sets self-canonical and robots", () => {
    const meta = buildMetadata({ locale: "ja", path: "stocks/7203", title: "トヨタ", description: "desc" });
    expect(meta.alternates?.canonical).toMatch(/\/ja\/stocks\/7203$/);
    expect(meta.robots).toMatchObject({ index: true, follow: true });
  });

  it("noindex pages are marked", () => {
    const meta = buildMetadata({ locale: "en", path: "x", title: "x", description: "y", noindex: true });
    expect(meta.robots).toMatchObject({ index: false, follow: false });
  });
});
