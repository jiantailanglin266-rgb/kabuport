import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { Locale } from "@/types";
import { getDictionary, isLocale, pick } from "@/lib/i18n";
import { buildMetadata, localizedUrl } from "@/lib/seo";
import { breadcrumbLd, definedTermSetLd } from "@/lib/jsonld";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { JsonLd } from "@/components/JsonLd";
import glossaryRaw from "@/data/glossary.json";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const loc: Locale = isLocale(locale) ? locale : "ja";
  return buildMetadata({ locale: loc, path: "glossary", title: loc === "ja" ? "投資用語集" : "Glossary", description: loc === "ja" ? "PER・PBR・ROE・配当利回りなど日本株投資の用語をわかりやすく定義。" : "Clear definitions of P/E, P/B, ROE, dividend yield and more." });
}

export default async function GlossaryPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const loc = locale as Locale;
  const t = getDictionary(loc);

  const categories = [...new Set(glossaryRaw.map((g) => g.category))];
  const setLd = definedTermSetLd(
    loc === "ja" ? "KABUPORT 投資用語集" : "KABUPORT Glossary",
    localizedUrl(loc, "glossary"),
    glossaryRaw.map((g) => ({ term: pick(loc, g.termJa, g.termEn), definition: pick(loc, g.defJa, g.defEn) })),
  );

  return (
    <div className="space-y-6">
      <JsonLd data={[setLd, breadcrumbLd([{ name: t.brand, path: "" }, { name: loc === "ja" ? "用語集" : "Glossary", path: "glossary" }], loc)]} />
      <Breadcrumbs items={[{ name: t.brand, path: "" }, { name: loc === "ja" ? "用語集" : "Glossary", path: "glossary" }]} locale={loc} />
      <h1 className="text-2xl font-bold text-ink">{loc === "ja" ? "投資用語集" : "Investing glossary"}</h1>
      {categories.map((cat) => (
        <section key={cat} className="space-y-2">
          <h2 className="text-sm font-semibold uppercase text-muted">{cat}</h2>
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {glossaryRaw.filter((g) => g.category === cat).map((g) => (
              <Link key={g.slug} href={`/${loc}/glossary/${g.slug}`} className="rounded-xl border border-line bg-card p-3 hover:border-brand">
                <div className="font-semibold text-ink">{pick(loc, g.termJa, g.termEn)}</div>
                <p className="mt-0.5 line-clamp-2 text-xs text-muted">{pick(loc, g.defJa, g.defEn)}</p>
              </Link>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
