// 数値・日付・通貨フォーマットの共通処理。UIで直接 toLocaleString せず必ずここを通す。
import type { Locale } from "@/types";

/** 欠損は "—"。0 と undefined を区別する (欠損をゼロ扱いしない)。 */
export function nz(value: number | null | undefined): value is number {
  return value !== null && value !== undefined && !Number.isNaN(value);
}

export function formatNumber(value: number | null | undefined, digits = 0): string {
  if (!nz(value)) return "—";
  return value.toLocaleString("en-US", {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  });
}

/** 大きな金額を億/兆 (ja) / B・T (en) に丸めて可読化。通貨単位を必ず明示。 */
export function formatYenCompact(value: number | null | undefined, locale: Locale): string {
  if (!nz(value)) return "—";
  const abs = Math.abs(value);
  if (locale === "ja") {
    if (abs >= 1e12) return `${(value / 1e12).toFixed(2)}兆円`;
    if (abs >= 1e8) return `${(value / 1e8).toFixed(1)}億円`;
    if (abs >= 1e4) return `${(value / 1e4).toFixed(0)}万円`;
    return `${formatNumber(value)}円`;
  }
  if (abs >= 1e12) return `¥${(value / 1e12).toFixed(2)}T`;
  if (abs >= 1e9) return `¥${(value / 1e9).toFixed(2)}B`;
  if (abs >= 1e6) return `¥${(value / 1e6).toFixed(1)}M`;
  return `¥${formatNumber(value)}`;
}

export function formatYen(value: number | null | undefined, locale: Locale): string {
  if (!nz(value)) return "—";
  return locale === "ja" ? `${formatNumber(value)}円` : `¥${formatNumber(value)}`;
}

/** 比率は必ず単位付き (%)。 */
export function formatPercent(value: number | null | undefined, digits = 2): string {
  if (!nz(value)) return "—";
  const sign = value > 0 ? "+" : "";
  return `${sign}${value.toFixed(digits)}%`;
}

/** 符号なしの割合表示 (利回り等、方向性のない指標)。 */
export function formatRatio(value: number | null | undefined, digits = 2): string {
  if (!nz(value)) return "—";
  return `${value.toFixed(digits)}%`;
}

export function formatDate(iso: string | null | undefined, locale: Locale): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString(locale === "ja" ? "ja-JP" : "en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    timeZone: "Asia/Tokyo",
  });
}

/** 日時 (JST明示)。データ取得時刻の表示に使う。 */
export function formatDateTimeJst(iso: string | null | undefined, locale: Locale): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  const s = d.toLocaleString(locale === "ja" ? "ja-JP" : "en-US", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Asia/Tokyo",
    hour12: false,
  });
  return `${s} JST`;
}
