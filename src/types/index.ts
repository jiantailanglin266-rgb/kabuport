// ============================================================
// KABUPORT ドメイン型
// DB実装とモック実装の共通語彙。すべての金融データは出典・基準日時・
// データ状態 (実績/予想, 連結/単体, サンプル/実データ) を区別できるようにする。
// ============================================================

export type Locale = "ja" | "en";
export const LOCALES: Locale[] = ["ja", "en"];
export const DEFAULT_LOCALE: Locale = "ja";

/** データの信頼状態。実データと誤認させないため必ず付与する。 */
export type DataStatus =
  | "sample" // デモ/サンプル (実データではない)
  | "verified" // 一次情報で確認済み
  | "unverified" // 未確認
  | "stale"; // 取得停止中/古い

/** どのデータにも付ける来歴メタ。 */
export interface Provenance {
  source: string; // 例: "JPX", "EDINET", "Sample Data"
  sourceUrl?: string;
  fetchedAt: string; // ISO8601
  verifiedAt?: string; // ISO8601
  dataStatus: DataStatus;
  delayMinutes?: number; // 株価の遅延 (0=リアルタイム相当, undefined=不明)
}

export type MarketSegment = "prime" | "standard" | "growth" | "other";
export type Consolidation = "consolidated" | "nonconsolidated"; // 連結/単体
export type ForecastType = "actual" | "company_forecast" | "analyst_forecast"; // 実績/会社予想/外部予想

/** 上場企業 (言語非依存部分) */
export interface Company {
  code: string; // 証券コード 例: "7203"
  nameJa: string;
  nameEn: string;
  nameKana: string;
  segment: MarketSegment;
  industryCode: string; // 東証33業種コード
  themes: string[]; // テーマslug
  hqPrefecture: string;
  foundedOn?: string;
  listedOn?: string;
  fiscalYearEndMonth: number; // 決算月 1-12
  accountingStandard: "jgaap" | "ifrs" | "usgaap";
  employees?: number;
  website?: string;
  irUrl?: string;
  descriptionJa: string;
  descriptionEn: string;
  sharesOutstanding?: number;
  logoText: string; // ロゴ代替の頭文字/短縮
  provenance: Provenance;
}

/** 株価スナップショット */
export interface Quote {
  code: string;
  price: number; // 直近値 (円)
  previousClose: number;
  open: number;
  high: number;
  low: number;
  volume: number; // 出来高 (株)
  tradingValue: number; // 売買代金 (円)
  marketCap: number; // 時価総額 (円)
  week52High: number;
  week52Low: number;
  ytdHigh: number;
  ytdLow: number;
  tradingUnit: number; // 売買単位 (株)
  currency: "JPY";
  provenance: Provenance;
}

/** 通期の財務・業績 (1年度分) */
export interface FinancialYear {
  code: string;
  fiscalYear: string; // 例: "2024/03"
  consolidation: Consolidation;
  forecastType: ForecastType;
  revenue: number;
  operatingIncome: number;
  ordinaryIncome?: number;
  netIncome: number;
  eps: number;
  bps?: number;
  operatingCashFlow?: number;
  investingCashFlow?: number;
  financingCashFlow?: number;
  freeCashFlow?: number;
  totalAssets?: number;
  netAssets?: number;
  equity?: number; // 自己資本
  cash?: number;
  interestBearingDebt?: number;
  roe?: number; // %
  roa?: number; // %
  equityRatio?: number; // 自己資本比率 %
  operatingMargin?: number; // %
  provenance: Provenance;
}

/** バリュエーション指標 (計算対象年度/前提を明示) */
export interface Valuation {
  code: string;
  per?: number; // 実績PER
  forwardPer?: number; // 予想PER
  pbr?: number;
  psr?: number;
  evEbitda?: number;
  peg?: number;
  dividendYield?: number; // %
  forwardDividendYield?: number; // %
  payoutRatio?: number; // 配当性向 %
  basis: string; // 例: "連結・会社予想 2025/03期基準"
  provenance: Provenance;
}

export interface Dividend {
  code: string;
  fiscalYear: string;
  annualDividend: number; // 円
  interim?: number;
  yearEnd?: number;
  forecast: boolean; // 予想値か確定値か
  yieldPct?: number;
  payoutRatioPct?: number;
  consecutiveIncreaseYears?: number; // 連続増配年数
  exRightsDate?: string; // 権利落ち日
  recordDate?: string; // 権利確定日
  policy?: string;
  provenance: Provenance;
}

export type BenefitCategory =
  | "food" | "dining" | "shopping" | "voucher" | "travel"
  | "leisure" | "daily" | "beauty" | "catalog" | "ownproduct";

export interface ShareholderBenefit {
  code: string;
  category: BenefitCategory;
  contentJa: string;
  contentEn: string;
  requiredShares: number;
  requiredInvestment?: number; // 円 (最低投資金額目安)
  recordMonths: number[]; // 権利確定月
  longTermCondition?: string;
  benefitValue?: number; // 客観算出可能な場合のみ (円)
  benefitYieldPct?: number;
  shippingTiming?: string;
  officialUrl?: string;
  verifiedAt?: string;
  provenance: Provenance;
}

export type EarningsPeriod = "full_year" | "q1" | "q2" | "q3";

export interface EarningsEvent {
  code: string;
  scheduledDate: string; // ISO date
  period: EarningsPeriod;
  timeOfDay?: "before_open" | "during" | "after_close" | "unknown";
  announced: boolean;
  provenance: Provenance;
}

export type DisclosureCategory =
  | "earnings" | "forecast_revision" | "dividend" | "buyback"
  | "split" | "ma" | "personnel" | "other";

export interface Disclosure {
  code: string;
  publishedAt: string; // ISO datetime
  titleJa: string;
  titleEn: string;
  category: DisclosureCategory;
  documentUrl?: string;
  provenance: Provenance;
}

export interface MarketIndex {
  id: string; // 例: "nikkei225"
  nameJa: string;
  nameEn: string;
  value: number;
  previousClose: number;
  operator: string; // 算出主体
  provenance: Provenance;
}

export interface Industry {
  code: string;
  nameJa: string;
  nameEn: string;
  descriptionJa: string;
  descriptionEn: string;
}

export interface Theme {
  slug: string;
  nameJa: string;
  nameEn: string;
  descriptionJa: string;
  descriptionEn: string;
}

/** 証券会社 (アフィリエイト。広告開示・調査日を必須で保持) */
export interface Broker {
  slug: string;
  nameJa: string;
  nameEn: string;
  operator: string;
  registrationNumber: string; // 金融商品取引業者登録番号
  associations: string[];
  spotFeeNote: string; // 現物手数料 (要点)
  nisa: boolean;
  usStocks: boolean;
  ipo: boolean;
  singleShares: boolean; // 単元未満株
  pointInvest: boolean;
  creditCardTsumitate: boolean;
  officialUrl: string;
  affiliateUrl?: string; // /go リダイレクト経由で使用
  isAffiliate: boolean;
  surveyedAt: string; // 調査日
  provenance: Provenance;
}

export type ArticleLevel = "beginner" | "intermediate" | "advanced";

export interface Article {
  slug: string;
  category: string;
  level: ArticleLevel;
  titleJa: string;
  titleEn: string;
  summaryJa: string;
  summaryEn: string;
  bodyJa: string;
  bodyEn: string;
  author: string;
  reviewer?: string;
  publishedAt: string;
  updatedAt: string;
  readingMinutes: number;
  relatedCodes?: string[];
  sources?: { label: string; url?: string }[];
}
