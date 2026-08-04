import { describe, expect, it } from "vitest";
// @ts-expect-error - .mjs script modules without type declarations
import {
  buildSlug, calculateImportance, classifyNews, contentHash, findDuplicate, isBlockedHost, isBreaking,
  isSafeFeedUrl, matchCompanies, normalizeNewsUrl, normalizeTitle, safeImageUrl, sanitizeSummary,
  titleSimilarity, urlHash,
} from "../scripts/lib/news-core.mjs";
// @ts-expect-error - .mjs script modules without type declarations
import { parseFeed, parseDate } from "../scripts/lib/rss-parse.mjs";
import keywords from "../src/data/news-category-keywords.json";

// ============================================================
// セキュリティ: SSRF / プロトコル
// ============================================================
describe("RSS security", () => {
  it("blocks internal hosts and cloud metadata", () => {
    for (const h of ["localhost", "127.0.0.1", "0.0.0.0", "10.1.2.3", "192.168.0.1", "172.16.0.1", "169.254.169.254", "::1", "metadata.google.internal"]) {
      expect(isBlockedHost(h), h).toBe(true);
    }
    expect(isBlockedHost("example.com")).toBe(false);
    expect(isBlockedHost("news.example.co.jp")).toBe(false);
  });

  it("allows only http/https feed URLs", () => {
    expect(isSafeFeedUrl("https://example.com/rss.xml")).toBe(true);
    expect(isSafeFeedUrl("http://example.com/rss.xml")).toBe(true);
    expect(isSafeFeedUrl("file:///etc/passwd")).toBe(false);
    expect(isSafeFeedUrl("ftp://example.com/feed")).toBe(false);
    expect(isSafeFeedUrl("http://127.0.0.1:8080/feed")).toBe(false);
    expect(isSafeFeedUrl("https://user:pass@example.com/feed")).toBe(false);
    expect(isSafeFeedUrl("not a url")).toBe(false);
  });

  it("rejects unsafe image URLs", () => {
    expect(safeImageUrl("https://cdn.example.com/a.jpg")).toBe("https://cdn.example.com/a.jpg");
    expect(safeImageUrl("javascript:alert(1)")).toBeNull();
    expect(safeImageUrl("http://169.254.169.254/latest/meta-data")).toBeNull();
    expect(safeImageUrl(null)).toBeNull();
  });
});

// ============================================================
// サニタイズ
// ============================================================
describe("sanitizeSummary", () => {
  it("strips scripts, iframes and event handlers", () => {
    const dirty = `<p onclick="steal()">概要です</p><script>alert(1)</script><iframe src="https://evil"></iframe>`;
    const clean = sanitizeSummary(dirty);
    expect(clean).toBe("概要です");
    expect(clean).not.toMatch(/script|iframe|onclick/i);
  });

  it("decodes entities and collapses whitespace", () => {
    expect(sanitizeSummary("A&amp;B\n\n  C")).toBe("A&B C");
  });

  it("truncates long text so full articles are never reproduced", () => {
    const long = "あ".repeat(500);
    const out = sanitizeSummary(long, 100);
    expect(out.length).toBeLessThanOrEqual(101);
    expect(out.endsWith("…")).toBe(true);
  });
});

// ============================================================
// URL正規化・ハッシュ
// ============================================================
describe("normalizeNewsUrl", () => {
  it("removes tracking params, fragments and www", () => {
    expect(normalizeNewsUrl("http://www.example.com/a/?utm_source=x&id=3#top")).toBe("https://example.com/a?id=3");
  });

  it("treats http and https as the same article", () => {
    expect(normalizeNewsUrl("http://example.com/a")).toBe(normalizeNewsUrl("https://example.com/a"));
  });

  it("returns null for invalid or unsafe URLs", () => {
    expect(normalizeNewsUrl("javascript:alert(1)")).toBeNull();
    expect(normalizeNewsUrl("nope")).toBeNull();
  });

  it("produces a stable url hash", () => {
    expect(urlHash("https://example.com/a/")).toBe(urlHash("http://www.example.com/a?utm_medium=rss"));
  });
});

