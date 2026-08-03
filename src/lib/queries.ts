// プロバイダーを組み合わせてページ用のビューモデルを作る層。
// サーバーコンポーネントはここを直接呼ぶ (API経由しない)。
import { getProviders } from "@/lib/providers";
import * as m from "@/lib/metrics";
import type {
  Company, Quote, Valuation, Dividend, ShareholderBenefit, FinancialYear,
  Disclosure, EarningsEvent, MarketIndex,
} from "@/types";

export interface StockSummary {
  company: Company;
  quote: Quote;
  valuation: Valuation | undefined;
  dividend: Dividend | undefined;
  benefit: ShareholderBenefit | undefined;
  change: number;
  changePct: number | null;
  direction: m.Direction;
  minInvestment: number | null;
}

function buildSummary(company: Company): StockSummary | undefined {
  const p = getProviders();
  const quote = p.market.getQuote(company.code);
  if (!quote) return undefined;
  const change = m.priceChange(quote.price, quote.previousClose);
  const changePct = m.priceChangePercent(quote.price, quote.previousClose);
  return {
    company,
    quote,
    valuation: p.market.getValuation(company.code),
    dividend: p.dividend.getDividend(company.code),
    benefit: p.benefit.getBenefit(company.code),
    change,
    changePct,
    direction: m.direction(change),
    minInvestment: m.minInvestment(quote.price, quote.tradingUnit),
  };
}

export function listStockSummaries(): StockSummary[] {
  const p = getProviders();
  return p.company
    .listCompanies()
    .map(buildSummary)
    .filter((s): s is StockSummary => s !== undefined);
}

export interface StockDetail {
  summary: StockSummary;
  financials: FinancialYear[];
  disclosures: Disclosure[];
}

export function getStockDetail(code: string): StockDetail | undefined {
  const p = getProviders();
  const company = p.company.getCompany(code);
  if (!company) return undefined;
  const summary = buildSummary(company);
  if (!summary) return undefined;
  return {
    summary,
    financials: p.company.getFinancials(code),
    disclosures: p.disclosure.listByCode(code),
  };
}

export function listAllCodes(): string[] {
  return getProviders().company.listCompanies().map((c) => c.code);
}

export function getIndices(): MarketIndex[] {
  return getProviders().market.listIndices();
}

export function getRecentDisclosures(limit = 8): Disclosure[] {
  return getProviders().disclosure.listDisclosures().slice(0, limit);
}

export function getUpcomingEarnings(limit = 8): EarningsEvent[] {
  return getProviders()
    .earnings.listEarnings()
    .slice()
    .sort((a, b) => a.scheduledDate.localeCompare(b.scheduledDate))
    .slice(0, limit);
}

// ---- ランキング (集計条件を呼び出し側で明示できるよう純粋に並べ替えるだけ) ----
export type RankingKey = "gainers" | "losers" | "yield" | "marketCap" | "volume";

export function getRanking(key: RankingKey, limit = 10): StockSummary[] {
  const all = listStockSummaries();
  const sorted = [...all];
  switch (key) {
    case "gainers":
      sorted.sort((a, b) => (b.changePct ?? -Infinity) - (a.changePct ?? -Infinity));
      break;
    case "losers":
      sorted.sort((a, b) => (a.changePct ?? Infinity) - (b.changePct ?? Infinity));
      break;
    case "yield":
      sorted.sort((a, b) => (b.valuation?.dividendYield ?? -Infinity) - (a.valuation?.dividendYield ?? -Infinity));
      break;
    case "marketCap":
      sorted.sort((a, b) => b.quote.marketCap - a.quote.marketCap);
      break;
    case "volume":
      sorted.sort((a, b) => b.quote.volume - a.quote.volume);
      break;
  }
  return sorted.slice(0, limit);
}

export function getBenefitStocks(): StockSummary[] {
  return listStockSummaries().filter((s) => s.benefit !== undefined);
}

// ---- 業種 / テーマ ----
export function getStocksByIndustry(code: string): StockSummary[] {
  return listStockSummaries().filter((s) => s.company.industryCode === code);
}

export function getStocksByTheme(slug: string): StockSummary[] {
  return listStockSummaries().filter((s) => s.company.themes.includes(slug));
}

