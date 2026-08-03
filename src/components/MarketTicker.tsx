import Link from "next/link";
import { Database, ExternalLink } from "lucide-react";
import type { Locale } from "@/types";
import type { DatasetMeta } from "@/types/market";
import { FRESHNESS_LABEL } from "@/types/market";
import { pick } from "@/lib/i18n";
import { formatDateTimeJst, formatNumber } from "@/lib/format";

/**
 * ヘッダー上部の帯。
 * 架空の指数値は表示しない。実データ接続後はデータ基準日・遅延・更新時刻を出し、
 * 未接続時は「データ準備中」と公式サイト導線のみを表示する。
 */
export function MarketTicker({
  meta,
  breadth,
  locale,
}: {
  meta: DatasetMeta;
  breadth: { advancing: number; declining: number; unchanged: number } | null;
  locale: Locale;
}) {
  const ja = locale === "ja";
  const freshness = FRESHNESS_LABEL[meta.freshness] ?? FRESHNESS_LABEL.unknown;

  return (
    <div className="hidden border-b border-white/10 bg-navy text-white md:block">
      <div className="shell flex h-9 items-center gap-4 text-[11.5px]">
        {meta.isFallback ? (
          <>
            <span className="flex shrink-0 items-center gap-1.5 font-bold uppercase tracking-widest text-gold">
              <span className="h-1.5 w-1.5 rounded-full bg-gold" aria-hidden />
              {ja ? "データ準備中" : "Data pending"}
            </span>
            <span className="truncate text-white/55">
              {ja
                ? "株価・指数の実データは未接続です。数値は公式サイトでご確認ください。"
                : "Price and index data is not connected yet. Please check official sites."}
            </span>
            <Link
              href={`/${locale}/data`}
              className="ml-auto hidden shrink-0 items-center gap-1 font-bold text-white/70 transition-colors hover:text-white lg:inline-flex"
            >
              <ExternalLink size={11} aria-hidden />
              {ja ? "データについて" : "About data"}
            </Link>
          </>
        ) : (
          <>
            <span className="flex shrink-0 items-center gap-1.5 font-bold uppercase tracking-widest text-gold">
              <Database size={12} aria-hidden />
              {pick(locale, freshness.ja, freshness.en)}
            </span>
            {breadth && (
              <span className="num flex shrink-0 items-center gap-3 text-white/70">
                <span>
                  <span className="text-up" aria-hidden>▲</span> {ja ? "値上がり" : "Up"} {formatNumber(breadth.advancing)}
                </span>
                <span>
                  <span className="text-down" aria-hidden>▼</span> {ja ? "値下がり" : "Down"} {formatNumber(breadth.declining)}
                </span>
              </span>
            )}
            <span className="num ml-auto hidden shrink-0 text-white/45 lg:block">
              {meta.marketDataDate && `${ja ? "基準日" : "As of"} ${meta.marketDataDate} ・ `}
              {ja ? "更新" : "Updated"} {formatDateTimeJst(meta.generatedAt, locale)} ・ {meta.sourceName}
            </span>
          </>
        )}
      </div>
    </div>
  );
}