// ============================================================
// タイトル正規化・重複判定
// ============================================================
describe("title normalization and duplicates", () => {
  it("normalizes width, case, symbols and breaking prefixes", () => {
    expect(normalizeTitle("【速報】ＡＢＣ社、決算を発表！")).toBe("abc社 決算を発表");
  });

  it("removes the source name from the title", () => {
    expect(normalizeTitle("A社が決算発表 - サンプル新聞", "サンプル新聞")).toBe("a社が決算発表");
  });

  it("scores similarity between near-identical titles", () => {
    const s = titleSimilarity("A社、通期予想を上方修正", "【速報】A社、通期予想を上方修正");
    expect(s).toBeGreaterThan(0.8);
    expect(titleSimilarity("A社が増配", "日銀が金利を据え置き")).toBeLessThan(0.3);
  });

  it("detects duplicates by guid, url, canonical and title", () => {
    const base = {
      externalId: "guid-1",
      title: "A社、通期予想を上方修正",
      originalUrl: "https://a.example.com/1",
      canonicalUrl: "https://a.example.com/1",
      publishedAt: "2026-08-04T00:00:00Z",
      contentHash: contentHash("A社、通期予想を上方修正", "概要"),
      urlHash: urlHash("https://a.example.com/1"),
      id: "x1",
    };
    expect(findDuplicate({ ...base, externalId: "guid-1", originalUrl: "https://other/9" }, [base])?.reason).toBe("guid");
    expect(findDuplicate({ ...base, externalId: "other" }, [base])?.reason).toBe("url");
    expect(
      findDuplicate({ ...base, externalId: "other", originalUrl: "https://b.example.com/9" }, [base])?.reason,
    ).toBe("canonical");
    expect(findDuplicate({ ...base, externalId: null, originalUrl: "https://z/1", canonicalUrl: null, urlHash: null }, [base])?.reason).toBe("title");
  });

  it("treats a breaking-prefixed repost as the same title", () => {
    const a = {
      id: "a", externalId: "g1", title: "A社、通期の業績予想を上方修正すると発表", originalUrl: "https://a/1",
      canonicalUrl: null, publishedAt: "2026-08-04T00:00:00Z", contentHash: "h1", urlHash: "u1",
    };
    const b = {
      externalId: "g2", title: "【速報】A社、通期の業績予想を上方修正すると発表", originalUrl: "https://b/2",
      canonicalUrl: null, publishedAt: "2026-08-04T02:00:00Z", contentHash: "h2", urlHash: "u2",
    };
    // 速報表記を除くと完全一致するため、より強い「title」で判定される
    expect(findDuplicate(b, [a])?.reason).toBe("title");
  });

  it("detects near-identical titles within the time window", () => {
    const a = {
      id: "a", externalId: "g1", title: "A社が通期の業績予想を上方修正すると正式に発表した", originalUrl: "https://a/1",
      canonicalUrl: null, publishedAt: "2026-08-04T00:00:00Z", contentHash: "h1", urlHash: "u1",
    };
    const b = {
      externalId: "g2", title: "A社が通期の業績予想を上方修正すると発表した", originalUrl: "https://b/2",
      canonicalUrl: null, publishedAt: "2026-08-04T02:00:00Z", contentHash: "h2", urlHash: "u2",
    };
    expect(findDuplicate(b, [a])?.reason).toBe("title_similarity");
  });

  it("never merges similar headlines about different companies", () => {
    // 「A社が上方修正」と「B社が上方修正」はタイトルが酷似するが、別会社のニュース
    const a = {
      id: "a", externalId: "g1", title: "A社が通期の業績予想を上方修正", originalUrl: "https://a/1",
      canonicalUrl: null, publishedAt: "2026-08-04T00:00:00Z", contentHash: "h1", urlHash: "u1",
      companies: [{ code: "1111" }],
    };
    const b = {
      externalId: "g2", title: "B社が通期の業績予想を上方修正", originalUrl: "https://b/2",
      canonicalUrl: null, publishedAt: "2026-08-04T01:00:00Z", contentHash: "h2", urlHash: "u2",
      companies: [{ code: "2222" }],
    };
    expect(titleSimilarity(a.title, b.title)).toBeGreaterThan(0.8); // タイトルは酷似している
    expect(findDuplicate(b, [a])).toBeNull(); // それでも重複にしない
  });

  it("does not merge opposite events for the same company", () => {
    const a = { id: "a", externalId: "g1", title: "A社が期末配当の増配を発表", originalUrl: "https://a/1", canonicalUrl: null, publishedAt: "2026-08-04T00:00:00Z", contentHash: "h1", urlHash: "u1", companies: [{ code: "1111" }] };
    const b = { externalId: "g2", title: "A社が期末配当の減配を発表", originalUrl: "https://b/2", canonicalUrl: null, publishedAt: "2026-08-04T01:00:00Z", contentHash: "h2", urlHash: "u2", companies: [{ code: "1111" }] };
    expect(findDuplicate(b, [a])).toBeNull();
  });

  it("does not treat unrelated articles as duplicates", () => {
    const a = { id: "a", externalId: "g1", title: "日銀が政策金利を据え置き", originalUrl: "https://a/1", canonicalUrl: null, publishedAt: "2026-08-04T00:00:00Z", contentHash: "h1", urlHash: "u1" };
    const b = { externalId: "g2", title: "B社が株主優待を新設", originalUrl: "https://b/2", canonicalUrl: null, publishedAt: "2026-08-04T01:00:00Z", contentHash: "h2", urlHash: "u2" };
    expect(findDuplicate(b, [a])).toBeNull();
  });
});

