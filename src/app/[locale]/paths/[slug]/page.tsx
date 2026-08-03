import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight } from "lucide-react";
import type { Locale } from "@/types";
import { LOCALES } from "@/types";
import { getDictionary, isLocale, pick } from "@/lib/i18n";
import { buildMetadata, localizedUrl } from "@/lib/seo";
import { breadcrumbLd, itemListLd } from "@/lib/jsonld";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { JsonLd } from "@/components/JsonLd";
import pathsRaw from "@/data/learning-paths.json";
import articlesRaw from "@/data/articles.json";

type Path = (typeof pathsRaw)[number];
const find = (slug: string): Path | undefined => pathsRaw.find((p) => p.slug === slug);
const article = (slug: string) => articlesRaw.find((a) => a.slug === slug);

export function generateStaticParams() {
  return LOCALES.flatMap((locale) => pathsRaw.map((p) => ({ locale, slug: p.slug })));
}

export async function generateMetadata({ params }: { params: Promise<{ locale: string; slug: string }> }): Promise<Metadata> {
  const { locale, slug } = await params;
  const loc: Locale = isLocale(locale) ? locale : "ja";
  const p = find(slug);
  if (!p) return buildMetadata({ locale: loc, path: `paths/${slug}`, title: slug, description: "", noindex: true });
  return buildMetadata({ locale: loc, path: `paths/${slug}`, title: pick(loc, p.titleJa, p.titleEn), description: pick(loc, p.descJa, p.descEn) });
}

export default async function PathDetailPage({ params }: { params: Promise<{ locale: string; slug: string }> }) {
  const { locale, slug } = await params;
  if (!isLocale(locale)) notFound();
  const loc = locale as Locale;
  const t = getDictionary(loc);
  const p = find(slug);
  if (!p) notFound();
  const items = p.itemSlugs.map(article).filter((a): a is NonNullable<ReturnType<typeof article>> => !!a);

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <JsonLd data={[itemListLd(pick(loc, p.titleJa, p.titleEn), items.map((a) => ({ name: pick(loc, a.titleJa, a.titleEn), url: localizedUrl(loc, `learn/${a.slug}`) }))), breadcrumbLd([{ name: t.brand, path: "" }, { name: loc === "ja" ? "学習ロードマップ" : "Learning Paths", path: "paths" }, { name: pick(loc, p.titleJa, p.titleEn), path: `paths/${slug}` }], loc)]} />
      <Breadcrumbs items={[{ name: t.brand, path: "" }, { name: loc === "ja" ? "学習ロードマップ" : "Learning Paths", path: "paths" }, { name: pick(loc, p.titleJa, p.titleEn), path: `paths/${slug}` }]} locale={loc} />
      <header>
        <div className="text-xs uppercase text-muted">{p.level} ・ {items.length} steps</div>
        <h1 className="mt-1 text-2xl font-bold text-ink sm:text-3xl">{pick(loc, p.titleJa, p.titleEn)}</h1>
        <p className="mt-2 text-sm text-muted">{pick(loc, p.descJa, p.descEn)}</p>
      </header>
      <ol className="space-y-3">
        {items.map((a, i) => (
          <li key={a.slug}>
            <Link href={`/${loc}/learn/${a.slug}`} className="flex items-center gap-3 rounded-2xl border border-line bg-card p-4 hover:border-brand">
              <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-brand/10 text-sm font-bold text-brand">{i + 1}</span>
              <div className="min-w-0 flex-1">
                <div className="font-semibold text-ink">{pick(loc, a.titleJa, a.titleEn)}</div>
                <div className="truncate text-xs text-muted">{a.category} ・ {a.readingMinutes}min</div>
              </div>
              <ArrowRight size={16} className="text-muted" />
            </Link>
          </li>
        ))}
      </ol>
    </div>
  );
}
