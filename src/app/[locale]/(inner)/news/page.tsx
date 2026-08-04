import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Newspaper, Radio } from "lucide-react";
import type { Locale } from "@/types";
import { getDictionary, isLocale } from "@/lib/i18n";
import { buildMetadata, localizedUrl } from "@/lib/seo";
import { breadcrumbLd, itemListLd } from "@/lib/jsonld";
import { countByCategory, getCategories, getNewsDataset, getSources, listArticles } from "@/lib/news";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { JsonLd } from "@/components/JsonLd";
import { RiskDisclosure } from "@/components/RiskDisclosure";
import { NewsBrowser } from "@/components/news/NewsBrowser";
import { NewsCard } from "@/components/news/NewsCard";
import {
  CopyrightNotice, DataUpdatedAt, NewsErrorNotice, RssStatusBadge,
} from "@/components/news/NewsBits";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const loc: Locale = isLocale(locale) ? locale : "ja";
  const ja = loc === "ja";
  return buildMetadata({
    locale: loc,
    path: "news",
    title: ja ? "株式投資ニュース" : "Investing news",
    description: ja
      ? "日本株、企業決算、配当、株主優待、市況に関する最新ニュースをまとめて確認できます。"
      : "The latest news on Japanese equities, earnings, dividends, shareholder benefits and markets.",
  });
}

export default async function NewsPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const loc = locale as Locale;
  const t = getDictionary(loc);
  const ja = loc === "ja";

  const dataset = getNewsDataset();
  const articles = listArticles();
  const categories = getCategories();
  const sources = getSources();
  const counts = countByCategory();
  const categoryLabels = Object.fromEntries(categories.map((c) => [c.slug, ja ? c.nameJa : c.nameEn]));
  const now = Date.parse(dataset.generatedAt) || Date.now();

  const breaking = articles.filter((a) => a.isBreaking).slice(0, 3);
  const featured = articles.filter((a) => a.isFeatured).slice(0, 3);

  return (
    <div className="space-y-8">
      <JsonLd
        data={[
          breadcrumbLd([{ name: t.brand, path: "" }, { name: ja ? "ニュース" : "News", path: "news" }], loc),
          itemListLd(
            ja ? "株式投資ニュース" : "Investing news",
            articles.slice(0, 20).map((a) => ({ name: a.title, url: localizedUrl(loc, `news/${a.slug}`) })),
          ),
        ]}
      />
      <Breadcrumbs items={[{ name: t.brand, path: "" }, { name: ja ? "ニュース" : "News", path: "news" }]} locale={loc} />

      {/* ページヘッダー */}
      <header>
        <span className="eyebrow">
          <span className="h-px w-6 bg-gold-600" aria-hidden />
          Market News
        </span>
        <div className="mt-2.5 flex flex-wrap items-center gap-3">
          <h1 className="text-[28px] font-extrabold tracking-tight text-ink sm:text-[34px]">
            {ja ? "株式投資ニュース" : "Investing news"}
          </h1>
          <RssStatusBadge dataset={dataset} locale={loc} />
        </div>
        <p className="mt-3 max-w-3xl text-[14px] leading-relaxed text-muted">
          {ja
            ? "日本株、企業決算、配当、株主優待、市況に関する最新ニュースをまとめて確認できます。"
            : "The latest news on Japanese equities, earnings, dividends, shareholder benefits and markets."}
        </p>
        <div className="mt-2">
          <DataUpdatedAt dataset={dataset} locale={loc} />
        </div>
      </header>

      <NewsErrorNotice dataset={dataset} locale={loc} />

      {dataset.isDemo && (
        <div className="flex items-start gap-3 rounded-2xl border border-gold/30 bg-gold/8 p-4">
          <Newspaper size={16} className="mt-0.5 shrink-0 text-gold-600" aria-hidden />
          <p className="text-[12.5px] leading-relaxed text-ink-2">
            <b className="text-ink">{ja ? "デモデータを表示しています。" : "Showing demo data."}</b>{" "}
            {ja
              ? "RSS配信元が未設定のため、架空企業によるサンプル記事を表示しています。実在の企業・ニュースではありません。配信元を設定すると実際のRSSから自動取得されます。"
              : "No RSS sources are configured, so sample articles about fictional companies are shown. These are not real companies or news."}
          </p>
        </div>
      )}

      {/* 速報 */}
      {breaking.length > 0 && (
        <section aria-labelledby="breaking-news">
          <h2 id="breaking-news" className="mb-4 flex items-center gap-2 text-[17px] font-extrabold text-ink">
            <Radio size={17} className="text-gold-600" aria-hidden />
            {ja ? "速報" : "Breaking"}
          </h2>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {breaking.map((a) => (
              <NewsCard key={a.id} article={a} locale={loc} categoryLabels={categoryLabels} now={now} />
            ))}
          </div>
        </section>
      )}

      {/* 重要ニュース */}
      {featured.length > 0 && (
        <section aria-labelledby="featured-news">
          <h2 id="featured-news" className="mb-1 text-[17px] font-extrabold text-ink">
            {ja ? "重要ニュース" : "Key news"}
          </h2>
          <p className="mb-4 text-[11.5px] text-muted">
            {ja
              ? "※ 重要度は公開されたルール（カテゴリー・関連銘柄・新しさ）による自動判定であり、情報の正確性や投資価値の高さを示すものではありません。"
              : "Importance is computed by a disclosed rule and does not indicate accuracy or investment merit."}
          </p>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {featured.map((a) => (
              <NewsCard key={a.id} article={a} locale={loc} categoryLabels={categoryLabels} now={now} />
            ))}
          </div>
        </section>
      )}

      {/* 一覧（検索・絞り込み・ページネーション） */}
      <section aria-labelledby="all-news">
        <h2 id="all-news" className="mb-4 text-[17px] font-extrabold text-ink">
          {ja ? "すべてのニュース" : "All news"}
        </h2>
        <NewsBrowser
          articles={articles}
          categories={categories}
          sources={sources}
          categoryLabels={categoryLabels}
          counts={counts}
          locale={loc}
          now={now}
        />
      </section>

      {/* 配信元一覧 */}
      {sources.length > 0 && (
        <section>
          <h2 className="mb-4 text-[17px] font-extrabold text-ink">{ja ? "配信元" : "Sources"}</h2>
          <div className="flex flex-wrap gap-2">
            {sources.map((s) => (
              <Link
                key={s.slug}
                href={`/${loc}/news/source/${s.slug}`}
                className="rounded-xl border border-line bg-card px-4 py-2 text-[13px] font-bold text-ink transition-colors hover:border-line-strong"
              >
                {s.name}
              </Link>
            ))}
          </div>
        </section>
      )}

      <CopyrightNotice locale={loc} />
      <RiskDisclosure locale={loc} />
    </div>
  );
}
