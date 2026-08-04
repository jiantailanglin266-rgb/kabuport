import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Clock, Rss } from "lucide-react";
import type { Locale } from "@/types";
import { LOCALES } from "@/types";
import { getDictionary, isLocale, pick } from "@/lib/i18n";
import { buildMetadata, localizedUrl } from "@/lib/seo";
import { breadcrumbLd } from "@/lib/jsonld";
import {
  categoryLabel, getArticleBySlug, getCategories, getDuplicatesOf, getNewsDataset,
  getRelatedArticles, getSource, listArticles,
} from "@/lib/news";
import { getProviders } from "@/lib/providers";
import { formatDateTimeJst } from "@/lib/format";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { JsonLd } from "@/components/JsonLd";
import { RiskDisclosure } from "@/components/RiskDisclosure";
import { NewsCard } from "@/components/news/NewsCard";
import {
  BreakingLabel, CATEGORY_STYLE, CopyrightNotice, ExternalArticleButton, FeaturedLabel, NewsCategoryBadge,
} from "@/components/news/NewsBits";

export function generateStaticParams() {
  return LOCALES.flatMap((locale) => listArticles().map((a) => ({ locale, slug: a.slug })));
}

export async function generateMetadata({ params }: { params: Promise<{ locale: string; slug: string }> }): Promise<Metadata> {
  const { locale, slug } = await params;
  const loc: Locale = isLocale(locale) ? locale : "ja";
  const a = getArticleBySlug(slug);
  if (!a) return buildMetadata({ locale: loc, path: `news/${slug}`, title: "Not found", description: "", noindex: true });
  return buildMetadata({
    locale: loc,
    path: `news/${slug}`,
    title: a.title,
    description: a.summary || a.title,
  });
}

