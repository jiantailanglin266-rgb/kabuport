import type { Metadata } from "next";
import { notFound } from "next/navigation";
import type { Locale } from "@/types";
import { getDictionary, isLocale } from "@/lib/i18n";
import { buildMetadata } from "@/lib/seo";
import { breadcrumbLd } from "@/lib/jsonld";
import { getCompareModels, listIndustries } from "@/lib/queries";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { StockCompare } from "@/components/StockCompare";
import { JsonLd } from "@/components/JsonLd";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const loc: Locale = isLocale(locale) ? locale : "ja";
  return buildMetadata({ locale: loc, path: "compare", title: loc === "ja" ? "銘柄比較" : "Compare Stocks", description: loc === "ja" ? "最大4銘柄の株価・指標・配当・優待を横並びで比較（サンプルデータ）。" : "Compare up to 4 stocks side by side across price, metrics, dividends and benefits (sample data)." });
}

export default async function ComparePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const loc = locale as Locale;
  const t = getDictionary(loc);

  return (
    <div className="space-y-6">
      <JsonLd data={breadcrumbLd([{ name: t.brand, path: "" }, { name: loc === "ja" ? "銘柄比較" : "Compare", path: "compare" }], loc)} />
      <Breadcrumbs items={[{ name: t.brand, path: "" }, { name: loc === "ja" ? "銘柄比較" : "Compare", path: "compare" }]} locale={loc} />
      <div>
        <h1 className="text-2xl font-bold text-ink">{loc === "ja" ? "銘柄比較" : "Compare stocks"}</h1>
        <p className="mt-1 text-sm text-muted">{loc === "ja" ? "最大4銘柄まで。差分は色と太字で強調（色のみに依存しない表記）。" : "Up to 4 stocks. Best value highlighted in bold, not color alone."} {t.common.sampleData}</p>
      </div>
      <StockCompare models={getCompareModels()} industries={listIndustries()} locale={loc} />
    </div>
  );
}
