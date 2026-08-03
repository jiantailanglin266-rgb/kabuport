// J-Quants スナップショット (src/data/live/jquants.json) を mock の上にマージするプロバイダー。
// 実データがある銘柄は 企業名・株価・52週高安 を実値へ、指標(PER/PBR/利回り)は実株価で再計算。
// スナップショットが空ならこのプロバイダーは使われない (index.ts が判定)。
import snapshotRaw from "@/data/live/jquants.json";
import { mockProviders } from "./mock";
import type { Providers } from "./types";
import type { Company, Provenance, Quote, Valuation } from "@/types";
import * as m from "@/lib/metrics";

interface LiveQuote {
  date?: string; price: number; previousClose: number; open: number; high: number; low: number;
  volume: number; week52High: number | null; week52Low: number | null;
}
interface Snapshot {
  fetchedAt: string | null;
  source: string;
  delayMinutes: number | null;
  companies: Record<string, { nameJa?: string; nameEn?: string; sector33Name?: string; marketName?: string }>;
  quotes: Record<string, LiveQuote>;
  financials: Record<string, unknown>;
}

const snap = snapshotRaw as unknown as Snapshot;
const round = (v: number | null): number | undefined => (v === null ? undefined : Math.round(v * 100) / 100);

export function hasLiveData(): boolean {
  return !!snap.fetchedAt && (Object.keys(snap.quotes).length > 0 || Object.keys(snap.companies).length > 0);
}

function prov(): Provenance {
  return { source: snap.source || "J-Quants API", fetchedAt: snap.fetchedAt!, dataStatus: "verified", delayMinutes: snap.delayMinutes ?? undefined };
}

function mergeCompany(c: Company): Company {
  const l = snap.companies[c.code];
  if (!l) return c;
  return { ...c, nameJa: l.nameJa || c.nameJa, nameEn: l.nameEn || c.nameEn, provenance: prov() };
}

function mergeQuote(q: Quote, company: Company | undefined): Quote {
  const l = snap.quotes[q.code];
  if (!l) return q;
  const shares = company?.sharesOutstanding ?? 0;
  return {
    ...q,
    price: l.price, previousClose: l.previousClose, open: l.open, high: l.high, low: l.low, volume: l.volume,
    tradingValue: Math.round(l.price * l.volume),
    marketCap: shares ? Math.round(l.price * shares) : q.marketCap,
    week52High: l.week52High ?? q.week52High,
    week52Low: l.week52Low ?? q.week52Low,
    provenance: prov(),
  };
}

// 実株価で PER/PBR/配当利回り を再計算し、mock の株価ベース指標との不整合を防ぐ。
function mergeValuation(code: string, v: Valuation | undefined): Valuation | undefined {
  const l = snap.quotes[code];
  if (!v || !l) return v;
  const fin = mockProviders.company.getFinancials(code)[0];
  const div = mockProviders.dividend.getDividend(code);
  return {
    ...v,
    per: fin?.eps ? round(m.per(l.price, fin.eps)) : v.per,
    pbr: fin?.bps ? round(m.pbr(l.price, fin.bps)) : v.pbr,
    dividendYield: div ? round(m.dividendYield(div.annualDividend, l.price)) : v.dividendYield,
    forwardDividendYield: div ? round(m.dividendYield(div.annualDividend, l.price)) : v.forwardDividendYield,
    basis: v.basis.includes("実株価") ? v.basis : `${v.basis} ／ 株価は実データ`,
  };
}

const c = mockProviders.company;
const mk = mockProviders.market;

export const jquantsProviders: Providers = {
  mode: "live",
  company: {
    listCompanies: () => c.listCompanies().map(mergeCompany),
    getCompany: (code) => { const co = c.getCompany(code); return co ? mergeCompany(co) : undefined; },
    getFinancials: (code) => c.getFinancials(code),
    listIndustries: () => c.listIndustries(),
    listThemes: () => c.listThemes(),
  },
  market: {
    listQuotes: () => mk.listQuotes().map((q) => mergeQuote(q, c.getCompany(q.code))),
    getQuote: (code) => { const q = mk.getQuote(code); return q ? mergeQuote(q, c.getCompany(code)) : undefined; },
    getValuation: (code) => mergeValuation(code, mk.getValuation(code)),
    listIndices: () => mk.listIndices(),
  },
  dividend: mockProviders.dividend,
  benefit: mockProviders.benefit,
  disclosure: mockProviders.disclosure,
  earnings: mockProviders.earnings,
  // 動画は J-Quants の対象外（YouTube側のプロバイダーで別途差し替える）
  video: mockProviders.video,
};