// ============================================================
// 分類・企業判定・重要度
// ============================================================
describe("classifyNews", () => {
  it("classifies earnings and guidance news", () => {
    const r = classifyNews("A社、通期の業績予想を上方修正 営業利益は増益", keywords);
    expect(r[0].slug).toBe("guidance");
    expect(r.map((x: { slug: string }) => x.slug)).toContain("earnings");
    expect(r[0].confidence).toBeGreaterThan(0.5);
  });

  it("classifies dividends and benefits", () => {
    expect(classifyNews("B社が増配を発表、配当予想を修正", keywords)[0].slug).toBe("dividend");
    expect(classifyNews("C社、株主優待を新設", keywords)[0].slug).toBe("benefits");
  });

  it("returns nothing for unrelated text", () => {
    expect(classifyNews("今日はよい天気です", keywords)).toEqual([]);
  });

  it("boosts confidence when the RSS category agrees", () => {
    const withRss = classifyNews("配当について", keywords, ["dividend"]);
    const without = classifyNews("配当について", keywords, []);
    expect(withRss[0].confidence).toBeGreaterThan(without[0].confidence);
  });
});

describe("matchCompanies", () => {
  const dict = [
    { code: "7203", names: ["トヨタ自動車", "トヨタ"] },
    { code: "6758", names: ["ソニーグループ", "ソニー"] },
  ];

  it("matches by security code with the highest confidence", () => {
    const r = matchCompanies("トヨタ自動車（7203）が決算を発表", dict);
    expect(r[0].code).toBe("7203");
    expect(r[0].matchType).toBe("security_code");
    expect(r[0].confidence).toBeGreaterThan(0.9);
  });

  it("matches by company name", () => {
    const r = matchCompanies("ソニーグループが新製品を発表", dict);
    expect(r[0].code).toBe("6758");
    expect(r[0].matchType).toBe("company_name");
  });

  it("does not link ambiguous short names below the threshold", () => {
    const ambiguous = [{ code: "9999", names: ["日本"], ambiguous: true }];
    expect(matchCompanies("日本の景気は緩やかに回復", ambiguous)).toEqual([]);
  });

  it("returns nothing when no company is mentioned", () => {
    expect(matchCompanies("日銀が政策金利を据え置き", dict)).toEqual([]);
  });
});

describe("importance and breaking", () => {
  it("scores corporate actions higher than general market news", () => {
    const tob = calculateImportance({
      categories: [{ slug: "tob", confidence: 0.9 }], keywordMap: keywords, companyCount: 1,
      publishedAt: "2026-08-04T00:00:00Z", now: Date.parse("2026-08-04T01:00:00Z"),
    });
    const market = calculateImportance({
      categories: [{ slug: "market", confidence: 0.6 }], keywordMap: keywords, companyCount: 0,
      publishedAt: "2026-08-04T00:00:00Z", now: Date.parse("2026-08-04T01:00:00Z"),
    });
    expect(tob).toBeGreaterThan(market);
    expect(tob).toBeLessThanOrEqual(100);
  });

  it("auto-expires the breaking flag after the window", () => {
    const now = Date.parse("2026-08-04T12:00:00Z");
    expect(isBreaking("2026-08-04T10:00:00Z", 70, { now })).toBe(true);
    expect(isBreaking("2026-08-03T10:00:00Z", 70, { now })).toBe(false); // 時間経過で解除
    expect(isBreaking("2026-08-04T10:00:00Z", 10, { now })).toBe(false); // 重要度不足
  });
});

