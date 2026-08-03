import type { Metadata } from "next";
import { notFound } from "next/navigation";
import type { Locale } from "@/types";
import { getDictionary, isLocale, pick } from "@/lib/i18n";
import { buildMetadata } from "@/lib/seo";
import { breadcrumbLd } from "@/lib/jsonld";
import { getRanking, type RankingKey, type StockSummary } from "@/lib/queries";
import { formatNumber, formatRatio, formatYen, formatYenCompact } from "@/lib/format";
import { PriceChange } from "@/components/PriceChange";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { JsonLd } from "@/components/JsonLd";
import Link from "next/link";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const loc: Locale = isLocale(locale) ? locale : "ja";
  const t = getDictionary(loc);
  return buildMetadata({ locale: loc, path: "rankings", title: t.nav.rankings, description: loc === "ja" ? "値上がり・値下がり・高配当・時価総額・出来高ランキング（サンプルデータ・集計条件を明示）。" : "Gainers, losers, high-yield, market-cap and volume rankings (sample data, criteria disclosed)." });
}

export default async function RankingsPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const loc = locale as Locale;
  const t = getDictionary(loc);

  const blocks: { id: RankingKey; title: string; metric: (s: StockSummary) => string; metricLabel: string }[] = [
    { id: "gainers", title: t.home.gainers, metricLabel: t.common.change, metric: () => "" },
    { id: "losers", title: t.home.losers, metricLabel: t.common.change, metric: () => "" },
    { id: "yield", title: t.home.highYield, metricLabel: t.common.yield, metric: (s) => formatRatio(s.valuation?.dividendYield) },
    { id: "marketCap", title: t.common.marketCap, metricLabel: t.common.marketCap, metric: (s) => formatYenCompact(s.quote.marketCap, loc) },
    { id: "volume", title: t.common.volume, metricLabel: t.common.volume, metric: (s) => formatNumber(s.quote.volume) },
  ];

  return (
    <div className="space-y-10">
      <JsonLd data={breadcrumbLd([{ name: t.brand, path: "" }, { name: t.nav.rankings, path: "rankings" }], loc)} />
      <Breadcrumbs items={[{ name: t.brand, path: "" }, { name: t.nav.rankings, path: "rankings" }]} locale={loc} />
      <div>
        <h1 className="text-2xl font-bold text-ink">{t.nav.rankings}</h1>
        <p className="mt-1 text-sm text-muted">
          {loc === "ja" ? "対象: 掲載サンプル銘柄 / 集計: 直近サンプル値 / 更新: デモ固定。" : "Universe: sample stocks / Basis: latest sample values / Update: fixed demo."} {t.common.sampleData}
        </p>
      </div>

      {blocks.map((blk) => {
        const rows = getRanking(blk.id, 10);
        return (
          <section key={blk.id} id={blk.id} className="scroll-mt-24 space-y-3">
            <h2 className="text-lg font-bold text-ink">{blk.title}</h2>
            <div className="overflow-x-auto rounded-2xl border border-line bg-card">
              <table className="w-full min-w-[520px] text-sm">
                <thead>
                  <tr className="border-b border-line text-xs text-muted">
                    <th scope="col" className="p-3 text-left">#</th>
                    <th scope="col" className="p-3 text-left">{loc === "ja" ? "銘柄" : "Stock"}</th>
                    <th scope="col" className="p-3 text-right">{t.common.price}</th>
                    <th scope="col" className="p-3 text-right">{t.common.change}</th>
                    <th scope="col" className="p-3 text-right">{blk.metricLabel}</th>
                  </tr>
                </thead>
                <tbody className="tabular">
                  {rows.map((s, i) => (
                    <tr key={s.company.code} className="border-b border-line/60 last:border-0">
                      <td className="p-3 text-muted">{i + 1}</td>
                      <td className="p-3">
                        <Link href={`/${loc}/stocks/${s.company.code}`} className="font-medium text-ink hover:text-brand">
                          {pick(loc, s.company.nameJa, s.company.nameEn)}
                        </Link>
                        <span className="ml-1 text-xs text-muted">{s.company.code}</span>
                      </td>
                      <td className="p-3 text-right text-ink">{formatYen(s.quote.price, loc)}</td>
                      <td className="p-3 text-right"><PriceChange change={s.change} changePct={s.changePct} size="sm" /></td>
                      <td className="p-3 text-right font-medium text-ink">{blk.metric(s)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        );
      })}
      <p className="text-[11px] text-muted">{loc === "ja" ? "閲覧数や人気度は投資価値を示すものではありません。" : "Views and popularity do not indicate investment merit."}</p>
    </div>
  );
}
