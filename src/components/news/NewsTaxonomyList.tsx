import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import type { Locale } from "@/types";
import type { NewsArticle } from "@/types/news";
import { getCategories, getNewsDataset } from "@/lib/news";
import { RiskDisclosure } from "@/components/RiskDisclosure";
import { NewsCard } from "./NewsCard";
import { CopyrightNotice, DataUpdatedAt, NewsErrorNotice, RssStatusBadge } from "./NewsBits";

/** カテゴリー別・配信元別・企業別の共通一覧（SEO用のインデックス可能な静的ページ）。 */
export function NewsTaxonomyList({
  locale,
  eyebrow,
  title,
  description,
  articles,
  extra,
}: {
  locale: Locale;
  eyebrow: string;
  title: string;
  description?: string;
  articles: NewsArticle[];
  extra?: React.ReactNode;
}) {
  const ja = locale === "ja";
  const dataset = getNewsDataset();
  const categories = getCategories();
  const categoryLabels = Object.fromEntries(categories.map((c) => [c.slug, ja ? c.nameJa : c.nameEn]));
  const now = Date.parse(dataset.generatedAt) || Date.now();

  return (
    <div className="space-y-8">
      <header>
        <span className="eyebrow">
          <span className="h-px w-6 bg-gold-600" aria-hidden />
          {eyebrow}
        </span>
        <div className="mt-2.5 flex flex-wrap items-center gap-3">
          <h1 className="text-[26px] font-extrabold tracking-tight text-ink sm:text-[32px]">{title}</h1>
          <RssStatusBadge dataset={dataset} locale={locale} />
        </div>
        {description && <p className="mt-3 max-w-3xl text-[14px] leading-relaxed text-muted">{description}</p>}
        <div className="mt-2 flex flex-wrap items-center gap-3">
          <DataUpdatedAt dataset={dataset} locale={locale} />
          <span className="num text-[11px] text-muted">
            {articles.length}
            {ja ? "件" : " articles"}
          </span>
        </div>
      </header>

      <NewsErrorNotice dataset={dataset} locale={locale} />
      {extra}

      {articles.length === 0 ? (
        <div className="card p-12 text-center">
          <p className="text-[14px] font-bold text-ink">{ja ? "該当するニュースがありません" : "No news found"}</p>
          <Link href={`/${locale}/news`} className="btn-outline mt-5 h-10 px-5 text-[13px]">
            <ArrowLeft size={14} /> {ja ? "ニュース一覧へ" : "All news"}
          </Link>
        </div>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {articles.map((a) => (
            <NewsCard key={a.id} article={a} locale={locale} categoryLabels={categoryLabels} now={now} />
          ))}
        </div>
      )}

      <div className="flex flex-wrap gap-2">
        <Link href={`/${locale}/news`} className="btn-outline h-10 px-5 text-[13px]">
          <ArrowLeft size={14} /> {ja ? "ニュース一覧へ戻る" : "Back to all news"}
        </Link>
      </div>

      <CopyrightNotice locale={locale} />
      <RiskDisclosure locale={locale} />
    </div>
  );
}
