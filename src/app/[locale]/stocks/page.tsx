import type { Metadata } from "next";
import { notFound } from "next/navigation";
import type { Locale } from "@/types";
import { getDictionary, isLocale } from "@/lib/i18n";
import { buildMetadata } from "@/lib/seo";
import { breadcrumbLd } from "@/lib/jsonld";
import { listStockSummaries } from "@/lib/queries";
import { getProviders } from "@/lib/providers";
import { StockScreener } from "@/components/StockScreener";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { JsonLd } from "@/components/JsonLd";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const loc: Locale = isLocale(locale) ? locale : "ja";
  const t = getDictionary(loc);
  return buildMetadata({
    locale: loc,
    path: "stocks",
    title: t.nav.stocks,
    description: loc === "ja" ? "企業名・証券コード・業種・指標で日本株を検索・スクリーニング。すべてサンプルデータ。" : "Search and screen Japanese stocks by name, ticker, sector and metrics. All sample data.",
  });
}

export default async function StocksPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const loc = locale as Locale;
  const t = getDictionary(loc);

  const summaries = listStockSummaries();
  const industries = getProviders().company.listIndustries();

  return (
    <div className="space-y-6">
      <JsonLd data={breadcrumbLd([{ name: t.brand, path: "" }, { name: t.nav.stocks, path: "stocks" }], loc)} />
      <Breadcrumbs items={[{ name: t.brand, path: "" }, { name: t.nav.stocks, path: "stocks" }]} locale={loc} />
      <div>
        <h1 className="text-2xl font-bold text-ink">{t.screener.title}</h1>
        <p className="mt-1 text-sm text-muted">{t.common.sampleData} ・ {t.common.notInvestmentAdvice}</p>
      </div>
      <StockScreener summaries={summaries} industries={industries} locale={loc} />
    </div>
  );
}