export default async function NewsDetailPage({ params }: { params: Promise<{ locale: string; slug: string }> }) {
  const { locale, slug } = await params;
  if (!isLocale(locale)) notFound();
  const loc = locale as Locale;
  const t = getDictionary(loc);
  const ja = loc === "ja";

  const article = getArticleBySlug(slug);
  if (!article) notFound();

  const dataset = getNewsDataset();
  const source = getSource(article.sourceSlug);
  const related = getRelatedArticles(article, 4);
  const alsoReported = getDuplicatesOf(article.id);
  const categories = getCategories();
  const categoryLabels = Object.fromEntries(categories.map((c) => [c.slug, ja ? c.nameJa : c.nameEn]));
  const now = Date.parse(dataset.generatedAt) || Date.now();
  const grad = CATEGORY_STYLE[article.categories[0]?.slug ?? "default"] ?? CATEGORY_STYLE.default;

  const company = getProviders().company;
  const themes = getProviders().company.listThemes();
  const industries = getProviders().company.listIndustries();

  // 掲載中の銘柄と一致する場合のみ、業種・テーマを関連情報として出す
  const linkedCompanies = article.companies.map((c) => {
    const master = company.getCompany(c.code);
    return {
      ...c,
      master,
      industry: master ? industries.find((i) => i.code === master.industryCode) : undefined,
      themes: master ? themes.filter((th) => master.themes.includes(th.slug)) : [],
    };
  });

  // NewsArticle 構造化データ。
  // 当サイトは発行者ではないため publisher は配信元とし、元記事URLを isBasedOn で明示する。
  const newsLd = {
    "@context": "https://schema.org",
    "@type": "NewsArticle",
    headline: article.title,
    description: article.summary,
    datePublished: article.publishedAt,
    dateModified: article.externalUpdatedAt ?? article.publishedAt,
    inLanguage: article.language,
    url: localizedUrl(loc, `news/${article.slug}`),
    isBasedOn: article.originalUrl,
    mainEntityOfPage: article.canonicalUrl ?? article.originalUrl,
    publisher: { "@type": "Organization", name: article.sourceName, url: source?.siteUrl ?? undefined },
  };

  return (
    <article className="space-y-8">
      <JsonLd
        data={[
          newsLd,
          breadcrumbLd(
            [{ name: t.brand, path: "" }, { name: ja ? "ニュース" : "News", path: "news" }, { name: article.title, path: `news/${article.slug}` }],
            loc,
          ),
        ]}
      />
      <Breadcrumbs
        items={[
          { name: t.brand, path: "" },
          { name: ja ? "ニュース" : "News", path: "news" },
          { name: article.title, path: `news/${article.slug}` },
        ]}
        locale={loc}
      />

      <div className="grid gap-8 lg:grid-cols-[1.6fr_1fr]">
        <div>
          {/* ヘッダー */}
          <header>
            <div className="flex flex-wrap items-center gap-2">
              {article.categories.map((c) => (
                <NewsCategoryBadge key={c.slug} slug={c.slug} label={categoryLabel(c.slug, loc)} locale={loc} />
              ))}
              {article.isBreaking && <BreakingLabel locale={loc} />}
              {article.isFeatured && <FeaturedLabel locale={loc} />}
              {article.isDemo && <span className="chip-gold">{ja ? "デモデータ" : "Demo"}</span>}
            </div>

            <h1 className="mt-4 text-[24px] font-extrabold leading-snug tracking-tight text-ink sm:text-[30px]">
              {article.title}
            </h1>

            <dl className="num mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 border-b border-line pb-5 text-[12px] text-muted">
              <div className="flex items-center gap-1.5">
                <dt className="sr-only">{ja ? "配信元" : "Source"}</dt>
                <dd className="font-bold text-ink-2">{article.sourceName}</dd>
              </div>
              <div className="flex items-center gap-1.5">
                <dt className="sr-only">{ja ? "公開日時" : "Published"}</dt>
                <dd>{ja ? "公開" : "Published"} {formatDateTimeJst(article.publishedAt, loc)}</dd>
              </div>
              <div className="flex items-center gap-1.5">
                <Clock size={11} aria-hidden />
                <dt className="sr-only">{ja ? "取得日時" : "Fetched"}</dt>
                <dd>{ja ? "取得" : "Fetched"} {formatDateTimeJst(article.fetchedAt, loc)}</dd>
              </div>
            </dl>
          </header>

          {/* サムネイル（画像が無い場合はカテゴリー配色） */}
          <div className={`relative mt-6 h-40 overflow-hidden rounded-2xl bg-gradient-to-br sm:h-52 ${grad}`}>
            <span className="absolute inset-0 bg-grid opacity-45" aria-hidden />
            {article.imageUrl && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={article.imageUrl} alt="" className="h-full w-full object-cover opacity-90" />
            )}
          </div>

          {/* RSSで配信された範囲の概要（全文は転載しない） */}
          <div className="mt-6">
            <h2 className="text-[13px] font-bold text-muted">{ja ? "配信された概要" : "Summary as provided"}</h2>
            <p className="mt-2 whitespace-pre-line text-[15px] leading-relaxed text-ink/90">
              {article.summary || (ja ? "この記事には概要が配信されていません。" : "No summary was provided for this article.")}
            </p>
          </div>

          <div className="mt-6">
            <ExternalArticleButton article={article} locale={loc} />
          </div>

          {/* 出典 */}
          <div className="mt-6 rounded-2xl border border-line bg-card p-4">
            <h2 className="flex items-center gap-2 text-[13px] font-extrabold text-ink">
              <Rss size={14} className="text-gold-600" aria-hidden />
              {ja ? "出典" : "Source attribution"}
            </h2>
            <dl className="num mt-2.5 space-y-1 text-[12px] text-muted">
              <div className="flex gap-2">
                <dt className="w-24 shrink-0">{ja ? "配信元" : "Publisher"}</dt>
                <dd className="text-ink-2">
                  {source?.siteUrl ? (
                    <a href={source.siteUrl} target="_blank" rel="noopener noreferrer" className="hover:underline">
                      {article.sourceName}
                    </a>
                  ) : (
                    article.sourceName
                  )}
                </dd>
              </div>
              <div className="flex gap-2">
                <dt className="w-24 shrink-0">{ja ? "元記事" : "Original"}</dt>
                <dd className="min-w-0 break-all text-ink-2">
                  <a href={article.originalUrl} target="_blank" rel="noopener noreferrer" className="hover:underline">
                    {article.originalUrl}
                  </a>
                </dd>
              </div>
              {source?.termsNote && (
                <div className="flex gap-2">
                  <dt className="w-24 shrink-0">{ja ? "利用条件" : "Terms"}</dt>
                  <dd className="text-ink-2">{source.termsNote}</dd>
                </div>
              )}
            </dl>
          </div>

          {/* 同じニュースを報じた他の配信元 */}
          {alsoReported.length > 0 && (
            <section className="mt-6">
              <h2 className="mb-2 text-[14px] font-extrabold text-ink">
                {ja ? "同じニュースを報じた他の配信元" : "Also reported by"}
              </h2>
              <ul className="space-y-2">
                {alsoReported.map((d) => (
                  <li key={d.id}>
                    <a
                      href={d.originalUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-between gap-3 rounded-xl border border-line bg-card px-4 py-2.5 text-[12.5px] transition-colors hover:border-line-strong"
                    >
                      <span className="min-w-0 truncate text-ink">{d.title}</span>
                      <span className="shrink-0 font-bold text-muted">{d.sourceName}</span>
                    </a>
                  </li>
                ))}
              </ul>
            </section>
          )}

          <div className="mt-8 space-y-4">
            <CopyrightNotice locale={loc} />
            <RiskDisclosure locale={loc} />
          </div>
        </div>

        {/* サイドバー */}
        <aside className="space-y-6">
          {linkedCompanies.length > 0 && (
            <section className="card p-5">
              <h2 className="text-[13.5px] font-extrabold text-ink">{ja ? "関連企業" : "Related companies"}</h2>
              <ul className="mt-3 space-y-2">
                {linkedCompanies.map((c) => (
                  <li key={c.code}>
                    {c.master ? (
                      <Link
                        href={`/${loc}/stocks/${c.code}`}
                        className="flex items-center justify-between gap-2 rounded-xl border border-line bg-bg px-3.5 py-2.5 transition-colors hover:border-line-strong"
                      >
                        <span className="min-w-0 truncate text-[13px] font-bold text-ink">
                          {pick(loc, c.master.nameJa, c.master.nameEn)}
                        </span>
                        <span className="num shrink-0 text-[11px] text-muted">{c.code}</span>
                      </Link>
                    ) : (
                      <Link
                        href={`/${loc}/news/company/${c.code}`}
                        className="flex items-center justify-between gap-2 rounded-xl border border-line bg-bg px-3.5 py-2.5 transition-colors hover:border-line-strong"
                      >
                        <span className="min-w-0 truncate text-[13px] font-bold text-ink">{c.name ?? c.code}</span>
                        <span className="num shrink-0 text-[11px] text-muted">{c.code}</span>
                      </Link>
                    )}
                  </li>
                ))}
              </ul>
              <p className="mt-3 text-[10.5px] leading-relaxed text-muted">
                {ja
                  ? "関連企業はタイトル・概要からの自動判定です。関連が薄い場合があります。"
                  : "Related companies are detected automatically and may be imprecise."}
              </p>
            </section>
          )}

          {linkedCompanies.some((c) => c.industry || c.themes.length > 0) && (
            <section className="card p-5">
              <h2 className="text-[13.5px] font-extrabold text-ink">{ja ? "関連業種・テーマ" : "Sectors & themes"}</h2>
              <div className="mt-3 flex flex-wrap gap-2">
                {linkedCompanies
                  .flatMap((c) => (c.industry ? [c.industry] : []))
                  .filter((v, i, arr) => arr.findIndex((x) => x.code === v.code) === i)
                  .map((ind) => (
                    <Link key={ind.code} href={`/${loc}/industries/${ind.code}`} className="chip hover:border-line-strong">
                      {pick(loc, ind.nameJa, ind.nameEn)}
                    </Link>
                  ))}
                {linkedCompanies
                  .flatMap((c) => c.themes)
                  .filter((v, i, arr) => arr.findIndex((x) => x.slug === v.slug) === i)
                  .map((th) => (
                    <Link key={th.slug} href={`/${loc}/themes/${th.slug}`} className="chip hover:border-line-strong">
                      {pick(loc, th.nameJa, th.nameEn)}
                    </Link>
                  ))}
              </div>
            </section>
          )}

          {related.length > 0 && (
            <section>
              <h2 className="mb-3 text-[13.5px] font-extrabold text-ink">{ja ? "関連ニュース" : "Related news"}</h2>
              <div className="card px-5 py-1">
                {related.map((r) => (
                  <NewsCard key={r.id} article={r} locale={loc} categoryLabels={categoryLabels} now={now} compact />
                ))}
              </div>
            </section>
          )}
        </aside>
      </div>
    </article>
  );
}
