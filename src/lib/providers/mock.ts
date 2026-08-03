// モック実装。src/data/*.json を単一の真実とし、typed な各ビューを決定的に導出する。
// すべて dataStatus:"sample" / source:"Sample Data"。実データと誤認させない。
import companiesRaw from "@/data/companies.json";
import industriesRaw from "@/data/industries.json";
import themesRaw from "@/data/themes.json";
import indicesRaw from "@/data/indices.json";
import benefitsRaw from "@/data/benefits.json";
import earningsRaw from "@/data/earnings.json";
import disclosuresRaw from "@/data/disclosures.json";
import type {
  Company, Quote, Valuation, FinancialYear, Dividend, ShareholderBenefit,
  EarningsEvent, Disclosure, MarketIndex, Industry, Theme, Provenance,
} from "@/types";
import * as m from "@/lib/metrics";
import type { Providers } from "./types";

// 決定的なサンプル基準時刻 (SSRハイドレーション不一致を避けるため固定)。
const FETCHED_AT = "2026-08-03T09:00:00+09:00";

function sampleProvenance(delayMinutes?: number): Provenance {
  return { source: "Sample Data", fetchedAt: FETCHED_AT, dataStatus: "sample", delayMinutes };
}

interface Seed {
  price: number; prevClose: number; open: number; high: number; low: number; volume: number;
  w52h: number; w52l: number; ytdh: number; ytdl: number; unit: number;
  revenue: number; opMargin: number; netMargin: number; eps: number; bps: number;
  equity: number; totalAssets: number; cash: number; debt: number; roe: number;
  revGrowth: number; opGrowth: number;
  annualDiv: number; interim: number; yearEnd: number; consecInc: number;
  exDate: string; recordDate: string; divPolicy: string;
}
type RawCompany = Omit<Company, "provenance"> & { seed: Seed };

const RAW = companiesRaw as unknown as RawCompany[];

function toCompany(r: RawCompany): Company {
  const { seed: _seed, ...rest } = r;
  void _seed;
  return { ...rest, provenance: sampleProvenance() };
}

function toQuote(r: RawCompany): Quote {
  const s = r.seed;
  return {
    code: r.code, price: s.price, previousClose: s.prevClose, open: s.open, high: s.high, low: s.low,
    volume: s.volume, tradingValue: Math.round(s.price * s.volume),
    marketCap: Math.round(s.price * (r.sharesOutstanding ?? 0)),
    week52High: s.w52h, week52Low: s.w52l, ytdHigh: s.ytdh, ytdLow: s.ytdl,
    tradingUnit: s.unit, currency: "JPY", provenance: sampleProvenance(20),
  };
}

function toValuation(r: RawCompany): Valuation {
  const s = r.seed;
  return {
    code: r.code,
    per: round(m.per(s.price, s.eps)),
    forwardPer: round(m.per(s.price, s.eps * (1 + s.opGrowth / 100))),
    pbr: round(m.pbr(s.price, s.bps)),
    psr: round(s.revenue > 0 ? (s.price * (r.sharesOutstanding ?? 0)) / s.revenue : null),
    dividendYield: round(m.dividendYield(s.annualDiv, s.price)),
    forwardDividendYield: round(m.dividendYield(s.annualDiv, s.price)),
    payoutRatio: round(m.payoutRatio(s.annualDiv, s.eps)),
    basis: `連結・会社予想 ${fyLabel(r.fiscalYearEndMonth, 2025)}期基準 (サンプル)`,
    provenance: sampleProvenance(),
  };
}

