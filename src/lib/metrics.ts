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

/** 総合利回り (%) = 配当利回り + 優待利回り。片方欠損でも算出。両方欠損は null。 */
export function totalYield(divYieldPct?: number, benefitYieldPct?: number): number | null {
  const a = nz(divYieldPct) ? divYieldPct : 0;
  const b = nz(benefitYieldPct) ? benefitYieldPct : 0;
  if (!nz(divYieldPct) && !nz(benefitYieldPct)) return null;
  return a + b;
}
