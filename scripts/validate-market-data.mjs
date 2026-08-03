// public/data/ の妥当性検証。異常値・構造不正を検出して警告する。
// 致命的な構造不正（meta欠落・型不正）のみ exit 1。データ未接続は正常終了（意図した状態）。

import { publicPath, readJson } from "./lib/dataset.mjs";
import { validateDataset } from "./lib/validate-core.mjs";

const meta = readJson(publicPath("meta.json"), null);
const stocks = readJson(publicPath("stocks.json"), null);
const rankings = readJson(publicPath("rankings.json"), null);
const summary = readJson(publicPath("market-summary.json"), null);

const result = validateDataset({ meta, stocks, rankings, summary });

for (const w of result.warnings) console.warn(`[validate] ⚠ ${w}`);
for (const e of result.errors) console.error(`[validate] ✖ ${e}`);

if (result.errors.length > 0) {
  console.error(`[validate] 構造不正 ${result.errors.length}件のため失敗しました。`);
  process.exit(1);
}

console.log(
  `[validate] OK（銘柄 ${result.stats.stockCount}件 / 価格付き ${result.stats.withPrice}件 / 警告 ${result.warnings.length}件）`,
);
if (meta?.isFallback) {
  console.log("[validate] 注記: 現在は株価データ未接続（フォールバック状態）です。");
}
