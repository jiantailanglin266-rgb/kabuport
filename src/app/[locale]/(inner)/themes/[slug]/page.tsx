import type { Metadata } from "next";
import { notFound } from "next/navigation";
import type { Locale } from "@/types";
import { LOCALES } from "@/types";
import { getDictionary, isLocale, pick } from "@/lib/i18n";
import { buildMetadata } from "@/lib/seo";
import { breadcrumbLd } from "@/lib/jsonld";
import { aggregateSector, getStocksByTheme, listThemes } from "@/lib/queries";
import { formatRatio, formatYenCompact } from "@/lib/format";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { MetricCard } from "@/components/MetricCard";
import { StockCard } from "@/components/StockCard";
import { JsonLd } from "@/components/JsonLd";

export function generateStaticParams() {
  return LOCALES.flatMap((locale) => listThemes().map((th) => ({ locale, slug: th.slug })));
}

export async function generateMetadata({ params }: { params: Promise<{ locale: string; slug: string }> }): Promise<Metadata> {
  const { locale, slug } = await params;
  const loc: Locale = isLocale(locale) ? locale : "ja";
  const th = listThemes().find((x) => x.slug === slug);
  if (!th) return buildMetadata({ locale: loc, path: `themes/${slug}`, title: slug, description: "", noindex: true });
  const name = pick(loc, th.nameJa, th.nameEn);
  return buildMetadata({ locale: loc, path: `themes/${slug}`, title: `${name}${loc === "ja" ? "の関連銘柄" : " related stocks"}`, description: pick(loc, th.descriptionJa, th.descriptionEn) });
}

export default async function ThemeDetailPage({ params }: { params: Promise<{ locale: string; slug: string }> }) {
  const { locale, slug } = await params;
  if (!isLocale(locale)) notFound();
  const loc = locale as Locale;
  const t = getDictionary(loc);
  const th = listThemes().find((x) => x.slug === slug);
  if (!th) notFound();
  const name = pick(loc, th.nameJa, th.nameEn);
  const stocks = getStocksByTheme(slug).sort((a, b) => b.quote.marketCap - a.quote.marketCap);
  const agg = aggregateSector(stocks);

  return (
    <div className="space-y-6">
      <JsonLd data={breadcrumbLd([{ name: t.brand, path: "" }, { name: loc === "ja" ? "テーマ" : "Themes", path: "themes" }, { name, path: `themes/${slug}` }], loc)} />
      <Breadcrumbs items={[{ name: t.brand, path: "" }, { name: loc === "ja" ? "テーマ" : "Themes", path: "themes" }, { name, path: `themes/${slug}` }]} locale={loc} />
      <div>
        <h1 className="text-2xl font-bold text-ink">{name}</h1>
        <p className="mt-1 text-sm text-muted">{pick(loc, th.descriptionJa, th.descriptionEn)}</p>
      </div>
      {stocks.length > 0 ? (
        <>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <MetricCard label={loc === "ja" ? "銘柄数" : "Stocks"} value={`${agg.count}`} />
            <MetricCard label={loc === "ja" ? "時価総額合計" : "Total mkt cap"} value={formatYenCompact(agg.totalMarketCap, loc)} />
            <MetricCard label={`${loc === "ja" ? "平均" : "Avg"} ${t.common.per}`} value={agg.avgPer ? `${agg.avgPer.toFixed(1)}倍` : "—"} />
            <MetricCard label={`${loc === "ja" ? "平均" : "Avg"} ${t.common.yield}`} value={formatRatio(agg.avgYield)} />
          </div>
          <p className="text-[11px] text-muted">{loc === "ja" ? "テーマとの関連性はサンプル分類です。平均は単純平均。" : "Theme classification is illustrative; averages are simple means."}</p>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {stocks.map((s) => <StockCard key={s.company.code} s={s} locale={loc} />)}
          </div>
        </>
      ) : (
        <div className="rounded-2xl border border-dashed border-line bg-card p-8 text-center text-muted">{t.common.noResults}</div>
      )}
    </div>
  );
}
