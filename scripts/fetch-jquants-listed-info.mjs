// J-Quants: 上場銘柄一覧（銘柄コード・社名・市場区分・業種）を取得し .data-cache/ へ保存。
// 認証情報が無ければ no-op（既存キャッシュを維持し、ビルドは継続）。

import { getIdToken, jqGet, jquantsConfigured, toSiteCode, logSafe } from "./lib/jquants.mjs";
import { cachePath, nowIso, writeJsonSafe } from "./lib/dataset.mjs";

const OUT = cachePath("jquants", "listed-info.json");

function normalize(row) {
  return {
    code: toSiteCode(row.Code),
    nameJa: row.CompanyName ?? "",
    nameEn: row.CompanyNameEnglish ?? null,
    marketCode: row.MarketCode ?? null,
    marketName: row.MarketCodeName ?? "",
    sector17Code: row.Sector17Code ?? null,
    sector17Name: row.Sector17CodeName ?? null,
    sector33Code: row.Sector33Code ?? null,
    sector33Name: row.Sector33CodeName ?? null,
    listedDate: row.Date ?? null,
  };
}

async function main() {
  if (!jquantsConfigured()) {
    logSafe("認証情報が未設定のため上場銘柄一覧の取得をスキップしました（既存キャッシュを維持）。");
    return;
  }

  let idToken;
  try {
    idToken = await getIdToken();
  } catch (e) {
    logSafe(`認証に失敗しました: ${e.message}（既存キャッシュを維持）`);
    return;
  }
  if (!idToken) {
    logSafe("IDトークンを取得できませんでした（既存キャッシュを維持）。");
    return;
  }

  const rows = await jqGet("/listed/info", idToken, { key: "info", label: "listed/info" });
  const stocks = rows.map(normalize).filter((s) => s.code && s.nameJa);

  logSafe(`上場銘柄: ${stocks.length}件`);
  writeJsonSafe(OUT, { fetchedAt: nowIso(), source: "J-Quants API", count: stocks.length, stocks }, { label: "listed-info" });
}

main().catch((e) => {
  console.error("[jquants] listed-info 予期せぬエラー:", e.message);
  process.exit(0); // 取得失敗でパイプライン全体を止めない
});
