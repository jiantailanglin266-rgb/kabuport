// RSS配信元の設定。
// 実在するフィードURLをコードへ直書きしない。環境変数から読み込み、未設定なら空。
// 各配信元の利用条件（商用利用・画像利用）は既定で「未確認(false)」とし、
// 確認できたものだけを環境変数で許可する。

import { isSafeFeedUrl } from "./news-core.mjs";

/** 環境変数 1件分を RssSource へ。未設定なら null。 */
function fromEnv({ id, name, slug, envKey, defaultCategory, priority = 50, intervalMinutes = 30 }) {
  const feedUrl = process.env[envKey];
  if (!feedUrl) return null;
  if (!isSafeFeedUrl(feedUrl)) {
    console.warn(`[rss] ${envKey} は安全なURLではないためスキップします`);
    return null;
  }
  let siteUrl = "";
  try {
    siteUrl = new URL(feedUrl).origin;
  } catch {
    /* noop */
  }
  const allow = (key) => process.env[key] === "true";
  return {
    id,
    name: process.env[`${envKey}_NAME`] || name,
    slug,
    feedUrl,
    siteUrl: process.env[`${envKey}_SITE`] || siteUrl,
    language: "ja",
    defaultCategory,
    isActive: true,
    fetchIntervalMinutes: intervalMinutes,
    priority,
    trustLevel: Number(process.env[`${envKey}_TRUST`] || "3"),
    // 利用条件は既定で未確認。確認できた場合のみ環境変数で明示的に許可する。
    imageUsageAllowed: allow(`${envKey}_IMAGE_OK`),
    commercialUseAllowed: allow(`${envKey}_COMMERCIAL_OK`),
    termsNote: process.env[`${envKey}_TERMS`] || "利用条件は未確認です。公開前に配信元の規約をご確認ください。",
    consecutiveErrors: 0,
  };
}

/** 設定済みのRSS配信元一覧（環境変数から）。 */
export function getRssSources() {
  const defs = [
    { id: "market-1", name: "市況フィード1", slug: "market-1", envKey: "RSS_FEED_MARKET_1", defaultCategory: "market", priority: 90, intervalMinutes: 20 },
    { id: "market-2", name: "市況フィード2", slug: "market-2", envKey: "RSS_FEED_MARKET_2", defaultCategory: "market", priority: 80, intervalMinutes: 30 },
    { id: "company-1", name: "企業ニュースフィード", slug: "company-1", envKey: "RSS_FEED_COMPANY_1", defaultCategory: "stocks", priority: 70, intervalMinutes: 30 },
    { id: "economy-1", name: "経済フィード", slug: "economy-1", envKey: "RSS_FEED_ECONOMY_1", defaultCategory: "economy", priority: 60, intervalMinutes: 60 },
    { id: "disclosure-1", name: "適時開示フィード", slug: "disclosure-1", envKey: "RSS_FEED_DISCLOSURE_1", defaultCategory: "stocks", priority: 95, intervalMinutes: 20 },
  ];
  return defs.map(fromEnv).filter(Boolean);
}

export function hasConfiguredSources() {
  return getRssSources().length > 0;
}
