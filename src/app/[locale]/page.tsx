import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight, CalendarClock, Gift, ShieldCheck } from "lucide-react";
import type { Locale } from "@/types";
import { getDictionary, isLocale, pick } from "@/lib/i18n";
import { buildMetadata } from "@/lib/seo";
import { organizationLd, websiteLd, faqLd } from "@/lib/jsonld";
import { getDataset } from "@/lib/dataset";
import {
  getBenefitEntries, getRanking, getRecentDisclosures, getSectorHeatmap,
  getSpotlightStocks, getUpcomingEarnings, listStockSummaries, listThemes, getStocksByTheme, listVideos,
  getRsiEntries,
} from "@/lib/queries";
import { VideoCard } from "@/components/video/VideoCard";
import { RsiGauge, SignalBadge } from "@/components/signals/RsiGauge";
import { PriceChange } from "@/components/PriceChange";
import { RSI_LOWER, RSI_PERIOD, RSI_UPPER } from "@/lib/rsi";
import { getProviders } from "@/lib/providers";
import { priceChangePercent } from "@/lib/metrics";
import { formatDate, formatNumber, formatRatio, formatYen, formatYenCompact } from "@/lib/format";
import { JsonLd } from "@/components/JsonLd";
import { Reveal } from "@/components/ui/Reveal";
import { Hero } from "@/components/home/Hero";
import { MarketOverview } from "@/components/home/MarketOverview";
import { LiveMarketSection } from "@/components/market/LiveMarketSection";
import { SectionHeading } from "@/components/home/SectionHeading";
import { RankingTabs, type RankTab } from "@/components/home/RankingTabs";
import { QuantScores } from "@/components/home/QuantScores";
import { SectorHeatmap } from "@/components/home/SectorHeatmap";
import { ThemeGrid, type ThemeCardData } from "@/components/home/ThemeGrid";
import { NewsFeed, type NewsItem } from "@/components/home/NewsFeed";
import { IpoSection, type IpoItem } from "@/components/home/IpoSection";
import { ScreenerCard, type ScreenRow } from "@/components/home/ScreenerCard";
import { AssistantDemo, type AssistantRow } from "@/components/home/AssistantDemo";
import faqsRaw from "@/data/faqs.json";
import newsRaw from "@/data/news.json";
import ipoRaw from "@/data/ipo.json";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const loc: Locale = isLocale(locale) ? locale : "ja";
  const ja = loc === "ja";
  return buildMetadata({
    locale: loc,
    path: "",
    title: ja ? "KABUPORT | 日本株投資を、もっとスマートに。" : "KABUPORT | Smarter investing in Japanese equities",
    description: ja
      ? "日本株の企業情報・株価・業績・配当・株主優待・決算スケジュール・IPO・テーマ株を、定量分析とともに比較できる株式情報プラットフォーム。"
      : "Compare Japanese equities across profiles, prices, results, dividends, benefits, earnings, IPOs and themes with quantitative screens.",
  });
}

