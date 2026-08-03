import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { UserRound } from "lucide-react";
import type { Locale } from "@/types";
import { LOCALES } from "@/types";
import { getDictionary, isLocale, pick } from "@/lib/i18n";
import { buildMetadata, localizedUrl } from "@/lib/seo";
import { breadcrumbLd, personLd } from "@/lib/jsonld";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { JsonLd } from "@/components/JsonLd";
import expertsRaw from "@/data/experts.json";
import articlesRaw from "@/data/articles.json";

type Expert = (typeof expertsRaw)[number];
const find = (slug: string): Expert | undefined => expertsRaw.find((e) => e.slug === slug);

export function generateStaticParams() {
  return LOCALES.flatMap((locale) => expertsRaw.map((e) => ({ locale, slug: e.slug })));
}

export async function generateMetadata({ params }: { params: Promise<{ locale: string; slug: string }> }): Promise<Metadata> {
  const { locale, slug } = await params;
  const loc: Locale = isLocale(locale) ? locale : "ja";
  const e = find(slug);
  if (!e) return buildMetadata({ locale: loc, path: `experts/${slug}`, title: slug, description: "", noindex: true });
  return buildMetadata({ locale: loc, path: `experts/${slug}`, title: pick(loc, e.name, e.nameEn), description: pick(loc, e.bioJa, e.bioEn) });
}

export default async function ExpertPage({ params }: { params: Promise<{ locale: string; slug: string }> }) {
  const { locale, slug } = await params;
  if (!isLocale(locale)) notFound();
  const loc = locale as Locale;
  const t = getDictionary(loc);
  const e = find(slug);
  if (!e) notFound();
  const name = pick(loc, e.name, e.nameEn);
  const authored = articlesRaw.filter((a) => a.authorId === slug);
  const reviewed = articlesRaw.filter((a) => a.reviewerId === slug);

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <JsonLd data={[personLd({ name, jobTitle: pick(loc, e.titleJa, e.titleEn), description: pick(loc, e.bioJa, e.bioEn), url: localizedUrl(loc, `experts/${slug}`) }), breadcrumbLd([{ name: t.brand, path: "" }, { name: loc === "ja" ? "著者・監修者" : "Experts", path: "experts" }, { name, path: `experts/${slug}` }], loc)]} />
      <Breadcrumbs items={[{ name: t.brand, path: "" }, { name: loc === "ja" ? "著者・監修者" : "Experts", path: "experts" }, { name, path: `experts/${slug}` }]} locale={loc} />
      <header className="flex gap-4">
        <span className="grid h-16 w-16 shrink-0 place-items-center rounded-full bg-line/50 text-muted"><UserRound size={30} /></span>
        <div>
          <h1 className="text-2xl font-bold text-ink">{name}</h1>
          <div className="text-sm text-brand">{e.role === "reviewer" ? (loc === "ja" ? "監修者" : "Reviewer") : loc === "ja" ? "著者" : "Author"} ・ {pick(loc, e.titleJa, e.titleEn)}</div>
        </div>
      </header>
      <p className="text-[15px] leading-relaxed text-ink/90">{pick(loc, e.bioJa, e.bioEn)}</p>
      <p className="rounded-xl border border-line bg-card p-3 text-xs text-muted">{pick(loc, e.credentialsJa, e.credentialsEn)}</p>

      {authored.length > 0 && (
        <ArticleList title={loc === "ja" ? "執筆記事" : "Articles authored"} items={authored} loc={loc} />
      )}
      {reviewed.length > 0 && (
        <ArticleList title={loc === "ja" ? "監修記事" : "Articles reviewed"} items={reviewed} loc={loc} />
      )}
    </div>
  );
}

function ArticleList({ title, items, loc }: { title: string; items: typeof articlesRaw; loc: Locale }) {
  return (
    <section>
      <h2 className="mb-2 text-base font-bold text-ink">{title}</h2>
      <ul className="space-y-2">
        {items.map((a) => (
          <li key={a.slug}>
            <Link href={`/${loc}/learn/${a.slug}`} className="text-sm text-brand hover:underline">
              {pick(loc, a.titleJa, a.titleEn)}
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
