// データセットの入出力。
//
// 二層構成:
//   .data-cache/      … 取得した生データ（gitignore。私的利用・再配信しない）
//   public/data/      … 公開サイトへ配信するデータセット（規約確認済みの元データのみ）
//
// 取得に失敗しても既存の正常データを削除しない（前回成功データを維持する）。

import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
export const ROOT = join(__dirname, "..", "..");
export const CACHE_DIR = join(ROOT, ".data-cache");
export const PUBLIC_DATA_DIR = join(ROOT, "public", "data");

export function ensureDir(dir) {
  mkdirSync(dir, { recursive: true });
}

export function readJson(path, fallback = null) {
  try {
    if (!existsSync(path)) return fallback;
    return JSON.parse(readFileSync(path, "utf8"));
  } catch {
    return fallback;
  }
}

/** 空データでの上書きを防ぐ。既存が有効なら維持する。 */
export function writeJsonSafe(path, data, { allowEmpty = false, label = path } = {}) {
  const isEmptyArray = Array.isArray(data) && data.length === 0;
  const isEmptyObject = data && typeof data === "object" && !Array.isArray(data) && Object.keys(data).length === 0;
  if (!allowEmpty && (data == null || isEmptyArray || isEmptyObject)) {
    const existing = readJson(path);
    if (existing != null) {
      console.warn(`[dataset] ${label}: 取得0件のため既存データを維持しました`);
      return { written: false, keptExisting: true };
    }
  }
  ensureDir(dirname(path));
  writeFileSync(path, JSON.stringify(data, null, 2) + "\n", "utf8");
  return { written: true, keptExisting: false };
}

export function cachePath(...parts) {
  return join(CACHE_DIR, ...parts);
}

export function publicPath(...parts) {
  return join(PUBLIC_DATA_DIR, ...parts);
}

/**
 * データ元ごとの公開可否ポリシー。
 * 既定は false（＝公開サイトへ出さない）。利用規約で明確に許諾を確認できた場合のみ、
 * 対応する環境変数で明示的に有効化する。推測で true にしないこと。
 */
export function sourcePolicies() {
  return {
    jquants: {
      id: "jquants",
      name: "J-Quants API",
      url: "https://jpx-jquants.com/",
      // 利用規約に「取得データそのものを閲覧可能な形で第三者へ提供・配信する行為」の
      // 制限があるため、既定では公開データセットへ含めない。
      publicRedistributionConfirmed: process.env.JQUANTS_PUBLIC_REDISTRIBUTION === "confirmed",
      note: "無料プランは12週間遅延。公開再配信の可否は要確認（既定では非公開）。",
    },
    edinet: {
      id: "edinet",
      name: "EDINET API v2 (金融庁)",
      url: "https://disclosure2.edinet-fsa.go.jp/",
      publicRedistributionConfirmed: process.env.EDINET_PUBLIC_REDISTRIBUTION === "confirmed",
      note: "書類本文は保存せず、メタデータと公式閲覧URLのみを扱う。公開可否は要確認。",
    },
  };
}

export function nowIso() {
  return new Date().toISOString();
}

/** DatasetMeta を組み立てる。取得失敗時は前回の成功時刻と警告を保持する。 */
export function buildMeta({
  sourceName,
  sourceUrl,
  freshness,
  marketDataDate = null,
  isFallback = false,
  warning = null,
  previous = null,
}) {
  const generatedAt = nowIso();
  return {
    generatedAt,
    lastSuccessfulUpdateAt: isFallback ? previous?.lastSuccessfulUpdateAt ?? previous?.generatedAt ?? null : generatedAt,
    sourceName,
    sourceUrl,
    freshness,
    marketDataDate,
    isFallback,
    warning,
  };
}
