import type { Metadata } from "next";
import { notFound } from "next/navigation";
import type { Locale } from "@/types";
import { getDictionary, isLocale, pick } from "@/lib/i18n";
import { buildMetadata } from "@/lib/seo";
import { breadcrumbLd } from "@/lib/jsonld";
import { LOCALES } from "@/types";
import { aggregateSector, getStocksByIndustry, listIndustries } from "@/lib/queries";
import { formatRatio, formatYenCompact } from "@/lib/format";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { MetricCard } from "@/components/MetricCard";
import { StockCard } from "@/components/StockCard";
import { JsonLd } from "@/components/JsonLd";

export function generateStaticParams() {
  return LOCALES.flatMap((locale) => listIndustries().map((i) => ({ locale, code: i.code })));
}

export async function generateMetadata({ params }: { params: Promise<{ locale: string; code: string }> }): Promise<Metadata> {
  const { locale, code } = await params;
  const loc: Locale = isLocale(locale) ? locale : "ja";
  const ind = listIndustries().find((i) => i.code === code);
  if (!ind) return buildMetadata({ locale: loc, path: `industries/${code}`, title: code, description: "", noindex: true });
  const name = pick(loc, ind.nameJa, ind.nameEn);
  return buildMetadata({ locale: loc, path: `industries/${code}`, title: `${name}${loc === "ja" ? "の銘柄・平均指標" : " stocks & averages"}`, description: pick(loc, ind.descriptionJa, ind.descriptionEn) });
}

export default async function IndustryDetailPage({ params }: { params: Promise<{ locale: string; code: string }> }) {
  const { locale, code } = await params;
  if (!isLocale(locale)) notFound();
  const loc = locale as Locale;
  const t = getDictionary(loc);
  const ind = listIndustries().find((i) => i.code === code);
  if (!ind) notFound();
  const name = pick(loc, ind.nameJa, ind.nameEn);
  const stocks = getStocksByIndustry(code).sort((a, b) => b.quote.marketCap - a.quote.marketCap);
  const agg = aggregateSector(stocks);

  return (
    <div className="space-y-6">
      <JsonLd data={breadcrumbLd([{ name: t.brand, path: "" }, { name: loc === "ja" ? "業種" : "Industries", path: "industries" }, { name, path: `industries/${code}` }], loc)} />
      <Breadcrumbs items={[{ name: t.brand, path: "" }, { name: loc === "ja" ? "業種" : "Industries", path: "industries" }, { name, path: `industries/${code}` }]} locale={loc} />
      <div>
        <h1 className="text-2xl font-bold text-ink">{name}</h1>
        <p className="mt-1 text-sm text-muted">{pick(loc, ind.descriptionJa, ind.descriptionEn)}</p>
      </div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <MetricCard label={loc === "ja" ? "銘柄数" : "Stocks"} value={`${agg.count}`} />
        <MetricCard label={loc === "ja" ? "時価総額合計" : "Total mkt cap"} value={formatYenCompact(agg.totalMarketCap, loc)} />
        <MetricCard label={`${loc === "ja" ? "平均" : "Avg"} ${t.common.per}`} value={agg.avgPer ? `${agg.avgPer.toFixed(1)}倍` : "—"} />
        <MetricCard label={`${loc === "ja" ? "平均" : "Avg"} ${t.common.yield}`} value={formatRatio(agg.avgYield)} />
      </div>
      <p className="text-[11px] text-muted">{loc === "ja" ? "平均は掲載サンプル銘柄の単純平均です。" : "Averages are simple means over listed sample stocks."}</p>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {stocks.map((s) => <StockCard key={s.company.code} s={s} locale={loc} />)}
      </div>
    </div>
  );
}
