// デモ用ニュースデータを決定的に生成する。
// 実在企業の架空ニュースを作らないため、企業はすべて架空（証券コード9001-9010）。
// 生成物には必ず isDemo:true を付け、画面上でも「デモデータ」と表示する。

import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import {
  buildSlug, calculateImportance, classifyNews, contentHash, isBreaking, matchCompanies, urlHash,
} from "./lib/news-core.mjs";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const KEYWORDS = JSON.parse(readFileSync(join(ROOT, "src/data/news-category-keywords.json"), "utf8"));
const OUT = join(ROOT, "src/data/demo-news.json");

/** 生成の基準時刻（決定的にするため固定）。 */
const BASE = Date.parse("2026-08-04T09:00:00+09:00");
const iso = (hoursAgo) => new Date(BASE - hoursAgo * 3600_000).toISOString();

const SOURCES = [
  { id: "demo-market", name: "サンプル市況ニュース", slug: "demo-market", siteUrl: "https://example.com/market", priority: 90, trustLevel: 3 },
  { id: "demo-company", name: "サンプル企業ニュース", slug: "demo-company", siteUrl: "https://example.com/company", priority: 80, trustLevel: 3 },
  { id: "demo-economy", name: "サンプル経済ニュース", slug: "demo-economy", siteUrl: "https://example.com/economy", priority: 70, trustLevel: 3 },
  { id: "demo-disclosure", name: "サンプル適時開示", slug: "demo-disclosure", siteUrl: "https://example.com/disclosure", priority: 95, trustLevel: 4 },
  { id: "demo-global", name: "サンプル海外市場ニュース", slug: "demo-global", siteUrl: "https://example.com/global", priority: 60, trustLevel: 3 },
].map((s) => ({
  ...s,
  feedUrl: `${s.siteUrl}/rss.xml`,
  language: "ja",
  isActive: true,
  fetchIntervalMinutes: 30,
  imageUsageAllowed: false,
  commercialUseAllowed: false,
  termsNote: "デモ用のサンプル配信元です。実在の配信元ではありません。",
  consecutiveErrors: 0,
  lastFetchedAt: iso(0.2),
  lastSuccessAt: iso(0.2),
}));

/** 架空企業（実在企業の架空ニュースを作らないため） */
const COMPANIES = [
  { code: "9001", name: "サンプル・テクノロジーズ", names: ["サンプル・テクノロジーズ", "サンプルテクノロジーズ"] },
  { code: "9002", name: "サンプル・ヘルスケア", names: ["サンプル・ヘルスケア", "サンプルヘルスケア"] },
  { code: "9003", name: "サンプル物流システム", names: ["サンプル物流システム", "サンプル物流"] },
  { code: "9004", name: "サンプル・フィナンシャル", names: ["サンプル・フィナンシャル", "サンプルフィナンシャル"] },
  { code: "9005", name: "サンプル環境エナジー", names: ["サンプル環境エナジー", "サンプル環境"] },
  { code: "9006", name: "サンプル精密機器", names: ["サンプル精密機器", "サンプル精密"] },
  { code: "9007", name: "サンプル商事", names: ["サンプル商事"] },
  { code: "9008", name: "サンプル食品", names: ["サンプル食品"] },
  { code: "9009", name: "サンプル電子", names: ["サンプル電子"] },
  { code: "9010", name: "サンプル建設", names: ["サンプル建設"] },
];

