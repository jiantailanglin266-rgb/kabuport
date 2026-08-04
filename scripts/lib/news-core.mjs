// ニュース処理の中核ロジック（純関数）。ユニットテスト対象。
// RSSは外部入力として扱い、必ず検証・サニタイズ・正規化を通す。

import { createHash } from "node:crypto";

// ============================================================
// セキュリティ: SSRF対策・プロトコル制限
// ============================================================

const ALLOWED_PROTOCOLS = new Set(["http:", "https:"]);

/** プライベート/リンクローカル/メタデータサービス等の危険なホストを判定する。 */
export function isBlockedHost(hostname) {
  const h = String(hostname || "").toLowerCase().replace(/^\[|\]$/g, "");
  if (!h) return true;
  if (h === "localhost" || h.endsWith(".localhost") || h.endsWith(".local") || h.endsWith(".internal")) return true;

  // IPv6 ループバック/リンクローカル/ユニークローカル
  if (h === "::1" || h === "::" || h.startsWith("fe80:") || h.startsWith("fc") || h.startsWith("fd")) return true;

  // IPv4
  const m = /^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/.exec(h);
  if (m) {
    const [a, b] = [Number(m[1]), Number(m[2])];
    if ([a, Number(m[2]), Number(m[3]), Number(m[4])].some((n) => n > 255)) return true;
    if (a === 0 || a === 10 || a === 127) return true; // 0.0.0.0/8, 10/8, loopback
    if (a === 169 && b === 254) return true; // リンクローカル + クラウドメタデータ(169.254.169.254)
    if (a === 172 && b >= 16 && b <= 31) return true; // 172.16/12
    if (a === 192 && b === 168) return true; // 192.168/16
    if (a === 100 && b >= 64 && b <= 127) return true; // CGNAT
    if (a >= 224) return true; // マルチキャスト/予約
  }
  // クラウドのメタデータ用ホスト名
  if (h === "metadata.google.internal" || h === "metadata" || h === "instance-data") return true;
  return false;
}

/** フィードURLとして安全かを判定する。 */
export function isSafeFeedUrl(raw) {
  let u;
  try {
    u = new URL(String(raw));
  } catch {
    return false;
  }
  if (!ALLOWED_PROTOCOLS.has(u.protocol)) return false; // file:, ftp:, gopher: 等を拒否
  if (isBlockedHost(u.hostname)) return false;
  if (u.username || u.password) return false; // 認証情報付きURLは拒否
  return true;
}

// ============================================================
// サニタイズ
// ============================================================

const BLOCK_TAGS = ["script", "style", "iframe", "object", "embed", "form", "svg", "math", "link", "meta"];

/**
 * RSSの概要HTMLからテキストを安全に取り出す。
 * 記事全文の転載を避けるため、既定で概要を切り詰める。
 */
export function sanitizeSummary(html, maxLength = 220) {
  let s = String(html ?? "");
  for (const tag of BLOCK_TAGS) {
    s = s.replace(new RegExp(`<${tag}\\b[\\s\\S]*?<\\/${tag}>`, "gi"), " ");
    s = s.replace(new RegExp(`<${tag}\\b[^>]*\\/?>`, "gi"), " ");
  }
  s = s.replace(/\son\w+\s*=\s*(".*?"|'.*?'|[^\s>]+)/gi, ""); // イベントハンドラ除去
  s = s.replace(/javascript:/gi, "");
  s = s.replace(/<[^>]*>/g, " "); // 残りのタグを除去（プレーンテキスト化）
  s = s
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#0?39;|&apos;/g, "'");
  s = s.replace(/\s+/g, " ").trim();
  if (s.length > maxLength) s = `${s.slice(0, maxLength).trim()}…`;
  return s;
}

/** 画像URLとして安全なものだけを通す。 */
export function safeImageUrl(raw) {
  if (!raw) return null;
  try {
    const u = new URL(String(raw));
    if (!ALLOWED_PROTOCOLS.has(u.protocol)) return null;
    if (isBlockedHost(u.hostname)) return null;
    return u.toString();
  } catch {
    return null;
  }
}

// ============================================================
// URL正規化・ハッシュ
// ============================================================

const TRACKING_PARAMS = /^(utm_|fbclid|gclid|yclid|mc_|ref|ref_src|cmpid|icid|spm|from|share|__twitter)/i;

/** 追跡パラメータ・フラグメント・末尾スラッシュを取り除いた正規URL。 */
export function normalizeNewsUrl(raw) {
  try {
    const u = new URL(String(raw));
    if (!ALLOWED_PROTOCOLS.has(u.protocol)) return null;
    u.hash = "";
    u.protocol = "https:"; // httpとhttpsの重複を同一視する
    u.hostname = u.hostname.toLowerCase().replace(/^www\./, "");
    const keep = [...u.searchParams.entries()].filter(([k]) => !TRACKING_PARAMS.test(k));
    u.search = "";
    for (const [k, v] of keep.sort(([a], [b]) => a.localeCompare(b))) u.searchParams.append(k, v);
    if (u.pathname.length > 1 && u.pathname.endsWith("/")) u.pathname = u.pathname.replace(/\/+$/, "");
    return u.toString();
  } catch {
    return null;
  }
}

