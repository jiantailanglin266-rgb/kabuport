import Link from "next/link";
import { Cpu, Info } from "lucide-react";
import type { Locale } from "@/types";
import type { SpotlightStock } from "@/lib/queries";
import { pick } from "@/lib/i18n";
import { formatRatio, formatYen } from "@/lib/format";
import { priceChangePercent } from "@/lib/metrics";
import { Sparkline } from "@/components/Sparkline";
import { Reveal } from "@/components/ui/Reveal";
import { SectionHeading } from "./SectionHeading";

/**
 * 定量スコア（アルゴリズムによる客観スクリーン）。
 * 「買い/中立/売り」といった投資判断ラベルは付けず、チャート上の位置づけのみを示す。
 */
function positionLabel(rangePos: number, locale: Locale) {
  if (rangePos >= 0.8) return { ja: "高値圏", en: "Near highs", cls: "bg-gold/12 text-gold-600 border-gold/30" };
  if (rangePos >= 0.55) return { ja: "レンジ上位", en: "Upper range", cls: "bg-primary/10 text-primary border-primary/25" };
  if (rangePos >= 0.3) return { ja: "レンジ中位", en: "Mid range", cls: "bg-line/60 text-ink-2 border-line-strong" };
  return { ja: "安値圏", en: "Near lows", cls: "bg-down/10 text-down border-down/25" };
}

export function QuantScores({ picks, locale }: { picks: SpotlightStock[]; locale: Locale }) {
  const ja = locale === "ja";

  return (
    <section className="shell py-16 sm:py-20">
      <SectionHeading
        eyebrow="Quantitative Screen"
        title={ja ? "AI・定量分析による注目銘柄" : "Stocks in quantitative focus"}
        description={
          ja
            ? "52週レンジ内の位置(50%)・高値への近さ(30%)・前日比の勢い(20%)から算出した客観スコア。算出式は公開しており、閲覧数や人気度は含みません。"
            : "An objective score from 52-week range position (50%), proximity to highs (30%) and daily momentum (20%). The formula is disclosed; popularity is excluded."
        }
        href={`/${locale}/spotlight`}
        hrefLabel={ja ? "分析一覧へ" : "All analysis"}
      />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {picks.map((p, i) => {
          const s = p.summary;
          const q = s.quote;
          const rangePos = Math.max(0, Math.min(1, (q.price - q.week52Low) / Math.max(1, q.week52High - q.week52Low)));
          const pos = positionLabel(rangePos, locale);
          const devHigh = ((q.price - q.week52High) / q.week52High) * 100;
          const mom = priceChangePercent(q.price, q.previousClose) ?? 0;
          const name = pick(locale, s.company.nameJa, s.company.nameEn);

          const bars = [
            { label: ja ? "レンジ内の位置" : "Range position", v: rangePos * 100 },
            { label: ja ? "高値への近さ" : "Near 52w high", v: Math.max(0, Math.min(100, 100 + devHigh * 4)) },
            { label: ja ? "前日比の勢い" : "Momentum", v: Math.max(0, Math.min(100, (mom + 3) / 6 * 100)) },
          ];

          return (
            <Reveal key={s.company.code} delay={i * 70} as="article">
              <Link href={`/${locale}/stocks/${s.company.code}`} className="card card-hover flex h-full flex-col p-6">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h3 className="truncate text-[16px] font-extrabold tracking-tight text-ink">{name}</h3>
                    <div className="num mt-1 text-[11.5px] text-muted">
                      {s.company.code} ・ {q.provenance.delayMinutes ? `${q.provenance.delayMinutes}${ja ? "分遅延" : "m delay"}` : ja ? "遅延あり" : "delayed"}
                    </div>
                  </div>
                  <div className="shrink-0 text-right">
                    <div className="num text-[30px] font-extrabold leading-none text-ink">{p.score.toFixed(0)}</div>
                    <div className="text-[9.5px] font-bold uppercase tracking-widest text-muted">Score</div>
                  </div>
                </div>

                <div className="mt-4">
                  <Sparkline data={p.series} width={320} height={52} ariaLabel={`${name} ${ja ? "サンプル推移" : "sample trend"}`} />
                </div>

                <div className="mt-4 flex items-baseline justify-between">
                  <span className="num text-[19px] font-extrabold text-ink">{formatYen(q.price, locale)}</span>
                  <span className={`num text-[13px] font-extrabold ${s.change >= 0 ? "text-up" : "text-down"}`}>
                    {s.change >= 0 ? "▲ +" : "▼ "}
                    {(s.changePct ?? 0).toFixed(2)}%
                  </span>
                </div>

                {/* スコア内訳 */}
                <dl className="mt-5 space-y-2.5">
                  {bars.map((bar) => (
                    <div key={bar.label} className="flex items-center gap-3">
                      <dt className="w-[104px] shrink-0 text-[10.5px] font-semibold text-muted">{bar.label}</dt>
                      <dd className="flex flex-1 items-center gap-2">
                        <span className="h-1.5 flex-1 overflow-hidden rounded-full bg-line">
                          <span
                            className="block h-full rounded-full bg-gradient-to-r from-primary/70 to-primary"
                            style={{ width: `${bar.v.toFixed(0)}%` }}
                          />
                        </span>
                        <span className="num w-8 shrink-0 text-right text-[10.5px] font-bold text-ink-2">{bar.v.toFixed(0)}</span>
                      </dd>
                    </div>
                  ))}
                </dl>

                <div className="mt-5 flex items-center justify-between gap-2 rule-top">
                  <span className={`rounded-lg border px-2.5 py-1 text-[11px] font-bold ${pos.cls}`}>{pick(locale, pos.ja, pos.en)}</span>
                  <span className="num text-[11.5px] text-muted">
                    {ja ? "配当利回り" : "Yield"} <b className="text-ink-2">{formatRatio(s.valuation?.dividendYield)}</b>
                  </span>
                </div>
              </Link>
            </Reveal>
          );
        })}
      </div>

      <div className="mt-6 flex items-start gap-2.5 rounded-2xl border border-line bg-card p-4">
        <Info size={15} className="mt-0.5 shrink-0 text-gold-600" aria-hidden />
        <p className="text-[12px] leading-relaxed text-muted">
          <Cpu size={12} className="mr-1 inline-block align-middle" aria-hidden />
          {ja
            ? "スコアはルールベースのアルゴリズムによる客観指標であり、売買の推奨・投資助言ではありません。「高値圏」等の表示はチャート上の位置づけを示すもので、将来の値動きを示唆しません。株価はサンプルデータです。"
            : "Scores come from a rule-based algorithm and are not investment advice or a recommendation. Labels describe chart position only and do not imply future performance. Prices are sample data."}
        </p>
      </div>
    </section>
  );
}
