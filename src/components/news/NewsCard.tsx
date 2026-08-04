import Link from "next/link";
import { ExternalLink } from "lucide-react";
import { clsx } from "clsx";
import type { Locale } from "@/types";
import type { NewsArticle } from "@/types/news";
import { formatDateTimeJst } from "@/lib/format";
import {
  BreakingLabel, CATEGORY_STYLE, FeaturedLabel, NewLabel, NewsCategoryBadge, NewsSourceBadge,
} from "./NewsBits";

const NEW_WINDOW_HOURS = 12;

function isNew(publishedAt: string, now: number) {
  const t = Date.parse(publishedAt);
  return Number.isFinite(t) && now - t <= NEW_WINDOW_HOURS * 3600_000;
}

/**
 * ニュースカード。
 * サムネイルは、利用条件が確認できた画像がある場合のみ表示し、
 * 無い場合はカテゴリー別のプレースホルダーでレイアウトを保つ。
 */
export function NewsCard({
  article,
  locale,
  categoryLabels,
  now,
  compact = false,
}: {
  article: NewsArticle;
  locale: Locale;
  categoryLabels: Record<string, string>;
  now: number;
  compact?: boolean;
}) {
  const ja = locale === "ja";
  const primary = article.categories[0];
  const grad = CATEGORY_STYLE[primary?.slug ?? "default"] ?? CATEGORY_STYLE.default;
  const href = `/${locale}/news/${article.slug}`;

  if (compact) {
    return (
      <article className="flex gap-3 border-b border-line py-3.5 last:border-0">
        <span className={clsx("relative hidden h-14 w-20 shrink-0 overflow-hidden rounded-lg bg-gradient-to-br sm:block", grad)} aria-hidden>
          <span className="absolute inset-0 bg-grid opacity-40" />
        </span>
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-1.5">
            {primary && (
              <NewsCategoryBadge slug={primary.slug} label={categoryLabels[primary.slug] ?? primary.slug} locale={locale} asLink={false} />
            )}
            {article.isBreaking && <BreakingLabel locale={locale} />}
          </div>
          <h3 className="mt-1.5 line-clamp-2 text-[13.5px] font-bold leading-snug text-ink">
            <Link href={href} className="hover:text-primary">
              {article.title}
            </Link>
          </h3>
          <div className="num mt-1 flex items-center gap-2 text-[10.5px] text-muted">
            <span>{formatDateTimeJst(article.publishedAt, locale)}</span>
            <span className="h-2.5 w-px bg-line" aria-hidden />
            <span className="truncate">{article.sourceName}</span>
          </div>
        </div>
      </article>
    );
  }

  return (
    <article className="card card-hover flex h-full flex-col overflow-hidden">
      {/* サムネイル（画像が無い場合はカテゴリー配色で代替） */}
      <Link href={href} className={clsx("relative block h-32 shrink-0 overflow-hidden bg-gradient-to-br", grad)}>
        <span className="absolute inset-0 bg-grid opacity-45" aria-hidden />
        {article.imageUrl && (
          // 利用条件が確認できた配信元の画像のみ到達する
          // eslint-disable-next-line @next/next/no-img-element
          <img src={article.imageUrl} alt="" loading="lazy" decoding="async" className="h-full w-full object-cover opacity-90" />
        )}
        <span className="absolute left-3 top-3 flex flex-wrap items-center gap-1.5">
          {primary && (
            <span className="rounded-lg bg-white/15 px-2 py-0.5 text-[10.5px] font-bold text-white backdrop-blur-sm">
              {categoryLabels[primary.slug] ?? primary.slug}
            </span>
          )}
        </span>
        <span className="absolute bottom-3 left-3 flex flex-wrap items-center gap-1.5">
          {article.isBreaking && <BreakingLabel locale={locale} />}
          {article.isFeatured && <FeaturedLabel locale={locale} />}
          {isNew(article.publishedAt, now) && !article.isBreaking && <NewLabel locale={locale} />}
        </span>
      </Link>

      <div className="flex flex-1 flex-col p-5">
        <div className="num text-[11px] text-muted">{formatDateTimeJst(article.publishedAt, locale)}</div>
        <h3 className="mt-1.5 line-clamp-3 text-[15px] font-bold leading-snug text-ink">
          <Link href={href} className="hover:text-primary">
            {article.title}
          </Link>
        </h3>
        {article.summary && <p className="mt-2 line-clamp-2 text-[12.5px] leading-relaxed text-muted">{article.summary}</p>}

        {article.companies.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-1.5">
            {article.companies.slice(0, 3).map((c) => (
              <Link
                key={c.code}
                href={`/${locale}/news/company/${c.code}`}
                className="num inline-flex items-center gap-1 rounded-lg border border-line bg-bg px-2 py-0.5 text-[10.5px] font-bold text-ink-2 transition-colors hover:border-line-strong"
              >
                {c.name ?? c.code}
                <span className="text-muted">{c.code}</span>
              </Link>
            ))}
          </div>
        )}

        <div className="mt-auto flex items-center justify-between gap-2 pt-4 rule-top">
          <NewsSourceBadge name={article.sourceName} slug={article.sourceSlug} locale={locale} />
          <a
            href={article.originalUrl}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={ja ? `${article.title} を配信元で読む` : `Read at source`}
            className="inline-flex items-center gap-1 text-[11px] font-bold text-primary hover:underline"
          >
            {ja ? "配信元" : "Source"} <ExternalLink size={11} aria-hidden />
          </a>
        </div>
      </div>
    </article>
  );
}
