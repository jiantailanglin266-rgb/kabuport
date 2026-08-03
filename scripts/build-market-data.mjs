// .data-cache/ の取得結果から、公開用データセット public/data/ を組み立てる。
//
// 重要: データ元ごとの「公開サイトへの再配信可否」ポリシーを尊重する。
//       未確認のデータ元は公開データセットへ含めない（meta.json に理由を記録）。
//
// 出力:
//   public/data/meta.json          データセット全体のメタ情報
//   public/data/stocks.json        銘柄マスタ（検索インデックス兼用）
//   public/data/market-summary.json 市場サマリー
//   public/data/rankings.json      事前計算したランキング
//   public/data/sectors.json       業種別集計
//   public/data/disclosures.json   開示書類メタデータ
//   public/data/stocks/<code>.json 銘柄別詳細

import { cachePath, nowIso, publicPath, readJson, sourcePolicies, writeJsonSafe } from "./lib/dataset.mjs";

const policies = sourcePolicies();
const excluded = [];

function loadIfAllowed(policy, path, fallback) {
  if (!policy.publicRedistributionConfirmed) {
    if (!excluded.some((e) => e.sourceId === policy.id)) {
      excluded.push({
        sourceId: policy.id,
        source: policy.name,
        reason: "利用規約上の公開再配信可否が未確認のため、公開データセットへ含めていません。",
        howToEnable: `${policy.id.toUpperCase()}_PUBLIC_REDISTRIBUTION=confirmed`,
      });
    }
    return fallback;
  }
  return readJson(path, fallback);
}

// ---- 入力 ----
const listedRaw = loadIfAllowed(policies.jquants, cachePath("jquants", "listed-info.json"), { stocks: [] });
const pricesRaw = loadIfAllowed(policies.jquants, cachePath("jquants", "prices.json"), { prices: [], freshness: "unknown" });
const finsRaw = loadIfAllowed(policies.jquants, cachePath("jquants", "financials.json"), { financials: [] });
const edinetRaw = loadIfAllowed(policies.edinet, cachePath("edinet", "documents.json"), { documents: [] });

const stocks = listedRaw.stocks ?? [];
const prices = pricesRaw.prices ?? [];
const financials = finsRaw.financials ?? [];
const disclosures = edinetRaw.documents ?? [];

const hasMarketData = stocks.length > 0 && prices.length > 0;

// ---- 日足を銘柄ごとに整理し、前日比を算出 ----
const byCode = new Map();
for (const p of prices) {
  if (!byCode.has(p.code)) byCode.set(p.code, []);
  byCode.get(p.code).push(p);
}
for (const [, list] of byCode) list.sort((a, b) => a.tradingDate.localeCompare(b.tradingDate));

/** 直近の1件に前日終値・前日比を補完して返す。 */
function latestWithChange(code) {
  const list = byCode.get(code);
  if (!list || list.length === 0) return null;
  const last = list[list.length - 1];
  const prev = list.length >= 2 ? list[list.length - 2] : null;
  const previousClose = prev?.close ?? null;
  const change = last.close !== null && previousClose !== null ? last.close - previousClose : null;
  const changePercent = change !== null && previousClose ? (change / previousClose) * 100 : null;
  return {
    ...last,
    previousClose,
    change: change === null ? null : Math.round(change * 100) / 100,
    changePercent: changePercent === null ? null : Math.round(changePercent * 10000) / 10000,
  };
}

const latestByCode = new Map();
for (const code of byCode.keys()) {
  const l = latestWithChange(code);
  if (l) latestByCode.set(code, l);
}

const marketDataDate =
  [...latestByCode.values()].reduce((max, p) => (p.tradingDate > max ? p.tradingDate : max), "") || null;

// ---- meta ----
const previousMeta = readJson(publicPath("meta.json"), null);
const isFallback = !hasMarketData;
const meta = {
  generatedAt: nowIso(),
  lastSuccessfulUpdateAt: hasMarketData ? nowIso() : previousMeta?.lastSuccessfulUpdateAt ?? null,
  sourceName: hasMarketData ? "J-Quants API" : disclosures.length > 0 ? "EDINET API v2" : "未接続",
  sourceUrl: hasMarketData ? "https://jpx-jquants.com/" : "https://disclosure2.edinet-fsa.go.jp/",
  freshness: hasMarketData ? pricesRaw.freshness ?? "delayed_12weeks" : "unknown",
  marketDataDate,
  isFallback,
  warning: isFallback
    ? "株価データは未接続です。APIキーの設定、および各データ元の利用規約（公開再配信の可否）の確認が必要です。"
    : null,
  counts: {
    stocks: stocks.length,
    priceRows: prices.length,
    financials: financials.length,
    disclosures: disclosures.length,
  },
  excludedSources: excluded,
  sources: Object.values(policies).map((p) => ({
    id: p.id,
    name: p.name,
    url: p.url,
    publicRedistributionConfirmed: p.publicRedistributionConfirmed,
    note: p.note,
  })),
};

// ---- 銘柄マスタ + 検索インデックス ----
const stockIndex = stocks.map((s) => {
  const latest = latestByCode.get(s.code) ?? null;
  return {
    code: s.code,
    nameJa: s.nameJa,
    nameEn: s.nameEn,
    marketName: s.marketName,
    sector33Name: s.sector33Name,
    // 検索用の正規化キー（コード・社名・業種）
    q: [s.code, s.nameJa, s.nameEn ?? "", s.marketName, s.sector33Name ?? ""].join(" ").toLowerCase(),
    close: latest?.close ?? null,
    changePercent: latest?.changePercent ?? null,
    tradingDate: latest?.tradingDate ?? null,
  };
});

