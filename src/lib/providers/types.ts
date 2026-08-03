// データ取得プロバイダーのインターフェース。
// 外部APIを差替えてもページ側の実装を変えないための境界 (spec §5)。
import type {
  Company, Quote, Valuation, FinancialYear, Dividend, ShareholderBenefit,
  EarningsEvent, Disclosure, MarketIndex, Industry, Theme, Video, VideoCategory,
} from "@/types";

export type ProviderMode = "mock" | "live";

export interface CompanyDataProvider {
  listCompanies(): Company[];
  getCompany(code: string): Company | undefined;
  getFinancials(code: string): FinancialYear[];
  listIndustries(): Industry[];
  listThemes(): Theme[];
}

export interface MarketDataProvider {
  listQuotes(): Quote[];
  getQuote(code: string): Quote | undefined;
  getValuation(code: string): Valuation | undefined;
  listIndices(): MarketIndex[];
}

export interface DividendProvider {
  getDividend(code: string): Dividend | undefined;
  listDividends(): Dividend[];
}

export interface ShareholderBenefitProvider {
  getBenefit(code: string): ShareholderBenefit | undefined;
  listBenefits(): ShareholderBenefit[];
}

export interface DisclosureProvider {
  listDisclosures(): Disclosure[];
  listByCode(code: string): Disclosure[];
}

export interface EarningsProvider {
  listEarnings(): EarningsEvent[];
}

/** 動画（YouTube Data API v3 等へ差し替え可能な境界） */
export interface VideoProvider {
  listVideos(): Video[];
  getVideo(id: string): Video | undefined;
  listByCategory(category: VideoCategory): Video[];
  listByCode(code: string): Video[];
}

export interface Providers {
  mode: ProviderMode;
  company: CompanyDataProvider;
  market: MarketDataProvider;
  dividend: DividendProvider;
  benefit: ShareholderBenefitProvider;
  disclosure: DisclosureProvider;
  earnings: EarningsProvider;
  video: VideoProvider;
}