// 3年度分の業績を成長率から後方生成 (最新=会社予想、過去2年=実績)。
function toFinancials(r: RawCompany): FinancialYear[] {
  const s = r.seed;
  const years = [
    { label: fyLabel(r.fiscalYearEndMonth, 2025), forecast: "company_forecast" as const, factor: 1 },
    { label: fyLabel(r.fiscalYearEndMonth, 2024), forecast: "actual" as const, factor: 1 / (1 + s.revGrowth / 100) },
    { label: fyLabel(r.fiscalYearEndMonth, 2023), forecast: "actual" as const, factor: 1 / Math.pow(1 + s.revGrowth / 100, 2) },
  ];
  const cons = r.accountingStandard === "jgaap" ? "consolidated" : "consolidated";
  return years.map((y) => {
    const revenue = Math.round(s.revenue * y.factor);
    const operatingIncome = Math.round(revenue * (s.opMargin / 100));
    const netIncome = Math.round(revenue * (s.netMargin / 100));
    const eps = round2(s.eps * y.factor);
    return {
      code: r.code, fiscalYear: y.label, consolidation: cons, forecastType: y.forecast,
      revenue, operatingIncome, netIncome, eps, bps: s.bps,
      totalAssets: Math.round(s.totalAssets * (0.9 + 0.1 * y.factor)),
      netAssets: Math.round(s.equity * y.factor), equity: Math.round(s.equity * y.factor),
      cash: s.cash, interestBearingDebt: s.debt,
      roe: round(m.roe(netIncome, Math.round(s.equity * y.factor))),
      equityRatio: round(m.equityRatio(Math.round(s.equity * y.factor), s.totalAssets)),
      operatingMargin: s.opMargin,
      freeCashFlow: Math.round(operatingIncome * 0.7),
      provenance: sampleProvenance(),
    };
  });
}

function toDividend(r: RawCompany): Dividend {
  const s = r.seed;
  return {
    code: r.code, fiscalYear: fyLabel(r.fiscalYearEndMonth, 2025), annualDividend: s.annualDiv,
    interim: s.interim, yearEnd: s.yearEnd, forecast: true,
    yieldPct: round(m.dividendYield(s.annualDiv, s.price)),
    payoutRatioPct: round(m.payoutRatio(s.annualDiv, s.eps)),
    consecutiveIncreaseYears: s.consecInc, exRightsDate: s.exDate, recordDate: s.recordDate,
    policy: s.divPolicy, provenance: sampleProvenance(),
  };
}

// ---- helpers ----
function round(v: number | null): number | undefined { return v === null ? undefined : Math.round(v * 100) / 100; }
function round2(v: number): number { return Math.round(v * 100) / 100; }
function fyLabel(endMonth: number, calendarYear: number): string {
  return `${calendarYear}/${String(endMonth).padStart(2, "0")}`;
}

const companies = RAW.map(toCompany);
const quotes = RAW.map(toQuote);
const valuations = new Map(RAW.map((r) => [r.code, toValuation(r)]));
const financials = new Map(RAW.map((r) => [r.code, toFinancials(r)]));
const dividends = RAW.map(toDividend);
const benefits = (benefitsRaw as Omit<ShareholderBenefit, "provenance">[]).map(
  (b): ShareholderBenefit => ({ ...b, provenance: sampleProvenance() }),
);
const earnings = (earningsRaw as Omit<EarningsEvent, "provenance">[]).map(
  (e): EarningsEvent => ({ ...e, provenance: sampleProvenance() }),
);
const disclosures = (disclosuresRaw as Omit<Disclosure, "provenance">[]).map(
  (d): Disclosure => ({ ...d, provenance: sampleProvenance() }),
);
const indices = (indicesRaw as Omit<MarketIndex, "provenance">[]).map(
  (i): MarketIndex => ({ ...i, provenance: sampleProvenance() }),
);

export const mockProviders: Providers = {
  mode: "mock",
  company: {
    listCompanies: () => companies,
    getCompany: (code) => companies.find((c) => c.code === code),
    getFinancials: (code) => financials.get(code) ?? [],
    listIndustries: () => industriesRaw as Industry[],
    listThemes: () => themesRaw as Theme[],
  },
  market: {
    listQuotes: () => quotes,
    getQuote: (code) => quotes.find((q) => q.code === code),
    getValuation: (code) => valuations.get(code),
    listIndices: () => indices,
  },
  dividend: {
    getDividend: (code) => dividends.find((d) => d.code === code),
    listDividends: () => dividends,
  },
  benefit: {
    getBenefit: (code) => benefits.find((b) => b.code === code),
    listBenefits: () => benefits,
  },
  disclosure: {
    listDisclosures: () => [...disclosures].sort((a, b) => b.publishedAt.localeCompare(a.publishedAt)),
    listByCode: (code) => disclosures.filter((d) => d.code === code),
  },
  earnings: { listEarnings: () => earnings },
};
