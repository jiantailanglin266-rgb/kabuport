import Link from "next/link";
import { AlertTriangle, ExternalLink, Radio, Rss, Star } from "lucide-react";
import { clsx } from "clsx";
import type { Locale } from "@/types";
import type { NewsArticle, NewsDataset } from "@/types/news";
import { formatDateTimeJst } from "@/lib/format";

/** カテゴリーごとの配色（プレースホルダー兼識別色）。外部画像は使わない。 */
export const CATEGORY_STYLE: Record<string, string> = {
  earnings: "from-navy-700 to-primary/60",
  guidance: "from-navy-800 to-primary/50",
  dividend: "from-navy-700 to-gold-600/60",
  benefits: "from-navy-600 to-gold/45",
  buyback: "from-navy-800 to-navy-500",
  split: "from-navy-700 to-navy-400",
  tob: "from-navy-900 to-navy-600",
  ma: "from-navy-800 to-primary/45",
  ipo: "from-navy-700 to-primary/55",
  market: "from-navy-600 to-primary/50",
  stocks: "from-navy-700 to-navy-500",
  forex: "from-navy-800 to-gold-600/45",
  rates: "from-navy-700 to-navy-600",
  boj: "from-navy-900 to-navy-700",
  economy: "from-navy-700 to-navy-500",
  indicators: "from-navy-800 to-navy-600",
  us_equity: "from-navy-700 to-primary/40",
  global: "from-navy-800 to-primary/35",
  etf: "from-navy-700 to-navy-500",
  reit: "from-navy-600 to-gold-600/40",
  fund: "from-navy-700 to-navy-500",
  default: "from-navy-700 to-navy-500",
};

export function NewsCategoryBadge({
  slug,
  label,
  locale,
  asLink = true,
}: {
  slug: string;
  label: string;
  locale: Locale;
  asLink?: boolean;
}) {
  const cls =
    "inline-flex items-center rounded-lg border border-primary/25 bg-primary/10 px-2 py-0.5 text-[11px] font-bold text-primary";
  if (!asLink) return <span className={cls}>{label}</span>;
  return (
    <Link href={`/${locale}/news/category/${slug}`} className={clsx(cls, "transition-colors hover:border-primary/50")}>
      {label}
    </Link>
  );
}

export function NewsSourceBadge({ name, slug, locale }: { name: string; slug: string; locale: Locale }) {
  return (
    <Link
      href={`/${locale}/news/source/${slug}`}
      className="inline-flex items-center gap-1.5 text-[11.5px] font-semibold text-muted transition-colors hover:text-ink"
    >
      <span className="grid h-4 w-4 place-items-center rounded bg-line/70 text-[8px] font-extrabold text-ink-2" aria-hidden>
        {name.slice(0, 1)}
      </span>
      {name}
    </Link>
  );
}

export function BreakingLabel({ locale }: { locale: Locale }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-lg border border-gold/40 bg-gold/12 px-2 py-0.5 text-[10.5px] font-bold text-gold-600">
      <Radio size={10} aria-hidden />
      {locale === "ja" ? "速報" : "Breaking"}
    </span>
  );
}

export function FeaturedLabel({ locale }: { locale: Locale }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-lg border border-line-strong bg-surface px-2 py-0.5 text-[10.5px] font-bold text-ink-2">
      <Star size={10} aria-hidden />
      {locale === "ja" ? "重要" : "Key"}
    </span>
  );
}

export function NewLabel({ locale }: { locale: Locale }) {
  return (
    <span className="rounded-lg bg-primary/12 px-2 py-0.5 text-[10.5px] font-bold text-primary">
      {locale === "ja" ? "新着" : "New"}
    </span>
  );
}

/** RSS取得状態のバッジ（デモ／一部失敗／正常）。 */
export function RssStatusBadge({ dataset, locale }: { dataset: NewsDataset; locale: Locale }) {
  const ja = locale === "ja";
  const map: Record<string, { label: string; cls: string }> = {
    demo: { label: ja ? "デモデータ" : "Demo data", cls: "border-gold/40 bg-gold/12 text-gold-600" },
    ok: { label: ja ? "取得正常" : "Feeds OK", cls: "border-success/30 bg-success/10 text-success" },
    partial: { label: ja ? "一部取得失敗" : "Partial failure", cls: "border-gold/40 bg-gold/12 text-gold-600" },
    error: { label: ja ? "取得失敗" : "Fetch failed", cls: "border-danger/30 bg-danger/10 text-danger" },
  };
  const s = map[dataset.status] ?? map.demo!;
  return (
    <span className={clsx("inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-[11px] font-bold", s.cls)}>
      <Rss size={11} aria-hidden />
      {s.label}
    </span>
  );
}

/** 取得エラー時のお知らせ（ページ全体はエラーにしない）。 */
export function NewsErrorNotice({ dataset, locale }: { dataset: NewsDataset; locale: Locale }) {
  if (!dataset.message) return null;
  return (
    <div className="flex items-start gap-3 rounded-2xl border border-gold/30 bg-gold/8 p-4">
      <AlertTriangle size={16} className="mt-0.5 shrink-0 text-gold-600" aria-hidden />
      <p className="text-[12.5px] leading-relaxed text-ink-2">{dataset.message}</p>
    </div>
  );
}

/** 元記事へのボタン。配信元が信頼できない場合に nofollow を個別指定できる。 */
export function ExternalArticleButton({
  article,
  locale,
  nofollow = false,
  className,
}: {
  article: NewsArticle;
  locale: Locale;
  nofollow?: boolean;
  className?: string;
}) {
  return (
    <a
      href={article.originalUrl}
      target="_blank"
      rel={nofollow ? "noopener noreferrer nofollow" : "noopener noreferrer"}
      className={clsx("btn-navy", className)}
    >
      {locale === "ja" ? "配信元サイトで記事全文を読む" : "Read the full article at the source"}
      <ExternalLink size={15} aria-hidden />
    </a>
  );
}

/** 出典・著作権の注記（詳細ページ・一覧ページ共通）。 */
export function CopyrightNotice({ locale }: { locale: Locale }) {
  const ja = locale === "ja";
  return (
    <p className="rounded-2xl border border-line bg-card p-4 text-[11.5px] leading-relaxed text-muted">
      {ja
        ? "本ページはRSS等で提供された情報をもとに、記事の概要と配信元へのリンクを掲載しています。記事の著作権は各配信元に帰属します。詳細は配信元サイトでご確認ください。当サイトが元記事の発行者ではありません。"
        : "This page shows summaries provided via RSS together with links to the original publisher. Copyright belongs to each publisher; this site is not the publisher of the original articles."}
    </p>
  );
}

export function DataUpdatedAt({ dataset, locale }: { dataset: NewsDataset; locale: Locale }) {
  const ja = locale === "ja";
  return (
    <span className="num text-[11px] text-muted">
      {ja ? "最終更新" : "Updated"}: {formatDateTimeJst(dataset.generatedAt, locale)}
    </span>
  );
}
