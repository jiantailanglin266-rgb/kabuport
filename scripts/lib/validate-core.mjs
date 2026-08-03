// データセット検証の中核ロジック（純関数）。ユニットテスト対象。

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

/**
 * @returns {{errors: string[], warnings: string[], stats: {stockCount:number, withPrice:number}}}
 */
export function validateDataset({ meta, stocks, rankings, summary }) {
  const errors = [];
  const warnings = [];

  // --- meta ---
  if (!meta || typeof meta !== "object") {
    errors.push("meta.json が読み込めません");
  } else {
    if (!meta.generatedAt) errors.push("meta.generatedAt がありません");
    if (typeof meta.isFallback !== "boolean") errors.push("meta.isFallback が boolean ではありません");
    if (!meta.freshness) errors.push("meta.freshness がありません");
    if (meta.freshness === "realtime") {
      errors.push("freshness=realtime はリアルタイム配信契約がある場合のみ許可されます");
    }
    if (meta.marketDataDate && !ISO_DATE.test(meta.marketDataDate)) {
      errors.push(`meta.marketDataDate の日付形式が不正: ${meta.marketDataDate}`);
    }
  }

  // --- stocks ---
  const list = Array.isArray(stocks?.stocks) ? stocks.stocks : null;
  if (stocks && !list) errors.push("stocks.json の stocks が配列ではありません");

  let withPrice = 0;
  const seen = new Set();
  for (const s of list ?? []) {
    if (!s.code) {
      errors.push("code の無い銘柄があります");
      continue;
    }
    if (seen.has(s.code)) warnings.push(`銘柄コードが重複しています: ${s.code}`);
    seen.add(s.code);

    if (s.close !== null && s.close !== undefined) {
      withPrice++;
      if (typeof s.close !== "number" || !Number.isFinite(s.close)) {
        errors.push(`${s.code}: 終値が数値ではありません`);
      } else if (s.close < 0) {
        errors.push(`${s.code}: 終値が負数です (${s.close})`);
      }
    }
    if (s.changePercent !== null && s.changePercent !== undefined) {
      if (Math.abs(s.changePercent) > 60) {
        warnings.push(`${s.code}: 前日比が極端です (${s.changePercent}%)`);
      }
    }
    if (s.tradingDate && !ISO_DATE.test(s.tradingDate)) {
      errors.push(`${s.code}: tradingDate の形式が不正 (${s.tradingDate})`);
    }
  }

  // --- rankings ---
  for (const r of rankings?.rankings ?? []) {
    if (!r.formula) warnings.push(`ランキング ${r.id}: 算出式が記載されていません`);
    if (!r.marketDataDate) warnings.push(`ランキング ${r.id}: データ基準日がありません`);
    if (!Array.isArray(r.rows)) errors.push(`ランキング ${r.id}: rows が配列ではありません`);
  }

  // --- market summary ---
  if (summary && Array.isArray(summary.indices) && summary.indices.length > 0) {
    for (const idx of summary.indices) {
      if (idx.value !== null && idx.value !== undefined && !idx.sourceName) {
        errors.push(`指数 ${idx.id ?? "?"}: 数値を表示する場合は提供元(sourceName)が必須です`);
      }
    }
  }

  return { errors, warnings, stats: { stockCount: (list ?? []).length, withPrice } };
}

/** OHLCの整合性チェック（高値≧安値、負数なし 等）。 */
export function validatePriceRow(p) {
  const problems = [];
  if (!p.code) problems.push("code なし");
  if (!ISO_DATE.test(p.tradingDate ?? "")) problems.push("tradingDate 形式不正");
  for (const k of ["open", "high", "low", "close"]) {
    const v = p[k];
    if (v !== null && v !== undefined && (typeof v !== "number" || v < 0)) problems.push(`${k} が不正 (${v})`);
  }
  if (typeof p.high === "number" && typeof p.low === "number" && p.high < p.low) {
    problems.push(`高値が安値より小さい (${p.high} < ${p.low})`);
  }
  if (typeof p.volume === "number" && p.volume < 0) problems.push(`出来高が負数 (${p.volume})`);
  return problems;
}