export function sha256(text) {
  return createHash("sha256").update(String(text ?? ""), "utf8").digest("hex");
}

export function urlHash(url) {
  const n = normalizeNewsUrl(url);
  return n ? sha256(n) : null;
}

export function contentHash(title, summary) {
  return sha256(`${normalizeTitle(title)}|${sanitizeSummary(summary, 200)}`);
}

// ============================================================
// タイトル正規化・重複判定
// ============================================================

/** 全角/半角・記号・速報表記・配信元名を落とした比較用タイトル。 */
export function normalizeTitle(title, sourceName = "") {
  let s = String(title ?? "");
  // 全角英数字→半角
  s = s.replace(/[Ａ-Ｚａ-ｚ０-９]/g, (c) => String.fromCharCode(c.charCodeAt(0) - 0xfee0));
  s = s.toLowerCase();
  if (sourceName) s = s.split(String(sourceName).toLowerCase()).join(" ");
  // 速報・更新などの接頭辞
  s = s.replace(/[【\[(（<]?\s*(速報|独自|更新|訂正|再送|ライブ|breaking|update|exclusive)\s*[】\])）>]?/gi, " ");
  s = s.replace(/[|｜\-−–—:：・､、,，.．。!！?？"'"'"`~^*_/\\()（）\[\]【】<>《》]/g, " ");
  s = s.replace(/\s+/g, " ").trim();
  return s;
}

/**
 * 文字バイグラムの集合を作る。
 * 日本語は語が空白で区切られないため、単語分割ではなく文字N-gramで比較する。
 */
function bigrams(text) {
  const s = String(text ?? "").replace(/\s+/g, "");
  const set = new Set();
  if (s.length === 0) return set;
  if (s.length === 1) return new Set([s]);
  for (let i = 0; i < s.length - 1; i++) set.add(s.slice(i, i + 2));
  return set;
}

/** 2つのタイトルの類似度（0-1）。文字バイグラム集合のJaccard係数。 */
export function titleSimilarity(a, b) {
  const ta = bigrams(normalizeTitle(a));
  const tb = bigrams(normalizeTitle(b));
  if (ta.size === 0 || tb.size === 0) return 0;
  let inter = 0;
  for (const t of ta) if (tb.has(t)) inter++;
  return inter / (ta.size + tb.size - inter);
}

/**
 * 既存記事の中から重複を探す。判定順序は仕様どおり。
 * @returns {{article:object, reason:string}|null}
 */
/**
 * 関連銘柄が矛盾しないか。
 * 「A社が上方修正」と「B社が上方修正」はタイトルが酷似するため、
 * 銘柄が食い違う場合は重複と見なしてはならない（別会社のニュースの統合を防ぐ）。
 */
function companiesCompatible(a, b) {
  const ca = new Set((a.companies ?? []).map((c) => c.code));
  const cb = new Set((b.companies ?? []).map((c) => c.code));
  if (ca.size === 0 || cb.size === 0) return true; // 判定材料が無い場合は妨げない
  for (const code of ca) if (cb.has(code)) return true;
  return false;
}

export function findDuplicate(candidate, existing, { similarityThreshold = 0.78, hoursWindow = 48 } = {}) {
  const cUrl = normalizeNewsUrl(candidate.originalUrl);
  const cCanonical = normalizeNewsUrl(candidate.canonicalUrl);
  const cUrlHash = candidate.urlHash ?? (cUrl ? sha256(cUrl) : null);
  const cTitle = normalizeTitle(candidate.title, candidate.sourceName);
  const cTime = Date.parse(candidate.publishedAt ?? "") || 0;

  for (const a of existing) {
    if (candidate.externalId && a.externalId && candidate.externalId === a.externalId) {
      return { article: a, reason: "guid" };
    }
    const aUrl = normalizeNewsUrl(a.originalUrl);
    if (cUrl && aUrl && cUrl === aUrl) return { article: a, reason: "url" };

    const aCanonical = normalizeNewsUrl(a.canonicalUrl);
    if (cCanonical && aCanonical && cCanonical === aCanonical) return { article: a, reason: "canonical" };
    if (cCanonical && aUrl && cCanonical === aUrl) return { article: a, reason: "canonical" };

    if (cUrlHash && a.urlHash && cUrlHash === a.urlHash) return { article: a, reason: "url_hash" };

    const aTitle = normalizeTitle(a.title, a.sourceName);
    if (cTitle && aTitle && cTitle === aTitle) return { article: a, reason: "title" };

    if (candidate.contentHash && a.contentHash && candidate.contentHash === a.contentHash) {
      return { article: a, reason: "content_hash" };
    }

    // タイトル類似 + 公開日時が近い + 関連銘柄が矛盾しない
    const aTime = Date.parse(a.publishedAt ?? "") || 0;
    if (cTime && aTime && Math.abs(cTime - aTime) <= hoursWindow * 3600_000) {
      if (titleSimilarity(candidate.title, a.title) >= similarityThreshold && companiesCompatible(candidate, a)) {
        return { article: a, reason: "title_similarity" };
      }
    }
  }
  return null;
}

// ============================================================
// カテゴリー分類
// ============================================================

/**
 * タイトル・概要・RSS側カテゴリーからカテゴリーを判定する。
 * @returns {{slug:string, confidence:number}[]} 信頼度の高い順
 */
export function classifyNews(text, keywordMap, rssCategories = []) {
  const haystack = String(text ?? "").toLowerCase();
  const results = [];

  for (const [slug, def] of Object.entries(keywordMap)) {
    let hits = 0;
    for (const kw of def.keywords) {
      if (haystack.includes(String(kw).toLowerCase())) hits++;
    }
    // RSS側のカテゴリー名が一致していれば加点
    const rssHit = rssCategories.some(
      (c) => String(c).toLowerCase().includes(slug) || String(c).includes(def.nameJa),
    );
    if (hits === 0 && !rssHit) continue;

    // ヒット数を 0.45→0.95 に写像し、RSS一致でさらに加点
    const confidence = Math.min(0.95, 0.45 + hits * 0.18 + (rssHit ? 0.25 : 0));
    results.push({ slug, confidence: Math.round(confidence * 100) / 100, weight: def.weight ?? 0 });
  }

  // 信頼度が同点の場合は、より具体的（重みの大きい）カテゴリーを優先する。
  // 例:「業績予想を上方修正」は earnings ではなく guidance を主カテゴリーにする。
  results.sort((a, b) => b.confidence - a.confidence || b.weight - a.weight);
  return results.slice(0, 3).map(({ slug, confidence }) => ({ slug, confidence }));
}

// ============================================================
// 関連企業判定
// ============================================================

/**
 * 企業辞書と照合して関連銘柄を判定する。
 * 一般名詞と衝突しうる短い名称は、証券コードなど強い根拠が無い限り採用しない。
 * @param {{code:string,names:string[],ambiguous?:boolean}[]} dictionary
 */
export function matchCompanies(text, dictionary, { minConfidence = 0.6 } = {}) {
  const raw = String(text ?? "");
  const lower = raw.toLowerCase();
  const out = [];

  for (const entry of dictionary) {
    let best = null;

    // 証券コード（4桁）がタイトル/概要にある場合は最も強い根拠
    const codeRe = new RegExp(`(?:^|[^0-9])${entry.code}(?:[^0-9]|$)`);
    if (codeRe.test(raw)) best = { matchType: "security_code", confidence: 0.95 };

    if (!best) {
      for (const name of entry.names) {
        const n = String(name).toLowerCase();
        if (n.length < 2 || !lower.includes(n)) continue;
        // 短い名称・一般名詞と紛らわしい名称は信頼度を下げる
        const isShort = n.length <= 3;
        const confidence = entry.ambiguous || isShort ? 0.5 : n.length >= 6 ? 0.9 : 0.75;
        const matchType = name === entry.names[0] ? "company_name" : "alias";
        if (!best || confidence > best.confidence) best = { matchType, confidence };
      }
    }

    if (best && best.confidence >= minConfidence) {
      out.push({ code: entry.code, matchType: best.matchType, confidence: best.confidence });
    }
  }

  return out.sort((a, b) => b.confidence - a.confidence);
}

// ============================================================
// 重要度・速報
// ============================================================

/**
 * カテゴリーの重み・関連銘柄・新しさから重要度(0-100)を算出する。
 * 「重要度が高い＝投資価値が高い」ではないことをUIで明示すること。
 */
export function calculateImportance({ categories = [], keywordMap = {}, companyCount = 0, publishedAt, now = Date.now() }) {
  let score = 0;
  for (const c of categories) {
    const def = keywordMap[c.slug];
    if (def) score += def.weight * (c.confidence ?? 1);
  }
  score += Math.min(companyCount, 3) * 4;

  const ts = Date.parse(publishedAt ?? "") || 0;
  if (ts) {
    const hours = (now - ts) / 3600_000;
    if (hours <= 6) score += 12;
    else if (hours <= 24) score += 6;
    else if (hours > 24 * 14) score -= 8;
  }
  return Math.max(0, Math.min(100, Math.round(score)));
}

/** 速報表示は一定時間で自動解除する。 */
export function isBreaking(publishedAt, importance, { windowHours = 6, threshold = 55, now = Date.now() } = {}) {
  const ts = Date.parse(publishedAt ?? "") || 0;
  if (!ts) return false;
  return now - ts <= windowHours * 3600_000 && importance >= threshold;
}

// ============================================================
// slug生成
// ============================================================

/** URL安全なslug。日本語タイトルでも一意になるようハッシュを付与する。 */
export function buildSlug(title, url, publishedAt) {
  const date = (String(publishedAt ?? "").slice(0, 10) || "undated").replace(/-/g, "");
  const ascii = normalizeTitle(title)
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .slice(0, 40)
    .replace(/^-+|-+$/g, "");
  const short = (urlHash(url) ?? sha256(title)).slice(0, 8);
  return [date, ascii || "news", short].filter(Boolean).join("-");
}