/** 記事テンプレート（架空企業＋一般的な事象） */
const TEMPLATES = [
  { t: "{C}、2027年3月期の業績予想を上方修正 営業利益は従来予想を上回る見通し", s: "{C}は通期の売上高および営業利益の予想を修正したと発表しました。詳細は配信元の記事をご確認ください。", src: "demo-disclosure", hours: 1 },
  { t: "{C}、期末配当を増配へ 年間配当は前期比で増加", s: "{C}は剰余金の配当について、期末配当予想の修正を発表しました。", src: "demo-disclosure", hours: 2 },
  { t: "{C}、自己株式の取得を決議 取得上限は発行済株式総数の一定割合", s: "{C}は自己株式の取得に係る事項について決議したと発表しました。", src: "demo-disclosure", hours: 3 },
  { t: "{C}、株式分割を実施へ 投資単位の引き下げが目的", s: "{C}は株式分割および定款の一部変更について発表しました。", src: "demo-disclosure", hours: 5 },
  { t: "{C}、株主優待制度を新設 長期保有者向けの優遇も", s: "{C}は株主優待制度の新設について発表しました。内容は変更される可能性があります。", src: "demo-company", hours: 7 },
  { t: "{C}に対する公開買付け（TOB）を開始 完全子会社化を目指す", s: "{C}に対する公開買付けの開始が発表されました。詳細は配信元をご確認ください。", src: "demo-disclosure", hours: 9 },
  { t: "{C}、同業他社との資本業務提携を発表 事業領域の拡大へ", s: "{C}は資本業務提携について発表しました。", src: "demo-company", hours: 11 },
  { t: "{C}の第1四半期決算、営業利益は前年同期比で増益", s: "{C}の四半期決算が発表されました。会社予想との比較は配信元記事をご確認ください。", src: "demo-company", hours: 13 },
  { t: "{C}、通期の業績予想を下方修正 原材料価格の影響", s: "{C}は業績予想の修正について発表しました。", src: "demo-disclosure", hours: 16 },
  { t: "{C}株が年初来高値を更新 好決算を受けた買いが継続", s: "{C}の株価が年初来高値を更新しました。株価は変動します。", src: "demo-market", hours: 18 },
  { t: "{C}、新規上場（IPO）を申請 グロース市場への上場を目指す", s: "{C}の新規上場が承認されたと発表されました。", src: "demo-company", hours: 20 },
  { t: "{C}、決算説明会で中期経営計画の進捗を説明", s: "{C}は決算説明会を開催し、事業方針について説明しました。", src: "demo-company", hours: 23 },
  { t: "日経平均は続伸、輸出関連が上げ主導 売買代金は前日を上回る", s: "東京株式市場では主要輸出関連が買われ、指数は上昇しました。", src: "demo-market", hours: 4 },
  { t: "東証プライムの売買代金が増加 決算発表シーズンで商いが膨らむ", s: "決算発表が集中する時期を迎え、売買代金が増加しています。", src: "demo-market", hours: 6 },
  { t: "TOPIXは小幅安、銀行株が軟調 金利動向を意識した動き", s: "TOPIXは小幅に下落しました。セクター別では銀行株が軟調でした。", src: "demo-market", hours: 8 },
  { t: "東証グロース市場指数が反発 中小型株に見直し買い", s: "グロース市場の指数は反発しました。", src: "demo-market", hours: 12 },
  { t: "日銀、金融政策決定会合で現状維持を決定 今後の政策運営に注目", s: "日本銀行は金融政策決定会合の結果を公表しました。", src: "demo-economy", hours: 10 },
  { t: "国内の消費者物価指数（CPI）が公表 前年同月比の伸びは横ばい", s: "総務省が消費者物価指数を公表しました。", src: "demo-economy", hours: 14 },
  { t: "長期金利が上昇 国債利回りの動向が株式市場にも波及", s: "長期金利の上昇を受け、金利敏感セクターに影響が及びました。", src: "demo-economy", hours: 15 },
  { t: "為替は円安方向で推移 ドル円は前日比で上昇", s: "外国為替市場ではドル円が上昇しました。為替は変動します。", src: "demo-economy", hours: 17 },
  { t: "日銀短観、大企業製造業の業況判断は小幅改善", s: "日本銀行が全国企業短期経済観測調査を公表しました。", src: "demo-economy", hours: 26 },
  { t: "NYダウは反発、ハイテク株中心に買い戻し", s: "米国市場では主要指数が上昇しました。", src: "demo-global", hours: 19 },
  { t: "NASDAQ総合が下落 金利上昇を嫌気した売り", s: "米国のハイテク株中心の指数は下落しました。", src: "demo-global", hours: 21 },
  { t: "FOMCの結果を受け海外市場が変動 日本株への影響に関心", s: "米連邦公開市場委員会の結果が公表されました。", src: "demo-global", hours: 24 },
  { t: "国内ETFの純資産残高が増加 新NISAの資金流入が継続", s: "上場投資信託（ETF）の残高が増加しています。", src: "demo-market", hours: 28 },
  { t: "J-REIT指数が上昇 分配金利回りに着目した買い", s: "不動産投資信託（REIT）の指数が上昇しました。", src: "demo-market", hours: 30 },
  { t: "投資信託の資金流入が続く つみたて投資枠の利用が拡大", s: "投資信託への資金流入が継続しています。", src: "demo-economy", hours: 32 },
  { t: "{C}、有価証券報告書の訂正報告書を提出", s: "{C}は訂正報告書の提出について公表しました。", src: "demo-disclosure", hours: 34 },
  { t: "{C}が上場廃止基準に抵触するおそれ 監理銘柄に指定", s: "{C}について監理銘柄への指定が公表されました。", src: "demo-disclosure", hours: 36 },
  { t: "{C}、海外子会社の設立を発表 アジア市場での事業拡大へ", s: "{C}は海外子会社の設立について発表しました。", src: "demo-company", hours: 40 },
];

const dict = COMPANIES.map((c) => ({ code: c.code, names: c.names }));

