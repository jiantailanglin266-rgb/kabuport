// J-Quants: 財務サマリー（決算短信ベース）を取得し .data-cache/ へ保存。
// 銘柄単位ではなく日付単位で取得し、レート制限を抑える。

import { getIdToken, jqGet, jquantsConfigured, toSiteCode, logSafe } from "./lib/jquants.mjs";
import { forEachSequential } from "./lib/http.mjs";
import { cachePath, nowIso, readJson, writeJsonSafe } from "./lib/dataset.mjs";

const OUT = cachePath("jquants", "financials.json");
const LOOKBACK_DAYS = Number(process.env.JQUANTS_FINS_LOOKBACK_DAYS || "120");
const REQUEST_INTERVAL_MS = Number(process.env.JQUANTS_INTERVAL_MS || "250");

const ymd = (d) => d.toISOString().slice(0, 10);
function num(v) {
  if (v === null || v === undefined || v === "") return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

function normalize(row, fetchedAt) {
  return {
    code: toSiteCode(row.LocalCode),
    disclosedDate: row.DisclosedDate ?? "",
    fiscalYearEnd: row.CurrentFiscalYearEndDate ?? null,
    sales: num(row.NetSales),
    operatingProfit: num(row.OperatingProfit),
    ordinaryProfit: num(row.OrdinaryProfit),
    netIncome: num(row.Profit),
    eps: num(row.EarningsPerShare),
    bookValuePerShare: num(row.BookValuePerShare),
    dividendPerShare: num(row.ResultDividendPerShareAnnual),
    forecastSales: num(row.ForecastNetSales),
    forecastOperatingProfit: num(row.ForecastOperatingProfit),
    forecastNetIncome: num(row.ForecastProfit),
    source: "J-Quants API",
    fetchedAt,
  };
}

async function main() {
  if (!jquantsConfigured()) {
    logSafe("認証情報が未設定のため財務データの取得をスキップしました（既存キャッシュを維持）。");
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

  const existing = readJson(OUT, { financials: [] });
  const existingRows = Array.isArray(existing.financials) ? existing.financials : [];
  const lastDisclosed = existingRows.reduce((max, f) => (f.disclosedDate > max ? f.disclosedDate : max), "");

  const startMs = lastDisclosed
    ? new Date(lastDisclosed).getTime() + 86400000
    : Date.now() - LOOKBACK_DAYS * 86400000;
  const days = [];
  for (let t = startMs; t <= Date.now(); t += 86400000) days.push(ymd(new Date(t)));

  if (days.length === 0) {
    logSafe("差分なし。既存キャッシュを維持します。");
    return;
  }

  logSafe(`財務データを取得: ${days[0]} 〜 ${days[days.length - 1]}（${days.length}日分）`);
  const fetchedAt = nowIso();
  const collected = [];

  await forEachSequential(days, REQUEST_INTERVAL_MS, async (date) => {
    try {
      const rows = await jqGet(`/fins/statements?date=${date}`, idToken, {
        key: "statements",
        label: `fins/statements ${date}`,
      });
      collected.push(...rows.map((r) => normalize(r, fetchedAt)).filter((f) => f.code && f.disclosedDate));
    } catch (e) {
      // 1日分の失敗で全体を止めない
      logSafe(`fins/statements ${date} 取得失敗: ${e.message}`);
    }
  });

  if (collected.length === 0) {
    logSafe("新規データ0件。既存キャッシュを維持します。");
    return;
  }

  const map = new Map();
  for (const f of existingRows) map.set(`${f.code}:${f.disclosedDate}`, f);
  for (const f of collected) map.set(`${f.code}:${f.disclosedDate}`, f);
  const merged = [...map.values()].sort((a, b) => b.disclosedDate.localeCompare(a.disclosedDate));

  logSafe(`新規 ${collected.length}件 / 合計 ${merged.length}件`);
  writeJsonSafe(OUT, { fetchedAt, source: "J-Quants API", count: merged.length, financials: merged }, { label: "financials" });
}

main().catch((e) => {
  console.error("[jquants] financials 予期せぬエラー:", e.message);
  process.exit(0);
});
