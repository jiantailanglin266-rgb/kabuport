import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { Locale } from "@/types";
import { getDictionary, isLocale, pick } from "@/lib/i18n";
import { buildMetadata } from "@/lib/seo";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import articlesRaw from "@/data/articles.json";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const loc: Locale = isLocale(locale) ? locale : "ja";
  return buildMetadata({ locale: loc, path: "learn", title: loc === "ja" ? "投資を学ぶ" : "Learn", description: loc === "ja" ? "日本株投資の基礎を体系的に学べる学習コンテンツ。" : "Structured learning content for Japanese equity investing." });
}

export default async function LearnPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const loc = locale as Locale;
  const t = getDictionary(loc);
  return (
    <div className="space-y-6">
      <Breadcrumbs items={[{ name: t.brand, path: "" }, { name: t.nav.learn, path: "learn" }]} locale={loc} />
      <h1 className="text-2xl font-bold text-ink">{t.nav.learn}</h1>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {articlesRaw.map((a) => (
          <Link key={a.slug} href={`/${loc}/learn/${a.slug}`} className="rounded-2xl border border-line bg-card p-5 hover:border-brand">
            <div className="text-[11px] text-muted">{a.category} ・ {a.level} ・ {a.readingMinutes}min</div>
            <div className="mt-1 font-semibold text-ink">{pick(loc, a.titleJa, a.titleEn)}</div>
            <p className="mt-1 line-clamp-3 text-sm text-muted">{pick(loc, a.summaryJa, a.summaryEn)}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
