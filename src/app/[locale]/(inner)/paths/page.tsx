import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Route } from "lucide-react";
import type { Locale } from "@/types";
import { getDictionary, isLocale, pick } from "@/lib/i18n";
import { buildMetadata } from "@/lib/seo";
import { breadcrumbLd } from "@/lib/jsonld";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { JsonLd } from "@/components/JsonLd";
import pathsRaw from "@/data/learning-paths.json";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const loc: Locale = isLocale(locale) ? locale : "ja";
  return buildMetadata({ locale: loc, path: "paths", title: loc === "ja" ? "学習ロードマップ" : "Learning Paths", description: loc === "ja" ? "初心者から順番に学べる日本株投資の学習ロードマップ。" : "Step-by-step learning paths for Japanese equity investing." });
}

export default async function PathsPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const loc = locale as Locale;
  const t = getDictionary(loc);
  return (
    <div className="space-y-6">
      <JsonLd data={breadcrumbLd([{ name: t.brand, path: "" }, { name: loc === "ja" ? "学習ロードマップ" : "Learning Paths", path: "paths" }], loc)} />
      <Breadcrumbs items={[{ name: t.brand, path: "" }, { name: loc === "ja" ? "学習ロードマップ" : "Learning Paths", path: "paths" }]} locale={loc} />
      <h1 className="text-2xl font-bold text-ink">{loc === "ja" ? "学習ロードマップ" : "Learning paths"}</h1>
      <div className="grid gap-4 sm:grid-cols-2">
        {pathsRaw.map((p) => (
          <Link key={p.slug} href={`/${loc}/paths/${p.slug}`} className="rounded-2xl border border-line bg-card p-5 hover:border-brand">
            <div className="flex items-center gap-2 text-brand"><Route size={18} /><span className="text-[11px] uppercase text-muted">{p.level} ・ {p.itemSlugs.length} steps</span></div>
            <div className="mt-1 font-semibold text-ink">{pick(loc, p.titleJa, p.titleEn)}</div>
            <p className="mt-1 text-sm text-muted">{pick(loc, p.descJa, p.descEn)}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
