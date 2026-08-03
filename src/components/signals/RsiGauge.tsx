import { ArrowDownCircle, ArrowUpCircle, MinusCircle } from "lucide-react";
import { clsx } from "clsx";
import type { Locale } from "@/types";
import { RSI_LOWER, RSI_UPPER, rsiStateLabel, type RsiSignal } from "@/lib/rsi";
import { pick } from "@/lib/i18n";

/** シグナルの表示定義。色のみに依存せず、アイコン＋ラベル＋数値を必ず併記する。 */
export const SIGNAL_META: Record<RsiSignal, { ja: string; en: string; cls: string; icon: typeof ArrowUpCircle }> = {
  sell: { ja: "売りシグナル", en: "Sell signal", cls: "border-up/30 bg-up/10 text-up", icon: ArrowUpCircle },
  buy: { ja: "買いシグナル", en: "Buy signal", cls: "border-down/30 bg-down/10 text-down", icon: ArrowDownCircle },
  neutral: { ja: "シグナルなし", en: "No signal", cls: "border-line-strong bg-line/40 text-muted", icon: MinusCircle },
};

export function SignalBadge({ signal, locale, size = "md" }: { signal: RsiSignal; locale: Locale; size?: "sm" | "md" }) {
  const m = SIGNAL_META[signal];
  const Icon = m.icon;
  return (
    <span
      className={clsx(
        "inline-flex items-center gap-1.5 rounded-lg border font-bold",
        m.cls,
        size === "sm" ? "px-2 py-0.5 text-[11px]" : "px-3 py-1.5 text-[12.5px]",
      )}
    >
      <Icon size={size === "sm" ? 12 : 14} aria-hidden />
      {pick(locale, m.ja, m.en)}
    </span>
  );
}

/** 0-100 のRSIゲージ。25以下 / 75以上のゾーンを可視化する。 */
export function RsiGauge({ value, locale, showScale = true }: { value: number | null; locale: Locale; showScale?: boolean }) {
  const ja = locale === "ja";
  const state = rsiStateLabel(value);
  const pos = value === null ? 50 : Math.max(0, Math.min(100, value));

  return (
    <div>
      <div className="relative h-2.5 w-full overflow-hidden rounded-full bg-line">
        {/* 買われ過ぎ / 売られ過ぎゾーン */}
        <span className="absolute inset-y-0 left-0 bg-down/25" style={{ width: `${RSI_LOWER}%` }} aria-hidden />
        <span className="absolute inset-y-0 right-0 bg-up/25" style={{ width: `${100 - RSI_UPPER}%` }} aria-hidden />
        {/* 現在値マーカー */}
        {value !== null && (
          <span
            className="absolute top-1/2 h-4 w-1.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-navy shadow-card dark:bg-white"
            style={{ left: `${pos}%` }}
            aria-hidden
          />
        )}
      </div>
      {showScale && (
        <div className="num mt-1.5 flex justify-between text-[10px] text-muted">
          <span>0</span>
          <span>{RSI_LOWER}</span>
          <span>50</span>
          <span>{RSI_UPPER}</span>
          <span>100</span>
        </div>
      )}
      <span className="sr-only">
        RSI {value === null ? (ja ? "算出不可" : "N/A") : value} — {pick(locale, state.ja, state.en)}
      </span>
    </div>
  );
}
