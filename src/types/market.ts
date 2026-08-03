// ============================================================
// 実データ用の共通データモデル
// すべての数値は「いつ時点か・どこから来たか・どれくらい遅延しているか」を
// 分離して保持する。リアルタイムでないものを realtime と表記しない。
// ============================================================

export type DataFreshness =
  | "realtime" // 有償のリアルタイム配信契約がある場合のみ
  | "delayed_15min"
  | "end_of_day"
  | "delayed_12weeks" // J-Quants 無料プラン
  | "historical"
  | "unknown";

export const FRESHNESS_LABEL: Record<DataFreshness, { ja: string; en: string }> = {
  realtime: { ja: "リアルタイム", en: "Real-time" },
  delayed_15min: { ja: "15分遅延", en: "15-min delayed" },
  end_of_day: { ja: "前営業日終値", en: "Previous close" },
  delayed_12weeks: { ja: "12週間遅延", en: "12-week delayed" },
  historical: { ja: "履歴データ", en: "Historical" },
  unknown: { ja: "遅延状況不明", en: "Delay unknown" },
};

export interface StockMaster {
  code: string;
  nameJa: string;
  nameEn: string | null;
  marketCode: string | null;
  marketName: string;
  sector17Code: string | null;
  sector17Name: string | null;
  sector33Code: string | null;
  sector33Name: string | null;
  listedDate: string | null;
}

export interface StockPrice {
  code: string;
  tradingDate: string;
  open: number | null;
  high: number | null;
  low: number | null;
  close: number | null;
  previousClose: number | null;
  change: number | null;
  changePercent: number | null;
  volume: number | null;
  turnoverValue: number | null;
  adjustmentFactor: number | null;
  source: string;
  fetchedAt: string;
  freshness: DataFreshness;
}

export interface FinancialSummary {
  code: string;
  disclosedDate: string;
  fiscalYearEnd: string | null;
  sales: number | null;
  operatingProfit: number | null;
  ordinaryProfit: number | null;
  netIncome: number | null;
  eps: number | null;
  bookValuePerShare: number | null;
  dividendPerShare: number | null;
  forecastSales: number | null;
  forecastOperatingProfit: number | null;
  forecastNetIncome: number | null;
  source: string;
  fetchedAt: string;
}

export interface DisclosureDocument {
  id: string;
  code: string | null;
  companyName: string;
  title: string;
  documentType: string;
  submittedAt: string;
  sourceName: string;
  sourceUrl: string;
}

export interface DatasetMeta {
  generatedAt: string;
  lastSuccessfulUpdateAt: string | null;
  sourceName: string;
  sourceUrl: string;
  freshness: DataFreshness;
  marketDataDate: string | null;
  isFallback: boolean;
  warning: string | null;
  counts?: {
    stocks: number;
    priceRows: number;
    financials: number;
    disclosures: number;
  };
  /** 公開データセットから除外したデータ元とその理由 */
  excludedSources?: { sourceId: string; source: string; reason: string; howToEnable: string }[];
  /** データ元ごとの公開可否ステータス */
  sources?: {
    id: string;
    name: string;
    url: string;
    publicRedistributionConfirmed: boolean;
    note: string;
  }[];
}

/** 公開サイトへ表示してよいかを、データ元ごとに明示的に持つ。既定は false（未確認は出さない）。 */
export interface SourcePolicy {
  id: string;
  name: string;
  url: string;
  /** 利用規約で公開サイトへの表示・再配信が確認できている場合のみ true */
  publicRedistributionConfirmed: boolean;
  note: string;
}

export interface MarketDataset {
  meta: DatasetMeta;
  stocks: StockMaster[];
  prices: StockPrice[];
  financials: FinancialSummary[];
  disclosures: DisclosureDocument[];
}

/** データ表示モード。production ではモックデータを一切読み込まない。 */
export type DataMode = "production" | "preview" | "mock";

export function resolveDataMode(raw: string | undefined): DataMode {
  if (raw === "production" || raw === "preview" || raw === "mock") return raw;
  return "preview";
}
