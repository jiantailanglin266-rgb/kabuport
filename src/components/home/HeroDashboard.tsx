import { CheckCircle2, CircleDashed, Database, FileText, ShieldCheck } from "lucide-react";
import type { Locale } from "@/types";
import type { DatasetMeta } from "@/types/market";
import { FRESHNESS_LABEL } from "@/types/market";
import { pick } from "@/lib/i18n";
import { formatDateTimeJst, formatNumber } from "@/lib/format";

/**
 * ヒーロー右側のパネル。
 * 架空の株価・指数値は一切表示しない。データ元の接続状況と、そのデータの性質
 * （提供元・遅延・基準日）を可視化する。チャートは数値ラベルを持たない装飾。
 */
export function HeroDashboard({
  meta,
  counts,
  locale,
}: {
  meta: DatasetMeta;
  counts: { stocks: number; disclosures: number };
  locale: Locale;
}) {
  const ja = locale === "ja";
  const freshness = FRESHNESS_LABEL[meta.freshness] ?? FRESHNESS_LABEL.unknown;

  const sources = [
    {
      name: "J-Quants API",
      role: ja ? "銘柄マスタ・日足株価・財務・決算" : "Listings, daily prices, financials",
      connected: !meta.isFallback,
      note: ja ? "無料プランは12週間遅延" : "Free plan: 12-week delay",
      icon: Database,
    },
    {
      name: "EDINET API v2",
      role: ja ? "有価証券報告書・大量保有報告書ほか" : "Securities reports, large shareholding reports",
      connected: counts.disclosures > 0,
      note: ja ? "メタデータと公式閲覧URLのみ" : "Metadata and official links only",
      icon: FileText,
    },
    {
      name: ja ? "各社IR・JPX公式" : "Company IR / JPX",
      role: ja ? "公式開示・企業ページへのリンク" : "Links to official disclosures",
      connected: true,
      note: ja ? "リンクのみ（転載しない）" : "Links only, no reproduction",
      icon: ShieldCheck,
    },
  ];

  return (
    <div className="overflow-hidden rounded-3xl border border-white/12 bg-navy-700/70 shadow-[0_30px_80px_-30px_rgba(0,0,0,.7)] backdrop-blur-sm">
      {/* ヘッダー */}
      <div className="flex items-center gap-3 border-b border-white/10 bg-white/[0.03] px-5 py-3">
        <span className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-gold">
          <span className="h-1.5 w-1.5 animate-pulse-dot rounded-full bg-gold" aria-hidden />
          {ja ? "データ接続状況" : "Data status"}
        </span>
        <span className="ml-auto rounded-md border border-white/15 px-2 py-0.5 text-[9px] font-bold uppercase tracking-widest text-white/50">
          {pick(locale, freshness.ja, freshness.en)}
        </span>
      </div>

      {/* 装飾チャート（数値ラベルを持たない＝データとして提示しない） */}
      <div className="relative h-28 border-b border-white/8 px-5 py-4">
        <div className="absolute inset-0 bg-grid opacity-40" aria-hidden />
        <svg className="relative h-full w-full" viewBox="0 0 560 80" preserveAspectRatio="none" aria-hidden>
          <defs>
            <linearGradient id="heroDeco" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#1E88E5" stopOpacity="0.35" />
              <stop offset="100%" stopColor="#1E88E5" stopOpacity="0" />
            </linearGradient>
          </defs>
          <path d="M0 62 L70 52 L140 58 L210 38 L280 46 L350 26 L420 34 L490 16 L560 24 L560 80 L0 80 Z" fill="url(#heroDeco)" />
          <path
            d="M0 62 L70 52 L140 58 L210 38 L280 46 L350 26 L420 34 L490 16 L560 24"
            fill="none"
            stroke="#4BA3EC"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeDasharray="1200"
            className="animate-draw-line"
          />
        </svg>
        <span className="absolute bottom-3 right-5 rounded bg-navy-900/70 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-widest text-white/45">
          {ja ? "イメージ（実データではありません）" : "Illustrative only"}
        </span>
      </div>

      {/* データ元の接続状況 */}
      <ul className="divide-y divide-white/8">
        {sources.map((s) => (
          <li key={s.name} className="flex items-start gap-3 px-5 py-3.5">
            <s.icon size={15} className="mt-0.5 shrink-0 text-white/35" aria-hidden />
            <div className="min-w-0 flex-1">
              <div className="text-[12.5px] font-bold text-white">{s.name}</div>
              <div className="truncate text-[10.5px] text-white/45">{s.role}</div>
            </div>
            <div className="shrink-0 text-right">
              <span
                className={`inline-flex items-center gap-1 text-[10.5px] font-bold ${
                  s.connected ? "text-success" : "text-white/40"
                }`}
              >
                {s.connected ? <CheckCircle2 size={12} aria-hidden /> : <CircleDashed size={12} aria-hidden />}
                {s.connected ? (ja ? "接続済" : "Connected") : ja ? "未接続" : "Pending"}
              </span>
              <div className="text-[9.5px] text-white/35">{s.note}</div>
            </div>
          </li>
        ))}
      </ul>

      {/* フッター */}
      <div className="grid grid-cols-2 gap-px border-t border-white/10 bg-white/8">
        <div className="bg-navy-700 px-5 py-3.5">
          <div className="text-[10px] font-semibold text-white/45">{ja ? "銘柄マスタ" : "Listed stocks"}</div>
          <div className="num mt-0.5 text-[17px] font-extrabold text-white">
            {counts.stocks > 0 ? formatNumber(counts.stocks) : "—"}
          </div>
        </div>
        <div className="bg-navy-700 px-5 py-3.5">
          <div className="text-[10px] font-semibold text-white/45">{ja ? "最終更新" : "Last update"}</div>
          <div className="num mt-0.5 text-[12px] font-bold text-white">
            {meta.generatedAt ? formatDateTimeJst(meta.generatedAt, locale) : "—"}
          </div>
        </div>
      </div>
    </div>
  );
}
