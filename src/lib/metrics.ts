// ============================================================
// 中核の決定的ロジック (純関数)。UIやAIから独立し、ユニットテスト可能。
// 金融指標の算出はすべてここに集約し、定義・前提を一貫させる。
// ============================================================
import { nz } from "@/lib/format";

/** 前日比 (円)。 */
export function priceChange(price: number, previousClose: number): number {
  return price - previousClose;
}

/** 前日比率 (%)。previousClose<=0 は算出不能として null。 */
export function priceChangePercent(price: number, previousClose: number): number | null {
  if (!nz(previousClose) || previousClose <= 0) return null;
  return ((price - previousClose) / previousClose) * 100;
}

export type Direction = "up" | "down" | "flat";

/** 騰落方向。色のみに依存させないため、記号・矢印・ラベル生成の起点にする。 */
export function direction(delta: number | null | undefined): Direction {
  if (!nz(delta) || delta === 0) return "flat";
  return delta > 0 ? "up" : "down";
}

export function directionSymbol(dir: Direction): string {
  return dir === "up" ? "▲" : dir === "down" ? "▼" : "—";
}

/** 配当利回り (%) = 年間配当 / 株価 * 100。 */
export function dividendYield(annualDividend: number, price: number): number | null {
  if (!nz(price) || price <= 0 || !nz(annualDividend)) return null;
  return (annualDividend / price) * 100;
}

/** 配当性向 (%) = 年間配当 / EPS * 100。 */
export function payoutRatio(annualDividend: number, eps: number): number | null {
  if (!nz(eps) || eps <= 0 || !nz(annualDividend)) return null;
  return (annualDividend / eps) * 100;
}

/** 最低投資金額 (円) = 株価 * 売買単位。 */
export function minInvestment(price: number, tradingUnit: number): number | null {
  if (!nz(price) || !nz(tradingUnit) || tradingUnit <= 0) return null;
  return Math.round(price * tradingUnit);
}

/** PER = 株価 / EPS。 */
export function per(price: number, eps: number): number | null {
  if (!nz(eps) || eps <= 0 || !nz(price)) return null;
  return price / eps;
}

/** PBR = 株価 / BPS。 */
export function pbr(price: number, bps: number): number | null {
  if (!nz(bps) || bps <= 0 || !nz(price)) return null;
  return price / bps;
}

/** ROE (%) = 当期純利益 / 自己資本 * 100。 */
export function roe(netIncome: number, equity: number): number | null {
  if (!nz(equity) || equity <= 0 || !nz(netIncome)) return null;
  return (netIncome / equity) * 100;
}

/** 自己資本比率 (%) = 自己資本 / 総資産 * 100。 */
export function equityRatio(equity: number, totalAssets: number): number | null {
  if (!nz(totalAssets) || totalAssets <= 0 || !nz(equity)) return null;
  return (equity / totalAssets) * 100;
}

/** 前年同期比の成長率 (%)。分母0や符号反転は算出不能として null。 */
export function growthRate(current: number, previous: number): number | null {
  if (!nz(current) || !nz(previous) || previous <= 0) return null;
  return ((current - previous) / previous) * 100;
}

/** 52週高値からの乖離率 (%)。 */
export function deviationFromHigh(price: number, high: number): number | null {
  if (!nz(high) || high <= 0 || !nz(price)) return null;
  return ((price - high) / high) * 100;
}

function clamp01(v: number): number {
  return Math.max(0, Math.min(1, v));
}

export interface TechnicalInput {
  price: number;
  previousClose: number;
  week52High: number;
  week52Low: number;
}

/**
 * テクニカル注目度スコア (0-100)。客観的・決定的な算出。
 * 「売買推奨」ではなく、チャート上の位置づけを可視化するための指標。
 * - rangePos: 52週レンジ内の位置 (高値圏ほど高い) 50%
 * - nearHigh: 52週高値への近さ 30%
 * - dayMomentum: 前日比の勢い 20%
 */
export function technicalScore(q: TechnicalInput): number {
  if (!nz(q.week52High) || !nz(q.week52Low) || q.week52High <= q.week52Low) return 0;
  const rangePos = clamp01((q.price - q.week52Low) / (q.week52High - q.week52Low));
  const dev = deviationFromHigh(q.price, q.week52High) ?? -100; // % (<=0)
  const nearHigh = clamp01(1 + dev / 25); // 高値から-25%で0、高値で1
  const pct = priceChangePercent(q.price, q.previousClose) ?? 0;
  const dayMomentum = clamp01((pct + 3) / 6); // -3%..+3% → 0..1
  const score = 100 * (0.5 * rangePos + 0.3 * nearHigh + 0.2 * dayMomentum);
  return Math.round(score * 10) / 10;
}

/** 総合利回り (%) = 配当利回り + 優待利回り。片方欠損でも算出。両方欠損は null。 */
export function totalYield(divYieldPct?: number, benefitYieldPct?: number): number | null {
  const a = nz(divYieldPct) ? divYieldPct : 0;
  const b = nz(benefitYieldPct) ? benefitYieldPct : 0;
  if (!nz(divYieldPct) && !nz(benefitYieldPct)) return null;
  return a + b;
}
