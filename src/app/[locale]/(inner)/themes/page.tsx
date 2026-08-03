import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { Locale } from "@/types";
import { getDictionary, isLocale, pick } from "@/lib/i18n";
import { buildMetadata } from "@/lib/seo";
import { breadcrumbLd } from "@/lib/jsonld";
import { getStocksByTheme, listThemes } from "@/lib/queries";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { JsonLd } from "@/components/JsonLd";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const loc: Locale = isLocale(locale) ? locale : "ja";
  return buildMetadata({ locale: loc, path: "themes", title: loc === "ja" ? "テーマ一覧" : "Themes", description: loc === "ja" ? "半導体・AI・高配当・連続増配などテーマ別の関連銘柄（サンプルデータ）。" : "Theme pages: semiconductors, AI, high dividend and more (sample data)." });
}

export default async function ThemesPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const loc = locale as Locale;
  const t = getDictionary(loc);

  return (
    <div className="space-y-6">
      <JsonLd data={breadcrumbLd([{ name: t.brand, path: "" }, { name: loc === "ja" ? "テーマ" : "Themes", path: "themes" }], loc)} />
      <Breadcrumbs items={[{ name: t.brand, path: "" }, { name: loc === "ja" ? "テーマ" : "Themes", path: "themes" }]} locale={loc} />
      <h1 className="text-2xl font-bold text-ink">{loc === "ja" ? "テーマから探す" : "Browse by theme"}</h1>
      <div className="flex flex-wrap gap-2">
        {listThemes().map((th) => {
          const count = getStocksByTheme(th.slug).length;
          return (
            <Link key={th.slug} href={`/${loc}/themes/${th.slug}`} className="rounded-full border border-line bg-card px-4 py-2 text-sm text-ink hover:border-brand">
              {pick(loc, th.nameJa, th.nameEn)} <span className="tabular text-muted">{count}</span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