describe("buildSlug", () => {
  it("is url-safe, dated and stable", () => {
    const s = buildSlug("A社、通期予想を上方修正", "https://a.example.com/1", "2026-08-04T00:00:00Z");
    expect(s).toMatch(/^\d{8}-.*-[0-9a-f]{8}$/);
    expect(s).toBe(buildSlug("A社、通期予想を上方修正", "https://a.example.com/1", "2026-08-04T00:00:00Z"));
    expect(s).not.toMatch(/[^a-z0-9-]/);
  });
});

// ============================================================
// フィード解析
// ============================================================
describe("parseFeed", () => {
  it("parses RSS 2.0", () => {
    const xml = `<?xml version="1.0"?><rss version="2.0"><channel><title>Sample</title>
      <item><guid>g1</guid><title>A社が決算発表</title><link>https://a.example.com/1</link>
      <description>&lt;p&gt;概要&lt;/p&gt;</description><pubDate>Mon, 04 Aug 2026 06:30:00 +0900</pubDate>
      <category>決算</category></item></channel></rss>`;
    const r = parseFeed(xml);
    expect(r.format).toBe("rss2");
    expect(r.items).toHaveLength(1);
    expect(r.items[0].title).toBe("A社が決算発表");
    expect(r.items[0].link).toBe("https://a.example.com/1");
    expect(r.items[0].summary).toBe("概要");
    expect(r.items[0].publishedAt).toBe("2026-08-03T21:30:00.000Z");
    expect(r.items[0].categories).toContain("決算");
  });

  it("parses Atom with rel=alternate links", () => {
    const xml = `<?xml version="1.0"?><feed xmlns="http://www.w3.org/2005/Atom"><title>Sample</title>
      <entry><id>tag:1</id><title>B社が増配</title>
      <link rel="self" href="https://self"/><link rel="alternate" href="https://b.example.com/2"/>
      <summary>概要B</summary><updated>2026-08-04T00:00:00Z</updated></entry></feed>`;
    const r = parseFeed(xml);
    expect(r.format).toBe("atom");
    expect(r.items[0].link).toBe("https://b.example.com/2");
    expect(r.items[0].title).toBe("B社が増配");
  });

  it("parses RSS 1.0 / RDF", () => {
    const xml = `<?xml version="1.0"?><rdf:RDF xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#"
      xmlns:dc="http://purl.org/dc/elements/1.1/"><channel><title>S</title></channel>
      <item rdf:about="https://c.example.com/3"><title>C社が自社株買い</title>
      <link>https://c.example.com/3</link><description>概要C</description>
      <dc:date>2026-08-04T09:00:00+09:00</dc:date></item></rdf:RDF>`;
    const r = parseFeed(xml);
    expect(r.format).toBe("rdf");
    expect(r.items[0].link).toBe("https://c.example.com/3");
    expect(r.items[0].publishedAt).toBe("2026-08-04T00:00:00.000Z");
  });

  it("returns an empty result for unknown formats instead of throwing", () => {
    expect(parseFeed("<html><body>not a feed</body></html>").items).toEqual([]);
    expect(parseFeed("").format).toBe("unknown");
  });

  it("keeps going when a feed omits optional fields", () => {
    const xml = `<?xml version="1.0"?><rss version="2.0"><channel>
      <item><title>タイトルのみ</title><link>https://d.example.com/4</link></item></channel></rss>`;
    const r = parseFeed(xml);
    expect(r.items[0].summary).toBe("");
    expect(r.items[0].publishedAt).toBeNull();
  });
});

describe("parseDate", () => {
  it("handles RFC822 and ISO8601 with explicit timezones", () => {
    expect(parseDate("Mon, 04 Aug 2026 06:30:00 +0900")).toBe("2026-08-03T21:30:00.000Z");
    expect(parseDate("2026-08-04T00:00:00Z")).toBe("2026-08-04T00:00:00.000Z");
  });

  it("interprets timezone-less dates as JST so results do not depend on the build machine", () => {
    // ローカル時刻として解釈すると開発機(JST)とCI(UTC)で結果がずれるため、明示的にJSTとして扱う
    expect(parseDate("2026-08-04 09:00:00")).toBe("2026-08-04T00:00:00.000Z");
    expect(parseDate("2026-08-04")).toBe("2026-08-03T15:00:00.000Z");
  });

  it("returns null for unparsable values", () => {
    expect(parseDate("")).toBeNull();
    expect(parseDate("不明")).toBeNull();
  });
});