// ---- ランキング（バッチで事前計算） ----
function buildRanking({ id, labelJa, labelEn, formula, pick, sort, limit = 30, filter }) {
  const rows = stockIndex
    .filter((s) => (filter ? filter(s) : true))
    .map((s) => ({ ...s, metric: pick(s) }))
    .filter((s) => s.metric !== null && Number.isFinite(s.metric))
    .sort(sort)
    .slice(0, limit)
    .map((s) => ({ code: s.code, nameJa: s.nameJa, metric: s.metric, close: s.close, changePercent: s.changePercent }));
  return {
    id,
    labelJa,
    labelEn,
    formula,
    calculatedAt: meta.generatedAt,
    marketDataDate,
    universe: "J-Quants 上場銘柄（取得済み）",
    universeCount: stockIndex.length,
    excludeRule: "終値または必要データが欠損している銘柄、出来高ゼロの銘柄は除外",
    freshness: meta.freshness,
    sourceName: meta.sourceName,
    rows,
  };
}

const rankings = hasMarketData
  ? [
      buildRanking({
        id: "gainers",
        labelJa: "値上がり率",
        labelEn: "Top gainers",
        formula: "(終値 − 前営業日終値) ÷ 前営業日終値 × 100",
        pick: (s) => s.changePercent,
        sort: (a, b) => b.metric - a.metric,
      }),
      buildRanking({
        id: "losers",
        labelJa: "値下がり率",
        labelEn: "Top losers",
        formula: "(終値 − 前営業日終値) ÷ 前営業日終値 × 100",
        pick: (s) => s.changePercent,
        sort: (a, b) => a.metric - b.metric,
      }),
    ]
  : [];

// ---- 業種別集計 ----
const sectorMap = new Map();
for (const s of stockIndex) {
  const name = s.sector33Name || "未分類";
  if (!sectorMap.has(name)) sectorMap.set(name, []);
  sectorMap.get(name).push(s);
}
const sectors = hasMarketData
  ? [...sectorMap.entries()]
      .map(([name, list]) => {
        const pcts = list.map((s) => s.changePercent).filter((v) => v !== null && Number.isFinite(v));
        return {
          name,
          count: list.length,
          // 時価総額データが無いため単純平均。画面上でも「単純平均」と明示すること。
          method: "simple_average",
          avgChangePercent: pcts.length ? Math.round((pcts.reduce((a, b) => a + b, 0) / pcts.length) * 10000) / 10000 : null,
          insufficientData: pcts.length < 3,
        };
      })
      .sort((a, b) => b.count - a.count)
  : [];

// ---- 市場サマリー ----
const marketSummary = {
  meta,
  // 指数（日経平均・TOPIX等）は無料で正式に取得・再配信できないため数値は持たない。
  // 画面側は公式サイトへのリンクカードを表示する。
  indices: [],
  indicesNote:
    "日経平均株価・TOPIX等の指数値は、無料の公式APIで再配信可能な形では取得できないため掲載していません。各指数の公式サイトをご確認ください。",
  breadth: hasMarketData
    ? {
        advancing: stockIndex.filter((s) => (s.changePercent ?? 0) > 0).length,
        declining: stockIndex.filter((s) => (s.changePercent ?? 0) < 0).length,
        unchanged: stockIndex.filter((s) => s.changePercent === 0).length,
        marketDataDate,
      }
    : null,
};

// ---- 出力 ----
writeJsonSafe(publicPath("meta.json"), meta, { allowEmpty: true, label: "meta.json" });
writeJsonSafe(publicPath("stocks.json"), { meta, count: stockIndex.length, stocks: stockIndex }, { allowEmpty: true, label: "stocks.json" });
writeJsonSafe(publicPath("market-summary.json"), marketSummary, { allowEmpty: true, label: "market-summary.json" });
writeJsonSafe(publicPath("rankings.json"), { meta, rankings }, { allowEmpty: true, label: "rankings.json" });
writeJsonSafe(publicPath("sectors.json"), { meta, sectors }, { allowEmpty: true, label: "sectors.json" });
writeJsonSafe(
  publicPath("disclosures.json"),
  { meta, count: disclosures.length, disclosures: disclosures.slice(0, 500) },
  { allowEmpty: true, label: "disclosures.json" },
);

// 銘柄別（データがある銘柄のみ）
let perStock = 0;
for (const s of stocks) {
  const history = (byCode.get(s.code) ?? []).slice(-260); // 直近1年程度
  if (history.length === 0) continue;
  const latest = latestByCode.get(s.code) ?? null;
  const fins = financials.filter((f) => f.code === s.code).slice(0, 8);
  const docs = disclosures.filter((d) => d.code === s.code).slice(0, 20);
  writeJsonSafe(
    publicPath("stocks", `${s.code}.json`),
    { meta, master: s, latest, history, financials: fins, disclosures: docs },
    { allowEmpty: true, label: `stocks/${s.code}.json` },
  );
  perStock++;
}

console.log("[build] 公開データセットを生成しました");
console.log(`[build]   銘柄マスタ: ${stockIndex.length}件 / 日足: ${prices.length}行 / 銘柄別ファイル: ${perStock}件`);
console.log(`[build]   財務: ${financials.length}件 / 開示: ${disclosures.length}件`);
if (excluded.length > 0) {
  console.log("[build] 公開対象外のデータ元:");
  for (const e of excluded) console.log(`[build]   - ${e.source}: ${e.reason}（有効化: ${e.howToEnable}）`);
}
if (isFallback) console.log("[build] ⚠ 株価データが未接続のため、フォールバック状態のメタ情報を出力しました。");
