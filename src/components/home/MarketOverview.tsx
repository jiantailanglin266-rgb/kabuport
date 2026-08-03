import type { Locale, MarketIndex } from "@/types";
import { pick } from "@/lib/i18n";
import { priceChangePercent } from "@/lib/metrics";
import { formatNumber, formatDateTimeJst } from "@/lib/format";
import { priceSeries } from "@/lib/series";
import { Sparkline } from "@/components/Sparkline";
import { Reveal } from "@/components/ui/Reveal";
import { SectionHeading } from "./SectionHeading";

export function MarketOverview({ indices, locale }: { indices: MarketIndex[]; locale: Locale }) {
  const ja = locale === "ja";
  const cards = indices.slice(0, 8);

  return (
    <section className="shell py-16 sm:py-20" aria-labelledby="market-overview">
      <SectionHeading
        eyebrow="Market Overview"
        title={ja ? "マーケット概況" : "Market overview"}
        description={
          ja
            ? "国内外の主要指数・為替・コモディティを一覧で。数値はサンプルデータで、リアルタイム性は保証しません。"
            : "Key domestic and global indices, FX and commodities. Values are sample data and not real-time."
        }
        href={`/${locale}/rankings`}
        hrefLabel={ja ? "ランキングへ" : "Rankings"}
      />
      <h2 id="market-overview" className="sr-only">
        {ja ? "マーケット概況" : "Market overview"}
      </h2>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {cards.map((idx, i) => {
          const pct = priceChangePercent(idx.value, idx.previousClose) ?? 0;
          const up = pct >= 0;
          const series = priceSeries(idx.id, idx.value * 0.965, idx.value * 1.03, idx.value, 22);
          return (
            <Reveal key={idx.id} delay={i * 60}>
              <article className="card card-hover h-full p-5">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="text-[12.5px] font-bold leading-snug text-muted">{pick(locale, idx.nameJa, idx.nameEn)}</h3>
                  <span
                    className={`num shrink-0 rounded-md px-1.5 py-0.5 text-[10.5px] font-extrabold ${
                      up ? "bg-up/10 text-up" : "bg-down/10 text-down"
                    }`}
                  >
                    {up ? "▲" : "▼"} {up ? "+" : ""}
                    {pct.toFixed(2)}%
                  </span>
                </div>
                <div className="num mt-3 text-[23px] font-extrabold leading-none text-ink">
                  {formatNumber(idx.value, idx.value > 100000 ? 0 : 1)}
                </div>
                <div className="mt-1 text-[11px] text-muted">
                  {ja ? "前日" : "Prev"} {formatNumber(idx.previousClose, idx.value > 100000 ? 0 : 1)}
                </div>
                <div className="mt-3">
                  <Sparkline
                    data={series}
                    width={240}
                    height={38}
                    ariaLabel={`${pick(locale, idx.nameJa, idx.nameEn)} ${ja ? "サンプル推移" : "sample trend"}`}
                  />
                </div>
              </article>
            </Reveal>
          );
        })}
      </div>

      <p className="mt-5 text-[11.5px] text-muted">
        {ja ? "データ基準" : "As of"}: {formatDateTimeJst(indices[0]?.provenance.fetchedAt, locale)} ・{" "}
        {ja ? "出典" : "Source"}: {indices[0]?.provenance.source} ・ {ja ? "算出主体は各指数の提供者に帰属します。" : "Index values belong to their respective operators."}
      </p>
    </section>
  );
}
