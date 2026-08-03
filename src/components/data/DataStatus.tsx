import Link from "next/link";
import { AlertTriangle, Clock, Database, RefreshCw } from "lucide-react";
import type { Locale } from "@/types";
import type { DatasetMeta } from "@/types/market";
import { FRESHNESS_LABEL } from "@/types/market";
import { pick } from "@/lib/i18n";
import { formatDateTimeJst } from "@/lib/format";

/** 遅延バッジ。リアルタイム契約が無い限り「リアルタイム」とは表示しない。 */
export function FreshnessBadge({ meta, locale }: { meta: DatasetMeta; locale: Locale }) {
  const label = FRESHNESS_LABEL[meta.freshness] ?? FRESHNESS_LABEL.unknown;
  return (
    <span className="inline-flex items-center gap-1 rounded-lg border border-line bg-surface px-2 py-0.5 text-[11px] font-bold text-muted">
      <Clock size={11} aria-hidden />
      {pick(locale, label.ja, label.en)}
    </span>
  );
}

/** データ元・基準日・取得日時をまとめて出す行。数値の近くに必ず添える。 */
export function DataProvenanceLine({ meta, locale }: { meta: DatasetMeta; locale: Locale }) {
  const ja = locale === "ja";
  return (
    <p className="num flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-muted">
      <span className="inline-flex items-center gap-1">
        <Database size={11} aria-hidden />
        {ja ? "提供" : "Source"}: {meta.sourceName}
      </span>
      {meta.marketDataDate && (
        <span>
          {ja ? "基準日" : "As of"}: {meta.marketDataDate}
        </span>
      )}
      {meta.generatedAt && (
        <span className="inline-flex items-center gap-1">
          <RefreshCw size={11} aria-hidden />
          {ja ? "更新" : "Updated"}: {formatDateTimeJst(meta.generatedAt, locale)}
        </span>
      )}
    </p>
  );
}

/**
 * サイト全体のデータ接続状況バナー。
 * 実データ未接続、または前回成功データ表示中であることを利用者へ明示する。
 */
export function DataStatusBanner({
  meta,
  locale,
  usingSampleContent,
}: {
  meta: DatasetMeta;
  locale: Locale;
  usingSampleContent: boolean;
}) {
  const ja = locale === "ja";
  if (!meta.isFallback && !usingSampleContent) return null;

  return (
    <div className="border-b border-gold/30 bg-gold/10">
      <div className="shell flex items-start gap-3 py-3">
        <AlertTriangle size={16} className="mt-0.5 shrink-0 text-gold-600" aria-hidden />
        <div className="text-[12px] leading-relaxed text-ink-2">
          <b className="text-ink">
            {ja ? "現在このサイトはデータ接続準備中です。" : "Market data is not connected yet."}
          </b>{" "}
          {ja
            ? "株価・指数の実データは接続されていません。銘柄ページ等に表示している数値は開発用のサンプルであり、実際の市場価格ではありません。実データ接続後は「12週間遅延」等のデータ基準を明示して表示します。"
            : "Real price and index data is not connected. Figures on stock pages are development samples, not actual market prices."}{" "}
          <Link href={`/${locale}/data`} className="font-bold text-gold-600 underline hover:text-ink">
            {ja ? "データの取り扱いについて" : "About our data"}
          </Link>
        </div>
      </div>
    </div>
  );
}