function build() {
  const articles = [];
  const now = BASE;

  TEMPLATES.forEach((tpl, i) => {
    const company = tpl.t.includes("{C}") ? COMPANIES[i % COMPANIES.length] : null;
    const title = tpl.t.replace(/\{C\}/g, company ? company.name : "");
    const summary = tpl.s.replace(/\{C\}/g, company ? company.name : "");
    const source = SOURCES.find((s) => s.id === tpl.src) ?? SOURCES[0];
    const publishedAt = iso(tpl.hours);
    const url = `${source.siteUrl}/articles/demo-${String(i + 1).padStart(3, "0")}`;

    const searchText = `${title} ${summary}${company ? ` （${company.code}）` : ""}`;
    const categories = classifyNews(searchText, KEYWORDS, []);
    const companies = matchCompanies(searchText, dict);
    const importance = calculateImportance({
      categories,
      keywordMap: KEYWORDS,
      companyCount: companies.length,
      publishedAt,
      now,
    });

    articles.push({
      id: `demo-${String(i + 1).padStart(3, "0")}`,
      sourceId: source.id,
      sourceName: source.name,
      sourceSlug: source.slug,
      externalId: url,
      title,
      slug: buildSlug(title, url, publishedAt),
      summary,
      originalUrl: url,
      canonicalUrl: url,
      imageUrl: null, // 利用条件が確認できない画像は掲載しない
      authorName: null,
      publishedAt,
      externalUpdatedAt: null,
      fetchedAt: iso(0.2),
      language: "ja",
      contentHash: contentHash(title, summary),
      urlHash: urlHash(url),
      importanceScore: importance,
      status: "published",
      isFeatured: false,
      isBreaking: isBreaking(publishedAt, importance, { now }),
      isDuplicate: false,
      duplicateOfId: null,
      isDemo: true,
      categories,
      companies: companies.map((c) => ({
        ...c,
        name: COMPANIES.find((x) => x.code === c.code)?.name ?? c.code,
      })),
    });
  });

  // 重要ニュース5件（重要度の高い順）
  [...articles]
    .sort((a, b) => b.importanceScore - a.importanceScore)
    .slice(0, 5)
    .forEach((a) => {
      articles.find((x) => x.id === a.id).isFeatured = true;
    });

  // 速報2件を確実に用意（直近かつ重要度上位）
  [...articles]
    .filter((a) => Date.parse(a.publishedAt) >= now - 6 * 3600_000)
    .sort((a, b) => b.importanceScore - a.importanceScore)
    .slice(0, 2)
    .forEach((a) => {
      articles.find((x) => x.id === a.id).isBreaking = true;
    });

  // 重複3件（別配信元が同じニュースを報じた想定）
  const dupes = articles.slice(0, 3).map((orig, i) => {
    const source = SOURCES[(i + 2) % SOURCES.length];
    const url = `${source.siteUrl}/articles/demo-dup-${i + 1}`;
    return {
      ...orig,
      id: `demo-dup-${i + 1}`,
      sourceId: source.id,
      sourceName: source.name,
      sourceSlug: source.slug,
      externalId: url,
      originalUrl: url,
      canonicalUrl: orig.canonicalUrl,
      slug: buildSlug(orig.title, url, orig.publishedAt),
      urlHash: urlHash(url),
      isDuplicate: true,
      duplicateOfId: orig.id,
      isFeatured: false,
      isBreaking: false,
    };
  });

  // 取得ログ10件
  const logs = Array.from({ length: 10 }, (_, i) => {
    const source = SOURCES[i % SOURCES.length];
    const failed = i === 7; // 1件は失敗例
    return {
      id: `demo-log-${i + 1}`,
      sourceId: source.id,
      sourceName: source.name,
      startedAt: iso(i * 0.5 + 0.4),
      completedAt: iso(i * 0.5 + 0.35),
      status: failed ? "error" : "success",
      httpStatus: failed ? 503 : 200,
      itemsReceived: failed ? 0 : 12,
      itemsCreated: failed ? 0 : i === 0 ? 3 : 1,
      itemsUpdated: failed ? 0 : 1,
      itemsSkipped: failed ? 0 : 8,
      errorMessage: failed ? "配信元が一時的に応答しませんでした（デモ）" : null,
    };
  });

  return {
    generatedAt: new Date(BASE).toISOString(),
    isDemo: true,
    sources: SOURCES,
    categories: Object.entries(KEYWORDS).map(([slug, def], i) => ({
      slug,
      nameJa: def.nameJa,
      nameEn: def.nameEn,
      sortOrder: i + 1,
      isActive: true,
    })),
    companies: COMPANIES.map((c) => ({ code: c.code, name: c.name })),
    articles: [...articles, ...dupes],
    logs,
  };
}

const data = build();
mkdirSync(dirname(OUT), { recursive: true });
writeFileSync(OUT, JSON.stringify(data, null, 2) + "\n", "utf8");
console.log(
  `[demo-news] 生成: 記事${data.articles.length}件（重複${data.articles.filter((a) => a.isDuplicate).length}件・` +
    `重要${data.articles.filter((a) => a.isFeatured).length}件・速報${data.articles.filter((a) => a.isBreaking).length}件） / ` +
    `配信元${data.sources.length}件 / カテゴリー${data.categories.length}件 / ログ${data.logs.length}件`,
);
