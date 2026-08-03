// 公開データセット (public/data/*.json) の読み込み。
// 静的エクスポートのため、ビルド時にファイルシステムから読む（サーバー専用）。
//
// 重要:
//  - production モードでは、モックデータを一切読み込まない
//  - production モードでデータセットが未接続（isFallback）の場合はビルドを失敗させる
import "server-only";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import type {
  DataMode,
  DatasetMeta,
  DisclosureDocument,
  StockMaster,
} from "@/types/market";
import { resolveDataMode } from "@/types/market";

const DATA_DIR = join(process.cwd(), "public", "data");

function read<T>(file: string, fallback: T): T {
  try {
    return JSON.parse(readFileSync(join(DATA_DIR, file), "utf8")) as T;
  } catch {
    return fallback;
  }
}

export function getDataMode(): DataMode {
  return resolveDataMode(process.env.NEXT_PUBLIC_DATA_MODE);
}

const EMPTY_META: DatasetMeta = {
  generatedAt: "",
  lastSuccessfulUpdateAt: "",
  sourceName: "未接続",
  sourceUrl: "",
  freshness: "unknown",
  marketDataDate: null,
  isFallback: true,
  warning: "データセットが生成されていません。",
};

export interface StockIndexEntry {
  code: string;
  nameJa: string;
  nameEn: string | null;
  marketName: string;
  sector33Name: string | null;
  q: string;
  close: number | null;
  changePercent: number | null;
  tradingDate: string | null;
}

export interface RankingBlock {
  id: string;
  labelJa: string;
  labelEn: string;
  formula: string;
  calculatedAt: string;
  marketDataDate: string | null;
  universe: string;
  universeCount: number;
  excludeRule: string;
  freshness: string;
  sourceName: string;
  rows: { code: string; nameJa: string; metric: number; close: number | null; changePercent: number | null }[];
}

export interface SectorEntry {
  name: string;
  count: number;
  method: string;
  avgChangePercent: number | null;
  insufficientData: boolean;
}

let cached: {
  meta: DatasetMeta;
  stocks: StockIndexEntry[];
  rankings: RankingBlock[];
  sectors: SectorEntry[];
  disclosures: DisclosureDocument[];
  indicesNote: string;
} | null = null;

export function getDataset() {
  if (cached) return cached;

  const meta = read<DatasetMeta>("meta.json", EMPTY_META);
  const stocks = read<{ stocks: StockIndexEntry[] }>("stocks.json", { stocks: [] }).stocks ?? [];
  const rankings = read<{ rankings: RankingBlock[] }>("rankings.json", { rankings: [] }).rankings ?? [];
  const sectors = read<{ sectors: SectorEntry[] }>("sectors.json", { sectors: [] }).sectors ?? [];
  const disclosures =
    read<{ disclosures: DisclosureDocument[] }>("disclosures.json", { disclosures: [] }).disclosures ?? [];
  const summary = read<{ indicesNote?: string }>("market-summary.json", {});

  // production では未接続データセットを許可しない（フェイルファスト）
  if (getDataMode() === "production" && meta.isFallback) {
    throw new Error(
      "[dataset] NEXT_PUBLIC_DATA_MODE=production ですが、実データが接続されていません。" +
        "APIキーの設定と各データ元の利用規約（公開再配信可否）の確認を行い、npm run data:all を実行してください。",
    );
  }

  cached = {
    meta,
    stocks,
    rankings,
    sectors,
    disclosures,
    indicesNote: summary.indicesNote ?? "",
  };
  return cached;
}

/** 実データが利用可能か（銘柄マスタと株価が揃っているか）。 */
export function hasRealMarketData(): boolean {
  const d = getDataset();
  return !d.meta.isFallback && d.stocks.length > 0;
}

/** production 以外で、サンプル(モック)データの表示が許可されるか。 */
export function isMockAllowed(): boolean {
  return getDataMode() !== "production";
}

export function getStockMasterList(): StockMaster[] {
  return getDataset().stocks.map((s) => ({
    code: s.code,
    nameJa: s.nameJa,
    nameEn: s.nameEn,
    marketCode: null,
    marketName: s.marketName,
    sector17Code: null,
    sector17Name: null,
    sector33Code: null,
    sector33Name: s.sector33Name,
    listedDate: null,
  }));
}
