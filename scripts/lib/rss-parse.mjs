// RSS 2.0 / RSS 1.0(RDF) / Atom を共通の形へ正規化する。
// XML外部実体(XXE)は fast-xml-parser が処理しないため、実体展開攻撃の影響を受けない設定で使う。

import { XMLParser } from "fast-xml-parser";
import { sanitizeSummary, safeImageUrl } from "./news-core.mjs";

const parser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: "@",
  trimValues: true,
  parseTagValue: false, // 数値化しない（日付や記号を壊さないため）
  parseAttributeValue: false,
  processEntities: true,
  htmlEntities: true,
});

const first = (v) => (Array.isArray(v) ? v[0] : v);
const asArray = (v) => (v === undefined || v === null ? [] : Array.isArray(v) ? v : [v]);

/** テキスト値の取り出し（{'#text':...} 形式にも対応）。 */
function text(v) {
  const x = first(v);
  if (x === undefined || x === null) return "";
  if (typeof x === "string") return x;
  if (typeof x === "object") return String(x["#text"] ?? "");
  return String(x);
}

/** Atomのlinkは配列＋rel属性。alternateを優先して取り出す。 */
function atomLink(link) {
  const links = asArray(link);
  const alt = links.find((l) => (l?.["@rel"] ?? "alternate") === "alternate" && l?.["@href"]);
  const any = links.find((l) => l?.["@href"]);
  const picked = alt ?? any;
  if (picked) return String(picked["@href"]);
  return text(link);
}

/** タイムゾーン指定を含む文字列か（Z / ±hh:mm / GMT / UTC / RFC822の±hhmm）。 */
function hasTimezone(s) {
  return /(?:Z|GMT|UTC|[+-]\d{2}:?\d{2})\s*$/i.test(s) || /\b(?:JST|EST|PST|CET)\b/i.test(s);
}

/**
 * 各種の日付表記をISO8601へ。解釈できない場合はnull。
 *
 * タイムゾーン指定の無い文字列は、実行環境のローカル時刻として解釈されると
 * 実行マシンごとに結果が変わってしまう（開発環境=JST / CI=UTC）。
 * 配信元は日本のニュースを想定しているため、明示的に JST(+09:00) として扱う。
 */
export function parseDate(value) {
  const s = String(value ?? "").trim();
  if (!s) return null;

  if (!hasTimezone(s)) {
    // "2026-08-04 09:00:00" / "2026-08-04T09:00:00" 形式を JST として解釈
    const m = /^(\d{4})[-/](\d{1,2})[-/](\d{1,2})(?:[T ](\d{1,2}):(\d{2})(?::(\d{2}))?)?$/.exec(s);
    if (m) {
      const iso = `${m[1]}-${String(m[2]).padStart(2, "0")}-${String(m[3]).padStart(2, "0")}T${String(m[4] ?? "0").padStart(2, "0")}:${m[5] ?? "00"}:${m[6] ?? "00"}+09:00`;
      const t = Date.parse(iso);
      if (!Number.isNaN(t)) return new Date(t).toISOString();
    }
  }

  const t = Date.parse(s);
  if (!Number.isNaN(t)) return new Date(t).toISOString();
  // "2026-08-04 15:30:00" のような表記
  const m = /^(\d{4})[-/](\d{1,2})[-/](\d{1,2})[T ]?(\d{1,2})?:?(\d{2})?:?(\d{2})?/.exec(s);
  if (m) {
    const d = new Date(
      Date.UTC(Number(m[1]), Number(m[2]) - 1, Number(m[3]), Number(m[4] ?? 0), Number(m[5] ?? 0), Number(m[6] ?? 0)),
    );
    if (!Number.isNaN(d.getTime())) return d.toISOString();
  }
  return null;
}