export default async function HomePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const loc = locale as Locale;
  const t = getDictionary(loc);
  const ja = loc === "ja";
  const company = getProviders().company;

  // --- データ収集 ---
  const dataset = getDataset();
  const heatmap = getSectorHeatmap();
  const all = listStockSummaries();
  const gainers = getRanking("gainers", 6);
  const losers = getRanking("losers", 6);
  const byVolume = getRanking("volume", 6);
  const byTurnover = [...all].sort((a, b) => b.quote.tradingValue - a.quote.tradingValue).slice(0, 6);
  const spotlight = getSpotlightStocks(6);
  const earnings = getUpcomingEarnings(5);
  const benefits = getBenefitEntries()
    .sort((a, b) => (b.totalYield ?? 0) - (a.totalYield ?? 0))
    .slice(0, 4);
  const disclosures = getRecentDisclosures(6);
  const videos = listVideos().slice(0, 4);
  const rsiEntries = getRsiEntries();
  const rsiSells = rsiEntries.filter((e) => e.signal === "sell");
  const rsiBuys = rsiEntries.filter((e) => e.signal === "buy");
  const rsiHighlights = [...rsiSells.slice(0, 3), ...rsiBuys.slice(0, 3)];

  const segLabel = (s: string) => t.segments[s] ?? s;
  const toRow = (s: (typeof all)[number], metric: string) => ({
    code: s.company.code,
    name: pick(loc, s.company.nameJa, s.company.nameEn),
    segment: segLabel(s.company.segment),
    price: formatYen(s.quote.price, loc),
    changePct: s.changePct ?? 0,
    metric,
  });

  const rankTabs: RankTab[] = [
    { key: "gainers", label: ja ? "値上がり" : "Gainers", metricLabel: ja ? "出来高" : "Volume", rows: gainers.map((s) => toRow(s, formatNumber(s.quote.volume))) },
    { key: "losers", label: ja ? "値下がり" : "Losers", metricLabel: ja ? "出来高" : "Volume", rows: losers.map((s) => toRow(s, formatNumber(s.quote.volume))) },
    { key: "volume", label: ja ? "出来高" : "Volume", metricLabel: ja ? "出来高" : "Volume", rows: byVolume.map((s) => toRow(s, formatNumber(s.quote.volume))) },
    { key: "turnover", label: ja ? "売買代金" : "Turnover", metricLabel: ja ? "売買代金" : "Turnover", rows: byTurnover.map((s) => toRow(s, formatYenCompact(s.quote.tradingValue, loc))) },
    { key: "quant", label: ja ? "定量スコア" : "Quant score", metricLabel: ja ? "スコア" : "Score", rows: spotlight.map((p) => toRow(p.summary, p.score.toFixed(0))) },
  ];

  const themeCards: ThemeCardData[] = listThemes()
    .map((theme) => {
      const list = getStocksByTheme(theme.slug);
      const pcts = list.map((s) => s.changePct).filter((v): v is number => v !== null);
      return {
        theme,
        count: list.length,
        avgChangePct: pcts.length ? pcts.reduce((a, b) => a + b, 0) / pcts.length : 0,
      };
    })
    .filter((x) => x.count > 0)
    .slice(0, 8);

  const screenRows: ScreenRow[] = all.map((s) => {
    const fin = company.getFinancials(s.company.code);
    const cur = fin[0];
    const prev = fin[1];
    const revGrowth = cur && prev && prev.revenue > 0 ? ((cur.revenue - prev.revenue) / prev.revenue) * 100 : null;
    return {
      code: s.company.code,
      name: pick(loc, s.company.nameJa, s.company.nameEn),
      per: s.valuation?.per ?? null,
      pbr: s.valuation?.pbr ?? null,
      roe: cur?.roe ?? null,
      yieldPct: s.valuation?.dividendYield ?? null,
      equityRatio: cur?.equityRatio ?? null,
      marketCapOku: Math.round(s.quote.marketCap / 1e8),
      revGrowth,
    };
  });

  const assistantRows: AssistantRow[] = all.map((s) => ({
    code: s.company.code,
    name: pick(loc, s.company.nameJa, s.company.nameEn),
    per: s.valuation?.per ?? null,
    yieldPct: s.valuation?.dividendYield ?? null,
    changePct: s.changePct ?? 0,
    hasBenefit: s.benefit !== undefined,
  }));

  const faqs = (faqsRaw as { qJa: string; aJa: string; qEn: string; aEn: string }[]).map((f) => ({
    q: pick(loc, f.qJa, f.qEn),
    a: pick(loc, f.aJa, f.aEn),
  }));

  return (
    <>
      <JsonLd data={[organizationLd(), websiteLd(loc), faqLd(faqs)]} />

      {/* ① Hero */}
      <Hero
        locale={loc}
        meta={dataset.meta}
        counts={{ stocks: dataset.stocks.length, disclosures: dataset.disclosures.length }}
        stats={{ stocks: all.length, datapoints: 120, sectors: heatmap.length }}
      />

      {/* ② Market Overview（公式ウィジェット埋め込み。当サイトは株価を再配信しない） */}
      <LiveMarketSection locale={loc} />

      {/* 指数の公式サイト導線 + データ接続状況 */}
      <MarketOverview meta={dataset.meta} breadth={null} locale={loc} />

      {/* ③ 人気ランキング */}
      <section className="bg-surface py-16 sm:py-20">
        <div className="shell">
          <SectionHeading
            eyebrow="Rankings"
            title={ja ? "人気ランキング" : "Market rankings"}
            description={ja ? "値上がり・値下がり・出来高・売買代金・定量スコアの上位銘柄。集計条件を明示しています。" : "Gainers, losers, volume, turnover and quant score leaders, with criteria disclosed."}
            href={`/${loc}/rankings`}
            hrefLabel={ja ? "すべて見る" : "See all"}
          />
          <Reveal>
            <RankingTabs tabs={rankTabs} locale={loc} />
          </Reveal>
        </div>
      </section>

      {/* ④ AI・定量分析 */}
      <QuantScores picks={spotlight} locale={loc} />

      {/* RSI売買シグナル */}
      <section className="shell py-16 sm:py-20">
        <SectionHeading
          eyebrow="RSI Signals"
          title={ja ? "RSIシグナル銘柄" : "RSI signal screen"}
          description={
            ja
              ? `日足RSI(${RSI_PERIOD})が${RSI_UPPER}超で売りシグナル、${RSI_LOWER}未満で買いシグナルとして機械的に抽出。算出式は全公開しています（売買推奨ではありません）。`
              : `Mechanical screen: daily RSI(${RSI_PERIOD}) above ${RSI_UPPER} flags a sell signal, below ${RSI_LOWER} a buy signal. Formula disclosed; not a recommendation.`
          }
          href={`/${loc}/signals`}
          hrefLabel={ja ? "シグナル一覧へ" : "All signals"}
        />

        <div className="mb-5 flex flex-wrap gap-3">
          <span className="inline-flex items-center gap-2 rounded-xl border border-up/30 bg-up/10 px-4 py-2.5">
            <SignalBadge signal="sell" locale={loc} size="sm" />
            <span className="num text-[15px] font-extrabold text-ink">{rsiSells.length}</span>
          </span>
          <span className="inline-flex items-center gap-2 rounded-xl border border-down/30 bg-down/10 px-4 py-2.5">
            <SignalBadge signal="buy" locale={loc} size="sm" />
            <span className="num text-[15px] font-extrabold text-ink">{rsiBuys.length}</span>
          </span>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {rsiHighlights.map((e, i) => (
            <Reveal key={e.summary.company.code} delay={i * 60}>
              <Link href={`/${loc}/stocks/${e.summary.company.code}`} className="card card-hover flex h-full flex-col p-5">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h3 className="truncate text-[15px] font-extrabold text-ink">
                      {pick(loc, e.summary.company.nameJa, e.summary.company.nameEn)}
                    </h3>
                    <div className="num mt-0.5 text-[11px] text-muted">{e.summary.company.code}</div>
                  </div>
                  <div className="shrink-0 text-right">
                    <div className="num text-[24px] font-extrabold leading-none text-ink">{e.rsi?.toFixed(1) ?? "—"}</div>
                    <div className="text-[9px] font-bold uppercase tracking-widest text-muted">RSI</div>
                  </div>
                </div>
                <div className="mt-4">
                  <RsiGauge value={e.rsi} locale={loc} showScale={false} />
                </div>
                <div className="mt-4 flex items-center justify-between rule-top">
                  <SignalBadge signal={e.signal} locale={loc} size="sm" />
                  <PriceChange change={e.summary.change} changePct={e.summary.changePct} size="sm" />
                </div>
              </Link>
            </Reveal>
          ))}
        </div>
      </section>

      {/* ⑤ 業種ヒートマップ */}
      <div className="bg-surface">
        <SectorHeatmap cells={heatmap} locale={loc} />
      </div>

      {/* ⑥ テーマ株 */}
      <ThemeGrid items={themeCards} locale={loc} />

      {/* 動画ライブラリ */}
      <section className="shell py-16 sm:py-20">
        <SectionHeading
          eyebrow="Video Library"
          title={ja ? "動画で学ぶ・相場を追う" : "Learn and follow markets on video"}
          description={ja ? "相場解説・決算の読み方・配当・新NISA・銘柄分析の動画をカテゴリー別に。（モックデータ）" : "Market commentary, earnings, dividends, NISA and analysis by category. (Mock data)"}
          href={`/${loc}/videos`}
          hrefLabel={ja ? "動画一覧へ" : "All videos"}
        />
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {videos.map((v, i) => (
            <Reveal key={v.id} delay={i * 60}>
              <VideoCard video={v} locale={loc} compact />
            </Reveal>
          ))}
        </div>
      </section>

      {/* ⑦ ニュース + 適時開示 */}
      <div className="bg-surface">
        <NewsFeed news={newsRaw as NewsItem[]} disclosures={disclosures} locale={loc} />
      </div>

      {/* ⑧ IPO */}
      <IpoSection items={ipoRaw as IpoItem[]} locale={loc} />

      {/* ⑨ スクリーニング */}
      <section className="shell py-16 sm:py-20">
        <SectionHeading
          eyebrow="Screening"
          title={ja ? "投資条件から銘柄を絞り込む" : "Screen by investment criteria"}
          description={ja ? "PER・PBR・ROE・配当利回り・自己資本比率・増収率・時価総額でリアルタイムに絞り込めます。" : "Filter instantly by P/E, P/B, ROE, yield, equity ratio, revenue growth and market cap."}
          href={`/${loc}/stocks#screener`}
          hrefLabel={ja ? "詳細検索" : "Advanced"}
        />
        <Reveal>
          <ScreenerCard rows={screenRows} locale={loc} />
        </Reveal>
      </section>

      {/* ⑩ カレンダー + 優待 + アシスタント */}
      <section className="bg-surface py-16 sm:py-20">
        <div className="shell grid gap-6 lg:grid-cols-[1fr_1.15fr]">
          <div className="grid gap-6">
            {/* 決算予定 */}
            <Reveal>
              <div className="card h-full overflow-hidden">
                <div className="flex items-center justify-between border-b border-line px-5 py-4">
                  <h3 className="flex items-center gap-2 text-[14px] font-extrabold text-ink">
                    <CalendarClock size={16} className="text-gold-600" aria-hidden />
                    {ja ? "決算発表予定" : "Upcoming earnings"}
                  </h3>
                  <Link href={`/${loc}/earnings`} className="text-[12px] font-bold text-primary hover:underline">
                    {ja ? "カレンダー" : "Calendar"}
                  </Link>
                </div>
                <ul className="divide-y divide-line">
                  {earnings.map((e, i) => {
                    const c = company.getCompany(e.code);
                    return (
                      <li key={`${e.code}-${i}`}>
                        <Link href={`/${loc}/stocks/${e.code}`} className="flex items-center gap-3 px-5 py-3.5 transition-colors hover:bg-bg">
                          <span className="num w-[86px] shrink-0 text-[11.5px] font-bold text-muted">{formatDate(e.scheduledDate, loc)}</span>
                          <span className="min-w-0 flex-1 truncate text-[13.5px] font-bold text-ink">
                            {c ? pick(loc, c.nameJa, c.nameEn) : e.code}
                          </span>
                          {e.announced && <span className="chip shrink-0 border-success/30 bg-success/10 text-success">{ja ? "発表済" : "Done"}</span>}
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </div>
            </Reveal>

            {/* 優待 */}
            <Reveal delay={80}>
              <div className="card h-full overflow-hidden">
                <div className="flex items-center justify-between border-b border-line px-5 py-4">
                  <h3 className="flex items-center gap-2 text-[14px] font-extrabold text-ink">
                    <Gift size={16} className="text-gold-600" aria-hidden />
                    {ja ? "総合利回りの高い株主優待" : "Top total-yield benefits"}
                  </h3>
                  <Link href={`/${loc}/benefits`} className="text-[12px] font-bold text-primary hover:underline">
                    {ja ? "一覧" : "All"}
                  </Link>
                </div>
                <ul className="divide-y divide-line">
                  {benefits.map((b) => (
                    <li key={b.summary.company.code}>
                      <Link href={`/${loc}/stocks/${b.summary.company.code}`} className="flex items-center gap-3 px-5 py-3.5 transition-colors hover:bg-bg">
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-[13.5px] font-bold text-ink">
                            {pick(loc, b.summary.company.nameJa, b.summary.company.nameEn)}
                          </span>
                          <span className="num text-[11px] text-muted">
                            {ja ? "必要投資額" : "Investment"} {formatYenCompact(b.requiredInvestment, loc)}
                          </span>
                        </span>
                        <span className="num shrink-0 text-right">
                          <span className="block text-[14px] font-extrabold text-ink">{formatRatio(b.totalYield)}</span>
                          <span className="text-[10px] text-muted">{ja ? "総合利回り" : "total yield"}</span>
                        </span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            </Reveal>
          </div>

          <Reveal delay={140}>
            <AssistantDemo rows={assistantRows} locale={loc} />
          </Reveal>
        </div>
      </section>

      {/* FAQ + CTA */}
      <section className="shell py-16 sm:py-20">
        <div className="grid gap-10 lg:grid-cols-[1fr_1.25fr]">
          <div>
            <SectionHeading eyebrow="FAQ" title={ja ? "よくあるご質問" : "Frequently asked questions"} />
            <div className="card overflow-hidden">
              {faqs.map((f, i) => (
                <details key={i} className="group border-b border-line last:border-0">
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-4 px-5 py-4 text-[13.5px] font-bold text-ink transition-colors hover:bg-bg marker:hidden">
                    {f.q}
                    <span className="shrink-0 text-muted transition-transform duration-300 group-open:rotate-45" aria-hidden>
                      +
                    </span>
                  </summary>
                  <p className="px-5 pb-5 text-[13px] leading-relaxed text-muted">{f.a}</p>
                </details>
              ))}
            </div>
          </div>

          <Reveal delay={80}>
            <div className="relative h-full overflow-hidden rounded-3xl bg-hero p-8 text-white sm:p-12">
              <div className="pointer-events-none absolute inset-0 bg-grid opacity-50" aria-hidden />
              <div className="relative">
                <span className="eyebrow text-gold">
                  <span className="h-px w-6 bg-gold" aria-hidden />
                  Get Started
                </span>
                <h2 className="mt-3 text-[26px] font-extrabold leading-snug tracking-tight sm:text-[32px]">
                  {ja ? "必要な日本株データを、ひとつの画面で。" : "Every Japanese equity metric, in one view."}
                </h2>
                <p className="mt-4 max-w-md text-[14px] leading-relaxed text-white/65">
                  {ja
                    ? "登録不要で、銘柄検索・スクリーニング・比較・定量分析・決算/配当カレンダーをすべて無料でご利用いただけます。"
                    : "Search, screen, compare, analyze and track earnings and dividends — all free, no account required."}
                </p>
                <div className="mt-8 flex flex-wrap gap-3">
                  <Link href={`/${loc}/stocks`} className="btn-gold">
                    {ja ? "銘柄を探す" : "Find stocks"} <ArrowRight size={16} />
                  </Link>
                  <Link href={`/${loc}/compare`} className="btn-ghost-light">
                    {ja ? "銘柄を比較する" : "Compare stocks"}
                  </Link>
                </div>
                <div className="mt-10 flex items-start gap-2.5 border-t border-white/12 pt-6">
                  <ShieldCheck size={16} className="mt-0.5 shrink-0 text-gold" aria-hidden />
                  <p className="text-[11.5px] leading-relaxed text-white/50">{t.home.riskBody}</p>
                </div>
              </div>
            </div>
          </Reveal>
        </div>
      </section>
    </>
  );
}
