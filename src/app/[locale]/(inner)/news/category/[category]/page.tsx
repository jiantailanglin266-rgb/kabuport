import type { Metadata } from "next";
import { notFound } from "next/navigation";
import type { Locale } from "@/types";
import { LOCALES } from "@/types";
import { getDictionary, isLocale } from "@/lib/i18n";
import { buildMetadata, localizedUrl } from "@/lib/seo";
import { breadcrumbLd, itemListLd } from "@/lib/jsonld";
import { countByCategory, getCategories, getCategory, listArticles } from "@/lib/news";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { JsonLd } from "@/components/JsonLd";
import { NewsTaxonomyList } from "@/components/news/NewsTaxonomyList";

/** 記事が1件以上あるカテゴリーのみ静的生成する（薄いページを量産しない）。 */
export function generateStaticParams() {
  const counts = countByCategory();
  return LOCALES.flatMap((locale) =>
    getCategories()
      .filter((c) => (counts[c.slug] ?? 0) > 0)
      .map((c) => ({ locale, category: c.slug })),
  );
}

export async function generateMetadata({ params }: { params: Promise<{ locale: string; category: string }> }): Promise<Metadata> {
  const { locale, category } = await params;
  const loc: Locale = isLocale(locale) ? locale : "ja";
  const ja = loc === "ja";
  const c = getCategory(category);
  if (!c) return buildMetadata({ locale: loc, path: `news/category/${category}`, title: category, description: "", noindex: true });
  const name = ja ? c.nameJa : c.nameEn;
  return buildMetadata({
    locale: loc,
    path: `news/category/${category}`,
    title: ja ? `${name}のニュース` : `${name} news`,
    description: ja
      ? `${name}に関する株式投資ニュースの一覧です。配信元へのリンクとともに最新順で掲載しています。`
      : `Latest ${name} news for Japanese equities, with links to each publisher.`,
  });
}

export default async function NewsCategoryPage({ params }: { params: Promise<{ locale: string; category: string }> }) {
  const { locale, category } = await params;
  if (!isLocale(locale)) notFound();
  const loc = locale as Locale;
  const t = getDictionary(loc);
  const ja = loc === "ja";
  const c = getCategory(category);
  if (!c) notFound();

  const articles = listArticles({ category });
  const name = ja ? c.nameJa : c.nameEn;

  return (
    <>
      <JsonLd
        data={[
          breadcrumbLd(
            [
              { name: t.brand, path: "" },
              { name: ja ? "ニュース" : "News", path: "news" },
              { name, path: `news/category/${category}` },
            ],
            loc,
          ),
          itemListLd(name, articles.slice(0, 20).map((a) => ({ name: a.title, url: localizedUrl(loc, `news/${a.slug}`) }))),
        ]}
      />
      <div className="mb-6">
        <Breadcrumbs
          items={[
            { name: t.brand, path: "" },
            { name: ja ? "ニュース" : "News", path: "news" },
            { name, path: `news/category/${category}` },
          ]}
          locale={loc}
        />
      </div>
      <NewsTaxonomyList
        locale={loc}
        eyebrow="News Category"
        title={ja ? `${name}のニュース` : `${name} news`}
        description={ja ? `${name}に関するニュースを最新順に表示しています。` : `Latest ${name} news.`}
        articles={articles}
      />
    </>
  );
}
