import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { Locale } from "@/types";
import { LOCALES } from "@/types";
import { getDictionary, isLocale, pick } from "@/lib/i18n";
import { buildMetadata, localizedUrl } from "@/lib/seo";
import { breadcrumbLd, definedTermLd } from "@/lib/jsonld";
import { getProviders } from "@/lib/providers";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { JsonLd } from "@/components/JsonLd";
import glossaryRaw from "@/data/glossary.json";

type Term = (typeof glossaryRaw)[number];
const find = (slug: string): Term | undefined => glossaryRaw.find((g) => g.slug === slug);

export function generateStaticParams() {
  return LOCALES.flatMap((locale) => glossaryRaw.map((g) => ({ locale, slug: g.slug })));
}

export async function generateMetadata({ params }: { params: Promise<{ locale: string; slug: string }> }): Promise<Metadata> {
  const { locale, slug } = await params;
  const loc: Locale = isLocale(locale) ? locale : "ja";
  const g = find(slug);
  if (!g) return buildMetadata({ locale: loc, path: `glossary/${slug}`, title: slug, description: "", noindex: true });
  return buildMetadata({ locale: loc, path: `glossary/${slug}`, title: `${pick(loc, g.termJa, g.termEn)}${loc === "ja" ? "とは？" : ""}`, description: pick(loc, g.defJa, g.defEn) });
}

export default async function GlossaryTermPage({ params }: { params: Promise<{ locale: string; slug: string }> }) {
  const { locale, slug } = await params;
  if (!isLocale(locale)) notFound();
  const loc = locale as Locale;
  const t = getDictionary(loc);
  const g = find(slug);
  if (!g) notFound();
  const term = pick(loc, g.termJa, g.termEn);
  const related = "relatedCodes" in g && Array.isArray(g.relatedCodes) ? g.relatedCodes : [];
  const company = getProviders().company;
  const others = glossaryRaw.filter((x) => x.category === g.category && x.slug !== g.slug).slice(0, 4);

  return (
    <article className="mx-auto max-w-2xl space-y-6">
      <JsonLd data={[definedTermLd({ term, definition: pick(loc, g.defJa, g.defEn), slug }, localizedUrl(loc, "glossary")), breadcrumbLd([{ name: t.brand, path: "" }, { name: loc === "ja" ? "用語集" : "Glossary", path: "glossary" }, { name: term, path: `glossary/${slug}` }], loc)]} />
      <Breadcrumbs items={[{ name: t.brand, path: "" }, { name: loc === "ja" ? "用語集" : "Glossary", path: "glossary" }, { name: term, path: `glossary/${slug}` }]} locale={loc} />
      <header>
        <div className="text-xs text-muted">{g.category}</div>
        <h1 className="mt-1 text-2xl font-bold text-ink sm:text-3xl">{term}</h1>
      </header>
      {/* 定義ブロック(結論を先に) */}
      <div className="rounded-2xl border border-brand/30 bg-brand/5 p-4 text-[15px] leading-relaxed text-ink">{pick(loc, g.defJa, g.defEn)}</div>

      {related.length > 0 && (
        <section>
          <h2 className="mb-2 text-base font-bold text-ink">{loc === "ja" ? "関連銘柄" : "Related stocks"}</h2>
          <div className="flex flex-wrap gap-2">
            {related.map((code) => {
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

      {others.length > 0 && (
        <section>
          <h2 className="mb-2 text-base font-bold text-ink">{loc === "ja" ? "同じカテゴリーの用語" : "Related terms"}</h2>
          <div className="flex flex-wrap gap-2">
            {others.map((o) => (
              <Link key={o.slug} href={`/${loc}/glossary/${o.slug}`} className="rounded-full border border-line px-3 py-1 text-sm text-brand hover:underline">
                {pick(loc, o.termJa, o.termEn)}
              </Link>
            ))}
          </div>
        </section>
      )}
      <p className="text-[11px] text-muted">{t.common.notInvestmentAdvice}.</p>
    </article>
  );
}
