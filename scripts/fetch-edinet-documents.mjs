// EDINET API v2: 提出書類一覧（メタデータのみ）を取得し .data-cache/ へ保存。
//
// 方針:
//   - PDF/XBRL 本体はダウンロード・保存しない（メタデータと公式閲覧URLのみ）
//   - APIキーは Subscription-Key ヘッダで送る。ログには出さない。
//   - 1日分の取得失敗で全体を止めない。

import { getJson } from "./lib/http.mjs";
import { cachePath, nowIso, readJson, writeJsonSafe } from "./lib/dataset.mjs";
import { forEachSequential } from "./lib/http.mjs";

const OUT = cachePath("edinet", "documents.json");
const BASE = (process.env.EDINET_API_BASE || "https://api.edinet-fsa.go.jp/api/v2").replace(/\/$/, "");
const KEY = process.env.EDINET_API_KEY;
const LOOKBACK_DAYS = Number(process.env.EDINET_LOOKBACK_DAYS || "14");
const INTERVAL_MS = Number(process.env.EDINET_INTERVAL_MS || "400");

const ymd = (d) => d.toISOString().slice(0, 10);

/** 様式コード等から書類種別の表示名を決める（判定できないものは原文のまま）。 */
function documentType(row) {
  const t = row.docDescription || "";
  if (/有価証券報告書/.test(t)) return "有価証券報告書";
  if (/四半期報告書/.test(t)) return "四半期報告書";
  if (/半期報告書/.test(t)) return "半期報告書";
  if (/大量保有/.test(t)) return "大量保有報告書";
  if (/公開買付/.test(t)) return "公開買付関連";
  if (/訂正/.test(t)) return "訂正報告書";
  if (/臨時報告書/.test(t)) return "臨時報告書";
  return t || "その他";
}

/** EDINETの証券コードは5桁（末尾0）。サイト内の4桁へ寄せる。 */
function toSiteCode(secCode) {
  const c = String(secCode ?? "").trim();
  if (!c) return null;
  return c.length === 5 && c.endsWith("0") ? c.slice(0, 4) : c;
}

function normalize(row) {
  return {
    id: row.docID,
    code: toSiteCode(row.secCode),
    companyName: row.filerName ?? "",
    title: row.docDescription ?? "",
    documentType: documentType(row),
    submittedAt: row.submitDateTime ?? "",
    sourceName: "EDINET (金融庁)",
    // 公式の閲覧URL（本文は保存せず、常に公式で閲覧させる）
    sourceUrl: `https://disclosure2.edinet-fsa.go.jp/WZEK0040.aspx?S100=&W1BOOK=${encodeURIComponent(row.docID ?? "")}`,
  };
}

async function main() {
  if (!KEY) {
    console.log("[edinet] EDINET_API_KEY が未設定のため取得をスキップしました（既存キャッシュを維持）。");
    return;
  }

  const days = [];
  for (let i = LOOKBACK_DAYS; i >= 0; i--) days.push(ymd(new Date(Date.now() - i * 86400000)));

  console.log(`[edinet] 提出書類一覧を取得: ${days[0]} 〜 ${days[days.length - 1]}`);
  const collected = [];

  await forEachSequential(days, INTERVAL_MS, async (date) => {
    // type=2: 提出書類一覧＋メタデータ
    const data = await getJson(
      `${BASE}/documents.json?date=${date}&type=2`,
      { headers: { "Ocp-Apim-Subscription-Key": KEY } },
      { label: `edinet documents ${date}`, secrets: [KEY] },
    );
    if (!data || !Array.isArray(data.results)) return;
    for (const row of data.results) {
      if (!row.docID) continue;
      // 証券コードのある提出書類（＝上場企業）に絞る
      if (!row.secCode) continue;
      collected.push(normalize(row));
    }
  });

  if (collected.length === 0) {
    console.log("[edinet] 新規データ0件。既存キャッシュを維持します。");
    return;
  }

  const existing = readJson(OUT, { documents: [] });
  const map = new Map();
  for (const d of existing.documents ?? []) map.set(d.id, d);
  for (const d of collected) map.set(d.id, d);
  const merged = [...map.values()].sort((a, b) => (b.submittedAt || "").localeCompare(a.submittedAt || ""));

  console.log(`[edinet] 新規 ${collected.length}件 / 合計 ${merged.length}件`);
  writeJsonSafe(
    OUT,
    { fetchedAt: nowIso(), source: "EDINET API v2", count: merged.length, documents: merged.slice(0, 5000) },
    { label: "edinet documents" },
  );
}

main().catch((e) => {
  console.error("[edinet] 予期せぬエラー:", e.message);
  process.exit(0);
});
