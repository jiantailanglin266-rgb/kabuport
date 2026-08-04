import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ExternalLink, ShieldCheck } from "lucide-react";
import type { Locale } from "@/types";
import { LOCALES } from "@/types";
import { getDictionary, isLocale } from "@/lib/i18n";
import { buildMetadata, localizedUrl } from "@/lib/seo";
import { breadcrumbLd, itemListLd } from "@/lib/jsonld";
import { getSource, getSources, listArticles } from "@/lib/news";
import { formatDateTimeJst } from "@/lib/format";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { JsonLd } from "@/components/JsonLd";
import { NewsTaxonomyList } from "@/components/news/NewsTaxonomyList";

export function generateStaticParams() {
  return LOCALES.flatMap((locale) => getSources().map((s) => ({ locale, source: s.slug })));
}

export async function generateMetadata({ params }: { params: Promise<{ locale: string; source: string }> }): Promise<Metadata> {
  const { locale, source } = await params;
  const loc: Locale = isLocale(locale) ? locale : "ja";
  const ja = loc === "ja";
  const s = getSource(source);
  if (!s) return buildMetadata({ locale: loc, path: `news/source/${source}`, title: source, description: "", noindex: true });
  return buildMetadata({
    locale: loc,
    path: `news/source/${source}`,
    title: ja ? `${s.name}のニュース` : `News from ${s.name}`,
    description: ja
      ? `${s.name}から配信された株式投資ニュースの一覧です。各記事は配信元サイトでご確認ください。`
      : `Articles distributed by ${s.name}. Read each article at the publisher's site.`,
  });
}

export default async function NewsSourcePage({ params }: { params: Promise<{ locale: string; source: string }> }) {
  const { locale, source } = await params;
  if (!isLocale(locale)) notFound();
  const loc = locale as Locale;
  const t = getDictionary(loc);
  const ja = loc === "ja";
  const s = getSource(source);
  if (!s) notFound();

  const articles = listArticles({ source });

  return (
    <>
      <JsonLd
        data={[
          breadcrumbLd(
            [{ name: t.brand, path: "" }, { name: ja ? "ニュース" : "News", path: "news" }, { name: s.name, path: `news/source/${source}` }],
            loc,
          ),
          itemListLd(s.name, articles.slice(0, 20).map((a) => ({ name: a.title, url: localizedUrl(loc, `news/${a.slug}`) }))),
        ]}
      />
      <div className="mb-6">
        <Breadcrumbs
          items={[
            { name: t.brand, path: "" },
            { name: ja ? "ニュース" : "News", path: "news" },
            { name: s.name, path: `news/source/${source}` },
          ]}
          locale={loc}
        />
      </div>
      <NewsTaxonomyList
        locale={loc}
        eyebrow="News Source"
        title={ja ? `${s.name}のニュース` : `News from ${s.name}`}
        description={ja ? `${s.name}から配信された記事の一覧です。` : `Articles distributed by ${s.name}.`}
        articles={articles}
        extra={
          <section className="card p-5">
            <h2 className="flex items-center gap-2 text-[13.5px] font-extrabold text-ink">
              <ShieldCheck size={15} className="text-gold-600" aria-hidden />
              {ja ? "配信元の情報と利用条件" : "Publisher and terms"}
            </h2>
            <dl className="num mt-3 space-y-1.5 text-[12px] text-muted">
              {s.siteUrl && (
                <div className="flex gap-2">
                  <dt className="w-28 shrink-0">{ja ? "サイト" : "Website"}</dt>
                  <dd className="min-w-0 break-all">
                    <a href={s.siteUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-ink-2 hover:underline">
                      {s.siteUrl} <ExternalLink size={10} aria-hidden />
                    </a>
                  </dd>
                </div>
              )}
              <div className="flex gap-2">
                <dt className="w-28 shrink-0">{ja ? "画像の利用" : "Image use"}</dt>
                <dd className="text-ink-2">
                  {s.imageUsageAllowed ? (ja ? "確認済み" : "Confirmed") : ja ? "未確認（画像は掲載しません）" : "Unconfirmed (images not shown)"}
                </dd>
              </div>
              <div className="flex gap-2">
                <dt className="w-28 shrink-0">{ja ? "商用利用" : "Commercial use"}</dt>
                <dd className="text-ink-2">{s.commercialUseAllowed ? (ja ? "確認済み" : "Confirmed") : ja ? "未確認" : "Unconfirmed"}</dd>
              </div>
              {s.termsNote && (
                <div className="flex gap-2">
                  <dt className="w-28 shrink-0">{ja ? "規約メモ" : "Terms note"}</dt>
                  <dd className="text-ink-2">{s.termsNote}</dd>
                </div>
              )}
              {s.lastSuccessAt && (
                <div className="flex gap-2">
                  <dt className="w-28 shrink-0">{ja ? "最終取得成功" : "Last success"}</dt>
                  <dd className="text-ink-2">{formatDateTimeJst(s.lastSuccessAt, loc)}</dd>
                </div>
              )}
            </dl>
          </section>
        }
      />
    </>
  );
}
