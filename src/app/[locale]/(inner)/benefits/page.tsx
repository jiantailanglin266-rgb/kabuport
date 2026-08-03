import type { Metadata } from "next";
import { notFound } from "next/navigation";
import type { Locale } from "@/types";
import { getDictionary, isLocale } from "@/lib/i18n";
import { buildMetadata } from "@/lib/seo";
import { breadcrumbLd } from "@/lib/jsonld";
import { getBenefitEntries } from "@/lib/queries";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { BenefitScreener } from "@/components/BenefitScreener";
import { JsonLd } from "@/components/JsonLd";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const loc: Locale = isLocale(locale) ? locale : "ja";
  return buildMetadata({ locale: loc, path: "benefits", title: loc === "ja" ? "株主優待データベース" : "Shareholder Benefits", description: loc === "ja" ? "権利確定月・カテゴリー・必要投資額で株主優待を検索。総合利回りで比較（サンプルデータ）。" : "Search shareholder benefits by record month, category and investment; compare total yield (sample data)." });
}

export default async function BenefitsPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const loc = locale as Locale;
  const t = getDictionary(loc);
  const entries = getBenefitEntries();

  return (
    <div className="space-y-6">
      <JsonLd data={breadcrumbLd([{ name: t.brand, path: "" }, { name: loc === "ja" ? "株主優待" : "Benefits", path: "benefits" }], loc)} />
      <Breadcrumbs items={[{ name: t.brand, path: "" }, { name: loc === "ja" ? "株主優待" : "Benefits", path: "benefits" }]} locale={loc} />
      <div>
        <h1 className="text-2xl font-bold text-ink">{loc === "ja" ? "株主優待データベース" : "Shareholder benefits database"}</h1>
        <p className="mt-1 text-sm text-muted">{t.common.sampleData} ・ {loc === "ja" ? "総合利回り＝配当利回り＋優待利回り（優待価値が算出可能な場合）" : "Total yield = dividend yield + benefit yield (where value is computable)"}</p>
      </div>
      <BenefitScreener entries={entries} locale={loc} />
    </div>
  );
}
