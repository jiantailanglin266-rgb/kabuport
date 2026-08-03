import type { Locale, MarketIndex } from "@/types";
import { pick } from "@/lib/i18n";
import { priceChangePercent } from "@/lib/metrics";
import { formatNumber } from "@/lib/format";

/**
 * ヘッダー上部の市場ティッカー。CSSアニメーションのみ（JSゼロ）で軽量。
 * データはサンプルのため、帯の先頭に必ず SAMPLE 表記を出す。
 */
export function MarketTicker({ indices, locale }: { indices: MarketIndex[]; locale: Locale }) {
  const ja = locale === "ja";
  const items = indices.map((i) => {
    const pct = priceChangePercent(i.value, i.previousClose) ?? 0;
    return { name: pick(locale, i.nameJa, i.nameEn), value: i.value, pct };
  });
  const loop = [...items, ...items];

  return (
    <div className="hidden border-b border-white/10 bg-navy text-white md:block">
      <div className="flex h-9 items-center">
        <span className="z-10 flex h-9 shrink-0 items-center gap-1.5 bg-navy pl-5 pr-4 text-[10px] font-bold uppercase tracking-widest text-gold sm:pl-8">
          <span className="h-1.5 w-1.5 animate-pulse-dot rounded-full bg-gold" aria-hidden />
          {ja ? "サンプル配信" : "Sample feed"}
        </span>
        <div className="relative flex-1 overflow-hidden mask-fade-r">
          <div className="flex w-max animate-ticker items-center gap-8 whitespace-nowrap will-change-transform">
            {loop.map((it, i) => {
              const up = it.pct >= 0;
              return (
                <span key={`${it.name}-${i}`} className="flex items-center gap-2 text-[12px]">
                  <span className="font-semibold text-white/70">{it.name}</span>
                  <span className="num font-bold text-white">{formatNumber(it.value, 1)}</span>
                  <span className={`num font-bold ${up ? "text-up" : "text-down"}`}>
                    {up ? "▲" : "▼"} {up ? "+" : ""}
                    {it.pct.toFixed(2)}%
                  </span>
                </span>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