export interface SectorAggregate {
  count: number;
  totalMarketCap: number;
  avgPer: number | null;
  avgPbr: number | null;
  avgYield: number | null;
}

function avg(values: (number | null | undefined)[]): number | null {
  const nums = values.filter((v): v is number => typeof v === "number" && !Number.isNaN(v));
  if (nums.length === 0) return null;
  return nums.reduce((a, b) => a + b, 0) / nums.length;
}

/** 業種/テーマの平均指標。単純平均であることを表示側で明示すること。 */
export function aggregateSector(list: StockSummary[]): SectorAggregate {
  return {
    count: list.length,
    totalMarketCap: list.reduce((sum, s) => sum + s.quote.marketCap, 0),
    avgPer: avg(list.map((s) => s.valuation?.per)),
    avgPbr: avg(list.map((s) => s.valuation?.pbr)),
    avgYield: avg(list.map((s) => s.valuation?.dividendYield)),
  };
}

export function listIndustries() {
  return getProviders().company.listIndustries();
}

export function listThemes() {
  return getProviders().company.listThemes();
}

// ---- 株主優待データベース ----
export interface BenefitEntry {
  summary: StockSummary;
  requiredInvestment: number | null;
  benefitYield: number | null;
  dividendYield: number | null;
  totalYield: number | null;
}

export function getBenefitEntries(): BenefitEntry[] {
  return listStockSummaries()
    .filter((s) => s.benefit !== undefined)
    .map((s) => {
      const b = s.benefit!;
      const requiredInvestment = m.minInvestment(s.quote.price, b.requiredShares);
      const benefitYield =
        b.benefitValue && requiredInvestment && requiredInvestment > 0
          ? (b.benefitValue / requiredInvestment) * 100
          : null;
      const dividendYield = s.valuation?.dividendYield ?? null;
      return {
        summary: s,
        requiredInvestment,
        benefitYield,
        dividendYield,
        totalYield: m.totalYield(dividendYield ?? undefined, benefitYield ?? undefined),
      };
    });
}

// ---- 銘柄比較 ----
export interface CompareModel {
  code: string;
  nameJa: string;
  nameEn: string;
  segment: string;
  industryCode: string;
  price: number;
  marketCap: number;
  per: number | null;
  pbr: number | null;
  roe: number | null;
  yieldPct: number | null;
  payoutPct: number | null;
  operatingMargin: number | null;
  minInvestment: number | null;
  consecutiveIncrease: number | null;
  hasBenefit: boolean;
}

export function getCompareModels(): CompareModel[] {
  const p = getProviders();
  return listStockSummaries().map((s) => {
    const fin = p.company.getFinancials(s.company.code)[0];
    return {
      code: s.company.code,
      nameJa: s.company.nameJa,
      nameEn: s.company.nameEn,
      segment: s.company.segment,
      industryCode: s.company.industryCode,
      price: s.quote.price,
      marketCap: s.quote.marketCap,
      per: s.valuation?.per ?? null,
      pbr: s.valuation?.pbr ?? null,
      roe: fin?.roe ?? null,
      yieldPct: s.valuation?.dividendYield ?? null,
      payoutPct: s.valuation?.payoutRatio ?? null,
      operatingMargin: fin?.operatingMargin ?? null,
      minInvestment: s.minInvestment,
      consecutiveIncrease: s.dividend?.consecutiveIncreaseYears ?? null,
      hasBenefit: s.benefit !== undefined,
    };
  });
}

// ---- 配当カレンダー ----
export interface DividendEntry {
  summary: StockSummary;
}

/** 権利確定月ごとにグルーピングした配当予定。予想値であることは表示側で明示。 */
export function getDividendCalendar(): { month: number; entries: StockSummary[] }[] {
  const byMonth = new Map<number, StockSummary[]>();
  for (const s of listStockSummaries()) {
    const rec = s.dividend?.recordDate;
    if (!rec) continue;
    const month = new Date(rec).getUTCMonth() + 1;
    const arr = byMonth.get(month) ?? [];
    arr.push(s);
    byMonth.set(month, arr);
  }
  return [...byMonth.entries()]
    .sort((a, b) => a[0] - b[0])
    .map(([month, entries]) => ({ month, entries }));
}
