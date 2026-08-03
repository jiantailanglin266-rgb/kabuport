// J-Quants: 日足株価を取得し .data-cache/ へ保存。
// 差分取得: 前回取得済みの最終営業日以降のみを取得する（全履歴を毎回取らない）。
// 無料プランは12週間遅延のため freshness は delayed_12weeks を既定とする。

import { getIdToken, jqGet, jquantsConfigured, toSiteCode, logSafe } from "./lib/jquants.mjs";
import { cachePath, nowIso, readJson, writeJsonSafe } from "./lib/dataset.mjs";

const OUT = cachePath("jquants", "prices.json");
const FRESHNESS = process.env.JQUANTS_PLAN === "premium" ? "end_of_day" : "delayed_12weeks";
/** 初回に遡る日数（分割取得の起点）。 */
const INITIAL_LOOKBACK_DAYS = Number(process.env.JQUANTS_LOOKBACK_DAYS || "400");

const ymd = (d) => d.toISOString().slice(0, 10);

function num(v) {
  if (v === null || v === undefined || v === "") return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

function normalize(row, fetchedAt) {
  return {
    code: toSiteCode(row.Code),
    tradingDate: row.Date ?? "",
    open: num(row.Open),
    high: num(row.High),
    low: num(row.Low),
    close: num(row.Close),
    previousClose: null, // 後段の build で前営業日終値から算出
    change: null,
    changePercent: null,
    volume: num(row.Volume),
    turnoverValue: num(row.TurnoverValue),
    adjustmentFactor: num(row.AdjustmentFactor),
    source: "J-Quants API",
    fetchedAt,
    freshness: FRESHNESS,
  };
}

async function main() {
  if (!jquantsConfigured()) {
    logSafe("認証情報が未設定のため日足株価の取得をスキップしました（既存キャッシュを維持）。");
    return;
  }

  let idToken;
  try {
    idToken = await getIdToken();
  } catch (e) {
    logSafe(`認証に失敗しました: ${e.message}（既存キャッシュを維持）`);
    return;
  }
  if (!idToken) return;

  const existing = readJson(OUT, { prices: [] });
  const existingPrices = Array.isArray(existing.prices) ? existing.prices : [];

  // 差分取得の起点: 既存データの最終取引日の翌日。無ければ INITIAL_LOOKBACK_DAYS 前。
  const lastDate = existingPrices.reduce((max, p) => (p.tradingDate > max ? p.tradingDate : max), "");
  const from = lastDate
    ? ymd(new Date(new Date(lastDate).getTime() + 86400000))
    : ymd(new Date(Date.now() - INITIAL_LOOKBACK_DAYS * 86400000));
  const to = ymd(new Date());

  if (from > to) {
    logSafe(`差分なし（最終取引日 ${lastDate}）。既存キャッシュを維持します。`);
    return;
  }

  logSafe(`日足株価を取得: ${from} 〜 ${to}`);
  const fetchedAt = nowIso();
  const rows = await jqGet(`/prices/daily_quotes?from=${from}&to=${to}`, idToken, {
    key: "daily_quotes",
    label: "prices/daily_quotes",
    maxPages: 200,
  });

  const fresh = rows.map((r) => normalize(r, fetchedAt)).filter((p) => p.code && p.tradingDate && p.close !== null);
  if (fresh.length === 0) {
    logSafe("新規データ0件。既存キャッシュを維持します。");
    return;
  }

  // 既存 + 新規をマージ（同一 code+date は新しい方を採用）
  const map = new Map();
  for (const p of existingPrices) map.set(`${p.code}:${p.tradingDate}`, p);
  for (const p of fresh) map.set(`${p.code}:${p.tradingDate}`, p);
  const merged = [...map.values()].sort((a, b) =>
    a.code === b.code ? a.tradingDate.localeCompare(b.tradingDate) : a.code.localeCompare(b.code),
  );

  logSafe(`新規 ${fresh.length}件 / 合計 ${merged.length}件`);
  writeJsonSafe(
    OUT,
    { fetchedAt, source: "J-Quants API", freshness: FRESHNESS, count: merged.length, prices: merged },
    { label: "prices" },
  );
}

main().catch((e) => {
  console.error("[jquants] prices 予期せぬエラー:", e.message);
  process.exit(0);
});
