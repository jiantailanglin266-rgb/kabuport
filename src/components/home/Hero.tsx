import Link from "next/link";
import { ArrowRight, LineChart, ShieldCheck } from "lucide-react";
import type { Locale } from "@/types";
import type { HeatmapCell, StockSummary } from "@/lib/queries";
import { CountUp } from "@/components/ui/CountUp";
import { HeroDashboard } from "./HeroDashboard";

export function Hero({
  locale,
  indices,
  heatmap,
  ranking,
  stats,
}: {
  locale: Locale;
  indices: { nameJa: string; nameEn: string; value: number; pct: number }[];
  heatmap: HeatmapCell[];
  ranking: StockSummary[];
  stats: { stocks: number; datapoints: number; sectors: number };
}) {
  const ja = locale === "ja";
  const b = `/${locale}`;

  return (
    <section className="relative overflow-hidden bg-hero text-white">
      {/* 装飾: グリッド + マップライン + 粒子（すべてCSS/SVG・極めて控えめ） */}
      <div className="pointer-events-none absolute inset-0 bg-grid opacity-[0.55]" aria-hidden />
      <svg className="pointer-events-none absolute inset-0 h-full w-full opacity-[0.18]" aria-hidden preserveAspectRatio="none" viewBox="0 0 1440 900">
        <path d="M-40 640 C 240 560, 420 700, 700 600 S 1180 420, 1500 500" fill="none" stroke="#4BA3EC" strokeWidth="1.2" />
        <path d="M-40 720 C 280 660, 500 780, 780 690 S 1220 540, 1500 610" fill="none" stroke="#D8B46A" strokeWidth="1" opacity=".7" />
        {[
          [180, 300], [420, 210], [640, 380], [900, 260], [1120, 420], [1290, 190],
          [320, 640], [860, 700], [1180, 660],
        ].map(([cx, cy], i) => (
          <circle key={i} cx={cx} cy={cy} r={i % 3 === 0 ? 2.6 : 1.7} fill={i % 3 === 0 ? "#D8B46A" : "#8FC2F2"} opacity={0.8} />
        ))}
      </svg>
      <div className="pointer-events-none absolute -right-40 -top-40 h-[520px] w-[520px] rounded-full bg-primary/12 blur-[120px]" aria-hidden />

      <div className="shell relative grid items-center gap-14 py-16 sm:py-20 lg:min-h-[860px] lg:grid-cols-[minmax(0,1fr)_minmax(0,1.08fr)] lg:gap-16 lg:py-24">
        {/* 左: コピー */}
        <div className="animate-fade-up">
          <span className="inline-flex items-center gap-2 rounded-full border border-gold/30 bg-gold/10 px-4 py-1.5 text-[11px] font-bold uppercase tracking-widest text-gold">
            <ShieldCheck size={13} /> Japan Equity Intelligence
          </span>

          <h1 className="mt-7 text-balance text-[40px] font-extrabold leading-[1.13] tracking-tight sm:text-[54px] lg:text-[60px]">
            {ja ? (
              <>
                日本株投資を、
                <br />
                <span className="bg-gradient-to-r from-gold-200 via-gold to-gold-600 bg-clip-text text-transparent">
                  もっとスマートに。
                </span>
              </>
            ) : (
              <>
                Smarter investing
                <br />
                <span className="bg-gradient-to-r from-gold-200 via-gold to-gold-600 bg-clip-text text-transparent">
                  in Japanese equities.
                </span>
              </>
            )}
          </h1>

          <p className="mt-6 max-w-xl text-[15px] leading-relaxed text-white/65 sm:text-[17px]">
            {ja
              ? "定量分析と網羅的なマーケットデータを活用した、日本株の情報プラットフォーム。企業情報・業績・配当・株主優待・決算スケジュールを、ひとつの画面で比較・分析できます。"
              : "A Japanese equity platform built on quantitative screens and comprehensive market data. Compare company profiles, results, dividends, benefits and earnings schedules in a single view."}
          </p>

          <div className="mt-9 flex flex-wrap items-center gap-3">
            <Link href={`${b}/stocks`} className="btn-gold btn-lg">
              {ja ? "無料ではじめる" : "Start free"} <ArrowRight size={17} />
            </Link>
            <Link href={`${b}/spotlight`} className="btn-ghost-light btn-lg">
              <LineChart size={17} /> {ja ? "市場を見る" : "View markets"}
            </Link>
          </div>

          {/* 信頼指標 */}
          <dl className="mt-12 grid max-w-lg grid-cols-3 gap-6 border-t border-white/12 pt-8">
            {[
              { v: stats.stocks, s: "+", label: ja ? "掲載銘柄" : "Stocks" },
              { v: stats.datapoints, s: "+", label: ja ? "データ項目" : "Data points" },
              { v: stats.sectors, s: "", label: ja ? "業種カバー" : "Sectors" },
            ].map((it) => (
              <div key={it.label}>
                <dt className="sr-only">{it.label}</dt>
                <dd>
                  <CountUp value={it.v} suffix={it.s} className="num block text-[26px] font-extrabold leading-none text-white sm:text-[30px]" />
                  <span className="mt-2 block text-[11px] font-semibold tracking-wide text-white/45">{it.label}</span>
                </dd>
              </div>
            ))}
          </dl>

          <p className="mt-6 text-[11.5px] leading-relaxed text-white/40">
            {ja
              ? "※ 掲載データはサンプルを含みます。本サイトは投資助言ではなく、特定銘柄の売買を推奨するものではありません。"
              : "Data shown includes sample data. This site is not investment advice and does not recommend any security."}
          </p>
        </div>

        {/* 右: ダッシュボード */}
        <div className="animate-fade-up [animation-delay:180ms]">
          <HeroDashboard indices={indices} heatmap={heatmap} ranking={ranking} locale={locale} />
        </div>
      </div>

      {/* 下端をページ背景へなじませる */}
      <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-b from-transparent to-bg/95" aria-hidden />
    </section>
  );
}
