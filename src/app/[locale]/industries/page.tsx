import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { Locale } from "@/types";
import { getDictionary, isLocale, pick } from "@/lib/i18n";
import { buildMetadata } from "@/lib/seo";
import { breadcrumbLd } from "@/lib/jsonld";
import { aggregateSector, getStocksByIndustry, listIndustries } from "@/lib/queries";
import { formatRatio, formatYenCompact } from "@/lib/format";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { JsonLd } from "@/components/JsonLd";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const loc: Locale = isLocale(locale) ? locale : "ja";
  return buildMetadata({ locale: loc, path: "industries", title: loc === "ja" ? "業種一覧" : "Industries", description: loc === "ja" ? "東証33業種ベースの業種別ページ。銘柄数・平均指標・主要銘柄（サンプルデータ）。" : "Sector pages based on TSE industries: counts, average metrics and stocks (sample data)." });
}

export default async function IndustriesPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const loc = locale as Locale;
  const t = getDictionary(loc);

  return (
    <div className="space-y-6">
      <JsonLd data={breadcrumbLd([{ name: t.brand, path: "" }, { name: loc === "ja" ? "業種" : "Industries", path: "industries" }], loc)} />
      <Breadcrumbs items={[{ name: t.brand, path: "" }, { name: loc === "ja" ? "業種" : "Industries", path: "industries" }]} locale={loc} />
      <h1 className="text-2xl font-bold text-ink">{loc === "ja" ? "業種から探す" : "Browse by industry"}</h1>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {listIndustries().map((ind) => {
          const agg = aggregateSector(getStocksByIndustry(ind.code));
          return (
            <Link key={ind.code} href={`/${loc}/industries/${ind.code}`} className="rounded-2xl border border-line bg-card p-4 hover:border-brand">
              <div className="font-semibold text-ink">{pick(loc, ind.nameJa, ind.nameEn)}</div>
              <div className="tabular mt-1 flex gap-3 text-xs text-muted">
                <span>{agg.count} {loc === "ja" ? "銘柄" : "stocks"}</span>
                <span>{t.common.yield} {formatRatio(agg.avgYield)}</span>
                <span>{formatYenCompact(agg.totalMarketCap, loc)}</span>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
