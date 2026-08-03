import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { Locale } from "@/types";
import { getDictionary, isLocale, pick } from "@/lib/i18n";
import { buildMetadata, localizedUrl } from "@/lib/seo";
import { breadcrumbLd } from "@/lib/jsonld";
import { getProviders } from "@/lib/providers";
import { formatDate } from "@/lib/format";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { RiskDisclosure } from "@/components/RiskDisclosure";
import { JsonLd } from "@/components/JsonLd";
import articlesRaw from "@/data/articles.json";

type Article = (typeof articlesRaw)[number];
const find = (slug: string): Article | undefined => articlesRaw.find((a) => a.slug === slug);

export function generateStaticParams() {
  return articlesRaw.map((a) => ({ slug: a.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ locale: string; slug: string }> }): Promise<Metadata> {
  const { locale, slug } = await params;
  const loc: Locale = isLocale(locale) ? locale : "ja";
  const a = find(slug);
  if (!a) return buildMetadata({ locale: loc, path: `learn/${slug}`, title: "Not found", description: "", noindex: true });
  return buildMetadata({ locale: loc, path: `learn/${slug}`, title: pick(loc, a.titleJa, a.titleEn), description: pick(loc, a.summaryJa, a.summaryEn) });
}

export default async function ArticlePage({ params }: { params: Promise<{ locale: string; slug: string }> }) {
  const { locale, slug } = await params;
  if (!isLocale(locale)) notFound();
  const loc = locale as Locale;
  const t = getDictionary(loc);
  const a = find(slug);
  if (!a) notFound();

  const articleLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: pick(loc, a.titleJa, a.titleEn),
    description: pick(loc, a.summaryJa, a.summaryEn),
    inLanguage: loc,
    datePublished: a.publishedAt,
    dateModified: a.updatedAt,
    author: { "@type": "Organization", name: a.author },
    mainEntityOfPage: localizedUrl(loc, `learn/${slug}`),
  };
  const company = getProviders().company;

  return (
    <article className="mx-auto max-w-3xl space-y-6">
      <JsonLd data={[articleLd, breadcrumbLd([{ name: t.brand, path: "" }, { name: t.nav.learn, path: "learn" }, { name: pick(loc, a.titleJa, a.titleEn), path: `learn/${slug}` }], loc)]} />
      <Breadcrumbs items={[{ name: t.brand, path: "" }, { name: t.nav.learn, path: "learn" }, { name: pick(loc, a.titleJa, a.titleEn), path: `learn/${slug}` }]} locale={loc} />

      <header className="space-y-2">
        <div className="text-xs text-muted">{a.category} ・ {a.level} ・ {a.readingMinutes}min</div>
        <h1 className="text-2xl font-bold text-ink sm:text-3xl">{pick(loc, a.titleJa, a.titleEn)}</h1>
        <p className="text-sm text-muted">
          {loc === "ja" ? "公開" : "Published"} {formatDate(a.publishedAt, loc)} ・ {loc === "ja" ? "更新" : "Updated"} {formatDate(a.updatedAt, loc)} ・ {a.author}
          {a.reviewer ? ` ・ ${loc === "ja" ? "監修" : "Reviewed"}: ${a.reviewer}` : ""}
        </p>
      </header>

      {/* 要約(結論を先に) */}
      <div className="rounded-2xl border border-brand/30 bg-brand/5 p-4 text-sm text-ink">
        <div className="mb-1 font-semibold">{loc === "ja" ? "この記事の要点" : "Key takeaway"}</div>
        {pick(loc, a.summaryJa, a.summaryEn)}
      </div>

      <div className="whitespace-pre-line text-[15px] leading-relaxed text-ink/90">{pick(loc, a.bodyJa, a.bodyEn)}</div>

      {a.relatedCodes && a.relatedCodes.length > 0 && (
        <section>
          <h2 className="mb-2 text-base font-bold text-ink">{loc === "ja" ? "関連銘柄" : "Related stocks"}</h2>
          <div className="flex flex-wrap gap-2">
            {a.relatedCodes.map((code) => {
              const c = company.getCompany(code);
              return (
                <Link key={code} href={`/${loc}/stocks/${code}`} className="rounded-full border border-line px-3 py-1 text-sm text-ink hover:border-brand">
                  {c ? pick(loc, c.nameJa, c.nameEn) : code} <span className="text-muted">{code}</span>
                </Link>
              );
            })}
          </div>
        </section>
      )}

      {a.sources && a.sources.length > 0 && (
        <section className="text-xs text-muted">
          <div className="font-semibold text-ink">{loc === "ja" ? "出典" : "Sources"}</div>
          <ul className="mt-1 list-disc pl-5">
            {a.sources.map((s, i) => <li key={i}>{s.label}</li>)}
          </ul>
        </section>
      )}

      <RiskDisclosure locale={loc} />
    </article>
  );
}