/** 画像URLを enclosure / media:content / media:thumbnail / content内のimg から探す。 */
function extractImage(item) {
  const candidates = [
    first(item.enclosure)?.["@url"],
    first(item["media:content"])?.["@url"],
    first(item["media:thumbnail"])?.["@url"],
    first(item["itunes:image"])?.["@href"],
  ];
  for (const c of candidates) {
    const safe = safeImageUrl(c);
    if (safe) return safe;
  }
  // description内の最初のimg
  const html = text(item["content:encoded"]) || text(item.description) || text(item.summary);
  const m = /<img[^>]+src\s*=\s*["']([^"']+)["']/i.exec(html);
  if (m) return safeImageUrl(m[1]);
  return null;
}

function categoriesOf(item) {
  return asArray(item.category)
    .map((c) => (typeof c === "object" ? String(c["#text"] ?? c["@term"] ?? "") : String(c)))
    .map((s) => s.trim())
    .filter(Boolean)
    .slice(0, 8);
}

/** 共通アイテム形式へ正規化 */
function toItem(raw) {
  return {
    externalId: raw.externalId || raw.link || null,
    title: sanitizeSummary(raw.title, 300),
    link: raw.link || "",
    canonicalUrl: raw.canonicalUrl || null,
    summary: sanitizeSummary(raw.summary, 220),
    publishedAt: raw.publishedAt,
    updatedAt: raw.updatedAt ?? null,
    author: raw.author ? sanitizeSummary(raw.author, 60) : null,
    categories: raw.categories ?? [],
    imageUrl: raw.imageUrl ?? null,
  };
}

/**
 * XML文字列をパースして共通形式のアイテム配列を返す。
 * 形式判別: Atom(feed) / RDF(rdf:RDF) / RSS2(rss)
 * @returns {{format:string, feedTitle:string, items:object[]}}
 */
export function parseFeed(xml) {
  const doc = parser.parse(String(xml ?? ""));

  // --- Atom ---
  if (doc.feed) {
    const feed = doc.feed;
    const entries = asArray(feed.entry);
    return {
      format: "atom",
      feedTitle: text(feed.title),
      items: entries.map((e) =>
        toItem({
          externalId: text(e.id) || atomLink(e.link),
          title: text(e.title),
          link: atomLink(e.link),
          summary: text(e.summary) || text(e.content),
          publishedAt: parseDate(text(e.published) || text(e.updated)),
          updatedAt: parseDate(text(e.updated)),
          author: text(first(e.author)?.name ?? e.author),
          categories: categoriesOf(e),
          imageUrl: extractImage(e),
        }),
      ),
    };
  }

  // --- RSS 1.0 / RDF ---
  if (doc["rdf:RDF"]) {
    const rdf = doc["rdf:RDF"];
    const channel = first(rdf.channel) ?? {};
    const items = asArray(rdf.item);
    return {
      format: "rdf",
      feedTitle: text(channel.title),
      items: items.map((i) =>
        toItem({
          externalId: i["@rdf:about"] || text(i.link),
          title: text(i.title),
          link: text(i.link) || String(i["@rdf:about"] ?? ""),
          summary: text(i.description),
          publishedAt: parseDate(text(i["dc:date"]) || text(i.date)),
          author: text(i["dc:creator"]),
          categories: categoriesOf(i),
          imageUrl: extractImage(i),
        }),
      ),
    };
  }

  // --- RSS 2.0 ---
  if (doc.rss) {
    const channel = first(doc.rss.channel) ?? {};
    const items = asArray(channel.item);
    return {
      format: "rss2",
      feedTitle: text(channel.title),
      items: items.map((i) => {
        const guidRaw = first(i.guid);
        const guid = typeof guidRaw === "object" ? String(guidRaw["#text"] ?? "") : String(guidRaw ?? "");
        return toItem({
          externalId: guid || text(i.link),
          title: text(i.title),
          link: text(i.link) || (guid.startsWith("http") ? guid : ""),
          summary: text(i.description) || text(i["content:encoded"]),
          publishedAt: parseDate(text(i.pubDate) || text(i["dc:date"])),
          author: text(i.author) || text(i["dc:creator"]),
          categories: categoriesOf(i),
          imageUrl: extractImage(i),
        });
      }),
    };
  }

  return { format: "unknown", feedTitle: "", items: [] };
}
