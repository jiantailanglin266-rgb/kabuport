// RSS取得パイプライン（GitHub Actionsから実行。ブラウザ側では実行しない）。
//
// 取得 → 解析 → 検証 → サニタイズ → URL正規化 → 重複判定 → 分類 →
// 関連企業判定 → 保存 → 取得ログ記録
//
// 配信元が未設定の場合はデモデータを公開データセットへ書き出す（画面は常に動く）。
// 取得に失敗しても既存の保存済みニュースは削除しない。

import { readFileSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { parseFeed } from "./lib/rss-parse.mjs";
import { getRssSources } from "./lib/rss-sources.mjs";
import {
  buildSlug, calculateImportance, classifyNews, contentHash, findDuplicate, isBreaking,
  isSafeFeedUrl, matchCompanies, normalizeNewsUrl, sanitizeSummary, urlHash,
} from "./lib/news-core.mjs";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const OUT_DIR = join(ROOT, "public", "data", "news");
const KEYWORDS = JSON.parse(readFileSync(join(ROOT, "src/data/news-category-keywords.json"), "utf8"));

// --- セキュリティ上の制限値 ---
const TIMEOUT_MS = Number(process.env.RSS_TIMEOUT_MS || "15000");
const MAX_BYTES = Number(process.env.RSS_MAX_BYTES || String(3 * 1024 * 1024)); // 3MB
const MAX_ITEMS_PER_FEED = Number(process.env.RSS_MAX_ITEMS || "50");
const MAX_REDIRECTS = 3;
const MAX_ARTICLES = Number(process.env.RSS_MAX_ARTICLES || "600");
const ERROR_PAUSE_THRESHOLD = 5; // 連続エラーがこの回数を超えたら一時停止

const log = (...a) => console.log("[rss]", ...a);
const readJson = (p, fb) => {
  try {
    return JSON.parse(readFileSync(p, "utf8"));
  } catch {
    return fb;
  }
};

/** 企業辞書（サイト掲載中の銘柄 + デモ企業）。 */
function buildCompanyDictionary() {
  const companies = readJson(join(ROOT, "src/data/companies.json"), []);
  const dict = companies.map((c) => ({
    code: c.code,
    names: [c.nameJa, c.nameEn, c.nameKana].filter(Boolean),
  }));
  const demo = readJson(join(ROOT, "src/data/demo-news.json"), { companies: [] });
  for (const c of demo.companies ?? []) dict.push({ code: c.code, names: [c.name] });
  return dict;
}

/**
 * リダイレクト回数・サイズ・タイムアウトを制限してフィードを取得する。
 * 各ホップで毎回 SSRF 検証を行う（リダイレクト先が内部ネットワークになる攻撃を防ぐ）。
 */
async function safeFetchFeed(feedUrl) {
  let url = feedUrl;
  for (let hop = 0; hop <= MAX_REDIRECTS; hop++) {
    if (!isSafeFeedUrl(url)) throw new Error(`安全でないURLへのアクセスを拒否しました (hop ${hop})`);

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
    let res;
    try {
      res = await fetch(url, {
        redirect: "manual", // リダイレクトを自前で検証する
        signal: controller.signal,
        headers: { "User-Agent": "KABUPORT-RSS/1.0", Accept: "application/rss+xml, application/atom+xml, application/xml, text/xml" },
      });
    } finally {
      clearTimeout(timer);
    }

    if ([301, 302, 303, 307, 308].includes(res.status)) {
      const loc = res.headers.get("location");
      if (!loc) throw new Error(`リダイレクト先が不明です (HTTP ${res.status})`);
      url = new URL(loc, url).toString();
      continue;
    }

    if (!res.ok) {
      const err = new Error(`HTTP ${res.status}`);
      err.httpStatus = res.status;
      throw err;
    }

    const len = Number(res.headers.get("content-length") || "0");
    if (len && len > MAX_BYTES) throw new Error(`レスポンスが大きすぎます (${len} bytes)`);

    const buf = Buffer.from(await res.arrayBuffer());
    if (buf.length > MAX_BYTES) throw new Error(`レスポンスが大きすぎます (${buf.length} bytes)`);

    // 文字コード正規化（charset指定があればそれに従う）
    const ctype = res.headers.get("content-type") ?? "";
    const m = /charset=["']?([\w-]+)/i.exec(ctype);
    const charset = (m?.[1] ?? "utf-8").toLowerCase();
    let xml;
    try {
      xml = new TextDecoder(charset).decode(buf);
    } catch {
      xml = buf.toString("utf8");
    }
    return { xml, httpStatus: res.status };
  }
  throw new Error("リダイレクト回数の上限を超えました");
}

/** 1件のRSSアイテムを記事レコードへ変換する（検証に失敗したらnull）。 */
function toArticle(item, source, dict, now) {
  const title = sanitizeSummary(item.title, 300);
  const link = normalizeNewsUrl(item.link);
  if (!title || !link) return null; // タイトルとURLが無い記事は採用しない

  const summary = sanitizeSummary(item.summary, 220);
  const publishedAt = item.publishedAt ?? new Date(now).toISOString();
  const searchText = `${title} ${summary}`;
  const categories = classifyNews(searchText, KEYWORDS, item.categories);
  if (categories.length === 0 && source.defaultCategory) {
    categories.push({ slug: source.defaultCategory, confidence: 0.4 });
  }
  const companies = matchCompanies(searchText, dict);
  const importanceScore = calculateImportance({
    categories, keywordMap: KEYWORDS, companyCount: companies.length, publishedAt, now,
  });

  return {
    id: `${source.id}-${(urlHash(link) ?? "").slice(0, 12)}`,
    sourceId: source.id,
    sourceName: source.name,
    sourceSlug: source.slug,
    externalId: item.externalId ?? link,
    title,
    slug: buildSlug(title, link, publishedAt),
    summary,
    originalUrl: item.link,
    canonicalUrl: item.canonicalUrl ?? link,
    // 画像は配信元の利用条件が確認できている場合のみ保持する
    imageUrl: source.imageUsageAllowed ? item.imageUrl : null,
    authorName: item.author ?? null,
    publishedAt,
    externalUpdatedAt: item.updatedAt ?? null,
    fetchedAt: new Date(now).toISOString(),
    language: source.language ?? "ja",
    contentHash: contentHash(title, summary),
    urlHash: urlHash(link),
    importanceScore,
    status: "published",
    isFeatured: false,
    isBreaking: isBreaking(publishedAt, importanceScore, { now }),
    isDuplicate: false,
    duplicateOfId: null,
    isDemo: false,
    categories,
    companies,
  };
}

async function main() {
  mkdirSync(OUT_DIR, { recursive: true });
  const indexPath = join(OUT_DIR, "index.json");
  const logsPath = join(OUT_DIR, "logs.json");
  const now = Date.now();

  const sources = getRssSources();

  // --- 配信元が未設定: デモデータを配信し、画面は常に動く状態にする ---
  if (sources.length === 0) {
    const demo = readJson(join(ROOT, "src/data/demo-news.json"), null);
    if (!demo) {
      log("配信元が未設定で、デモデータもありません。処理を終了します。");
      return;
    }
    const existing = readJson(indexPath, null);
    if (existing && existing.isDemo === false) {
      log("配信元が未設定のため、既存の取得済みニュースを維持します。");
      return;
    }
    writeFileSync(
      indexPath,
      JSON.stringify(
        {
          generatedAt: new Date(now).toISOString(),
          isDemo: true,
          status: "demo",
          message: "RSS配信元が未設定のため、デモデータを表示しています。",
          sources: demo.sources,
          categories: demo.categories,
          articles: demo.articles,
        },
        null,
        2,
      ) + "\n",
      "utf8",
    );
    writeFileSync(logsPath, JSON.stringify({ generatedAt: new Date(now).toISOString(), isDemo: true, logs: demo.logs }, null, 2) + "\n", "utf8");
    log(`配信元が未設定のためデモデータを書き出しました（記事${demo.articles.length}件）。`);
    return;
  }

  // --- 実フィードの取得 ---
  const prev = readJson(indexPath, { articles: [], sources: [], categories: [] });
  const prevArticles = prev.isDemo ? [] : (prev.articles ?? []);
  const prevLogs = readJson(logsPath, { logs: [] }).logs ?? [];
  const dict = buildCompanyDictionary();

  const kept = [...prevArticles];
  const newLogs = [];
  let anySuccess = false;

  for (const source of sources) {
    const prevSource = (prev.sources ?? []).find((s) => s.id === source.id);
    const consecutiveErrors = prevSource?.consecutiveErrors ?? 0;

    if (consecutiveErrors > ERROR_PAUSE_THRESHOLD) {
      log(`${source.name}: 連続エラー${consecutiveErrors}回のため一時停止中（スキップ）`);
      newLogs.push({
        id: `${source.id}-${now}`, sourceId: source.id, sourceName: source.name,
        startedAt: new Date(now).toISOString(), completedAt: new Date(now).toISOString(),
        status: "paused", httpStatus: null, itemsReceived: 0, itemsCreated: 0, itemsUpdated: 0,
        itemsSkipped: 0, errorMessage: `連続エラー${consecutiveErrors}回のため一時停止`,
      });
      source.consecutiveErrors = consecutiveErrors;
      source.isActive = false;
      continue;
    }

    const startedAt = new Date().toISOString();
    let created = 0, skipped = 0, received = 0, httpStatus = null, errorMessage = null, status = "success";

    try {
      const { xml, httpStatus: hs } = await safeFetchFeed(source.feedUrl);
      httpStatus = hs;
      const parsed = parseFeed(xml);
      const items = parsed.items.slice(0, MAX_ITEMS_PER_FEED);
      received = items.length;
      if (parsed.format === "unknown") throw new Error("対応していないフィード形式です");

      for (const item of items) {
        const article = toArticle(item, source, dict, now);
        if (!article) {
          skipped++;
          continue;
        }
        const dup = findDuplicate({ ...article, sourceName: source.name }, kept);
        if (dup) {
          // 物理削除せず、代表記事へ紐付けて保持する
          article.isDuplicate = true;
          article.duplicateOfId = dup.article.id;
          kept.push(article);
          skipped++;
          continue;
        }
        kept.push(article);
        created++;
      }
      anySuccess = true;
      source.consecutiveErrors = 0;
      source.lastSuccessAt = new Date().toISOString();
      log(`${source.name}: 受信${received} / 新規${created} / 重複・スキップ${skipped}`);
    } catch (e) {
      status = "error";
      errorMessage = String(e.message ?? e).slice(0, 300);
      httpStatus = e.httpStatus ?? httpStatus;
      source.consecutiveErrors = consecutiveErrors + 1;
      source.lastErrorAt = new Date().toISOString();
      log(`${source.name}: 取得失敗 (${errorMessage}) 連続${source.consecutiveErrors}回目`);
    }

    source.lastFetchedAt = new Date().toISOString();
    newLogs.push({
      id: `${source.id}-${now}`, sourceId: source.id, sourceName: source.name,
      startedAt, completedAt: new Date().toISOString(), status, httpStatus,
      itemsReceived: received, itemsCreated: created, itemsUpdated: 0, itemsSkipped: skipped, errorMessage,
    });
  }

  // 全件失敗した場合は既存データを維持する
  if (!anySuccess && prevArticles.length > 0) {
    log("すべての配信元で取得に失敗しました。保存済みニュースを維持します。");
  }

  // 新しい順に整列し、上限を超えた古い記事を落とす
  kept.sort((a, b) => String(b.publishedAt).localeCompare(String(a.publishedAt)));
  const articles = kept.slice(0, MAX_ARTICLES);

  // 重要ニュース: 重複でないもののうち重要度上位
  articles.forEach((a) => (a.isFeatured = false));
  articles
    .filter((a) => !a.isDuplicate)
    .sort((a, b) => b.importanceScore - a.importanceScore)
    .slice(0, 5)
    .forEach((a) => (a.isFeatured = true));
  articles.sort((a, b) => String(b.publishedAt).localeCompare(String(a.publishedAt)));

  const failedSources = newLogs.filter((l) => l.status !== "success").map((l) => l.sourceName);
  writeFileSync(
    indexPath,
    JSON.stringify(
      {
        generatedAt: new Date(now).toISOString(),
        isDemo: false,
        status: failedSources.length === 0 ? "ok" : anySuccess ? "partial" : "error",
        message:
          failedSources.length === 0
            ? null
            : `現在、一部のニュースを取得できません（${failedSources.join(", ")}）。保存済みのニュースを表示しています。`,
        sources,
        categories: Object.entries(KEYWORDS).map(([slug, def], i) => ({
          slug, nameJa: def.nameJa, nameEn: def.nameEn, sortOrder: i + 1, isActive: true,
        })),
        articles,
      },
      null,
      2,
    ) + "\n",
    "utf8",
  );
  writeFileSync(
    logsPath,
    JSON.stringify({ generatedAt: new Date(now).toISOString(), isDemo: false, logs: [...newLogs, ...prevLogs].slice(0, 100) }, null, 2) + "\n",
    "utf8",
  );

  log(`保存: 記事${articles.length}件（新規${newLogs.reduce((s, l) => s + l.itemsCreated, 0)}件）`);
}

main().catch((e) => {
  console.error("[rss] 予期せぬエラー:", e.message);
  process.exit(0); // パイプライン全体は止めない
});
